/**
 * XPDisplay Component
 * Shows current XP and daily progress
 */

import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';
import { useGameStore } from '../../app/store';
import './XPDisplay.css';

interface XPDisplayProps {
    variant?: 'compact' | 'full';
    showDailyCap?: boolean;
}

export function XPDisplay({ variant = 'compact', showDailyCap = true }: XPDisplayProps) {
    const sessionXP = useGameStore((state) => state.scoring.sessionXP);
    const todayXP = useGameStore((state) => state.scoring.todayXP);
    const dailyCap = 500; // From GDD

    const dailyProgress = Math.min(100, (todayXP / dailyCap) * 100);
    const capReached = todayXP >= dailyCap;

    if (variant === 'compact') {
        return (
            <motion.div
                className="xp-display xp-display--compact"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
            >
                <Star className="xp-display__icon" size={16} />
                <span className="xp-display__value">{sessionXP}</span>
                <span className="xp-display__label">XP</span>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="xp-display xp-display--full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="xp-display__header">
                <Zap className="xp-display__icon" size={20} />
                <span className="xp-display__title">Experience Points</span>
            </div>

            <div className="xp-display__session">
                <span className="xp-display__session-value">{sessionXP}</span>
                <span className="xp-display__session-label">Session XP</span>
            </div>

            {showDailyCap && (
                <div className="xp-display__daily">
                    <div className="xp-display__daily-header">
                        <span>Daily Progress</span>
                        <span className={capReached ? 'cap-reached' : ''}>
                            {todayXP} / {dailyCap}
                        </span>
                    </div>
                    <div className="xp-display__progress-bar">
                        <motion.div
                            className="xp-display__progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${dailyProgress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    {capReached && (
                        <span className="xp-display__cap-message">
                            ✨ Daily cap reached! Come back tomorrow!
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    );
}
