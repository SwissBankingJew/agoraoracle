# PolyMarketAgent - Data Flow & System Architecture

This document describes the complete data flow, system architecture, and component interactions in the PolyMarketAgent application.

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│  Pages           │  Components      │  Hooks         │  Utils   │
│  - Home          │  - Chat UI       │  - useWebSocket│  - API   │
│  - Markets       │  - Trading       │  - useGame     │  - Format│
│  - Portfolio     │  - Charts        │  - useQuery    │  - Calc  │
│  - Insights      │  - Waitlist      │                │          │
└──────────┬──────────────┬───────────────┬─────────────┬────────┘
           │              │               │             │
           │   HTTP API   │   WebSocket   │   External  │
           │              │               │   Services  │
┌──────────▼──────────────▼───────────────▼─────────────▼────────┐
│                      SERVER (Express + TypeScript)               │
├─────────────────────────────────────────────────────────────────┤
│  Routes          │  Services        │  Storage       │  WS      │
│  - /api/configs  │  - LLM Assistant │  - In-Memory   │  Server  │
│  - /api/orders   │  - Validator     │  - PostgreSQL  │          │
│  - /api/markets  │  - Price Sim     │  (planned)     │          │
└──────────┬──────────────┬───────────────┬─────────────┬────────┘
           │              │               │             │
           ▼              ▼               ▼             ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
    │  OpenAI  │   │ Binance  │   │PostgreSQL│  │Polymarket│
    │  GPT-5   │   │WebSocket │   │    DB    │  │   API    │
    └──────────┘   └──────────┘   └──────────┘  └──────────┘
```

### 1.2 Component Dependencies

```
Frontend Dependencies:
├── React 18.3 (UI Framework)
├── TypeScript 5.6 (Type Safety)
├── Vite 5.4 (Build Tool)
├── TanStack Query 5.60 (Server State)
├── React Hook Form 7.54 (Forms)
├── Zod 3.24 (Validation)
├── Tailwind CSS 3.4 (Styling)
├── Radix UI (Component Primitives)
├── Recharts 2.15 (Charts)
└── Framer Motion 11.13 (Animations)

Backend Dependencies:
├── Express 4.21 (Web Framework)
├── TypeScript 5.6 (Type Safety)
├── OpenAI 6.7 (LLM Integration)
├── WebSocket (ws) 8.18 (Real-time)
├── Drizzle ORM 0.39 (Database)
├── Zod 3.24 (Validation)
└── Passport 0.7 (Auth - future)
```

---

## 2. Core Data Flows

### 2.1 Strategy Configuration Flow

```
User Journey: Natural Language → AI Config → Validation → Storage

[User Input]
    │
    ▼
"I want to follow the crowd on high-confidence markets"
    │
    ▼
[Chat Interface] ──────► [POST /api/chat/configure]
    │                            │
    │                            ▼
    │                    [LLM Service (GPT-5)]
    │                            │
    │                            ▼
    │                    {ConfigProposal JSON}
    │                            │
    │                            ▼
    │                    [Validation Service]
    │                            │
    │                            ▼
    │                    [Parameter Coercion]
    │                            │
    ◄────────────────────── {ValidatedConfig}
    │
    ▼
[Config Summary Card]
    │
    ├── [Accept] ──────► [POST /api/configs] ──► [Storage]
    │
    └── [Modify] ──────► [Inline Edit] ──► [Revalidate]
```

#### Data Structures in Flow:

```typescript
// 1. User Message
{
  message: "I want to follow the crowd on high-confidence markets"
}

// 2. LLM Prompt (System + User)
{
  system: "You are a trading strategy configurator...",
  user: "I want to follow the crowd on high-confidence markets"
}

// 3. LLM Response (ConfigProposal)
{
  strategy_name: "Go with the Crowd",
  confidence: 0.85,
  strategy_params: {
    min_probability: 0.75,
    min_remaining_time_hours: 24
  },
  rationale: "Based on your preference for high-confidence markets...",
  open_questions: ["What's your risk tolerance?"]
}

// 4. After Validation & Coercion
{
  id: "uuid-123",
  strategy_name: "Go with the Crowd",
  confidence: 0.85,
  strategy_params: {
    min_probability: 0.75,  // May be coerced
    min_remaining_time_hours: 24
  },
  rationale: "...",
  coercion_notes: ["Adjusted min_probability from 0.98 to 0.95"],
  created_at: "2024-01-01T00:00:00Z"
}
```

### 2.2 Trading Execution Flow

```
Order Placement: Market Selection → Size Calculation → Order → Position

[Market Selection]
    │
    ▼
[Market Detail Page]
    │
    ├── [Kelly Calculator] ──► Optimal Size
    │
    ▼
[Quick Trade Component]
    │
    ├── Side: YES/NO
    ├── Amount: $50
    └── Entry Price: 0.65
    │
    ▼
[POST /api/orders]
    │
    ├── Create Order (status: 'filled')
    ├── Create Position
    └── Create Trade Record
    │
    ▼
[Response]
    │
    ├── Order Confirmation
    └── Position Created
    │
    ▼
[Position Tracking]
    │
    ├── Real-time P&L Updates
    └── WebSocket Price Stream
```

#### Critical Price Handling Logic:

```typescript
// YES Order Example
{
  side: "yes",
  marketPrice: 0.65,  // Current YES probability
  entryPrice: 0.65,   // Stored as YES price
  // If price moves to 0.75:
  unrealizedPnl: ((0.75 - 0.65) / 0.65) * amount  // Positive
}

// NO Order Example
{
  side: "no",
  marketPrice: 0.65,  // Current YES probability
  entryPrice: 0.35,   // Stored as NO price (1 - 0.65)
  // If price moves to 0.75 (NO price = 0.25):
  unrealizedPnl: ((0.25 - 0.35) / 0.35) * amount  // Negative
}
```

### 2.3 Real-Time Price Update Flow

```
Binance WebSocket → Price Updates → UI Components

[Binance WebSocket]
    │
    ▼
wss://stream.binance.com:9443/ws/btcusdt@miniTicker
    │
    ▼
[useBinanceWebSocket Hook]
    │
    ├── Connection Management
    ├── Heartbeat (30s)
    ├── Reconnection Logic
    └── Price History Buffer
    │
    ▼
[Price Update Event]
    │
    ├──► [Ticker Bar] ──► Scrolling Display
    ├──► [Waitlist Game] ──► Bet Settlement
    └──► [Price Charts] ──► Visual Update
```

#### WebSocket Message Flow:

```javascript
// 1. Connection
→ { "method": "SUBSCRIBE", "params": ["btcusdt@miniTicker"] }
← { "result": null, "id": 1 }

// 2. Price Updates (continuous)
← {
    "e": "24hrMiniTicker",
    "E": 1672531200000,
    "s": "BTCUSDT",
    "c": "42150.50",    // Current price
    "o": "41900.00",    // 24h open
    "h": "42500.00",    // 24h high
    "l": "41500.00",    // 24h low
    "v": "1234.5678"    // Volume
  }

// 3. Heartbeat
→ { "method": "ping" }
← { "method": "pong" }
```

### 2.4 Portfolio Analytics Flow

```
Position Data → Aggregation → Calculations → Visualization

[All Positions]
    │
    ├── Open Positions ──► Unrealized P&L
    └── Closed Positions ──► Realized P&L
    │
    ▼
[Analytics Engine]
    │
    ├── Equity Curve Calculation
    ├── Returns Distribution
    ├── Risk Metrics (Sharpe, Drawdown)
    └── Strategy Performance
    │
    ▼
[Portfolio Dashboard]
    │
    ├── Charts (Recharts)
    ├── Metrics Cards
    └── Position Table
```

#### Portfolio Calculations:

```typescript
// Equity Curve Generation
const generateEquityCurve = (positions: Position[]) => {
  const events = positions
    .flatMap(p => [
      { date: p.openedAt, amount: -p.amount, type: 'open' },
      p.closedAt ? {
        date: p.closedAt,
        amount: p.amount + p.realizedPnl,
        type: 'close'
      } : null
    ])
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  let balance = 10000;
  return events.map(e => {
    balance += e.amount;
    return { date: e.date, value: balance };
  });
};

// Sharpe Ratio Calculation
const calculateSharpe = (returns: number[]) => {
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce(
    (sum, r) => sum + Math.pow(r - mean, 2), 0
  ) / returns.length;
  const stdDev = Math.sqrt(variance);
  return (mean / stdDev) * Math.sqrt(252); // Annualized
};
```

---

## 3. State Management Patterns

### 3.1 Client-Side State Architecture

```
┌─────────────────────────────────────────────┐
│              React Application              │
├─────────────────────────────────────────────┤
│                                             │
│  Server State (TanStack Query)             │
│  ├── Configs (30s cache)                   │
│  ├── Orders (30s cache)                    │
│  ├── Positions (5s cache, real-time)       │
│  └── Markets (30s cache)                   │
│                                             │
│  Local State (React Hooks)                 │
│  ├── Chat Messages (useState)              │
│  ├── Form Data (React Hook Form)           │
│  ├── UI State (useState)                   │
│  └── WebSocket Connection (custom hook)    │
│                                             │
│  Persistent State (localStorage)           │
│  ├── Game State (waitlist)                 │
│  ├── User Preferences                      │
│  └── Session Data                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.2 Server-Side Storage Patterns

```
Current: In-Memory Storage
├── Map<string, Config>
├── Map<string, Order>
├── Map<string, Position>
├── Map<string, Trade>
└── Map<string, WaitlistSignup>

Target: PostgreSQL with Relations
├── users (1:many → configs, orders)
├── configs (1:many → orders)
├── orders (1:1 → positions)
├── positions (1:many → trades)
├── markets (1:many → orders, candles)
└── waitlist_signups
```

---

## 4. API Request/Response Patterns

### 4.1 Standard Request Flow

```
[Client Component]
    │
    ▼
[API Request Function]
    │
    ├── Add Headers
    ├── JSON Stringify
    └── Error Handling
    │
    ▼
[HTTP Request]
    │
    ▼
[Express Middleware]
    │
    ├── CORS
    ├── Body Parser
    ├── Request Logger
    └── Auth (future)
    │
    ▼
[Route Handler]
    │
    ├── Validation (Zod)
    ├── Business Logic
    └── Storage Operation
    │
    ▼
[Response]
    │
    ├── Success (2xx)
    └── Error (4xx/5xx)
    │
    ▼
[Client Error Handling]
    │
    ├── Toast Notification
    └── UI State Update
```

### 4.2 Error Response Format

```typescript
// Validation Error (400)
{
  error: "Validation failed",
  issues: [
    {
      field: "strategy_params.min_probability",
      message: "Must be between 0.5 and 0.95"
    }
  ]
}

// Not Found (404)
{
  error: "Position not found"
}

// Server Error (500)
{
  error: "Internal server error",
  requestId: "uuid-123"
}
```

---

## 5. WebSocket Communication Protocol

### 5.1 Connection Lifecycle

```
[Client Connects]
    │
    ▼
[WebSocket Handshake]
    │
    ▼
[Server Accepts]
    │
    ├── Send: { type: "connected" }
    └── Add to clients list
    │
    ▼
[Client Subscribe]
    │
    ├── { type: "subscribe", channels: ["prices", "orders"] }
    └── Server adds subscriptions
    │
    ▼
[Bidirectional Communication]
    │
    ├── Server → Client: Price updates
    ├── Server → Client: Order fills
    ├── Client → Server: Heartbeat ping
    └── Server → Client: Heartbeat pong
    │
    ▼
[Connection Close]
    │
    ├── Clean up subscriptions
    └── Remove from clients list
```

### 5.2 Message Types

```typescript
// Price Update
{
  type: "price_update",
  marketId: "market-123",
  price: 0.65,
  timestamp: 1234567890000
}

// Order Fill
{
  type: "order_fill",
  orderId: "order-456",
  filledPrice: 0.65,
  timestamp: 1234567890000
}

// Position Update
{
  type: "position_update",
  positionId: "position-789",
  currentPrice: 0.70,
  unrealizedPnl: 150.50,
  timestamp: 1234567890000
}

// System Message
{
  type: "system",
  message: "Market data temporarily unavailable",
  severity: "warning"
}
```

---

## 6. LLM Integration Architecture

### 6.1 Configuration Generation Pipeline

```
[Natural Language Input]
    │
    ▼
[Preprocessing]
    │
    ├── Trim whitespace
    ├── Length validation
    └── Profanity filter
    │
    ▼
[LLM Request Construction]
    │
    ├── System Prompt (role, constraints)
    ├── User Message
    ├── Response Format (JSON)
    └── Parameters (temperature, tokens)
    │
    ▼
[OpenAI API Call]
    │
    ├── Model: gpt-5
    ├── Max Tokens: 8192
    └── Temperature: 0.7
    │
    ▼
[Response Parsing]
    │
    ├── JSON.parse()
    └── Zod validation
    │
    ▼
[Parameter Validation]
    │
    ├── Range checks
    ├── Type coercion
    └── Generate notes
    │
    ▼
[Return to Client]
```

### 6.2 Prompt Engineering

```typescript
const systemPrompt = `
You are a trading strategy configuration assistant.

AVAILABLE STRATEGIES:
1. "Go with the Crowd": Follow market consensus
   - min_probability: 0.50-0.95
   - min_remaining_time_hours: 0-720

2. "Insider Tracker": Detect unusual activity
   - confidence_level: 0-100

3. "Buy the Dip": Enter after drops
   - dip_threshold_pct: 1-40

INSTRUCTIONS:
- Map user intent to EXACTLY ONE strategy
- Generate valid parameters within ranges
- Provide clear rationale
- Ask clarifying questions if needed
- Return ONLY valid JSON matching schema

OUTPUT SCHEMA:
{
  "strategy_name": "string",
  "confidence": number (0-1),
  "strategy_params": { ... },
  "rationale": "string",
  "open_questions": ["string"]
}
`;
```

---

## 7. Data Synchronization Patterns

### 7.1 Optimistic Updates

```typescript
// Optimistic UI Update Pattern
const placeOrder = async (orderData) => {
  // 1. Optimistically update UI
  queryClient.setQueryData(['orders'], old => [
    ...old,
    { ...orderData, status: 'pending', id: 'temp-' + Date.now() }
  ]);

  try {
    // 2. Make API call
    const response = await api.post('/api/orders', orderData);

    // 3. Update with real data
    queryClient.setQueryData(['orders'], old =>
      old.map(o => o.id.startsWith('temp-') ? response.data : o)
    );
  } catch (error) {
    // 4. Rollback on error
    queryClient.invalidateQueries(['orders']);
    toast.error('Order failed');
  }
};
```

### 7.2 Real-Time Sync

```typescript
// WebSocket + Query Cache Sync
useEffect(() => {
  const ws = new WebSocket(WS_URL);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'price_update':
        // Update specific position in cache
        queryClient.setQueryData(['positions'], old =>
          old.map(p => p.marketId === data.marketId
            ? { ...p, currentPrice: data.price }
            : p
          )
        );
        break;

      case 'order_fill':
        // Invalidate orders to refetch
        queryClient.invalidateQueries(['orders']);
        break;
    }
  };

  return () => ws.close();
}, []);
```

---

## 8. Security & Validation Layers

### 8.1 Input Validation Pipeline

```
[Client Input]
    │
    ▼
[Client-Side Validation]
    │
    ├── React Hook Form
    └── Zod schemas
    │
    ▼
[API Request]
    │
    ▼
[Server-Side Validation]
    │
    ├── Zod schemas
    ├── SQL injection prevention
    └── XSS sanitization
    │
    ▼
[Business Logic Validation]
    │
    ├── Range checks
    ├── Business rules
    └── Consistency checks
    │
    ▼
[Storage]
```

### 8.2 Authentication Flow (Future)

```
[Login Request]
    │
    ▼
[Credential Validation]
    │
    ▼
[Generate JWT]
    │
    ▼
[Set HTTP-Only Cookie]
    │
    ▼
[Protected Routes]
    │
    ├── Verify JWT
    ├── Check Permissions
    └── Proceed or 401
```

---

## 9. Performance Optimization Patterns

### 9.1 Caching Strategy

```
Client-Side Caching:
├── TanStack Query
│   ├── Stale Time: 30s (markets, configs)
│   ├── Stale Time: 5s (positions)
│   └── Background Refetch: enabled
│
├── Memoization
│   ├── useMemo (expensive calculations)
│   └── React.memo (component props)
│
└── Virtual Scrolling
    └── react-window (lists > 100 items)

Server-Side Caching:
├── Price Cache (10s TTL)
├── Market Data (60s TTL)
└── LLM Responses (5min TTL)
```

### 9.2 Bundle Optimization

```
Code Splitting:
├── Routes (lazy loading)
├── Heavy Components (charts, modals)
└── Third-party libraries

Asset Optimization:
├── Image lazy loading
├── WebP format
└── CDN delivery

Bundle Analysis:
├── Tree shaking
├── Dead code elimination
└── Minification
```

---

## 10. Migration Path to Production Architecture

### 10.1 Current vs Target Architecture

```
CURRENT ARCHITECTURE          TARGET ARCHITECTURE

React + Express               React + FastAPI
├── TypeScript                ├── TypeScript (frontend)
├── In-Memory Storage         ├── Python (backend)
├── Single Server             ├── PostgreSQL
├── No Auth                   ├── Microservices
└── Mock Data                 ├── JWT Auth
                              ├── Redis Cache
                              ├── Polymarket API
                              └── Kubernetes

Migration Steps:
1. Database Schema → PostgreSQL
2. Express → FastAPI endpoints
3. Add Authentication layer
4. Implement caching layer
5. Integrate real Polymarket API
6. Add monitoring/logging
7. Containerize services
8. Deploy to cloud (AWS/GCP)
```

### 10.2 Data Migration Strategy

```sql
-- PostgreSQL Schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  strategy_name VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  strategy_params JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  market_id VARCHAR(100),
  side VARCHAR(3) CHECK (side IN ('yes', 'no')),
  amount DECIMAL(10,2),
  entry_price DECIMAL(3,2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  current_price DECIMAL(3,2),
  exit_price DECIMAL(3,2),
  realized_pnl DECIMAL(10,2),
  closed_at TIMESTAMP
);
```

---

## Summary

This architecture documentation provides:

1. **Complete system overview** from client to external services
2. **Detailed data flows** for all major features
3. **State management patterns** for consistency
4. **API communication protocols** and error handling
5. **WebSocket real-time architecture**
6. **LLM integration pipeline** with prompt engineering
7. **Security and validation layers**
8. **Performance optimization strategies**
9. **Clear migration path** to production architecture

The system is designed with:
- **Separation of concerns** between UI, business logic, and data
- **Real-time capabilities** for live market data
- **Scalability** through proper caching and state management
- **User experience** focus with optimistic updates and loading states
- **Extensibility** for future features and integrations

This architecture ensures the React + FastAPI rewrite maintains all functionality while improving performance, security, and maintainability.