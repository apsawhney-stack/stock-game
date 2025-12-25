/**
 * ScoringEngine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine } from './ScoringEngine';
import { XP_VALUES, DAILY_XP_CAP } from './types';

describe('ScoringEngine', () => {
    let engine: ScoringEngine;

    beforeEach(() => {
        engine = new ScoringEngine();
    });

    describe('Basic XP Awards', () => {
        it('should award XP for completing a level', () => {
            const event = engine.awardXP('complete_level');

            expect(event).not.toBeNull();
            expect(event!.action).toBe('complete_level');
            expect(event!.amount).toBe(XP_VALUES.complete_level);
            expect(engine.getSessionXP()).toBe(100);
        });

        it('should award XP for holding through dip', () => {
            const event = engine.awardXP('hold_through_dip');

            expect(event).not.toBeNull();
            expect(event!.amount).toBe(25);
        });

        it('should award XP for reading news', () => {
            const event = engine.awardXP('read_news');

            expect(event).not.toBeNull();
            expect(event!.amount).toBe(5);
        });

        it('should track XP history', () => {
            engine.awardXP('read_news');
            engine.awardXP('complete_level');

            const state = engine.getState();
            expect(state.xpHistory.length).toBe(2);
        });
    });

    describe('Daily XP Cap', () => {
        it('should enforce daily XP cap', () => {
            // Award XP up to cap
            for (let i = 0; i < 10; i++) {
                engine.awardXP('complete_level'); // 100 XP each
            }

            const state = engine.getState();
            expect(state.todayXP).toBe(DAILY_XP_CAP); // 500
        });

        it('should return null when cap is reached', () => {
            // Fill up to cap
            for (let i = 0; i < 5; i++) {
                engine.awardXP('complete_level'); // 100 XP each = 500
            }

            // This should return null
            const event = engine.awardXP('read_news');
            expect(event).toBeNull();
        });

        it('should partially award if near cap', () => {
            // Award 480 XP (4 * 100 + 4 * 20)
            for (let i = 0; i < 4; i++) {
                engine.awardXP('complete_level'); // 400 XP
            }
            for (let i = 0; i < 4; i++) {
                engine.awardXP('hold_through_dip'); // 100 XP (25 * 4)
            }
            // Now at 500, so next should be null
            const event = engine.awardXP('read_news');
            expect(event).toBeNull();
        });

        it('should report remaining daily XP', () => {
            engine.awardXP('complete_level'); // 100 XP
            expect(engine.getRemainingDailyXP()).toBe(400);
        });

        it('should report when cap is reached', () => {
            for (let i = 0; i < 5; i++) {
                engine.awardXP('complete_level');
            }
            expect(engine.isDailyCapReached()).toBe(true);
        });
    });

    describe('Replay Multiplier', () => {
        it('should apply 50% XP for replays', () => {
            const event = engine.awardXP('complete_level', { isReplay: true });

            expect(event).not.toBeNull();
            expect(event!.amount).toBe(50); // 100 * 0.5
        });
    });

    describe('Recording Actions', () => {
        it('should record news read and award XP', () => {
            const event = engine.recordNewsRead(1);

            expect(event).not.toBeNull();
            expect(engine.getState().newsCardsRead).toBe(1);
        });

        it('should record diversified turn and award XP', () => {
            const event = engine.recordDiversifiedTurn(3, 1);

            expect(event).not.toBeNull();
            expect(engine.getState().diversifiedTurns).toBe(1);
            expect(event!.amount).toBe(10);
        });

        it('should not award diversification XP if below threshold', () => {
            const event = engine.recordDiversifiedTurn(2, 1); // Only 2 stocks

            expect(event).toBeNull();
            expect(engine.getState().diversifiedTurns).toBe(0);
        });

        it('should record held through dip', () => {
            const event = engine.recordHeldThroughDip('BURG', -0.15, 1);

            expect(event).not.toBeNull();
            expect(engine.getState().heldThroughDips).toBe(1);
        });

        it('should not award dip XP if drop too small', () => {
            const event = engine.recordHeldThroughDip('BURG', -0.05, 1);

            expect(event).toBeNull();
            expect(engine.getState().heldThroughDips).toBe(0);
        });

        it('should record limit order fill', () => {
            const event = engine.recordLimitOrderFill('TECH', 1);

            expect(event).not.toBeNull();
            expect(engine.getState().limitOrdersFilled).toBe(1);
        });

        it('should record undo usage', () => {
            engine.recordUndoUsed();
            expect(engine.getState().usedUndo).toBe(true);
        });
    });

    describe('Mission End XP', () => {
        it('should award XP for completing mission', () => {
            const events = engine.calculateMissionEndXP({
                completed: true,
                beatBenchmark: false,
                isReplay: false,
            });

            expect(events.length).toBe(2); // complete_level + no_undo_used
            const totalXP = events.reduce((sum, e) => sum + e.amount, 0);
            expect(totalXP).toBe(130); // 100 + 30
        });

        it('should award benchmark bonus', () => {
            const events = engine.calculateMissionEndXP({
                completed: true,
                beatBenchmark: true,
                isReplay: false,
            });

            expect(events.length).toBe(3);
            expect(events.some(e => e.action === 'beat_benchmark')).toBe(true);
        });

        it('should not award no-undo bonus if undo was used', () => {
            engine.recordUndoUsed();

            const events = engine.calculateMissionEndXP({
                completed: true,
                beatBenchmark: false,
                isReplay: false,
            });

            expect(events.every(e => e.action !== 'no_undo_used')).toBe(true);
        });

        it('should award reduced XP for replay', () => {
            const events = engine.calculateMissionEndXP({
                completed: true,
                beatBenchmark: false,
                isReplay: true,
            });

            expect(events.some(e => e.action === 'level_replay')).toBe(true);
            expect(events.some(e => e.amount === 50)).toBe(true);
        });
    });

    describe('Reset', () => {
        it('should reset for new mission', () => {
            engine.awardXP('complete_level');
            engine.recordNewsRead(1);
            engine.recordUndoUsed();

            engine.resetForMission();

            const state = engine.getState();
            expect(state.sessionXP).toBe(0);
            expect(state.xpHistory.length).toBe(0);
            expect(state.usedUndo).toBe(false);
            expect(state.newsCardsRead).toBe(0);
            // todayXP should be preserved
            expect(state.todayXP).toBe(105); // previous XP still counts
        });

        it('should fully reset all state', () => {
            engine.awardXP('complete_level');
            engine.reset();

            const state = engine.getState();
            expect(state.sessionXP).toBe(0);
            expect(state.todayXP).toBe(0);
        });
    });
});
