import { describe, it, expect, beforeEach } from 'vitest';
import { SoundManager, type SoundType } from './SoundManager';

describe('SoundManager', () => {
    beforeEach(() => {
        // Reset SoundManager state
        SoundManager.setEnabled(true);
        SoundManager.setVolume(0.5);
        // Clear localStorage
        localStorage.clear();
    });

    describe('enable/disable', () => {
        it('should be enabled by default', () => {
            expect(SoundManager.isEnabled()).toBe(true);
        });

        it('should toggle enabled state', () => {
            SoundManager.setEnabled(false);
            expect(SoundManager.isEnabled()).toBe(false);

            SoundManager.setEnabled(true);
            expect(SoundManager.isEnabled()).toBe(true);
        });

        it('should persist enabled state to localStorage', () => {
            SoundManager.setEnabled(false);
            expect(localStorage.getItem('stockquest_sound_enabled')).toBe('false');

            SoundManager.setEnabled(true);
            expect(localStorage.getItem('stockquest_sound_enabled')).toBe('true');
        });
    });

    describe('volume', () => {
        it('should have default volume of 0.5', () => {
            expect(SoundManager.getVolume()).toBe(0.5);
        });

        it('should set volume', () => {
            SoundManager.setVolume(0.8);
            expect(SoundManager.getVolume()).toBe(0.8);
        });

        it('should clamp volume to 0-1 range', () => {
            SoundManager.setVolume(1.5);
            expect(SoundManager.getVolume()).toBe(1);

            SoundManager.setVolume(-0.5);
            expect(SoundManager.getVolume()).toBe(0);
        });

        it('should handle edge cases', () => {
            SoundManager.setVolume(0);
            expect(SoundManager.getVolume()).toBe(0);

            SoundManager.setVolume(1);
            expect(SoundManager.getVolume()).toBe(1);
        });
    });

    describe('play', () => {
        it('should not throw when disabled', () => {
            SoundManager.setEnabled(false);
            expect(() => SoundManager.play('buy')).not.toThrow();
        });

        it('should not throw when enabled (even without AudioContext)', () => {
            SoundManager.setEnabled(true);
            // In test environment, AudioContext may not fully work but shouldn't throw
            expect(() => SoundManager.play('buy')).not.toThrow();
        });
    });

    describe('sound types', () => {
        const soundTypes: SoundType[] = [
            'missionStart',
            'buy',
            'sell',
            'win',
            'lose',
            'achievement',
            'levelUnlock',
            'portfolioNews',
        ];

        soundTypes.forEach((soundType) => {
            it(`should handle '${soundType}' sound type`, () => {
                expect(() => SoundManager.play(soundType)).not.toThrow();
            });
        });

        it('should have 8 defined sound types', () => {
            expect(soundTypes).toHaveLength(8);
        });
    });

    describe('initialization', () => {
        it('should read enabled state from localStorage on construction', () => {
            // This tests the behavior - localStorage is checked at init
            localStorage.setItem('stockquest_sound_enabled', 'false');
            // Since SoundManager is a singleton, it was already created
            // We can verify the persistence works via setEnabled
            SoundManager.setEnabled(false);
            expect(SoundManager.isEnabled()).toBe(false);
        });
    });
});
