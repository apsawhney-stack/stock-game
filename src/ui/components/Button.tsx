import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    icon?: React.ReactNode;
    className?: string;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    onClick,
    icon,
    className = '',
}: ButtonProps) {
    return (
        <motion.button
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {icon && <span className="btn__icon">{icon}</span>}
            <span className="btn__text">{children}</span>
        </motion.button>
    );
}
