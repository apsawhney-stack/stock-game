import { describe, it, expect } from 'vitest';
import { RingBuffer } from './RingBuffer';

describe('RingBuffer', () => {
    it('should maintain fixed capacity', () => {
        const buffer = new RingBuffer<number>(3);
        buffer.push(1);
        buffer.push(2);
        buffer.push(3);
        buffer.push(4); // Should overwrite 1

        expect(buffer.size).toBe(3);
        expect(buffer.maxCapacity).toBe(3);
        expect(buffer.toArray()).toEqual([2, 3, 4]);
    });

    it('should overwrite oldest items when full', () => {
        const buffer = new RingBuffer<string>(2);
        buffer.push('a');
        buffer.push('b');
        buffer.push('c'); // Overwrites 'a'
        buffer.push('d'); // Overwrites 'b'

        expect(buffer.toArray()).toEqual(['c', 'd']);
    });

    it('should return items in correct order', () => {
        const buffer = new RingBuffer<number>(5);
        buffer.push(10);
        buffer.push(20);
        buffer.push(30);

        // Oldest first
        expect(buffer.get(0)).toBe(10);
        expect(buffer.get(1)).toBe(20);
        expect(buffer.get(2)).toBe(30);

        // toArray returns oldest first
        expect(buffer.toArray()).toEqual([10, 20, 30]);

        // getLast returns newest first
        expect(buffer.getLast(2)).toEqual([30, 20]);
    });

    it('should handle empty buffer', () => {
        const buffer = new RingBuffer<number>(3);

        expect(buffer.isEmpty).toBe(true);
        expect(buffer.isFull).toBe(false);
        expect(buffer.size).toBe(0);
        expect(buffer.peek()).toBeUndefined();
        expect(buffer.get(0)).toBeUndefined();
        expect(buffer.toArray()).toEqual([]);
        expect(buffer.getLast(5)).toEqual([]);
    });

    it('should report correct size', () => {
        const buffer = new RingBuffer<number>(5);

        expect(buffer.size).toBe(0);

        buffer.push(1);
        expect(buffer.size).toBe(1);

        buffer.push(2);
        buffer.push(3);
        expect(buffer.size).toBe(3);

        buffer.push(4);
        buffer.push(5);
        expect(buffer.size).toBe(5);
        expect(buffer.isFull).toBe(true);

        buffer.push(6);
        expect(buffer.size).toBe(5); // Still 5, not 6
    });

    it('should peek at most recent item', () => {
        const buffer = new RingBuffer<number>(3);

        buffer.push(100);
        expect(buffer.peek()).toBe(100);

        buffer.push(200);
        expect(buffer.peek()).toBe(200);

        buffer.push(300);
        buffer.push(400);
        expect(buffer.peek()).toBe(400);
    });

    it('should clear all items', () => {
        const buffer = new RingBuffer<number>(3);
        buffer.push(1);
        buffer.push(2);
        buffer.push(3);

        buffer.clear();

        expect(buffer.isEmpty).toBe(true);
        expect(buffer.size).toBe(0);
        expect(buffer.toArray()).toEqual([]);
    });

    it('should be iterable', () => {
        const buffer = new RingBuffer<number>(4);
        buffer.push(1);
        buffer.push(2);
        buffer.push(3);

        const items: number[] = [];
        for (const item of buffer) {
            items.push(item);
        }

        expect(items).toEqual([1, 2, 3]);
    });

    it('should throw for invalid capacity', () => {
        expect(() => new RingBuffer(0)).toThrow('capacity must be positive');
        expect(() => new RingBuffer(-1)).toThrow('capacity must be positive');
    });

    it('should handle capacity of 1', () => {
        const buffer = new RingBuffer<string>(1);

        buffer.push('a');
        expect(buffer.toArray()).toEqual(['a']);

        buffer.push('b');
        expect(buffer.toArray()).toEqual(['b']);
        expect(buffer.size).toBe(1);
    });
});
