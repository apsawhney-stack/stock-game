/**
 * PortfolioManager
 * 
 * Manages portfolio state including holdings, cash, and P&L.
 * All operations return new state (immutable).
 */

import type {
    PortfolioState,
    Holding,
    ExecutedTrade,
    RiskCheckResult,
} from '../types';
import { createInitialPortfolio } from '../types';
import {
    addLot,
    sellLotsFIFO,
    getSharesForTicker,
    getAverageCost,
    getUniqueTickers,
} from './LotTracker';
import { roundPrice } from '../utils';

/**
 * PortfolioManager interface
 */
export interface IPortfolioManager {
    // Queries
    getCash(): number;
    getHoldings(prices: Record<string, number>): Holding[];
    getHolding(ticker: string, prices: Record<string, number>): Holding | null;
    getTotalValue(prices: Record<string, number>): number;
    getUnrealizedPnL(prices: Record<string, number>): number;
    getRealizedPnL(): number;
    getConcentration(ticker: string, prices: Record<string, number>): number;
    getSectorExposure(
        prices: Record<string, number>,
        assetSectors: Record<string, string>
    ): Map<string, number>;

    // Commands
    applyTrade(trade: ExecutedTrade): PortfolioState;
    applyDividend(ticker: string, amount: number): PortfolioState;
    getState(): PortfolioState;

    // Risk checks
    checkConcentrationLimit(
        ticker: string,
        additionalValue: number,
        prices: Record<string, number>,
        limit: number
    ): RiskCheckResult;
}

/**
 * PortfolioManager implementation
 */
export class PortfolioManager implements IPortfolioManager {
    private state: PortfolioState;

    constructor(initialState?: PortfolioState) {
        this.state = initialState ?? createInitialPortfolio(10000);
    }

    // === Queries ===

    getCash(): number {
        return this.state.cash;
    }

    getHoldings(prices: Record<string, number>): Holding[] {
        const tickers = getUniqueTickers(this.state.lots);

        return tickers.map(ticker => {
            const shares = getSharesForTicker(this.state.lots, ticker);
            const avgCost = getAverageCost(this.state.lots, ticker);
            const currentPrice = prices[ticker] ?? avgCost;
            const marketValue = roundPrice(shares * currentPrice);
            const costBasis = roundPrice(shares * avgCost);
            const unrealizedPnL = roundPrice(marketValue - costBasis);
            const percentChange = costBasis > 0 ? (unrealizedPnL / costBasis) : 0;

            return {
                ticker,
                shares,
                avgCost,
                marketValue,
                unrealizedPnL,
                percentChange,
            };
        });
    }

    getHolding(ticker: string, prices: Record<string, number>): Holding | null {
        const shares = getSharesForTicker(this.state.lots, ticker);
        if (shares === 0) return null;

        const avgCost = getAverageCost(this.state.lots, ticker);
        const currentPrice = prices[ticker] ?? avgCost;
        const marketValue = roundPrice(shares * currentPrice);
        const costBasis = roundPrice(shares * avgCost);
        const unrealizedPnL = roundPrice(marketValue - costBasis);
        const percentChange = costBasis > 0 ? (unrealizedPnL / costBasis) : 0;

        return {
            ticker,
            shares,
            avgCost,
            marketValue,
            unrealizedPnL,
            percentChange,
        };
    }

    getTotalValue(prices: Record<string, number>): number {
        const holdingsValue = this.getHoldings(prices)
            .reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
        return roundPrice(this.state.cash + holdingsValue);
    }

    getUnrealizedPnL(prices: Record<string, number>): number {
        return this.getHoldings(prices)
            .reduce((sum, h) => sum + (h.unrealizedPnL ?? 0), 0);
    }

    getRealizedPnL(): number {
        return this.state.realizedPnL;
    }

    getConcentration(ticker: string, prices: Record<string, number>): number {
        const totalValue = this.getTotalValue(prices);
        if (totalValue === 0) return 0;

        const holding = this.getHolding(ticker, prices);
        if (!holding) return 0;

        return (holding.marketValue ?? 0) / totalValue;
    }

    getSectorExposure(
        prices: Record<string, number>,
        assetSectors: Record<string, string>
    ): Map<string, number> {
        const totalValue = this.getTotalValue(prices);
        const exposure = new Map<string, number>();

        if (totalValue === 0) return exposure;

        for (const holding of this.getHoldings(prices)) {
            const sector = assetSectors[holding.ticker] ?? 'unknown';
            const current = exposure.get(sector) ?? 0;
            exposure.set(sector, current + ((holding.marketValue ?? 0) / totalValue));
        }

        return exposure;
    }

    // === Commands ===

    applyTrade(trade: ExecutedTrade): PortfolioState {
        let newLots = [...this.state.lots];
        let newCash = this.state.cash;
        let newRealizedPnL = this.state.realizedPnL;

        if (trade.side === 'buy') {
            // Deduct cash (including fee)
            newCash -= trade.totalValue + trade.fee;

            // Add lot
            newLots = [...addLot(newLots, trade.ticker, trade.shares, trade.price, trade.executedAt)];
        } else {
            // Sell side
            const result = sellLotsFIFO(newLots, trade.ticker, trade.shares, trade.price);
            newLots = [...result.lots];

            // Add cash (minus fee)
            newCash += trade.totalValue - trade.fee;

            // Update realized P&L
            newRealizedPnL += result.realizedPnL;
        }

        this.state = {
            ...this.state,
            lots: newLots,
            cash: roundPrice(newCash),
            realizedPnL: roundPrice(newRealizedPnL),
            totalFees: this.state.totalFees + trade.fee,
            tradeCount: this.state.tradeCount + 1,
            lastUpdated: Date.now(),
        };

        return this.state;
    }

    applyDividend(ticker: string, amount: number): PortfolioState {
        const shares = getSharesForTicker(this.state.lots, ticker);
        const totalDividend = roundPrice(shares * amount);

        this.state = {
            ...this.state,
            cash: roundPrice(this.state.cash + totalDividend),
            totalDividends: this.state.totalDividends + totalDividend,
            lastUpdated: Date.now(),
        };

        return this.state;
    }

    getState(): PortfolioState {
        return this.state;
    }

    // === Risk Checks ===

    checkConcentrationLimit(
        ticker: string,
        additionalValue: number,
        prices: Record<string, number>,
        limit: number = 0.5
    ): RiskCheckResult {
        const currentHolding = this.getHolding(ticker, prices);
        const currentValue = currentHolding?.marketValue ?? 0;
        const totalValue = this.getTotalValue(prices) + additionalValue;

        const newConcentration = (currentValue + additionalValue) / totalValue;

        if (newConcentration > limit) {
            return {
                passed: false,
                type: 'concentration',
                message: `This trade would put ${(newConcentration * 100).toFixed(1)}% of your portfolio in ${ticker}. Limit is ${(limit * 100).toFixed(0)}%.`,
                currentValue: newConcentration,
                limit,
            };
        }

        return {
            passed: true,
            type: 'concentration',
        };
    }
}

/**
 * Create a new portfolio manager with starting cash
 */
export function createPortfolioManager(startingCash: number): PortfolioManager {
    return new PortfolioManager(createInitialPortfolio(startingCash));
}
