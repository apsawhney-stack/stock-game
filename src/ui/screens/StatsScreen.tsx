/**
 * StatsScreen Component
 * 
 * Shows player statistics, achievements, and mission history
 */

import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Star, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { useGameStore, useGameActions } from '../../app/store';
import { getAllMissions } from '../../core/missions';
import './StatsScreen.css';

// Define achievements locally for display
const ACHIEVEMENT_LIST = [
    { id: 'first_trade', name: 'First Trade', description: 'Complete your first buy order', icon: '🎯', xpReward: 50 },
    { id: 'diversified', name: 'Diversified', description: 'Own 3 different stocks', icon: '🌈', xpReward: 75 },
    { id: 'news_reader', name: 'News Reader', description: 'Read 5 news articles', icon: '📰', xpReward: 25 },
    { id: 'steady_hands', name: 'Steady Hands', description: 'Hold through a 10% dip', icon: '💪', xpReward: 100 },
    { id: 'profit_maker', name: 'Profit Maker', description: 'Earn 10% profit on a mission', icon: '💰', xpReward: 150 },
    { id: 'ten_trades', name: 'Trading Pro', description: 'Complete 10 trades', icon: '📈', xpReward: 100 },
];

export function StatsScreen() {
    const { navigate } = useGameActions();
    const scoring = useGameStore((state) => state.scoring);
    const achievements = useGameStore((state) => state.achievements);

    const missions = getAllMissions();
    const unlockedAchievementIds = achievements.unlocked.map(u => u.achievementId);

    // Calculate stats
    const totalXP = scoring.sessionXP;
    const playerLevel = Math.floor(totalXP / 1000) + 1;
    const xpToNextLevel = 1000 - (totalXP % 1000);
    const levelProgress = (totalXP % 1000) / 1000;

    const handleBack = () => {
        navigate('home');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="stats-screen">
            {/* Header */}
            <header className="stats-screen__header">
                <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={handleBack}>
                    Back
                </Button>
                <h1 className="stats-screen__title">My Stats</h1>
                <div />
            </header>

            <motion.main
                className="stats-screen__content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Player Level Card */}
                <motion.div variants={itemVariants}>
                    <Card variant="glow" padding="lg" className="stats-screen__level-card">
                        <div className="level-card__header">
                            <div className="level-card__avatar">
                                <span className="level-card__avatar-emoji">🎮</span>
                            </div>
                            <div className="level-card__info">
                                <span className="level-card__label">Investor Level</span>
                                <span className="level-card__level">Level {playerLevel}</span>
                            </div>
                            <Badge variant="info" size="lg">
                                <Star size={14} /> {totalXP} XP
                            </Badge>
                        </div>
                        <div className="level-card__progress">
                            <ProgressBar
                                value={levelProgress * 100}
                                max={100}
                                variant="xp"
                                size="md"
                                label={`${xpToNextLevel} XP to next level`}
                            />
                        </div>
                    </Card>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={itemVariants} className="stats-screen__grid">
                    <Card variant="glass" padding="md" className="stat-card">
                        <Trophy className="stat-card__icon" size={28} />
                        <span className="stat-card__value">{unlockedAchievementIds.length}</span>
                        <span className="stat-card__label">Achievements</span>
                    </Card>
                    <Card variant="glass" padding="md" className="stat-card">
                        <Target className="stat-card__icon" size={28} />
                        <span className="stat-card__value">{missions.length}</span>
                        <span className="stat-card__label">Missions</span>
                    </Card>
                    <Card variant="glass" padding="md" className="stat-card">
                        <Clock className="stat-card__icon" size={28} />
                        <span className="stat-card__value">{achievements.progress.count_trades ?? 0}</span>
                        <span className="stat-card__label">Trades Made</span>
                    </Card>
                    <Card variant="glass" padding="md" className="stat-card">
                        <TrendingUp className="stat-card__icon" size={28} />
                        <span className="stat-card__value">{scoring.newsCardsRead}</span>
                        <span className="stat-card__label">News Read</span>
                    </Card>
                </motion.div>

                {/* Achievements Section */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" padding="md" className="stats-screen__achievements">
                        <h2 className="stats-screen__section-title">
                            🏆 Achievements ({unlockedAchievementIds.length}/{ACHIEVEMENT_LIST.length})
                        </h2>
                        <div className="achievement-grid">
                            {ACHIEVEMENT_LIST.map((achievement) => {
                                const isUnlocked = unlockedAchievementIds.includes(achievement.id);
                                return (
                                    <div
                                        key={achievement.id}
                                        className={`achievement-item ${isUnlocked ? 'achievement-item--unlocked' : 'achievement-item--locked'}`}
                                    >
                                        <span className="achievement-item__icon">
                                            {isUnlocked ? achievement.icon : '🔒'}
                                        </span>
                                        <div className="achievement-item__info">
                                            <span className="achievement-item__name">{achievement.name}</span>
                                            <span className="achievement-item__description">
                                                {isUnlocked ? achievement.description : '???'}
                                            </span>
                                        </div>
                                        {isUnlocked && (
                                            <Badge variant="success" size="sm">+{achievement.xpReward} XP</Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.div>

                {/* Missions Section */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" padding="md" className="stats-screen__missions">
                        <h2 className="stats-screen__section-title">📋 Missions</h2>
                        <div className="mission-list">
                            {missions.map((mission, index) => {
                                const isUnlocked = index === 0 || unlockedAchievementIds.length >= index;
                                return (
                                    <div
                                        key={mission.id}
                                        className={`mission-item ${isUnlocked ? 'mission-item--unlocked' : 'mission-item--locked'}`}
                                    >
                                        <div className="mission-item__level">
                                            <Badge variant={isUnlocked ? 'info' : 'default'} size="sm">
                                                Lv.{mission.level}
                                            </Badge>
                                        </div>
                                        <div className="mission-item__info">
                                            <span className="mission-item__name">{mission.name}</span>
                                            <span className="mission-item__goal">{mission.goal}</span>
                                        </div>
                                        <div className="mission-item__status">
                                            {isUnlocked ? (
                                                <span className="mission-item__unlocked">✓</span>
                                            ) : (
                                                <span className="mission-item__locked">🔒</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.div>
            </motion.main>
        </div>
    );
}
