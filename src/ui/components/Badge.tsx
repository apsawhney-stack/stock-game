import React from 'react';
import { motion } from 'framer-motion';
import './Badge.css';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'silver' | 'bronze';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    animated?: boolean;
    className?: string;
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    icon,
    animated = false,
    className = '',
}: BadgeProps) {
    const Component = animated ? motion.span : 'span';
    const animationProps = animated
        ? {
            initial: { scale: 0, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: 'spring' as const, stiffness: 400, damping: 15 },
        }
        : {};

    return (
        <Component
            className={`badge badge--${variant} badge--${size} ${className}`}
            {...animationProps}
        >
            {icon && <span className="badge__icon">{icon}</span>}
            <span className="badge__text">{children}</span>
        </Component>
    );
}
