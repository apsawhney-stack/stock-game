import { describe, it, expect } from 'vitest';
import {
    addLot,
    sellLotsFIFO,
    getSharesForTicker,
    getAverageCost,
    getUniqueTickers,
    getTotalCostBasis,
} from './LotTracker';
import type { Lot } from '../types';

describe('addLot', () => {
    it('should add new lots on buy', () => {
        const lots: Lot[] = [];

        const updated = addLot(lots, 'ZAP', 10, 150, 1);

        expect(updated.length).toBe(1);
        expect(updated[0]).toEqual({
            ticker: 'ZAP',
            shares: 10,
            costBasis: 150,
            acquiredAt: 1,
        });
    });

    it('should append to existing lots', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 150, acquiredAt: 1 },
        ];

        const updated = addLot(lots, 'ZAP', 5, 155, 2);

        expect(updated.length).toBe(2);
        expect(updated[1].shares).toBe(5);
        expect(updated[1].costBasis).toBe(155);
    });
});

describe('sellLotsFIFO', () => {
    it('should remove lots FIFO on sell', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'ZAP', shares: 10, costBasis: 110, acquiredAt: 2 },
            { ticker: 'ZAP', shares: 10, costBasis: 120, acquiredAt: 3 },
        ];

        const result = sellLotsFIFO(lots, 'ZAP', 15, 130);

        // Should have consumed first lot (10) + part of second (5)
        expect(result.sharesSold).toBe(15);
        expect(result.lots.length).toBe(2);

        // Remaining lots
        const remaining = result.lots.filter(l => l.ticker === 'ZAP');
        expect(remaining[0].shares).toBe(5); // Partial second lot
        expect(remaining[0].costBasis).toBe(110);
        expect(remaining[1].shares).toBe(10); // Full third lot
    });

    it('should calculate average cost correctly', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'ZAP', shares: 10, costBasis: 200, acquiredAt: 2 },
        ];

        // Average cost = (10*100 + 10*200) / 20 = 150
        expect(getAverageCost(lots, 'ZAP')).toBe(150);
    });

    it('should track realized P&L on sell', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
        ];

        const result = sellLotsFIFO(lots, 'ZAP', 10, 150);

        // Cost basis = 10 * 100 = 1000
        // Proceeds = 10 * 150 = 1500
        // P&L = 500
        expect(result.costBasis).toBe(1000);
        expect(result.realizedPnL).toBe(500);
    });

    it('should handle partial lot sales', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 100, costBasis: 50, acquiredAt: 1 },
        ];

        const result = sellLotsFIFO(lots, 'ZAP', 30, 60);

        expect(result.sharesSold).toBe(30);
        expect(result.lots.length).toBe(1);
        expect(result.lots[0].shares).toBe(70);
        expect(result.costBasis).toBe(1500); // 30 * 50
        expect(result.realizedPnL).toBe(300); // 30 * 60 - 1500
    });

    it('should return immutable state', () => {
        const original: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
        ];

        const result = sellLotsFIFO(original, 'ZAP', 5, 110);

        // Original should be unchanged
        expect(original.length).toBe(1);
        expect(original[0].shares).toBe(10);

        // Result should be different
        expect(result.lots).not.toBe(original);
    });

    it('should handle selling more than available', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
        ];

        const result = sellLotsFIFO(lots, 'ZAP', 20, 150);

        // Should only sell what's available
        expect(result.sharesSold).toBe(10);
        expect(result.lots.filter(l => l.ticker === 'ZAP').length).toBe(0);
    });

    it('should preserve other ticker lots', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'RKB', shares: 20, costBasis: 35, acquiredAt: 1 },
        ];

        const result = sellLotsFIFO(lots, 'ZAP', 10, 150);

        // RKB should be unchanged
        const rkbLots = result.lots.filter(l => l.ticker === 'RKB');
        expect(rkbLots.length).toBe(1);
        expect(rkbLots[0].shares).toBe(20);
    });
});

describe('getSharesForTicker', () => {
    it('should sum shares across lots', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'ZAP', shares: 15, costBasis: 110, acquiredAt: 2 },
            { ticker: 'RKB', shares: 50, costBasis: 35, acquiredAt: 1 },
        ];

        expect(getSharesForTicker(lots, 'ZAP')).toBe(25);
        expect(getSharesForTicker(lots, 'RKB')).toBe(50);
        expect(getSharesForTicker(lots, 'UNKNOWN')).toBe(0);
    });
});

describe('getUniqueTickers', () => {
    it('should return unique tickers', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'ZAP', shares: 5, costBasis: 110, acquiredAt: 2 },
            { ticker: 'RKB', shares: 20, costBasis: 35, acquiredAt: 1 },
            { ticker: 'GEN', shares: 5, costBasis: 120, acquiredAt: 1 },
        ];

        const tickers = getUniqueTickers(lots);

        expect(tickers.sort()).toEqual(['GEN', 'RKB', 'ZAP']);
    });
});

describe('getTotalCostBasis', () => {
    it('should calculate total cost basis', () => {
        const lots: Lot[] = [
            { ticker: 'ZAP', shares: 10, costBasis: 100, acquiredAt: 1 },
            { ticker: 'RKB', shares: 20, costBasis: 35, acquiredAt: 1 },
        ];

        // 10*100 + 20*35 = 1000 + 700 = 1700
        expect(getTotalCostBasis(lots)).toBe(1700);
    });
});
