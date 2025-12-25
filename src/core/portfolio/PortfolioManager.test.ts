import { describe, it, expect, beforeEach } from 'vitest';
import { PortfolioManager, createPortfolioManager } from './PortfolioManager';
import type { ExecutedTrade } from '../types';

describe('PortfolioManager', () => {
    let manager: PortfolioManager;

    beforeEach(() => {
        manager = createPortfolioManager(10000);
    });

    describe('initialization', () => {
        it('should start with correct cash balance', () => {
            expect(manager.getCash()).toBe(10000);
        });

        it('should start with no holdings', () => {
            const holdings = manager.getHoldings({});
            expect(holdings.length).toBe(0);
        });

        it('should start with zero realized P&L', () => {
            expect(manager.getRealizedPnL()).toBe(0);
        });
    });

    describe('applyTrade - buy', () => {
        it('should deduct cash on buy', () => {
            const trade: ExecutedTrade = {
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 150,
                totalValue: 1500,
                fee: 1,
                executedAt: 1,
            };

            manager.applyTrade(trade);

            // 10000 - 1500 - 1 = 8499
            expect(manager.getCash()).toBe(8499);
        });

        it('should add holdings on buy', () => {
            const trade: ExecutedTrade = {
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 150,
                totalValue: 1500,
                fee: 1,
                executedAt: 1,
            };

            manager.applyTrade(trade);

            const holding = manager.getHolding('ZAP', { ZAP: 150 });
            expect(holding).not.toBeNull();
            expect(holding?.shares).toBe(10);
            expect(holding?.avgCost).toBe(150);
        });
    });

    describe('applyTrade - sell', () => {
        it('should add cash on sell', () => {
            // First buy
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 150,
                totalValue: 1500,
                fee: 1,
                executedAt: 1,
            });

            const cashAfterBuy = manager.getCash();

            // Then sell
            manager.applyTrade({
                orderId: '2',
                ticker: 'ZAP',
                side: 'sell',
                shares: 5,
                price: 170,
                totalValue: 850,
                fee: 1,
                executedAt: 2,
            });

            // Cash should increase by 850 - 1 = 849
            expect(manager.getCash()).toBe(cashAfterBuy + 849);
        });

        it('should calculate realized P&L correctly', () => {
            // Buy at 100
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 100,
                totalValue: 1000,
                fee: 1,
                executedAt: 1,
            });

            // Sell at 120 (gain of $20 per share)
            manager.applyTrade({
                orderId: '2',
                ticker: 'ZAP',
                side: 'sell',
                shares: 5,
                price: 120,
                totalValue: 600,
                fee: 1,
                executedAt: 2,
            });

            // P&L = 5 * (120 - 100) = 100
            expect(manager.getRealizedPnL()).toBe(100);
        });
    });

    describe('getTotalValue', () => {
        it('should calculate total value correctly', () => {
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 150,
                totalValue: 1500,
                fee: 1,
                executedAt: 1,
            });

            // Cash: 10000 - 1501 = 8499
            // Holdings: 10 * 160 = 1600 (at current price)
            // Total: 8499 + 1600 = 10099
            const total = manager.getTotalValue({ ZAP: 160 });
            expect(total).toBe(10099);
        });
    });

    describe('getUnrealizedPnL', () => {
        it('should calculate unrealized P&L correctly', () => {
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 150,
                totalValue: 1500,
                fee: 1,
                executedAt: 1,
            });

            // Cost: 10 * 150 = 1500
            // Value: 10 * 170 = 1700
            // Unrealized: 200
            const unrealized = manager.getUnrealizedPnL({ ZAP: 170 });
            expect(unrealized).toBe(200);
        });
    });

    describe('getConcentration', () => {
        it('should detect concentration limit violation', () => {
            // Buy a large position
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 50,
                price: 100,
                totalValue: 5000,
                fee: 1,
                executedAt: 1,
            });

            const concentration = manager.getConcentration('ZAP', { ZAP: 100 });

            // 5000 / (4999 + 5000) ≈ 0.5
            expect(concentration).toBeGreaterThan(0.49);
            expect(concentration).toBeLessThan(0.51);
        });

        it('should pass risk check for small positions', () => {
            const result = manager.checkConcentrationLimit('ZAP', 1000, {}, 0.5);
            expect(result.passed).toBe(true);
        });

        it('should fail risk check for large positions', () => {
            // Adding $15000 to $10000 portfolio = $25000 total
            // $15000 / $25000 = 60% > 50% limit
            const result = manager.checkConcentrationLimit('ZAP', 15000, {}, 0.5);
            expect(result.passed).toBe(false);
            expect(result.type).toBe('concentration');
        });
    });

    describe('immutability', () => {
        it('should return immutable portfolio state', () => {
            const state1 = manager.getState();

            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 10,
                price: 100,
                totalValue: 1000,
                fee: 1,
                executedAt: 1,
            });

            const state2 = manager.getState();

            // States should be different objects
            expect(state1).not.toBe(state2);
            expect(state1.cash).toBe(10000);
            expect(state2.cash).toBe(8999);
        });
    });

    describe('dividends', () => {
        it('should apply dividends correctly', () => {
            manager.applyTrade({
                orderId: '1',
                ticker: 'ZAP',
                side: 'buy',
                shares: 100,
                price: 100,
                totalValue: 10000,
                fee: 1,
                executedAt: 1,
            });

            const cashBefore = manager.getCash();

            // Pay $0.50 per share dividend
            manager.applyDividend('ZAP', 0.50);

            expect(manager.getCash()).toBe(cashBefore + 50);
        });
    });
});
