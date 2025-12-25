/**
 * Asset Types
 * Defines all tradeable asset types in the game.
 */

/** Asset type categories */
export type AssetType = 'stock' | 'etf' | 'crypto' | 'futures' | 'option';

/** Market sectors */
export type Sector = 'tech' | 'food' | 'health' | 'energy' | 'crypto' | 'index';

/** Risk rating from 1 (low) to 4 (very high) */
export type RiskRating = 1 | 2 | 3 | 4;

/**
 * Base asset interface - all tradeable assets extend this
 */
export interface Asset {
    /** Unique ticker symbol (e.g., "ZAP") */
    readonly ticker: string;

    /** Display name (e.g., "ZappyTech") */
    readonly name: string;

    /** Type of asset */
    readonly assetType: AssetType;

    /** Market sector */
    readonly sector: Sector;

    /** Risk rating for UI display */
    readonly riskRating: RiskRating;

    /** Base/starting price in dollars */
    readonly basePrice: number;

    /** Volatility factor (0.0 to 1.0, higher = more volatile) */
    readonly volatility: number;

    /** Kid-friendly description */
    readonly description: string;

    /** Icon identifier for UI */
    readonly icon: string;
}

/**
 * Stock - represents shares in a company
 */
export interface Stock extends Asset {
    readonly assetType: 'stock';

    /** Annual dividend yield (0.0 to 1.0, e.g., 0.02 = 2%) */
    readonly dividendYield: number;

    /** Turn numbers when earnings are reported */
    readonly earningsSchedule: readonly number[];
}

/**
 * ETF - Exchange Traded Fund (index fund)
 */
export interface Etf extends Asset {
    readonly assetType: 'etf';

    /** Tickers of stocks included in this ETF */
    readonly holdings: readonly string[];

    /** Annual expense ratio */
    readonly expenseRatio: number;
}

/**
 * Crypto - Cryptocurrency asset
 */
export interface Crypto extends Asset {
    readonly assetType: 'crypto';

    /** Maximum allowed portfolio weight (enforced by game) */
    readonly maxPortfolioWeight: number;

    /** Whether this crypto has a "utility" narrative */
    readonly hasUtility: boolean;
}

/**
 * Futures - Futures contract (Level 8+)
 */
export interface Futures extends Asset {
    readonly assetType: 'futures';

    /** Ticker of the underlying asset */
    readonly underlying: string;

    /** Turn when contract expires */
    readonly expirationTurn: number;

    /** Leverage multiplier (e.g., 2 = 2x) */
    readonly leverage: number;

    /** Margin requirement as fraction (e.g., 0.25 = 25%) */
    readonly marginRequirement: number;
}

/**
 * Option - Call or Put option (Level 6+)
 */
export interface Option extends Asset {
    readonly assetType: 'option';

    /** Ticker of the underlying asset */
    readonly underlying: string;

    /** Option type */
    readonly optionType: 'call' | 'put';

    /** Strike price */
    readonly strike: number;

    /** Turn when option expires */
    readonly expirationTurn: number;

    /** Premium cost to buy option */
    readonly premium: number;
}

/**
 * Type guard to check if an asset is a stock
 */
export function isStock(asset: Asset): asset is Stock {
    return asset.assetType === 'stock';
}

/**
 * Type guard to check if an asset is a crypto
 */
export function isCrypto(asset: Asset): asset is Crypto {
    return asset.assetType === 'crypto';
}

/**
 * Type guard to check if an asset is a futures contract
 */
export function isFutures(asset: Asset): asset is Futures {
    return asset.assetType === 'futures';
}

/**
 * Type guard to check if an asset is an option
 */
export function isOption(asset: Asset): asset is Option {
    return asset.assetType === 'option';
}
