/**
 * Integration Test: Full Trade Flow
 * 
 * Tests the complete flow from order submission to portfolio update.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMarketEngine } from '../../src/core/market/MarketEngine';
import { createPortfolioManager } from '../../src/core/portfolio/PortfolioManager';
import { createOrderEngine } from '../../src/core/orders/OrderEngine';
import { createEventBus, TypedEventBus } from '../../src/infra/events/EventBus';
import type { Asset } from '../../src/core/types';

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
];

describe('Integration: Trade Flow', () => {
    let market: ReturnType<typeof createMarketEngine>;
    let portfolio: ReturnType<typeof createPortfolioManager>;
    let orders: ReturnType<typeof createOrderEngine>;
    let events: TypedEventBus;

    beforeEach(() => {
        market = createMarketEngine(testAssets, { seed: 12345 });
        portfolio = createPortfolioManager(10000);
        orders = createOrderEngine({ defaultExpirationTurns: 2 });
        events = createEventBus();
    });

    it('should complete buy order and update portfolio', () => {
        // 1. Submit market buy order
        const result = orders.submitOrder({
            type: 'market',
            side: 'buy',
            ticker: 'ZAP',
            quantity: 10,
        }, 1);

        expect(result.success).toBe(true);

        // 2. Process end of turn with current prices
        const prices = market.getPrices();
        const report = orders.processEndOfTurn(prices, portfolio.getState(), 1, 1);

        expect(report.trades.length).toBe(1);

        // 3. Apply trade to portfolio
        for (const trade of report.trades) {
            portfolio.applyTrade(trade);
        }

        // 4. Verify portfolio updated
        const zapPrice = prices['ZAP'];
        expect(portfolio.getCash()).toBe(10000 - (10 * zapPrice) - 1); // - value - fee

        const holding = portfolio.getHolding('ZAP', prices);
        expect(holding?.shares).toBe(10);
    });

    it('should complete sell order and calculate P&L', () => {
        // 1. Setup: Buy 10 shares at base price
        const buyResult = orders.submitOrder({
            type: 'market',
            side: 'buy',
            ticker: 'ZAP',
            quantity: 10,
        }, 1);

        const prices1 = market.getPrices();
        const report1 = orders.processEndOfTurn(prices1, portfolio.getState(), 1, 1);
        portfolio.applyTrade(report1.trades[0]);

        // 2. Advance market (price changes)
        market.tick();
        market.tick();
        market.tick();

        // 3. Sell 5 shares at new price
        orders.submitOrder({
            type: 'market',
            side: 'sell',
            ticker: 'ZAP',
            quantity: 5,
        }, 4);

        const prices2 = market.getPrices();
        const report2 = orders.processEndOfTurn(prices2, portfolio.getState(), 4, 1);
        portfolio.applyTrade(report2.trades[0]);

        // 4. Verify P&L
        const holding = portfolio.getHolding('ZAP', prices2);
        expect(holding?.shares).toBe(5); // 10 - 5

        // P&L should be calculated
        expect(portfolio.getRealizedPnL()).not.toBe(0);
    });

    it('should handle market tick updating portfolio values', () => {
        // 1. Buy shares
        const buyResult = orders.submitOrder({
            type: 'market',
            side: 'buy',
            ticker: 'ZAP',
            quantity: 10,
        }, 1);

        const prices1 = market.getPrices();
        const report = orders.processEndOfTurn(prices1, portfolio.getState(), 1, 1);
        portfolio.applyTrade(report.trades[0]);

        const initialValue = portfolio.getTotalValue(prices1);

        // 2. Tick market multiple times
        for (let i = 0; i < 5; i++) {
            market.tick();
        }

        // 3. Check values changed
        const prices2 = market.getPrices();
        const newValue = portfolio.getTotalValue(prices2);

        // Values should be different (prices changed)
        expect(newValue).not.toBe(initialValue);
    });

    it('should persist and load state correctly', async () => {
        // 1. Make some trades
        orders.submitOrder({
            type: 'market',
            side: 'buy',
            ticker: 'ZAP',
            quantity: 10,
        }, 1);

        const prices = market.getPrices();
        const report = orders.processEndOfTurn(prices, portfolio.getState(), 1, 1);
        portfolio.applyTrade(report.trades[0]);

        // 2. Get state
        const portfolioState = portfolio.getState();
        const marketState = market.getState();

        // 3. Simulate save/load (serialize/deserialize)
        const serialized = JSON.stringify({ portfolio: portfolioState, market: marketState });
        const loaded = JSON.parse(serialized);

        // 4. Verify data integrity
        expect(loaded.portfolio.cash).toBe(portfolioState.cash);
        expect(loaded.portfolio.lots.length).toBe(1);
        expect(loaded.market.turn).toBe(marketState.turn);
    });

    it('should complete performance benchmark', () => {
        // Create larger asset set
        const manyAssets: Asset[] = [];
        for (let i = 0; i < 20; i++) {
            manyAssets.push({
                ticker: `TST${i}`,
                name: `Test Stock ${i}`,
                assetType: 'stock',
                sector: 'tech',
                riskRating: 2,
                basePrice: 100 + i,
                volatility: 0.05,
                description: 'Test',
                icon: 'test',
            });
        }

        const bigMarket = createMarketEngine(manyAssets, { seed: 42 });

        // Benchmark 100 ticks
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            bigMarket.tick();
        }
        const elapsed = performance.now() - start;

        // Should complete in under 500ms
        expect(elapsed).toBeLessThan(500);
        console.log(`100 ticks with 20 stocks: ${elapsed.toFixed(2)}ms`);
    });
});
