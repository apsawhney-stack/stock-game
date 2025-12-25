/**
 * Zustand Store Tests
 * Tests for Sprint 2-3 state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store';
import { selectTotalValue, selectHoldings, selectReturnPercent, selectTurnInfo, selectIsMissionGoalMet, selectTotalPnL } from './selectors';

describe('Game Store', () => {
    beforeEach(() => {
        // Reset store before each test
        useGameStore.getState().actions.resetGame();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = useGameStore.getState();

            expect(state.session.missionId).toBeNull();
            expect(state.session.phase).toBe('menu');
            expect(state.session.turn).toBe(0);
            expect(state.portfolio.cash).toBe(10000);
            expect(state.portfolio.lots).toEqual([]);
            expect(state.pendingOrders).toEqual([]);
            expect(state.ui.currentScreen).toBe('home');
        });
    });

    describe('startMission', () => {
        it('should set up mission state', () => {
            const { startMission } = useGameStore.getState().actions;

            startMission('mission-1');

            const state = useGameStore.getState();
            expect(state.session.missionId).toBe('mission-1');
            expect(state.session.phase).toBe('briefing');
            expect(state.session.turn).toBe(0);
            expect(state.session.missionName).toBe('First Trade');
            expect(state.session.targetReturn).toBe(0.02);
            expect(state.ui.currentScreen).toBe('missionBriefing');
        });

        it('should reset portfolio to starting cash', () => {
            const { startMission } = useGameStore.getState().actions;

            startMission('mission-1');

            const state = useGameStore.getState();
            expect(state.portfolio.cash).toBe(10000);
            expect(state.portfolio.lots).toEqual([]);
        });
    });

    describe('navigate', () => {
        it('should change current screen', () => {
            const { navigate } = useGameStore.getState().actions;

            navigate('dashboard');
            expect(useGameStore.getState().ui.currentScreen).toBe('dashboard');

            navigate('trade');
            expect(useGameStore.getState().ui.currentScreen).toBe('trade');
        });
    });

    describe('submitOrder', () => {
        it('should add pending order', () => {
            const { submitOrder } = useGameStore.getState().actions;

            submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'BURG',
                quantity: 5,
            });

            const state = useGameStore.getState();
            expect(state.pendingOrders.length).toBe(1);
            expect(state.pendingOrders[0].ticker).toBe('BURG');
            expect(state.pendingOrders[0].quantity).toBe(5);
            expect(state.pendingOrders[0].side).toBe('buy');
            expect(state.pendingOrders[0].status).toBe('pending');
        });

        it('should set order expiration', () => {
            const { submitOrder, startMission } = useGameStore.getState().actions;
            startMission('mission-1');

            submitOrder({
                type: 'limit',
                side: 'buy',
                ticker: 'TECH',
                quantity: 10,
                limitPrice: 40,
                expiresInTurns: 3,
            });

            const state = useGameStore.getState();
            expect(state.pendingOrders[0].expiresAt).toBe(3); // turn 0 + 3
        });
    });

    describe('updatePrices', () => {
        it('should update market prices', () => {
            const { updatePrices } = useGameStore.getState().actions;

            updatePrices({ BURG: 26.00, TECH: 44.50 });

            const state = useGameStore.getState();
            expect(state.market.prices['BURG']).toBe(26.00);
            expect(state.market.prices['TECH']).toBe(44.50);
        });

        it('should store previous prices', () => {
            const { updatePrices } = useGameStore.getState().actions;

            updatePrices({ BURG: 25.00 });
            updatePrices({ BURG: 26.00 });

            const state = useGameStore.getState();
            expect(state.market.previousPrices['BURG']).toBe(25.00);
            expect(state.market.prices['BURG']).toBe(26.00);
        });
    });

    describe('advanceTurn - Order Processing', () => {
        beforeEach(() => {
            // Set up initial prices
            useGameStore.getState().actions.updatePrices({
                BURG: 25.00,
                TECH: 45.00,
            });
        });

        it('should increment turn', () => {
            const { advanceTurn } = useGameStore.getState().actions;

            advanceTurn();

            expect(useGameStore.getState().session.turn).toBe(1);
            expect(useGameStore.getState().market.turn).toBe(1);
        });

        it('should fill buy order and create lot', () => {
            const { submitOrder, advanceTurn } = useGameStore.getState().actions;

            submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'BURG',
                quantity: 10,
            });

            advanceTurn();

            const state = useGameStore.getState();
            // Order should be filled
            expect(state.pendingOrders.length).toBe(0);
            expect(state.orderHistory.length).toBe(1);
            expect(state.orderHistory[0].status).toBe('filled');

            // Lot should be created
            expect(state.portfolio.lots.length).toBe(1);
            expect(state.portfolio.lots[0].ticker).toBe('BURG');
            expect(state.portfolio.lots[0].shares).toBe(10);
            expect(state.portfolio.lots[0].costBasis).toBe(25.00);

            // Cash should be deducted
            expect(state.portfolio.cash).toBe(10000 - (25.00 * 10));
        });

        it('should fill sell order and remove shares', () => {
            const { submitOrder, advanceTurn, updatePortfolio } = useGameStore.getState().actions;

            // First, give the portfolio some shares
            const currentPortfolio = useGameStore.getState().portfolio;
            updatePortfolio({
                ...currentPortfolio,
                lots: [{ ticker: 'BURG', shares: 20, costBasis: 20.00, acquiredAt: 0 }],
            });

            submitOrder({
                type: 'market',
                side: 'sell',
                ticker: 'BURG',
                quantity: 10,
            });

            advanceTurn();

            const state = useGameStore.getState();
            // Order should be filled
            expect(state.pendingOrders.length).toBe(0);
            expect(state.orderHistory[0].status).toBe('filled');

            // Shares should be reduced
            expect(state.portfolio.lots[0].shares).toBe(10);

            // Cash should be added (sold at 25.00)
            expect(state.portfolio.cash).toBe(10000 + (25.00 * 10));

            // Realized P&L should be updated (bought at 20, sold at 25)
            expect(state.portfolio.realizedPnL).toBe(50.00); // (25-20) * 10
        });

        it('should not fill buy order with insufficient funds', () => {
            const { submitOrder, advanceTurn, updatePortfolio } = useGameStore.getState().actions;

            // Reduce cash
            const currentPortfolio = useGameStore.getState().portfolio;
            updatePortfolio({ ...currentPortfolio, cash: 100 });

            submitOrder({
                type: 'market',
                side: 'buy',
                ticker: 'BURG',
                quantity: 10, // Would cost $250
            });

            advanceTurn();

            const state = useGameStore.getState();
            // Order should remain pending
            expect(state.pendingOrders.length).toBe(1);
            expect(state.orderHistory.length).toBe(0);
        });

        it('should navigate to results after max turns', () => {
            const { advanceTurn, startMission } = useGameStore.getState().actions;
            startMission('mission-1');

            // Advance to max turns (10)
            for (let i = 0; i < 10; i++) {
                advanceTurn();
            }

            const state = useGameStore.getState();
            expect(state.session.phase).toBe('results');
            expect(state.ui.currentScreen).toBe('results');
        });
    });

    describe('resetGame', () => {
        it('should reset all state', () => {
            const { startMission, submitOrder, advanceTurn, resetGame } = useGameStore.getState().actions;

            startMission('mission-1');
            useGameStore.getState().actions.updatePrices({ BURG: 25.00 });
            submitOrder({ type: 'market', side: 'buy', ticker: 'BURG', quantity: 5 });
            advanceTurn();

            resetGame();

            const state = useGameStore.getState();
            expect(state.session.missionId).toBeNull();
            expect(state.session.phase).toBe('menu');
            expect(state.portfolio.cash).toBe(10000);
            expect(state.portfolio.lots).toEqual([]);
            expect(state.pendingOrders).toEqual([]);
            expect(state.orderHistory).toEqual([]);
            expect(state.ui.currentScreen).toBe('home');
        });
    });
});

describe('Selectors', () => {
    beforeEach(() => {
        useGameStore.getState().actions.resetGame();
    });

    describe('selectTotalValue', () => {
        it('should return cash when no holdings', () => {
            const state = useGameStore.getState();
            expect(selectTotalValue(state)).toBe(10000);
        });

        it('should include holdings value', () => {
            const { updatePortfolio, updatePrices } = useGameStore.getState().actions;

            updatePrices({ BURG: 30.00 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                cash: 5000,
                lots: [{ ticker: 'BURG', shares: 100, costBasis: 25.00, acquiredAt: 0 }],
            });

            const state = useGameStore.getState();
            // Cash $5000 + 100 shares * $30 = $8000
            expect(selectTotalValue(state)).toBe(8000);
        });
    });

    describe('selectHoldings', () => {
        it('should aggregate lots by ticker', () => {
            const { updatePortfolio, updatePrices } = useGameStore.getState().actions;

            updatePrices({ BURG: 30.00 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                lots: [
                    { ticker: 'BURG', shares: 10, costBasis: 20.00, acquiredAt: 0 },
                    { ticker: 'BURG', shares: 5, costBasis: 25.00, acquiredAt: 1 },
                ],
            });

            const state = useGameStore.getState();
            const holdings = selectHoldings(state);

            expect(holdings.length).toBe(1);
            expect(holdings[0].ticker).toBe('BURG');
            expect(holdings[0].shares).toBe(15);
            // Avg cost: (10*20 + 5*25) / 15 = 325/15 = 21.67
            expect(holdings[0].avgCost).toBeCloseTo(21.67, 1);
            // Market value: 15 * 30 = 450
            expect(holdings[0].marketValue).toBe(450);
            // Unrealized P&L: 450 - 325 = 125
            expect(holdings[0].unrealizedPnL).toBe(125);
        });
    });

    describe('selectReturnPercent', () => {
        it('should return 0 for starting portfolio', () => {
            const state = useGameStore.getState();
            expect(selectReturnPercent(state)).toBe(0);
        });

        it('should calculate return percentage', () => {
            const { updatePortfolio, updatePrices, startMission } = useGameStore.getState().actions;

            startMission('mission-1');
            updatePrices({ BURG: 30.00 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                cash: 5000,
                lots: [{ ticker: 'BURG', shares: 200, costBasis: 25.00, acquiredAt: 0 }],
            });

            const state = useGameStore.getState();
            // Total value: 5000 + 200*30 = 11000
            // Return: (11000 - 10000) / 10000 = 10%
            expect(selectReturnPercent(state)).toBeCloseTo(10, 1);
        });
    });

    describe('selectTurnInfo', () => {
        it('should return turn info', () => {
            const { startMission, advanceTurn } = useGameStore.getState().actions;

            startMission('mission-1');
            advanceTurn();
            advanceTurn();

            const state = useGameStore.getState();
            const turnInfo = selectTurnInfo(state);

            expect(turnInfo.current).toBe(2);
            expect(turnInfo.max).toBe(10);
            expect(turnInfo.remaining).toBe(8);
        });
    });

    describe('selectIsMissionGoalMet', () => {
        it('should return false when below target', () => {
            const { startMission } = useGameStore.getState().actions;

            startMission('mission-1');

            const state = useGameStore.getState();
            // Starting with $10,000, target is 2%, we have exactly $10,000
            expect(selectIsMissionGoalMet(state)).toBe(false);
        });

        it('should return true when above target', () => {
            const { startMission, updatePortfolio, updatePrices } = useGameStore.getState().actions;

            startMission('mission-1');
            updatePrices({ BURG: 30.00 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                cash: 5000,
                lots: [{ ticker: 'BURG', shares: 200, costBasis: 25.00, acquiredAt: 0 }],
            });

            const state = useGameStore.getState();
            // Total: 5000 + 200*30 = 11000, Return: 10%, Target: 2%
            expect(selectIsMissionGoalMet(state)).toBe(true);
        });

        it('should return true when exactly at target', () => {
            const { startMission, updatePortfolio, updatePrices } = useGameStore.getState().actions;

            startMission('mission-1');
            updatePrices({ BURG: 25.50 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                cash: 10000,
                lots: [{ ticker: 'BURG', shares: 8, costBasis: 25.00, acquiredAt: 0 }],
            });

            const state = useGameStore.getState();
            // Total: 10000 + 8*25.50 = 10204, Return: 2.04%, Target: 2%
            expect(selectIsMissionGoalMet(state)).toBe(true);
        });
    });

    describe('selectTotalPnL', () => {
        it('should sum realized and unrealized PnL', () => {
            const { updatePortfolio, updatePrices } = useGameStore.getState().actions;

            updatePrices({ BURG: 30.00 });
            updatePortfolio({
                ...useGameStore.getState().portfolio,
                realizedPnL: 50.00,
                lots: [{ ticker: 'BURG', shares: 10, costBasis: 25.00, acquiredAt: 0 }],
            });

            const state = useGameStore.getState();
            // Realized: 50, Unrealized: (30-25)*10 = 50, Total: 100
            expect(selectTotalPnL(state)).toBe(100);
        });
    });
});
