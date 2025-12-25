/**
 * Order Types
 * Defines order types, statuses, and execution results.
 */

/** Supported order types */
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

/** Order side (direction) */
export type OrderSide = 'buy' | 'sell';

/** Order status */
export type OrderStatus = 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';

/**
 * Order request from user
 * Validated before becoming an Order
 */
export interface OrderRequest {
    /** Type of order */
    readonly type: OrderType;

    /** Buy or sell */
    readonly side: OrderSide;

    /** Ticker symbol */
    readonly ticker: string;

    /** Number of shares */
    readonly quantity: number;

    /** Limit price (required for limit orders) */
    readonly limitPrice?: number;

    /** Stop price (required for stop orders) */
    readonly stopPrice?: number;

    /** Number of turns before order expires (default: 2) */
    readonly expiresInTurns?: number;
}

/**
 * Validated order with unique ID
 */
export interface Order {
    /** Unique order ID */
    readonly id: string;

    /** Type of order */
    readonly type: OrderType;

    /** Buy or sell */
    readonly side: OrderSide;

    /** Ticker symbol */
    readonly ticker: string;

    /** Number of shares requested */
    readonly quantity: number;

    /** Number of shares filled so far */
    readonly filledQuantity: number;

    /** Limit price (if applicable) */
    readonly limitPrice?: number;

    /** Stop price (if applicable) */
    readonly stopPrice?: number;

    /** Current status */
    readonly status: OrderStatus;

    /** Turn when order was placed */
    readonly placedAt: number;

    /** Turn when order expires */
    readonly expiresAt: number;

    /** Average fill price (if filled) */
    readonly fillPrice?: number;

    /** Turn when filled (if filled) */
    readonly filledAt?: number;
}

/**
 * Result of submitting an order
 */
export interface OrderSubmitResult {
    /** Whether submission was successful */
    readonly success: boolean;

    /** The created order (if successful) */
    readonly order?: Order;

    /** Error message (if failed) */
    readonly error?: string;

    /** Validation errors */
    readonly validationErrors?: string[];
}

/**
 * Executed trade (after order fills)
 */
export interface ExecutedTrade {
    /** Order that was filled */
    readonly orderId: string;

    /** Ticker symbol */
    readonly ticker: string;

    /** Buy or sell */
    readonly side: OrderSide;

    /** Number of shares traded */
    readonly shares: number;

    /** Price per share */
    readonly price: number;

    /** Total value of trade */
    readonly totalValue: number;

    /** Transaction fee */
    readonly fee: number;

    /** Realized P&L (for sells only) */
    readonly realizedPnL?: number;

    /** Turn when trade executed */
    readonly executedAt: number;
}

/**
 * Order validation result
 */
export interface OrderValidationResult {
    /** Whether order is valid */
    readonly valid: boolean;

    /** Validation error messages */
    readonly errors: string[];

    /** Warning messages (order still valid) */
    readonly warnings: string[];
}

/**
 * End-of-turn order execution report
 */
export interface ExecutionReport {
    /** Turn number */
    readonly turn: number;

    /** Orders that were filled */
    readonly fills: readonly OrderFill[];

    /** Orders that expired */
    readonly expired: readonly Order[];

    /** Orders still pending */
    readonly pending: readonly Order[];

    /** Trades resulting from fills */
    readonly trades: readonly ExecutedTrade[];
}

/**
 * Single order fill
 */
export interface OrderFill {
    /** The order that was filled */
    readonly order: Order;

    /** Fill price */
    readonly price: number;

    /** Quantity filled in this fill */
    readonly quantity: number;
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
