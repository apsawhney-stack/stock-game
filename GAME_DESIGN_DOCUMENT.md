# StockQuest: Kid-Friendly Investment Learning Game
## Complete Game Design Document

---

# Section 1: Assumptions and Constraints

## High-Level Rationale

**Core Philosophy**: Learning by doing beats passive reading. This game simulates market dynamics in a safe sandbox where mistakes become teachable moments, not financial losses.

**Design Decisions**:

| Decision | Rationale |
|----------|-----------|
| **Fictional markets only** | Avoids COPPA issues with real financial data; allows scripted educational events |
| **Turn-based, not real-time** | Reduces anxiety; allows reflection; no twitch-skill advantage |
| **10-turn missions** | Maps to ~8 minute sessions; maintains attention span |
| **Simplified order types** | Market and limit orders only; no complex order routing |
| **No leverage until Level 8** | Builds foundation before introducing amplified risk concepts |
| **AI opponents explain moves** | Transforms competition into collaborative learning |
| **Local-first architecture** | Works offline; no server costs initially; easier parental oversight |

**Constraints**:
- No real money or in-app purchases (ethical + COPPA)
- No external links to brokers or trading platforms
- Chat disabled by default; parent must explicitly enable filtered chat
- Session timer encourages breaks (max 30 minutes before prompt)
- All volatility capped to prevent portfolio wipeouts (max -40% per turn on any single asset)

---

# Section 2: Learning Map

| Level | Learning Objectives | Core Mechanics | Success Criteria | Assessment Checks |
|-------|---------------------|----------------|------------------|-------------------|
| **1: First Trade** | Company, stock, share, ticker; buy/sell basics; bid/ask spread | Single stock trading; market orders | +2% profit in 10 turns | 3 multiple choice: "What is a share?", "Why do prices move?", "What does bid/ask mean?" |
| **2: Spread Your Seeds** | Diversification; sectors; correlation; drawdown reduction | 5-sector portfolio; allocation sliders | Max drawdown <15% over 15 turns | Build a portfolio; explain why spreading reduces risk |
| **3: Index Challenge** | Index funds/ETFs; benchmarking; passive vs active | Unlock index fund; compare to manual picks | Beat or match index fund over 20 turns | "What's an ETF?"; "Why is beating the market hard?" |
| **4: Money Grows** | Compound interest; regular contributions; time value | Savings mode; periodic deposits; interest visualization | Reach $10,000 from $5,000 in 30 turns | Calculate: "$100 at 10% for 3 years"; drag growth curve |
| **5: News Flash** | Earnings; news events; short-term vs long-term thinking | News cards trigger volatility; rumor vs fact | Maintain +5% after 5 news shocks | Classify headlines as short-term noise vs fundamental change |
| **6: Insurance Plays** | Options as insurance (calls/puts); premium concept; position sizing | Buy calls/puts with capped position sizes | Protect portfolio from 20% drop event | "When would you buy a put?"; "What's premium?" |
| **7: Wild Crypto** | High volatility assets; utility narratives; wallet safety | Crypto sector unlocked; 2x volatility | Manage crypto to <10% of portfolio | Risk rating quiz; "Why limit crypto exposure?" |
| **8: Future Delivery** | Futures as agreements; margin basics; leverage risks | Futures contracts; 2x leverage cap; margin call simulation | Avoid margin call in 5 turns | "What happens in a margin call?"; spot delivery date |

---

# Section 3: Core Game Loop

## Single Turn Flow (Diagram-by-Description)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TURN START                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. RECEIVE MISSION BRIEFING                                                 │
│     └─> "Buy stock in RocketBurger. Try to make 2% profit!"                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. REVIEW DASHBOARD                                                         │
│     ├─> Portfolio summary (cash, holdings, total value)                     │
│     ├─> Price chart (simple 5-turn history, trend arrow)                    │
│     └─> News cards (0-2 per turn, affects next price)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. MAKE DECISIONS                                                           │
│     ├─> BUY: Select stock, quantity, order type (market/limit)              │
│     ├─> SELL: Select holding, quantity, order type                          │
│     └─> HOLD: Skip trading this turn (sometimes the right move!)            │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. ADVANCE TIME                                                             │
│     └─> Click "Next Day" button                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. SEE OUTCOMES                                                             │
│     ├─> Price changes animated (green up, red down)                         │
│     ├─> Portfolio value updated                                              │
│     ├─> Orders filled (or not, if limit not reached)                        │
│     └─> News impact revealed ("Good earnings! +8%")                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  6. RECEIVE FEEDBACK                                                         │
│     ├─> Tip card: "Nice! You bought low and held. That's patience!"         │
│     ├─> Warning card: "Careful! 80% in one stock is risky."                 │
│     └─> Badge earned: "Diversifier" (first 3-stock portfolio)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  7. LOOP OR END                                                              │
│     └─> If turns remain: Go to step 2                                       │
│     └─> If mission complete: Show results screen                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bullet Rules

- **One trade per stock per turn** (prevents over-trading habit)
- **All orders execute at turn end** (teaches patience, avoids high-frequency behavior)
- **Limit orders expire after 2 turns** if not filled
- **Minimum trade size: 1 share** (fractional shares for expensive stocks)
- **Cash cannot go negative** (no margin except in Level 8)
- **Undo available once per mission** (teaches that real trades are final)

---

# Section 4: Systems Design

## 4.1 Trading Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Starting cash | $10,000 | Round number, feels substantial |
| Max position size | 50% of portfolio (Levels 1-5), 30% (Levels 6+) | Forces diversification |
| Transaction fee | $1 flat | Simple to understand; teaches costs exist |
| Spread (bid-ask) | 0.5% of price | Visible but not punishing |
| Price movement per turn | -10% to +15% (normal), ±30% (news event) | Realistic enough to teach volatility |
| Dividend yield | 1-3% annually (paid quarterly in-game) | Teaches passive income concept |

## 4.2 Order Types Supported

| Order Type | Availability | Description (Kid-Friendly) |
|------------|--------------|----------------------------|
| **Market Order** | Level 1+ | "Buy right now at today's price" |
| **Limit Order** | Level 2+ | "Only buy if price drops to my target" |
| **Stop-Loss** | Level 5+ | "Sell automatically if price falls too much" |

## 4.3 Portfolio/Risk Limits

- **Concentration warning**: Alert if >40% in single stock
- **Concentration block**: Cannot exceed 50% in single stock (Levels 1-5)
- **Sector exposure**: Alert if >60% in one sector
- **Crypto cap**: Cannot exceed 15% of portfolio in crypto (Level 7+)
- **Leverage cap**: 2x maximum, with visible margin meter (Level 8 only)
- **Margin call threshold**: If equity drops below 25% of position, forced liquidation with explanation

## 4.4 Event System

Events drive learning moments. Each event type:

| Event Type | Frequency | Impact Range | Examples |
|------------|-----------|--------------|----------|
| **Earnings Report** | 1 per 5 turns | ±15% | "ZappyTech beat expectations!" |
| **Sector News** | 1 per 3 turns | ±8% to sector | "New health law affects MediPaws" |
| **Market-Wide** | 1 per 10 turns | ±5% all stocks | "Summer slump, everyone's on vacation" |
| **Random Walk** | Every turn | ±5% | Normal daily fluctuation |
| **Black Swan** | 1 per game (scripted) | -25% market | "Supply chain crisis!" (teaches holding through fear) |

## 4.5 Scoring System

| Action | XP Earned | Badge Opportunity |
|--------|-----------|-------------------|
| Complete level | 100 XP | Level-specific badge |
| Hold through volatility | 25 XP | "Diamond Hands" badge |
| Maintain diversification | 10 XP/turn | "Balanced Investor" badge |
| Use limit order (fill) | 15 XP | "Patient Trader" badge |
| Beat benchmark | 50 XP | "Market Beater" badge |
| Read all news cards | 5 XP/card | "Informed Investor" badge |
| Complete without undo | 30 XP | "No Take-Backs" badge |

**Anti-Grind Mechanics**:
- Daily XP cap: 500 XP
- Level replay gives 50% XP
- Leaderboard based on skill rating (Elo-style), not total XP

## 4.6 Live Market Watch System

The Live Market Watch is a **learning mode** where kids observe simulated real-time price movements with explanations. This builds intuition BEFORE they start trading.

### How It Works

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Update frequency** | Every 0.5-1 second | Fast enough to feel "live", slow enough to read |
| **Price change per tick** | ±0.1% to ±0.5% | Small moves feel realistic |
| **Time compression** | 1 real second = 1 simulated minute | Full "trading day" in ~6.5 minutes |
| **Explanation refresh** | On every significant move (>0.2%) | Don't overwhelm with constant text |

### Price Movement Drivers (Simulated)

The system generates price movements based on weighted factors:

```
Price Change = (Random Walk) + (Trend Momentum) + (News Impact) + (Volume Simulation)
```

| Factor | Weight | Description |
|--------|--------|-------------|
| **Random Walk** | 40% | Normal market noise, Gaussian distribution |
| **Trend Momentum** | 25% | Recent direction continues with decay |
| **News Impact** | 25% | Triggered events cause spikes/drops |
| **Volume Simulation** | 10% | "Heavy buying" or "selling pressure" narratives |

### Explanation Engine

Each price tick triggers an explanation from a library of kid-friendly messages:

| Price Direction | Sample Explanations |
|-----------------|---------------------|
| **Up (small)** | "A few more buyers stepped in" |
| **Up (medium)** | "Investors feeling confident today!" |
| **Up (large)** | "Wow! Big news just hit - everyone's buying!" |
| **Down (small)** | "Some investors taking a small profit" |
| **Down (medium)** | "Sellers outnumber buyers right now" |
| **Down (large)** | "Uh oh! Bad news made people nervous" |
| **Flat** | "Buyers and sellers in balance - no one's sure" |
| **Reversal** | "The trend changed direction! Markets can surprise you" |

### Prediction Mini-Game Mechanics

| Element | Specification |
|---------|---------------|
| **Unlock after** | 10 seconds of watching |
| **Prediction window** | Next 5 ticks (5-10 seconds) |
| **Success threshold** | >60% of ticks match prediction |
| **XP reward** | 5 XP per correct, 0 for incorrect (no penalty) |
| **Streak bonus** | 3 correct = +10 XP bonus, badge progress |
| **Teaching moment** | After each prediction, show "Here's what actually happened: [explanation]" |

### Access Points

Kids can access Market Watch from:
1. **Home Screen**: "Watch Markets" button (unlocks Level 2+)
2. **Trade Screen**: Tap any stock to watch it live before buying
3. **Dashboard**: Tap holdings to watch stocks they own
4. **Tutorial**: Mandatory 30-second watch session before first trade

---

# Section 5: AI Design

## 5.1 Bot Tiers

### Tier 1: "Newbie Nancy" (Levels 1-3)

**Behavior**:
- Buys randomly from top 3 stocks by recent performance
- Never uses limit orders
- Sells if any stock drops 10%+ (panic selling)
- No diversification strategy

**Purpose**: Easy opponent; demonstrates common beginner mistakes

**Post-Game Explanation**:
> "Nancy sold ZappyTech when it dropped 12%, but it bounced back 20% next turn! Sometimes patience pays off. You held steady and won!"

---

### Tier 2: "Basic Bob" (Levels 4-5)

**Behavior**:
- Diversifies across 3 sectors
- Trend-follows (buys stocks up 3+ turns in a row)
- Uses limit orders 30% of the time
- Holds through small dips

**Purpose**: Moderate challenge; teaches that simple strategies can work

**Post-Game Explanation**:
> "Bob spread his money across Tech, Food, and Health. That helped when Tech crashed. You focused too much on Tech and lost more. Diversification is like not putting all eggs in one basket!"

---

### Tier 3: "Savvy Sam" (Level 6+)

**Behavior**:
- Reacts to news cards (buys before positive earnings, sells before negative)
- Uses sector rotation (moves money to undervalued sectors)
- Position sizing based on risk (smaller bets on volatile stocks)
- Uses options for protection when available

**Purpose**: Advanced challenge; demonstrates news-aware investing

**Post-Game Explanation**:
> "Sam noticed the earnings report coming for MediPaws and bought a call option just in case. When earnings beat expectations, Sam's option gained 40%! Reading news cards carefully gives you an edge."

---

### Tier 4: "Professor Panda" (Ultimate Challenge)

**Behavior**:
- All of Sam's behaviors
- Contrarian plays (buys during fear, sells during euphoria)
- Tracks correlation and rebalances weekly
- Never exceeds risk limits

**Purpose**: Near-optimal play; players learn by observing after losing

**Post-Game Explanation**:
> "Professor Panda bought RocketBurger during the big market crash when everyone else was scared. 'Be greedy when others are fearful,' Panda says. The stock recovered 35%!"

---

# Section 6: Content Bible

## Fictional Companies (16 Tickers)

### Technology Sector
| Ticker | Company Name | Risk Rating | Base Price | Volatility | Description |
|--------|--------------|-------------|------------|------------|-------------|
| **ZAP** | ZappyTech | Medium | $150 | ±8%/turn | Makes smartphones and tablets |
| **RBT** | RoboBuddy | High | $45 | ±15%/turn | AI robot toys for kids |
| **CLO** | CloudKingdom | Low | $200 | ±5%/turn | Cloud storage, boring but stable |
| **GAM** | GameForge | Medium | $80 | ±10%/turn | Video game company |

### Food & Beverage Sector
| Ticker | Company Name | Risk Rating | Base Price | Volatility | Description |
|--------|--------------|-------------|------------|------------|-------------|
| **RKB** | RocketBurger | Low | $35 | ±4%/turn | Fast food chain, always popular |
| **FZT** | FizzyTreats | Low | $25 | ±3%/turn | Soda and candy company |
| **ORG** | OrganicOwl | Medium | $60 | ±7%/turn | Healthy food startup |
| **CFE** | CoffeeCraze | Medium | $40 | ±6%/turn | Coffee shops everywhere |

### Healthcare Sector
| Ticker | Company Name | Risk Rating | Base Price | Volatility | Description |
|--------|--------------|-------------|------------|------------|-------------|
| **MDP** | MediPaws | Medium | $90 | ±8%/turn | Pet healthcare company |
| **VIT** | VitaBoost | Low | $55 | ±4%/turn | Vitamins and supplements |
| **GEN** | GeneGlow | High | $120 | ±12%/turn | Biotech research, risky but exciting |
| **FIT** | FitFriend | Medium | $30 | ±6%/turn | Fitness trackers and apps |

### Energy & Materials Sector
| Ticker | Company Name | Risk Rating | Base Price | Volatility | Description |
|--------|--------------|-------------|------------|------------|-------------|
| **SUN** | SunnyPower | Medium | $70 | ±9%/turn | Solar panels and clean energy |
| **BAT** | BatteryBros | High | $100 | ±14%/turn | Electric car batteries |
| **RCY** | RecycleRight | Low | $20 | ±4%/turn | Recycling and waste management |
| **MIN** | MineralMagic | Medium | $85 | ±10%/turn | Mining company for metals |

### Index Fund
| Ticker | Name | Risk Rating | Volatility | Description |
|--------|------|-------------|------------|-------------|
| **MKT** | MarketMix Index | Low | ±4%/turn | Tracks all 16 companies equally |

### Crypto Assets (Level 7+)
| Ticker | Name | Risk Rating | Volatility | Description |
|--------|------|-------------|------------|-------------|
| **SPC** | SpaceCoin | Very High | ±25%/turn | Fictional cryptocurrency, lesson in volatility |
| **ECO** | EcoCoin | High | ±18%/turn | "Green" crypto for environmental projects |

---

## Example News Cards

| ID | Headline | Affected Ticker(s) | Impact | Learning Link |
|----|----------|-------------------|--------|---------------|
| N1 | "ZappyTech announces new phone!" | ZAP | +12% | Product launches can boost prices |
| N2 | "RocketBurger recalls burgers for safety" | RKB | -15% | Bad news hurts stock prices |
| N3 | "Summer is here! Kids want toys!" | RBT, GAM | +8% each | Seasonal trends affect sectors |
| N4 | "Health trend: Everyone's exercising!" | FIT, VIT | +10% each | Social trends move markets |
| N5 | "Oil prices spike, energy costs up" | SUN, BAT | +15% each | Some companies benefit from others' problems |
| N6 | "GeneGlow drug trial fails" | GEN | -25% | High-risk companies have big swings |
| N7 | "New law: More recycling required" | RCY | +20% | Government policy affects business |
| N8 | "SpaceCoin celebrity tweet!" | SPC | +40% | Crypto is extra volatile (and unpredictable) |
| N9 | "Market jitters: Investors nervous" | ALL | -8% | Sometimes everything drops together |
| N10 | "Great economic report: Jobs up!" | ALL | +5% | Good economy lifts all boats |

---

# Section 7: UX Wireframe-by-Description

## Screen 0: Market Watch (Live Price Visualization)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [← Back]                MARKET WATCH                    🔴 LIVE         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📈 ZappyTech (ZAP)                                                      │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         $153.72                                     │ │
│  │                         ▲ +0.18%                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                                                              │  │ │
│  │  │     [ANIMATED LINE CHART - Price ticking up/down in          │  │ │
│  │  │      real-time with smooth animation, showing last           │  │ │
│  │  │      30 seconds of price movement]                           │  │ │
│  │  │                                                              │  │ │
│  │  │                                           ╱╲                 │  │ │
│  │  │                                    ╱╲   ╱    ╲               │  │ │
│  │  │                              ╱╲  ╱    ╲╱                     │  │ │
│  │  │                        ╱╲  ╱    ╲                            │  │ │
│  │  │                  ╱╲  ╱    ╲                                  │  │ │
│  │  │            ╱╲  ╱    ╲                                        │  │ │
│  │  │      ╱╲  ╱    ╲                                              │  │ │
│  │  │  ──╱    ╲                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📊 PRICE HISTORY (last 5 ticks)                                   │ │
│  │  $153.72  ↗ (+$0.27)  "More buyers!"                              │ │
│  │  $153.45  ↗ (+$0.25)  "Demand increasing"                         │ │
│  │  $153.20  ↘ (-$0.15)  "Some profit-taking"                        │ │
│  │  $153.35  ↗ (+$0.40)  "Good news spreading"                       │ │
│  │  $152.95  ↘ (-$0.10)  "Normal fluctuation"                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  💬 WHY IT'S MOVING RIGHT NOW:                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  💡 "More buyers than sellers right now! When lots of        │  │ │
│  │  │      people want to buy, the price goes UP."                 │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  🔮 PREDICT: What happens next?                                    │ │
│  │  [📈 Goes UP]    [📉 Goes DOWN]    [➡️ Stays FLAT]                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [⏸️ PAUSE]           [👁️ WATCH ANOTHER]           [🛒 BUY NOW]        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements**:
- **LIVE indicator**: Pulsing red dot shows real-time (simulated) data
- **Animated chart**: Price line moves smoothly, updating every 0.5-1 second
- **Price history stack**: Last 5 price changes with mini-explanations
- **"Why it's moving" box**: Real-time educational explanations of price action
- **Prediction game**: Kids guess direction, builds intuition before trading
- **Pause button**: Freeze time to study a moment; great for teaching

### Live Market Watch: Learning Moments

| Price Action | Explanation Shown | Concept Taught |
|--------------|-------------------|----------------|
| Gradual uptrend | "Steady buying pressure - investors like this stock" | Supply exceeds demand |
| Sudden spike ↑ | "Breaking news! Good news spreads fast" | News impacts price instantly |
| Slow drift down | "Some investors taking profits after gains" | Profit-taking is normal |
| Sharp drop ↓ | "Unexpected bad news shook confidence" | Risk appears suddenly |
| Sideways/flat | "Market uncertain, waiting for more info" | Sometimes nothing happens |
| Bounce after drop | "Bargain hunters stepping in!" | Buying the dip |
| High volatility | "Lots of disagreement on fair price" | Volatility = uncertainty |

### Prediction Mini-Game

After watching for 10+ seconds, kids can predict the next move:
- **Correct prediction**: +5 XP, streak counter increases
- **Incorrect prediction**: No penalty, explanation of what happened
- **3 correct in a row**: "Pattern Spotter" badge progress

This builds **pattern recognition** and **intuition** without risking virtual money.

---

## Screen 1: Home Screen

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Logo: StockQuest - Invest & Learn!]                                    │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  🎮 PLAY        │  │  📊 MY STATS    │  │  🏆 BADGES      │          │
│  │  Continue       │  │  Level 3        │  │  12 of 50       │          │
│  │  Level 3        │  │  1,240 XP       │  │  View All →     │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  DAILY TIP: "Diversification means spreading your investments      ││
│  │  across different companies so one bad day doesn't hurt too much!" ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  [⚙️ Settings]  [👨‍👩‍👧 Parent Zone]  [❓ Help]                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Large, tappable buttons (touch-friendly for future tablet)
- Current progress prominently displayed
- Daily rotating tip to reinforce learning
- Parent Zone requires PIN (set on first launch)

---

## Screen 2: Portfolio Dashboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [← Back]               MISSION: Make +5%              Turn 4 of 10     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  💰 YOUR PORTFOLIO                              📈 TOTAL: $10,450 (+4.5%)│
│  ├── Cash: $2,450                                                        │
│  └── Stocks: $8,000                                                      │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  YOUR HOLDINGS                                                      │ │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐         │ │
│  │  │ ZAP      │ 20 shares│ $3,100   │ +3.3%    │ [SELL]   │         │ │
│  │  │ RKB      │ 50 shares│ $1,850   │ +5.7%    │ [SELL]   │         │ │
│  │  │ MKT      │ 15 shares│ $3,050   │ +1.7%    │ [SELL]   │         │ │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📰 TODAY'S NEWS                                                    │ │
│  │  "ZappyTech announces new phone!"                    [Read More ❓] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [🛒 TRADE]                              [⏩ NEXT DAY]                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Clear money display with percentage change (color-coded)
- Holdings table with quick-sell buttons
- News card is prominent—reading it is part of the game
- "Next Day" advances time; can't be undone (except 1 undo token)

---

## Screen 3: Trade Screen

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [← Back to Portfolio]                                                    │
│                                                                           │
│  🛒 TRADE                                             Cash: $2,450       │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  SELECT A STOCK                                                     │ │
│  │  ┌──────┬───────────────┬────────┬────────┬───────────────┐       │ │
│  │  │ ZAP  │ ZappyTech     │ $155   │ 📈 +3% │ ⭐⭐⭐ (Med)    │       │ │
│  │  │ RKB  │ RocketBurger  │ $37    │ 📈 +6% │ ⭐⭐ (Low)      │       │ │
│  │  │ GEN  │ GeneGlow      │ $108   │ 📉 -8% │ ⭐⭐⭐⭐ (High) │       │ │
│  │  │ MKT  │ MarketMix     │ $205   │ 📈 +2% │ ⭐ (Low)        │       │ │
│  │  └──────┴───────────────┴────────┴────────┴───────────────┘       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  SELECTED: ZAP - ZappyTech                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  [CHART: Simple 5-day line chart with trend arrow]           │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                      │ │
│  │  HOW MANY SHARES?  [  5  ] [-] [+]                                  │ │
│  │  TOTAL COST: $775 + $1 fee = $776                                   │ │
│  │                                                                      │ │
│  │  ORDER TYPE:  [● Market (buy now)]  [○ Limit (set max price)]       │ │
│  │                                                                      │ │
│  │  ⚠️ This would put 35% of your portfolio in Tech stocks.           │ │
│  │     That's a bit risky! Consider diversifying.                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [CANCEL]                                      [✅ CONFIRM BUY]          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Stock list with risk stars (1-4 stars = low to high risk)
- Simple chart: just a line, no candlesticks or complex indicators
- Quantity selector with cost preview
- Real-time concentration warning (orange alert box)
- Confirm button is larger and green for clear action

---

## Screen 4: Results Screen (End of Mission)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                    🎉 MISSION COMPLETE! 🎉                               │
│                                                                           │
│  Started: $10,000                                                        │
│  Ended:   $10,720  (+7.2%)                                               │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📊 YOUR PERFORMANCE                                                │ │
│  │  [Simple bar chart: You vs Benchmark vs AI Opponent]                │ │
│  │  You: +7.2%  |  MarketMix: +4.1%  |  Basic Bob: +5.8%               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  🏆 ACHIEVEMENTS THIS ROUND:                                             │
│  ├── 🎖️ Market Beater: You beat the index!                             │
│  ├── 🎖️ Diversifier: Held 3+ different stocks                          │
│  └── 🎖️ News Reader: Read every news card                              │
│                                                                           │
│  💡 WHAT YOU LEARNED:                                                    │
│  "You held ZappyTech through a dip and it recovered. That's called      │
│   'staying the course'—panicking often leads to selling low!"           │
│                                                                           │
│  🤖 WHY BOB LOST:                                                        │
│  "Bob sold ZappyTech during the dip and missed the recovery.            │
│   Panic selling is a common mistake!"                                   │
│                                                                           │
│  +120 XP EARNED                                                          │
│                                                                           │
│  [NEXT LEVEL]                [REPLAY]                [HOME]              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 5: Parent Dashboard

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [← Exit to Home]        PARENT DASHBOARD        [🔒 Change PIN]        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  👤 PLAYER: Alex                                                         │
│  📅 Playing since: December 2024                                         │
│  ⏱️ Total play time: 4.2 hours                                           │
│  📈 Current level: 5 (Events & Earnings)                                 │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📚 SKILLS LEARNED                                                  │ │
│  │  ✅ Understanding stocks and shares                                 │ │
│  │  ✅ Diversification reduces risk                                    │ │
│  │  ✅ Index funds track the market                                    │ │
│  │  ✅ Compound interest grows money over time                         │ │
│  │  🔄 Reacting to news (in progress)                                  │ │
│  │  ⬜ Options as insurance (upcoming)                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ⚙️ CONTROLS                                                        │ │
│  │  Session time limit: [30 minutes ▼]                                 │ │
│  │  Daily XP cap: [500 XP ▼]                                           │ │
│  │  Enable multiplayer chat: [OFF]                                     │ │
│  │  Allow advanced levels (options/crypto): [ON]                       │ │
│  │  Weekly summary email: [parent@email.com]                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [📊 View Detailed Reports]    [🔒 Reset Progress]    [❓ Parent FAQ]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements**:
- PIN-protected access (4-digit PIN set on first launch)
- Clear skill progression mapping to learning objectives
- Granular controls for time, content, and multiplayer
- Optional email summaries (requires parent email, stored locally only)

---

# Section 8: Tech Plan

## Option A: Roblox Studio (Lua) from Day One

**Approach**: Build directly in Roblox Studio using Lua/Luau.

| Aspect | Details |
|--------|---------|
| **Language** | Lua/Luau |
| **UI Framework** | Roblox UI (Frames, TextLabels, etc.) |
| **Data Storage** | Roblox DataStore (cloud-synced) |
| **Multiplayer** | Built-in Roblox networking |
| **Platform** | Roblox client (cross-platform) |

**Pros**:
- ✅ Immediate multiplayer support
- ✅ No porting needed—one codebase
- ✅ Access to Roblox's massive kid audience
- ✅ Built-in safety features (chat filter, moderation)

**Cons**:
- ❌ Cannot run as standalone macOS app (Roblox client required)
- ❌ Lua ecosystem less mature than TypeScript/JavaScript
- ❌ UI limitations compared to web technologies
- ❌ Revenue share with Roblox (if monetized later)
- ❌ Requires internet connection always

---

## Option B: Desktop App (TypeScript + React) → Later Roblox Port

**Approach**: Build desktop app first, then port core logic to Roblox.

| Aspect | Desktop (Phase 1) | Roblox (Phase 2) |
|--------|-------------------|------------------|
| **Language** | TypeScript | Lua/Luau (ported) |
| **UI Framework** | React + Electron | Roblox UI |
| **Game Logic** | Shared module (TypeScript) | Transpiled or rewritten |
| **Data Storage** | Local JSON/SQLite | Roblox DataStore |
| **Multiplayer** | None initially | Roblox networking |

**Pros**:
- ✅ Fully offline macOS app (no internet needed)
- ✅ Modern development experience (TypeScript, React)
- ✅ Rich UI capabilities (CSS, animations)
- ✅ Easier debugging and testing
- ✅ No platform dependencies initially

**Cons**:
- ❌ Porting effort required for Roblox
- ❌ Potential logic drift between codebases
- ❌ Multiplayer delayed to Phase 2
- ❌ Two separate apps to maintain long-term

---

## Recommendation: **Option B (Desktop First, Roblox Later)**

**Rationale**:
1. **Offline-first is critical for 11-year-olds**: Not all kids have consistent internet; parental controls easier without cloud
2. **Faster iteration**: TypeScript + React allows rapid UI prototyping
3. **Clean separation**: Prove the learning mechanics before adding multiplayer complexity
4. **Migration path is well-defined**: Core game logic is modular by design

---

## Migration Path to Roblox

### Phase 1: Desktop MVP (Weeks 1-6)
```
/stock-game
├── /src
│   ├── /core          # Pure TypeScript, no UI dependencies
│   │   ├── market.ts      # Price simulation, events
│   │   ├── portfolio.ts   # Holdings, trades, P&L
│   │   ├── orders.ts      # Order types, execution
│   │   ├── missions.ts    # Level definitions, goals
│   │   └── ai.ts          # Bot behaviors
│   ├── /ui            # React components (not ported)
│   │   ├── Dashboard.tsx
│   │   ├── TradeScreen.tsx
│   │   └── ...
│   └── /electron      # Desktop wrapper (not ported)
└── /data
    ├── companies.json     # Ticker data (ported)
    └── events.json        # News cards (ported)
```

### Phase 2: Roblox Port (Weeks 7-10)
- Transpile `/core` modules to Lua using [TypeScriptToLua](https://typescripttolua.github.io/) or manual rewrite
- Rebuild UI in Roblox using ScreenGui and Frames
- Integrate Roblox DataStore for cloud saves
- Add multiplayer: matchmaking, real-time trading rooms

### Data Model (Portable)

```typescript
// Core types - identical in TypeScript and Lua

interface Company {
  ticker: string;
  name: string;
  sector: "tech" | "food" | "health" | "energy";
  basePrice: number;
  volatility: number;  // 0.0 to 1.0
  riskRating: 1 | 2 | 3 | 4;
}

interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
}

interface Portfolio {
  cash: number;
  holdings: Holding[];
  totalValue: number;  // computed
}

interface Order {
  type: "market" | "limit";
  side: "buy" | "sell";
  ticker: string;
  shares: number;
  limitPrice?: number;
  status: "pending" | "filled" | "expired";
}

interface Mission {
  id: string;
  level: number;
  goal: string;
  targetReturn: number;  // e.g., 0.05 for 5%
  maxTurns: number;
  startingCash: number;
}

interface TurnResult {
  priceChanges: Record<string, number>;
  ordersExecuted: Order[];
  eventTriggered?: NewsEvent;
  feedback: string[];
}
```

### Module Boundaries

| Module | Responsibility | Portable? |
|--------|----------------|-----------|
| `market.ts` | Price simulation, volatility | ✅ Yes |
| `portfolio.ts` | Holdings, P&L calculations | ✅ Yes |
| `orders.ts` | Order execution logic | ✅ Yes |
| `missions.ts` | Level configs, goal checking | ✅ Yes |
| `ai.ts` | Bot decision-making | ✅ Yes |
| `events.ts` | News card triggering | ✅ Yes |
| `ui/*` | React components | ❌ Rebuild for Roblox |
| `storage.ts` | Local JSON → DataStore | 🔄 Adapter pattern |

---

# Section 9: Safety Plan

## 9.1 Privacy (COPPA Compliance)

| Requirement | Implementation |
|-------------|----------------|
| No personal data collection | No sign-up required for solo play |
| Parental consent for online | Multiplayer locked until parent enables via PIN |
| No persistent identifiers | Local saves use anonymous UUIDs |
| No third-party analytics | No tracking SDKs included |
| Data portability | Export save data as JSON from Parent Dashboard |

## 9.2 Parental Controls

| Control | Default | Options |
|---------|---------|---------|
| Session timer | 30 min | 15/30/60 min or unlimited |
| Daily XP cap | 500 XP | 250/500/1000 or unlimited |
| Advanced levels (6-8) | Locked | Parent can unlock |
| Multiplayer chat | Disabled | Off / Emotes only / Filtered text |
| Multiplayer matching | Disabled | Off / Friends only / Open |

## 9.3 Chat Safety (Roblox Phase)

| Layer | Implementation |
|-------|----------------|
| **Default off** | No chat until parent enables |
| **Tier 1: Emotes only** | Predefined reactions (👍 👎 🤔 🎉) |
| **Tier 2: Canned messages** | "Good trade!" "Nice portfolio!" (30 options) |
| **Tier 3: Filtered text** | Roblox's built-in text filter; additional custom filter for financial terms |

## 9.4 Anti-Harassment

- **No player-to-player trading** (prevents scams)
- **Leaderboards show usernames, not real names**
- **Report button** on all player interactions
- **Automatic cooldown** if reported by 2+ players

## 9.5 No Monetization

| Prohibited | Rationale |
|------------|-----------|
| In-app purchases | Ethical stance; no gambling mechanics |
| Ads | Distracting and potentially inappropriate |
| Loot boxes | Gambling-adjacent; harmful design pattern |
| Pay-to-win XP boosts | Undermines skill-based progression |

**Future consideration**: One-time premium unlock for extra levels (parent-approved purchase only), but not in initial release.

## 9.6 Disclaimers

- Splash screen on every launch: "This is a learning game. It is not financial advice. Real investing involves real risk."
- Parent Dashboard FAQ includes: "This game teaches concepts, not strategies. Before investing real money, consult a financial advisor."

---

# Section 10: Prototype Scope (4-6 Weeks)

## Milestones

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| **Week 1** | Core engine | Market simulation, portfolio tracking, order execution working in console |
| **Week 2** | UI foundation | Dashboard, Trade Screen, basic navigation in Electron |
| **Week 3** | Level 1-2 complete | First two missions playable; Newbie Nancy AI opponent |
| **Week 4** | Level 3-4 + feedback system | Index funds, compound interest; inline tips and badges |
| **Week 5** | Polish + parent dashboard | Session timer, parent PIN, progress tracking |
| **Week 6** | Playtest + iterate | 5+ playtesters; gather feedback; fix top issues |

## Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| **Market simulation** | Prices change each turn within volatility bounds; news events trigger correctly |
| **Trading** | Buy/sell market orders execute; limit orders fill or expire correctly |
| **Level progression** | Level 1 goal achievable in 5-10 turns; Level 2 requires diversification to pass |
| **AI opponent** | Newbie Nancy makes predictable mistakes; post-game explains her errors |
| **Feedback system** | At least 10 unique tip messages; 5 badges earnable |
| **Parent dashboard** | PIN protection works; session timer enforced; progress visible |
| **Accessibility** | Fonts ≥16pt; color-blind palette verified; VoiceOver labels on buttons |

## Playtest Plan

**Participants**: 5-8 kids ages 10-12 (friends/family), plus 2-3 parents

**Method**:
1. **Pre-test quiz** (5 questions): What is a stock? Why do prices change? etc.
2. **Guided play session** (20-30 min): Play Levels 1-2 with observer note-taking
3. **Post-test quiz** (same 5 questions): Measure learning gain
4. **Interview** (10 min): What was fun? What was confusing? Would you play again?

**Success Metrics**:

| Metric | Target | Method |
|--------|--------|--------|
| Learning gain | ≥50% avg score increase pre→post | Quiz scores |
| Engagement | ≥8 min avg session | Timer data |
| Comprehension | ≤2 "I don't understand" moments per session | Observer notes |
| Enjoyment | ≥4/5 on "Would you play again?" | Post-session survey |
| Parent approval | 80% positive on "teaches good habits" | Parent survey |

---

# Section 11: Sample Content

## Level 1: First Trade (Full Turn-by-Turn)

### Mission Briefing
> **Welcome, Investor!**
> 
> Today you'll buy your first stock. A stock is a tiny piece of a company. When the company does well, your stock can grow in value!
> 
> **Your Goal**: Make a 2% profit ($200 on your $10,000) in 10 turns.
> 
> **Tip**: Look for stocks with a green arrow—they've been going up recently!

### Turn 1

**Dashboard**:
- Cash: $10,000
- Holdings: None
- News: "RocketBurger opens 10 new locations! 🍔"

**Player Action**: Buys 100 shares of RKB (RocketBurger) at $35 each
- Cost: $3,500 + $1 fee = $3,501

**Feedback**:
> 🎉 **First Purchase!** You now own 100 shares of RocketBurger. If the price goes up, your shares are worth more. If it goes down, they're worth less. Let's see what happens!

---

### Turn 2

**Dashboard**:
- Cash: $6,499
- Holdings: RKB 100 shares @ $35 (current: $38, +8.6%)
- News: "No major news today."

**Price Update**: RKB rose 8.6% due to yesterday's news

**Player Action**: Holds (no trade)

**Feedback**:
> ✅ **Good patience!** Sometimes the best move is no move. Your RocketBurger shares gained $300 today because of that good news. Holding lets your winners run!

---

### Turn 3

**Dashboard**:
- Cash: $6,499
- Holdings: RKB 100 shares @ $35 (current: $36.50, -4% from yesterday)
- News: "Customers complain about slow service at RocketBurger"

**Price Update**: RKB dropped 4% due to negative news

**Player Action**: Panics and sells 50 shares at $36.50
- Receives: $1,825 - $1 fee = $1,824

**Feedback**:
> ⚠️ **Hmm, selling after a small dip?** The stock is still higher than when you bought it! Sometimes prices go down for a day and bounce back. This is called "volatility." Selling during a dip might mean missing the recovery. Think about why you're selling before you click!

---

### Turn 4-9
(Abbreviated: RKB fluctuates between $34-$40, player practices holding)

---

### Turn 10

**Dashboard**:
- Cash: $8,324
- Holdings: RKB 50 shares @ $35 (current: $41, +17%)
- Total Value: $8,324 + (50 × $41) = $10,374

**Mission Result**: +3.7% profit (goal was +2%)

**End Screen**:
> 🎉 **MISSION COMPLETE!**
> 
> You started with $10,000 and ended with $10,374. That's a +3.7% gain—you beat your goal!
> 
> **What you learned**:
> - A stock is a piece of a company
> - News can make prices go up or down
> - Patience often beats panic selling
> 
> **Badge Earned**: 🎖️ First Trade - You bought your first stock!
> 
> +100 XP

---

## Level 5: News Flash (Full Turn-by-Turn)

### Mission Briefing
> **Breaking News, Big Moves!**
> 
> The market is full of surprises. Earnings reports, new products, and scandals can all move stock prices fast.
> 
> **Your Goal**: Maintain at least +5% profit after surviving 5 news events.
> 
> **New Skill**: Reading news cards to predict what might happen next!

### Turn 1

**Dashboard**:
- Cash: $10,000
- Holdings: None
- News: *None yet*

**Player Action**: Builds diversified portfolio
- Buys 30 shares ZAP @ $150 = $4,500
- Buys 50 shares RKB @ $35 = $1,750
- Buys 40 shares FIT @ $30 = $1,200
- Buys 10 shares MKT @ $205 = $2,050
- Fees: $4
- Remaining cash: $496

**Feedback**:
> 🌟 **Smart diversification!** You spread your money across Tech (ZAP), Food (RKB), Health (FIT), and an index fund (MKT). If one sector has bad news, the others might protect you!

---

### Turn 3

**Dashboard**:
- Total Value: $10,180 (+1.8%)
- News: 📰 **EARNINGS ALERT: ZappyTech reports tomorrow!**

**Tooltip** (on news card):
> "Earnings" means ZappyTech will share how much money they made. If they made more than expected, the stock usually goes UP. If they made less, it usually goes DOWN. Big surprise, big move!

**Player Action**: Holds current positions (deciding to wait and see)

**Feedback**:
> 🤔 **The waiting game.** You chose not to trade before earnings. That's cautious! Some investors sell before earnings to avoid surprise drops. Others hold hoping for good news. There's no perfect answer—just understand the risk.

---

### Turn 4

**Dashboard**:
- News: 📰 **ZappyTech BEATS expectations! New phone is a hit!**
- ZAP price: $150 → $172 (+14.7%)
- Total Value: $10,840 (+8.4%)

**Feedback**:
> 🚀 **Jackpot!** ZappyTech's good earnings made your shares jump 14.7%! Since you only have 30% in ZAP, this is a nice boost without too much risk. If you had put everything in ZAP, you'd have gained more—but what if they MISSED expectations?

---

### Turn 6

**Dashboard**:
- Total Value: $11,020 (+10.2%)
- News: 📰 **SCANDAL: FitFriend caught using customer data without permission!**
- FIT price: $32 → $24 (-25%)

**Player Action**: Considers panic selling FIT

**AI Opponent (Basic Bob) sells all FIT shares**

**Feedback** (if player holds):
> 💪 **Holding through fear.** Yes, FIT dropped 25% on bad news. But you only have 12% of your portfolio in FIT, so your total portfolio only dropped about 3%. Bob just panic-sold at the bottom. Let's see if FIT recovers...

---

### Turn 8

**Dashboard**:
- News: 📰 **FitFriend CEO apologizes, promises changes. Stock recovering.**
- FIT price: $24 → $28 (+16.7%)
- Total Value: $10,950 (+9.5%)

**Feedback**:
> 📈 **Recovery underway!** FitFriend is bouncing back. If you held, you're up from the bottom. Bob sold at $24 and missed the recovery. This is why diversification + patience often beats panic selling!

---

### Turn 10

**Mission Result**: +9.5% (goal was +5%)

**End Screen**:
> 🎉 **MISSION COMPLETE!**
> 
> You survived 5 news events and ended with +9.5%—almost double your goal!
> 
> **What you learned**:
> - Earnings reports can cause big price swings
> - Bad news hurts, but diversification limits damage
> - Panic selling often means selling at the worst time
> - Holding through volatility takes courage but often pays off
> 
> **Badge Earned**: 🎖️ News Navigator - Survived 5+ news events with profit!
> 
> **Why Basic Bob Lost**:
> "Bob sold FitFriend when the scandal hit, locking in a -25% loss. You held through the fear and caught the 16% recovery. Sometimes the right move is to wait."
> 
> +150 XP

---

# Section 12: Appendix

## 12.1 Glossary for Kids (25 Terms)

| Term | Kid-Friendly Definition |
|------|------------------------|
| **Stock** | A tiny piece of a company that you can own. Owning stock makes you a part-owner! |
| **Share** | One unit of stock. "I own 10 shares" means you own 10 pieces. |
| **Ticker** | The short code for a stock, like "ZAP" for ZappyTech. It's like a nickname! |
| **Portfolio** | All the stocks you own, plus your cash. It's your investing backpack! |
| **Buy** | Using money to get stocks. The stock price tells you the cost per share. |
| **Sell** | Trading stocks back for money. You hope to sell for more than you paid! |
| **Price** | How much one share costs right now. Prices go up and down all the time. |
| **Profit** | Money you make! If you sell for more than you paid, that's profit. |
| **Loss** | Money you lose. If you sell for less than you paid, that's a loss. |
| **Bid** | The highest price a buyer will pay right now. |
| **Ask** | The lowest price a seller will accept right now. |
| **Spread** | The gap between bid and ask. This is a small cost of trading. |
| **Market Order** | "Buy (or sell) right now at today's price." Fast but you don't control the price. |
| **Limit Order** | "Only buy if the price drops to my target." You might wait, but you control the price. |
| **Diversification** | Spreading your money across different stocks so one bad day doesn't hurt too much. |
| **Sector** | A group of similar companies, like "Tech" or "Food." |
| **Index Fund / ETF** | A basket of many stocks all together. One share of an ETF is like owning a little of everything! |
| **Volatility** | How jumpy a stock's price is. High volatility = big swings up AND down. |
| **Earnings** | A company's report of how much money they made. Can cause big price moves! |
| **Dividend** | Money the company pays you just for owning the stock. Like a thank-you bonus! |
| **Compound Interest** | When your money earns money, and THAT money earns money. It snowballs! |
| **Risk** | The chance of losing money. Higher risk can mean higher reward—or bigger losses. |
| **Long-term** | Holding for months or years. Usually less stressful than trading every day. |
| **Short-term** | Buying and selling quickly. Can be exciting but also more risky. |
| **Benchmark** | A standard to compare against. "Did I beat the index fund?" |

---

## 12.2 Quick Parent Guide

### What is StockQuest?

StockQuest is an educational game that teaches investing basics through simulated markets. There is **no real money involved**—all trading uses fictional companies and virtual currency.

### What Will My Child Learn?

By completing all levels, your child will understand:
- What stocks, shares, and companies are
- Why prices go up and down
- The power of diversification (not putting all eggs in one basket)
- Compound interest and long-term growth
- How news and events affect markets
- Basic risk management
- Why patience often beats impulsive trading

### Is This Safe?

**Yes.** StockQuest is designed with safety as a priority:
- No real money, no in-app purchases, no ads
- No personal information collected
- Multiplayer chat is **off by default**
- All online features require parental PIN to enable
- Session timers encourage healthy play habits

### How Can I See My Child's Progress?

Access the **Parent Dashboard** using your 4-digit PIN (you'll set this on first launch). There you can see:
- Current level and skills learned
- Total play time and session history
- Enable/disable advanced levels (options, crypto, futures)
- Control multiplayer and chat settings

### Should I Play With My Child?

Absolutely! StockQuest includes "hot-seat" mode for trading turns at the same computer. Playing together creates great conversation opportunities:
- "Why did you buy that stock?"
- "What do you think will happen next?"
- "How does this compare to real investing?"

### Is This Financial Advice?

**No.** StockQuest teaches concepts, not investment strategies. The fictional market is simplified for learning. Before investing real money, your family should consult a licensed financial advisor.

### Contact & Support

- In-app feedback: Settings → Send Feedback
- Help articles: Settings → Help → Parent FAQ
- Email: [placeholder—no real email for prototype]

---

## Document Revision

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 2024 | Initial design document |

---

*End of Game Design Document*
