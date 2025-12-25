/**
 * Random Utilities
 * 
 * Seeded random number generator for reproducible simulations.
 */

/**
 * Seeded random number generator using Mulberry32
 * Produces reproducible sequences for testing
 */
export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /**
     * Generate next random number in [0, 1)
     */
    next(): number {
        this.state = (this.state + 0x6D2B79F5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Generate random integer in [min, max] (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate random float in [min, max)
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Generate random boolean
     */
    nextBool(probability: number = 0.5): boolean {
        return this.next() < probability;
    }

    /**
     * Pick random element from array
     */
    pick<T>(array: readonly T[]): T | undefined {
        if (array.length === 0) return undefined;
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle<T>(array: readonly T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Generate random value from Gaussian distribution
     */
    nextGaussian(mean: number = 0, stdDev: number = 1): number {
        let u1 = 0, u2 = 0;
        while (u1 === 0) u1 = this.next();
        while (u2 === 0) u2 = this.next();

        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z * stdDev;
    }

    /**
     * Reset to initial seed
     */
    reset(seed?: number): void {
        this.state = seed ?? this.state;
    }
}

/**
 * Global seeded random instance
 * Re-seed for reproducible tests
 */
export const seededRandom = new SeededRandom(Date.now());

/**
 * Generate a random seed
 */
export function generateSeed(): number {
    return Math.floor(Math.random() * 2147483647);
}

/**
 * Create a new seeded random generator
 */
export function createRandom(seed?: number): SeededRandom {
    return new SeededRandom(seed ?? generateSeed());
}

/**
 * Pick random element from array using Math.random
 */
export function pickRandom<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Random choice with weights
 */
export function weightedChoice<T>(
    items: readonly T[],
    weights: readonly number[]
): T | undefined {
    if (items.length === 0 || items.length !== weights.length) {
        return undefined;
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }

    return items[items.length - 1];
}
