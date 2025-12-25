/**
 * Portfolio Module Barrel Export
 */

export {
    addLot,
    sellLotsFIFO,
    getSharesForTicker,
    getAverageCost,
    getUniqueTickers,
    getTotalCostBasis,
    type SellResult,
} from './LotTracker';

export {
    PortfolioManager,
    createPortfolioManager,
    type IPortfolioManager,
} from './PortfolioManager';
