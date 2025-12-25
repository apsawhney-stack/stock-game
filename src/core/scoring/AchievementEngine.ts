/**
 * AchievementEngine
 * Manages achievement unlocking and progress tracking
 * Per GDD Section 4.5
 */

import type {
    Achievement,
    AchievementConditionType,
    AchievementState,
    UnlockedAchievement,
} from './types';
import { createInitialAchievementState } from './types';

/**
 * AchievementRegistry - holds all possible achievements
 */
export class AchievementRegistry {
    private achievements: Map<string, Achievement> = new Map();

    register(achievement: Achievement): void {
        this.achievements.set(achievement.id, achievement);
    }

    registerMany(achievements: Achievement[]): void {
        achievements.forEach(a => this.register(a));
    }

    get(id: string): Achievement | undefined {
        return this.achievements.get(id);
    }

    getAll(): Achievement[] {
        return Array.from(this.achievements.values());
    }

    getByCategory(category: string): Achievement[] {
        return Array.from(this.achievements.values())
            .filter(a => a.category === category);
    }
}

/**
 * AchievementEngine - checks conditions and unlocks achievements
 */
export class AchievementEngine {
    private state: AchievementState;
    private registry: AchievementRegistry;

    constructor(registry: AchievementRegistry) {
        this.state = createInitialAchievementState();
        this.registry = registry;
    }

    /**
     * Get current achievement state
     */
    getState(): AchievementState {
        return this.state;
    }

    /**
     * Update progress for a condition type
     * Returns newly unlocked achievements
     */
    updateProgress(
        conditionType: AchievementConditionType,
        value: number,
        increment: boolean = false
    ): Achievement[] {
        // Update progress
        const currentValue = this.state.progress[conditionType] ?? 0;
        const newValue = increment ? currentValue + value : value;

        this.state = {
            ...this.state,
            progress: {
                ...this.state.progress,
                [conditionType]: newValue,
            },
        };

        // Check for newly unlocked achievements
        return this.checkUnlocks(conditionType, newValue);
    }

    /**
     * Increment progress by 1
     */
    incrementProgress(conditionType: AchievementConditionType): Achievement[] {
        return this.updateProgress(conditionType, 1, true);
    }

    /**
     * Check which achievements are unlocked by this progress update
     */
    private checkUnlocks(
        conditionType: AchievementConditionType,
        newValue: number
    ): Achievement[] {
        const unlocked: Achievement[] = [];

        for (const achievement of this.registry.getAll()) {
            // Skip if already unlocked
            if (this.isUnlocked(achievement.id)) {
                continue;
            }

            // Check if this achievement uses this condition type
            if (achievement.condition.type !== conditionType) {
                continue;
            }

            // Check if threshold is met
            if (newValue >= achievement.condition.threshold) {
                this.unlock(achievement);
                unlocked.push(achievement);
            }
        }

        return unlocked;
    }

    /**
     * Unlock an achievement
     */
    private unlock(achievement: Achievement): void {
        const record: UnlockedAchievement = {
            achievementId: achievement.id,
            unlockedAt: Date.now(),
        };

        this.state = {
            ...this.state,
            unlocked: [...this.state.unlocked, record],
            recentlyUnlocked: [...this.state.recentlyUnlocked, achievement.id],
        };
    }

    /**
     * Check if an achievement is unlocked
     */
    isUnlocked(achievementId: string): boolean {
        return this.state.unlocked.some(u => u.achievementId === achievementId);
    }

    /**
     * Get all unlocked achievements
     */
    getUnlockedAchievements(): Achievement[] {
        return this.state.unlocked
            .map(u => this.registry.get(u.achievementId))
            .filter((a): a is Achievement => a !== undefined);
    }

    /**
     * Get recently unlocked achievement IDs (for popup display)
     */
    getRecentlyUnlocked(): Achievement[] {
        return this.state.recentlyUnlocked
            .map(id => this.registry.get(id))
            .filter((a): a is Achievement => a !== undefined);
    }

    /**
     * Clear recently unlocked (after showing popups)
     */
    clearRecentlyUnlocked(): void {
        this.state = {
            ...this.state,
            recentlyUnlocked: [],
        };
    }

    /**
     * Get progress percentage for an achievement
     */
    getProgressPercent(achievementId: string): number {
        const achievement = this.registry.get(achievementId);
        if (!achievement) return 0;

        if (this.isUnlocked(achievementId)) return 100;

        const currentValue = this.state.progress[achievement.condition.type] ?? 0;
        return Math.min(100, (currentValue / achievement.condition.threshold) * 100);
    }

    /**
     * Get progress info for an achievement
     */
    getProgressInfo(achievementId: string): { current: number; target: number } | null {
        const achievement = this.registry.get(achievementId);
        if (!achievement) return null;

        return {
            current: this.state.progress[achievement.condition.type] ?? 0,
            target: achievement.condition.threshold,
        };
    }

    /**
     * Get count of unlocked achievements
     */
    getUnlockedCount(): number {
        return this.state.unlocked.length;
    }

    /**
     * Get total achievement count
     */
    getTotalCount(): number {
        return this.registry.getAll().length;
    }

    /**
     * Reset achievement state (keeps registry)
     */
    reset(): void {
        this.state = createInitialAchievementState();
    }

    /**
     * Load state from storage
     */
    loadState(state: AchievementState): void {
        this.state = state;
    }
}
