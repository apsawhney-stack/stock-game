/**
 * AIOpponent Component
 * Shows AI opponent portrait and last action on Dashboard
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../app/store';
import { AI_PERSONAS } from '../../core/ai/types';
import './AIOpponent.css';

export function AIOpponent() {
    const aiState = useGameStore((state) => state.ai);
    const persona = AI_PERSONAS[aiState.persona];
    const lastDecision = aiState.lastDecision;

    // Format the last action message
    const getActionMessage = () => {
        if (!lastDecision) return 'Thinking...';

        switch (lastDecision.action) {
            case 'buy':
                return `Bought ${lastDecision.quantity} ${lastDecision.ticker}!`;
            case 'sell':
                return `Sold ${lastDecision.quantity} ${lastDecision.ticker}!`;
            case 'hold':
                return 'Holding steady...';
            default:
                return 'Thinking...';
        }
    };

    const getEmotionEmoji = () => {
        if (!lastDecision?.emotionalState) return '';

        switch (lastDecision.emotionalState) {
            case 'panicked': return '😰';
            case 'excited': return '🤩';
            case 'confident': return '😎';
            case 'uncertain': return '🤔';
            case 'calm': return '😌';
            default: return '';
        }
    };

    return (
        <motion.div
            className="ai-opponent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="ai-opponent__header">
                <span className="ai-opponent__label">Racing Against</span>
            </div>

            <div className="ai-opponent__portrait">
                <span className="ai-opponent__emoji">{persona.emoji}</span>
                <AnimatePresence mode="wait">
                    {lastDecision?.emotionalState && (
                        <motion.span
                            key={lastDecision.emotionalState}
                            className="ai-opponent__emotion"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            {getEmotionEmoji()}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div className="ai-opponent__info">
                <span className="ai-opponent__name">{persona.name}</span>
                <span className="ai-opponent__title">{persona.title}</span>
            </div>

            <AnimatePresence mode="wait">
                {lastDecision && (
                    <motion.div
                        key={`${lastDecision.action}-${lastDecision.ticker}`}
                        className={`ai-opponent__action ai-opponent__action--${lastDecision.action}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {getActionMessage()}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="ai-opponent__value">
                ${aiState.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </motion.div>
    );
}
