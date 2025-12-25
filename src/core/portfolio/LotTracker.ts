/**
 * LotTracker
 * 
 * Manages individual purchase lots for FIFO cost basis tracking.
 * All operations return new state (immutable).
 */

import type { Lot } from '../types';

/**
 * Result of selling shares
 */
export interface SellResult {
    /** Updated lots array */
    readonly lots: readonly Lot[];

    /** Shares actually sold */
    readonly sharesSold: number;

    /** Total cost basis of shares sold */
    readonly costBasis: number;

    /** Realized P&L (sale proceeds - cost basis) */
    readonly realizedPnL: number;

    /** Lots that were fully or partially consumed */
    readonly consumedLots: readonly Lot[];
}

/**
 * Add a new lot (purchase)
 */
export function addLot(
    lots: readonly Lot[],
    ticker: string,
    shares: number,
    costPerShare: number,
    turn: number
): readonly Lot[] {
    const newLot: Lot = {
        ticker,
        shares,
        costBasis: costPerShare,
        acquiredAt: turn,
    };
    return [...lots, newLot];
}

/**
 * Sell shares using FIFO method
 */
export function sellLotsFIFO(
    lots: readonly Lot[],
    ticker: string,
    sharesToSell: number,
    salePrice: number
): SellResult {
    // Filter lots for this ticker
    const tickerLots = lots.filter(lot => lot.ticker === ticker);
    const otherLots = lots.filter(lot => lot.ticker !== ticker);

    // Sort by acquisition time (FIFO)
    const sortedLots = [...tickerLots].sort((a, b) => a.acquiredAt - b.acquiredAt);

    let remaining = sharesToSell;
    let totalCostBasis = 0;
    const consumedLots: Lot[] = [];
    const updatedLots: Lot[] = [];

    for (const lot of sortedLots) {
        if (remaining <= 0) {
            // Keep remaining lots
            updatedLots.push(lot);
            continue;
        }

        if (lot.shares <= remaining) {
            // Consume entire lot
            remaining -= lot.shares;
            totalCostBasis += lot.shares * lot.costBasis;
            consumedLots.push(lot);
        } else {
            // Partial lot consumption
            totalCostBasis += remaining * lot.costBasis;
            consumedLots.push({
                ...lot,
                shares: remaining,
            });

            // Keep remainder of lot
            updatedLots.push({
                ...lot,
                shares: lot.shares - remaining,
            });
            remaining = 0;
        }
    }

    const sharesSold = sharesToSell - remaining;
    const proceeds = sharesSold * salePrice;
    const realizedPnL = proceeds - totalCostBasis;

    return {
        lots: [...otherLots, ...updatedLots],
        sharesSold,
        costBasis: totalCostBasis,
        realizedPnL,
        consumedLots,
    };
}

/**
 * Get total shares for a ticker
 */
export function getSharesForTicker(lots: readonly Lot[], ticker: string): number {
    return lots
        .filter(lot => lot.ticker === ticker)
        .reduce((sum, lot) => sum + lot.shares, 0);
}

/**
 * Get average cost basis for a ticker
 */
export function getAverageCost(lots: readonly Lot[], ticker: string): number {
    const tickerLots = lots.filter(lot => lot.ticker === ticker);
    if (tickerLots.length === 0) return 0;

    const totalShares = tickerLots.reduce((sum, lot) => sum + lot.shares, 0);
    const totalCost = tickerLots.reduce((sum, lot) => sum + lot.shares * lot.costBasis, 0);

    return totalShares > 0 ? totalCost / totalShares : 0;
}

/**
 * Get all unique tickers in lots
 */
export function getUniqueTickers(lots: readonly Lot[]): string[] {
    return [...new Set(lots.map(lot => lot.ticker))];
}

/**
 * Compute total cost basis across all lots
 */
export function getTotalCostBasis(lots: readonly Lot[]): number {
    return lots.reduce((sum, lot) => sum + lot.shares * lot.costBasis, 0);
}
