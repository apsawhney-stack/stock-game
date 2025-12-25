/**
 * EventEngine
 * Manages game events per GDD Section 4.4
 */

import type {
    GameEvent,
    ScheduledEvent,
    TriggeredEvent,
    EventScheduleConfig,
    EventImpact
} from './types';
import { DEFAULT_EVENT_CONFIG } from './types';
import { createRandom } from '../utils/random';

/** Event registry - holds all possible events */
export class EventRegistry {
    private events: Map<string, GameEvent> = new Map();

    register(event: GameEvent): void {
        this.events.set(event.id, event);
    }

    registerMany(events: GameEvent[]): void {
        events.forEach(e => this.register(e));
    }

    get(id: string): GameEvent | undefined {
        return this.events.get(id);
    }

    getByCategory(category: string): GameEvent[] {
        return Array.from(this.events.values())
            .filter(e => e.category === category);
    }

    getAll(): GameEvent[] {
        return Array.from(this.events.values());
    }
}

/** EventEngine - schedules and processes events */
export class EventEngine {
    private scheduledEvents: ScheduledEvent[] = [];
    private triggeredHistory: TriggeredEvent[] = [];
    private registry: EventRegistry;
    private config: EventScheduleConfig;
    private seed: number;

    constructor(
        registry: EventRegistry,
        config: EventScheduleConfig = DEFAULT_EVENT_CONFIG,
        seed?: number
    ) {
        this.registry = registry;
        this.config = config;
        this.seed = seed ?? Date.now();
    }

    /** Schedule an event for a specific turn */
    scheduleEvent(event: GameEvent, turn: number): void {
        this.scheduledEvents.push({ event, triggerTurn: turn });
    }

    /** Schedule multiple events */
    scheduleEvents(events: ScheduledEvent[]): void {
        this.scheduledEvents.push(...events);
    }

    /** Get events scheduled for upcoming turns */
    getUpcomingEvents(currentTurn: number, lookahead: number = 3): ScheduledEvent[] {
        return this.scheduledEvents.filter(
            e => e.triggerTurn > currentTurn && e.triggerTurn <= currentTurn + lookahead
        );
    }

    /** Process events for current turn and return triggered events */
    processEvents(
        currentTurn: number,
        availableTickers: string[],
        tickerSectors: Record<string, string>
    ): TriggeredEvent[] {
        const triggered: TriggeredEvent[] = [];

        // 1. Process scheduled events for this turn
        const scheduledForNow = this.scheduledEvents.filter(
            e => e.triggerTurn === currentTurn
        );

        for (const scheduled of scheduledForNow) {
            const triggered_event = this.createTriggeredEvent(
                scheduled.event,
                currentTurn,
                availableTickers,
                tickerSectors
            );
            triggered.push(triggered_event);
        }

        // Remove processed scheduled events
        this.scheduledEvents = this.scheduledEvents.filter(
            e => e.triggerTurn !== currentTurn
        );

        // 2. Maybe generate random event (if room)
        if (triggered.length < this.config.maxEventsPerTurn) {
            const random = createRandom(this.seed + currentTurn);
            if (random.next() < this.config.randomEventProbability) {
                const randomEvent = this.pickRandomEvent(currentTurn);
                if (randomEvent) {
                    const triggered_event = this.createTriggeredEvent(
                        randomEvent,
                        currentTurn,
                        availableTickers,
                        tickerSectors
                    );
                    triggered.push(triggered_event);
                }
            }
        }

        // Store in history
        this.triggeredHistory.push(...triggered);

        return triggered;
    }

    /** Calculate price impacts for an event */
    calculateImpacts(
        impact: EventImpact,
        availableTickers: string[],
        tickerSectors: Record<string, string>
    ): Record<string, number> {
        const impacts: Record<string, number> = {};

        if (impact.scope === 'all') {
            // Market-wide event
            for (const ticker of availableTickers) {
                impacts[ticker] = impact.priceChange;
            }
        } else if (impact.scope === 'sector' && impact.sector) {
            // Sector event
            for (const ticker of availableTickers) {
                if (tickerSectors[ticker] === impact.sector) {
                    impacts[ticker] = impact.priceChange;
                }
            }
        } else if (Array.isArray(impact.scope)) {
            // Specific tickers
            for (const ticker of impact.scope) {
                if (availableTickers.includes(ticker)) {
                    impacts[ticker] = impact.priceChange;
                }
            }
        }

        return impacts;
    }

    /** Get triggered event history */
    getHistory(): TriggeredEvent[] {
        return [...this.triggeredHistory];
    }

    /** Get recent events (last N) */
    getRecentEvents(count: number = 5): TriggeredEvent[] {
        return this.triggeredHistory.slice(-count);
    }

    /** Reset engine state */
    reset(): void {
        this.scheduledEvents = [];
        this.triggeredHistory = [];
    }

    /** Pick a random event from registry */
    private pickRandomEvent(turn: number): GameEvent | null {
        const allEvents = this.registry.getAll();
        if (allEvents.length === 0) return null;

        const random = createRandom(this.seed + turn + this.triggeredHistory.length);
        return random.pick(allEvents) ?? null;
    }

    /** Create a triggered event with calculated impacts */
    private createTriggeredEvent(
        event: GameEvent,
        turn: number,
        availableTickers: string[],
        tickerSectors: Record<string, string>
    ): TriggeredEvent {
        const priceImpacts = this.calculateImpacts(
            event.impact,
            availableTickers,
            tickerSectors
        );

        return {
            ...event,
            triggeredAt: turn,
            affectedTickers: Object.keys(priceImpacts),
            priceImpacts,
        };
    }
}
