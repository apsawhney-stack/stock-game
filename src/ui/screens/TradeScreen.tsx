import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PriceChart } from '../components/PriceChart';
import { useGameStore, useGameActions } from '../../app/store';
import { selectAvailableCash } from '../../app/store/selectors';
import { GAME_STOCKS } from '../../app/hooks/useMarketEngine';
import { useSoundEffects } from '../../app/hooks/useSoundEffects';
import type { Asset } from '../../core/types';
import './TradeScreen.css';

export function TradeScreen() {
    const [selectedStock, setSelectedStock] = useState<Asset | null>(null);
    const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
    const [quantity, setQuantity] = useState(1);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const state = useGameStore();
    const prices = state.market.prices;
    const previousPrices = state.market.previousPrices;
    const priceHistory = state.market.priceHistory;
    const portfolio = state.portfolio;
    const selectedTicker = state.ui.selectedTicker;
    const availableCash = selectAvailableCash(state);
    const { navigate, submitOrder } = useGameActions();
    const { playSound } = useSoundEffects();

    // Pre-select stock from dashboard on mount
    useEffect(() => {
        if (selectedTicker && !selectedStock) {
            const stock = GAME_STOCKS.find(s => s.ticker === selectedTicker);
            if (stock) {
                setSelectedStock(stock);
            }
        }
    }, [selectedTicker, selectedStock]);

    // Calculate stock values
    const getStockPrice = (ticker: string) => prices[ticker] ?? GAME_STOCKS.find(s => s.ticker === ticker)?.basePrice ?? 0;
    const getPriceChange = (ticker: string) => {
        const current = getStockPrice(ticker);
        const previous = previousPrices[ticker] ?? current;
        return ((current - previous) / previous) * 100;
    };

    // Get shares owned for a ticker
    const getSharesOwned = (ticker: string): number => {
        return portfolio.lots
            .filter(lot => lot.ticker === ticker)
            .reduce((sum, lot) => sum + lot.shares, 0);
    };

    // Calculate order value - use available cash for buy checks
    const orderValue = selectedStock ? getStockPrice(selectedStock.ticker) * quantity : 0;
    const canAffordBuy = orderValue <= availableCash;
    const hasEnoughShares = selectedStock ? quantity <= getSharesOwned(selectedStock.ticker) : false;

    // Max quantity user can buy/sell - use available cash for buys
    const maxBuyQuantity = selectedStock ? Math.floor(availableCash / getStockPrice(selectedStock.ticker)) : 0;
    const maxSellQuantity = selectedStock ? getSharesOwned(selectedStock.ticker) : 0;

    const handleBack = () => {
        navigate('dashboard');
    };

    const handleStockSelect = (stock: Asset) => {
        setSelectedStock(stock);
        setQuantity(1);
        setShowConfirmation(false);
    };

    const handleQuantityChange = (newQuantity: number) => {
        const max = orderSide === 'buy' ? maxBuyQuantity : maxSellQuantity;
        setQuantity(Math.max(1, Math.min(newQuantity, max)));
    };

    const handleSubmitOrder = () => {
        if (!selectedStock) return;

        // Play buy/sell sound
        playSound(orderSide === 'buy' ? 'buy' : 'sell');

        submitOrder({
            type: 'market',
            side: orderSide,
            ticker: selectedStock.ticker,
            quantity,
        });

        setShowConfirmation(true);
        setTimeout(() => {
            navigate('dashboard');
        }, 1500);
    };

    // Validation
    const getValidationError = (): string | null => {
        if (!selectedStock) return null;
        if (quantity <= 0) return 'Quantity must be greater than 0';
        if (orderSide === 'buy' && !canAffordBuy) return `Not enough cash (need $${orderValue.toFixed(2)})`;
        if (orderSide === 'sell' && !hasEnoughShares) return `Not enough shares (you have ${getSharesOwned(selectedStock.ticker)})`;
        return null;
    };

    const validationError = getValidationError();

    return (
        <div className="trade-screen">
            {/* Header */}
            <header className="trade-screen__header">
                <Button variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={handleBack}>
                    Back
                </Button>
                <h1 className="trade-screen__title">Trade</h1>
                <div className="trade-screen__cash">
                    {availableCash < portfolio.cash ? 'Available: ' : 'Cash: '}
                    ${availableCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </header>

            {/* Main content */}
            <main className="trade-screen__main">
                {/* Stock list */}
                <motion.section
                    className="trade-screen__stocks"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="trade-screen__section-title">Select a Stock</h2>
                    <div className="stock-list">
                        {GAME_STOCKS.map((stock) => {
                            const price = getStockPrice(stock.ticker);
                            const change = getPriceChange(stock.ticker);
                            const isSelected = selectedStock?.ticker === stock.ticker;
                            const sharesOwned = getSharesOwned(stock.ticker);

                            return (
                                <Card
                                    key={stock.ticker}
                                    variant={isSelected ? 'glow' : 'glass'}
                                    padding="sm"
                                    className={`stock-item ${isSelected ? 'stock-item--selected' : ''}`}
                                    onClick={() => handleStockSelect(stock)}
                                >
                                    <div className="stock-item__icon">{stock.icon}</div>
                                    <div className="stock-item__info">
                                        <span className="stock-item__ticker">{stock.ticker}</span>
                                        <span className="stock-item__name">{stock.name}</span>
                                        {sharesOwned > 0 && (
                                            <span className="stock-item__owned">You own {sharesOwned}</span>
                                        )}
                                    </div>
                                    <div className="stock-item__price">
                                        <span className="stock-item__value">${price.toFixed(2)}</span>
                                        <span className={`stock-item__change ${change >= 0 ? 'positive' : 'negative'}`}>
                                            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                        </span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Order form */}
                <motion.section
                    className="trade-screen__order"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {selectedStock ? (
                        <Card variant="glow" padding="lg" className="order-form">
                            <h2 className="order-form__title">
                                {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedStock.ticker}
                            </h2>
                            <p className="order-form__stock-name">{selectedStock.name}</p>

                            {/* Price Chart */}
                            {priceHistory[selectedStock.ticker] && priceHistory[selectedStock.ticker].length >= 1 && (
                                <div className="order-form__chart">
                                    <PriceChart
                                        prices={priceHistory[selectedStock.ticker]}
                                        variant="standard"
                                        showTrend={true}
                                        showLabels={true}
                                    />
                                </div>
                            )}

                            {/* Buy/Sell toggle */}
                            <div className="order-form__side-toggle">
                                <button
                                    className={`side-btn side-btn--buy ${orderSide === 'buy' ? 'active' : ''}`}
                                    onClick={() => { setOrderSide('buy'); setQuantity(1); }}
                                >
                                    Buy
                                </button>
                                <button
                                    className={`side-btn side-btn--sell ${orderSide === 'sell' ? 'active' : ''}`}
                                    onClick={() => { setOrderSide('sell'); setQuantity(1); }}
                                    disabled={getSharesOwned(selectedStock.ticker) === 0}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Quantity input */}
                            <div className="order-form__quantity">
                                <label className="order-form__label">Quantity</label>
                                <div className="quantity-input">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        className="quantity-value"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                        min={1}
                                        max={orderSide === 'buy' ? maxBuyQuantity : maxSellQuantity}
                                    />
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= (orderSide === 'buy' ? maxBuyQuantity : maxSellQuantity)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="max-btn"
                                    onClick={() => handleQuantityChange(orderSide === 'buy' ? maxBuyQuantity : maxSellQuantity)}
                                >
                                    Max ({orderSide === 'buy' ? maxBuyQuantity : maxSellQuantity})
                                </button>
                            </div>

                            {/* Order preview */}
                            <div className="order-form__preview">
                                <div className="preview-row">
                                    <span>Price per share</span>
                                    <span>${getStockPrice(selectedStock.ticker).toFixed(2)}</span>
                                </div>
                                <div className="preview-row">
                                    <span>Shares</span>
                                    <span>× {quantity}</span>
                                </div>
                                <div className="preview-row preview-row--total">
                                    <span>{orderSide === 'buy' ? 'Total Cost' : 'Total Proceeds'}</span>
                                    <span className={orderSide === 'buy' ? 'negative' : 'positive'}>
                                        ${orderValue.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Validation error */}
                            {validationError && (
                                <div className="order-form__error">{validationError}</div>
                            )}

                            {/* Submit button */}
                            {showConfirmation ? (
                                <div className="order-form__confirmation">
                                    ✅ Order submitted! Returning to dashboard...
                                </div>
                            ) : (
                                <Button
                                    variant={orderSide === 'buy' ? 'primary' : 'secondary'}
                                    size="lg"
                                    className="order-form__submit"
                                    onClick={handleSubmitOrder}
                                    disabled={!!validationError}
                                >
                                    {orderSide === 'buy' ? '🛒 Buy' : '💰 Sell'} {quantity} {selectedStock.ticker}
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <Card variant="glass" padding="lg" className="order-form order-form--empty">
                            <div className="order-form__empty-state">
                                <span className="order-form__empty-icon">👆</span>
                                <p>Select a stock from the list to trade</p>
                            </div>
                        </Card>
                    )}
                </motion.section>
            </main>
        </div>
    );
}
