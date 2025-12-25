import { describe, it, expect } from 'vitest';
import { SeededRandom, createRandom, pickRandom, weightedChoice } from './random';

describe('SeededRandom', () => {
    it('should produce deterministic sequences', () => {
        const rng1 = new SeededRandom(12345);
        const rng2 = new SeededRandom(12345);

        const seq1 = [rng1.next(), rng1.next(), rng1.next()];
        const seq2 = [rng2.next(), rng2.next(), rng2.next()];

        expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences for different seeds', () => {
        const rng1 = new SeededRandom(12345);
        const rng2 = new SeededRandom(54321);

        expect(rng1.next()).not.toBe(rng2.next());
    });

    it('should generate values in [0, 1)', () => {
        const rng = new SeededRandom(42);

        for (let i = 0; i < 100; i++) {
            const val = rng.next();
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThan(1);
        }
    });

    it('should generate integers in range', () => {
        const rng = new SeededRandom(42);

        for (let i = 0; i < 100; i++) {
            const val = rng.nextInt(5, 10);
            expect(val).toBeGreaterThanOrEqual(5);
            expect(val).toBeLessThanOrEqual(10);
            expect(Number.isInteger(val)).toBe(true);
        }
    });

    it('should generate floats in range', () => {
        const rng = new SeededRandom(42);

        for (let i = 0; i < 100; i++) {
            const val = rng.nextFloat(-5, 5);
            expect(val).toBeGreaterThanOrEqual(-5);
            expect(val).toBeLessThan(5);
        }
    });

    it('should generate booleans with probability', () => {
        const rng = new SeededRandom(42);

        let trueCount = 0;
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
            if (rng.nextBool(0.7)) trueCount++;
        }

        // Expect roughly 70% true
        expect(trueCount / iterations).toBeGreaterThan(0.6);
        expect(trueCount / iterations).toBeLessThan(0.8);
    });

    it('should pick from array', () => {
        const rng = new SeededRandom(42);
        const items = ['a', 'b', 'c', 'd'];

        for (let i = 0; i < 20; i++) {
            const pick = rng.pick(items);
            expect(items).toContain(pick);
        }

        expect(rng.pick([])).toBeUndefined();
    });

    it('should shuffle array', () => {
        const rng = new SeededRandom(42);
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled = rng.shuffle(original);

        // Should have same elements (spread to copy before sort since sort mutates)
        expect([...shuffled].sort((a, b) => a - b)).toEqual(original);

        // Should be in different order (very unlikely to be same)
        expect(shuffled.join(',')).not.toBe(original.join(','));

        // Original should be unchanged
        expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should generate Gaussian distribution', () => {
        const rng = new SeededRandom(42);
        const samples: number[] = [];

        for (let i = 0; i < 1000; i++) {
            samples.push(rng.nextGaussian(50, 5));
        }

        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        expect(mean).toBeGreaterThan(48);
        expect(mean).toBeLessThan(52);
    });

    it('should reset to seed', () => {
        const rng = new SeededRandom(42);
        const first = rng.next();

        rng.next();
        rng.next();
        rng.reset(42);

        expect(rng.next()).toBe(first);
    });
});

describe('createRandom', () => {
    it('should create new generator with seed', () => {
        const rng = createRandom(12345);
        expect(rng.next()).toBeGreaterThanOrEqual(0);
    });
});

describe('pickRandom', () => {
    it('should pick from array', () => {
        const items = [1, 2, 3, 4, 5];
        const pick = pickRandom(items);
        expect(items).toContain(pick);
    });

    it('should return undefined for empty array', () => {
        expect(pickRandom([])).toBeUndefined();
    });
});

describe('weightedChoice', () => {
    it('should respect weights', () => {
        const items = ['a', 'b', 'c'];
        const weights = [0, 0, 1]; // Always pick 'c'

        for (let i = 0; i < 10; i++) {
            expect(weightedChoice(items, weights)).toBe('c');
        }
    });

    it('should handle empty arrays', () => {
        expect(weightedChoice([], [])).toBeUndefined();
    });

    it('should handle mismatched lengths', () => {
        expect(weightedChoice([1, 2], [1])).toBeUndefined();
    });
});
