/**
 * MarketEngine
 * 
 * Manages market state, price simulation, and event processing.
 */

import type {
    Asset,
    MarketState,
    MarketConfig,
    TickResult,
    PricePoint,
    PriceChange,
    TriggeredEvent,
} from '../types';
import { DEFAULT_MARKET_CONFIG } from '../types';
import { RingBuffer } from '../utils';
import { SeededRandom, createRandom } from '../utils/random';
import { generateNextPrice, type PriceContext } from './PriceGenerator';

/**
 * Interface for MarketEngine
 */
export interface IMarketEngine {
    // Queries
    getPrice(ticker: string): number | undefined;
    getPrices(): Readonly<Record<string, number>>;
    getPriceHistory(ticker: string): readonly PricePoint[];
    getAsset(ticker: string): Asset | undefined;
    getAllAssets(): readonly Asset[];
    getTurn(): number;

    // Commands
    tick(): TickResult;
    applyEvent(ticker: string | 'all', impact: number, eventId: string): void;
    reset(): void;

    // Subscriptions
    onPriceChange(callback: (changes: PriceChange[]) => void): () => void;
}

/**
 * MarketEngine implementation
 */
export class MarketEngine implements IMarketEngine {
    private prices: Map<string, number> = new Map();
    private priceHistory: Map<string, RingBuffer<PricePoint>> = new Map();
    private assets: Map<string, Asset> = new Map();
    private activeEvents: Map<string, TriggeredEvent> = new Map();
    private pendingImpacts: Map<string, { impact: number; eventId: string }> = new Map();
    private turn: number = 0;
    private rng: SeededRandom;
    private listeners: Set<(changes: PriceChange[]) => void> = new Set();

    constructor(
        assets: readonly Asset[],
        private readonly config: MarketConfig = DEFAULT_MARKET_CONFIG
    ) {
        this.rng = createRandom(config.seed);
        this.initializeAssets(assets);
    }

    /**
     * Initialize assets with base prices
     */
    private initializeAssets(assets: readonly Asset[]): void {
        for (const asset of assets) {
            this.assets.set(asset.ticker, asset);
            this.prices.set(asset.ticker, asset.basePrice);

            const history = new RingBuffer<PricePoint>(this.config.maxHistoryLength);
            history.push({
                price: asset.basePrice,
                turn: 0,
                timestamp: Date.now(),
                change: 0,
                changePercent: 0,
            });
            this.priceHistory.set(asset.ticker, history);
        }
    }

    // === Queries ===

    getPrice(ticker: string): number | undefined {
        return this.prices.get(ticker);
    }

    getPrices(): Readonly<Record<string, number>> {
        return Object.fromEntries(this.prices);
    }

    getPriceHistory(ticker: string): readonly PricePoint[] {
        return this.priceHistory.get(ticker)?.toArray() ?? [];
    }

    getAsset(ticker: string): Asset | undefined {
        return this.assets.get(ticker);
    }

    getAllAssets(): readonly Asset[] {
        return Array.from(this.assets.values());
    }

    getTurn(): number {
        return this.turn;
    }

    // === Commands ===

    /**
     * Advance market by one tick
     */
    tick(): TickResult {
        const startTime = performance.now();
        this.turn++;

        const changes: PriceChange[] = [];
        const triggeredEvents: string[] = [];

        // Process each asset
        for (const [ticker, asset] of this.assets) {
            const currentPrice = this.prices.get(ticker)!;
            const history = this.priceHistory.get(ticker)!;

            // Check for pending event impact
            const pendingImpact = this.pendingImpacts.get(ticker);

            // Build price context
            const recentPrices = history.toArray().map(p => p.price);
            const context: PriceContext = {
                currentPrice,
                volatility: asset.volatility,
                recentPrices,
                eventImpact: pendingImpact?.impact,
                eventId: pendingImpact?.eventId,
            };

            // Generate new price
            const result = generateNextPrice(context, this.rng);

            // Update state
            this.prices.set(ticker, result.price);

            const pricePoint: PricePoint = {
                price: result.price,
                turn: this.turn,
                timestamp: Date.now(),
                change: result.change,
                changePercent: result.changePercent,
                trigger: result.trigger,
            };
            history.push(pricePoint);

            changes.push({
                ticker,
                previousPrice: currentPrice,
                newPrice: result.price,
                change: result.change,
                changePercent: result.changePercent,
                trigger: result.trigger,
            });

            if (pendingImpact) {
                triggeredEvents.push(pendingImpact.eventId);
            }
        }

        // Clear pending impacts
        this.pendingImpacts.clear();

        // Notify listeners
        this.notifyListeners(changes);

        const computeTimeMs = performance.now() - startTime;

        return {
            turn: this.turn,
            prices: this.getPrices(),
            changes,
            triggeredEvents,
            computeTimeMs,
        };
    }

    /**
     * Apply event impact to ticker(s)
     */
    applyEvent(tickerOrAll: string | 'all', impact: number, eventId: string): void {
        if (tickerOrAll === 'all') {
            for (const ticker of this.assets.keys()) {
                this.pendingImpacts.set(ticker, { impact, eventId });
            }
        } else {
            if (this.assets.has(tickerOrAll)) {
                this.pendingImpacts.set(tickerOrAll, { impact, eventId });
            }
        }
    }

    /**
     * Reset market to initial state
     */
    reset(): void {
        this.turn = 0;
        this.pendingImpacts.clear();
        this.activeEvents.clear();
        this.rng = createRandom(this.config.seed);

        // Reset prices and history
        for (const [ticker, asset] of this.assets) {
            this.prices.set(ticker, asset.basePrice);

            const history = new RingBuffer<PricePoint>(this.config.maxHistoryLength);
            history.push({
                price: asset.basePrice,
                turn: 0,
                timestamp: Date.now(),
                change: 0,
                changePercent: 0,
            });
            this.priceHistory.set(ticker, history);
        }
    }

    // === Subscriptions ===

    onPriceChange(callback: (changes: PriceChange[]) => void): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notifyListeners(changes: PriceChange[]): void {
        for (const listener of this.listeners) {
            listener(changes);
        }
    }

    // === State Export ===

    /**
     * Export current market state (for persistence)
     */
    getState(): MarketState {
        const priceHistoryRecord: Record<string, readonly PricePoint[]> = {};
        for (const [ticker, buffer] of this.priceHistory) {
            priceHistoryRecord[ticker] = buffer.toArray();
        }

        return {
            prices: this.getPrices(),
            priceHistory: priceHistoryRecord,
            activeEvents: Array.from(this.activeEvents.keys()),
            turn: this.turn,
        };
    }
}

/**
 * Create a new MarketEngine with given assets
 */
export function createMarketEngine(
    assets: readonly Asset[],
    config?: Partial<MarketConfig>
): MarketEngine {
    return new MarketEngine(assets, { ...DEFAULT_MARKET_CONFIG, ...config });
}
