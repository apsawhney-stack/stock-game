import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from './StorageAdapter';

describe('MemoryStorageAdapter', () => {
    let storage: MemoryStorageAdapter;

    beforeEach(() => {
        storage = new MemoryStorageAdapter();
    });

    it('should save data to storage', async () => {
        await storage.save('test', { value: 123 });

        const exists = await storage.exists('test');
        expect(exists).toBe(true);
    });

    it('should load data from storage', async () => {
        await storage.save('user', { name: 'Alice', score: 1000 });

        const data = await storage.load<{ name: string; score: number }>('user');
        expect(data).toEqual({ name: 'Alice', score: 1000 });
    });

    it('should return null for missing keys', async () => {
        const data = await storage.load('nonexistent');
        expect(data).toBeNull();
    });

    it('should delete data', async () => {
        await storage.save('temp', 'data');

        const deleted = await storage.delete('temp');
        expect(deleted).toBe(true);

        const exists = await storage.exists('temp');
        expect(exists).toBe(false);
    });

    it('should list all keys', async () => {
        await storage.save('game_1', { id: 1 });
        await storage.save('game_2', { id: 2 });
        await storage.save('user_1', { id: 1 });

        const allKeys = await storage.listKeys();
        expect(allKeys.length).toBe(3);

        const gameKeys = await storage.listKeys('game_');
        expect(gameKeys.length).toBe(2);
    });

    it('should clear all data', async () => {
        await storage.save('a', 1);
        await storage.save('b', 2);
        await storage.save('c', 3);

        await storage.clear();

        const keys = await storage.listKeys();
        expect(keys.length).toBe(0);
    });

    it('should handle complex objects', async () => {
        const complexData = {
            portfolio: {
                cash: 10000,
                lots: [
                    { ticker: 'ZAP', shares: 10, costBasis: 150 },
                ],
            },
            settings: {
                sound: true,
                difficulty: 'medium',
            },
        };

        await storage.save('game_state', complexData);
        const loaded = await storage.load('game_state');

        expect(loaded).toEqual(complexData);
    });
});
