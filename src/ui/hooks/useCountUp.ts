/**
 * useCountUp Hook
 * Animates a number from 0 to target value
 */

import { useState, useEffect } from 'react';

interface UseCountUpOptions {
    duration?: number;
    delay?: number;
}

export function useCountUp(
    target: number,
    options: UseCountUpOptions = {}
): number {
    const { duration = 1000, delay = 0 } = options;
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        let delayTimeout: NodeJS.Timeout;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setCurrent(target * eased);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        delayTimeout = setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(delayTimeout);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [target, duration, delay]);

    return current;
}
