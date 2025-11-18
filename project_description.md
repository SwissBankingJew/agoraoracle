# PolyMarketAgent - Requirements Specification & Feature Documentation

## Executive Summary

**Application:** Agora Oracle Terminal
**Purpose:** A chat-first prediction market trading platform for Polymarket with AI-powered strategy configuration
**Current Stack:** React + Express.js + TypeScript
**Target Stack:** React + FastAPI
**Design Philosophy:** Bloomberg Terminal-inspired professional trading interface with conversational AI for strategy setup

---

## 1. Core Concept & User Journey

### Primary User Flow
1. **Conversational Setup:** Users describe their trading strategy in natural language via chat interface
2. **AI Configuration:** LLM generates structured trading configuration from natural language
3. **Strategy Selection:** System maps intent to one of three curated strategies
4. **Parameter Tuning:** Users can accept or modify proposed parameters
5. **Market Discovery:** Browse and filter prediction markets
6. **Trade Execution:** Place YES/NO bets with position sizing tools
7. **Portfolio Management:** Track positions, P&L, and strategy performance

### Unique Value Propositions
- **Chat-First Configuration:** No complex forms - just describe what you want
- **Curated Strategies:** Three proven approaches instead of overwhelming options
- **Professional Trading UI:** Bloomberg Terminal aesthetics with information density
- **Gamified Onboarding:** Interactive BTC betting game for waitlist signup
- **Real-Time Intelligence:** Live market insights and signal detection

---

## 2. Feature Requirements

### 2.1 Strategy Configuration System

#### Three Curated Trading Strategies

**1. Go with the Crowd**
- Follow market consensus when confidence is high
- Parameters:
  - `min_probability`: 0.50 to 0.95 (minimum market probability to enter)
  - `min_remaining_time_hours`: 0 to 720 (minimum time before resolution)

**2. Insider Tracker**
- Detect unusual activity patterns suggesting insider knowledge
- Parameters:
  - `confidence_level`: 0 to 100 (minimum confidence threshold)

**3. Buy the Dip**
- Enter positions after significant price drops
- Parameters:
  - `dip_threshold_pct`: 1 to 40 (percentage drop to trigger entry)

#### Configuration Flow Features
- [x] Natural language input processing
- [x] LLM-powered configuration generation (GPT-5 integration)
- [x] Parameter validation and automatic coercion
- [x] Configuration summary cards with inline editing
- [x] User notification of parameter adjustments
- [x] Quick-reply chips for clarifying questions
- [x] Idle prompt after 5 seconds of inactivity
- [x] Session reset capability
- [x] Configuration persistence

### 2.2 Trading Interface

#### Market Discovery Page
- [x] Market list with real-time data
- [x] Advanced filtering:
  - Probability range sliders (0-100%)
  - Volume thresholds
  - Liquidity filters
  - Category selection
  - Status filters (active/resolved)
  - Time to expiry
- [x] Multi-column sorting
- [x] View modes: Grid/Table/Comparison
- [x] Virtual scrolling for performance
- [x] Sparkline price charts
- [x] Market statistics: volume, liquidity, spread
- [x] Z-score and volatility metrics
- [x] Quick trade drawer

#### Market Detail Page
- [x] Multi-timeframe candlestick charts (1H, 4H, 1D, 1W, 1M, All)
- [x] Order book visualization
- [x] Bid/ask spread display
- [x] Kelly Criterion bet sizing calculator:
  - Probability input (p)
  - Edge calculation
  - Optimal stake recommendation
  - Risk presets (Conservative/Balanced/Aggressive)
- [x] Quick trade component (BUY YES/NO)
- [x] Amount presets ($10, $25, $50, $100, custom)
- [x] Open positions for current market
- [x] Order history timeline
- [x] Risk ladder visualization
- [x] Portfolio impact calculator

### 2.3 Portfolio Management

#### Portfolio Dashboard
- [x] Equity curve chart (portfolio value over time)
- [x] Total P&L display (realized + unrealized)
- [x] Returns distribution histogram
- [x] Position breakdown pie chart
- [x] Strategy performance comparison
- [x] Win rate and average return metrics

#### Position Management
- [x] Open positions list with live P&L
- [x] Position details:
  - Entry price (side-specific)
  - Current price
  - Unrealized P&L
  - Time held
  - Market information
- [x] Close position functionality
- [x] Closed positions history
- [x] Trade log with timestamps

### 2.4 AI Market Intelligence

#### Insights Dashboard
- [x] Three insight categories:
  - **Strong Signals:** High-confidence opportunities
  - **Trending Markets:** Momentum-based signals
  - **Dip Opportunities:** Oversold markets
- [x] Time horizon filters (1h, 24h, 7d)
- [x] Confidence gauges for each insight
- [x] Sparkline trend visualizations
- [x] Quick trade buttons from insights
- [x] Starred/favorites system

#### Live AI Panel (Right Sidebar)
- [x] Real-time market insights stream
- [x] Strategy suggestion updates
- [x] Risk alerts and notifications
- [x] Market movement summaries

### 2.5 Real-Time Data Integration

#### Price Streaming
- [x] Binance WebSocket integration for BTC/USDT
- [x] Auto-reconnection with exponential backoff
- [x] 30-second heartbeat pings
- [x] Price history buffer (last 60 updates)
- [x] Ticker bar with scrolling market prices

#### Market Data Simulation (Demo Mode)
- [x] Random walk price simulation (2% volatility/hour)
- [x] Price clamping (0.01 to 0.99)
- [x] Simulated order fills
- [x] Mock market data generation

### 2.6 Gamified Waitlist Experience

#### BTC Betting Game
- [x] UP/DOWN prediction on real BTC prices
- [x] Starting balance: $1000
- [x] Stake presets: $50, $100, $250
- [x] Minimum 3 price updates before settlement
- [x] Win/loss calculation based on actual price movement
- [x] Minute marker tracking on price chart
- [x] Balance and bet history tracking
- [x] Final score submission with email
- [x] LocalStorage persistence
- [x] Blurred background overlay during game

---

## 3. Data Models & API Specifications

### 3.1 Core Entities

#### Strategy Configuration
```typescript
interface ValidatedConfig {
  id: string
  strategy_name: "Go with the Crowd" | "Insider Tracker" | "Buy the Dip"
  confidence: number // 0-1
  strategy_params: StrategyParams
  rationale: string
  coercion_notes?: string[]
  created_at: Date
}
```

#### Order Management
```typescript
interface Order {
  id: string
  marketId: string
  marketTitle: string
  side: "yes" | "no"
  amount: number // stake in dollars
  entryPrice: number // side-specific probability
  status: "pending" | "filled" | "cancelled" | "failed"
  createdAt: Date
  filledAt?: Date
  cancelledAt?: Date
}
```

#### Position Tracking
```typescript
interface Position {
  id: string
  marketId: string
  marketTitle: string
  side: "yes" | "no"
  amount: number
  entryPrice: number // side-specific
  currentPrice: number // always YES probability
  openedAt: Date
  closedAt?: Date
  exitPrice?: number // side-specific at close
  realizedPnl?: number
}
```

### 3.2 API Endpoints

#### Configuration Management
- `POST /api/chat/configure` - Generate config from natural language
- `POST /api/configs` - Save validated configuration
- `GET /api/configs` - Retrieve all configurations

#### Trading Operations
- `POST /api/orders` - Create new order
- `GET /api/orders` - List all orders
- `POST /api/orders/:id/cancel` - Cancel pending order

#### Position Management
- `GET /api/positions` - All positions
- `GET /api/positions/open` - Active positions
- `GET /api/positions/closed` - Resolved positions
- `POST /api/positions/:id/close` - Close position

#### Market Data
- `GET /api/markets` - Market list with filters
- `GET /api/markets/:id` - Market details
- `GET /api/markets/:id/candles` - Price history

#### User Engagement
- `POST /api/waitlist` - Submit waitlist signup

---

## 4. Technical Requirements

### 4.1 Frontend Requirements

#### Technology Stack
- React 18+ with TypeScript
- Vite for bundling
- TanStack Query for server state
- React Hook Form + Zod for forms
- Tailwind CSS for styling
- Radix UI for component primitives
- Recharts for data visualization
- Framer Motion for animations

#### Component Architecture
- Modular component structure
- Custom hooks for business logic
- Responsive design (mobile-first)
- Virtual scrolling for large lists
- Skeleton loading states
- Empty state handling

### 4.2 Backend Requirements (FastAPI Rewrite)

#### Technology Stack
- FastAPI with Python 3.11+
- Pydantic for data validation
- SQLAlchemy for ORM
- PostgreSQL for database
- Alembic for migrations
- WebSocket support for real-time
- OpenAI API for LLM integration

#### Service Architecture
- RESTful API design
- WebSocket endpoints for streaming
- Background task processing
- Rate limiting on LLM calls
- Error handling and logging
- Environment-based configuration

### 4.3 Infrastructure Requirements

#### Database
- PostgreSQL 14+
- Connection pooling
- Read replicas for scaling
- Backup and recovery strategy

#### Real-Time Systems
- WebSocket server for price streaming
- Message queue for async processing
- Redis for caching (optional)

#### Security
- HTTPS enforcement
- API authentication (JWT/OAuth)
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

---

## 5. Design System Requirements

### 5.1 Visual Design

#### Color Palette (Dark Mode)
- Background: `#0a0e14` (deep charcoal)
- Panel backgrounds: `#0d1117` to `#1a1f2e`
- Primary accent: `#06b6d4` (cyan)
- Positive/gains: `#f59e0b` (amber)
- Negative/losses: `#ef4444` (red)
- Text primary: `#f9fafb`
- Text muted: `#6b7280`

#### Typography
- UI labels: Inter (sans-serif)
- Numerical data: JetBrains Mono (monospace)
- Size hierarchy: text-xs to text-3xl
- Uppercase for labels and headers

#### Layout Principles
- Information density prioritized
- Tight spacing (p-3, p-4)
- Minimal rounded corners
- 1px subtle borders
- No shadows or elevation
- Monospace for all numbers

### 5.2 Interaction Design

#### Animations
- Smooth transitions (200ms)
- Data flash on update
- No hover effects or lifts
- Skeleton loading states
- Progress indicators

#### Accessibility
- WCAG AAA contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Error state clarity
- Color-blind safe indicators

---

## 6. Performance Requirements

### 6.1 Frontend Performance
- Initial load: < 3 seconds
- Time to interactive: < 5 seconds
- Virtual scrolling for lists > 100 items
- Code splitting by route
- Image optimization
- Bundle size < 500KB gzipped

### 6.2 Backend Performance
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- Database query time: < 50ms
- LLM response: < 5 seconds
- Concurrent users: 1000+

### 6.3 Real-Time Requirements
- Price update frequency: 1Hz minimum
- Position P&L updates: Real-time
- Order execution: < 1 second
- WebSocket reconnection: Automatic
- Data consistency: Eventual

---

## 7. Integration Requirements

### 7.1 External Services

#### LLM Integration
- Provider: OpenAI API (GPT-4/5)
- Response format: JSON mode
- Token limits: 8192 completion tokens
- Rate limiting: 100 requests/minute
- Fallback handling

#### Market Data Providers
- Binance WebSocket for crypto prices
- Polymarket API for prediction markets
- Historical data endpoints
- Order book data access

### 7.2 Authentication & Authorization
- OAuth 2.0 for user login
- API key management
- Session persistence
- Role-based access control
- Multi-factor authentication (optional)

---

## 8. Testing Requirements

### 8.1 Test Coverage
- Unit tests: 80% coverage minimum
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing
- Load testing

### 8.2 Quality Assurance
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Pre-commit hooks
- CI/CD pipeline

---

## 9. Deployment Requirements

### 9.1 Environment Configuration
- Development, staging, production environments
- Environment variable management
- Secret storage (API keys, tokens)
- Configuration validation

### 9.2 Monitoring & Logging
- Application performance monitoring
- Error tracking (Sentry or similar)
- Structured logging
- Metrics collection
- Alerting system

### 9.3 Scaling Strategy
- Horizontal scaling for API servers
- Database connection pooling
- CDN for static assets
- Load balancing
- Auto-scaling policies

---

## 10. Migration Strategy

### 10.1 Data Migration
- Export existing configurations
- Preserve order history
- Maintain position records
- Transfer user preferences

### 10.2 Feature Parity Checklist
- [ ] Chat configuration system
- [ ] Three strategy types with parameters
- [ ] Market discovery with filters
- [ ] Trading interface with bet sizing
- [ ] Portfolio tracking
- [ ] Real-time price streaming
- [ ] Gamified waitlist
- [ ] AI insights dashboard

### 10.3 Rollout Plan
1. **Phase 1:** Core trading functionality
2. **Phase 2:** AI configuration system
3. **Phase 3:** Real-time features
4. **Phase 4:** Advanced analytics
5. **Phase 5:** Performance optimization

---

## 11. Future Enhancements (Post-MVP)

### 11.1 Advanced Features
- Backtesting engine
- Strategy optimization
- Multi-strategy deployment
- Automated trading bots
- Social features (leaderboards, copying)
- Mobile application
- API for third-party integrations

### 11.2 Analytics Enhancements
- Advanced risk metrics (Sharpe, Sortino)
- Attribution analysis
- Market correlation studies
- Sentiment analysis integration
- News event correlation

### 11.3 Platform Expansions
- Multiple prediction market support
- Crypto trading integration
- Traditional markets connection
- Cross-market arbitrage tools

---

## 12. Success Metrics

### 12.1 User Engagement
- Daily active users
- Configuration creation rate
- Trade execution rate
- Average session duration
- Return user rate

### 12.2 Trading Performance
- Average user P&L
- Win rate by strategy
- Risk-adjusted returns
- Portfolio volatility
- Maximum drawdown

### 12.3 Technical Metrics
- System uptime (99.9% target)
- API response times
- Error rates
- WebSocket connection stability
- Database performance

---

## Appendix A: Component Inventory

### Core Components (35+)
- AppSidebar
- TickerBar
- ChatMessage
- ChatComposer
- ConfigSummaryCard
- ParameterChip
- QuickTrade
- BetSizer
- MarketTradingChart
- MarketOrderBook
- OpenPositions
- PortfolioImpact
- RiskLadder
- InsightCard
- WaitlistOverlay
- (See Section 5.2 in exploration for complete list)

### UI Library Components (Radix-based)
- Form controls (Input, Select, Slider, etc.)
- Display components (Card, Badge, Alert, etc.)
- Overlays (Dialog, Drawer, Tooltip, etc.)
- Navigation (Tabs, Breadcrumb, etc.)

---

## Appendix B: Database Schema

### Tables Required
- users
- configurations
- orders
- positions
- trades
- markets
- market_candles
- waitlist_signups
- chat_messages
- insights

### Relationships
- User -> Configurations (1:many)
- User -> Orders (1:many)
- Order -> Position (1:1)
- Position -> Trades (1:many)
- Market -> Orders (1:many)
- Market -> Candles (1:many)

---

## Conclusion

This requirements specification captures the complete feature set of the PolyMarketAgent application based on the Replit prototype. The rewrite in React + FastAPI should maintain feature parity while improving:

1. **Code Quality:** Production-ready architecture
2. **Performance:** Optimized for scale
3. **Security:** Proper authentication and validation
4. **Maintainability:** Clean separation of concerns
5. **Reliability:** Error handling and monitoring

The chat-first approach to trading strategy configuration combined with professional Bloomberg Terminal aesthetics creates a unique user experience that should be preserved in the rewrite.