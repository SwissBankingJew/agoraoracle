# PolyMarketAgent - API Implementation Reference

This document provides complete implementation details for all API endpoints in the existing Express.js backend, to be recreated in FastAPI.

---

## 1. Server Setup & Middleware

### 1.1 Express Server Configuration
**Location:** `server/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { routes } from './routes';
import { storage } from './storage';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body || req.query);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Apply routes
routes(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 1.2 Storage Interface
**Location:** `server/storage.ts`

```typescript
interface IStorage {
  configs: {
    create(config: ValidatedConfig): ValidatedConfig;
    findAll(): ValidatedConfig[];
    findById(id: string): ValidatedConfig | undefined;
    update(id: string, config: Partial<ValidatedConfig>): ValidatedConfig;
    delete(id: string): boolean;
  };
  orders: {
    create(order: Order): Order;
    findAll(): Order[];
    findById(id: string): Order | undefined;
    update(id: string, order: Partial<Order>): Order;
  };
  positions: {
    create(position: Position): Position;
    findAll(): Position[];
    findById(id: string): Position | undefined;
    update(id: string, position: Partial<Position>): Position;
    findOpen(): Position[];
    findClosed(): Position[];
  };
  trades: {
    create(trade: Trade): Trade;
    findAll(): Trade[];
    findByMarket(marketId: string): Trade[];
  };
  waitlist: {
    create(signup: WaitlistSignup): WaitlistSignup;
    findAll(): WaitlistSignup[];
    exists(email: string): boolean;
  };
}

class MemStorage implements IStorage {
  private configStore = new Map<string, ValidatedConfig>();
  private orderStore = new Map<string, Order>();
  private positionStore = new Map<string, Position>();
  private tradeStore = new Map<string, Trade>();
  private waitlistStore = new Map<string, WaitlistSignup>();

  configs = {
    create: (config: ValidatedConfig) => {
      this.configStore.set(config.id, config);
      return config;
    },
    findAll: () => Array.from(this.configStore.values()),
    findById: (id: string) => this.configStore.get(id),
    update: (id: string, updates: Partial<ValidatedConfig>) => {
      const config = this.configStore.get(id);
      if (!config) throw new Error('Config not found');
      const updated = { ...config, ...updates };
      this.configStore.set(id, updated);
      return updated;
    },
    delete: (id: string) => this.configStore.delete(id)
  };

  orders = {
    create: (order: Order) => {
      this.orderStore.set(order.id, order);
      return order;
    },
    findAll: () => Array.from(this.orderStore.values()),
    findById: (id: string) => this.orderStore.get(id),
    update: (id: string, updates: Partial<Order>) => {
      const order = this.orderStore.get(id);
      if (!order) throw new Error('Order not found');
      const updated = { ...order, ...updates };
      this.orderStore.set(id, updated);
      return updated;
    }
  };

  positions = {
    create: (position: Position) => {
      this.positionStore.set(position.id, position);
      return position;
    },
    findAll: () => Array.from(this.positionStore.values()),
    findById: (id: string) => this.positionStore.get(id),
    update: (id: string, updates: Partial<Position>) => {
      const position = this.positionStore.get(id);
      if (!position) throw new Error('Position not found');
      const updated = { ...position, ...updates };
      this.positionStore.set(id, updated);
      return updated;
    },
    findOpen: () => Array.from(this.positionStore.values())
      .filter(p => !p.closedAt),
    findClosed: () => Array.from(this.positionStore.values())
      .filter(p => p.closedAt)
  };

  trades = {
    create: (trade: Trade) => {
      this.tradeStore.set(trade.id, trade);
      return trade;
    },
    findAll: () => Array.from(this.tradeStore.values()),
    findByMarket: (marketId: string) =>
      Array.from(this.tradeStore.values())
        .filter(t => t.marketId === marketId)
  };

  waitlist = {
    create: (signup: WaitlistSignup) => {
      this.waitlistStore.set(signup.email, signup);
      return signup;
    },
    findAll: () => Array.from(this.waitlistStore.values()),
    exists: (email: string) => this.waitlistStore.has(email)
  };
}

export const storage: IStorage = new MemStorage();
```

---

## 2. Configuration API Endpoints

### 2.1 POST /api/chat/configure
**Purpose:** Generate strategy configuration from natural language

```typescript
app.post('/api/chat/configure', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    // Call LLM service
    const proposal = await generateConfigFromNaturalLanguage(message);

    // Validate and coerce parameters
    const { config, coercionNotes } = validateAndCoerceConfig(proposal);

    res.json({
      proposal: {
        strategy_name: config.strategy_name,
        confidence: config.confidence,
        strategy_params: config.strategy_params,
        rationale: config.rationale,
        open_questions: proposal.open_questions || []
      },
      coercionNotes
    });
  } catch (error) {
    console.error('Configuration generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate configuration',
      details: error.message
    });
  }
});
```

### 2.2 POST /api/configs
**Purpose:** Save accepted configuration

```typescript
app.post('/api/configs', (req, res) => {
  try {
    const configData = insertValidatedConfigSchema.parse(req.body);

    const config: ValidatedConfig = {
      id: crypto.randomUUID(),
      ...configData,
      created_at: new Date()
    };

    const saved = storage.configs.create(config);
    res.status(201).json(saved);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid configuration data',
        issues: error.issues
      });
    }
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});
```

### 2.3 GET /api/configs
**Purpose:** Retrieve all saved configurations

```typescript
app.get('/api/configs', (req, res) => {
  const configs = storage.configs.findAll();

  // Sort by creation date (newest first)
  configs.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json(configs);
});
```

### 2.4 DELETE /api/configs/:id
**Purpose:** Delete a configuration

```typescript
app.delete('/api/configs/:id', (req, res) => {
  const deleted = storage.configs.delete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Configuration not found' });
  }

  res.status(204).send();
});
```

---

## 3. Trading API Endpoints

### 3.1 POST /api/orders
**Purpose:** Create order and auto-create position

```typescript
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);

    // Create order (instantly filled in demo)
    const order: Order = {
      id: crypto.randomUUID(),
      ...orderData,
      status: 'filled',
      createdAt: new Date(),
      filledAt: new Date(),
      cancelledAt: null
    };

    // Get current market price (simulated)
    const currentYesPrice = await getMarketPrice(order.marketId);

    // Create position
    const position: Position = {
      id: crypto.randomUUID(),
      marketId: order.marketId,
      marketTitle: order.marketTitle,
      side: order.side,
      amount: order.amount,
      entryPrice: order.entryPrice, // Side-specific
      currentPrice: currentYesPrice, // Always YES probability
      openedAt: new Date(),
      closedAt: null,
      exitPrice: null,
      realizedPnl: null
    };

    // Save both
    const savedOrder = storage.orders.create(order);
    const savedPosition = storage.positions.create(position);

    // Create trade record
    const trade: Trade = {
      id: crypto.randomUUID(),
      orderId: order.id,
      marketId: order.marketId,
      marketTitle: order.marketTitle,
      side: order.side,
      amount: order.amount,
      entryPrice: order.entryPrice,
      exitPrice: null,
      pnl: 0,
      pnlPercent: 0,
      executedAt: order.filledAt,
      closedAt: null
    };

    storage.trades.create(trade);

    res.status(201).json({
      order: savedOrder,
      position: savedPosition
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid order data',
        issues: error.issues
      });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

### 3.2 GET /api/orders
**Purpose:** Get all orders with optional filters

```typescript
app.get('/api/orders', (req, res) => {
  let orders = storage.orders.findAll();

  // Apply filters
  const { status, marketId, side, limit, offset } = req.query;

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  if (marketId) {
    orders = orders.filter(o => o.marketId === marketId);
  }

  if (side) {
    orders = orders.filter(o => o.side === side);
  }

  // Sort by creation date (newest first)
  orders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Pagination
  const start = parseInt(offset as string) || 0;
  const end = limit ? start + parseInt(limit as string) : undefined;
  const paginated = orders.slice(start, end);

  res.json({
    orders: paginated,
    total: orders.length,
    offset: start,
    limit: limit ? parseInt(limit as string) : orders.length
  });
});
```

### 3.3 POST /api/orders/:id/cancel
**Purpose:** Cancel pending order

```typescript
app.post('/api/orders/:id/cancel', (req, res) => {
  const order = storage.orders.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      error: `Cannot cancel order with status: ${order.status}`
    });
  }

  const updated = storage.orders.update(order.id, {
    status: 'cancelled',
    cancelledAt: new Date()
  });

  res.json(updated);
});
```

---

## 4. Position Management API

### 4.1 GET /api/positions
**Purpose:** Get all positions

```typescript
app.get('/api/positions', (req, res) => {
  const positions = storage.positions.findAll();

  // Enrich with current P&L
  const enrichedPositions = positions.map(position => {
    if (position.closedAt) {
      // Closed position - use realized P&L
      return position;
    }

    // Open position - calculate unrealized P&L
    const currentYesPrice = getMarketPrice(position.marketId);
    let unrealizedPnl;

    if (position.side === 'yes') {
      unrealizedPnl = ((currentYesPrice - position.entryPrice) / position.entryPrice) * position.amount;
    } else {
      const currentNoPrice = 1 - currentYesPrice;
      unrealizedPnl = ((currentNoPrice - position.entryPrice) / position.entryPrice) * position.amount;
    }

    return {
      ...position,
      currentPrice: currentYesPrice,
      unrealizedPnl,
      unrealizedPnlPercent: (unrealizedPnl / position.amount) * 100
    };
  });

  res.json(enrichedPositions);
});
```

### 4.2 GET /api/positions/open
**Purpose:** Get open positions with live P&L

```typescript
app.get('/api/positions/open', (req, res) => {
  const openPositions = storage.positions.findOpen();

  const enrichedPositions = openPositions.map(position => {
    // Simulate price movement
    const currentYesPrice = simulatePrice(position.currentPrice);

    // Update stored price
    storage.positions.update(position.id, {
      currentPrice: currentYesPrice
    });

    // Calculate unrealized P&L
    let unrealizedPnl, currentSidePrice;

    if (position.side === 'yes') {
      currentSidePrice = currentYesPrice;
      unrealizedPnl = ((currentSidePrice - position.entryPrice) / position.entryPrice) * position.amount;
    } else {
      currentSidePrice = 1 - currentYesPrice;
      unrealizedPnl = ((currentSidePrice - position.entryPrice) / position.entryPrice) * position.amount;
    }

    return {
      ...position,
      currentPrice: currentYesPrice,
      currentSidePrice,
      unrealizedPnl,
      unrealizedPnlPercent: (unrealizedPnl / position.amount) * 100,
      duration: Date.now() - new Date(position.openedAt).getTime()
    };
  });

  res.json(enrichedPositions);
});
```

### 4.3 POST /api/positions/:id/close
**Purpose:** Close position and realize P&L

```typescript
app.post('/api/positions/:id/close', (req, res) => {
  const position = storage.positions.findById(req.params.id);

  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }

  if (position.closedAt) {
    return res.status(400).json({ error: 'Position already closed' });
  }

  // Simulate exit price
  const exitYesPrice = simulatePrice(position.currentPrice);
  let exitPrice, realizedPnl;

  if (position.side === 'yes') {
    exitPrice = exitYesPrice;
    realizedPnl = ((exitPrice - position.entryPrice) / position.entryPrice) * position.amount;
  } else {
    exitPrice = 1 - exitYesPrice;
    realizedPnl = ((exitPrice - position.entryPrice) / position.entryPrice) * position.amount;
  }

  // Update position
  const updated = storage.positions.update(position.id, {
    closedAt: new Date(),
    exitPrice,
    realizedPnl,
    currentPrice: exitYesPrice
  });

  // Update associated trade
  const trade = storage.trades.findAll()
    .find(t => t.marketId === position.marketId && t.side === position.side);

  if (trade) {
    storage.trades.update(trade.id, {
      exitPrice,
      pnl: realizedPnl,
      pnlPercent: (realizedPnl / position.amount) * 100,
      closedAt: new Date()
    });
  }

  res.json(updated);
});
```

---

## 5. Market Data API

### 5.1 GET /api/markets
**Purpose:** Get markets with filtering and sorting

```typescript
app.get('/api/markets', (req, res) => {
  // Mock market data generation
  const generateMarkets = () => {
    const categories = ['Politics', 'Sports', 'Crypto', 'Economics', 'Science'];
    const markets = [];

    for (let i = 0; i < 100; i++) {
      markets.push({
        id: `market-${i}`,
        title: `Will ${generateMarketTitle(i)}?`,
        category: categories[i % categories.length],
        probability: 0.3 + Math.random() * 0.4, // 30-70%
        volume: Math.floor(Math.random() * 1000000),
        liquidity: Math.floor(Math.random() * 500000),
        spread: Math.random() * 0.05, // 0-5%
        status: Math.random() > 0.2 ? 'active' : 'resolved',
        expiryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    return markets;
  };

  let markets = generateMarkets();

  // Apply filters
  const {
    category,
    status,
    minProbability,
    maxProbability,
    minVolume,
    minLiquidity,
    sort = 'volume',
    order = 'desc',
    limit = 50,
    offset = 0
  } = req.query;

  if (category) {
    markets = markets.filter(m => m.category === category);
  }

  if (status) {
    markets = markets.filter(m => m.status === status);
  }

  if (minProbability) {
    markets = markets.filter(m => m.probability >= parseFloat(minProbability as string) / 100);
  }

  if (maxProbability) {
    markets = markets.filter(m => m.probability <= parseFloat(maxProbability as string) / 100);
  }

  if (minVolume) {
    markets = markets.filter(m => m.volume >= parseInt(minVolume as string));
  }

  if (minLiquidity) {
    markets = markets.filter(m => m.liquidity >= parseInt(minLiquidity as string));
  }

  // Sort
  markets.sort((a, b) => {
    let comparison = 0;
    switch (sort) {
      case 'probability':
        comparison = a.probability - b.probability;
        break;
      case 'volume':
        comparison = a.volume - b.volume;
        break;
      case 'liquidity':
        comparison = a.liquidity - b.liquidity;
        break;
      case 'expiry':
        comparison = a.expiryDate.getTime() - b.expiryDate.getTime();
        break;
      default:
        comparison = b.volume - a.volume;
    }
    return order === 'desc' ? -comparison : comparison;
  });

  // Paginate
  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  const paginated = markets.slice(start, end);

  res.json({
    markets: paginated,
    total: markets.length,
    offset: start,
    limit: parseInt(limit as string)
  });
});
```

### 5.2 GET /api/markets/:id
**Purpose:** Get single market details

```typescript
app.get('/api/markets/:id', (req, res) => {
  // Generate consistent market data based on ID
  const market = {
    id: req.params.id,
    title: `Will this market resolve YES?`,
    description: 'Detailed description of the market conditions and resolution criteria.',
    category: 'General',
    probability: 0.5 + (parseInt(req.params.id.split('-')[1] || '0') % 40) / 100,
    volume: 500000 + parseInt(req.params.id.split('-')[1] || '0') * 10000,
    liquidity: 250000 + parseInt(req.params.id.split('-')[1] || '0') * 5000,
    spread: 0.02,
    status: 'active',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    resolution_criteria: [
      'Official announcement from relevant authority',
      'Confirmation from multiple reliable sources',
      'Market closes at expiry date'
    ],
    tags: ['trending', 'high-volume'],
    creator: 'market-maker-1',
    yes_holders: Math.floor(Math.random() * 1000),
    no_holders: Math.floor(Math.random() * 1000)
  };

  res.json(market);
});
```

### 5.3 GET /api/markets/:id/candles
**Purpose:** Get price history in candlestick format

```typescript
app.get('/api/markets/:id/candles', (req, res) => {
  const { timeframe = '1H' } = req.query;

  const generateCandles = (timeframe: string) => {
    const periods = {
      '1H': { count: 24, interval: 3600000 },
      '4H': { count: 42, interval: 14400000 },
      '1D': { count: 30, interval: 86400000 },
      '1W': { count: 12, interval: 604800000 },
      '1M': { count: 12, interval: 2592000000 },
      'All': { count: 100, interval: 86400000 }
    };

    const { count, interval } = periods[timeframe] || periods['1H'];
    const candles = [];
    const now = Date.now();

    for (let i = count - 1; i >= 0; i--) {
      const timestamp = Math.floor((now - i * interval) / 1000);
      const basePrice = 0.5 + Math.sin(i / 10) * 0.2;
      const volatility = 0.05;

      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;

      candles.push({
        timestamp,
        open: Math.max(0.01, Math.min(0.99, open)),
        high: Math.max(0.01, Math.min(0.99, high)),
        low: Math.max(0.01, Math.min(0.99, low)),
        close: Math.max(0.01, Math.min(0.99, close)),
        volume: Math.floor(10000 + Math.random() * 90000)
      });
    }

    return candles;
  };

  const candles = generateCandles(timeframe as string);

  res.json({
    marketId: req.params.id,
    timeframe,
    candles,
    fetchedAt: Date.now()
  });
});
```

### 5.4 GET /api/markets/:id/orderbook
**Purpose:** Get order book depth

```typescript
app.get('/api/markets/:id/orderbook', (req, res) => {
  const generateOrderBook = () => {
    const levels = 10;
    const bids = [];
    const asks = [];
    const midPrice = 0.5 + (Math.random() - 0.5) * 0.4;

    // Generate bids (buy orders)
    for (let i = 0; i < levels; i++) {
      const price = midPrice - (i + 1) * 0.01;
      bids.push({
        price: Math.max(0.01, price),
        amount: Math.floor(100 + Math.random() * 900),
        total: 0 // Will be calculated
      });
    }

    // Generate asks (sell orders)
    for (let i = 0; i < levels; i++) {
      const price = midPrice + (i + 1) * 0.01;
      asks.push({
        price: Math.min(0.99, price),
        amount: Math.floor(100 + Math.random() * 900),
        total: 0
      });
    }

    // Calculate cumulative totals
    let bidTotal = 0;
    bids.forEach(bid => {
      bidTotal += bid.amount;
      bid.total = bidTotal;
    });

    let askTotal = 0;
    asks.forEach(ask => {
      askTotal += ask.amount;
      ask.total = askTotal;
    });

    return { bids, asks, midPrice };
  };

  const orderbook = generateOrderBook();

  res.json({
    marketId: req.params.id,
    ...orderbook,
    spread: orderbook.asks[0].price - orderbook.bids[0].price,
    timestamp: Date.now()
  });
});
```

---

## 6. Analytics API

### 6.1 GET /api/trades
**Purpose:** Get all trades with optional filters

```typescript
app.get('/api/trades', (req, res) => {
  let trades = storage.trades.findAll();

  const { marketId, side, status, limit = 50, offset = 0 } = req.query;

  if (marketId) {
    trades = trades.filter(t => t.marketId === marketId);
  }

  if (side) {
    trades = trades.filter(t => t.side === side);
  }

  if (status === 'closed') {
    trades = trades.filter(t => t.closedAt !== null);
  } else if (status === 'open') {
    trades = trades.filter(t => t.closedAt === null);
  }

  // Sort by execution date (newest first)
  trades.sort((a, b) =>
    new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
  );

  // Calculate summary statistics
  const closedTrades = trades.filter(t => t.closedAt);
  const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const losingTrades = closedTrades.filter(t => t.pnl < 0);

  const stats = {
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: trades.length - closedTrades.length,
    totalPnl,
    winRate: closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0,
    avgWin: winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0,
    avgLoss: losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0
  };

  // Paginate
  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  const paginated = trades.slice(start, end);

  res.json({
    trades: paginated,
    stats,
    total: trades.length,
    offset: start,
    limit: parseInt(limit as string)
  });
});
```

### 6.2 GET /api/analytics/portfolio
**Purpose:** Get portfolio analytics

```typescript
app.get('/api/analytics/portfolio', (req, res) => {
  const positions = storage.positions.findAll();
  const trades = storage.trades.findAll();

  // Calculate equity curve
  const equityCurve = [];
  const startingBalance = 10000;
  let currentBalance = startingBalance;

  // Sort all events by date
  const events = [
    ...positions.map(p => ({
      date: p.openedAt,
      type: 'open',
      amount: -p.amount,
      position: p
    })),
    ...positions.filter(p => p.closedAt).map(p => ({
      date: p.closedAt,
      type: 'close',
      amount: p.amount + (p.realizedPnl || 0),
      position: p
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  events.forEach(event => {
    currentBalance += event.amount;
    equityCurve.push({
      date: event.date,
      value: currentBalance,
      type: event.type
    });
  });

  // Calculate returns distribution
  const returns = positions
    .filter(p => p.closedAt && p.realizedPnl !== null)
    .map(p => (p.realizedPnl / p.amount) * 100);

  const returnsBuckets = {
    'loss_large': returns.filter(r => r < -20).length,
    'loss_medium': returns.filter(r => r >= -20 && r < -5).length,
    'loss_small': returns.filter(r => r >= -5 && r < 0).length,
    'gain_small': returns.filter(r => r >= 0 && r < 5).length,
    'gain_medium': returns.filter(r => r >= 5 && r < 20).length,
    'gain_large': returns.filter(r => r >= 20).length
  };

  // Position breakdown by market
  const marketBreakdown = {};
  positions.forEach(p => {
    if (!marketBreakdown[p.marketId]) {
      marketBreakdown[p.marketId] = {
        marketId: p.marketId,
        marketTitle: p.marketTitle,
        count: 0,
        invested: 0,
        pnl: 0
      };
    }
    marketBreakdown[p.marketId].count++;
    marketBreakdown[p.marketId].invested += p.amount;
    marketBreakdown[p.marketId].pnl += p.realizedPnl || 0;
  });

  // Calculate risk metrics
  const calculateSharpeRatio = () => {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  };

  const calculateMaxDrawdown = () => {
    let maxDrawdown = 0;
    let peak = startingBalance;

    equityCurve.forEach(point => {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = ((peak - point.value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  };

  res.json({
    equityCurve,
    currentBalance,
    totalReturn: ((currentBalance - startingBalance) / startingBalance) * 100,
    returnsBuckets,
    marketBreakdown: Object.values(marketBreakdown),
    metrics: {
      sharpeRatio: calculateSharpeRatio(),
      maxDrawdown: calculateMaxDrawdown(),
      totalPositions: positions.length,
      openPositions: positions.filter(p => !p.closedAt).length,
      winRate: trades.filter(t => t.pnl > 0).length / Math.max(1, trades.filter(t => t.closedAt).length) * 100
    }
  });
});
```

---

## 7. Insights API

### 7.1 GET /api/insights
**Purpose:** Get AI-generated market insights

```typescript
app.get('/api/insights', (req, res) => {
  const { type = 'all', timeHorizon = '24h' } = req.query;

  const generateInsights = (type: string, timeHorizon: string) => {
    const insights = [];
    const insightTypes = ['strong_signal', 'trending', 'dip'];
    const markets = ['BTC hits $100k', 'Trump wins 2024', 'SpaceX Mars landing'];

    const count = type === 'all' ? 30 : 10;

    for (let i = 0; i < count; i++) {
      const insightType = type === 'all'
        ? insightTypes[i % insightTypes.length]
        : type;

      insights.push({
        id: `insight-${i}`,
        type: insightType,
        marketId: `market-${i}`,
        marketTitle: markets[i % markets.length],
        signal: {
          strength: 50 + Math.random() * 50, // 50-100
          confidence: 60 + Math.random() * 40, // 60-100
          direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
        },
        metrics: {
          probability: 0.3 + Math.random() * 0.5,
          volume24h: Math.floor(10000 + Math.random() * 990000),
          priceChange24h: -20 + Math.random() * 40,
          momentum: -50 + Math.random() * 100
        },
        reasoning: generateReasoning(insightType),
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        timeHorizon
      });
    }

    return insights.sort((a, b) => b.signal.strength - a.signal.strength);
  };

  const generateReasoning = (type: string) => {
    const reasonings = {
      strong_signal: 'Unusual volume spike detected with consistent directional movement',
      trending: 'Market showing strong momentum with increasing participation',
      dip: 'Significant price drop presents potential entry opportunity'
    };
    return reasonings[type] || 'Market conditions warrant attention';
  };

  const insights = generateInsights(type as string, timeHorizon as string);

  res.json({
    insights,
    timestamp: new Date(),
    nextUpdate: new Date(Date.now() + 300000) // 5 minutes
  });
});
```

---

## 8. Waitlist API

### 8.1 POST /api/waitlist
**Purpose:** Submit waitlist signup with game results

```typescript
app.post('/api/waitlist', async (req, res) => {
  try {
    const signupData = waitlistSignupSchema.parse(req.body);

    // Check if email already exists
    if (storage.waitlist.exists(signupData.email)) {
      return res.status(400).json({
        error: 'Email already registered on waitlist'
      });
    }

    const signup: WaitlistSignup = {
      id: crypto.randomUUID(),
      ...signupData,
      createdAt: new Date()
    };

    const saved = storage.waitlist.create(signup);

    // In production, send confirmation email here
    // await sendWaitlistConfirmation(signup.email);

    res.status(201).json({
      message: 'Successfully joined the waitlist',
      position: storage.waitlist.findAll().length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid signup data',
        issues: error.issues
      });
    }
    res.status(500).json({ error: 'Failed to process waitlist signup' });
  }
});
```

### 8.2 GET /api/waitlist/stats
**Purpose:** Get waitlist statistics

```typescript
app.get('/api/waitlist/stats', (req, res) => {
  const signups = storage.waitlist.findAll();

  const stats = {
    total: signups.length,
    averageScore: signups.reduce((sum, s) => sum + s.finalBankroll, 0) / Math.max(1, signups.length),
    averageBets: signups.reduce((sum, s) => sum + s.totalBets, 0) / Math.max(1, signups.length),
    topScore: Math.max(...signups.map(s => s.finalBankroll)),
    signupsToday: signups.filter(s =>
      new Date(s.createdAt).toDateString() === new Date().toDateString()
    ).length,
    signupsThisWeek: signups.filter(s =>
      new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  res.json(stats);
});
```

---

## 9. WebSocket Implementation

### 9.1 WebSocket Server Setup
**Location:** `server/websocket.ts`

```typescript
import { WebSocketServer } from 'ws';
import { Server } from 'http';

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now()
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'subscribe':
            handleSubscribe(ws, message.channels);
            break;
          case 'unsubscribe':
            handleUnsubscribe(ws, message.channels);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      cleanupSubscriptions(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast price updates
  const broadcastPriceUpdate = (marketId: string, price: number) => {
    const message = JSON.stringify({
      type: 'price_update',
      marketId,
      price,
      timestamp: Date.now()
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Start price simulation
  setInterval(() => {
    const markets = ['market-1', 'market-2', 'market-3'];
    markets.forEach(marketId => {
      const price = 0.5 + (Math.random() - 0.5) * 0.1;
      broadcastPriceUpdate(marketId, price);
    });
  }, 5000);

  return wss;
};
```

---

## 10. Error Handling Middleware

### 10.1 Global Error Handler
**Location:** `server/middleware/errorHandler.ts`

```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body exceeds maximum size'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    requestId: crypto.randomUUID()
  });
};
```

### 10.2 Async Route Handler
**Location:** `server/middleware/asyncHandler.ts`

```typescript
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage example:
app.get('/api/example', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```

---

## 11. FastAPI Migration Notes

### Key Differences to Address

1. **Type System**: Replace TypeScript interfaces with Pydantic models
2. **Validation**: Use Pydantic instead of Zod
3. **Async/Await**: FastAPI is async by default
4. **WebSocket**: Use FastAPI's WebSocket support
5. **Storage**: Implement SQLAlchemy models instead of Map-based storage

### Example FastAPI Endpoint Structure

```python
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI()

class Order(BaseModel):
    id: str
    market_id: str
    market_title: str
    side: Literal["yes", "no"]
    amount: float
    entry_price: float
    status: Literal["pending", "filled", "cancelled", "failed"]
    created_at: datetime
    filled_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

@app.post("/api/orders", response_model=OrderResponse)
async def create_order(order: CreateOrderRequest):
    # Validation happens automatically via Pydantic
    # Business logic here
    pass

@app.get("/api/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = Query(None),
    market_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    # Implementation here
    pass
```

This reference provides complete implementation details for recreating all API functionality in FastAPI while maintaining the exact same behavior as the existing Express.js implementation.