import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './PriceDisplay.css';

export interface PriceDisplayProps {
    value: number;
    previousValue?: number;
    currency?: string;
    showChange?: boolean;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animated?: boolean;
    className?: string;
}

export function PriceDisplay({
    value,
    previousValue,
    currency = '$',
    showChange = true,
    showIcon = true,
    size = 'md',
    animated = true,
    className = '',
}: PriceDisplayProps) {
    const change = previousValue !== undefined ? value - previousValue : 0;
    const changePercent = previousValue !== undefined && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : 0;

    const isPositive = change > 0;
    const isNegative = change < 0;

    const formatCurrency = (val: number) => {
        return `${currency}${val.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatPercent = (val: number) => {
        const sign = val > 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}%`;
    };

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
        <div className={`price-display price-display--${size} ${className}`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={value}
                    className="price-display__value"
                    initial={animated ? { opacity: 0, y: -10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={animated ? { opacity: 0, y: 10 } : undefined}
                    transition={{ duration: 0.2 }}
                >
                    {formatCurrency(value)}
                </motion.span>
            </AnimatePresence>

            {showChange && previousValue !== undefined && (
                <span
                    className={`price-display__change ${isPositive ? 'price-display__change--positive' :
                        isNegative ? 'price-display__change--negative' :
                            'price-display__change--neutral'
                        }`}
                >
                    {showIcon && (
                        <TrendIcon className="price-display__icon" />
                    )}
                    <span className="price-display__percent">
                        {formatPercent(changePercent)}
                    </span>
                </span>
            )}
        </div>
    );
}
