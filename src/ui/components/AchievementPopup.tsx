/**
 * AchievementPopup Component
 * Animated popup when an achievement is unlocked
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import type { Achievement } from '../../core/scoring/types';
import './AchievementPopup.css';

interface AchievementPopupProps {
    achievement: Achievement | null;
    onClose: () => void;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

export function AchievementPopup({
    achievement,
    onClose,
    autoClose = true,
    autoCloseDelay = 4000,
}: AchievementPopupProps) {
    // Auto-close after delay
    useEffect(() => {
        if (achievement && autoClose) {
            const timer = setTimeout(onClose, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [achievement, autoClose, autoCloseDelay, onClose]);

    const tierColors = {
        bronze: '#cd7f32',
        silver: '#c0c0c0',
        gold: '#ffd700',
    };

    return (
        <AnimatePresence>
            {achievement && (
                <motion.div
                    className="achievement-popup"
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                    }}
                >
                    <div
                        className="achievement-popup__glow"
                        style={{ backgroundColor: tierColors[achievement.tier] }}
                    />

                    <motion.div
                        className="achievement-popup__icon"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        <span className="achievement-popup__emoji">{achievement.iconEmoji}</span>
                    </motion.div>

                    <div className="achievement-popup__content">
                        <div className="achievement-popup__header">
                            <Trophy size={14} color={tierColors[achievement.tier]} />
                            <span
                                className="achievement-popup__tier"
                                style={{ color: tierColors[achievement.tier] }}
                            >
                                {achievement.tier.toUpperCase()}
                            </span>
                        </div>

                        <motion.h3
                            className="achievement-popup__name"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {achievement.name}
                        </motion.h3>

                        <motion.p
                            className="achievement-popup__description"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {achievement.description}
                        </motion.p>

                        {achievement.xpReward > 0 && (
                            <motion.div
                                className="achievement-popup__reward"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                +{achievement.xpReward} XP
                            </motion.div>
                        )}
                    </div>

                    <button
                        className="achievement-popup__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>

                    {/* Confetti particles */}
                    <div className="achievement-popup__confetti">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="confetti-particle"
                                style={{
                                    left: `${10 + Math.random() * 80}%`,
                                    backgroundColor: tierColors[achievement.tier],
                                }}
                                initial={{ y: 0, opacity: 1, scale: 1 }}
                                animate={{
                                    y: [0, -50, 100],
                                    opacity: [1, 1, 0],
                                    scale: [1, 1.2, 0.5],
                                    x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100],
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.05,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
