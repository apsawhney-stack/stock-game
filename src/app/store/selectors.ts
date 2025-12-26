/**
 * Memoized Selectors
 * Derived state computed from the store
 */

import type { GameState } from './types';
import type { Holding } from '../../core/types';

/**
 * Calculate total portfolio value (cash + holdings at current prices)
 */
export function selectTotalValue(state: GameState): number {
    const holdingsValue = selectHoldingsValue(state);
    return state.portfolio.cash + holdingsValue;
}

/**
 * Calculate total holdings value at current market prices
 */
export function selectHoldingsValue(state: GameState): number {
    const holdings = selectHoldings(state);
    return holdings.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
}

/**
 * Calculate unrealized P&L
 */
export function selectUnrealizedPnL(state: GameState): number {
    const holdings = selectHoldings(state);
    return holdings.reduce((sum, h) => sum + (h.unrealizedPnL ?? 0), 0);
}

/**
 * Calculate total P&L (realized + unrealized)
 */
export function selectTotalPnL(state: GameState): number {
    return state.portfolio.realizedPnL + selectUnrealizedPnL(state);
}

/**
 * Get aggregated holdings with current market values
 */
export function selectHoldings(state: GameState): Holding[] {
    const lots = state.portfolio.lots;
    const prices = state.market.prices;

    // Group lots by ticker
    const grouped = lots.reduce<Record<string, { shares: number; totalCost: number }>>((acc, lot) => {
        if (!acc[lot.ticker]) {
            acc[lot.ticker] = { shares: 0, totalCost: 0 };
        }
        acc[lot.ticker].shares += lot.shares;
        acc[lot.ticker].totalCost += lot.shares * lot.costBasis;
        return acc;
    }, {});

    // Convert to Holding array with market values
    return Object.entries(grouped).map(([ticker, data]) => {
        const currentPrice = prices[ticker] ?? 0;
        const marketValue = data.shares * currentPrice;
        const avgCost = data.shares > 0 ? data.totalCost / data.shares : 0;
        const unrealizedPnL = marketValue - data.totalCost;
        const percentChange = data.totalCost > 0 ? (unrealizedPnL / data.totalCost) * 100 : 0;

        return {
            ticker,
            shares: data.shares,
            avgCost,
            marketValue,
            unrealizedPnL,
            percentChange,
        };
    });
}

/**
 * Get return percentage vs starting cash
 */
export function selectReturnPercent(state: GameState): number {
    const totalValue = selectTotalValue(state);
    const startingCash = state.session.startingCash;
    if (startingCash === 0) return 0;
    return ((totalValue - startingCash) / startingCash) * 100;
}

/**
 * Check if mission goal is met
 */
export function selectIsMissionGoalMet(state: GameState): boolean {
    const returnPercent = selectReturnPercent(state) / 100; // Convert to decimal
    return returnPercent >= state.session.targetReturn;
}

/**
 * Get current screen from UI state
 */
export function selectCurrentScreen(state: GameState) {
    return state.ui.currentScreen;
}

/**
 * Get active notifications
 */
export function selectNotifications(state: GameState) {
    return state.ui.notifications;
}

/**
 * Get game phase
 */
export function selectGamePhase(state: GameState) {
    return state.session.phase;
}

/**
 * Get current and max turns
 */
export function selectTurnInfo(state: GameState) {
    return {
        current: state.session.turn,
        max: state.session.maxTurns,
        remaining: state.session.maxTurns - state.session.turn,
    };
}

/**
 * Get available cash (actual cash minus pending buy orders)
 */
export function selectAvailableCash(state: GameState): number {
    const prices = state.market.prices;
    const pendingBuyValue = state.pendingOrders
        .filter(order => order.side === 'buy')
        .reduce((sum, order) => {
            const price = prices[order.ticker] ?? 0;
            return sum + (price * order.quantity);
        }, 0);

    return Math.max(0, state.portfolio.cash - pendingBuyValue);
}
