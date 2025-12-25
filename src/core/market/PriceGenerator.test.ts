import { describe, it, expect, beforeEach } from 'vitest';
import { generateNextPrice, calculateMomentum, generateInitialHistory, PriceContext } from './PriceGenerator';
import { SeededRandom } from '../utils/random';
import type { Asset } from '../types';

describe('calculateMomentum', () => {
    it('should return 0 for insufficient data', () => {
        expect(calculateMomentum([])).toBe(0);
        expect(calculateMomentum([100])).toBe(0);
    });

    it('should return positive for uptrend', () => {
        const prices = [100, 105, 110, 115, 120];
        expect(calculateMomentum(prices)).toBeGreaterThan(0);
    });

    it('should return negative for downtrend', () => {
        const prices = [120, 115, 110, 105, 100];
        expect(calculateMomentum(prices)).toBeLessThan(0);
    });

    it('should be clamped to [-1, 1]', () => {
        const extremeUp = [10, 20, 40, 80, 160]; // Doubling each time
        expect(calculateMomentum(extremeUp)).toBeLessThanOrEqual(1);

        const extremeDown = [160, 80, 40, 20, 10];
        expect(calculateMomentum(extremeDown)).toBeGreaterThanOrEqual(-1);
    });
});

describe('generateNextPrice', () => {
    let rng: SeededRandom;

    beforeEach(() => {
        rng = new SeededRandom(12345);
    });

    it('should generate price within volatility bounds', () => {
        const context: PriceContext = {
            currentPrice: 100,
            volatility: 0.1,
            recentPrices: [98, 99, 100],
        };

        // Generate many prices, all should be within reasonable bounds
        for (let i = 0; i < 100; i++) {
            const result = generateNextPrice(context, rng);
            // With 10% volatility and capped at 3x, max change is 30%
            expect(result.price).toBeGreaterThan(70);
            expect(result.price).toBeLessThan(130);
            expect(result.price).toBeGreaterThan(0);
        }
    });

    it('should apply momentum correctly', () => {
        const uptrendContext: PriceContext = {
            currentPrice: 120,
            volatility: 0.05,
            recentPrices: [100, 105, 110, 115, 120],
        };

        let upCount = 0;
        const runs = 100;

        // With strong uptrend, should see more up moves
        for (let i = 0; i < runs; i++) {
            rng = new SeededRandom(i);
            const result = generateNextPrice(uptrendContext, rng);
            if (result.change > 0) upCount++;
        }

        // Should be more than random (50%)
        expect(upCount / runs).toBeGreaterThan(0.4);
    });

    it('should handle news event impact', () => {
        const context: PriceContext = {
            currentPrice: 100,
            volatility: 0.1,
            recentPrices: [100],
            eventImpact: 0.15, // +15%
            eventId: 'earnings_beat_1',
        };

        const result = generateNextPrice(context, rng);

        expect(result.price).toBe(115); // 100 * 1.15
        expect(result.trigger.type).toBe('news');
        if (result.trigger.type === 'news') {
            expect(result.trigger.eventId).toBe('earnings_beat_1');
        }
    });

    it('should be deterministic with same seed', () => {
        const context: PriceContext = {
            currentPrice: 100,
            volatility: 0.1,
            recentPrices: [100],
        };

        const rng1 = new SeededRandom(42);
        const rng2 = new SeededRandom(42);

        const result1 = generateNextPrice(context, rng1);
        const result2 = generateNextPrice(context, rng2);

        expect(result1.price).toBe(result2.price);
    });

    it('should never generate negative prices', () => {
        // Even with huge negative impact
        const context: PriceContext = {
            currentPrice: 1,
            volatility: 0.5,
            recentPrices: [10, 5, 2, 1], // Downtrend
            eventImpact: -0.99,
            eventId: 'crash',
        };

        const result = generateNextPrice(context, rng);
        expect(result.price).toBeGreaterThan(0);
    });
});

describe('generateInitialHistory', () => {
    it('should generate correct length history', () => {
        const asset: Asset = {
            ticker: 'TEST',
            name: 'Test Stock',
            assetType: 'stock',
            sector: 'tech',
            riskRating: 2,
            basePrice: 100,
            volatility: 0.1,
            description: 'Test',
            icon: 'test',
        };

        const rng = new SeededRandom(42);
        const history = generateInitialHistory(asset, 10, rng);

        expect(history.length).toBe(10);
        expect(history[0]).toBe(100); // First is base price
    });

    it('should generate reasonable price progression', () => {
        const asset: Asset = {
            ticker: 'TEST',
            name: 'Test Stock',
            assetType: 'stock',
            sector: 'tech',
            riskRating: 3,
            basePrice: 150,
            volatility: 0.08,
            description: 'Test',
            icon: 'test',
        };

        const rng = new SeededRandom(12345);
        const history = generateInitialHistory(asset, 20, rng);

        // All prices should be positive
        history.forEach(price => {
            expect(price).toBeGreaterThan(0);
        });

        // Prices should stay within reasonable range (not crazy swings)
        const min = Math.min(...history);
        const max = Math.max(...history);
        expect(min).toBeGreaterThan(50); // Not dropped more than 66%
        expect(max).toBeLessThan(400); // Not more than 2.6x growth
    });
});
