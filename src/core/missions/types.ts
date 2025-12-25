/**
 * Mission Types
 * 
 * Types for the mission/level system
 */

export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface MissionRewards {
    readonly xpBonus: number;
    readonly achievement?: string;
}

export interface MissionRequirements {
    readonly completedMissions?: readonly string[];
    readonly minLevel?: number;
}

export interface Mission {
    readonly id: string;
    readonly level: number;
    readonly name: string;
    readonly subtitle: string;
    readonly goal: string;
    readonly description: string;
    readonly startingCash: number;
    readonly maxTurns: number;
    readonly targetReturn: number;
    readonly difficulty: MissionDifficulty;
    readonly unlocked: boolean;
    readonly tips: readonly string[];
    readonly rewards: MissionRewards;
    readonly requirements?: MissionRequirements;
}

export interface MissionsData {
    readonly missions: readonly Mission[];
}

// Player progress tracking
export interface PlayerProgress {
    readonly completedMissions: readonly string[];
    readonly currentLevel: number;
    readonly totalXP: number;
    readonly missionsPlayed: number;
    readonly highestReturn: number;
}

export const createInitialProgress = (): PlayerProgress => ({
    completedMissions: [],
    currentLevel: 1,
    totalXP: 0,
    missionsPlayed: 0,
    highestReturn: 0,
});
