/**
 * PriceGenerator
 * 
 * Pure function for generating realistic price movements.
 * Combines random walk, momentum, and event impacts.
 */

import type { PriceGeneratorConfig, PriceTrigger, Asset } from '../types';
import { DEFAULT_PRICE_GENERATOR_CONFIG } from '../types';
import { clamp, roundPrice } from '../utils';
import { SeededRandom } from '../utils/random';

/**
 * Context for generating next price
 */
export interface PriceContext {
    /** Current price */
    readonly currentPrice: number;

    /** Asset volatility (0-1) */
    readonly volatility: number;

    /** Recent price history (most recent last) */
    readonly recentPrices: readonly number[];

    /** Active event impact (if any) */
    readonly eventImpact?: number;

    /** Event ID (if triggered by event) */
    readonly eventId?: string;
}

/**
 * Result of generating a new price
 */
export interface GeneratedPrice {
    /** The new price */
    readonly price: number;

    /** Absolute change from previous */
    readonly change: number;

    /** Percentage change */
    readonly changePercent: number;

    /** What caused this price movement */
    readonly trigger: PriceTrigger;
}

/**
 * Calculate momentum from recent prices
 * Returns value between -1 and 1
 */
export function calculateMomentum(prices: readonly number[]): number {
    if (prices.length < 2) return 0;

    let momentum = 0;
    let weight = 1;
    const decay = 0.7;

    // Start from most recent price change
    for (let i = prices.length - 1; i > 0; i--) {
        const change = (prices[i] - prices[i - 1]) / prices[i - 1];
        momentum += change * weight;
        weight *= decay;
    }

    // Clamp to [-1, 1]
    return clamp(momentum, -1, 1);
}

/**
 * Generate next price based on context
 */
export function generateNextPrice(
    context: PriceContext,
    rng: SeededRandom,
    config: PriceGeneratorConfig = DEFAULT_PRICE_GENERATOR_CONFIG
): GeneratedPrice {
    const { currentPrice, volatility, recentPrices, eventImpact, eventId } = context;

    // If there's a direct event impact, use it primarily
    if (eventImpact !== undefined && eventId) {
        const newPrice = roundPrice(currentPrice * (1 + eventImpact));
        const safePrice = Math.max(newPrice, 0.01); // Never go to zero

        return {
            price: safePrice,
            change: roundPrice(safePrice - currentPrice),
            changePercent: (safePrice - currentPrice) / currentPrice,
            trigger: { type: 'news', eventId, impact: eventImpact },
        };
    }

    // Calculate components
    const randomWalk = rng.nextGaussian(0, volatility * config.randomWalkWeight);

    const momentum = calculateMomentum(recentPrices);
    const momentumComponent = momentum * config.momentumWeight * config.momentumDecay;

    // Simulate volume sentiment (random leaning)
    const volumeSentiment = rng.nextFloat(-1, 1) * config.volumeWeight * volatility;

    // Combined change (capped to prevent extreme moves)
    const maxChange = volatility * 3; // Cap at 3x volatility
    let totalChange = clamp(
        randomWalk + momentumComponent + volumeSentiment,
        -maxChange,
        maxChange
    );

    // Calculate new price
    let newPrice = currentPrice * (1 + totalChange);
    newPrice = roundPrice(Math.max(newPrice, 0.01)); // Never go to zero

    const change = roundPrice(newPrice - currentPrice);
    const changePercent = change / currentPrice;

    // Determine trigger type
    let trigger: PriceTrigger;
    if (Math.abs(momentumComponent) > Math.abs(randomWalk)) {
        trigger = {
            type: 'momentum',
            direction: momentum > 0 ? 'up' : 'down',
            strength: Math.abs(momentum),
        };
    } else if (Math.abs(volumeSentiment) > Math.abs(randomWalk) * 0.5) {
        trigger = {
            type: 'volume',
            sentiment: volumeSentiment > 0 ? 'buying' : 'selling',
        };
    } else {
        trigger = { type: 'random_walk' };
    }

    return {
        price: newPrice,
        change,
        changePercent,
        trigger,
    };
}

/**
 * Generate initial price history for an asset
 */
export function generateInitialHistory(
    asset: Asset,
    length: number,
    rng: SeededRandom
): number[] {
    const history: number[] = [asset.basePrice];

    for (let i = 1; i < length; i++) {
        const context: PriceContext = {
            currentPrice: history[i - 1],
            volatility: asset.volatility,
            recentPrices: history.slice(-5),
        };

        const result = generateNextPrice(context, rng);
        history.push(result.price);
    }

    return history;
}
