/**
 * PriceChart Component
 * 
 * Displays a simple line chart showing stock price history.
 * Uses SVG for rendering with customizable dimensions and variants.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './PriceChart.css';

type ChartVariant = 'mini' | 'standard' | 'large';
type TrendDirection = 'up' | 'down' | 'flat';

interface PriceChartProps {
    /** Array of price values to display */
    prices: number[];
    /** Chart variant affects size and detail level */
    variant?: ChartVariant;
    /** Whether to show the trend indicator */
    showTrend?: boolean;
    /** Whether to show price labels */
    showLabels?: boolean;
    /** Custom width (overrides variant default) */
    width?: number;
    /** Custom height (overrides variant default) */
    height?: number;
    /** Optional CSS class */
    className?: string;
}

// Default dimensions per variant
const VARIANT_SIZES: Record<ChartVariant, { width: number; height: number }> = {
    mini: { width: 60, height: 24 },
    standard: { width: 200, height: 80 },
    large: { width: 300, height: 120 },
};

// Padding for the chart area
const PADDING = 4;

export function PriceChart({
    prices,
    variant = 'standard',
    showTrend = true,
    showLabels = false,
    width: customWidth,
    height: customHeight,
    className = '',
}: PriceChartProps) {
    // Get dimensions
    const { width: defaultWidth, height: defaultHeight } = VARIANT_SIZES[variant];
    const width = customWidth ?? defaultWidth;
    const height = customHeight ?? defaultHeight;

    // Calculate chart data
    const chartData = useMemo(() => {
        if (prices.length === 0) {
            return { path: '', gradient: 'flat', trend: 'flat' as TrendDirection, minPrice: 0, maxPrice: 0 };
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const isFlat = priceRange === 0;

        // Calculate chart dimensions
        const chartWidth = width - PADDING * 2;
        const chartHeight = height - PADDING * 2;

        // Generate path points
        const points = prices.map((price, index) => {
            const x = PADDING + (index / Math.max(prices.length - 1, 1)) * chartWidth;
            // If all prices are the same (flat), center the line vertically
            const y = isFlat
                ? PADDING + chartHeight / 2
                : PADDING + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
            return { x, y };
        });

        // Create SVG path
        const pathData = points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
            .join(' ');

        // Determine trend
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const change = lastPrice - firstPrice;
        const changePercent = Math.abs(change / firstPrice) * 100;

        let trend: TrendDirection = 'flat';
        if (changePercent >= 0.5) {
            trend = change > 0 ? 'up' : 'down';
        }

        // Determine gradient color
        const gradient = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'flat';

        // Create area path for gradient fill
        const areaPath = prices.length > 0
            ? `${pathData} L ${points[points.length - 1].x.toFixed(2)} ${height - PADDING} L ${PADDING} ${height - PADDING} Z`
            : '';

        return {
            path: pathData,
            areaPath,
            gradient,
            trend,
            minPrice,
            maxPrice,
            points,
        };
    }, [prices, width, height]);

    // Don't render if no data
    if (prices.length === 0) {
        return (
            <div className={`price-chart price-chart--${variant} price-chart--empty ${className}`}>
                <span>No data</span>
            </div>
        );
    }

    const TrendIcon = chartData.trend === 'up' ? TrendingUp : chartData.trend === 'down' ? TrendingDown : Minus;

    return (
        <div className={`price-chart price-chart--${variant} ${className}`}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="price-chart__svg"
            >
                {/* Gradient definitions */}
                <defs>
                    <linearGradient id={`gradient-up-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                        <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                    </linearGradient>
                    <linearGradient id={`gradient-down-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                    </linearGradient>
                    <linearGradient id={`gradient-flat-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(148, 163, 184, 0.2)" />
                        <stop offset="100%" stopColor="rgba(148, 163, 184, 0)" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <motion.path
                    d={chartData.areaPath}
                    fill={`url(#gradient-${chartData.gradient}-${variant})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Line */}
                <motion.path
                    d={chartData.path}
                    fill="none"
                    stroke={
                        chartData.trend === 'up'
                            ? 'var(--color-success)'
                            : chartData.trend === 'down'
                                ? 'var(--color-danger)'
                                : 'var(--text-muted)'
                    }
                    strokeWidth={variant === 'mini' ? 1.5 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {/* End point dot */}
                {variant !== 'mini' && chartData.points && chartData.points.length > 0 && (
                    <motion.circle
                        cx={chartData.points[chartData.points.length - 1]!.x}
                        cy={chartData.points[chartData.points.length - 1]!.y}
                        r={3}
                        fill={
                            chartData.trend === 'up'
                                ? 'var(--color-success)'
                                : chartData.trend === 'down'
                                    ? 'var(--color-danger)'
                                    : 'var(--text-muted)'
                        }
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: 'spring' }}
                    />
                )}
            </svg>

            {/* Trend indicator */}
            {showTrend && variant !== 'mini' && (
                <div className={`price-chart__trend price-chart__trend--${chartData.trend}`}>
                    <TrendIcon size={14} />
                </div>
            )}

            {/* Price labels */}
            {showLabels && variant !== 'mini' && (
                <div className="price-chart__labels">
                    <span className="price-chart__label price-chart__label--max">
                        ${chartData.maxPrice.toFixed(2)}
                    </span>
                    <span className="price-chart__label price-chart__label--min">
                        ${chartData.minPrice.toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
}
