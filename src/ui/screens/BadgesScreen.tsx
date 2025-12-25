/**
 * BadgesScreen Component
 * 
 * Displays all achievement badges with unlock status and progress
 */

import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Check, Star } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { useGameStore, useGameActions } from '../../app/store';
import './BadgesScreen.css';

// Achievement definitions with details
const BADGES = [
    { id: 'first-trade', name: 'First Trade', description: 'Complete your first buy order', icon: '🎯', xp: 50, category: 'trading', threshold: 1, progressKey: 'count_trades' },
    { id: 'ten-trades', name: 'Trading Pro', description: 'Complete 10 trades', icon: '📈', xp: 100, category: 'trading', threshold: 10, progressKey: 'count_trades' },
    { id: 'diversified', name: 'Diversified', description: 'Own 3 different stocks at once', icon: '🌈', xp: 75, category: 'strategy', threshold: 3, progressKey: 'count_diversified_turns' },
    { id: 'news-reader', name: 'News Reader', description: 'Read 5 news articles', icon: '📰', xp: 25, category: 'learning', threshold: 5, progressKey: 'count_news_read' },
    { id: 'news-junkie', name: 'News Junkie', description: 'Read 20 news articles', icon: '🗞️', xp: 75, category: 'learning', threshold: 20, progressKey: 'count_news_read' },
    { id: 'steady-hands', name: 'Steady Hands', description: 'Hold through a 10% price dip', icon: '💪', xp: 100, category: 'patience', threshold: 1, progressKey: 'count_hold_through_dips' },
    { id: 'diamond-hands', name: 'Diamond Hands', description: 'Hold through 5 price dips', icon: '💎', xp: 200, category: 'patience', threshold: 5, progressKey: 'count_hold_through_dips' },
    { id: 'profit-maker', name: 'Profit Maker', description: 'Complete a mission with 10%+ return', icon: '💰', xp: 150, category: 'trading', threshold: 1, progressKey: 'count_benchmark_beats' },
    { id: 'level-up', name: 'Level Up', description: 'Complete your first mission', icon: '🏆', xp: 100, category: 'milestone', threshold: 1, progressKey: 'count_levels_completed' },
    { id: 'triple-crown', name: 'Triple Crown', description: 'Complete all 3 missions', icon: '👑', xp: 300, category: 'milestone', threshold: 3, progressKey: 'count_levels_completed' },
    { id: 'streak-3', name: 'On a Roll', description: 'Play 3 days in a row', icon: '🔥', xp: 50, category: 'dedication', threshold: 3, progressKey: 'streak_days_played' },
    { id: 'xp-master', name: 'XP Master', description: 'Earn 1000 total XP', icon: '⭐', xp: 100, category: 'milestone', threshold: 1000, progressKey: 'total_xp' },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    trading: { label: 'Trading', color: 'var(--color-success)' },
    learning: { label: 'Learning', color: 'var(--color-info)' },
    patience: { label: 'Patience', color: 'var(--color-warning)' },
    strategy: { label: 'Strategy', color: 'var(--color-primary)' },
    milestone: { label: 'Milestone', color: 'var(--color-secondary)' },
    dedication: { label: 'Dedication', color: '#f97316' },
};

export function BadgesScreen() {
    const { navigate } = useGameActions();
    const achievements = useGameStore((state) => state.achievements);

    const unlockedIds = achievements.unlocked.map(u => u.achievementId);
    const progress = achievements.progress;

    const handleBack = () => {
        navigate('home');
    };

    // Group badges by category
    const badgesByCategory = BADGES.reduce((acc, badge) => {
        if (!acc[badge.category]) acc[badge.category] = [];
        acc[badge.category].push(badge);
        return acc;
    }, {} as Record<string, typeof BADGES>);

    const totalUnlocked = unlockedIds.length;
    const totalBadges = BADGES.length;

    return (
        <div className="badges-screen">
            {/* Header */}
            <header className="badges-screen__header">
                <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={handleBack}>
                    Back
                </Button>
                <h1 className="badges-screen__title">🏅 Badges</h1>
                <Badge variant="info" size="lg">
                    {totalUnlocked}/{totalBadges}
                </Badge>
            </header>

            <main className="badges-screen__content">
                {/* Progress Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="badges-screen__overview"
                >
                    <Card variant="glow" padding="lg">
                        <div className="overview__header">
                            <Star className="overview__icon" size={32} />
                            <div className="overview__text">
                                <span className="overview__title">Badge Collection</span>
                                <span className="overview__subtitle">
                                    {totalUnlocked === 0
                                        ? "Start playing to unlock badges!"
                                        : `${totalUnlocked} badge${totalUnlocked !== 1 ? 's' : ''} unlocked`}
                                </span>
                            </div>
                        </div>
                        <ProgressBar
                            value={(totalUnlocked / totalBadges) * 100}
                            max={100}
                            variant="xp"
                            size="md"
                        />
                    </Card>
                </motion.div>

                {/* Badge Categories */}
                {Object.entries(badgesByCategory).map(([category, badges], categoryIndex) => (
                    <motion.section
                        key={category}
                        className="badges-screen__category"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                    >
                        <h2 className="category__title" style={{ color: CATEGORY_LABELS[category]?.color }}>
                            {CATEGORY_LABELS[category]?.label || category}
                        </h2>
                        <div className="category__grid">
                            {badges.map((badge) => {
                                const isUnlocked = unlockedIds.includes(badge.id);
                                const currentProgress = progress[badge.progressKey as keyof typeof progress] ?? 0;
                                const progressPercent = Math.min(100, (currentProgress / badge.threshold) * 100);

                                return (
                                    <Card
                                        key={badge.id}
                                        variant={isUnlocked ? 'glow' : 'glass'}
                                        padding="md"
                                        className={`badge-card ${isUnlocked ? 'badge-card--unlocked' : 'badge-card--locked'}`}
                                    >
                                        <div className="badge-card__icon-wrapper">
                                            <span className="badge-card__icon">
                                                {isUnlocked ? badge.icon : <Lock size={24} />}
                                            </span>
                                            {isUnlocked && (
                                                <span className="badge-card__check">
                                                    <Check size={12} />
                                                </span>
                                            )}
                                        </div>
                                        <div className="badge-card__info">
                                            <span className="badge-card__name">{badge.name}</span>
                                            <span className="badge-card__description">
                                                {badge.description}
                                            </span>
                                        </div>
                                        {isUnlocked ? (
                                            <Badge variant="success" size="sm">+{badge.xp} XP</Badge>
                                        ) : (
                                            <div className="badge-card__progress">
                                                <ProgressBar
                                                    value={progressPercent}
                                                    max={100}
                                                    size="sm"
                                                    variant="default"
                                                />
                                                <span className="badge-card__progress-text">
                                                    {currentProgress}/{badge.threshold}
                                                </span>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </motion.section>
                ))}
            </main>
        </div>
    );
}
