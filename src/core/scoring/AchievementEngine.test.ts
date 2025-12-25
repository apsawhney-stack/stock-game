/**
 * AchievementEngine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementEngine, AchievementRegistry } from './AchievementEngine';
import type { Achievement } from './types';

// Sample achievements for testing
const testAchievements: Achievement[] = [
    {
        id: 'first-trade',
        name: 'First Steps',
        description: 'Complete your first trade',
        category: 'milestone',
        tier: 'bronze',
        iconEmoji: '🎯',
        condition: { type: 'count_trades', threshold: 1 },
        xpReward: 25,
    },
    {
        id: 'trading-pro',
        name: 'Trading Pro',
        description: 'Make 10 trades',
        category: 'trading',
        tier: 'silver',
        iconEmoji: '💹',
        condition: { type: 'count_trades', threshold: 10 },
        xpReward: 75,
    },
    {
        id: 'diamond-hands',
        name: 'Diamond Hands',
        description: 'Hold through a dip',
        category: 'patience',
        tier: 'silver',
        iconEmoji: '💎',
        condition: { type: 'count_hold_through_dips', threshold: 1 },
        xpReward: 50,
    },
    {
        id: 'xp-hunter',
        name: 'XP Hunter',
        description: 'Earn 100 XP',
        category: 'milestone',
        tier: 'gold',
        iconEmoji: '🎖️',
        condition: { type: 'total_xp', threshold: 100 },
        xpReward: 100,
    },
];

describe('AchievementRegistry', () => {
    let registry: AchievementRegistry;

    beforeEach(() => {
        registry = new AchievementRegistry();
    });

    it('should register and retrieve achievements', () => {
        registry.register(testAchievements[0]);

        const achievement = registry.get('first-trade');
        expect(achievement).toBeDefined();
        expect(achievement!.name).toBe('First Steps');
    });

    it('should register many achievements', () => {
        registry.registerMany(testAchievements);

        expect(registry.getAll().length).toBe(4);
    });

    it('should filter by category', () => {
        registry.registerMany(testAchievements);

        const milestones = registry.getByCategory('milestone');
        expect(milestones.length).toBe(2);
    });

    it('should return undefined for unknown achievement', () => {
        const achievement = registry.get('unknown');
        expect(achievement).toBeUndefined();
    });
});

describe('AchievementEngine', () => {
    let registry: AchievementRegistry;
    let engine: AchievementEngine;

    beforeEach(() => {
        registry = new AchievementRegistry();
        registry.registerMany(testAchievements);
        engine = new AchievementEngine(registry);
    });

    describe('Progress Tracking', () => {
        it('should update progress', () => {
            engine.updateProgress('count_trades', 5);

            const state = engine.getState();
            expect(state.progress.count_trades).toBe(5);
        });

        it('should increment progress', () => {
            engine.incrementProgress('count_trades');
            engine.incrementProgress('count_trades');

            const state = engine.getState();
            expect(state.progress.count_trades).toBe(2);
        });
    });

    describe('Achievement Unlocking', () => {
        it('should unlock achievement when threshold met', () => {
            const unlocked = engine.updateProgress('count_trades', 1);

            expect(unlocked.length).toBe(1);
            expect(unlocked[0].id).toBe('first-trade');
            expect(engine.isUnlocked('first-trade')).toBe(true);
        });

        it('should unlock multiple achievements when appropriate', () => {
            const unlocked = engine.updateProgress('count_trades', 10);

            expect(unlocked.length).toBe(2);
            expect(unlocked.map(a => a.id)).toContain('first-trade');
            expect(unlocked.map(a => a.id)).toContain('trading-pro');
        });

        it('should not re-unlock already unlocked achievements', () => {
            engine.updateProgress('count_trades', 1);
            const unlocked = engine.updateProgress('count_trades', 2);

            expect(unlocked.length).toBe(0);
            expect(engine.getUnlockedCount()).toBe(1);
        });

        it('should track recently unlocked', () => {
            engine.updateProgress('count_trades', 1);

            const recent = engine.getRecentlyUnlocked();
            expect(recent.length).toBe(1);
            expect(recent[0].id).toBe('first-trade');
        });

        it('should clear recently unlocked', () => {
            engine.updateProgress('count_trades', 1);
            engine.clearRecentlyUnlocked();

            expect(engine.getRecentlyUnlocked().length).toBe(0);
        });
    });

    describe('Progress Info', () => {
        it('should return progress percent', () => {
            engine.updateProgress('count_trades', 5);

            expect(engine.getProgressPercent('trading-pro')).toBe(50);
        });

        it('should return 100% for unlocked achievements', () => {
            engine.updateProgress('count_trades', 10);

            expect(engine.getProgressPercent('trading-pro')).toBe(100);
        });

        it('should return progress info', () => {
            engine.updateProgress('count_trades', 5);

            const info = engine.getProgressInfo('trading-pro');
            expect(info).not.toBeNull();
            expect(info!.current).toBe(5);
            expect(info!.target).toBe(10);
        });
    });

    describe('Counts', () => {
        it('should return unlocked count', () => {
            engine.updateProgress('count_trades', 1);

            expect(engine.getUnlockedCount()).toBe(1);
        });

        it('should return total count', () => {
            expect(engine.getTotalCount()).toBe(4);
        });
    });

    describe('Get Unlocked Achievements', () => {
        it('should return list of unlocked achievements', () => {
            engine.updateProgress('count_trades', 1);
            engine.updateProgress('count_hold_through_dips', 1);

            const unlocked = engine.getUnlockedAchievements();
            expect(unlocked.length).toBe(2);
        });
    });

    describe('Reset', () => {
        it('should reset all state', () => {
            engine.updateProgress('count_trades', 10);
            engine.reset();

            expect(engine.getUnlockedCount()).toBe(0);
            expect(engine.getState().progress.count_trades).toBe(0);
        });
    });

    describe('Load State', () => {
        it('should load saved state', () => {
            const savedState = {
                unlocked: [{ achievementId: 'first-trade', unlockedAt: Date.now() }],
                progress: {
                    count_trades: 5,
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

            engine.loadState(savedState);

            expect(engine.isUnlocked('first-trade')).toBe(true);
            expect(engine.getState().progress.count_trades).toBe(5);
        });
    });
});
