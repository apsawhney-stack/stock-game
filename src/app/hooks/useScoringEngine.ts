/**
 * useScoringEngine Hook
 * 
 * Manages the ScoringEngine lifecycle and syncs with Zustand store.
 * Awards XP for various game actions.
 */

import { useEffect, useRef, useCallback } from 'react';
import { ScoringEngine } from '../../core/scoring/ScoringEngine';
import { AchievementEngine, AchievementRegistry } from '../../core/scoring/AchievementEngine';
import type { Achievement } from '../../core/scoring/types';
import { useGameStore, useGameActions } from '../store';

// Import achievements data
import achievementsData from '../../../data/achievements.json';

/**
 * Hook to manage ScoringEngine and AchievementEngine
 */
export function useScoringEngine() {
    const scoringRef = useRef<ScoringEngine | null>(null);
    const achievementRegistryRef = useRef<AchievementRegistry | null>(null);
    const achievementEngineRef = useRef<AchievementEngine | null>(null);
    const lastProcessedTurn = useRef<number>(-1);

    const { awardXP, unlockAchievement, updateAchievementProgress } = useGameActions();
    const sessionPhase = useGameStore((state) => state.session.phase);
    const currentTurn = useGameStore((state) => state.session.turn);
    const holdings = useGameStore((state) => state.portfolio.lots);
    const orderHistory = useGameStore((state) => state.orderHistory);
    const readEventIds = useGameStore((state) => state.events.readEventIds);

    // Initialize engines when game starts
    useEffect(() => {
        if (sessionPhase === 'playing' && !scoringRef.current) {
            // Create scoring engine
            scoringRef.current = new ScoringEngine();

            // Create achievement registry and engine
            achievementRegistryRef.current = new AchievementRegistry();
            achievementRegistryRef.current.registerMany(achievementsData.achievements as Achievement[]);
            achievementEngineRef.current = new AchievementEngine(achievementRegistryRef.current);

            // Reset last processed turn
            lastProcessedTurn.current = -1;
        }

        // Cleanup on game end
        return () => {
            if (sessionPhase === 'menu') {
                scoringRef.current = null;
                achievementEngineRef.current = null;
                achievementRegistryRef.current = null;
            }
        };
    }, [sessionPhase]);

    // Award XP for news read 
    useEffect(() => {
        if (scoringRef.current && sessionPhase === 'playing' && readEventIds.length > 0) {
            // Award XP for reading news (tracked by news read count in scoring state)
            const newsReadCount = scoringRef.current.getState().newsCardsRead;
            const newReads = readEventIds.length - newsReadCount;

            // Award XP for new reads
            for (let i = 0; i < newReads; i++) {
                const event = scoringRef.current.recordNewsRead(currentTurn);
                if (event) {
                    awardXP(event);
                    // Update achievement progress
                    const unlocked = achievementEngineRef.current?.incrementProgress('count_news_read');
                    unlocked?.forEach(a => unlockAchievement(a.id));
                }
            }
        }
    }, [readEventIds.length, sessionPhase, currentTurn, awardXP, unlockAchievement]);

    // Check for diversification XP each turn
    useEffect(() => {
        if (
            scoringRef.current &&
            sessionPhase === 'playing' &&
            currentTurn > 0 &&
            currentTurn !== lastProcessedTurn.current
        ) {
            // Get unique tickers held
            const uniqueTickers = new Set(holdings.map(lot => lot.ticker));

            // Award diversification XP if holding 3+ different stocks
            if (uniqueTickers.size >= 3) {
                const event = scoringRef.current.recordDiversifiedTurn(uniqueTickers.size, currentTurn);
                if (event) {
                    awardXP(event);
                    const unlocked = achievementEngineRef.current?.incrementProgress('count_diversified_turns');
                    unlocked?.forEach(a => unlockAchievement(a.id));
                }
            }

            lastProcessedTurn.current = currentTurn;
        }
    }, [currentTurn, sessionPhase, holdings, awardXP, unlockAchievement]);

    // Track trades for achievements
    useEffect(() => {
        if (achievementEngineRef.current && orderHistory.length > 0) {
            const filledOrders = orderHistory.filter(o => o.status === 'filled');
            if (filledOrders.length > 0) {
                updateAchievementProgress('count_trades', filledOrders.length);
                const unlocked = achievementEngineRef.current.updateProgress('count_trades', filledOrders.length);
                unlocked?.forEach(a => unlockAchievement(a.id));
            }
        }
    }, [orderHistory, updateAchievementProgress, unlockAchievement]);

    /**
     * Award XP for completing a mission
     */
    const awardMissionEndXP = useCallback((options: {
        beatBenchmark: boolean;
        isReplay: boolean;
    }) => {
        if (!scoringRef.current) return [];

        const events = scoringRef.current.calculateMissionEndXP({
            completed: true,
            beatBenchmark: options.beatBenchmark,
            isReplay: options.isReplay,
        });

        // Award each XP event
        events.forEach(event => awardXP(event));

        // Update achievement progress
        if (achievementEngineRef.current) {
            const unlocked = achievementEngineRef.current.incrementProgress('count_levels_completed');
            unlocked?.forEach(a => unlockAchievement(a.id));

            if (options.beatBenchmark) {
                const beatUnlocked = achievementEngineRef.current.incrementProgress('count_benchmark_beats');
                beatUnlocked?.forEach(a => unlockAchievement(a.id));
            }

            if (!scoringRef.current.getState().usedUndo) {
                const noUndoUnlocked = achievementEngineRef.current.incrementProgress('streak_no_undo');
                noUndoUnlocked?.forEach(a => unlockAchievement(a.id));
            }
        }

        return events;
    }, [awardXP, unlockAchievement]);

    /**
     * Record that player used undo
     */
    const recordUndo = useCallback(() => {
        scoringRef.current?.recordUndoUsed();
    }, []);

    return {
        awardMissionEndXP,
        recordUndo,
        scoringEngine: scoringRef.current,
        achievementEngine: achievementEngineRef.current,
    };
}
