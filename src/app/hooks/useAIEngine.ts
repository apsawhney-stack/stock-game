/**
 * useAIEngine Hook
 * 
 * Manages the AIEngine lifecycle and syncs with Zustand store.
 * Processes AI decisions each turn and provides comparison data.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AIEngine, StockInfo } from '../../core/ai/AIEngine';
import type { AIComparisonResult, AIDecision } from '../../core/ai/types';
import { useGameStore, useGameActions } from '../store';

/**
 * Hook to manage AIEngine
 */
export function useAIEngine() {
    const engineRef = useRef<AIEngine | null>(null);
    const lastProcessedTurn = useRef<number>(-1);

    const { updateAIPortfolio, recordAIDecision, resetAI, addNotification } = useGameActions();

    const sessionPhase = useGameStore((state) => state.session.phase);
    const currentTurn = useGameStore((state) => state.session.turn);
    const startingCash = useGameStore((state) => state.session.startingCash);
    const prices = useGameStore((state) => state.market.prices);
    const previousPrices = useGameStore((state) => state.market.previousPrices);

    // Initialize engine when game starts
    useEffect(() => {
        if (sessionPhase === 'playing' && !engineRef.current) {
            engineRef.current = new AIEngine('nancy', startingCash);
            lastProcessedTurn.current = -1;

            // Reset AI state in store
            resetAI();
        }

        // Cleanup on game end
        if (sessionPhase === 'menu' && engineRef.current) {
            engineRef.current = null;
        }
    }, [sessionPhase, startingCash, resetAI]);

    // Process AI turn when turn advances
    useEffect(() => {
        if (
            sessionPhase === 'playing' &&
            engineRef.current &&
            currentTurn > 0 &&
            currentTurn !== lastProcessedTurn.current &&
            Object.keys(prices).length > 0
        ) {
            // Build stock info from store
            const stocks: StockInfo[] = Object.entries(prices).map(([ticker, price]) => ({
                ticker,
                price,
                previousPrice: previousPrices[ticker] ?? price,
                sector: getStockSector(ticker),
            }));

            // Process AI turn
            const decision = engineRef.current.processTurn(currentTurn, stocks);

            // Update store
            recordAIDecision(decision);

            // Calculate new total value
            const totalValue = engineRef.current.calculateTotalValue(stocks);
            const state = engineRef.current.getState();

            updateAIPortfolio({
                cash: state.cash,
                holdings: state.holdings,
                totalValue,
            });

            // Show notification for AI action (except hold)
            if (decision.action !== 'hold') {
                const persona = engineRef.current.getPersona();
                const actionText = decision.action === 'buy'
                    ? `bought ${decision.quantity} ${decision.ticker}`
                    : `sold ${decision.quantity} ${decision.ticker}`;

                addNotification({
                    type: 'info',
                    message: `${persona.emoji} ${persona.name} ${actionText}`,
                    duration: 3000,
                });
            }

            lastProcessedTurn.current = currentTurn;
        }
    }, [currentTurn, sessionPhase, prices, previousPrices, recordAIDecision, updateAIPortfolio, addNotification]);

    /**
     * Get comparison result at end of game
     */
    const getComparison = useCallback((playerReturn: number): AIComparisonResult | null => {
        if (!engineRef.current) return null;
        return engineRef.current.generateComparison(playerReturn, startingCash);
    }, [startingCash]);

    /**
     * Get last decision for UI display
     */
    const getLastDecision = useCallback((): AIDecision | null => {
        return engineRef.current?.getState().lastDecision ?? null;
    }, []);

    return {
        getComparison,
        getLastDecision,
        engine: engineRef.current,
    };
}

/**
 * Get sector for a ticker (should match GAME_STOCKS)
 */
function getStockSector(ticker: string): string {
    const sectors: Record<string, string> = {
        BURG: 'food',
        TECH: 'tech',
        HLTH: 'health',
        ENGY: 'energy',
    };
    return sectors[ticker] ?? 'unknown';
}
