/**
 * EventEngine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventEngine, EventRegistry } from './EventEngine';
import type { GameEvent, EventScheduleConfig } from './types';

// Sample events for testing
const sampleEvents: GameEvent[] = [
    {
        id: 'test-event-1',
        category: 'earnings',
        headline: 'Company beats earnings!',
        description: 'Test company exceeded expectations.',
        explanation: 'Good earnings = higher price!',
        impact: {
            priceChange: 0.10,
            scope: ['ZAP'],
        },
        learningTip: 'Earnings matter!',
        iconEmoji: '📈',
    },
    {
        id: 'test-event-2',
        category: 'sector',
        headline: 'Tech sector boom!',
        description: 'All tech stocks are rising.',
        explanation: 'Sector trends affect all companies in that sector.',
        impact: {
            priceChange: 0.08,
            scope: 'sector',
            sector: 'tech',
        },
        iconEmoji: '💻',
    },
    {
        id: 'test-event-3',
        category: 'market',
        headline: 'Market crash!',
        description: 'Everything is down.',
        explanation: 'Sometimes the whole market drops.',
        impact: {
            priceChange: -0.05,
            scope: 'all',
        },
        iconEmoji: '📉',
    },
];

const testTickers = ['ZAP', 'RKB', 'GEN', 'MKT'];
const testSectors: Record<string, string> = {
    ZAP: 'tech',
    RKB: 'food',
    GEN: 'health',
    MKT: 'index',
};

describe('EventRegistry', () => {
    let registry: EventRegistry;

    beforeEach(() => {
        registry = new EventRegistry();
    });

    it('should register and retrieve events', () => {
        registry.register(sampleEvents[0]);
        expect(registry.get('test-event-1')).toBeDefined();
        expect(registry.get('test-event-1')?.headline).toBe('Company beats earnings!');
    });

    it('should register many events', () => {
        registry.registerMany(sampleEvents);
        expect(registry.getAll()).toHaveLength(3);
    });

    it('should filter by category', () => {
        registry.registerMany(sampleEvents);
        const earningsEvents = registry.getByCategory('earnings');
        expect(earningsEvents).toHaveLength(1);
        expect(earningsEvents[0].id).toBe('test-event-1');
    });

    it('should return undefined for unknown event', () => {
        expect(registry.get('unknown')).toBeUndefined();
    });
});

describe('EventEngine', () => {
    let registry: EventRegistry;
    let engine: EventEngine;

    beforeEach(() => {
        registry = new EventRegistry();
        registry.registerMany(sampleEvents);
        engine = new EventEngine(registry, undefined, 12345);
    });

    describe('Event Scheduling', () => {
        it('should schedule events for specific turns', () => {
            engine.scheduleEvent(sampleEvents[0], 5);
            const upcoming = engine.getUpcomingEvents(3, 3);
            expect(upcoming).toHaveLength(1);
            expect(upcoming[0].triggerTurn).toBe(5);
        });

        it('should schedule multiple events', () => {
            engine.scheduleEvents([
                { event: sampleEvents[0], triggerTurn: 3 },
                { event: sampleEvents[1], triggerTurn: 5 },
            ]);
            const upcoming = engine.getUpcomingEvents(1, 5);
            expect(upcoming).toHaveLength(2);
        });

        it('should only return events within lookahead window', () => {
            engine.scheduleEvent(sampleEvents[0], 10);
            const upcoming = engine.getUpcomingEvents(1, 3);
            expect(upcoming).toHaveLength(0);
        });
    });

    describe('Event Processing', () => {
        it('should process scheduled events on correct turn', () => {
            engine.scheduleEvent(sampleEvents[0], 5);

            // Turn 4: no events
            const turn4Events = engine.processEvents(4, testTickers, testSectors);
            expect(turn4Events.filter(e => e.id === 'test-event-1')).toHaveLength(0);

            // Turn 5: event fires
            const turn5Events = engine.processEvents(5, testTickers, testSectors);
            expect(turn5Events.some(e => e.id === 'test-event-1')).toBe(true);
        });

        it('should remove processed events from schedule', () => {
            engine.scheduleEvent(sampleEvents[0], 5);
            engine.processEvents(5, testTickers, testSectors);

            const upcoming = engine.getUpcomingEvents(4, 5);
            expect(upcoming).toHaveLength(0);
        });

        it('should store triggered events in history', () => {
            engine.scheduleEvent(sampleEvents[0], 5);
            engine.processEvents(5, testTickers, testSectors);

            const history = engine.getHistory();
            expect(history.some(e => e.id === 'test-event-1')).toBe(true);
        });
    });

    describe('Impact Calculation', () => {
        it('should calculate impacts for single ticker', () => {
            const impacts = engine.calculateImpacts(
                { priceChange: 0.10, scope: ['ZAP'] },
                testTickers,
                testSectors
            );
            expect(impacts).toEqual({ ZAP: 0.10 });
        });

        it('should calculate impacts for sector', () => {
            const impacts = engine.calculateImpacts(
                { priceChange: 0.08, scope: 'sector', sector: 'tech' },
                testTickers,
                testSectors
            );
            expect(impacts).toEqual({ ZAP: 0.08 });
        });

        it('should calculate impacts for all tickers', () => {
            const impacts = engine.calculateImpacts(
                { priceChange: -0.05, scope: 'all' },
                testTickers,
                testSectors
            );
            expect(Object.keys(impacts)).toHaveLength(4);
            expect(impacts['ZAP']).toBe(-0.05);
            expect(impacts['RKB']).toBe(-0.05);
        });

        it('should ignore tickers not in available list', () => {
            const impacts = engine.calculateImpacts(
                { priceChange: 0.10, scope: ['UNKNOWN'] },
                testTickers,
                testSectors
            );
            expect(impacts).toEqual({});
        });
    });

    describe('Random Events', () => {
        it('should generate deterministic random events with seed', () => {
            const config: EventScheduleConfig = {
                randomEventProbability: 1.0, // Always generate
                earningsProbability: 0.2,
                maxEventsPerTurn: 2,
            };

            const engine1 = new EventEngine(registry, config, 12345);
            const engine2 = new EventEngine(registry, config, 12345);

            const events1 = engine1.processEvents(1, testTickers, testSectors);
            const events2 = engine2.processEvents(1, testTickers, testSectors);

            expect(events1.length).toBeGreaterThan(0);
            expect(events2.length).toBeGreaterThan(0);
            expect(events1[0].id).toBe(events2[0].id);
        });
    });

    describe('Reset', () => {
        it('should reset all state', () => {
            engine.scheduleEvent(sampleEvents[0], 5);
            engine.processEvents(5, testTickers, testSectors);

            engine.reset();

            expect(engine.getUpcomingEvents(1, 10)).toHaveLength(0);
            expect(engine.getHistory()).toHaveLength(0);
        });
    });

    describe('Recent Events', () => {
        it('should return most recent events', () => {
            engine.scheduleEvent(sampleEvents[0], 1);
            engine.scheduleEvent(sampleEvents[1], 2);
            engine.scheduleEvent(sampleEvents[2], 3);

            engine.processEvents(1, testTickers, testSectors);
            engine.processEvents(2, testTickers, testSectors);
            engine.processEvents(3, testTickers, testSectors);

            const recent = engine.getRecentEvents(2);
            expect(recent).toHaveLength(2);
        });
    });
});
