import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MissionSelector } from '../components/MissionSelector';
import { useGameActions } from '../../app/store';
import { useSoundEffects } from '../../app/hooks/useSoundEffects';
import './HomeScreen.css';

// Daily tips for learning
const dailyTips = [
    "Diversification means spreading your investments across different companies so one bad day doesn't hurt too much!",
    "A stock is a tiny piece of a company. When you buy stock, you become a part-owner!",
    "The stock market goes up and down every day, but over time it has historically gone up.",
    "Patience is a superpower in investing. The best investors think long-term!",
    "Before buying a stock, ask yourself: Do I understand what this company does?",
    "An ETF is like a basket of many stocks. It's an easy way to diversify!",
    "When prices drop, good investors see opportunity, not panic!",
    "Dividends are like getting a thank-you gift just for owning a stock!",
];

export function HomeScreen() {
    const [currentTip, setCurrentTip] = useState(0);
    const [showMissionSelector, setShowMissionSelector] = useState(false);
    const { navigate } = useGameActions();
    const { isSoundEnabled, setSoundEnabled } = useSoundEffects();
    const [soundOn, setSoundOn] = useState(isSoundEnabled());

    useEffect(() => {
        // Rotate tips every 10 seconds
        const interval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % dailyTips.length);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleSound = () => {
        const newValue = !soundOn;
        setSoundOn(newValue);
        setSoundEnabled(newValue);
    };

    return (
        <div className="home-screen">
            {/* Floating decorative elements */}
            <div className="home-screen__decorations">
                <motion.div
                    className="decoration decoration--1"
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="decoration decoration--2"
                    animate={{ y: [0, 15, 0], rotate: [0, -15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                <motion.div
                    className="decoration decoration--3"
                    animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
            </div>

            {/* Header */}
            <header className="home-screen__header">
                <motion.div
                    className="home-screen__sound-toggle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        onClick={toggleSound}
                        className="sound-toggle-btn"
                    >
                        {null}
                    </Button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="logo">
                        <h1 className="logo__text">
                            <span className="logo__stock">Stock</span>
                            <span className="logo__quest">Quest</span>
                        </h1>
                    </div>
                    <p className="home-screen__tagline">Learn investing through play!</p>
                </motion.div>
            </header>

            {/* Main content */}
            <main className="home-screen__main">
                {/* Play Button - Hero CTA */}
                <motion.div
                    className="home-screen__hero"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<Play size={28} />}
                        className="play-button"
                        onClick={() => setShowMissionSelector(true)}
                    >
                        PLAY
                    </Button>
                    <p className="home-screen__subtitle">Choose your mission</p>
                </motion.div>

                <motion.div
                    className="home-screen__nav-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card variant="glass" className="nav-card" onClick={() => navigate('stats')}>
                        <div className="nav-card__icon nav-card__icon--stats">
                            📊
                        </div>
                        <span className="nav-card__label">My Stats</span>
                    </Card>

                    <Card variant="glass" className="nav-card" onClick={() => navigate('badges')}>
                        <div className="nav-card__icon nav-card__icon--badges">
                            🏆
                        </div>
                        <span className="nav-card__label">Badges</span>
                    </Card>
                </motion.div>

                {/* Daily Tip */}
                <motion.div
                    className="daily-tip"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Card variant="glow" padding="md">
                        <div className="daily-tip__header">
                            <Lightbulb className="daily-tip__icon" size={24} />
                            <span className="daily-tip__title">Daily Tip</span>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentTip}
                                className="daily-tip__text"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {dailyTips[currentTip]}
                            </motion.p>
                        </AnimatePresence>
                        <div className="daily-tip__dots">
                            {dailyTips.slice(0, 5).map((_, i) => (
                                <button
                                    key={i}
                                    className={`daily-tip__dot ${i === currentTip % 5 ? 'daily-tip__dot--active' : ''}`}
                                    onClick={() => setCurrentTip(i)}
                                />
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </main>

            {/* Footer with Parent Zone */}
            <footer className="home-screen__footer">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Settings size={18} />}
                        onClick={() => console.log('Parent Zone')}
                    >
                        Parent Zone
                    </Button>
                </motion.div>
            </footer>

            {/* Mission Selector Modal */}
            <MissionSelector
                isOpen={showMissionSelector}
                onClose={() => setShowMissionSelector(false)}
            />
        </div>
    );
}
