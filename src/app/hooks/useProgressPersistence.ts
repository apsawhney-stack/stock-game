/**
 * useProgressPersistence Hook
 * 
 * Handles save/load of player progress to localStorage
 * Persists scoring and achievements without modifying the store middleware
 */

import { useEffect } from 'react';
import { useGameStore } from '../store';
import type { ScoringState, AchievementState } from '../../core/scoring/types';

const STORAGE_KEY = 'stockquest_progress';

interface PersistedProgress {
    scoring: ScoringState;
    achievements: AchievementState;
    savedAt: number;
}

/**
 * Save current progress to localStorage
 */
export function saveProgress(): void {
    const state = useGameStore.getState();
    const progress: PersistedProgress = {
        scoring: state.scoring,
        achievements: state.achievements,
        savedAt: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        console.log('[Progress] Saved to localStorage');
    } catch (error) {
        console.error('[Progress] Failed to save:', error);
    }
}

/**
 * Load progress from localStorage
 */
export function loadProgress(): PersistedProgress | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const progress = JSON.parse(stored) as PersistedProgress;
        console.log('[Progress] Loaded from localStorage, saved at:', new Date(progress.savedAt).toLocaleString());
        return progress;
    } catch (error) {
        console.error('[Progress] Failed to load:', error);
        return null;
    }
}

/**
 * Clear saved progress
 */
export function clearProgress(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Progress] Cleared');
}

/**
 * Hook to handle progress persistence
 * - Loads progress on mount
 * - Auto-saves on scoring/achievement changes
 */
export function useProgressPersistence(): void {
    // Load progress on initial mount
    useEffect(() => {
        const progress = loadProgress();
        if (progress) {
            // Apply loaded progress to store
            useGameStore.setState((state) => ({
                ...state,
                scoring: progress.scoring,
                achievements: progress.achievements,
            }));
        }
    }, []);

    // Subscribe to changes and auto-save
    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(
            (state) => ({ scoring: state.scoring, achievements: state.achievements }),
            () => {
                // Debounce saves - only save after changes settle
                const timeoutId = setTimeout(() => {
                    saveProgress();
                }, 1000);

                return () => clearTimeout(timeoutId);
            },
            { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
        );

        return unsubscribe;
    }, []);
}
