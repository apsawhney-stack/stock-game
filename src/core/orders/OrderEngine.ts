/**
 * OrderEngine
 * 
 * Handles order submission, validation, and execution.
 */

import type {
    Order,
    OrderRequest,
    OrderSubmitResult,
    OrderValidationResult,
    ExecutionReport,
    ExecutedTrade,
    OrderFill,
    PortfolioState,
} from '../types';
import { generateOrderId } from '../types';
import { roundPrice } from '../utils';
import { getSharesForTicker } from '../portfolio/LotTracker';

/**
 * OrderEngine interface
 */
export interface IOrderEngine {
    // Commands
    submitOrder(order: OrderRequest, currentTurn: number): OrderSubmitResult;
    cancelOrder(orderId: string): boolean;
    processEndOfTurn(
        prices: Record<string, number>,
        portfolio: PortfolioState,
        currentTurn: number,
        fee: number
    ): ExecutionReport;

    // Queries
    getPendingOrders(): readonly Order[];
    getOrderHistory(): readonly Order[];
    getOrder(orderId: string): Order | undefined;

    // Validation
    validateOrder(order: OrderRequest, portfolio: PortfolioState, prices: Record<string, number>): OrderValidationResult;
}

/**
 * OrderEngine implementation
 */
export class OrderEngine implements IOrderEngine {
    private pendingOrders: Map<string, Order> = new Map();
    private orderHistory: Order[] = [];
    private readonly defaultExpirationTurns: number;

    constructor(options: { defaultExpirationTurns?: number } = {}) {
        this.defaultExpirationTurns = options.defaultExpirationTurns ?? 2;
    }

    // === Commands ===

    submitOrder(request: OrderRequest, currentTurn: number): OrderSubmitResult {
        const id = generateOrderId();
        const expiresAt = currentTurn + (request.expiresInTurns ?? this.defaultExpirationTurns);

        const order: Order = {
            id,
            type: request.type,
            side: request.side,
            ticker: request.ticker,
            quantity: request.quantity,
            filledQuantity: 0,
            limitPrice: request.limitPrice,
            stopPrice: request.stopPrice,
            status: 'pending',
            placedAt: currentTurn,
            expiresAt,
        };

        this.pendingOrders.set(id, order);

        return {
            success: true,
            order,
        };
    }

    cancelOrder(orderId: string): boolean {
        const order = this.pendingOrders.get(orderId);
        if (!order) return false;

        const cancelled: Order = {
            ...order,
            status: 'cancelled',
        };

        this.pendingOrders.delete(orderId);
        this.orderHistory.push(cancelled);

        return true;
    }

    processEndOfTurn(
        prices: Record<string, number>,
        portfolio: PortfolioState,
        currentTurn: number,
        fee: number = 1
    ): ExecutionReport {
        const fills: OrderFill[] = [];
        const expired: Order[] = [];
        const trades: ExecutedTrade[] = [];
        const stillPending: Order[] = [];

        for (const order of this.pendingOrders.values()) {
            // Check expiration
            if (currentTurn >= order.expiresAt) {
                const expiredOrder: Order = { ...order, status: 'expired' };
                expired.push(expiredOrder);
                this.orderHistory.push(expiredOrder);
                continue;
            }

            const price = prices[order.ticker];
            if (price === undefined) {
                // Unknown ticker, keep pending
                stillPending.push(order);
                continue;
            }

            // Check if order can execute
            const canExecute = this.canExecute(order, price, portfolio);

            if (canExecute) {
                // Execute the order
                const fillPrice = this.getFillPrice(order, price);

                const fill: OrderFill = {
                    order,
                    price: fillPrice,
                    quantity: order.quantity,
                };
                fills.push(fill);

                const trade: ExecutedTrade = {
                    orderId: order.id,
                    ticker: order.ticker,
                    side: order.side,
                    shares: order.quantity,
                    price: fillPrice,
                    totalValue: roundPrice(order.quantity * fillPrice),
                    fee,
                    executedAt: currentTurn,
                    realizedPnL: order.side === 'sell' ? undefined : undefined, // Calculated by PortfolioManager
                };
                trades.push(trade);

                const filledOrder: Order = {
                    ...order,
                    status: 'filled',
                    filledQuantity: order.quantity,
                    fillPrice,
                    filledAt: currentTurn,
                };
                this.orderHistory.push(filledOrder);
            } else {
                // Keep pending
                stillPending.push(order);
            }
        }

        // Update pending orders
        this.pendingOrders.clear();
        for (const order of stillPending) {
            this.pendingOrders.set(order.id, order);
        }

        return {
            turn: currentTurn,
            fills,
            expired,
            pending: stillPending,
            trades,
        };
    }

    // === Queries ===

    getPendingOrders(): readonly Order[] {
        return Array.from(this.pendingOrders.values());
    }

    getOrderHistory(): readonly Order[] {
        return [...this.orderHistory];
    }

    getOrder(orderId: string): Order | undefined {
        return this.pendingOrders.get(orderId) ??
            this.orderHistory.find(o => o.id === orderId);
    }

    // === Validation ===

    validateOrder(
        order: OrderRequest,
        portfolio: PortfolioState,
        prices: Record<string, number>
    ): OrderValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check quantity
        if (order.quantity <= 0) {
            errors.push('Quantity must be positive');
        }

        // Check ticker exists (if we have prices)
        if (Object.keys(prices).length > 0 && prices[order.ticker] === undefined) {
            errors.push(`Unknown ticker: ${order.ticker}`);
        }

        if (order.side === 'buy') {
            // Check sufficient cash
            const price = prices[order.ticker] ?? order.limitPrice ?? 0;
            const estimatedCost = order.quantity * price + 1; // +1 fee

            if (estimatedCost > portfolio.cash) {
                errors.push(`Insufficient cash. Need $${estimatedCost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`);
            }
        } else {
            // Check sufficient shares
            const shares = getSharesForTicker(portfolio.lots, order.ticker);
            if (order.quantity > shares) {
                errors.push(`Insufficient shares. Want to sell ${order.quantity}, have ${shares}`);
            }
        }

        // Check limit price for limit orders
        if (order.type === 'limit' && order.limitPrice === undefined) {
            errors.push('Limit orders require a limit price');
        }

        // Check stop price for stop orders
        if ((order.type === 'stop' || order.type === 'stop_limit') && order.stopPrice === undefined) {
            errors.push('Stop orders require a stop price');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    // === Private Methods ===

    private canExecute(order: Order, currentPrice: number, portfolio: PortfolioState): boolean {
        // Check if we have resources
        if (order.side === 'buy') {
            const cost = order.quantity * currentPrice + 1;
            if (cost > portfolio.cash) return false;
        } else {
            const shares = getSharesForTicker(portfolio.lots, order.ticker);
            if (order.quantity > shares) return false;
        }

        // Check order type conditions
        switch (order.type) {
            case 'market':
                return true;

            case 'limit':
                if (order.limitPrice === undefined) return false;
                if (order.side === 'buy') {
                    return currentPrice <= order.limitPrice;
                } else {
                    return currentPrice >= order.limitPrice;
                }

            case 'stop':
                if (order.stopPrice === undefined) return false;
                if (order.side === 'buy') {
                    return currentPrice >= order.stopPrice;
                } else {
                    return currentPrice <= order.stopPrice;
                }

            case 'stop_limit':
                // Simplified: treat as stop for now
                if (order.stopPrice === undefined) return false;
                if (order.side === 'buy') {
                    return currentPrice >= order.stopPrice;
                } else {
                    return currentPrice <= order.stopPrice;
                }

            default:
                return false;
        }
    }

    private getFillPrice(order: Order, currentPrice: number): number {
        // For limit orders, fill at the better price
        if (order.type === 'limit' && order.limitPrice !== undefined) {
            if (order.side === 'buy') {
                return Math.min(currentPrice, order.limitPrice);
            } else {
                return Math.max(currentPrice, order.limitPrice);
            }
        }

        return currentPrice;
    }

    // === State Export ===

    clear(): void {
        this.pendingOrders.clear();
        this.orderHistory = [];
    }
}

/**
 * Create a new OrderEngine
 */
export function createOrderEngine(options?: { defaultExpirationTurns?: number }): OrderEngine {
    return new OrderEngine(options);
}
