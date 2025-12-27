/**
 * Mission Selector Component
 * Allows players to select which mission to play from unlocked missions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Target, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { useGameStore, useGameActions } from '../../app/store';
import missionsData from '../../data/missions.json';
import './MissionSelector.css';

interface Mission {
    id: string;
    level: number;
    name: string;
    subtitle: string;
    goal: string;
    description: string;
    startingCash: number;
    maxTurns: number;
    targetReturn: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    unlocked: boolean;
    tips: string[];
}

interface MissionSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const DIFFICULTY_COLORS = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger',
} as const;

const DIFFICULTY_LABELS = {
    beginner: '⭐ Beginner',
    intermediate: '⭐⭐ Intermediate',
    advanced: '⭐⭐⭐ Advanced',
};

export function MissionSelector({ isOpen, onClose }: MissionSelectorProps) {
    const { startMission } = useGameActions();
    const unlockedMissions = useGameStore((state) => state.missions.unlockedMissions);
    const completedMissions = useGameStore((state) => state.missions.completedMissions);

    const missions = missionsData.missions as Mission[];

    const handleSelectMission = (missionId: string) => {
        startMission(missionId);
        onClose();
    };

    const isMissionUnlocked = (missionId: string) => {
        // First mission is always unlocked
        if (missionId === 'first-trade') return true;
        return unlockedMissions.includes(missionId);
    };

    const isMissionCompleted = (missionId: string) => {
        return completedMissions.includes(missionId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="mission-selector__overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="mission-selector__modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mission-selector__header">
                            <h2 className="mission-selector__title">Select Mission</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<X size={20} />}
                                onClick={onClose}
                            >
                                {null}
                            </Button>
                        </div>

                        <div className="mission-selector__list">
                            {missions.map((mission) => {
                                const isUnlocked = isMissionUnlocked(mission.id);
                                const isCompleted = isMissionCompleted(mission.id);

                                return (
                                    <motion.div
                                        key={mission.id}
                                        whileHover={isUnlocked ? { scale: 1.02 } : {}}
                                        whileTap={isUnlocked ? { scale: 0.98 } : {}}
                                    >
                                        <Card
                                            variant={isUnlocked ? 'glass' : 'default'}
                                            padding="md"
                                            className={`mission-card ${!isUnlocked ? 'mission-card--locked' : ''} ${isCompleted ? 'mission-card--completed' : ''}`}
                                            onClick={isUnlocked ? () => handleSelectMission(mission.id) : undefined}
                                        >
                                            <div className="mission-card__header">
                                                <div className="mission-card__level">
                                                    {isUnlocked ? (
                                                        <span className="mission-card__level-number">Level {mission.level}</span>
                                                    ) : (
                                                        <Lock size={16} className="mission-card__lock-icon" />
                                                    )}
                                                </div>
                                                <div className="mission-card__badges">
                                                    {isCompleted && (
                                                        <Badge variant="success" size="sm">✓ Complete</Badge>
                                                    )}
                                                    <Badge
                                                        variant={DIFFICULTY_COLORS[mission.difficulty]}
                                                        size="sm"
                                                    >
                                                        {DIFFICULTY_LABELS[mission.difficulty]}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <h3 className="mission-card__name">{mission.name}</h3>
                                            <p className="mission-card__subtitle">{mission.subtitle}</p>

                                            {isUnlocked && (
                                                <div className="mission-card__stats">
                                                    <div className="mission-card__stat">
                                                        <Target size={14} />
                                                        <span>+{(mission.targetReturn * 100).toFixed(0)}% target</span>
                                                    </div>
                                                    <div className="mission-card__stat">
                                                        <DollarSign size={14} />
                                                        <span>${mission.startingCash.toLocaleString()}</span>
                                                    </div>
                                                    <div className="mission-card__stat">
                                                        <Clock size={14} />
                                                        <span>{mission.maxTurns} days</span>
                                                    </div>
                                                </div>
                                            )}

                                            {isUnlocked && (
                                                <div className="mission-card__action">
                                                    <span>{isCompleted ? 'Play Again' : 'Start'}</span>
                                                    <ChevronRight size={18} />
                                                </div>
                                            )}

                                            {!isUnlocked && (
                                                <p className="mission-card__locked-msg">
                                                    Complete previous missions to unlock
                                                </p>
                                            )}
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
