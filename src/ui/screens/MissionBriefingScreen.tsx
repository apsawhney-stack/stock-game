import { motion } from 'framer-motion';
import { Target, DollarSign, Clock, Rocket, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useGameStore, useGameActions } from '../../app/store';
import { useSoundEffects } from '../../app/hooks/useSoundEffects';
import './MissionBriefingScreen.css';

export function MissionBriefingScreen() {
    const session = useGameStore((state) => state.session);
    const { navigate } = useGameActions();
    const { playSound } = useSoundEffects();

    const handleStartMission = () => {
        // Play mission start sound
        playSound('missionStart');

        // Update phase to playing and navigate to dashboard
        useGameStore.setState((state) => {
            state.session.phase = 'playing';
            state.session.turn = 1;
            state.market.turn = 1;
            state.ui.currentScreen = 'dashboard';
        });
    };

    const handleBack = () => {
        navigate('home');
    };

    return (
        <div className="mission-briefing">
            {/* Background decoration */}
            <div className="mission-briefing__bg-accent" />

            {/* Header with back button */}
            <header className="mission-briefing__header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={handleBack}>
                        Back
                    </Button>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Badge variant="info" size="lg">Level 1</Badge>
                </motion.div>
            </header>

            {/* Main content */}
            <main className="mission-briefing__content">
                {/* Mission card */}
                <motion.div
                    className="mission-briefing__card-wrapper"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card variant="glow" padding="lg" className="mission-briefing__card">
                        <div className="mission-briefing__title-section">
                            <h1 className="mission-briefing__title">{session.missionName || 'First Trade'}</h1>
                            <p className="mission-briefing__subtitle">Your investing journey begins!</p>
                        </div>

                        {/* Goal section */}
                        <div className="mission-briefing__goal">
                            <div className="mission-briefing__goal-icon">
                                <Target size={28} />
                            </div>
                            <div className="mission-briefing__goal-text">
                                <span className="mission-briefing__goal-label">Your Goal</span>
                                <span className="mission-briefing__goal-value">
                                    {session.missionGoal || 'Make a 2% profit by buying and selling stocks!'}
                                </span>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="mission-briefing__stats">
                            <div className="mission-briefing__stat">
                                <DollarSign className="mission-briefing__stat-icon" size={24} />
                                <span className="mission-briefing__stat-value">
                                    ${session.startingCash.toLocaleString()}
                                </span>
                                <span className="mission-briefing__stat-label">Starting Cash</span>
                            </div>
                            <div className="mission-briefing__stat">
                                <Clock className="mission-briefing__stat-icon" size={24} />
                                <span className="mission-briefing__stat-value">{session.maxTurns}</span>
                                <span className="mission-briefing__stat-label">Trading Days</span>
                            </div>
                            <div className="mission-briefing__stat">
                                <Target className="mission-briefing__stat-icon mission-briefing__stat-icon--target" size={24} />
                                <span className="mission-briefing__stat-value">
                                    +{(session.targetReturn * 100).toFixed(0)}%
                                </span>
                                <span className="mission-briefing__stat-label">Target Return</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Mascot tip */}
                <motion.div
                    className="mission-briefing__mascot-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="mission-briefing__mascot">
                        <span className="mission-briefing__mascot-emoji">🦝</span>
                    </div>
                    <div className="mission-briefing__speech-bubble">
                        <p className="mission-briefing__tip">
                            <strong>Professor Penny says:</strong> "Start simple! Pick one stock you like,
                            watch how its price moves, and try to buy low and sell high!"
                        </p>
                    </div>
                </motion.div>

                {/* Start button */}
                <motion.div
                    className="mission-briefing__action"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<Rocket size={24} />}
                        className="mission-briefing__start-btn"
                        onClick={handleStartMission}
                    >
                        Start Mission
                    </Button>
                </motion.div>
            </main>
        </div>
    );
}
