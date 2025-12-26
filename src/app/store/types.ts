/**
 * Game State Types
 * Central type definitions for the Zustand store
 */

import type { PortfolioState } from '../../core/types';
import type { Order, OrderRequest } from '../../core/types';
import type { ScreenName } from '../../ui/screens/ScreenRouter';
import type { TriggeredEvent } from '../../core/events/types';
import type { ScoringState, AchievementState, XPEarnedEvent } from '../../core/scoring/types';
import type { AIPortfolioState, AIDecision } from '../../core/ai/types';

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

// Mission progress state
export interface MissionState {
    completedMissions: string[];   // IDs of completed missions
    unlockedMissions: string[];    // IDs of unlocked missions (starts with first-trade)
}


// Market state - current prices and history
export interface MarketState {
    prices: Record<string, number>;
    previousPrices: Record<string, number>;
    priceHistory: Record<string, number[]>;  // Ticker -> array of prices by turn
    turn: number;
}

// Event state - news and triggered events
export interface EventState {
    activeEvents: TriggeredEvent[];   // Current turn's events
    eventHistory: TriggeredEvent[];   // All past events
    readEventIds: string[];           // Events user has read
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
    events: EventState;
    scoring: ScoringState;
    achievements: AchievementState;
    missions: MissionState;            // Mission progress
    ai: AIPortfolioState;              // AI opponent state
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

    // Mission actions
    completeMission: (missionId: string, success: boolean) => void;
    unlockMission: (missionId: string) => void;

    // Market actions
    updatePrices: (prices: Record<string, number>) => void;

    // Portfolio actions
    updatePortfolio: (portfolio: PortfolioState) => void;

    // Order actions
    submitOrder: (order: OrderRequest) => void;
    cancelOrder: (orderId: string) => void;
    clearPendingOrders: () => void;
    addToHistory: (orders: Order[]) => void;

    // Event actions
    triggerEvents: (events: TriggeredEvent[]) => void;
    markEventRead: (eventId: string) => void;
    clearEvents: () => void;

    // UI actions
    navigate: (screen: ScreenName) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    setLoading: (loading: boolean) => void;

    // Scoring actions
    awardXP: (event: XPEarnedEvent) => void;
    updateScoringState: (state: Partial<ScoringState>) => void;
    updateAchievementProgress: (type: string, value: number) => void;
    unlockAchievement: (achievementId: string) => void;
    clearRecentAchievements: () => void;

    // AI actions
    updateAIPortfolio: (portfolio: Partial<AIPortfolioState>) => void;
    recordAIDecision: (decision: AIDecision) => void;
    resetAI: () => void;
}

export type GameStore = GameState & { actions: GameActions };
