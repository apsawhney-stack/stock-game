/**
 * Math Utilities
 * 
 * Pure mathematical functions for price calculations.
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return (newValue - oldValue) / oldValue;
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Round price to 2 decimal places (cents)
 */
export function roundPrice(price: number): number {
    return roundTo(price, 2);
}

/**
 * Generate random number from Gaussian (normal) distribution
 * Uses Box-Muller transform
 * 
 * @param mean - Mean of distribution (default 0)
 * @param stdDev - Standard deviation (default 1)
 */
export function randomGaussian(mean: number = 0, stdDev: number = 1): number {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
}

/**
 * Calculate weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
    if (values.length !== weights.length) {
        throw new Error('Values and weights must have same length');
    }
    if (values.length === 0) return 0;

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;

    const weighted = values.reduce((sum, val, i) => sum + val * weights[i], 0);
    return weighted / totalWeight;
}

/**
 * Calculate average of array
 */
export function average(values: readonly number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: readonly number[]): number {
    if (values.length <= 1) return 0;

    const avg = average(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(average(squareDiffs));
}

/**
 * Calculate min and max of array
 */
export function minMax(values: readonly number[]): { min: number; max: number } {
    if (values.length === 0) {
        return { min: 0, max: 0 };
    }

    let min = values[0];
    let max = values[0];

    for (let i = 1; i < values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
    }

    return { min, max };
}

/**
 * Calculate compound growth
 * 
 * @param principal - Starting amount
 * @param rate - Growth rate per period (e.g., 0.1 = 10%)
 * @param periods - Number of periods
 */
export function compoundGrowth(principal: number, rate: number, periods: number): number {
    return principal * Math.pow(1 + rate, periods);
}

/**
 * Check if a number is within epsilon of another
 */
export function approximately(a: number, b: number, epsilon: number = 0.0001): number {
    return Math.abs(a - b) <= epsilon ? 1 : 0;
}

/**
 * Check if a number is within epsilon of another (boolean version)
 */
export function isApproximately(a: number, b: number, epsilon: number = 0.0001): boolean {
    return Math.abs(a - b) <= epsilon;
}
