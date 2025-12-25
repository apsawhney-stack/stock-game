import { motion } from 'framer-motion';
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Home,
    Target,
    Sparkles
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useGameStore, useGameActions } from '../../app/store';
import { selectTotalValue, selectReturnPercent, selectHoldings } from '../../app/store/selectors';
import { useCountUp } from '../hooks';
import './ResultsScreen.css';

export function ResultsScreen() {
    const state = useGameStore();
    const { resetGame, navigate } = useGameActions();

    const totalValue = selectTotalValue(state);
    const returnPercent = selectReturnPercent(state);
    const holdings = selectHoldings(state);
    const orderHistory = state.orderHistory;
    const startingCash = state.session.startingCash;
    const targetReturn = state.session.targetReturn;

    const profitLoss = totalValue - startingCash;
    const isWin = returnPercent >= (targetReturn * 100);
    const targetPercent = targetReturn * 100;

    // Animated numbers
    const animatedTotal = useCountUp(totalValue, { duration: 1200, delay: 300 });
    const animatedPL = useCountUp(Math.abs(profitLoss), { duration: 1000, delay: 600 });
    const animatedReturn = useCountUp(Math.abs(returnPercent), { duration: 800, delay: 800 });

    const handlePlayAgain = () => {
        resetGame();
    };

    const handleBackToHome = () => {
        navigate('home');
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="results-screen">
            {/* Celebration overlay for wins */}
            {isWin && (
                <div className="results-screen__celebration">
                    <Sparkles className="sparkle sparkle--1" size={24} />
                    <Sparkles className="sparkle sparkle--2" size={32} />
                    <Sparkles className="sparkle sparkle--3" size={20} />
                </div>
            )}

            <motion.div
                className="results-screen__content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.header className="results-screen__header" variants={itemVariants}>
                    <div className={`results-screen__trophy ${isWin ? 'win' : 'lose'}`}>
                        {isWin ? <Trophy size={64} /> : <Target size={64} />}
                    </div>
                    <h1 className="results-screen__title">
                        {isWin ? '🎉 Mission Complete!' : '📈 Keep Growing!'}
                    </h1>
                    <p className="results-screen__subtitle">
                        {isWin
                            ? "Amazing job! You hit your target!"
                            : "Great effort! Every investor learns from experience."}
                    </p>
                </motion.header>

                {/* Performance Card */}
                <motion.div variants={itemVariants}>
                    <Card variant="glow" padding="lg" className="results-screen__performance">
                        <h2 className="performance__title">Your Performance</h2>

                        <div className="performance__stats">
                            <div className="performance__stat">
                                <span className="performance__label">Final Value</span>
                                <span className="performance__value">
                                    ${animatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="performance__stat">
                                <span className="performance__label">Started With</span>
                                <span className="performance__value performance__value--muted">
                                    ${startingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="performance__divider" />

                            <div className="performance__stat performance__stat--highlight">
                                <span className="performance__label">Profit / Loss</span>
                                <span className={`performance__value ${profitLoss >= 0 ? 'positive' : 'negative'}`}>
                                    {profitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                    {profitLoss >= 0 ? '+' : '-'}${animatedPL.toFixed(2)}
                                </span>
                            </div>

                            <div className="performance__stat performance__stat--highlight">
                                <span className="performance__label">Return</span>
                                <span className={`performance__value ${returnPercent >= 0 ? 'positive' : 'negative'}`}>
                                    {returnPercent >= 0 ? '+' : '-'}{animatedReturn.toFixed(2)}%
                                </span>
                            </div>
                        </div>

                        {/* Target comparison */}
                        <div className="performance__target">
                            <span className="performance__target-label">
                                Target: {targetPercent.toFixed(0)}%
                            </span>
                            <Badge
                                variant={isWin ? 'success' : 'warning'}
                                size="md"
                            >
                                {isWin ? '✓ Target Met!' : `${(targetPercent - returnPercent).toFixed(1)}% short`}
                            </Badge>
                        </div>
                    </Card>
                </motion.div>

                {/* Holdings Summary */}
                {holdings.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card variant="glass" padding="md" className="results-screen__holdings">
                            <h3>Final Holdings</h3>
                            <div className="holdings-summary">
                                {holdings.map((holding) => (
                                    <div key={holding.ticker} className="holding-item">
                                        <span className="holding-item__ticker">{holding.ticker}</span>
                                        <span className="holding-item__shares">{holding.shares} shares</span>
                                        <span className={`holding-item__pnl ${(holding.unrealizedPnL ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                                            {(holding.unrealizedPnL ?? 0) >= 0 ? '+' : ''}${(holding.unrealizedPnL ?? 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Trade History */}
                {orderHistory.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Card variant="glass" padding="md" className="results-screen__trades">
                            <h3>Trade History ({orderHistory.length} trades)</h3>
                            <div className="trade-history">
                                {orderHistory.slice(0, 5).map((order) => (
                                    <div key={order.id} className={`trade-item trade-item--${order.side}`}>
                                        <span className="trade-item__side">
                                            {order.side === 'buy' ? '🛒' : '💰'}
                                        </span>
                                        <span className="trade-item__details">
                                            {order.side === 'buy' ? 'Bought' : 'Sold'} {order.quantity} {order.ticker}
                                        </span>
                                        <Badge variant={order.side === 'buy' ? 'info' : 'success'} size="sm">
                                            {order.status}
                                        </Badge>
                                    </div>
                                ))}
                                {orderHistory.length > 5 && (
                                    <p className="trade-history__more">
                                        +{orderHistory.length - 5} more trades
                                    </p>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Mascot Feedback */}
                <motion.div variants={itemVariants}>
                    <Card variant="glass" padding="md" className="results-screen__mascot">
                        <div className="mascot-feedback">
                            <span className="mascot-feedback__icon">🦊</span>
                            <div className="mascot-feedback__message">
                                {isWin ? (
                                    <>
                                        <strong>Fantastic work, trader!</strong>
                                        <p>You've shown great instincts. Keep learning and growing your skills!</p>
                                    </>
                                ) : (
                                    <>
                                        <strong>Great effort!</strong>
                                        <p>Even the best investors have tough days. What matters is learning from each trade. Try again!</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Actions */}
                <motion.div className="results-screen__actions" variants={itemVariants}>
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<RotateCcw size={20} />}
                        onClick={handlePlayAgain}
                    >
                        Play Again
                    </Button>
                    <Button
                        variant="ghost"
                        size="lg"
                        icon={<Home size={20} />}
                        onClick={handleBackToHome}
                    >
                        Back to Home
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
