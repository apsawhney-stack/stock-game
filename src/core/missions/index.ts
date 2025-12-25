/**
 * Missions Module
 * 
 * Handles mission loading and progression
 */

import missionsData from '../../data/missions.json';
import type { Mission, MissionsData, PlayerProgress } from './types';

// Cast JSON to typed data
const typedMissions = missionsData as MissionsData;

/**
 * Get all missions
 */
export function getAllMissions(): readonly Mission[] {
    return typedMissions.missions;
}

/**
 * Get a specific mission by ID
 */
export function getMission(id: string): Mission | undefined {
    return typedMissions.missions.find(m => m.id === id);
}

/**
 * Get missions available for a given progress state
 */
export function getAvailableMissions(progress: PlayerProgress): readonly Mission[] {
    return typedMissions.missions.filter(mission => {
        // First mission is always available
        if (mission.id === 'first-trade') return true;

        // Check requirements
        if (mission.requirements?.completedMissions) {
            const hasCompleted = mission.requirements.completedMissions.every(
                reqId => progress.completedMissions.includes(reqId)
            );
            if (!hasCompleted) return false;
        }

        if (mission.requirements?.minLevel && progress.currentLevel < mission.requirements.minLevel) {
            return false;
        }

        return true;
    });
}

/**
 * Check if a mission is unlocked for the player
 */
export function isMissionUnlocked(missionId: string, progress: PlayerProgress): boolean {
    const mission = getMission(missionId);
    if (!mission) return false;

    // First mission always unlocked
    if (mission.id === 'first-trade') return true;

    // Check requirements
    if (mission.requirements?.completedMissions) {
        return mission.requirements.completedMissions.every(
            reqId => progress.completedMissions.includes(reqId)
        );
    }

    return true;
}

/**
 * Get the next mission after completing one
 */
export function getNextMission(currentMissionId: string): Mission | undefined {
    const missions = typedMissions.missions;
    const currentIndex = missions.findIndex(m => m.id === currentMissionId);
    if (currentIndex === -1 || currentIndex >= missions.length - 1) return undefined;
    return missions[currentIndex + 1];
}

export { createInitialProgress } from './types';
export type { Mission, PlayerProgress } from './types';
