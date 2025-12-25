import { describe, it, expect, beforeEach } from 'vitest';
import { OrderEngine, createOrderEngine } from './OrderEngine';
import type { OrderRequest, PortfolioState } from '../types';
import { createInitialPortfolio } from '../types';

describe('OrderEngine', () => {
    let engine: OrderEngine;
    let portfolio: PortfolioState;

    beforeEach(() => {
        engine = createOrderEngine({ defaultExpirationTurns: 2 });
        portfolio = createInitialPortfolio(10000);
    });

    describe('submitOrder', () => {
        it('should queue submitted orders', () => {
            const request: OrderRequest = {
                type: 'market',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
            };

            const result = engine.submitOrder(request, 1);

            expect(result.success).toBe(true);
            expect(result.order).toBeDefined();
            expect(result.order?.status).toBe('pending');
            expect(engine.getPendingOrders().length).toBe(1);
        });

        it('should set expiration correctly', () => {
            const result = engine.submitOrder({
                type: 'limit',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
                limitPrice: 145,
                expiresInTurns: 3,
            }, 5);

            expect(result.order?.expiresAt).toBe(8); // 5 + 3
        });
    });

    describe('cancelOrder', () => {
        it('should cancel orders on request', () => {
            const result = engine.submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
            }, 1);

            const cancelled = engine.cancelOrder(result.order!.id);

            expect(cancelled).toBe(true);
            expect(engine.getPendingOrders().length).toBe(0);
            expect(engine.getOrderHistory().length).toBe(1);
            expect(engine.getOrderHistory()[0].status).toBe('cancelled');
        });

        it('should return false for unknown order', () => {
            expect(engine.cancelOrder('unknown-id')).toBe(false);
        });
    });

    describe('processEndOfTurn - market orders', () => {
        it('should execute market orders at current price', () => {
            engine.submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
            }, 1);

            const report = engine.processEndOfTurn(
                { ZAP: 150 },
                portfolio,
                1,
                1
            );

            expect(report.fills.length).toBe(1);
            expect(report.fills[0].price).toBe(150);
            expect(report.trades.length).toBe(1);
            expect(report.trades[0].totalValue).toBe(1500);
        });
    });

    describe('processEndOfTurn - limit orders', () => {
        it('should execute limit orders when price reached', () => {
            engine.submitOrder({
                type: 'limit',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
                limitPrice: 150,
            }, 1);

            const report = engine.processEndOfTurn(
                { ZAP: 145 }, // Below limit, should fill
                portfolio,
                1,
                1
            );

            expect(report.fills.length).toBe(1);
            expect(report.fills[0].price).toBe(145); // Better than limit
        });

        it('should skip limit orders when price not reached', () => {
            engine.submitOrder({
                type: 'limit',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
                limitPrice: 140,
            }, 1);

            const report = engine.processEndOfTurn(
                { ZAP: 150 }, // Above limit, should not fill
                portfolio,
                1,
                1
            );

            expect(report.fills.length).toBe(0);
            expect(report.pending.length).toBe(1);
        });

        it('should execute sell limit orders correctly', () => {
            // Add shares to portfolio
            const portfolioWithShares: PortfolioState = {
                ...portfolio,
                lots: [{ ticker: 'ZAP', shares: 20, costBasis: 100, acquiredAt: 0 }],
            };

            engine.submitOrder({
                type: 'limit',
                side: 'sell',
                ticker: 'ZAP',
                quantity: 10,
                limitPrice: 150,
            }, 1);

            const report = engine.processEndOfTurn(
                { ZAP: 160 }, // Above limit, should fill
                portfolioWithShares,
                1,
                1
            );

            expect(report.fills.length).toBe(1);
            expect(report.fills[0].price).toBe(160); // Better than limit
        });
    });

    describe('processEndOfTurn - expiration', () => {
        it('should expire orders after max turns', () => {
            engine.submitOrder({
                type: 'limit',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
                limitPrice: 100,
                expiresInTurns: 2,
            }, 1);

            // Turn 2: still pending
            const report1 = engine.processEndOfTurn({ ZAP: 150 }, portfolio, 2, 1);
            expect(report1.pending.length).toBe(1);
            expect(report1.expired.length).toBe(0);

            // Turn 3: expires (placed at 1, expires at 3)
            const report2 = engine.processEndOfTurn({ ZAP: 150 }, portfolio, 3, 1);
            expect(report2.pending.length).toBe(0);
            expect(report2.expired.length).toBe(1);
        });
    });

    describe('validateOrder', () => {
        it('should reject order with insufficient cash', () => {
            const result = engine.validateOrder(
                {
                    type: 'market',
                    side: 'buy',
                    ticker: 'ZAP',
                    quantity: 100,
                },
                portfolio,
                { ZAP: 150 } // 100 * 150 = 15000 > 10000
            );

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Insufficient cash'))).toBe(true);
        });

        it('should reject order with insufficient shares', () => {
            const result = engine.validateOrder(
                {
                    type: 'market',
                    side: 'sell',
                    ticker: 'ZAP',
                    quantity: 10,
                },
                portfolio, // No shares
                { ZAP: 150 }
            );

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Insufficient shares'))).toBe(true);
        });

        it('should reject negative quantity', () => {
            const result = engine.validateOrder(
                {
                    type: 'market',
                    side: 'buy',
                    ticker: 'ZAP',
                    quantity: -5,
                },
                portfolio,
                { ZAP: 150 }
            );

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('positive'))).toBe(true);
        });

        it('should accept valid market order', () => {
            const result = engine.validateOrder(
                {
                    type: 'market',
                    side: 'buy',
                    ticker: 'ZAP',
                    quantity: 10,
                },
                portfolio,
                { ZAP: 150 }
            );

            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should accept valid limit order', () => {
            const result = engine.validateOrder(
                {
                    type: 'limit',
                    side: 'buy',
                    ticker: 'ZAP',
                    quantity: 10,
                    limitPrice: 145,
                },
                portfolio,
                { ZAP: 150 }
            );

            expect(result.valid).toBe(true);
        });

        it('should reject limit order without limit price', () => {
            const result = engine.validateOrder(
                {
                    type: 'limit',
                    side: 'buy',
                    ticker: 'ZAP',
                    quantity: 10,
                },
                portfolio,
                { ZAP: 150 }
            );

            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('limit price'))).toBe(true);
        });
    });

    describe('getOrder', () => {
        it('should return execution report', () => {
            engine.submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
            }, 1);

            const report = engine.processEndOfTurn({ ZAP: 150 }, portfolio, 1, 1);

            expect(report.turn).toBe(1);
            expect(report.fills.length).toBe(1);
            expect(report.trades.length).toBe(1);
        });

        it('should find order in history', () => {
            const result = engine.submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'ZAP',
                quantity: 10,
            }, 1);

            engine.processEndOfTurn({ ZAP: 150 }, portfolio, 1, 1);

            const order = engine.getOrder(result.order!.id);
            expect(order).toBeDefined();
            expect(order?.status).toBe('filled');
        });
    });
});
