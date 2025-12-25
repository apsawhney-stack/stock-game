/**
 * useMarketEngine Hook
 * 
 * Manages the MarketEngine lifecycle and syncs with Zustand store.
 */

import { useEffect, useRef, useCallback } from 'react';
import { MarketEngine, createMarketEngine } from '../../core/market/MarketEngine';
import type { Asset, TickResult } from '../../core/types';
import { useGameStore, useGameActions } from '../store';

// Mock stock data for the game (kid-friendly companies)
export const GAME_STOCKS: Asset[] = [
    {
        ticker: 'BURG',
        name: 'RocketBurger',
        assetType: 'stock',
        sector: 'food',
        riskRating: 1,
        basePrice: 25.50,
        volatility: 0.04,
        description: 'Fast food chain loved by kids everywhere!',
        icon: '🍔',
    },
    {
        ticker: 'TECH',
        name: 'CloudKids',
        assetType: 'stock',
        sector: 'tech',
        riskRating: 2,
        basePrice: 45.00,
        volatility: 0.08,
        description: 'Video game streaming platform for families.',
        icon: '☁️',
    },
    {
        ticker: 'HLTH',
        name: 'VitaJuice',
        assetType: 'stock',
        sector: 'health',
        riskRating: 1,
        basePrice: 32.75,
        volatility: 0.05,
        description: 'Healthy drinks and snacks company.',
        icon: '🥤',
    },
    {
        ticker: 'ENGY',
        name: 'SolarPets',
        assetType: 'stock',
        sector: 'energy',
        riskRating: 3,
        basePrice: 18.25,
        volatility: 0.10,
        description: 'Solar panels shaped like cute animals.',
        icon: '☀️',
    },
];

/**
 * Hook to manage MarketEngine and sync with store
 */
export function useMarketEngine() {
    const engineRef = useRef<MarketEngine | null>(null);
    const { updatePrices } = useGameActions();
    const sessionPhase = useGameStore((state) => state.session.phase);

    // Initialize engine when game starts
    useEffect(() => {
        if (sessionPhase === 'playing' && !engineRef.current) {
            // Create engine with deterministic seed for reproducibility
            const seed = Date.now();
            engineRef.current = createMarketEngine(GAME_STOCKS, { seed });

            // Sync initial prices to store
            const initialPrices = engineRef.current.getPrices();
            updatePrices(initialPrices as Record<string, number>);
        }

        // Cleanup on unmount or game end
        return () => {
            if (sessionPhase === 'menu' || sessionPhase === 'results') {
                engineRef.current = null;
            }
        };
    }, [sessionPhase, updatePrices]);

    /**
     * Advance market by one tick and sync to store
     */
    const tickMarket = useCallback((): TickResult | null => {
        if (!engineRef.current) {
            // Create engine if it doesn't exist yet
            engineRef.current = createMarketEngine(GAME_STOCKS, { seed: Date.now() });
        }

        const result = engineRef.current.tick();
        updatePrices(result.prices as Record<string, number>);
        return result;
    }, [updatePrices]);

    /**
     * Get all available stocks
     */
    const getStocks = useCallback((): readonly Asset[] => {
        return GAME_STOCKS;
    }, []);

    /**
     * Get current prices from engine
     */
    const getPrices = useCallback((): Record<string, number> => {
        if (!engineRef.current) {
            // Return base prices if engine not initialized
            return GAME_STOCKS.reduce((acc, stock) => {
                acc[stock.ticker] = stock.basePrice;
                return acc;
            }, {} as Record<string, number>);
        }
        return engineRef.current.getPrices() as Record<string, number>;
    }, []);

    /**
     * Reset market to initial state
     */
    const resetMarket = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.reset();
            updatePrices(engineRef.current.getPrices() as Record<string, number>);
        }
    }, [updatePrices]);

    return {
        tickMarket,
        getStocks,
        getPrices,
        resetMarket,
        engine: engineRef.current,
    };
}
