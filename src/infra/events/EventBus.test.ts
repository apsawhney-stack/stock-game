import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypedEventBus, createEventBus } from './EventBus';

describe('TypedEventBus', () => {
    let bus: TypedEventBus;

    beforeEach(() => {
        bus = createEventBus();
    });

    it('should emit events to subscribers', () => {
        const listener = vi.fn();

        bus.on('market:tick', listener);
        bus.emit('market:tick', { turn: 1, prices: { ZAP: 150 } });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ turn: 1, prices: { ZAP: 150 } });
    });

    it('should not emit to unsubscribed listeners', () => {
        const listener = vi.fn();

        const unsubscribe = bus.on('market:tick', listener);
        unsubscribe();
        bus.emit('market:tick', { turn: 1, prices: {} });

        expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners per event', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        const listener3 = vi.fn();

        bus.on('order:filled', listener1);
        bus.on('order:filled', listener2);
        bus.on('order:filled', listener3);

        bus.emit('order:filled', { orderId: '1', ticker: 'ZAP', price: 150, shares: 10 });

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should support once() for one-time listeners', () => {
        const listener = vi.fn();

        bus.once('game:achievement', listener);

        bus.emit('game:achievement', { achievementId: '1', name: 'First Trade' });
        bus.emit('game:achievement', { achievementId: '2', name: 'Second Trade' });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ achievementId: '1', name: 'First Trade' });
    });

    it('should return unsubscribe function', () => {
        const listener = vi.fn();

        const unsub = bus.on('portfolio:update', listener);

        // Call once
        bus.emit('portfolio:update', { cash: 10000, totalValue: 15000 });
        expect(listener).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsub();

        // Should not be called again
        bus.emit('portfolio:update', { cash: 9000, totalValue: 14000 });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle emit with no subscribers', () => {
        // Should not throw
        expect(() => {
            bus.emit('game:pause', {});
        }).not.toThrow();
    });

    it('should handle errors in listeners without affecting others', () => {
        const errorListener = vi.fn(() => {
            throw new Error('Listener error');
        });
        const goodListener = vi.fn();

        // Spy on console.error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        bus.on('market:tick', errorListener);
        bus.on('market:tick', goodListener);

        bus.emit('market:tick', { turn: 1, prices: {} });

        // Error listener was called (and threw)
        expect(errorListener).toHaveBeenCalled();
        // Good listener still got called
        expect(goodListener).toHaveBeenCalled();
        // Error was logged
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('should remove all listeners with off()', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        bus.on('news:triggered', listener1);
        bus.on('news:triggered', listener2);

        bus.off('news:triggered');
        bus.emit('news:triggered', { eventId: '1', headline: 'Test', impact: 'positive' });

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
    });

    it('should clear all listeners with clear()', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        bus.on('market:tick', listener1);
        bus.on('order:filled', listener2);

        bus.clear();

        bus.emit('market:tick', { turn: 1, prices: {} });
        bus.emit('order:filled', { orderId: '1', ticker: 'ZAP', price: 150, shares: 10 });

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
    });

    it('should report listener count', () => {
        expect(bus.listenerCount('market:tick')).toBe(0);

        const unsub1 = bus.on('market:tick', vi.fn());
        expect(bus.listenerCount('market:tick')).toBe(1);

        bus.on('market:tick', vi.fn());
        expect(bus.listenerCount('market:tick')).toBe(2);

        unsub1();
        expect(bus.listenerCount('market:tick')).toBe(1);
    });
});
