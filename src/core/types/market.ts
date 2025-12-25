/**
 * Market Types
 * Defines market state, price points, and tick results.
 */

/**
 * Trigger/cause for a price movement
 */
export type PriceTrigger =
    | { readonly type: 'random_walk' }
    | { readonly type: 'momentum'; readonly direction: 'up' | 'down'; readonly strength: number }
    | { readonly type: 'news'; readonly eventId: string; readonly impact: number }
    | { readonly type: 'volume'; readonly sentiment: 'buying' | 'selling' };

/**
 * Single price point in history
 */
export interface PricePoint {
    /** Price at this point */
    readonly price: number;

    /** Turn number */
    readonly turn: number;

    /** Timestamp (for live market watch) */
    readonly timestamp: number;

    /** Absolute change from previous price */
    readonly change: number;

    /** Percentage change from previous price */
    readonly changePercent: number;

    /** What caused this price movement */
    readonly trigger?: PriceTrigger;
}

/**
 * Price change for a single ticker
 */
export interface PriceChange {
    /** Ticker symbol */
    readonly ticker: string;

    /** Previous price */
    readonly previousPrice: number;

    /** New price */
    readonly newPrice: number;

    /** Absolute change */
    readonly change: number;

    /** Percentage change */
    readonly changePercent: number;

    /** What caused the change */
    readonly trigger?: PriceTrigger;
}

/**
 * Complete market state
 */
export interface MarketState {
    /** Current prices by ticker */
    readonly prices: Readonly<Record<string, number>>;

    /** Price history by ticker */
    readonly priceHistory: Readonly<Record<string, readonly PricePoint[]>>;

    /** Currently active events affecting the market */
    readonly activeEvents: readonly string[];

    /** Current turn number */
    readonly turn: number;
}

/**
 * Result of a market tick
 */
export interface TickResult {
    /** New turn number */
    readonly turn: number;

    /** Updated prices */
    readonly prices: Readonly<Record<string, number>>;

    /** All price changes that occurred */
    readonly changes: readonly PriceChange[];

    /** Events that were triggered this tick */
    readonly triggeredEvents: readonly string[];

    /** Time taken for tick computation (ms) */
    readonly computeTimeMs: number;
}

/**
 * Market configuration
 */
export interface MarketConfig {
    /** Maximum history length per ticker */
    readonly maxHistoryLength: number;

    /** Base transaction fee */
    readonly transactionFee: number;

    /** Bid-ask spread as percentage */
    readonly spreadPercent: number;

    /** Random seed for reproducible simulations */
    readonly seed?: number;
}

/**
 * Default market configuration
 */
export const DEFAULT_MARKET_CONFIG: MarketConfig = {
    maxHistoryLength: 100,
    transactionFee: 1,
    spreadPercent: 0.005, // 0.5%
};

/**
 * Price generator configuration
 */
export interface PriceGeneratorConfig {
    /** Weight for random walk component (0-1) */
    readonly randomWalkWeight: number;

    /** Weight for momentum component (0-1) */
    readonly momentumWeight: number;

    /** Weight for news impact component (0-1) */
    readonly newsWeight: number;

    /** Weight for volume sentiment component (0-1) */
    readonly volumeWeight: number;

    /** Momentum decay factor per tick */
    readonly momentumDecay: number;
}

/**
 * Default price generator configuration
 */
export const DEFAULT_PRICE_GENERATOR_CONFIG: PriceGeneratorConfig = {
    randomWalkWeight: 0.4,
    momentumWeight: 0.25,
    newsWeight: 0.25,
    volumeWeight: 0.1,
    momentumDecay: 0.8,
};
