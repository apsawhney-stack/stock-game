import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowRight,
    DollarSign,
    Briefcase,
    Newspaper
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { NewsCard } from '../components/NewsCard';
import { XPDisplay } from '../components/XPDisplay';
import { AIOpponent } from '../components/AIOpponent';
import { useGameStore, useGameActions } from '../../app/store';
import { selectTotalValue, selectReturnPercent, selectHoldings, selectTurnInfo, selectAvailableCash } from '../../app/store/selectors';
import { useMarketEngine, GAME_STOCKS } from '../../app/hooks/useMarketEngine';
import { useEventEngine } from '../../app/hooks/useEventEngine';
import { useScoringEngine } from '../../app/hooks/useScoringEngine';
import { useAIEngine } from '../../app/hooks/useAIEngine';
import './DashboardScreen.css';

export function DashboardScreen() {
    const state = useGameStore();
    const { advanceTurn, navigate, markEventRead, setSelectedTicker } = useGameActions();
    const portfolio = state.portfolio;
    const prices = state.market.prices;
    const previousPrices = state.market.previousPrices;
    const pendingOrders = state.pendingOrders;
    const activeEvents = state.events.activeEvents;
    const readEventIds = state.events.readEventIds;

    const { tickMarket } = useMarketEngine();

    // Initialize event engine to process events on turn changes
    useEventEngine();

    // Initialize scoring engine to track XP and achievements
    useScoringEngine();

    // Initialize AI engine to process AI turns
    useAIEngine();

    const totalValue = selectTotalValue(state);
    const returnPercent = selectReturnPercent(state);
    const holdings = selectHoldings(state);
    const turnInfo = selectTurnInfo(state);
    const availableCash = selectAvailableCash(state);

    // Get stock price from store or base price
    const getStockPrice = (ticker: string) => prices[ticker] ?? GAME_STOCKS.find(s => s.ticker === ticker)?.basePrice ?? 0;
    const getPriceChange = (ticker: string) => {
        const current = getStockPrice(ticker);
        const previous = previousPrices[ticker] ?? current;
        return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    };

    const handleNextDay = () => {
        // Tick the market engine to generate new prices
        tickMarket();
        advanceTurn();
    };

    const handleTrade = () => {
        setSelectedTicker(null); // Clear selection when using Trade button
        navigate('trade');
    };

    const handleStockClick = (ticker: string) => {
        setSelectedTicker(ticker); // Pre-select the stock
        navigate('trade');
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard__header">
                <motion.div
                    className="dashboard__header-left"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="dashboard__title">Trading Day {turnInfo.current}</h1>
                    <Badge variant="info" size="sm">
                        {turnInfo.remaining} days left
                    </Badge>
                </motion.div>

                <motion.div
                    className="dashboard__header-right"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <XPDisplay variant="compact" showDailyCap={false} />
                    <ProgressBar
                        value={turnInfo.current}
                        max={turnInfo.max}
                        variant="level"
                        size="sm"
                        showLabel={false}
                        className="dashboard__turn-progress"
                    />
                </motion.div>
            </header>

            {/* AI Opponent - shown in top right */}
            <div className="dashboard__ai-container">
                <AIOpponent />
            </div>

            {/* Main grid */}
            <main className="dashboard__main">
                {/* Portfolio Panel */}
                <motion.section
                    className="dashboard__section dashboard__portfolio"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card variant="glow" padding="md">
                        <div className="dashboard__section-header">
                            <Briefcase size={20} />
                            <h2>Your Portfolio</h2>
                        </div>

                        <div className="portfolio-summary">
                            <div className="portfolio-summary__total">
                                <span className="portfolio-summary__label">Total Value</span>
                                <span className="portfolio-summary__value">
                                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className={`portfolio-summary__change ${returnPercent >= 0 ? 'positive' : 'negative'}`}>
                                    {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                                </span>
                            </div>

                            <div className="portfolio-summary__breakdown">
                                <div className="portfolio-summary__item">
                                    <span className="portfolio-summary__item-label">
                                        {availableCash < portfolio.cash ? 'Available' : 'Cash'}
                                    </span>
                                    <span className="portfolio-summary__item-value">
                                        ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="portfolio-summary__item">
                                    <span className="portfolio-summary__item-label">Stocks</span>
                                    <span className="portfolio-summary__item-value">
                                        ${(totalValue - portfolio.cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {holdings.length > 0 ? (
                            <div className="holdings-list">
                                {holdings.map((holding) => (
                                    <div key={holding.ticker} className="holding-row">
                                        <span className="holding-row__ticker">{holding.ticker}</span>
                                        <span className="holding-row__shares">{holding.shares} shares</span>
                                        <span className={`holding-row__pnl ${(holding.unrealizedPnL ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                                            {(holding.unrealizedPnL ?? 0) >= 0 ? '+' : ''}${(holding.unrealizedPnL ?? 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="holdings-empty">
                                <p>No stocks yet. Start trading!</p>
                            </div>
                        )}
                    </Card>
                </motion.section>

                {/* Market Overview */}
                <motion.section
                    className="dashboard__section dashboard__market"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card variant="glass" padding="md">
                        <div className="dashboard__section-header">
                            <TrendingUp size={20} />
                            <h2>Market</h2>
                        </div>

                        <div className="market-list">
                            {GAME_STOCKS.map((stock) => {
                                const price = getStockPrice(stock.ticker);
                                const change = getPriceChange(stock.ticker);
                                return (
                                    <div
                                        key={stock.ticker}
                                        className="stock-row"
                                        onClick={() => handleStockClick(stock.ticker)}
                                    >
                                        <div className="stock-row__info">
                                            <span className="stock-row__ticker">{stock.ticker}</span>
                                            <span className="stock-row__name">{stock.name}</span>
                                        </div>
                                        <div className="stock-row__price">
                                            <span className="stock-row__value">${price.toFixed(2)}</span>
                                            <span className={`stock-row__change ${change >= 0 ? 'positive' : 'negative'}`}>
                                                {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.section>

                {/* News Feed */}
                <motion.section
                    className="dashboard__section dashboard__news"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card variant="glass" padding="md">
                        <div className="dashboard__section-header">
                            <Newspaper size={20} />
                            <h2>Today's News</h2>
                        </div>

                        <div className="news-list">
                            {activeEvents.length > 0 ? (
                                activeEvents.map((event) => (
                                    <NewsCard
                                        key={event.id}
                                        event={event}
                                        isRead={readEventIds.includes(event.id)}
                                        onRead={() => markEventRead(event.id)}
                                    />
                                ))
                            ) : (
                                <div className="news-empty">
                                    <p>📰 No news today. Markets are quiet.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.section>

                {/* Pending Orders */}
                {pendingOrders.length > 0 && (
                    <motion.section
                        className="dashboard__section dashboard__orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <Card variant="glass" padding="md">
                            <div className="dashboard__section-header">
                                <DollarSign size={20} />
                                <h2>Pending Orders</h2>
                            </div>
                            <div className="orders-list">
                                {pendingOrders.map((order) => (
                                    <div key={order.id} className={`order-row order-row--${order.side}`}>
                                        <span className="order-row__side">
                                            {order.side === 'buy' ? '🛒 Buy' : '💰 Sell'}
                                        </span>
                                        <span className="order-row__qty">{order.quantity}×</span>
                                        <span className="order-row__ticker">{order.ticker}</span>
                                        <Badge variant="info" size="sm">Pending</Badge>
                                    </div>
                                ))}
                            </div>
                            <p className="orders-note">Orders execute on Next Day</p>
                        </Card>
                    </motion.section>
                )}
            </main>

            {/* Action footer */}
            <footer className="dashboard__footer">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="dashboard__actions"
                >
                    <Button
                        variant="secondary"
                        size="lg"
                        icon={<DollarSign size={20} />}
                        onClick={handleTrade}
                    >
                        Trade
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<Calendar size={20} />}
                        onClick={handleNextDay}
                    >
                        Next Day
                        <ArrowRight size={18} />
                    </Button>
                </motion.div>
            </footer>
        </div>
    );
}
