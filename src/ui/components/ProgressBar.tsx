import { motion } from 'framer-motion';
import './ProgressBar.css';

export interface ProgressBarProps {
    value: number; // 0-100
    max?: number;
    variant?: 'default' | 'success' | 'warning' | 'xp' | 'level';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    label?: string;
    animated?: boolean;
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showLabel = true,
    label,
    animated = true,
    className = '',
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`progress-bar progress-bar--${variant} progress-bar--${size} ${className}`}>
            {(showLabel || label) && (
                <div className="progress-bar__header">
                    {label && <span className="progress-bar__label">{label}</span>}
                    {showLabel && (
                        <span className="progress-bar__value">
                            {value.toLocaleString()} / {max.toLocaleString()}
                        </span>
                    )}
                </div>
            )}
            <div className="progress-bar__track">
                <motion.div
                    className="progress-bar__fill"
                    initial={animated ? { width: 0 } : false}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                {/* Animated shine effect */}
                {percentage > 0 && (
                    <motion.div
                        className="progress-bar__shine"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </div>
        </div>
    );
}
