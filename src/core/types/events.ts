/**
 * Event Types
 * Defines game events, news, and scheduled occurrences.
 */

/** Types of events that can occur in the game */
export type EventType =
    | 'earnings_beat'
    | 'earnings_miss'
    | 'product_launch'
    | 'product_recall'
    | 'scandal'
    | 'partnership'
    | 'sector_trend_up'
    | 'sector_trend_down'
    | 'market_rally'
    | 'market_crash'
    | 'regulation_positive'
    | 'regulation_negative'
    | 'celebrity_tweet'
    | 'supply_chain'
    | 'dividend_announced'
    | 'margin_call';

/** Impact magnitude */
export type EventImpact = 'minor' | 'moderate' | 'major' | 'extreme';

/**
 * Base game event definition
 */
export interface GameEvent {
    /** Unique event ID */
    readonly id: string;

    /** Event type */
    readonly type: EventType;

    /** Affected tickers, or 'all' for market-wide */
    readonly affectedTickers: readonly string[] | 'all' | 'sector';

    /** If sector-based, which sector */
    readonly affectedSector?: string;

    /** Impact magnitude */
    readonly impact: EventImpact;

    /** Percentage impact on price (-1 to 1, e.g., 0.15 = +15%) */
    readonly priceImpact: number;

    /** News headline shown to player */
    readonly headline: string;

    /** Detailed explanation (kid-friendly) */
    readonly explanation: string;

    /** Learning objective this event teaches */
    readonly learningLink: string;

    /** Duration in turns (how long the effect lasts) */
    readonly duration: number;
}

/**
 * Scheduled event (not yet triggered)
 */
export interface ScheduledEvent {
    /** The event to trigger */
    readonly event: GameEvent;

    /** Turn when event should trigger */
    readonly triggerTurn: number;

    /** Whether event has been triggered */
    readonly triggered: boolean;
}

/**
 * Triggered event (after it has occurred)
 */
export interface TriggeredEvent {
    /** The event that triggered */
    readonly event: GameEvent;

    /** Turn when it triggered */
    readonly triggeredAt: number;

    /** Turn when effect expires */
    readonly expiresAt: number;

    /** Actual price changes that resulted */
    readonly priceChanges: Readonly<Record<string, number>>;
}

/**
 * Event configuration for random event generation
 */
export interface EventConfig {
    /** Probability of event per turn */
    readonly probabilityPerTurn: number;

    /** Minimum turns between events */
    readonly minTurnsBetweenEvents: number;

    /** Event types that can occur */
    readonly allowedTypes: readonly EventType[];

    /** Maximum concurrent active events */
    readonly maxConcurrentEvents: number;
}

/**
 * Default event configuration
 */
export const DEFAULT_EVENT_CONFIG: EventConfig = {
    probabilityPerTurn: 0.3,
    minTurnsBetweenEvents: 2,
    allowedTypes: [
        'earnings_beat',
        'earnings_miss',
        'product_launch',
        'sector_trend_up',
        'sector_trend_down',
        'market_rally',
    ],
    maxConcurrentEvents: 2,
};

/**
 * Impact magnitude to percentage range mapping
 */
export const IMPACT_RANGES: Record<EventImpact, { min: number; max: number }> = {
    minor: { min: 0.02, max: 0.05 },
    moderate: { min: 0.05, max: 0.10 },
    major: { min: 0.10, max: 0.20 },
    extreme: { min: 0.20, max: 0.40 },
};
