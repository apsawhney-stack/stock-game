/**
 * ScoringEngine
 * Manages XP calculations and rewards
 * Per GDD Section 4.5
 */

import type {
    XPAction,
    XPEarnedEvent,
    ScoringState,
} from './types';
import { XP_VALUES, DAILY_XP_CAP, createInitialScoringState } from './types';

/**
 * Configuration for the scoring engine
 */
export interface ScoringConfig {
    /** Minimum diversification percentage (default 3 stocks) */
    readonly diversificationThreshold: number;
    /** Minimum price drop to count as "dip" (default 10%) */
    readonly dipThreshold: number;
    /** XP multiplier for replaying levels */
    readonly replayMultiplier: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
    diversificationThreshold: 3,
    dipThreshold: 0.10,
    replayMultiplier: 0.5,
};

/**
 * ScoringEngine - calculates and tracks XP
 */
export class ScoringEngine {
    private state: ScoringState;
    private config: ScoringConfig;

    constructor(config: Partial<ScoringConfig> = {}) {
        this.state = createInitialScoringState();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Get current scoring state
     */
    getState(): ScoringState {
        return this.state;
    }

    /**
     * Award XP for an action
     * Returns the actual XP awarded (may be 0 if capped)
     */
    awardXP(
        action: XPAction,
        options: {
            turn?: number;
            description?: string;
            isReplay?: boolean;
        } = {}
    ): XPEarnedEvent | null {
        // Check if we need to reset daily counter
        this.checkDailyReset();

        // Calculate base XP
        let amount = XP_VALUES[action];

        // Apply replay multiplier
        if (options.isReplay) {
            amount = Math.floor(amount * this.config.replayMultiplier);
        }

        // Check daily cap
        if (this.state.todayXP >= DAILY_XP_CAP) {
            return null; // Already at cap
        }

        // Cap at remaining daily XP
        const remainingDaily = DAILY_XP_CAP - this.state.todayXP;
        amount = Math.min(amount, remainingDaily);

        if (amount <= 0) {
            return null;
        }

        // Create the XP event
        const event: XPEarnedEvent = {
            action,
            amount,
            timestamp: Date.now(),
            turn: options.turn,
            description: options.description ?? this.getDefaultDescription(action),
        };

        // Update state
        this.state = {
            ...this.state,
            sessionXP: this.state.sessionXP + amount,
            todayXP: this.state.todayXP + amount,
            xpHistory: [...this.state.xpHistory, event],
        };

        return event;
    }

    /**
     * Record that player used undo (affects end-of-mission XP)
     */
    recordUndoUsed(): void {
        this.state = {
            ...this.state,
            usedUndo: true,
        };
    }

    /**
     * Record news card read
     */
    recordNewsRead(turn?: number): XPEarnedEvent | null {
        this.state = {
            ...this.state,
            newsCardsRead: this.state.newsCardsRead + 1,
        };
        return this.awardXP('read_news', {
            turn,
            description: 'Read a news card',
        });
    }

    /**
     * Record that player maintained diversification this turn
     */
    recordDiversifiedTurn(
        holdingsCount: number,
        turn?: number
    ): XPEarnedEvent | null {
        if (holdingsCount >= this.config.diversificationThreshold) {
            this.state = {
                ...this.state,
                diversifiedTurns: this.state.diversifiedTurns + 1,
            };
            return this.awardXP('maintain_diversity', {
                turn,
                description: `Maintained ${holdingsCount} diversified stocks`,
            });
        }
        return null;
    }

    /**
     * Record that player held through a dip
     */
    recordHeldThroughDip(
        ticker: string,
        dropPercent: number,
        turn?: number
    ): XPEarnedEvent | null {
        if (Math.abs(dropPercent) >= this.config.dipThreshold) {
            this.state = {
                ...this.state,
                heldThroughDips: this.state.heldThroughDips + 1,
            };
            return this.awardXP('hold_through_dip', {
                turn,
                description: `Held ${ticker} through ${(dropPercent * 100).toFixed(0)}% dip`,
            });
        }
        return null;
    }

    /**
     * Record limit order fill
     */
    recordLimitOrderFill(
        ticker: string,
        turn?: number
    ): XPEarnedEvent | null {
        this.state = {
            ...this.state,
            limitOrdersFilled: this.state.limitOrdersFilled + 1,
        };
        return this.awardXP('limit_order_fill', {
            turn,
            description: `Limit order filled for ${ticker}`,
        });
    }

    /**
     * Calculate end-of-mission XP
     */
    calculateMissionEndXP(
        options: {
            completed: boolean;
            beatBenchmark: boolean;
            isReplay: boolean;
        }
    ): XPEarnedEvent[] {
        const events: XPEarnedEvent[] = [];

        if (options.completed) {
            const levelEvent = this.awardXP(
                options.isReplay ? 'level_replay' : 'complete_level',
                { description: options.isReplay ? 'Replayed level' : 'Completed level' }
            );
            if (levelEvent) events.push(levelEvent);
        }

        if (options.beatBenchmark) {
            const benchmarkEvent = this.awardXP('beat_benchmark', {
                description: 'Beat the market benchmark!',
            });
            if (benchmarkEvent) events.push(benchmarkEvent);
        }

        if (!this.state.usedUndo && options.completed) {
            const noUndoEvent = this.awardXP('no_undo_used', {
                description: 'Completed without using undo',
            });
            if (noUndoEvent) events.push(noUndoEvent);
        }

        return events;
    }

    /**
     * Get total XP earned this session
     */
    getSessionXP(): number {
        return this.state.sessionXP;
    }

    /**
     * Get remaining daily XP allowance
     */
    getRemainingDailyXP(): number {
        this.checkDailyReset();
        return Math.max(0, DAILY_XP_CAP - this.state.todayXP);
    }

    /**
     * Check if daily XP cap is reached
     */
    isDailyCapReached(): boolean {
        this.checkDailyReset();
        return this.state.todayXP >= DAILY_XP_CAP;
    }

    /**
     * Reset for a new mission
     */
    resetForMission(): void {
        this.state = {
            ...this.state,
            sessionXP: 0,
            xpHistory: [],
            usedUndo: false,
            diversifiedTurns: 0,
            newsCardsRead: 0,
            heldThroughDips: 0,
            limitOrdersFilled: 0,
        };
    }

    /**
     * Reset all state
     */
    reset(): void {
        this.state = createInitialScoringState();
    }

    /**
     * Check if we need to reset daily XP counter
     */
    private checkDailyReset(): void {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.todayDate !== today) {
            this.state = {
                ...this.state,
                todayXP: 0,
                todayDate: today,
            };
        }
    }

    /**
     * Get default description for an XP action
     */
    private getDefaultDescription(action: XPAction): string {
        switch (action) {
            case 'complete_level':
                return 'Completed level';
            case 'hold_through_dip':
                return 'Held through volatility';
            case 'maintain_diversity':
                return 'Maintained portfolio diversity';
            case 'limit_order_fill':
                return 'Limit order executed';
            case 'beat_benchmark':
                return 'Beat the market benchmark';
            case 'read_news':
                return 'Read news card';
            case 'no_undo_used':
                return 'Completed without undo';
            case 'level_replay':
                return 'Replayed level';
            default:
                return 'XP earned';
        }
    }
}
