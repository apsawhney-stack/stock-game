/**
 * Game State Types
 * Central type definitions for the Zustand store
 */

import type { PortfolioState } from '../../core/types';
import type { Order, OrderRequest } from '../../core/types';
import type { ScreenName } from '../../ui/screens/ScreenRouter';

// Session state - tracks current game session
export interface SessionState {
    missionId: string | null;
    missionName: string;
    missionGoal: string;
    targetReturn: number;      // e.g., 0.05 for 5%
    turn: number;
    maxTurns: number;
    phase: 'menu' | 'briefing' | 'playing' | 'paused' | 'results';
    startingCash: number;
    startedAt: number | null;  // Timestamp
}

// Market state - current prices and history
export interface MarketState {
    prices: Record<string, number>;
    previousPrices: Record<string, number>;
    turn: number;
}

// UI state - screen and notifications
export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    duration?: number;
}

export interface UIState {
    currentScreen: ScreenName;
    notifications: Notification[];
    isLoading: boolean;
}

// Complete game state
export interface GameState {
    session: SessionState;
    market: MarketState;
    portfolio: PortfolioState;
    pendingOrders: Order[];
    orderHistory: Order[];
    ui: UIState;
}

// Store actions
export interface GameActions {
    // Session actions
    startMission: (missionId: string) => void;
    advanceTurn: () => void;
    endMission: () => void;
    resetGame: () => void;

    // Market actions
    updatePrices: (prices: Record<string, number>) => void;

    // Portfolio actions
    updatePortfolio: (portfolio: PortfolioState) => void;

    // Order actions
    submitOrder: (order: OrderRequest) => void;
    cancelOrder: (orderId: string) => void;
    clearPendingOrders: () => void;
    addToHistory: (orders: Order[]) => void;

    // UI actions
    navigate: (screen: ScreenName) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export type GameStore = GameState & { actions: GameActions };
