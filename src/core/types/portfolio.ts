/**
 * Portfolio Types
 * Defines portfolio state, holdings, and lot tracking.
 */

/**
 * A single lot represents shares acquired at a specific price
 * Used for FIFO cost basis tracking
 */
export interface Lot {
    /** Ticker symbol */
    readonly ticker: string;

    /** Number of shares in this lot */
    readonly shares: number;

    /** Cost per share when acquired */
    readonly costBasis: number;

    /** Turn number when acquired */
    readonly acquiredAt: number;
}

/**
 * Computed holding for a single ticker
 * Aggregated from one or more lots
 */
export interface Holding {
    /** Ticker symbol */
    readonly ticker: string;

    /** Total number of shares */
    readonly shares: number;

    /** Weighted average cost per share */
    readonly avgCost: number;

    /** Current market value (computed with latest prices) */
    readonly marketValue?: number;

    /** Unrealized P&L (computed with latest prices) */
    readonly unrealizedPnL?: number;

    /** Percentage gain/loss (computed) */
    readonly percentChange?: number;
}

/**
 * Complete portfolio state
 * Immutable - all changes create a new PortfolioState
 */
export interface PortfolioState {
    /** Available cash balance */
    readonly cash: number;

    /** All lots (individual purchases) */
    readonly lots: readonly Lot[];

    /** Cumulative realized P&L from closed positions */
    readonly realizedPnL: number;

    /** Total transaction fees paid */
    readonly totalFees: number;

    /** Total dividends received */
    readonly totalDividends: number;

    /** Number of trades executed */
    readonly tradeCount: number;

    /** Timestamp of last update */
    readonly lastUpdated: number;
}

/**
 * Portfolio snapshot for history tracking
 */
export interface PortfolioSnapshot {
    /** Turn number when snapshot was taken */
    readonly turn: number;

    /** Total portfolio value at this turn */
    readonly totalValue: number;

    /** Cash at this turn */
    readonly cash: number;

    /** Holdings value at this turn */
    readonly holdingsValue: number;

    /** Realized P&L up to this turn */
    readonly realizedPnL: number;

    /** Unrealized P&L at this turn */
    readonly unrealizedPnL: number;
}

/**
 * Risk check result for trade validation
 */
export interface RiskCheckResult {
    /** Whether the check passed */
    readonly passed: boolean;

    /** Type of risk check */
    readonly type: 'concentration' | 'sector' | 'leverage' | 'crypto_limit' | 'cash';

    /** Warning message if check failed */
    readonly message?: string;

    /** Current value that triggered the warning */
    readonly currentValue?: number;

    /** Limit that would be exceeded */
    readonly limit?: number;
}

/**
 * Initial portfolio state factory
 */
export function createInitialPortfolio(startingCash: number): PortfolioState {
    return {
        cash: startingCash,
        lots: [],
        realizedPnL: 0,
        totalFees: 0,
        totalDividends: 0,
        tradeCount: 0,
        lastUpdated: Date.now(),
    };
}
