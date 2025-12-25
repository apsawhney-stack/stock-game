/**
 * Storage Adapter Interface and Implementations
 * 
 * Abstracts storage to support multiple backends (localStorage, file system, etc.)
 */

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
    save<T>(key: string, data: T): Promise<void>;
    load<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    listKeys(prefix?: string): Promise<string[]>;
    clear(): Promise<void>;
}

/**
 * LocalStorage adapter for web/dev testing
 */
export class LocalStorageAdapter implements IStorageAdapter {
    private prefix: string;

    constructor(prefix: string = 'stockquest_') {
        this.prefix = prefix;
    }

    private getKey(key: string): string {
        return this.prefix + key;
    }

    async save<T>(key: string, data: T): Promise<void> {
        const serialized = JSON.stringify(data);
        localStorage.setItem(this.getKey(key), serialized);
    }

    async load<T>(key: string): Promise<T | null> {
        const item = localStorage.getItem(this.getKey(key));
        if (item === null) return null;

        try {
            return JSON.parse(item) as T;
        } catch {
            return null;
        }
    }

    async delete(key: string): Promise<boolean> {
        const exists = localStorage.getItem(this.getKey(key)) !== null;
        localStorage.removeItem(this.getKey(key));
        return exists;
    }

    async exists(key: string): Promise<boolean> {
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    async listKeys(prefix: string = ''): Promise<string[]> {
        const keys: string[] = [];
        const fullPrefix = this.getKey(prefix);

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(fullPrefix)) {
                keys.push(key.slice(this.prefix.length));
            }
        }

        return keys;
    }

    async clear(): Promise<void> {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            localStorage.removeItem(key);
        }
    }
}

/**
 * In-memory storage adapter for testing
 */
export class MemoryStorageAdapter implements IStorageAdapter {
    private storage: Map<string, string> = new Map();

    async save<T>(key: string, data: T): Promise<void> {
        this.storage.set(key, JSON.stringify(data));
    }

    async load<T>(key: string): Promise<T | null> {
        const item = this.storage.get(key);
        if (item === undefined) return null;

        try {
            return JSON.parse(item) as T;
        } catch {
            return null;
        }
    }

    async delete(key: string): Promise<boolean> {
        return this.storage.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        return this.storage.has(key);
    }

    async listKeys(prefix: string = ''): Promise<string[]> {
        const keys: string[] = [];
        for (const key of this.storage.keys()) {
            if (key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    async clear(): Promise<void> {
        this.storage.clear();
    }
}

/**
 * Create the appropriate storage adapter
 */
export function createStorageAdapter(type: 'memory' | 'localStorage' = 'memory'): IStorageAdapter {
    switch (type) {
        case 'localStorage':
            return new LocalStorageAdapter();
        case 'memory':
        default:
            return new MemoryStorageAdapter();
    }
}
