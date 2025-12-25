import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'glass' | 'glow';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    animated?: boolean;
}

export function Card({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    onClick,
    animated = false,
}: CardProps) {
    const Component = animated ? motion.div : 'div';
    const animationProps = animated
        ? {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4, ease: 'easeOut' as const },
        }
        : {};

    return (
        <Component
            className={`card card--${variant} card--padding-${padding} ${onClick ? 'card--clickable' : ''} ${className}`}
            onClick={onClick}
            {...animationProps}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card__header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card__body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`card__footer ${className}`}>{children}</div>;
}
