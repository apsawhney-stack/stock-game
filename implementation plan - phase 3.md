# StockQuest: Implementation Plan - Phase 3

> Events, AI, Progression & Enhanced Learning

---

## Overview

Phase 3 adds the remaining core features from the GDD to create a complete learning experience:

1. **Sprint 1**: Event/News System ✅ **COMPLETE**
2. **Sprint 2**: XP & Achievement System ✅ **COMPLETE**
3. **Sprint 3**: AI Opponents & Comparison ✅ **COMPLETE**
4. **Sprint 4**: Price Charts & Market Watch ✅ **COMPLETE**
5. **Sprint 5**: Level Progression & Parent Dashboard ✅ **COMPLETE**

**Status Legend**: `[ ]` Not started | `[/]` In progress | `[x]` Complete

---

## Phase 3 Feature Summary

| Feature | GDD Reference | Priority | Sprint |
|---------|---------------|----------|--------|
| **News Cards with Impact** | Section 4.4 Event System | High | 1 |
| **Scheduled Events** | Section 4.4 | High | 1 |
| **XP System** | Section 4.5 Scoring | High | 2 |
| **Achievement Badges** | Section 4.5 | High | 2 |
| **AI Opponent (Newbie Nancy)** | Section 5.1 Bot Tiers | Medium | 3 |
| **AI Comparison Results** | Section 7 Results Screen | Medium | 3 |
| **Price Chart (5-turn history)** | Section 7 Trade Screen | Medium | 4 |
| **Market Watch (live prices)** | Section 4.6, Screen 0 | Low | 4 |
| **Level Selection** | Learning Map | Medium | 5 |
| **Parent Dashboard** | Section 7 Screen 5 | Low | 5 |

---

## Prerequisites

- [x] Phase 1 core engine complete (131 tests)
- [x] Phase 2 UI shell complete (155 tests)
- [x] Complete game loop working (Home → Trade → Results)

---

## Sprint 1: Event/News System

**Goal**: Make news cards actually affect prices per GDD Section 4.4

| ID | Task | Status | Description |
|----|------|--------|-------------|
| **Event Engine** ||||
| 1.1 | Create `EventEngine.ts` | [x] | Schedule and process events |
| 1.2 | Define event types (earnings, sector, market) | [x] | TypeScript enums/interfaces |
| 1.3 | Create events.json content file | [x] | 10 sample news events |
| 1.4 | Integrate with MarketEngine | [x] | Events trigger price impacts |
| **News UI** ||||
| 1.5 | Create `NewsCard` component | [x] | Headline, impact indicator, explanation |
| 1.6 | Add impact tooltip | [x] | Kid-friendly explanation on tap |
| 1.7 | Show news queue on Dashboard | [x] | 0-2 cards per turn |
| 1.8 | Add news read tracking | [x] | Track for XP/achievements |
| **Event Scheduling** ||||
| 1.9 | Random event generation per turn | [x] | Based on probability |
| 1.10 | Scripted events for Level 1 | [x] | Tutorial-friendly events |
| **Tests** ||||
| 1.11 | EventEngine unit tests | [x] | 17 tests passing |
| 1.12 | NewsCard component test | [x] | Render and interaction |
| 1.13 | Browser verification | [x] | News → price change flow |

**Acceptance Criteria**:
- [x] News card appears on Dashboard each turn
- [x] Clicking news shows explanation
- [x] Price changes reflect news impact
- [x] 17 new tests passing

---

## Sprint 2: XP & Achievement System ✅

**Goal**: Implement scoring system per GDD Section 4.5

| ID | Task | Status | Description |
|----|------|--------|-------------|
| **XP Engine** ||||
| 2.1 | Create `ScoringEngine.ts` | [x] | Calculate XP for actions |
| 2.2 | Track XP in store | [x] | Added to session state |
| 2.3 | XP rewards per action | [x] | Per GDD table (news: 5XP, etc.) |
| 2.4 | Daily XP cap (500) | [x] | Prevent grinding |
| **Achievements** ||||
| 2.5 | Create `AchievementEngine.ts` | [x] | Check conditions, unlock badges |
| 2.6 | Define 12 achievements | [x] | Diversifier, Diamond Hands, etc. |
| 2.7 | achievements.json data file | [x] | Badge definitions |
| 2.8 | Track progress conditions | [x] | For condition-based badges |
| **UI** ||||
| 2.9 | Add XP display to Dashboard header | [x] | Current XP shown |
| 2.10 | Create `AchievementPopup` component | [x] | Animated badge unlock |
| 2.11 | Update Results screen with XP earned | [x] | "+10 XP" displayed |
| 2.12 | Create Badges screen | [ ] | Deferred to polish sprint |
| **Tests** ||||
| 2.13 | ScoringEngine tests | [x] | 23 tests passing |
| 2.14 | AchievementEngine tests | [x] | 19 tests passing |
| 2.15 | Browser verification | [x] | XP flows correctly |

**Acceptance Criteria**:
- [x] XP earned after reading news
- [x] XP displays in Dashboard header
- [x] Results screen shows XP earned
- [x] 42 new tests passing

---

## Sprint 3: AI Opponents & Comparison ✅

**Goal**: Add AI competitor per GDD Section 5.1

| ID | Task | Status | Description |
|----|------|--------|-------------|
| **AI Engine** ||||
| 3.1 | Create `AIEngine.ts` | [x] | Decide AI actions each turn |
| 3.2 | Implement Newbie Nancy behaviors | [x] | Random buy, panic sell |
| 3.3 | Add AI portfolio to store | [x] | Track AI holdings/value |
| 3.4 | AI makes decisions on advance turn | [x] | Runs on each turn |
| 3.5 | AI decision explainer | [x] | Generate kid-friendly explanations |
| **Results Comparison** ||||
| 3.6 | Add AI performance to Results | [x] | "You vs Nancy" comparison |
| 3.7 | Explain why AI won/lost | [x] | Learning moment |
| 3.8 | Add comparison bar chart | [x] | Animated visual comparison |
| **UI** ||||
| 3.9 | Show AI portrait on Dashboard | [x] | "Racing against Nancy" |
| 3.10 | AI emotion emoji | [x] | Shows AI emotional state |
| 3.11 | Show AI moves during game | [x] | "🤖 Nancy bought 5 BURG" notifications |
| **Tests** ||||
| 3.12 | AIEngine tests | [x] | 16 tests passing |
| 3.13 | AI comparison tests | [x] | Win/lose determination |
| 3.14 | Browser verification | [x] | Full game with AI |

**Acceptance Criteria**:
- [x] AI makes trades each turn (visible in notifications)
- [x] Results show AI comparison bar chart
- [x] AI explanation teaches lesson
- [x] 16 new tests passing

---

## Sprint 4: Price Charts & Market Watch ✅

**Goal**: Add price visualization per GDD Section 7 wireframes

| ID | Task | Status | Description |
|----|------|--------|-------------|
| **Price Chart** ||||
| 4.1 | Create `PriceChart` component | [x] | SVG line chart with animation |
| 4.2 | Use SVG for performance | [x] | Smooth rendering |
| 4.3 | Add trend arrow indicator | [x] | Up/down/flat icons |
| 4.4 | Integrate into Trade screen | [x] | Shows when stock selected |
| 4.5 | Add price history to store | [x] | Track prices per turn |
| **Market Watch (Optional)** ||||
| 4.6 | Create real-time price animation | [ ] | Deferred to polish |
| 4.7 | Explanation engine | [ ] | Deferred to polish |
| 4.8 | Mini charts on Dashboard | [ ] | Deferred to polish |
| **Tests** ||||
| 4.9 | TypeScript compiles | [x] | All types pass |
| 4.10 | Browser verification | [x] | Charts visible in flow |

**Acceptance Criteria**:
- [x] Price chart shows on Trade screen
- [x] Trend arrows indicate direction
- [x] Animated line draw on load
- [x] Color-coded (green up, red down)

---

## Sprint 5: Level Progression & Parent Dashboard ✅

**Goal**: Add level system and parent controls per GDD

| ID | Task | Status | Description |
|----|------|--------|-------------|
| **Level System** ||||
| 5.1 | Create missions.json with 3 levels | [x] | Level 1-3 definitions |
| 5.2 | My Stats screen | [x] | Shows XP, achievements, missions |
| 5.3 | Mission types and module | [x] | Progression logic |
| 5.4 | Level select in briefing | [ ] | Deferred to polish |
| **Parent Dashboard (Deferred)** ||||
| 5.5 | Create Parent Zone PIN gate | [ ] | Future feature |
| 5.6 | Create `ParentDashboard` screen | [ ] | Future feature |
| **Tests** ||||
| 5.7 | TypeScript compiles | [x] | All types pass |
| 5.8 | Browser verification | [x] | Stats screen works |

**Acceptance Criteria**:
- [x] My Stats screen shows player progress
- [x] 3 mission levels defined
- [x] Achievements displayed
- [ ] Parent zone (future sprint)

---

## Test Strategy

### Automated Tests

| Sprint | Test Files | Commands |
|--------|------------|----------|
| Sprint 1 | `EventEngine.test.ts`, `NewsCard.test.tsx` | `npm test -- src/core/events` |
| Sprint 2 | `ScoringEngine.test.ts`, `AchievementEngine.test.ts` | `npm test -- src/core/scoring` |
| Sprint 3 | `AIEngine.test.ts` | `npm test -- src/core/ai` |
| Sprint 4 | `PriceChart.test.tsx` | `npm test -- src/ui/components/PriceChart` |
| Sprint 5 | `LevelManager.test.ts` | `npm test -- src/app` |

### Browser Verification

Each sprint ends with a browser subagent test to verify:
1. Feature works end-to-end
2. No console errors
3. Screenshot captured for walkthrough

---

## Milestones

| Milestone | Status | Deliverable |
|-----------|--------|-------------|
| Sprint 1: Events | ✅ Complete | News cards affect prices |
| Sprint 2: XP/Badges | ✅ Complete | 42 scoring tests passing |
| Sprint 3: AI | ✅ Complete | 16 AI tests, Nancy opponent |
| Sprint 4: Charts | ✅ Complete | Price chart on Trade screen |
| Sprint 5: Levels | ✅ Complete | StatsScreen, 3 missions |

---

## Success Criteria

Phase 3 is complete when:

1. [x] News events affect stock prices
2. [x] XP earned and achievements tracked
3. [x] AI opponent plays alongside player
4. [x] Results explain why player won/lost
5. [x] Price charts show history
6. [x] My Stats screen with missions/achievements
7. [ ] Parent dashboard (future)
8. [x] 230+ tests passing (currently 230)

---

## Dependencies

```bash
# No new dependencies expected
# May add chart library if Canvas/SVG insufficient:
# npm install recharts  # Lightweight chart library
```

---

## Notes

- **Kid-friendly first**: All AI explanations and feedback must be simple
- **No grinding**: Daily XP cap prevents unhealthy play patterns
- **Parent visibility**: Parents see exactly what child is learning
- **Iterative delivery**: Each sprint is playable and testable

---

*Created: December 25, 2024*
