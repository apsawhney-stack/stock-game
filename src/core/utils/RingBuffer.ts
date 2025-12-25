/**
 * RingBuffer - Fixed-size circular buffer
 * 
 * Efficient for storing price history with O(1) append.
 * When full, oldest items are automatically overwritten.
 */
export class RingBuffer<T> {
    private buffer: (T | undefined)[];
    private head: number = 0;
    private _size: number = 0;

    /**
     * Create a new RingBuffer with specified capacity
     */
    constructor(private readonly capacity: number) {
        if (capacity <= 0) {
            throw new Error('RingBuffer capacity must be positive');
        }
        this.buffer = new Array(capacity);
    }

    /**
     * Add an item to the buffer.
     * If full, overwrites the oldest item.
     */
    push(item: T): void {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.capacity;
        this._size = Math.min(this._size + 1, this.capacity);
    }

    /**
     * Get the most recently added item
     */
    peek(): T | undefined {
        if (this._size === 0) return undefined;
        const index = (this.head - 1 + this.capacity) % this.capacity;
        return this.buffer[index];
    }

    /**
     * Get item at index (0 = oldest, size-1 = newest)
     */
    get(index: number): T | undefined {
        if (index < 0 || index >= this._size) return undefined;
        const start = this._size === this.capacity ? this.head : 0;
        const actualIndex = (start + index) % this.capacity;
        return this.buffer[actualIndex];
    }

    /**
     * Get all items as array (oldest first)
     */
    toArray(): T[] {
        const result: T[] = [];
        for (let i = 0; i < this._size; i++) {
            const item = this.get(i);
            if (item !== undefined) {
                result.push(item);
            }
        }
        return result;
    }

    /**
     * Get the last N items (newest first)
     */
    getLast(n: number): T[] {
        const result: T[] = [];
        const count = Math.min(n, this._size);
        for (let i = 0; i < count; i++) {
            const item = this.get(this._size - 1 - i);
            if (item !== undefined) {
                result.push(item);
            }
        }
        return result;
    }

    /**
     * Number of items currently in buffer
     */
    get size(): number {
        return this._size;
    }

    /**
     * Maximum capacity of buffer
     */
    get maxCapacity(): number {
        return this.capacity;
    }

    /**
     * Whether buffer is at capacity
     */
    get isFull(): boolean {
        return this._size === this.capacity;
    }

    /**
     * Whether buffer is empty
     */
    get isEmpty(): boolean {
        return this._size === 0;
    }

    /**
     * Clear all items
     */
    clear(): void {
        this.buffer = new Array(this.capacity);
        this.head = 0;
        this._size = 0;
    }

    /**
     * Iterate over items (oldest first)
     */
    *[Symbol.iterator](): Iterator<T> {
        for (let i = 0; i < this._size; i++) {
            const item = this.get(i);
            if (item !== undefined) {
                yield item;
            }
        }
    }
}
