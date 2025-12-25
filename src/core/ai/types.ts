/**
 * AI Types
 * Type definitions for AI opponent system
 * Per GDD Section 5.1
 */

/**
 * AI Personality/Tier
 */
export type AIPersonality = 'nancy' | 'bob' | 'sam' | 'panda';

/**
 * AI Persona definition
 */
export interface AIPersona {
    readonly id: AIPersonality;
    readonly name: string;
    readonly title: string;
    readonly emoji: string;
    readonly levelRange: [number, number]; // [min, max] level
    readonly description: string;
}

/**
 * Available AI personas (from GDD)
 */
export const AI_PERSONAS: Record<AIPersonality, AIPersona> = {
    nancy: {
        id: 'nancy',
        name: 'Newbie Nancy',
        title: 'The Beginner',
        emoji: '👧',
        levelRange: [1, 3],
        description: 'Buys randomly and panic sells when scared',
    },
    bob: {
        id: 'bob',
        name: 'Basic Bob',
        title: 'The Trend Follower',
        emoji: '👨',
        levelRange: [4, 5],
        description: 'Diversifies and follows trends',
    },
    sam: {
        id: 'sam',
        name: 'Savvy Sam',
        title: 'The News Reader',
        emoji: '🧑‍💼',
        levelRange: [6, 7],
        description: 'Reacts to news and uses options',
    },
    panda: {
        id: 'panda',
        name: 'Professor Panda',
        title: 'The Expert',
        emoji: '🐼',
        levelRange: [8, 99],
        description: 'Near-optimal contrarian plays',
    },
};

/**
 * AI action types
 */
export type AIActionType = 'buy' | 'sell' | 'hold';

/**
 * AI decision for a turn
 */
export interface AIDecision {
    readonly action: AIActionType;
    readonly ticker?: string;
    readonly quantity?: number;
    readonly reason: string;          // Kid-friendly explanation
    readonly emotionalState?: string; // e.g., "nervous", "excited", "confident"
}

/**
 * AI holding (simplified)
 */
export interface AIHolding {
    readonly ticker: string;
    readonly shares: number;
    readonly avgCost: number;
    readonly purchaseTurn: number;
}

/**
 * AI portfolio state
 */
export interface AIPortfolioState {
    readonly persona: AIPersonality;
    readonly cash: number;
    readonly holdings: readonly AIHolding[];
    readonly totalValue: number;
    readonly decisions: readonly AIDecision[];  // History of decisions
    readonly lastDecision: AIDecision | null;   // Most recent for UI display
}

/**
 * AI comparison result for end of game
 */
export interface AIComparisonResult {
    readonly playerReturn: number;     // Percentage return
    readonly aiReturn: number;
    readonly playerWon: boolean;
    readonly margin: number;           // Difference in percentage points
    readonly explanation: string;      // Kid-friendly explanation of why
    readonly aiMistakes: string[];     // List of AI mistakes to learn from
    readonly playerStrengths: string[];// What player did well
}

/**
 * Get persona for a given player level
 */
export function getPersonaForLevel(level: number): AIPersona {
    for (const persona of Object.values(AI_PERSONAS)) {
        if (level >= persona.levelRange[0] && level <= persona.levelRange[1]) {
            return persona;
        }
    }
    // Default to Nancy for level 1
    return AI_PERSONAS.nancy;
}

/**
 * Initial AI portfolio state
 */
export function createInitialAIPortfolio(
    persona: AIPersonality = 'nancy',
    startingCash: number = 10000
): AIPortfolioState {
    return {
        persona,
        cash: startingCash,
        holdings: [],
        totalValue: startingCash,
        decisions: [],
        lastDecision: null,
    };
}
