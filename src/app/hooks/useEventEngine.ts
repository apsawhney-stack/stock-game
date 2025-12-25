/**
 * useEventEngine Hook
 * 
 * Manages the EventEngine lifecycle and syncs with Zustand store.
 * Processes events when turns advance and updates store with triggered events.
 */

import { useEffect, useRef, useCallback } from 'react';
import { EventEngine, EventRegistry } from '../../core/events';
import type { GameEvent, TriggeredEvent } from '../../core/events/types';
import { useGameStore, useGameActions } from '../store';
import { GAME_STOCKS } from './useMarketEngine';

// Import events data
import eventsData from '../../../data/events.json';

/**
 * Build a ticker-to-sector mapping from GAME_STOCKS
 */
function buildTickerSectors(): Record<string, string> {
    return GAME_STOCKS.reduce((acc, stock) => {
        acc[stock.ticker] = stock.sector;
        return acc;
    }, {} as Record<string, string>);
}

/**
 * Get list of available tickers
 */
function getAvailableTickers(): string[] {
    return GAME_STOCKS.map(s => s.ticker);
}

/**
 * Hook to manage EventEngine and sync with store
 */
export function useEventEngine() {
    const engineRef = useRef<EventEngine | null>(null);
    const registryRef = useRef<EventRegistry | null>(null);
    const lastProcessedTurn = useRef<number>(-1);

    const { triggerEvents } = useGameActions();
    const sessionPhase = useGameStore((state) => state.session.phase);
    const currentTurn = useGameStore((state) => state.session.turn);

    // Initialize engine when game starts
    useEffect(() => {
        if (sessionPhase === 'playing' && !engineRef.current) {
            // Create registry and load events
            registryRef.current = new EventRegistry();
            registryRef.current.registerMany(eventsData.events as GameEvent[]);

            // Create engine with deterministic seed
            const seed = Date.now();
            engineRef.current = new EventEngine(registryRef.current, undefined, seed);

            // Reset last processed turn
            lastProcessedTurn.current = -1;
        }

        // Cleanup on game end
        return () => {
            if (sessionPhase === 'menu' || sessionPhase === 'results') {
                engineRef.current = null;
                registryRef.current = null;
            }
        };
    }, [sessionPhase]);

    // Process events when turn changes
    useEffect(() => {
        if (
            sessionPhase === 'playing' &&
            engineRef.current &&
            currentTurn > 0 &&
            currentTurn !== lastProcessedTurn.current
        ) {
            const tickerSectors = buildTickerSectors();
            const availableTickers = getAvailableTickers();

            // Process events for current turn
            const events = engineRef.current.processEvents(
                currentTurn,
                availableTickers,
                tickerSectors
            );

            // Update store with triggered events
            if (events.length > 0) {
                triggerEvents(events);
            }

            lastProcessedTurn.current = currentTurn;
        }
    }, [currentTurn, sessionPhase, triggerEvents]);

    /**
     * Schedule an event for a specific turn
     */
    const scheduleEvent = useCallback((event: GameEvent, turn: number) => {
        if (engineRef.current) {
            engineRef.current.scheduleEvent(event, turn);
        }
    }, []);

    /**
     * Get event history
     */
    const getHistory = useCallback((): TriggeredEvent[] => {
        return engineRef.current?.getHistory() ?? [];
    }, []);

    /**
     * Reset engine state
     */
    const resetEvents = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.reset();
        }
    }, []);

    return {
        scheduleEvent,
        getHistory,
        resetEvents,
        engine: engineRef.current,
        registry: registryRef.current,
    };
}
