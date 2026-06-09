# Finbot — Feature Ideas (Non-Chat)

> These ideas enhance Finbot's **analytics, UX, and portfolio intelligence** without modifying the existing chatbot pipeline.

---

## 1. 📊 Watchlist + Screener Engine

**What:** A dedicated stock watchlist with a custom screener that lets users filter NSE stocks by technical and fundamental criteria.

**Why:** Currently Finbot has `market/search` and `market/quote` but no way to track stocks you *don't* own. Users want to watch before they buy.

### Features
- **Watchlist CRUD** — add/remove symbols to a personal watchlist (new `Watchlist` model)
- **Real-time mini-cards** — each watchlist item shows live price, day change %, 52-week range sparkline
- **Custom screener filters** — RSI range, PE ratio, market cap bucket, sector, dividend yield, volume surge
- **Screener presets** — "Oversold Large Caps", "High Dividend Yield", "Momentum Breakouts"
- **Watchlist alerts** — tie into existing `PriceAlert` system: one-click "alert me when this breaks ₹X"

### Backend
```
POST   /api/v1/watchlist              — add symbol
GET    /api/v1/watchlist              — list user's watchlist with live prices
DELETE /api/v1/watchlist/{symbol}     — remove symbol
GET    /api/v1/screener?rsi_max=30&sector=IT&min_mcap=10000  — filtered search
```

### Frontend
- New `/dashboard/watchlist` page with a responsive card grid
- Screener panel with filter chips and instant results
- "Add to Portfolio" shortcut from watchlist

### Effort: ~1.5 weeks

---

## 2. 📈 Interactive Charting Page (TradingView-style)

**What:** A full-screen, interactive stock chart page with candlesticks, overlays (EMA/BB/MACD), and drawing tools — powered by [Lightweight Charts](https://github.com/nicehash/lightweight-charts) or TradingView widget.

**Why:** The quant page shows raw indicator numbers, but users can't *see* the chart. A visual chart is the #1 thing traders expect.

### Features
- **Candlestick + line + area chart modes**
- **Overlay toggles** — EMA 50/200, Bollinger Bands, volume bars
- **Indicator sub-panels** — RSI, MACD, Volume Surge (data already exists in `get_technical_indicators`)
- **Time range selector** — 1D, 1W, 1M, 3M, 1Y, 5Y
- **Compare mode** — overlay NIFTY50 or another stock for relative performance
- **Annotations** — mark buy/sell dates from portfolio history on the chart

### Backend
```
GET /api/v1/market/ohlcv/{symbol}?period=1y&interval=1d  — OHLCV data via yfinance
```
One new endpoint returning `[{date, open, high, low, close, volume}]`.

### Frontend
- New `/dashboard/chart/{symbol}` page
- Use `lightweight-charts` (MIT, 40KB) or embed TradingView widget
- Dark theme chart with custom Finbot color palette

### Effort: ~1 week

---

## 3. 🏦 SIP & Goal-Based Investment Tracker

**What:** Let users define financial goals (e.g., "₹50L for house down payment in 5 years") and track SIP contributions against those goals.

**Why:** The `/dashboard/goals` page exists but goals aren't persisted or connected to actual portfolio data. Making this real adds long-term engagement.

### Features
- **Goal creation** — name, target amount, target date, monthly SIP, expected return rate
- **Progress tracking** — compute projected corpus using compound growth formula
- **Goal-portfolio linking** — optionally tag holdings to a goal ("these 3 stocks are for my retirement fund")
- **SIP log** — record monthly contributions, track consistency
- **Visual progress** — radial progress gauge + projected vs. actual growth line chart
- **Shortfall alerts** — "You need to increase SIP by ₹3,000/month to hit your target"

### Backend
```
Model: Goal (id, user_id, name, target_amount, target_date, monthly_sip, expected_return, linked_holdings[], created_at)
Model: SIPEntry (id, goal_id, amount, date, notes)

POST   /api/v1/goals           — create goal
GET    /api/v1/goals           — list goals with projections
PUT    /api/v1/goals/{id}      — update goal
POST   /api/v1/goals/{id}/sip  — log SIP contribution
GET    /api/v1/goals/{id}/projection — compute projected vs actual
```

### Frontend
- Revamp `/dashboard/goals` with real data
- Goal cards with radial progress + "on track" / "behind" badges
- SIP contribution calendar heatmap

### Effort: ~2 weeks

---

## 4. 📰 Market Pulse Dashboard (News + Sentiment)

**What:** A market overview page aggregating sector heatmaps, trending news, and sentiment scores — essentially a "Bloomberg Terminal Lite" homepage.

**Why:** Finbot has `market/news/{symbol}` but no aggregate market view. Users open Finbot and immediately want to know "what's happening today?"

### Features
- **Sector heatmap** — treemap of NIFTY sectors colored by daily % change (green/red)
- **Top gainers / losers** — top 5 NSE movers (from EQUITY_L.csv + live prices)
- **Trending news feed** — aggregate headlines from Indian Stock API for user's holdings + watchlist
- **Sentiment badge per stock** — simple positive/neutral/negative from news keywords or Groq one-shot classification
- **Market breadth** — advances vs. declines ratio
- **FII/DII flow indicator** — if data available from API

### Backend
```
GET /api/v1/market/pulse       — aggregated market overview (cached 5 min)
GET /api/v1/market/movers      — top gainers/losers from NSE
GET /api/v1/market/sentiment/{symbol}  — sentiment score from recent news
```

### Frontend
- New `/dashboard/pulse` page (or make it the new dashboard landing)
- Treemap chart using D3.js or recharts
- Auto-refresh every 60 seconds during market hours

### Effort: ~1.5 weeks

---

## 5. 📱 Portfolio Snapshot & PDF Report Generator

**What:** Generate a downloadable PDF report summarizing portfolio performance, allocation, risk metrics, and recommendations.

**Why:** Users want to share their portfolio analysis with advisors or save monthly snapshots. A "Download Report" button is a premium feature that adds perceived value.

### Features
- **Monthly snapshot** — one-click PDF with:
  - Holdings table with current value, P&L, weight
  - Allocation pie chart (by sector, by stock)
  - Risk analysis summary (from existing `/quant/risk-analysis`)
  - Performance vs NIFTY50 chart (from existing `/quant/backtest`)
  - Tax harvest opportunities (from existing `/quant/tax-harvest`)
  - Rebalance suggestions (from existing `/quant/analyze`)
- **Branding** — Finbot logo, user name, generation date
- **Email delivery** — optionally email the PDF (future scope)
- **Historical snapshots** — store generated reports for month-over-month comparison

### Backend
```
POST /api/v1/reports/generate   — generate PDF, return download URL
GET  /api/v1/reports            — list past reports
GET  /api/v1/reports/{id}/download — download PDF

# Use: reportlab or weasyprint for PDF generation
```

### Frontend
- "Download Report" button on dashboard and quant pages
- Report preview modal before download
- Reports history page

### Effort: ~1.5 weeks

---

## 6. 🔔 Smart Notification System + Daily Digest

**What:** Upgrade the basic price alerts into a full notification system with daily email/in-app digests.

**Why:** Current alerts are poll-based (`/alerts/check`) — the user has to manually trigger checks. A proactive system keeps users engaged.

### Features
- **Background alert checker** — APScheduler or Celery beat job running every 5 minutes during market hours (9:15 AM - 3:30 PM IST)
- **Notification types:**
  - Price alert triggered ✅
  - Portfolio daily P&L summary
  - Stock hitting 52-week high/low
  - Unusual volume surge on a holding
  - Rebalance due (drift > 5% from target weights)
  - Tax harvest opportunity detected
- **In-app notification center** — bell icon in sidebar with unread count + dropdown
- **Daily digest email** — morning brief at 9:00 AM with market outlook + portfolio snapshot
- **Notification preferences** — user can toggle which types they want

### Backend
```
Model: Notification (id, user_id, type, title, body, is_read, created_at)

GET  /api/v1/notifications           — list notifications (paginated)
POST /api/v1/notifications/{id}/read — mark as read
POST /api/v1/notifications/read-all  — mark all as read

# Background worker: check_alerts_job() runs on schedule
# Email: SendGrid / Resend integration for daily digest
```

### Frontend
- Bell icon in Sidebar.tsx with animated unread badge
- Notification dropdown panel with type-colored icons
- Settings page for notification preferences

### Effort: ~2 weeks

---

## 7. 🧪 Strategy Backtester (Custom Strategies)

**What:** Let users define simple trading strategies (e.g., "Buy when RSI < 30, Sell when RSI > 70") and backtest them against historical data.

**Why:** The existing `/quant/backtest` only compares portfolio vs. NIFTY50. A strategy backtester lets power users experiment with trading ideas.

### Features
- **Strategy builder UI** — drag-and-drop or form-based:
  - Entry condition: RSI < 30 AND price > EMA_200
  - Exit condition: RSI > 70 OR stop-loss 5%
  - Position sizing: fixed ₹ amount or % of capital
- **Backtest engine** — run strategy on 1-5 years of OHLCV data
- **Results dashboard:**
  - Equity curve chart
  - Trade log table (entry/exit dates, P&L per trade)
  - Key metrics: Total return, Max drawdown, Sharpe, Win rate, Avg holding period
  - Comparison vs. buy-and-hold
- **Save & share strategies** — name your strategies and compare them

### Backend
```
POST /api/v1/backtest/strategy  — run a custom strategy backtest
Body: {
  symbol: "RELIANCE.NS",
  period: "3y",
  entry_conditions: [{indicator: "RSI", operator: "<", value: 30}],
  exit_conditions: [{indicator: "RSI", operator: ">", value: 70}],
  position_size: 100000,
  stop_loss_pct: 5
}

# Engine: iterate over historical OHLCV, apply conditions, simulate trades
# Already have: QuantPipeline + compute_technical_features()
```

### Frontend
- New `/dashboard/backtest` page
- Strategy builder form with condition rows
- Interactive equity curve chart + trade markers
- Results summary cards

### Effort: ~2.5 weeks

---

## 8. 🎨 Dashboard UX Overhaul — Premium Dark Theme

**What:** Redesign the dashboard with a modern glassmorphism dark theme, animated transitions, and a more information-dense layout.

**Why:** First impressions matter. A premium-looking dashboard builds user trust for a financial app. The current UI functional but could feel more polished.

### Features
- **Dark mode first** — deep navy/charcoal base with accent gradients (teal → purple)
- **Glassmorphism cards** — frosted glass effect on portfolio cards, stats widgets
- **Micro-animations:**
  - Number count-up animations for portfolio value, P&L
  - Smooth chart transitions on time range change
  - Skeleton loading states
  - Subtle hover effects on all interactive elements
- **Information density:**
  - Portfolio summary strip at the top (total value, day change, best/worst performer)
  - Inline sparklines next to each holding row
  - At-a-glance risk badge (from existing risk analysis)
- **Responsive grid** — works on mobile, tablet, desktop
- **Typography upgrade** — Inter or DM Sans from Google Fonts
- **Favicon + OG meta** — proper branding for shared links

### Implementation
- Update `globals.css` with CSS custom properties design system
- Create reusable UI primitives (Card, Badge, StatWidget, Sparkline)
- Refactor `/dashboard/page.tsx` layout
- Add `framer-motion` for animations (already in Next.js ecosystem)

### Effort: ~1.5 weeks

---

## Priority Matrix

| # | Idea | Impact | Effort | Recommendation |
|---|------|--------|--------|----------------|
| 1 | Watchlist + Screener | 🔥🔥🔥 | Medium | **Do first** — fills biggest feature gap |
| 2 | Interactive Charts | 🔥🔥🔥 | Low | **Do first** — biggest visual impact, easy win |
| 3 | SIP & Goals Tracker | 🔥🔥 | Medium | Phase 2 — engagement feature |
| 4 | Market Pulse Dashboard | 🔥🔥🔥 | Medium | **Do first** — great landing page |
| 5 | PDF Reports | 🔥🔥 | Medium | Phase 2 — premium feel |
| 6 | Smart Notifications | 🔥🔥 | Medium-High | Phase 2 — requires background workers |
| 7 | Strategy Backtester | 🔥🔥 | High | Phase 3 — power user feature |
| 8 | Dashboard UX Overhaul | 🔥🔥🔥 | Medium | **Do alongside** any feature work |

### Suggested Build Order
1. **Interactive Charts** (#2) — quick win, high impact
2. **Dashboard UX Overhaul** (#8) — do alongside charts
3. **Market Pulse** (#4) — makes the app feel alive
4. **Watchlist + Screener** (#1) — core feature gap
5. **SIP & Goals** (#3) / **PDF Reports** (#5) — engagement + premium
6. **Smart Notifications** (#6) — retention loop
7. **Strategy Backtester** (#7) — power users
