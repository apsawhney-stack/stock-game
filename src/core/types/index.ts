/**
 * Core Types - Barrel Export
 * Re-exports all core types from a single entry point.
 */

// Asset types
export type {
    AssetType,
    Sector,
    RiskRating,
    Asset,
    Stock,
    Etf,
    Crypto,
    Futures,
    Option,
} from './asset';

export { isStock, isCrypto, isFutures, isOption } from './asset';

// Portfolio types
export type {
    Lot,
    Holding,
    PortfolioState,
    PortfolioSnapshot,
    RiskCheckResult,
} from './portfolio';

export { createInitialPortfolio } from './portfolio';

// Order types
export type {
    OrderType,
    OrderSide,
    OrderStatus,
    OrderRequest,
    Order,
    OrderSubmitResult,
    ExecutedTrade,
    OrderValidationResult,
    ExecutionReport,
    OrderFill,
} from './order';

export { generateOrderId } from './order';

// Market types
export type {
    PriceTrigger,
    PricePoint,
    PriceChange,
    MarketState,
    TickResult,
    MarketConfig,
    PriceGeneratorConfig,
} from './market';

export { DEFAULT_MARKET_CONFIG, DEFAULT_PRICE_GENERATOR_CONFIG } from './market';

// Event types
export type {
    EventType,
    EventImpact,
    GameEvent,
    ScheduledEvent,
    TriggeredEvent,
    EventConfig,
} from './events';

export { DEFAULT_EVENT_CONFIG, IMPACT_RANGES } from './events';
