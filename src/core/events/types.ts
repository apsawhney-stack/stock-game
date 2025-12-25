/**
 * Event Types
 * Defines all game event types per GDD Section 4.4
 */

/** Event categories based on scope and impact */
export type EventCategory =
    | 'earnings'      // Company-specific earnings reports
    | 'sector'        // Affects all stocks in a sector
    | 'market'        // Affects all stocks
    | 'product'       // Company-specific product news
    | 'regulation'    // Government policy changes
    | 'scandal'       // Negative company news
    | 'celebrity';    // For crypto (Level 7+)

/** Sectors that can be affected */
export type EventSector = 'tech' | 'food' | 'health' | 'energy' | 'crypto' | 'all';

/** Impact direction */
export type ImpactDirection = 'positive' | 'negative' | 'neutral';

/** Event impact configuration */
export interface EventImpact {
    /** Percentage change (e.g., 0.15 = +15%, -0.10 = -10%) */
    readonly priceChange: number;
    /** Which tickers are affected, or 'sector' or 'all' */
    readonly scope: string[] | 'sector' | 'all';
    /** If scope is 'sector', which sector */
    readonly sector?: EventSector;
    /** Volatility modifier for affected stocks */
    readonly volatilityModifier?: number;
}

/** A game event definition */
export interface GameEvent {
    readonly id: string;
    readonly category: EventCategory;
    readonly headline: string;
    readonly description: string;
    readonly explanation: string;      // Kid-friendly explanation of why price moved
    readonly impact: EventImpact;
    readonly learningTip?: string;     // Teaching moment
    readonly iconEmoji: string;        // Visual indicator
}

/** A scheduled event (to happen on specific turn) */
export interface ScheduledEvent {
    readonly event: GameEvent;
    readonly triggerTurn: number;
}

/** Event trigger result */
export interface TriggeredEvent extends GameEvent {
    readonly triggeredAt: number;      // Turn when it triggered
    readonly affectedTickers: string[];
    readonly priceImpacts: Record<string, number>; // Actual impacts applied
}

/** Event scheduling configuration */
export interface EventScheduleConfig {
    /** Base probability of random event per turn (0-1) */
    readonly randomEventProbability: number;
    /** Probability of earnings event when applicable */
    readonly earningsProbability: number;
    /** Max events per turn */
    readonly maxEventsPerTurn: number;
}

/** Default event config per GDD */
export const DEFAULT_EVENT_CONFIG: EventScheduleConfig = {
    randomEventProbability: 0.3,   // ~1 event per 3 turns
    earningsProbability: 0.2,      // 1 per 5 turns
    maxEventsPerTurn: 2,
};
