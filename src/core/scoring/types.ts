/**
 * Scoring Types
 * Type definitions for XP and Achievement systems
 * Per GDD Section 4.5
 */

/**
 * Actions that earn XP
 */
export type XPAction =
    | 'complete_level'       // Complete a mission level
    | 'hold_through_dip'     // Hold through volatility (10%+ swing)
    | 'maintain_diversity'   // Maintain diversification (turn reward)
    | 'limit_order_fill'     // Limit order executed successfully
    | 'beat_benchmark'       // Beat the market index
    | 'read_news'            // Read a news card fully
    | 'no_undo_used'         // Complete without using undo
    | 'level_replay';        // Replay a completed level (50% XP)

/**
 * XP values for each action (from GDD)
 */
export const XP_VALUES: Record<XPAction, number> = {
    complete_level: 100,
    hold_through_dip: 25,
    maintain_diversity: 10,
    limit_order_fill: 15,
    beat_benchmark: 50,
    read_news: 5,
    no_undo_used: 30,
    level_replay: 50,       // 50% of normal level completion
};

/**
 * Daily XP cap to prevent grinding
 */
export const DAILY_XP_CAP = 500;

/**
 * XP earned event
 */
export interface XPEarnedEvent {
    readonly action: XPAction;
    readonly amount: number;
    readonly timestamp: number;
    readonly turn?: number;
    readonly description?: string;
}

/**
 * Scoring state for a game session
 */
export interface ScoringState {
    /** Total XP earned this session */
    readonly sessionXP: number;
    /** Total XP earned today (for daily cap) */
    readonly todayXP: number;
    /** Date string for today (YYYY-MM-DD) */
    readonly todayDate: string;
    /** History of XP earned events */
    readonly xpHistory: readonly XPEarnedEvent[];
    /** Whether player used undo this mission */
    readonly usedUndo: boolean;
    /** Turns with diversification maintained */
    readonly diversifiedTurns: number;
    /** News cards read this mission */
    readonly newsCardsRead: number;
    /** Held through dips count */
    readonly heldThroughDips: number;
    /** Limit orders filled count */
    readonly limitOrdersFilled: number;
}

/**
 * Achievement category
 */
export type AchievementCategory =
    | 'trading'     // Trading-related achievements
    | 'learning'    // Learning/reading achievements
    | 'patience'    // Holding/patience achievements
    | 'strategy'    // Strategy achievements
    | 'milestone';  // Progress milestones

/**
 * Achievement tier (bronze, silver, gold)
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold';

/**
 * Achievement condition type
 */
export type AchievementConditionType =
    | 'count_trades'           // Number of trades made
    | 'count_news_read'        // Number of news cards read
    | 'count_levels_completed' // Number of levels completed
    | 'count_diversified_turns'// Turns with diversified portfolio
    | 'count_hold_through_dips'// Times held through volatility
    | 'count_limit_fills'      // Limit orders filled
    | 'count_benchmark_beats'  // Times beat the benchmark
    | 'streak_days_played'     // Consecutive days played
    | 'streak_no_undo'         // Missions without undo
    | 'total_profit'           // Total profit earned
    | 'total_xp';              // Total XP earned

/**
 * Condition for unlocking an achievement
 */
export interface AchievementCondition {
    readonly type: AchievementConditionType;
    readonly threshold: number;
}

/**
 * Achievement definition
 */
export interface Achievement {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly category: AchievementCategory;
    readonly tier: AchievementTier;
    readonly iconEmoji: string;
    readonly condition: AchievementCondition;
    readonly xpReward: number;
}

/**
 * Unlocked achievement record
 */
export interface UnlockedAchievement {
    readonly achievementId: string;
    readonly unlockedAt: number;
    readonly turn?: number;
}

/**
 * Achievement state
 */
export interface AchievementState {
    /** All unlocked achievements */
    readonly unlocked: readonly UnlockedAchievement[];
    /** Progress toward achievements (condition type -> current value) */
    readonly progress: Record<AchievementConditionType, number>;
    /** Recently unlocked (for popup display) */
    readonly recentlyUnlocked: readonly string[];
}

/**
 * Initial scoring state
 */
export function createInitialScoringState(): ScoringState {
    const today = new Date().toISOString().split('T')[0];
    return {
        sessionXP: 0,
        todayXP: 0,
        todayDate: today,
        xpHistory: [],
        usedUndo: false,
        diversifiedTurns: 0,
        newsCardsRead: 0,
        heldThroughDips: 0,
        limitOrdersFilled: 0,
    };
}

/**
 * Initial achievement state
 */
export function createInitialAchievementState(): AchievementState {
    return {
        unlocked: [],
        progress: {
            count_trades: 0,
            count_news_read: 0,
            count_levels_completed: 0,
            count_diversified_turns: 0,
            count_hold_through_dips: 0,
            count_limit_fills: 0,
            count_benchmark_beats: 0,
            streak_days_played: 0,
            streak_no_undo: 0,
            total_profit: 0,
            total_xp: 0,
        },
        recentlyUnlocked: [],
    };
}
