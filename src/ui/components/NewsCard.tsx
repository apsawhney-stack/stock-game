/**
 * NewsCard Component
 * Displays a news event with impact indicator and explanation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { TriggeredEvent } from '../../core/events/types';
import './NewsCard.css';

interface NewsCardProps {
    event: TriggeredEvent;
    onRead?: () => void;
    isRead?: boolean;
}

export function NewsCard({ event, onRead, isRead = false }: NewsCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const impact = event.impact.priceChange;
    const isPositive = impact > 0;
    const isNegative = impact < 0;

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        if (!isExpanded && onRead) {
            onRead();
        }
    };

    return (
        <motion.div
            className={`news-card ${isRead ? 'news-card--read' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleToggle}
        >
            <div className="news-card__header">
                <span className="news-card__emoji">{event.iconEmoji}</span>
                <span className="news-card__headline">{event.headline}</span>
                <span className={`news-card__impact ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
                    {isPositive && <TrendingUp size={16} />}
                    {isNegative && <TrendingDown size={16} />}
                    {!isPositive && !isNegative && <Minus size={16} />}
                    <span>{isPositive ? '+' : ''}{(impact * 100).toFixed(0)}%</span>
                </span>
                <button className="news-card__toggle">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="news-card__details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="news-card__description">{event.description}</p>

                        <div className="news-card__explanation">
                            <Lightbulb size={16} />
                            <p>{event.explanation}</p>
                        </div>

                        {event.learningTip && (
                            <div className="news-card__tip">
                                <strong>💡 Learning Tip:</strong> {event.learningTip}
                            </div>
                        )}

                        <div className="news-card__affected">
                            <span>Affected: </span>
                            {event.affectedTickers.slice(0, 3).map(ticker => (
                                <span key={ticker} className="news-card__ticker">{ticker}</span>
                            ))}
                            {event.affectedTickers.length > 3 && (
                                <span className="news-card__more">+{event.affectedTickers.length - 3} more</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
