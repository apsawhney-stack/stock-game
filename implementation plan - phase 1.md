# StockQuest: Implementation Plan - Phase 1

> Core Engine Foundation (Weeks 1-2)

---

## Overview

This implementation plan covers **Phase 1: Core Engine**, establishing the foundation for all future development. All tasks are granular, testable, and independent where possible.

**Phase 1 Goal**: Working core engine with market simulation, portfolio management, order execution, and state persistence—all with comprehensive tests.

**Status Legend**:
- `[ ]` Not started
- `[/]` In progress
- `[x]` Complete
- `[!]` Blocked

---

## Prerequisites

Before starting implementation:
- [x] User approves this implementation plan
- [x] Development environment ready (Node.js 20+, npm/yarn)

---

## Task Breakdown

### 1. Project Scaffolding

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 1.1 | Initialize npm project with `package.json` | [x] | `npm install` runs without errors | `npm install` |
| 1.2 | Configure TypeScript (`tsconfig.json`) | [x] | `npx tsc --noEmit` passes | `npx tsc --noEmit` |
| 1.3 | Set up Vite (`vite.config.ts`) | [x] | `npm run dev` starts dev server | `npm run dev` |
| 1.4 | Configure Vitest (`vitest.config.ts`) | [x] | `npm run test` runs test suite | `npm run test` |
| 1.5 | Set up ESLint + Prettier | [x] | `npm run lint` passes | `npm run lint` |
| 1.6 | Create folder structure per technical design | [x] | All folders exist as specified | Manual verification |
| 1.7 | Add `.gitignore` and initialize git | [x] | `git status` works | `git status` |

**Deliverables**:
```
/stock-game
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── /src
    ├── /core
    ├── /app
    ├── /ui
    ├── /infra
    └── index.ts
```

---

### 2. Core Types & Interfaces

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 2.1 | Create `src/core/types/asset.ts` | [x] | Types compile, exported correctly | `npx tsc --noEmit` |
| 2.2 | Create `src/core/types/portfolio.ts` | [x] | Types compile, exported correctly | `npx tsc --noEmit` |
| 2.3 | Create `src/core/types/order.ts` | [x] | Types compile, exported correctly | `npx tsc --noEmit` |
| 2.4 | Create `src/core/types/market.ts` | [x] | Types compile, exported correctly | `npx tsc --noEmit` |
| 2.5 | Create `src/core/types/events.ts` | [x] | Types compile, exported correctly | `npx tsc --noEmit` |
| 2.6 | Create `src/core/types/index.ts` (barrel export) | [x] | All types importable from `@core/types` | `npx tsc --noEmit` |

**Key Types to Implement**:
```typescript
// asset.ts
Asset, AssetType, Sector, Stock, Crypto, Futures, Option

// portfolio.ts
Lot, Holding, PortfolioState, PortfolioSnapshot

// order.ts
OrderType, OrderSide, OrderStatus, Order, OrderRequest, ExecutedTrade

// market.ts
PricePoint, PriceTrigger, MarketState, TickResult

// events.ts
EventType, GameEvent, ScheduledEvent, TriggeredEvent
```

---

### 3. Utility Functions

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 3.1 | Implement `RingBuffer<T>` class | [x] | Passes unit tests | `npm run test -- src/core/utils/RingBuffer.test.ts` |
| 3.2 | Implement math utilities (`clamp`, `randomGaussian`, etc.) | [x] | Passes unit tests | `npm run test -- src/core/utils/math.test.ts` |
| 3.3 | Implement random utilities (seeded random for reproducibility) | [x] | Passes unit tests | `npm run test -- src/core/utils/random.test.ts` |

**RingBuffer Tests**:
```typescript
describe('RingBuffer', () => {
  it('should maintain fixed capacity');
  it('should overwrite oldest items when full');
  it('should return items in correct order');
  it('should handle empty buffer');
  it('should report correct size');
});
```

**Math Utility Tests**:
```typescript
describe('math utilities', () => {
  it('clamp should constrain value to range');
  it('randomGaussian should produce normal distribution');
  it('lerp should interpolate linearly');
  it('percentChange should calculate correctly');
});
```

---

### 4. MarketEngine Module

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 4.1 | Create `IMarketEngine` interface | [x] | Interface compiles | `npx tsc --noEmit` |
| 4.2 | Implement `PriceGenerator` (pure function) | [x] | Passes unit tests | `npm run test -- src/core/market/PriceGenerator.test.ts` |
| 4.3 | Implement `MarketEngine` class | [x] | Passes unit tests | `npm run test -- src/core/market/MarketEngine.test.ts` |
| 4.4 | Implement price history tracking | [x] | History stored correctly in RingBuffer | `npm run test -- src/core/market/MarketEngine.test.ts` |
| 4.5 | Implement event impact calculation | [x] | Events modify prices correctly | `npm run test -- src/core/market/MarketEngine.test.ts` |

**PriceGenerator Tests**:
```typescript
describe('PriceGenerator', () => {
  it('should generate price within volatility bounds');
  it('should apply momentum correctly');
  it('should handle news event impact');
  it('should be deterministic with same seed');
  it('should never generate negative prices');
});
```

**MarketEngine Tests**:
```typescript
describe('MarketEngine', () => {
  it('should initialize with base prices from assets');
  it('should update all prices on tick()');
  it('should store price history up to limit');
  it('should apply scheduled events at correct turn');
  it('should emit price change callbacks');
  it('should reset to initial state');
  
  // Performance test
  it('should tick 100 assets in under 5ms');
});
```

---

### 5. PortfolioManager Module

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 5.1 | Create `IPortfolioManager` interface | [x] | Interface compiles | `npx tsc --noEmit` |
| 5.2 | Implement `LotTracker` (FIFO lot management) | [x] | Passes unit tests | `npm run test -- src/core/portfolio/LotTracker.test.ts` |
| 5.3 | Implement `PortfolioManager` class | [x] | Passes unit tests | `npm run test -- src/core/portfolio/PortfolioManager.test.ts` |
| 5.4 | Implement P&L calculations (realized + unrealized) | [x] | Calculations match expected values | `npm run test -- src/core/portfolio/PortfolioManager.test.ts` |
| 5.5 | Implement risk limit checks | [x] | Violations detected correctly | `npm run test -- src/core/portfolio/PortfolioManager.test.ts` |

**LotTracker Tests**:
```typescript
describe('LotTracker', () => {
  it('should add new lots on buy');
  it('should remove lots FIFO on sell');
  it('should calculate average cost correctly');
  it('should track realized P&L on sell');
  it('should handle partial lot sales');
  it('should return immutable state');
});
```

**PortfolioManager Tests**:
```typescript
describe('PortfolioManager', () => {
  it('should start with correct cash balance');
  it('should deduct cash on buy');
  it('should add cash on sell');
  it('should calculate total value correctly');
  it('should calculate unrealized P&L correctly');
  it('should detect concentration limit violation');
  it('should detect sector limit violation');
  it('should return immutable portfolio state');
});
```

---

### 6. OrderEngine Module

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 6.1 | Create `IOrderEngine` interface | [x] | Interface compiles | `npx tsc --noEmit` |
| 6.2 | Implement `OrderValidator` | [x] | Passes unit tests | `npm run test -- src/core/orders/OrderEngine.test.ts` |
| 6.3 | Implement `MarketOrderExecutor` | [x] | Passes unit tests | `npm run test -- src/core/orders/OrderEngine.test.ts` |
| 6.4 | Implement `LimitOrderExecutor` | [x] | Passes unit tests | `npm run test -- src/core/orders/OrderEngine.test.ts` |
| 6.5 | Implement `OrderEngine` class | [x] | Passes unit tests | `npm run test -- src/core/orders/OrderEngine.test.ts` |
| 6.6 | Implement order expiration logic | [x] | Orders expire after N turns | `npm run test -- src/core/orders/OrderEngine.test.ts` |

**OrderValidator Tests**:
```typescript
describe('OrderValidator', () => {
  it('should reject order with insufficient cash');
  it('should reject order with insufficient shares');
  it('should reject negative quantity');
  it('should reject unknown ticker');
  it('should reject order exceeding concentration limit');
  it('should accept valid market order');
  it('should accept valid limit order');
});
```

**OrderEngine Tests**:
```typescript
describe('OrderEngine', () => {
  it('should queue submitted orders');
  it('should execute market orders at current price');
  it('should execute limit orders when price reached');
  it('should skip limit orders when price not reached');
  it('should expire orders after max turns');
  it('should cancel orders on request');
  it('should return execution report');
});
```

---

### 7. EventBus Infrastructure

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 7.1 | Create `EventMap` type definition | [x] | Types compile | `npx tsc --noEmit` |
| 7.2 | Implement `TypedEventBus` class | [x] | Passes unit tests | `npm run test -- src/infra/events/EventBus.test.ts` |
| 7.3 | Implement `once()` method | [x] | Listener fires once then unsubscribes | `npm run test -- src/infra/events/EventBus.test.ts` |

**EventBus Tests**:
```typescript
describe('TypedEventBus', () => {
  it('should emit events to subscribers');
  it('should not emit to unsubscribed listeners');
  it('should support multiple listeners per event');
  it('should support once() for one-time listeners');
  it('should return unsubscribe function');
  it('should handle emit with no subscribers');
});
```

---

### 8. State Store

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 8.1 | Install Zustand and middleware | [x] | `npm install` succeeds | `npm install` |
| 8.2 | Create initial state definitions | [ ] | Types compile | `npx tsc --noEmit` |
| 8.3 | Implement `useGameStore` with Zustand | [ ] | Store initializes correctly | `npm run test -- src/app/store/store.test.ts` |
| 8.4 | Implement state selectors | [ ] | Selectors return correct data | `npm run test -- src/app/store/selectors.test.ts` |
| 8.5 | Implement state actions | [ ] | Actions update state correctly | `npm run test -- src/app/store/store.test.ts` |

> **Note**: Zustand is installed but the React-specific store was deferred to Phase 2 (UI Shell). Core modules work standalone without Zustand.

**Store Tests**:
```typescript
describe('GameStore', () => {
  it('should initialize with default state');
  it('should update market prices via tickMarket action');
  it('should update portfolio via executeTrade action');
  it('should queue orders via submitOrder action');
  it('should maintain immutability on updates');
});

describe('Selectors', () => {
  it('selectCash should return portfolio cash');
  it('selectHoldings should compute from lots');
  it('selectTotalValue should sum cash and holdings value');
  it('selectUnrealizedPnL should calculate correctly');
});
```

---

### 9. Storage Adapter

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 9.1 | Create `IStorageAdapter` interface | [x] | Interface compiles | `npx tsc --noEmit` |
| 9.2 | Implement `LocalStorageAdapter` (for dev/testing) | [x] | Passes unit tests | `npm run test -- src/infra/storage/StorageAdapter.test.ts` |
| 9.3 | Implement `FileStorageAdapter` (for Electron) | [ ] | Passes unit tests | Deferred to Electron integration |
| 9.4 | Implement save/load integration with store | [ ] | State persists across sessions | Deferred to Phase 2 |

> **Note**: `MemoryStorageAdapter` implemented for testing. `LocalStorageAdapter` implemented for dev. `FileStorageAdapter` deferred to Electron integration.

**StorageAdapter Tests**:
```typescript
describe('LocalStorageAdapter', () => {
  it('should save data to localStorage');
  it('should load data from localStorage');
  it('should return null for missing keys');
  it('should delete data');
  it('should list all keys');
});
```

---

### 10. Content Data

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 10.1 | Create `companies.json` with 16 stocks + 1 ETF | [x] | JSON validates against schema | Manual verification |
| 10.2 | Create `events.json` with 10 news events | [x] | JSON validates against schema | Manual verification |
| 10.3 | Create JSON schema validators | [ ] | Invalid data rejected | Deferred - data is type-safe in usage |
| 10.4 | Implement `ContentLoader` service | [ ] | Loads and parses data correctly | Deferred to Phase 2 |

**Content Validation Tests**:
```typescript
describe('ContentLoader', () => {
  it('should load companies.json');
  it('should validate company data structure');
  it('should reject invalid company data');
  it('should load events.json');
  it('should validate event data structure');
});
```

---

### 11. Integration Tests

| ID | Task | Status | Acceptance Criteria | Test Command |
|----|------|--------|---------------------|--------------|
| 11.1 | Test: Complete trade flow | [x] | Order → Execute → Portfolio updated | `npm run test:integration` |
| 11.2 | Test: Market tick updates portfolio values | [x] | Holdings value reflects new prices | `npm run test:integration` |
| 11.3 | Test: Event triggers price impact | [ ] | Event fires, prices change correctly | Tested in MarketEngine unit tests |
| 11.4 | Test: State persistence round-trip | [x] | Save → reload → state matches | `npm run test:integration` |
| 11.5 | Test: Performance benchmark | [x] | 100 ticks with 20 stocks < 500ms | `npm run test:integration` (10.47ms!) |

**Integration Test Details**:

```typescript
// trade-flow.integration.test.ts
describe('Trade Flow Integration', () => {
  it('should complete buy order and update portfolio', async () => {
    // 1. Initialize store with $10,000
    // 2. Submit market buy order for 10 shares of ZAP at $150
    // 3. Process end of turn
    // 4. Verify: cash = $8,499 (10*150 + $1 fee)
    // 5. Verify: holdings include 10 ZAP shares
    // 6. Verify: order status = 'filled'
  });
  
  it('should complete sell order and calculate P&L', async () => {
    // 1. Setup portfolio with 10 ZAP shares at $150 cost
    // 2. Set market price to $165
    // 3. Submit market sell order for 5 shares
    // 4. Process end of turn
    // 5. Verify: cash increased by $824 (5*165 - $1 fee)
    // 6. Verify: realized P&L = $75 (5 * $15 gain)
    // 7. Verify: 5 shares remaining
  });
});

// market-tick.integration.test.ts
describe('Market Tick Integration', () => {
  it('should update all prices and portfolio value', async () => {
    // 1. Setup portfolio with holdings
    // 2. Record initial total value
    // 3. Tick market
    // 4. Verify: prices changed within volatility bounds
    // 5. Verify: portfolio total value updated
    // 6. Verify: price history updated
  });
});
```

---

## Verification Plan

### Automated Tests

| Test Type | Command | Coverage Target |
|-----------|---------|-----------------|
| Unit tests | `npm run test` | 90%+ core modules |
| Integration tests | `npm run test:integration` | All critical flows |
| Type checking | `npx tsc --noEmit` | Zero errors |
| Linting | `npm run lint` | Zero errors |

### Manual Verification

After all automated tests pass:

1. **Console Demo** (will create simple CLI)
   - Run `npm run demo`
   - Creates a game with $10,000 cash
   - Buys 10 shares of ZAP
   - Ticks market 5 times
   - Sells 5 shares
   - Prints final portfolio state
   - **Expected**: No errors, P&L calculated correctly

2. **Performance Check**
   - Run `npm run test:perf`
   - Verify market tick < 5ms per tick
   - Verify 100 ticks complete < 500ms total

---

## Dependencies

```json
{
  "dependencies": {
    "zustand": "^4.4.7",
    "immer": "^10.0.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vitest": "^1.1.0",
    "@types/node": "^20.10.5",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "prettier": "^3.1.1"
  }
}
```

---

## Milestones

### Milestone 1: Project Setup (Tasks 1.x)
**Target**: Day 1
**Exit Criteria**: 
- `npm install` works
- `npm run test` runs (no tests yet)
- `npx tsc --noEmit` passes

### Milestone 2: Types & Utilities (Tasks 2.x, 3.x)
**Target**: Day 1-2
**Exit Criteria**:
- All types compile
- Utility tests pass (6 tests)

### Milestone 3: Core Modules (Tasks 4.x, 5.x, 6.x)
**Target**: Day 2-4
**Exit Criteria**:
- MarketEngine tests pass (8 tests)
- PortfolioManager tests pass (9 tests)
- OrderEngine tests pass (9 tests)

### Milestone 4: Infrastructure (Tasks 7.x, 8.x, 9.x)
**Target**: Day 4-5
**Exit Criteria**:
- EventBus tests pass (6 tests)
- Store tests pass (10 tests)
- Storage tests pass (5 tests)

### Milestone 5: Content & Integration (Tasks 10.x, 11.x)
**Target**: Day 5-6
**Exit Criteria**:
- Content loads without errors
- All integration tests pass (5 tests)
- Performance benchmarks met

---

## Success Criteria

Phase 1 is complete when:

1. ✅ All 47 tasks marked `[x]`
2. ✅ `npm run test` passes with 90%+ coverage on core modules
3. ✅ `npm run test:integration` passes all 5 integration tests
4. ✅ `npm run demo` executes without errors
5. ✅ Performance: 100 market ticks in < 500ms

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Type complexity slows development | Start with minimal types, expand as needed |
| Test setup takes too long | Use Vitest defaults, customize later |
| Performance issues early | Profile with Vitest bench, optimize hot paths |
| Scope creep | Strictly follow task list, no UI in Phase 1 |

---

## Notes

- **No UI code in Phase 1**: This is pure engine work
- **All modules must be testable in isolation**: Use dependency injection
- **Immutability enforced**: All state changes return new objects
- **Ready for Phase 2**: UI shell and React integration

---

*Last Updated: December 24, 2024*
