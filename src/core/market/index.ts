/**
 * Market Module Barrel Export
 */

export {
    generateNextPrice,
    calculateMomentum,
    generateInitialHistory,
    type PriceContext,
    type GeneratedPrice,
} from './PriceGenerator';

export {
    MarketEngine,
    createMarketEngine,
    type IMarketEngine,
} from './MarketEngine';
