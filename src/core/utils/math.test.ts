import { describe, it, expect } from 'vitest';
import {
    clamp,
    lerp,
    percentChange,
    roundTo,
    roundPrice,
    randomGaussian,
    weightedAverage,
    average,
    standardDeviation,
    minMax,
    compoundGrowth,
    isApproximately,
} from './math';

describe('clamp', () => {
    it('should constrain value to range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
    });
});

describe('lerp', () => {
    it('should interpolate linearly', () => {
        expect(lerp(0, 100, 0)).toBe(0);
        expect(lerp(0, 100, 1)).toBe(100);
        expect(lerp(0, 100, 0.5)).toBe(50);
        expect(lerp(10, 20, 0.25)).toBe(12.5);
    });

    it('should clamp t to [0, 1]', () => {
        expect(lerp(0, 100, -0.5)).toBe(0);
        expect(lerp(0, 100, 1.5)).toBe(100);
    });
});

describe('percentChange', () => {
    it('should calculate correctly', () => {
        expect(percentChange(100, 110)).toBe(0.1); // 10% increase
        expect(percentChange(100, 90)).toBe(-0.1); // 10% decrease
        expect(percentChange(100, 100)).toBe(0);
        expect(percentChange(50, 75)).toBe(0.5); // 50% increase
    });

    it('should handle zero', () => {
        expect(percentChange(0, 100)).toBe(0);
    });
});

describe('roundTo', () => {
    it('should round to specified decimals', () => {
        expect(roundTo(3.14159, 2)).toBe(3.14);
        expect(roundTo(3.145, 2)).toBe(3.15);
        expect(roundTo(3.144, 2)).toBe(3.14);
        expect(roundTo(3.5, 0)).toBe(4);
        expect(roundTo(1234.5678, 3)).toBe(1234.568);
    });
});

describe('roundPrice', () => {
    it('should round to 2 decimal places', () => {
        expect(roundPrice(153.456)).toBe(153.46);
        expect(roundPrice(100)).toBe(100);
        expect(roundPrice(0.999)).toBe(1);
    });
});

describe('randomGaussian', () => {
    it('should produce values centered around mean', () => {
        const samples: number[] = [];
        for (let i = 0; i < 1000; i++) {
            samples.push(randomGaussian(100, 10));
        }

        const mean = average(samples);
        // Mean should be close to 100 (within 5 for 1000 samples)
        expect(mean).toBeGreaterThan(95);
        expect(mean).toBeLessThan(105);
    });

    it('should respect standard deviation', () => {
        const samples: number[] = [];
        for (let i = 0; i < 1000; i++) {
            samples.push(randomGaussian(0, 1));
        }

        const stdDev = standardDeviation(samples);
        // Should be close to 1
        expect(stdDev).toBeGreaterThan(0.8);
        expect(stdDev).toBeLessThan(1.2);
    });
});

describe('weightedAverage', () => {
    it('should calculate weighted average', () => {
        expect(weightedAverage([10, 20], [1, 1])).toBe(15);
        expect(weightedAverage([10, 20], [1, 3])).toBe(17.5); // (10*1 + 20*3) / 4
        expect(weightedAverage([100], [5])).toBe(100);
    });

    it('should handle empty arrays', () => {
        expect(weightedAverage([], [])).toBe(0);
    });

    it('should throw for mismatched lengths', () => {
        expect(() => weightedAverage([1, 2], [1])).toThrow('same length');
    });
});

describe('average', () => {
    it('should calculate arithmetic mean', () => {
        expect(average([1, 2, 3, 4, 5])).toBe(3);
        expect(average([10])).toBe(10);
        expect(average([0, 0, 0])).toBe(0);
    });

    it('should handle empty array', () => {
        expect(average([])).toBe(0);
    });
});

describe('standardDeviation', () => {
    it('should calculate standard deviation', () => {
        const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
        expect(roundTo(result, 1)).toBe(2);
    });

    it('should return 0 for single value', () => {
        expect(standardDeviation([5])).toBe(0);
    });

    it('should return 0 for identical values', () => {
        expect(standardDeviation([5, 5, 5, 5])).toBe(0);
    });
});

describe('minMax', () => {
    it('should find min and max', () => {
        expect(minMax([3, 1, 4, 1, 5, 9, 2, 6])).toEqual({ min: 1, max: 9 });
        expect(minMax([5])).toEqual({ min: 5, max: 5 });
        expect(minMax([-10, 0, 10])).toEqual({ min: -10, max: 10 });
    });

    it('should handle empty array', () => {
        expect(minMax([])).toEqual({ min: 0, max: 0 });
    });
});

describe('compoundGrowth', () => {
    it('should calculate compound interest', () => {
        // $1000 at 10% for 3 years = $1331
        expect(roundTo(compoundGrowth(1000, 0.1, 3), 2)).toBe(1331);

        // $100 at 5% for 10 years
        expect(roundTo(compoundGrowth(100, 0.05, 10), 2)).toBe(162.89);
    });
});

describe('isApproximately', () => {
    it('should detect approximate equality', () => {
        expect(isApproximately(1.0, 1.0001, 0.001)).toBe(true);
        expect(isApproximately(1.0, 1.01, 0.001)).toBe(false);
        expect(isApproximately(0, 0)).toBe(true);
    });
});
