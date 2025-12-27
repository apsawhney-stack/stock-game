/**
 * useSoundEffects Hook
 * 
 * Provides sound playback functionality and exposes SoundManager methods.
 */

import { useCallback } from 'react';
import { SoundManager, type SoundType } from '../../core/utils/SoundManager';

/**
 * Hook to access sound effect functionality
 */
export function useSoundEffects() {
    const playSound = useCallback((sound: SoundType) => {
        SoundManager.play(sound);
    }, []);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        SoundManager.setEnabled(enabled);
    }, []);

    const isSoundEnabled = useCallback(() => {
        return SoundManager.isEnabled();
    }, []);

    const setVolume = useCallback((volume: number) => {
        SoundManager.setVolume(volume);
    }, []);

    return {
        playSound,
        setSoundEnabled,
        isSoundEnabled,
        setVolume,
    };
}

export type { SoundType };
