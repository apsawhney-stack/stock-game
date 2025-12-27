/**
 * Game Store
 * Central Zustand store for StockQuest game state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameStore, SessionState, MarketState, UIState, Notification, EventState } from './types';
import type { PortfolioState, Order, OrderRequest } from '../../core/types';
import type { ScreenName } from '../../ui/screens/ScreenRouter';
import { createInitialPortfolio } from '../../core/types/portfolio';
import type { ScoringState, XPEarnedEvent } from '../../core/scoring/types';
import { createInitialScoringState, createInitialAchievementState } from '../../core/scoring/types';
import type { AIPortfolioState, AIDecision } from '../../core/ai/types';
import { createInitialAIPortfolio } from '../../core/ai/types';
import missionsData from '../../data/missions.json';

// Mission type from JSON
interface MissionData {
    id: string;
    level: number;
    name: string;
    subtitle: string;
    goal: string;
    description: string;
    startingCash: number;
    maxTurns: number;
    targetReturn: number;
    difficulty: string;
}

const MISSIONS = missionsData.missions as MissionData[];

// Initial states
const initialSession: SessionState = {
    missionId: null,
    missionName: '',
    missionGoal: '',
    targetReturn: 0.05,
    turn: 0,
    maxTurns: 10,
    phase: 'menu',
    startingCash: 10000,
    startedAt: null,
};

const initialMarket: MarketState = {
    prices: {},
    previousPrices: {},
    priceHistory: {},
    turn: 0,
};

const initialUI: UIState = {
    currentScreen: 'home',
    notifications: [],
    isLoading: false,
    selectedTicker: null,
};

const initialEvents: EventState = {
    activeEvents: [],
    eventHistory: [],
    readEventIds: [],
};

const initialMissions = {
    completedMissions: [],
    unlockedMissions: ['first-trade'],  // Level 1 unlocked by default
};

const initialPortfolio: PortfolioState = createInitialPortfolio(10000);

// Generate unique notification ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Main game store with Zustand + Immer for immutable updates
 */
export const useGameStore = create<GameStore>()(
    subscribeWithSelector(
        immer((set) => ({
            // Initial state
            session: initialSession,
            market: initialMarket,
            events: initialEvents,
            scoring: createInitialScoringState(),
            achievements: createInitialAchievementState(),
            missions: initialMissions,
            ai: createInitialAIPortfolio('nancy', 10000),
            portfolio: initialPortfolio,
            pendingOrders: [],
            orderHistory: [],
            ui: initialUI,

            actions: {
                // === Session Actions ===
                startMission: (missionId: string) => {
                    // Find mission data from JSON
                    const mission = MISSIONS.find(m => m.id === missionId);
                    if (!mission) {
                        console.error(`Mission not found: ${missionId}`);
                        return;
                    }

                    set((state) => {
                        state.session.missionId = missionId;
                        state.session.phase = 'briefing';
                        state.session.turn = 0;
                        state.session.startedAt = Date.now();

                        // Use mission data from JSON
                        state.session.missionName = mission.name;
                        state.session.missionGoal = mission.goal;
                        state.session.targetReturn = mission.targetReturn;
                        state.session.maxTurns = mission.maxTurns;
                        state.session.startingCash = mission.startingCash;

                        // Reset portfolio with mission-specific starting cash
                        state.portfolio = createInitialPortfolio(mission.startingCash) as any;

                        // Clear orders
                        state.pendingOrders = [];
                        state.orderHistory = [];

                        // Navigate to briefing
                        state.ui.currentScreen = 'missionBriefing';
                    });
                },

                advanceTurn: () => {
                    set((state) => {
                        state.session.turn += 1;
                        state.market.turn = state.session.turn;

                        // Note: previousPrices is handled by updatePrices action
                        // Don't overwrite it here!

                        // Process pending market orders
                        const ordersToProcess = [...state.pendingOrders];
                        const filledOrders: Order[] = [];
                        const remainingOrders: Order[] = [];

                        for (const order of ordersToProcess) {
                            // Only process market orders (limit orders would need price checks)
                            if (order.type === 'market') {
                                // Use the locked-in targetPrice from when order was placed
                                const fillPrice = order.targetPrice;
                                if (fillPrice) {
                                    const totalValue = fillPrice * order.quantity;

                                    if (order.side === 'buy') {
                                        // Check if we can afford it
                                        if (totalValue <= state.portfolio.cash) {
                                            // Deduct cash
                                            state.portfolio.cash -= totalValue;

                                            // Add new lot with the fill price as cost basis
                                            const newLot = {
                                                ticker: order.ticker,
                                                shares: order.quantity,
                                                costBasis: fillPrice,
                                                acquiredAt: state.session.turn,
                                            };
                                            state.portfolio.lots = [...state.portfolio.lots, newLot] as any;

                                            // Mark as filled
                                            filledOrders.push({
                                                ...order,
                                                status: 'filled',
                                                filledQuantity: order.quantity,
                                                fillPrice: fillPrice,
                                            });
                                        } else {
                                            // Insufficient funds - keep pending
                                            remainingOrders.push(order);
                                        }
                                    } else {
                                        // Sell order - find lots to sell (FIFO)
                                        let sharesRemaining = order.quantity;
                                        const updatedLots = [];
                                        let realizedPnL = 0;

                                        for (const lot of state.portfolio.lots) {
                                            if (lot.ticker === order.ticker && sharesRemaining > 0) {
                                                if (lot.shares <= sharesRemaining) {
                                                    // Sell entire lot
                                                    realizedPnL += (fillPrice - lot.costBasis) * lot.shares;
                                                    sharesRemaining -= lot.shares;
                                                    // Don't add to updatedLots (lot is closed)
                                                } else {
                                                    // Partial sell
                                                    realizedPnL += (fillPrice - lot.costBasis) * sharesRemaining;
                                                    updatedLots.push({
                                                        ...lot,
                                                        shares: lot.shares - sharesRemaining,
                                                    });
                                                    sharesRemaining = 0;
                                                }
                                            } else {
                                                updatedLots.push(lot);
                                            }
                                        }

                                        if (sharesRemaining === 0) {
                                            // Successful sell
                                            state.portfolio.lots = updatedLots as any;
                                            state.portfolio.cash += totalValue;
                                            state.portfolio.realizedPnL += realizedPnL;
                                            state.portfolio.tradeCount += 1;

                                            filledOrders.push({
                                                ...order,
                                                status: 'filled',
                                                filledQuantity: order.quantity,
                                            });
                                        } else {
                                            // Insufficient shares
                                            remainingOrders.push(order);
                                        }
                                    }
                                } else {
                                    // No price for ticker - keep pending
                                    remainingOrders.push(order);
                                }
                            } else {
                                // Non-market orders stay pending
                                remainingOrders.push(order);
                            }
                        }

                        // Update order lists
                        state.pendingOrders = remainingOrders;
                        state.orderHistory.push(...filledOrders);

                        // Check if mission complete
                        if (state.session.turn >= state.session.maxTurns) {
                            state.session.phase = 'results';
                            state.ui.currentScreen = 'results';
                        }
                    });
                },

                endMission: () => {
                    set((state) => {
                        state.session.phase = 'results';
                        state.ui.currentScreen = 'results';
                    });
                },

                resetGame: () => {
                    set((state) => {
                        state.session = { ...initialSession };
                        state.market = { ...initialMarket };
                        state.portfolio = createInitialPortfolio(10000) as any;
                        state.pendingOrders = [];
                        state.orderHistory = [];
                        state.ui.currentScreen = 'home';
                    });
                },

                // === Mission Actions ===
                completeMission: (missionId: string, success: boolean) => {
                    set((state) => {
                        if (success && !state.missions.completedMissions.includes(missionId)) {
                            state.missions.completedMissions.push(missionId);

                            // Unlock next mission based on which one was completed
                            const UNLOCK_MAP: Record<string, string> = {
                                'first-trade': 'steady-growth',
                                'steady-growth': 'market-news',
                            };

                            const nextMission = UNLOCK_MAP[missionId];
                            if (nextMission && !state.missions.unlockedMissions.includes(nextMission)) {
                                state.missions.unlockedMissions.push(nextMission);
                            }
                        }
                    });
                },

                unlockMission: (missionId: string) => {
                    set((state) => {
                        if (!state.missions.unlockedMissions.includes(missionId)) {
                            state.missions.unlockedMissions.push(missionId);
                        }
                    });
                },

                // === Market Actions ===
                updatePrices: (prices: Record<string, number>) => {
                    set((state) => {
                        state.market.previousPrices = { ...state.market.prices };
                        state.market.prices = prices;

                        // Track price history for charts
                        for (const [ticker, price] of Object.entries(prices)) {
                            if (!state.market.priceHistory[ticker]) {
                                // Initialize with price twice so chart has 2 points for line
                                state.market.priceHistory[ticker] = [price, price];
                            } else {
                                state.market.priceHistory[ticker].push(price);
                            }
                        }
                    });
                },

                // === Portfolio Actions ===
                updatePortfolio: (portfolio: PortfolioState) => {
                    set((state) => {
                        state.portfolio = portfolio as any;
                    });
                },

                // === Order Actions ===
                submitOrder: (orderRequest: OrderRequest) => {
                    set((state) => {
                        // Capture the current price at order submission for market orders
                        const currentPrice = state.market.prices[orderRequest.ticker] ?? 0;

                        const order: Order = {
                            id: generateId(),
                            type: orderRequest.type,
                            side: orderRequest.side,
                            ticker: orderRequest.ticker,
                            quantity: orderRequest.quantity,
                            filledQuantity: 0,
                            limitPrice: orderRequest.limitPrice,
                            stopPrice: orderRequest.stopPrice,
                            status: 'pending',
                            placedAt: state.session.turn,
                            expiresAt: state.session.turn + (orderRequest.expiresInTurns ?? 2),
                            // For market orders, lock in the current price; for limit orders, use limit price
                            targetPrice: orderRequest.type === 'market' ? currentPrice : (orderRequest.limitPrice ?? currentPrice),
                        };
                        state.pendingOrders.push(order);
                    });
                },

                cancelOrder: (orderId: string) => {
                    set((state) => {
                        const index = state.pendingOrders.findIndex((o) => o.id === orderId);
                        if (index !== -1) {
                            const [cancelled] = state.pendingOrders.splice(index, 1);
                            state.orderHistory.push({ ...cancelled, status: 'cancelled' });
                        }
                    });
                },

                clearPendingOrders: () => {
                    set((state) => {
                        state.pendingOrders = [];
                    });
                },

                addToHistory: (orders: Order[]) => {
                    set((state) => {
                        state.orderHistory.push(...orders);
                    });
                },

                // === UI Actions ===
                navigate: (screen: ScreenName) => {
                    set((state) => {
                        state.ui.currentScreen = screen;
                    });
                },

                setSelectedTicker: (ticker: string | null) => {
                    set((state) => {
                        state.ui.selectedTicker = ticker;
                    });
                },

                addNotification: (notification: Omit<Notification, 'id'>) => {
                    set((state) => {
                        state.ui.notifications.push({
                            ...notification,
                            id: generateId(),
                        });
                    });
                },

                removeNotification: (id: string) => {
                    set((state) => {
                        state.ui.notifications = state.ui.notifications.filter(
                            (n) => n.id !== id
                        );
                    });
                },

                setLoading: (loading: boolean) => {
                    set((state) => {
                        state.ui.isLoading = loading;
                    });
                },

                // === Event Actions ===
                triggerEvents: (events: import('../../core/events/types').TriggeredEvent[]) => {
                    set((state) => {
                        // Move previous events to history before adding new ones
                        // This prevents duplicate events from accumulating across turns
                        if (state.events.activeEvents.length > 0) {
                            state.events.eventHistory.push(...state.events.activeEvents as any);
                        }
                        state.events.activeEvents = events as any;
                    });
                },

                markEventRead: (eventId: string) => {
                    set((state) => {
                        const event = state.events.activeEvents.find((e: any) => e.id === eventId);
                        if (event) {
                            (event as any).read = true;
                        }
                    });
                },

                clearEvents: () => {
                    set((state) => {
                        state.events.eventHistory.push(...state.events.activeEvents as any);
                        state.events.activeEvents = [];
                    });
                },

                // === Scoring Actions ===
                awardXP: (event: XPEarnedEvent) => {
                    set((state) => {
                        state.scoring.sessionXP += event.amount;
                        state.scoring.todayXP += event.amount;
                        (state.scoring.xpHistory as XPEarnedEvent[]).push(event);
                    });
                },

                updateScoringState: (updates: Partial<ScoringState>) => {
                    set((state) => {
                        Object.assign(state.scoring, updates);
                    });
                },

                updateAchievementProgress: (type: string, value: number) => {
                    set((state) => {
                        (state.achievements.progress as any)[type] = value;
                    });
                },

                unlockAchievement: (achievementId: string) => {
                    set((state) => {
                        const record = {
                            achievementId,
                            unlockedAt: Date.now(),
                        };
                        (state.achievements.unlocked as any[]).push(record);
                    });
                },

                clearRecentAchievements: () => {
                    set((state) => {
                        state.achievements.recentlyUnlocked = [];
                    });
                },

                // === AI Actions ===
                updateAIPortfolio: (updates: Partial<AIPortfolioState>) => {
                    set((state) => {
                        Object.assign(state.ai, updates);
                    });
                },

                recordAIDecision: (decision: AIDecision) => {
                    set((state) => {
                        (state.ai.decisions as AIDecision[]).push(decision);
                        state.ai.lastDecision = decision;
                    });
                },

                resetAI: () => {
                    set((state) => {
                        Object.assign(state.ai, createInitialAIPortfolio('nancy', state.session.startingCash));
                    });
                },
            },
        }))
    )
);

// Convenience hook to get just the actions
export const useGameActions = () => useGameStore((state) => state.actions);
