import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketEngine, createMarketEngine } from './MarketEngine';
import type { Asset } from '../types';

// Test assets
const testAssets: Asset[] = [
    {
        ticker: 'ZAP',
        name: 'ZappyTech',
        assetType: 'stock',
        sector: 'tech',
        riskRating: 2,
        basePrice: 150,
        volatility: 0.08,
        description: 'Tech company',
        icon: 'zap',
    },
    {
        ticker: 'RKB',
        name: 'RocketBurger',
        assetType: 'stock',
        sector: 'food',
        riskRating: 1,
        basePrice: 35,
        volatility: 0.04,
        description: 'Fast food',
        icon: 'burger',
    },
    {
        ticker: 'GEN',
        name: 'GeneGlow',
        assetType: 'stock',
        sector: 'health',
        riskRating: 4,
        basePrice: 120,
        volatility: 0.12,
        description: 'Biotech',
        icon: 'dna',
    },
];

describe('MarketEngine', () => {
    let engine: MarketEngine;

    beforeEach(() => {
        engine = createMarketEngine(testAssets, { seed: 12345 });
    });

    describe('initialization', () => {
        it('should initialize with base prices from assets', () => {
            expect(engine.getPrice('ZAP')).toBe(150);
            expect(engine.getPrice('RKB')).toBe(35);
            expect(engine.getPrice('GEN')).toBe(120);
        });

        it('should return undefined for unknown ticker', () => {
            expect(engine.getPrice('UNKNOWN')).toBeUndefined();
        });

        it('should initialize all assets', () => {
            const assets = engine.getAllAssets();
            expect(assets.length).toBe(3);
        });

        it('should start at turn 0', () => {
            expect(engine.getTurn()).toBe(0);
        });

        it('should have initial price history', () => {
            const history = engine.getPriceHistory('ZAP');
            expect(history.length).toBe(1);
            expect(history[0].price).toBe(150);
            expect(history[0].turn).toBe(0);
        });
    });

    describe('tick()', () => {
        it('should update all prices on tick', () => {
            engine.getPrices(); // Get initial state
            const result = engine.tick();

            expect(result.turn).toBe(1);
            expect(result.changes.length).toBe(3);

            // At least some prices should have changed
            const pricesChanged = result.changes.some(c => c.change !== 0);
            expect(pricesChanged).toBe(true);
        });

        it('should store price history up to limit', () => {
            const engine = createMarketEngine(testAssets, {
                seed: 42,
                maxHistoryLength: 5
            });

            // Tick 10 times
            for (let i = 0; i < 10; i++) {
                engine.tick();
            }

            const history = engine.getPriceHistory('ZAP');
            expect(history.length).toBe(5);
            expect(history[history.length - 1].turn).toBe(10);
        });

        it('should emit price change callbacks', () => {
            const callback = vi.fn();
            const unsubscribe = engine.onPriceChange(callback);

            engine.tick();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(expect.any(Array));

            unsubscribe();
            engine.tick();

            // Should not be called after unsubscribe
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should reset to initial state', () => {
            engine.tick();
            engine.tick();

            expect(engine.getTurn()).toBe(2);
            expect(engine.getPrice('ZAP')).not.toBe(150);

            engine.reset();

            expect(engine.getTurn()).toBe(0);
            expect(engine.getPrice('ZAP')).toBe(150);
            expect(engine.getPriceHistory('ZAP').length).toBe(1);
        });
    });

    describe('applyEvent()', () => {
        it('should apply scheduled events at correct turn', () => {
            // Apply 15% increase to ZAP
            engine.applyEvent('ZAP', 0.15, 'event_1');

            const result = engine.tick();

            // ZAP should have increased by ~15%
            const zapChange = result.changes.find(c => c.ticker === 'ZAP');
            expect(zapChange?.newPrice).toBeCloseTo(172.5, 1); // 150 * 1.15
            expect(result.triggeredEvents).toContain('event_1');
        });

        it('should apply market-wide events', () => {
            engine.applyEvent('all', -0.1, 'crash_1');

            const result = engine.tick();

            // All stocks should drop ~10%
            for (const change of result.changes) {
                expect(change.changePercent).toBeCloseTo(-0.1, 1);
            }
        });
    });

    describe('getState()', () => {
        it('should export complete market state', () => {
            engine.tick();
            engine.tick();

            const state = engine.getState();

            expect(state.turn).toBe(2);
            expect(Object.keys(state.prices).length).toBe(3);
            expect(Object.keys(state.priceHistory).length).toBe(3);
            expect(state.priceHistory['ZAP'].length).toBe(3); // Initial + 2 ticks
        });
    });

    describe('performance', () => {
        it('should tick 100 assets in under 5ms', () => {
            // Create 100 test assets
            const manyAssets: Asset[] = [];
            for (let i = 0; i < 100; i++) {
                manyAssets.push({
                    ticker: `TST${i}`,
                    name: `Test Stock ${i}`,
                    assetType: 'stock',
                    sector: 'tech',
                    riskRating: 2,
                    basePrice: 100 + i,
                    volatility: 0.05 + (i % 10) * 0.01,
                    description: 'Test',
                    icon: 'test',
                });
            }

            const bigEngine = createMarketEngine(manyAssets, { seed: 42 });

            const result = bigEngine.tick();

            expect(result.changes.length).toBe(100);
            expect(result.computeTimeMs).toBeLessThan(5);
        });
    });
});
