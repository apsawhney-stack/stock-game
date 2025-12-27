/**
 * SoundManager
 * 
 * Manages game sound effects using Web Audio API.
 * Generates kid-friendly synthesized sounds without external audio files.
 */

type SoundType =
    | 'missionStart'
    | 'buy'
    | 'sell'
    | 'win'
    | 'lose'
    | 'achievement'
    | 'levelUnlock'
    | 'portfolioNews';

const STORAGE_KEY = 'stockquest_sound_enabled';

class SoundManagerClass {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.5;

    constructor() {
        // Load preference from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            this.enabled = stored !== 'false';
        }
    }

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    /**
     * Play a beep with specified frequency and duration
     */
    private playTone(
        frequency: number,
        duration: number,
        type: OscillatorType = 'sine',
        attack: number = 0.01,
        decay: number = 0.1
    ): void {
        if (!this.enabled) return;

        try {
            const ctx = this.getContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            // Volume envelope
            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume, now + attack);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, now + attack + decay);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('SoundManager: Could not play sound', e);
        }
    }

    /**
     * Play a sequence of notes
     */
    private playSequence(
        notes: { freq: number; dur: number; delay: number }[],
        type: OscillatorType = 'sine'
    ): void {
        notes.forEach((note) => {
            setTimeout(() => {
                this.playTone(note.freq, note.dur, type);
            }, note.delay);
        });
    }

    /**
     * Play a sound effect
     */
    play(sound: SoundType): void {
        if (!this.enabled) return;

        switch (sound) {
            case 'missionStart':
                // Upbeat ascending arpeggio
                this.playSequence([
                    { freq: 523, dur: 0.15, delay: 0 },      // C5
                    { freq: 659, dur: 0.15, delay: 100 },    // E5
                    { freq: 784, dur: 0.15, delay: 200 },    // G5
                    { freq: 1047, dur: 0.3, delay: 300 },    // C6
                ], 'triangle');
                break;

            case 'buy':
                // Cash register "cha-ching" - rising notes
                this.playSequence([
                    { freq: 800, dur: 0.08, delay: 0 },
                    { freq: 1200, dur: 0.15, delay: 80 },
                ], 'square');
                break;

            case 'sell':
                // Coin drop - descending with bounce
                this.playSequence([
                    { freq: 1000, dur: 0.05, delay: 0 },
                    { freq: 800, dur: 0.05, delay: 50 },
                    { freq: 1200, dur: 0.1, delay: 100 },
                ], 'sine');
                break;

            case 'win':
                // Victory fanfare
                this.playSequence([
                    { freq: 523, dur: 0.2, delay: 0 },       // C5
                    { freq: 659, dur: 0.2, delay: 200 },     // E5
                    { freq: 784, dur: 0.2, delay: 400 },     // G5
                    { freq: 1047, dur: 0.4, delay: 600 },    // C6
                    { freq: 784, dur: 0.15, delay: 800 },    // G5
                    { freq: 1047, dur: 0.5, delay: 950 },    // C6
                ], 'triangle');
                break;

            case 'lose':
                // Gentle "try again" - descending
                this.playSequence([
                    { freq: 440, dur: 0.3, delay: 0 },       // A4
                    { freq: 349, dur: 0.3, delay: 300 },     // F4
                    { freq: 330, dur: 0.5, delay: 600 },     // E4
                ], 'sine');
                break;

            case 'achievement':
                // Trophy sound - bright sparkle
                this.playSequence([
                    { freq: 880, dur: 0.1, delay: 0 },
                    { freq: 1100, dur: 0.1, delay: 100 },
                    { freq: 1320, dur: 0.1, delay: 200 },
                    { freq: 1760, dur: 0.25, delay: 300 },
                ], 'triangle');
                break;

            case 'levelUnlock':
                // Power-up / unlock sound
                this.playSequence([
                    { freq: 440, dur: 0.1, delay: 0 },
                    { freq: 550, dur: 0.1, delay: 80 },
                    { freq: 660, dur: 0.1, delay: 160 },
                    { freq: 880, dur: 0.25, delay: 240 },
                ], 'square');
                break;

            case 'portfolioNews':
                // Alert notification - attention grabbing but friendly
                this.playSequence([
                    { freq: 660, dur: 0.1, delay: 0 },
                    { freq: 880, dur: 0.15, delay: 120 },
                ], 'sine');
                break;
        }
    }

    /**
     * Enable or disable sounds
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, String(enabled));
        }
    }

    /**
     * Check if sounds are enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get current volume
     */
    getVolume(): number {
        return this.volume;
    }
}

// Singleton instance
export const SoundManager = new SoundManagerClass();
export type { SoundType };
