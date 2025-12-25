/**
 * AIEngine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIEngine, StockInfo } from './AIEngine';

// Sample stocks for testing
const testStocks: StockInfo[] = [
    { ticker: 'BURG', price: 35, previousPrice: 33, sector: 'food' },
    { ticker: 'TECH', price: 100, previousPrice: 95, sector: 'tech' },
    { ticker: 'HLTH', price: 50, previousPrice: 52, sector: 'health' },
    { ticker: 'ENGY', price: 70, previousPrice: 70, sector: 'energy' },
];

describe('AIEngine', () => {
    let engine: AIEngine;

    beforeEach(() => {
        engine = new AIEngine('nancy', 10000, 12345);
    });

    describe('Initialization', () => {
        it('should initialize with correct starting cash', () => {
            const state = engine.getState();
            expect(state.cash).toBe(10000);
            expect(state.totalValue).toBe(10000);
        });

        it('should initialize with correct persona', () => {
            const persona = engine.getPersona();
            expect(persona.id).toBe('nancy');
            expect(persona.name).toBe('Newbie Nancy');
        });

        it('should start with no holdings', () => {
            const state = engine.getState();
            expect(state.holdings.length).toBe(0);
        });

        it('should start with no decisions', () => {
            const state = engine.getState();
            expect(state.decisions.length).toBe(0);
        });
    });

    describe('Newbie Nancy Decisions', () => {
        it('should make a decision each turn', () => {
            const decision = engine.processTurn(1, testStocks);

            expect(decision).toBeDefined();
            expect(['buy', 'sell', 'hold']).toContain(decision.action);
            expect(decision.reason).toBeDefined();
        });

        it('should sometimes buy stocks', () => {
            // Run multiple turns to get a buy
            let hasBought = false;
            for (let i = 0; i < 10; i++) {
                const decision = engine.processTurn(i, testStocks);
                if (decision.action === 'buy') {
                    hasBought = true;
                    expect(decision.ticker).toBeDefined();
                    expect(decision.quantity).toBeGreaterThan(0);
                    break;
                }
            }
            // Should have bought at least once in 10 turns
            expect(hasBought).toBe(true);
        });

        it('should prefer top performing stocks', () => {
            // TECH is up the most (95 -> 100 = +5.26%)
            // Run multiple turns and track purchases
            const purchases: Record<string, number> = {};

            for (let i = 0; i < 20; i++) {
                // Reset engine each time to get fresh cash
                const freshEngine = new AIEngine('nancy', 10000, i * 100);
                const decision = freshEngine.processTurn(1, testStocks);
                if (decision.action === 'buy' && decision.ticker) {
                    purchases[decision.ticker] = (purchases[decision.ticker] || 0) + 1;
                }
            }

            // Top performers should be bought more often (BURG and TECH are up)
            // HLTH is down so should rarely be bought
            const upStockBuys = (purchases['BURG'] || 0) + (purchases['TECH'] || 0);
            const downStockBuys = purchases['HLTH'] || 0;
            expect(upStockBuys).toBeGreaterThan(downStockBuys);
        });

        it('should panic sell when stock drops 10%+', () => {
            // First, buy some BURG
            engine.processTurn(1, testStocks);
            engine.processTurn(2, testStocks);

            // Check if we have any holdings
            const stateAfterBuys = engine.getState();
            if (stateAfterBuys.holdings.length > 0) {
                const holding = stateAfterBuys.holdings[0];
                const avgCost = holding.avgCost;

                // Create stocks where the held stock dropped 15%
                const droppedStocks = testStocks.map(s =>
                    s.ticker === holding.ticker
                        ? { ...s, price: avgCost * 0.85 } // 15% drop from purchase
                        : s
                );

                const decision = engine.processTurn(3, droppedStocks);

                expect(decision.action).toBe('sell');
                expect(decision.ticker).toBe(holding.ticker);
                expect(decision.emotionalState).toBe('panicked');
            }
        });
    });

    describe('Portfolio Management', () => {
        it('should update cash after buying', () => {
            // Force a buy by running turns
            for (let i = 0; i < 5; i++) {
                engine.processTurn(i, testStocks);
            }

            const state = engine.getState();
            // Cash should be less than or equal to starting amount
            expect(state.cash).toBeLessThanOrEqual(10000);
        });

        it('should track holdings correctly', () => {
            // Run turns until we have holdings
            for (let i = 0; i < 10; i++) {
                engine.processTurn(i, testStocks);
            }

            const state = engine.getState();
            if (state.holdings.length > 0) {
                const holding = state.holdings[0];
                expect(holding.ticker).toBeDefined();
                expect(holding.shares).toBeGreaterThan(0);
                expect(holding.avgCost).toBeGreaterThan(0);
            }
        });

        it('should calculate total value correctly', () => {
            // Make some trades
            for (let i = 0; i < 5; i++) {
                engine.processTurn(i, testStocks);
            }

            const totalValue = engine.calculateTotalValue(testStocks);
            const state = engine.getState();

            // Total value should be cash + stock value
            let expectedStockValue = 0;
            for (const holding of state.holdings) {
                const stock = testStocks.find(s => s.ticker === holding.ticker);
                if (stock) {
                    expectedStockValue += stock.price * holding.shares;
                }
            }

            expect(totalValue).toBe(state.cash + expectedStockValue);
        });
    });

    describe('Decision History', () => {
        it('should record all decisions', () => {
            for (let i = 0; i < 5; i++) {
                engine.processTurn(i, testStocks);
            }

            const state = engine.getState();
            expect(state.decisions.length).toBe(5);
        });

        it('should track last decision', () => {
            engine.processTurn(1, testStocks);
            const lastDecision = engine.getState().lastDecision;

            expect(lastDecision).not.toBeNull();
            expect(lastDecision?.reason).toBeDefined();
        });
    });

    describe('Comparison Generation', () => {
        it('should generate comparison when player wins', () => {
            // Make AI do some trading
            for (let i = 0; i < 5; i++) {
                engine.processTurn(i, testStocks);
            }
            engine.calculateTotalValue(testStocks);

            // Player got 10% return
            const comparison = engine.generateComparison(10, 10000);

            expect(comparison.playerReturn).toBe(10);
            expect(comparison.explanation).toBeDefined();
            expect(typeof comparison.playerWon).toBe('boolean');
            expect(comparison.margin).toBeGreaterThanOrEqual(0);
        });

        it('should include AI mistakes in comparison', () => {
            // Force a panic sell
            engine.processTurn(1, testStocks);

            const state = engine.getState();
            if (state.holdings.length > 0) {
                const holding = state.holdings[0];
                const droppedStocks = testStocks.map(s =>
                    s.ticker === holding.ticker
                        ? { ...s, price: holding.avgCost * 0.85 }
                        : s
                );
                engine.processTurn(2, droppedStocks);
            }

            engine.calculateTotalValue(testStocks);
            const comparison = engine.generateComparison(5, 10000);

            // Should mention panic selling if it happened
            if (state.holdings.length > 0) {
                expect(comparison.aiMistakes.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Reset', () => {
        it('should reset to initial state', () => {
            // Make some trades
            for (let i = 0; i < 5; i++) {
                engine.processTurn(i, testStocks);
            }

            engine.reset(10000);
            const state = engine.getState();

            expect(state.cash).toBe(10000);
            expect(state.holdings.length).toBe(0);
            expect(state.decisions.length).toBe(0);
            expect(state.lastDecision).toBeNull();
        });
    });
});
