/**
 * AIEngine
 * Manages AI opponent decision-making
 * Per GDD Section 5.1
 */

import type {
    AIPersonality,
    AIDecision,
    AIHolding,
    AIPortfolioState,
    AIComparisonResult,
} from './types';
import { AI_PERSONAS, createInitialAIPortfolio } from './types';
import { createRandom } from '../utils/random';

/**
 * Stock info needed for AI decisions
 */
export interface StockInfo {
    ticker: string;
    price: number;
    previousPrice: number;
    sector: string;
}

/**
 * AIEngine - makes decisions for AI opponents
 */
export class AIEngine {
    private state: AIPortfolioState;
    private seed: number;

    constructor(
        persona: AIPersonality = 'nancy',
        startingCash: number = 10000,
        seed?: number
    ) {
        this.state = createInitialAIPortfolio(persona, startingCash);
        this.seed = seed ?? Date.now();
    }

    /**
     * Get current AI state
     */
    getState(): AIPortfolioState {
        return this.state;
    }

    /**
     * Get the AI persona info
     */
    getPersona() {
        return AI_PERSONAS[this.state.persona];
    }

    /**
     * Process a turn and make a decision
     */
    processTurn(
        turn: number,
        stocks: StockInfo[]
    ): AIDecision {
        const persona = this.state.persona;

        let decision: AIDecision;

        switch (persona) {
            case 'nancy':
                decision = this.makeNancyDecision(turn, stocks);
                break;
            case 'bob':
                decision = this.makeBobDecision(turn, stocks);
                break;
            case 'sam':
            case 'panda':
            default:
                // For now, default to Nancy behavior
                decision = this.makeNancyDecision(turn, stocks);
        }

        // Execute the decision
        this.executeDecision(decision, stocks);

        // Record the decision
        this.state = {
            ...this.state,
            decisions: [...this.state.decisions, decision],
            lastDecision: decision,
        };

        return decision;
    }

    /**
     * Newbie Nancy's decision logic (GDD Tier 1)
     * - Buys randomly from top 3 performers
     * - Never uses limit orders
     * - Panic sells if any stock drops 10%+
     * - No diversification strategy
     */
    private makeNancyDecision(turn: number, stocks: StockInfo[]): AIDecision {
        const random = createRandom(this.seed + turn);

        // First, check for panic selling
        for (const holding of this.state.holdings) {
            const stock = stocks.find(s => s.ticker === holding.ticker);
            if (!stock) continue;

            const currentValue = stock.price;
            const purchaseValue = holding.avgCost;
            const changePercent = (currentValue - purchaseValue) / purchaseValue;

            // Panic sell if down 10% or more
            if (changePercent <= -0.10) {
                return {
                    action: 'sell',
                    ticker: holding.ticker,
                    quantity: holding.shares,
                    reason: `Oh no! ${holding.ticker} is down ${Math.abs(changePercent * 100).toFixed(0)}%! I better sell before I lose more!`,
                    emotionalState: 'panicked',
                };
            }
        }

        // If we have cash, maybe buy something
        if (this.state.cash >= 50) {
            // Sort stocks by recent performance (best first)
            const sortedByPerformance = [...stocks].sort((a, b) => {
                const aChange = (a.price - a.previousPrice) / a.previousPrice;
                const bChange = (b.price - b.previousPrice) / b.previousPrice;
                return bChange - aChange;
            });

            // Pick randomly from top 3 performers
            const topPerformers = sortedByPerformance.slice(0, 3);
            const chosen = random.pick(topPerformers);

            if (chosen && random.next() < 0.6) { // 60% chance to buy
                // Use 20-40% of cash
                const cashPercent = 0.2 + random.next() * 0.2;
                const amountToSpend = this.state.cash * cashPercent;
                const sharesToBuy = Math.floor(amountToSpend / chosen.price);

                if (sharesToBuy >= 1) {
                    return {
                        action: 'buy',
                        ticker: chosen.ticker,
                        quantity: sharesToBuy,
                        reason: `${chosen.ticker} looks like it's going up! I'm buying some!`,
                        emotionalState: 'excited',
                    };
                }
            }
        }

        // Otherwise, hold
        return {
            action: 'hold',
            reason: "I'm not sure what to do... I'll just wait and see.",
            emotionalState: 'uncertain',
        };
    }

    /**
     * Basic Bob's decision logic (GDD Tier 2)
     * - Diversifies across 3 sectors
     * - Trend-follows (buys stocks up 3+ turns in a row)
     * - Uses limit orders 30% of the time
     * - Holds through small dips
     */
    private makeBobDecision(turn: number, stocks: StockInfo[]): AIDecision {
        // For now, simplified Bob behavior
        const random = createRandom(this.seed + turn);

        // Check sector diversification
        const sectors = new Set(this.state.holdings.map(h => {
            const stock = stocks.find(s => s.ticker === h.ticker);
            return stock?.sector;
        }));

        // If not diversified, try to buy from a new sector
        if (sectors.size < 3 && this.state.cash >= 50) {
            const ownedSectors = new Set(sectors);
            const newSectorStocks = stocks.filter(s => !ownedSectors.has(s.sector));

            if (newSectorStocks.length > 0) {
                const chosen = random.pick(newSectorStocks);
                if (chosen) {
                    const sharesToBuy = Math.floor((this.state.cash * 0.3) / chosen.price);
                    if (sharesToBuy >= 1) {
                        return {
                            action: 'buy',
                            ticker: chosen.ticker,
                            quantity: sharesToBuy,
                            reason: `I should diversify! Buying some ${chosen.ticker} to spread my risk.`,
                            emotionalState: 'confident',
                        };
                    }
                }
            }
        }

        // Default to hold
        return {
            action: 'hold',
            reason: "My portfolio looks balanced. I'll hold for now.",
            emotionalState: 'calm',
        };
    }

    /**
     * Execute an AI decision (update portfolio)
     */
    private executeDecision(decision: AIDecision, stocks: StockInfo[]): void {
        if (decision.action === 'buy' && decision.ticker && decision.quantity) {
            const stock = stocks.find(s => s.ticker === decision.ticker);
            if (!stock) return;

            const totalCost = stock.price * decision.quantity;
            if (totalCost > this.state.cash) return;

            // Check if we already own this stock
            const existingHolding = this.state.holdings.find(h => h.ticker === decision.ticker);

            let newHoldings: AIHolding[];
            if (existingHolding) {
                // Average up/down
                const totalShares = existingHolding.shares + decision.quantity;
                const totalCostBasis = (existingHolding.avgCost * existingHolding.shares) + totalCost;
                const newAvgCost = totalCostBasis / totalShares;

                newHoldings = this.state.holdings.map(h =>
                    h.ticker === decision.ticker
                        ? { ...h, shares: totalShares, avgCost: newAvgCost }
                        : h
                );
            } else {
                // New position
                newHoldings = [
                    ...this.state.holdings,
                    {
                        ticker: decision.ticker,
                        shares: decision.quantity,
                        avgCost: stock.price,
                        purchaseTurn: 0, // Will be set by caller
                    },
                ];
            }

            this.state = {
                ...this.state,
                cash: this.state.cash - totalCost,
                holdings: newHoldings,
            };
        } else if (decision.action === 'sell' && decision.ticker && decision.quantity) {
            const stock = stocks.find(s => s.ticker === decision.ticker);
            if (!stock) return;

            const holding = this.state.holdings.find(h => h.ticker === decision.ticker);
            if (!holding || holding.shares < decision.quantity) return;

            const saleProceeds = stock.price * decision.quantity;
            const remainingShares = holding.shares - decision.quantity;

            let newHoldings: AIHolding[];
            if (remainingShares <= 0) {
                newHoldings = this.state.holdings.filter(h => h.ticker !== decision.ticker);
            } else {
                newHoldings = this.state.holdings.map(h =>
                    h.ticker === decision.ticker
                        ? { ...h, shares: remainingShares }
                        : h
                );
            }

            this.state = {
                ...this.state,
                cash: this.state.cash + saleProceeds,
                holdings: newHoldings,
            };
        }
    }

    /**
     * Calculate total portfolio value
     */
    calculateTotalValue(stocks: StockInfo[]): number {
        let stockValue = 0;
        for (const holding of this.state.holdings) {
            const stock = stocks.find(s => s.ticker === holding.ticker);
            if (stock) {
                stockValue += stock.price * holding.shares;
            }
        }

        const total = this.state.cash + stockValue;

        this.state = {
            ...this.state,
            totalValue: total,
        };

        return total;
    }

    /**
     * Generate comparison result at end of game
     */
    generateComparison(
        playerReturn: number,
        startingCash: number
    ): AIComparisonResult {
        const aiReturn = ((this.state.totalValue - startingCash) / startingCash) * 100;
        const playerWon = playerReturn >= aiReturn;
        const margin = Math.abs(playerReturn - aiReturn);

        // Analyze AI mistakes
        const aiMistakes: string[] = [];
        const playerStrengths: string[] = [];

        // Check for panic sells
        const panicSells = this.state.decisions.filter(
            d => d.emotionalState === 'panicked'
        );
        if (panicSells.length > 0) {
            aiMistakes.push(
                `${this.getPersona().name} panic sold ${panicSells.length} time(s) - selling when scared often means selling low!`
            );
            if (playerWon) {
                playerStrengths.push("You stayed calm when prices dropped!");
            }
        }

        // Check for random buying
        const excitedBuys = this.state.decisions.filter(
            d => d.emotionalState === 'excited' && d.action === 'buy'
        );
        if (excitedBuys.length > 2) {
            aiMistakes.push(
                `${this.getPersona().name} bought stocks just because they were going up - that's chasing trends!`
            );
        }

        // Generate explanation
        let explanation: string;
        if (playerWon) {
            if (margin > 5) {
                explanation = `Great job! You beat ${this.getPersona().name} by ${margin.toFixed(1)}%! Your patience and smart decisions paid off.`;
            } else {
                explanation = `Nice work! You edged out ${this.getPersona().name} by ${margin.toFixed(1)}%. Keep learning and you'll do even better!`;
            }
        } else {
            if (margin > 5) {
                explanation = `${this.getPersona().name} got lucky this time, beating you by ${margin.toFixed(1)}%. Study what happened and try again!`;
            } else {
                explanation = `Close game! ${this.getPersona().name} won by just ${margin.toFixed(1)}%. You're almost there!`;
            }
        }

        return {
            playerReturn,
            aiReturn,
            playerWon,
            margin,
            explanation,
            aiMistakes,
            playerStrengths,
        };
    }

    /**
     * Reset AI for new game
     */
    reset(startingCash: number = 10000): void {
        this.state = createInitialAIPortfolio(this.state.persona, startingCash);
        this.seed = Date.now();
    }
}
