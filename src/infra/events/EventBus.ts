/**
 * TypedEventBus
 * 
 * Type-safe event bus for decoupled communication between modules.
 */

/**
 * Event map type - extend this interface to add new event types
 */
export interface EventMap {
    // Market events
    'market:tick': { turn: number; prices: Record<string, number> };
    'market:priceChange': { ticker: string; oldPrice: number; newPrice: number; change: number };

    // Order events
    'order:submitted': { orderId: string; ticker: string; side: 'buy' | 'sell'; quantity: number };
    'order:filled': { orderId: string; ticker: string; price: number; shares: number };
    'order:cancelled': { orderId: string };
    'order:expired': { orderId: string };

    // Portfolio events
    'portfolio:trade': { ticker: string; side: 'buy' | 'sell'; shares: number; price: number };
    'portfolio:update': { cash: number; totalValue: number };
    'portfolio:dividend': { ticker: string; amount: number };

    // Game events
    'game:start': { missionId: string };
    'game:pause': Record<string, never>;
    'game:resume': Record<string, never>;
    'game:end': { success: boolean; score: number };
    'game:achievement': { achievementId: string; name: string };

    // News/Story events
    'news:triggered': { eventId: string; headline: string; impact: 'positive' | 'negative' | 'neutral' };

    // UI events
    'ui:notification': { message: string; type: 'info' | 'success' | 'warning' | 'error' };
}

/**
 * Listener type for a specific event
 */
export type EventListener<K extends keyof EventMap> = (payload: EventMap[K]) => void;

/**
 * TypedEventBus implementation
 */
export class TypedEventBus {
    private listeners: Map<keyof EventMap, Set<EventListener<keyof EventMap>>> = new Map();

    /**
     * Subscribe to an event
     * Returns an unsubscribe function
     */
    on<K extends keyof EventMap>(event: K, listener: EventListener<K>): () => void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(listener as EventListener<keyof EventMap>);

        // Return unsubscribe function
        return () => {
            set?.delete(listener as EventListener<keyof EventMap>);
        };
    }

    /**
     * Subscribe to an event for one-time notification
     */
    once<K extends keyof EventMap>(event: K, listener: EventListener<K>): () => void {
        const wrappedListener: EventListener<K> = (payload) => {
            unsubscribe();
            listener(payload);
        };
        const unsubscribe = this.on(event, wrappedListener);
        return unsubscribe;
    }

    /**
     * Emit an event to all subscribers
     */
    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
        const set = this.listeners.get(event);
        if (!set) return;

        for (const listener of set) {
            try {
                (listener as EventListener<K>)(payload);
            } catch (error) {
                console.error(`Error in event listener for ${String(event)}:`, error);
            }
        }
    }

    /**
     * Remove all listeners for an event
     */
    off<K extends keyof EventMap>(event: K): void {
        this.listeners.delete(event);
    }

    /**
     * Remove all listeners for all events
     */
    clear(): void {
        this.listeners.clear();
    }

    /**
     * Get count of listeners for an event
     */
    listenerCount<K extends keyof EventMap>(event: K): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}

/**
 * Global event bus instance
 */
export const eventBus = new TypedEventBus();

/**
 * Create a new event bus instance
 */
export function createEventBus(): TypedEventBus {
    return new TypedEventBus();
}
