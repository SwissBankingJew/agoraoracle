# PolyMarketAgent - Detailed Implementation Guide

This document provides comprehensive implementation details for every feature in the existing codebase, enabling accurate recreation in React + FastAPI.

---

## 1. Strategy Configuration System

### 1.1 Chat Interface Implementation

#### Component Structure
**Location:** `client/src/pages/Home.tsx`

The chat interface uses a vertically split layout:
- **Left Panel (60% width):** Chat history and input
- **Right Panel (40% width):** Configuration cards and AI insights

#### Chat Message Flow
```typescript
// Message handling in Home.tsx
const handleSendMessage = async (content: string) => {
  // 1. Add user message to local state
  const userMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, userMessage]);

  // 2. Call configuration API
  const response = await fetch('/api/chat/configure', {
    method: 'POST',
    body: JSON.stringify({ message: content })
  });

  // 3. Add assistant response with config proposal
  const assistantMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: data.proposal.rationale,
    config_proposal: data.proposal,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, assistantMessage]);

  // 4. If parameters were coerced, show notification
  if (data.coercionNotes?.length > 0) {
    showCoercionToast(data.coercionNotes);
  }
};
```

#### Idle Prompt Behavior
After 5 seconds of inactivity, a subtle prompt appears:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (messages.length === 0 && !isTyping) {
      setShowIdlePrompt(true);
    }
  }, 5000);
  return () => clearTimeout(timer);
}, [messages, isTyping]);
```

### 1.2 LLM Configuration Generation

#### Backend Service
**Location:** `server/services/configAssistant.ts`

The LLM integration uses a carefully crafted system prompt:

```typescript
const systemPrompt = `You are an AI assistant that helps users configure trading strategies.
You must ALWAYS respond with valid JSON matching the ConfigProposal schema.

Available strategies:
1. "Go with the Crowd" - Follow market consensus
   - min_probability: 0.50 to 0.95
   - min_remaining_time_hours: 0 to 720

2. "Insider Tracker" - Detect unusual activity
   - confidence_level: 0 to 100

3. "Buy the Dip" - Enter after price drops
   - dip_threshold_pct: 1 to 40

Analyze the user's intent and map it to ONE strategy.
Generate appropriate parameters based on their risk tolerance.
Provide a clear rationale and ask clarifying questions if needed.`;

const generateConfigFromNaturalLanguage = async (userMessage: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
    temperature: 0.7
  });

  const proposal = JSON.parse(completion.choices[0].message.content);
  return configProposalSchema.parse(proposal);
};
```

#### Parameter Validation & Coercion
**Location:** `server/services/configValidator.ts`

The system automatically adjusts out-of-range parameters:

```typescript
const validateAndCoerceConfig = (proposal: ConfigProposal) => {
  const coercionNotes: string[] = [];
  const params = { ...proposal.strategy_params };

  switch (proposal.strategy_name) {
    case "Go with the Crowd":
      // Coerce min_probability
      if (params.min_probability < 0.50) {
        coercionNotes.push(`Adjusted min_probability from ${params.min_probability} to 0.50 (minimum allowed)`);
        params.min_probability = 0.50;
      }
      if (params.min_probability > 0.95) {
        coercionNotes.push(`Adjusted min_probability from ${params.min_probability} to 0.95 (maximum allowed)`);
        params.min_probability = 0.95;
      }

      // Coerce min_remaining_time_hours
      if (params.min_remaining_time_hours < 0) {
        params.min_remaining_time_hours = 0;
      }
      if (params.min_remaining_time_hours > 720) {
        params.min_remaining_time_hours = 720;
      }
      break;
    // Similar logic for other strategies...
  }

  return {
    config: {
      id: crypto.randomUUID(),
      ...proposal,
      strategy_params: params,
      coercion_notes: coercionNotes,
      created_at: new Date()
    },
    coercionNotes
  };
};
```

### 1.3 Configuration Card UI

#### Component Implementation
**Location:** `client/src/components/ConfigSummaryCard.tsx`

Each configuration displays as an interactive card:

```typescript
const ConfigSummaryCard = ({ config, onAccept, onEdit }) => {
  return (
    <Card className="bg-slate-900 border-slate-800">
      {/* Strategy Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={getStrategyVariant(config.strategy_name)}>
          {config.strategy_name}
        </Badge>
        <ConfidenceGauge value={config.confidence * 100} />
      </div>

      {/* Editable Parameters */}
      <div className="space-y-2">
        {Object.entries(config.strategy_params).map(([key, value]) => (
          <ParameterChip
            key={key}
            label={formatParamName(key)}
            value={value}
            onEdit={(newValue) => handleParamEdit(key, newValue)}
            validation={getParamValidation(config.strategy_name, key)}
          />
        ))}
      </div>

      {/* Rationale */}
      <p className="text-sm text-slate-400 mt-3">{config.rationale}</p>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button onClick={onAccept} variant="primary">Accept</Button>
        <Button onClick={onEdit} variant="ghost">Modify</Button>
      </div>
    </Card>
  );
};
```

#### Inline Parameter Editing
Parameters can be edited by clicking on them:

```typescript
const ParameterChip = ({ label, value, onEdit, validation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{label}:</span>
        <Input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            const validated = validation.parse(tempValue);
            onEdit(validated);
            setIsEditing(false);
          }}
          className="w-20 h-6 text-xs"
          min={validation.min}
          max={validation.max}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 px-2 py-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-sm font-mono text-cyan-400">{value}</span>
    </div>
  );
};
```

---

## 2. Trading Interface Implementation

### 2.1 Market Discovery Page

#### Data Fetching & Caching
**Location:** `client/src/pages/Markets.tsx`

Markets are fetched using React Query with 30-second cache:

```typescript
const useMarkets = () => {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const response = await fetch('/api/markets');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
    refetchIntervalInBackground: true
  });
};
```

#### Advanced Filtering System
**Location:** `client/src/components/MarketFilters.tsx`

Multi-dimensional filtering with real-time updates:

```typescript
const MarketFilters = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    probabilityRange: [0, 100],
    minVolume: 0,
    minLiquidity: 0,
    categories: [],
    status: 'all', // 'all', 'active', 'resolved'
    sortBy: 'volume', // 'volume', 'probability', 'liquidity', 'time'
    sortOrder: 'desc'
  });

  // Probability range slider
  <Slider
    value={filters.probabilityRange}
    onValueChange={(value) => {
      setFilters(prev => ({ ...prev, probabilityRange: value }));
      onFiltersChange({ ...filters, probabilityRange: value });
    }}
    min={0}
    max={100}
    step={1}
    className="w-full"
  />

  // Apply filters to market list
  const filteredMarkets = markets.filter(market => {
    const probability = market.probability * 100;
    return (
      probability >= filters.probabilityRange[0] &&
      probability <= filters.probabilityRange[1] &&
      market.volume >= filters.minVolume &&
      market.liquidity >= filters.minLiquidity &&
      (filters.categories.length === 0 || filters.categories.includes(market.category)) &&
      (filters.status === 'all' || market.status === filters.status)
    );
  });
};
```

#### Virtual Scrolling Implementation
**Location:** `client/src/components/MarketList.tsx`

For performance with large lists:

```typescript
import { FixedSizeList } from 'react-window';

const MarketList = ({ markets }) => {
  const Row = ({ index, style }) => {
    const market = markets[index];
    return (
      <div style={style} className="flex items-center p-3 border-b border-slate-800">
        <MarketCard market={market} />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={markets.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

#### Sparkline Charts
**Location:** `client/src/components/Sparkline.tsx`

Minimal price trend visualization:

```typescript
const Sparkline = ({ data, width = 100, height = 30 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const color = data[data.length - 1] > data[0] ? '#f59e0b' : '#ef4444';

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
};
```

### 2.2 Market Detail Page

#### Multi-Timeframe Chart Implementation
**Location:** `client/src/components/MarketTradingChart.tsx`

Using Recharts for candlestick visualization:

```typescript
const MarketTradingChart = ({ marketId }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const { data: chartData } = useMarketCandles(marketId, timeframe);

  // Custom candlestick shape
  const CandleShape = (props) => {
    const { x, y, width, height, payload } = props;
    const { open, high, low, close } = payload;

    const isGreen = close > open;
    const color = isGreen ? '#f59e0b' : '#ef4444';

    const bodyHeight = Math.abs(close - open) * height;
    const bodyY = Math.min(open, close) * height + y;
    const wickX = x + width / 2;

    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={y + (1 - high) * height}
          x2={wickX}
          y2={y + (1 - low) * height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x}
          y={bodyY}
          width={width}
          height={bodyHeight}
          fill={color}
          fillOpacity={0.8}
        />
      </g>
    );
  };

  return (
    <>
      {/* Timeframe selector */}
      <Tabs value={timeframe} onValueChange={setTimeframe}>
        <TabsList>
          {['1H', '4H', '1D', '1W', '1M', 'All'].map(tf => (
            <TabsTrigger key={tf} value={tf}>{tf}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData?.candles}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => format(new Date(ts * 1000), 'MMM dd HH:mm')}
            stroke="#6b7280"
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            stroke="#6b7280"
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-slate-900 p-2 border border-slate-700">
                  <p className="text-xs text-slate-400">{format(new Date(data.timestamp * 1000), 'MMM dd HH:mm')}</p>
                  <p className="text-xs">O: {(data.open * 100).toFixed(1)}%</p>
                  <p className="text-xs">H: {(data.high * 100).toFixed(1)}%</p>
                  <p className="text-xs">L: {(data.low * 100).toFixed(1)}%</p>
                  <p className="text-xs">C: {(data.close * 100).toFixed(1)}%</p>
                  <p className="text-xs">Vol: ${data.volume.toLocaleString()}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="volume" fill="#06b6d4" opacity={0.3} yAxisId="volume" />
          <Bar dataKey="close" shape={CandleShape} />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  );
};
```

#### Kelly Criterion Bet Sizing Calculator
**Location:** `client/src/components/BetSizer.tsx`

Mathematical optimal betting implementation:

```typescript
const BetSizer = ({ marketProbability, onSizeCalculated }) => {
  const [userProbability, setUserProbability] = useState(50);
  const [bankroll, setBankroll] = useState(1000);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  const calculateKellyFraction = () => {
    // Kelly Formula: f* = (p * (b + 1) - 1) / b
    // where p = probability of winning, b = odds received on win

    const p = userProbability / 100;
    const q = 1 - p;
    const marketP = marketProbability / 100;

    // Calculate implied odds
    const odds = (1 / marketP) - 1;

    // Kelly fraction
    const kellyFraction = (p * (odds + 1) - 1) / odds;

    // Apply risk adjustment
    const riskMultiplier = {
      conservative: 0.25,  // Quarter Kelly
      balanced: 0.5,      // Half Kelly
      aggressive: 1.0     // Full Kelly
    }[riskProfile];

    const adjustedFraction = Math.max(0, Math.min(1, kellyFraction * riskMultiplier));
    const suggestedBet = Math.round(bankroll * adjustedFraction);

    return {
      kellyFraction: kellyFraction * 100,
      adjustedFraction: adjustedFraction * 100,
      suggestedBet,
      expectedValue: (p * odds - q) * 100,
      edge: ((p / marketP) - 1) * 100
    };
  };

  const results = calculateKellyFraction();

  return (
    <Card className="p-4 bg-slate-900 border-slate-800">
      <h3 className="text-sm font-medium mb-3">Kelly Criterion Calculator</h3>

      {/* User probability input */}
      <div className="space-y-2">
        <Label>Your Estimated Probability: {userProbability}%</Label>
        <Slider
          value={[userProbability]}
          onValueChange={([v]) => setUserProbability(v)}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* Risk profile selector */}
      <RadioGroup value={riskProfile} onValueChange={setRiskProfile}>
        <div className="flex gap-3 mt-3">
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="conservative" />
            <span>Conservative (25% Kelly)</span>
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="balanced" />
            <span>Balanced (50% Kelly)</span>
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="aggressive" />
            <span>Aggressive (Full Kelly)</span>
          </Label>
        </div>
      </RadioGroup>

      {/* Results */}
      <div className="mt-4 p-3 bg-slate-800 rounded">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">Kelly %:</span>
            <span className="ml-2 font-mono">{results.kellyFraction.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Adjusted %:</span>
            <span className="ml-2 font-mono">{results.adjustedFraction.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-slate-500">Edge:</span>
            <span className={`ml-2 font-mono ${results.edge > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {results.edge > 0 ? '+' : ''}{results.edge.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500">EV:</span>
            <span className={`ml-2 font-mono ${results.expectedValue > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {results.expectedValue > 0 ? '+' : ''}{results.expectedValue.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Suggested Bet:</span>
            <span className="text-lg font-mono text-cyan-400">${results.suggestedBet}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => onSizeCalculated(results.suggestedBet)}
        className="w-full mt-3"
        variant="primary"
      >
        Use Suggested Size
      </Button>
    </Card>
  );
};
```

#### Quick Trade Component
**Location:** `client/src/components/QuickTrade.tsx`

Streamlined trading interface:

```typescript
const QuickTrade = ({ market, onTrade }) => {
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState(false);
  const presetAmounts = [10, 25, 50, 100];

  const handleTrade = async () => {
    const order = {
      marketId: market.id,
      marketTitle: market.title,
      side,
      amount,
      entryPrice: side === 'yes' ? market.probability : (1 - market.probability)
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (response.ok) {
      const data = await response.json();
      toast.success(`Order filled at ${(order.entryPrice * 100).toFixed(1)}%`);
      onTrade?.(data);
    }
  };

  return (
    <Card className="p-4 bg-slate-900 border-slate-800">
      {/* Side selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          variant={side === 'yes' ? 'default' : 'ghost'}
          onClick={() => setSide('yes')}
          className={side === 'yes' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          BUY YES @ {(market.probability * 100).toFixed(1)}%
        </Button>
        <Button
          variant={side === 'no' ? 'default' : 'ghost'}
          onClick={() => setSide('no')}
          className={side === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          BUY NO @ {((1 - market.probability) * 100).toFixed(1)}%
        </Button>
      </div>

      {/* Amount selector */}
      <div className="space-y-2">
        <Label>Amount</Label>
        {!customAmount ? (
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map(preset => (
              <Button
                key={preset}
                variant={amount === preset ? 'default' : 'outline'}
                onClick={() => setAmount(preset)}
                size="sm"
              >
                ${preset}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            placeholder="Enter amount"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCustomAmount(!customAmount)}
        >
          {customAmount ? 'Use Presets' : 'Custom Amount'}
        </Button>
      </div>

      {/* Potential return display */}
      <div className="mt-4 p-3 bg-slate-800 rounded">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Potential Return:</span>
          <span className="font-mono text-cyan-400">
            ${(amount / (side === 'yes' ? market.probability : (1 - market.probability))).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-500">Potential Profit:</span>
          <span className="font-mono text-amber-400">
            +${(amount / (side === 'yes' ? market.probability : (1 - market.probability)) - amount).toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handleTrade}
        className="w-full mt-4"
        variant="primary"
        size="lg"
      >
        Place Order
      </Button>
    </Card>
  );
};
```

---

## 3. Portfolio Management Implementation

### 3.1 Position Tracking System

#### Position Creation & Management
**Location:** `server/routes.ts`

Positions are automatically created when orders are filled:

```typescript
// POST /api/orders - Creates order and position
app.post('/api/orders', async (req, res) => {
  const orderData = insertOrderSchema.parse(req.body);

  // Create order (auto-filled in this demo)
  const order = {
    id: crypto.randomUUID(),
    ...orderData,
    status: 'filled',
    createdAt: new Date(),
    filledAt: new Date()
  };

  // Create corresponding position
  const position = {
    id: crypto.randomUUID(),
    marketId: order.marketId,
    marketTitle: order.marketTitle,
    side: order.side,
    amount: order.amount,
    entryPrice: order.entryPrice, // Side-specific
    currentPrice: await getMarketPrice(order.marketId), // Always YES probability
    openedAt: new Date(),
    closedAt: null,
    exitPrice: null,
    realizedPnl: null
  };

  storage.orders.create(order);
  storage.positions.create(position);

  res.json({ order, position });
});
```

#### P&L Calculation Logic
**Location:** `server/routes.ts`

Critical implementation detail for side-specific pricing:

```typescript
// GET /api/positions/open - Returns open positions with live P&L
app.get('/api/positions/open', (req, res) => {
  const openPositions = storage.positions.findAll()
    .filter(p => !p.closedAt)
    .map(position => {
      // Simulate current price movement
      const currentYesPrice = simulatePrice(position.currentPrice);

      // Calculate unrealized P&L based on side
      let unrealizedPnl;
      if (position.side === 'yes') {
        // For YES: profit when price goes up
        unrealizedPnl = ((currentYesPrice - position.entryPrice) / position.entryPrice) * position.amount;
      } else {
        // For NO: profit when price goes down
        const currentNoPrice = 1 - currentYesPrice;
        const entryNoPrice = position.entryPrice; // Already stored as NO price
        unrealizedPnl = ((currentNoPrice - entryNoPrice) / entryNoPrice) * position.amount;
      }

      return {
        ...position,
        currentPrice: currentYesPrice, // Always store YES price
        unrealizedPnl,
        unrealizedPnlPercent: (unrealizedPnl / position.amount) * 100
      };
    });

  res.json(openPositions);
});

// POST /api/positions/:id/close - Close position and realize P&L
app.post('/api/positions/:id/close', (req, res) => {
  const position = storage.positions.findById(req.params.id);
  if (!position) return res.status(404).json({ error: 'Position not found' });

  // Simulate exit price
  const exitYesPrice = simulatePrice(position.currentPrice);

  // Calculate realized P&L
  let exitPrice, realizedPnl;
  if (position.side === 'yes') {
    exitPrice = exitYesPrice;
    realizedPnl = ((exitPrice - position.entryPrice) / position.entryPrice) * position.amount;
  } else {
    exitPrice = 1 - exitYesPrice; // Store NO exit price
    realizedPnl = ((exitPrice - position.entryPrice) / position.entryPrice) * position.amount;
  }

  const updatedPosition = {
    ...position,
    closedAt: new Date(),
    exitPrice,
    realizedPnl
  };

  storage.positions.update(position.id, updatedPosition);
  res.json(updatedPosition);
});
```

### 3.2 Portfolio Analytics

#### Equity Curve Calculation
**Location:** `client/src/pages/Portfolio.tsx`

```typescript
const useEquityCurve = () => {
  const { data: positions } = usePositions();

  const calculateEquityCurve = () => {
    if (!positions) return [];

    // Sort positions by open date
    const sortedPositions = [...positions].sort(
      (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
    );

    const startingBalance = 10000;
    let currentBalance = startingBalance;
    const curve = [{ date: new Date().toISOString(), value: startingBalance }];

    sortedPositions.forEach(position => {
      // Subtract initial investment
      currentBalance -= position.amount;
      curve.push({
        date: position.openedAt,
        value: currentBalance
      });

      // Add back returns if position is closed
      if (position.closedAt && position.realizedPnl !== null) {
        currentBalance += position.amount + position.realizedPnl;
        curve.push({
          date: position.closedAt,
          value: currentBalance
        });
      }
    });

    // Add current value with unrealized P&L
    const unrealizedPnl = positions
      .filter(p => !p.closedAt)
      .reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);

    curve.push({
      date: new Date().toISOString(),
      value: currentBalance + unrealizedPnl
    });

    return curve;
  };

  return calculateEquityCurve();
};
```

#### Portfolio Metrics Display
**Location:** `client/src/components/PortfolioMetrics.tsx`

```typescript
const PortfolioMetrics = ({ positions }) => {
  const metrics = useMemo(() => {
    const closedPositions = positions.filter(p => p.closedAt);
    const openPositions = positions.filter(p => !p.closedAt);

    const totalInvested = positions.reduce((sum, p) => sum + p.amount, 0);
    const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
    const unrealizedPnl = openPositions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);

    const winningTrades = closedPositions.filter(p => p.realizedPnl > 0);
    const losingTrades = closedPositions.filter(p => p.realizedPnl < 0);
    const winRate = closedPositions.length > 0
      ? (winningTrades.length / closedPositions.length) * 100
      : 0;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, p) => sum + p.realizedPnl, 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, p) => sum + p.realizedPnl, 0) / losingTrades.length)
      : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    return {
      totalInvested,
      realizedPnl,
      unrealizedPnl,
      totalPnl: realizedPnl + unrealizedPnl,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalTrades: closedPositions.length,
      openPositions: openPositions.length
    };
  }, [positions]);

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        label="Total P&L"
        value={`$${metrics.totalPnl.toFixed(2)}`}
        change={`${((metrics.totalPnl / metrics.totalInvested) * 100).toFixed(1)}%`}
        positive={metrics.totalPnl > 0}
      />
      <MetricCard
        label="Win Rate"
        value={`${metrics.winRate.toFixed(1)}%`}
        subtitle={`${metrics.totalTrades} trades`}
      />
      <MetricCard
        label="Profit Factor"
        value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
        subtitle="Risk/Reward"
      />
      <MetricCard
        label="Open Positions"
        value={metrics.openPositions}
        subtitle={`$${metrics.unrealizedPnl.toFixed(2)} unrealized`}
      />
    </div>
  );
};
```

---

## 4. Real-Time Data Systems

### 4.1 Binance WebSocket Integration

#### WebSocket Hook Implementation
**Location:** `client/src/hooks/useBinanceWebSocket.ts`

Complete WebSocket management with reconnection:

```typescript
export const useBinanceWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [priceUpdate, setPriceUpdate] = useState<PriceUpdate | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@miniTicker');

    ws.onopen = () => {
      console.log('Binance WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle pong response
        if (data.method === 'pong') return;

        const update: PriceUpdate = {
          symbol: data.s,
          price: parseFloat(data.c),
          high24h: parseFloat(data.h),
          low24h: parseFloat(data.l),
          volume24h: parseFloat(data.v),
          timestamp: Date.now()
        };

        setPriceUpdate(update);
        setPriceHistory(prev => {
          const newHistory = [...prev, update];
          // Keep last 60 updates
          return newHistory.slice(-60);
        });
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      clearInterval(heartbeatInterval.current);

      // Exponential backoff reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 32000);
      reconnectAttempts.current++;

      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      reconnectTimeout.current = setTimeout(connect, delay);
    };

    setSocket(ws);
    return ws;
  }, []);

  useEffect(() => {
    const ws = connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      clearInterval(heartbeatInterval.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connect]);

  const reconnect = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.close();
    }
    connect();
  };

  return {
    priceUpdate,
    priceHistory,
    isConnected,
    error,
    reconnect
  };
};
```

#### Ticker Bar Implementation
**Location:** `client/src/components/TickerBar.tsx`

Scrolling market prices display:

```typescript
const TickerBar = () => {
  const { priceUpdate } = useBinanceWebSocket();
  const [topMarkets, setTopMarkets] = useState<Market[]>([]);

  // Fetch top markets
  useEffect(() => {
    fetch('/api/markets?sort=volume&limit=10')
      .then(res => res.json())
      .then(data => setTopMarkets(data));
  }, []);

  return (
    <div className="h-8 bg-slate-950 border-b border-slate-800 overflow-hidden">
      <div className="animate-scroll-left flex items-center h-full whitespace-nowrap">
        {/* BTC Price from Binance */}
        <span className="px-4 text-xs">
          <span className="text-slate-500">BTC/USDT:</span>
          <span className={`ml-2 font-mono ${priceUpdate?.price > priceUpdate?.low24h ? 'text-amber-400' : 'text-red-400'}`}>
            ${priceUpdate?.price.toLocaleString()}
          </span>
        </span>

        {/* Top Prediction Markets */}
        {topMarkets.map(market => (
          <span key={market.id} className="px-4 text-xs border-l border-slate-800">
            <span className="text-slate-500">{market.title.slice(0, 30)}:</span>
            <span className="ml-2 font-mono text-cyan-400">
              {(market.probability * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

// CSS for continuous scroll
const styles = `
  @keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .animate-scroll-left {
    animation: scroll-left 30s linear infinite;
    width: 200%;
  }

  .animate-scroll-left:hover {
    animation-play-state: paused;
  }
`;
```

### 4.2 Price Simulation for Demo

#### Random Walk Implementation
**Location:** `server/services/priceSimulator.ts`

```typescript
export const simulatePrice = (basePrice: number): number => {
  // 2% hourly volatility
  const hourlyVolatility = 0.02;

  // Random walk with mean reversion
  const randomChange = (Math.random() - 0.5) * hourlyVolatility;
  const meanReversion = (0.5 - basePrice) * 0.01; // Slight pull to 50%

  const newPrice = basePrice + randomChange + meanReversion;

  // Clamp between 1% and 99%
  return Math.max(0.01, Math.min(0.99, newPrice));
};

// Store simulated prices for consistency
const priceCache = new Map<string, { price: number, timestamp: number }>();

export const getMarketPrice = (marketId: string): number => {
  const cached = priceCache.get(marketId);
  const now = Date.now();

  // Update every 10 seconds
  if (!cached || now - cached.timestamp > 10000) {
    const basePrice = cached?.price || 0.5 + (Math.random() - 0.5) * 0.3;
    const newPrice = simulatePrice(basePrice);
    priceCache.set(marketId, { price: newPrice, timestamp: now });
    return newPrice;
  }

  return cached.price;
};
```

---

## 5. Gamified Waitlist Experience

### 5.1 BTC Betting Game Implementation

#### Game State Management
**Location:** `client/src/hooks/useWaitlistGame.ts`

Complete game logic with LocalStorage persistence:

```typescript
interface GameState {
  balance: number;
  activeBet: {
    direction: 'up' | 'down';
    amount: number;
    entryPrice: number;
    entryTime: number;
    tickCount: number;
  } | null;
  betHistory: BetResult[];
  totalBets: number;
  minuteMarkers: MinuteMarker[];
}

export const useWaitlistGame = () => {
  const { priceUpdate, priceHistory } = useBinanceWebSocket();
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('waitlistGameState');
    return saved ? JSON.parse(saved) : {
      balance: 1000,
      activeBet: null,
      betHistory: [],
      totalBets: 0,
      minuteMarkers: []
    };
  });

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('waitlistGameState', JSON.stringify(gameState));
  }, [gameState]);

  // Track minute markers for chart reference
  useEffect(() => {
    if (priceUpdate) {
      const now = new Date();
      const isNewMinute = now.getSeconds() < 1;

      if (isNewMinute && !gameState.minuteMarkers.some(
        m => Math.abs(m.timestamp - now.getTime()) < 1000
      )) {
        setGameState(prev => ({
          ...prev,
          minuteMarkers: [
            ...prev.minuteMarkers.slice(-10), // Keep last 10 markers
            {
              timestamp: now.getTime(),
              price: priceUpdate.price,
              label: format(now, 'HH:mm')
            }
          ]
        }));
      }
    }
  }, [priceUpdate]);

  // Place a bet
  const placeBet = (direction: 'up' | 'down', amount: number) => {
    if (!priceUpdate || gameState.balance < amount) return false;

    if (gameState.activeBet) {
      toast.error('You already have an active bet');
      return false;
    }

    setGameState(prev => ({
      ...prev,
      balance: prev.balance - amount,
      activeBet: {
        direction,
        amount,
        entryPrice: priceUpdate.price,
        entryTime: Date.now(),
        tickCount: 0
      },
      totalBets: prev.totalBets + 1
    }));

    return true;
  };

  // Check and settle bet
  useEffect(() => {
    if (!gameState.activeBet || !priceUpdate) return;

    const bet = gameState.activeBet;
    const newTickCount = bet.tickCount + 1;

    // Update tick count
    setGameState(prev => ({
      ...prev,
      activeBet: prev.activeBet ? {
        ...prev.activeBet,
        tickCount: newTickCount
      } : null
    }));

    // Settle after minimum 3 ticks
    if (newTickCount >= 3) {
      const priceDiff = priceUpdate.price - bet.entryPrice;
      const won = (bet.direction === 'up' && priceDiff > 0) ||
                  (bet.direction === 'down' && priceDiff < 0);

      const payout = won ? bet.amount * 2 : 0;

      const result: BetResult = {
        direction: bet.direction,
        amount: bet.amount,
        entryPrice: bet.entryPrice,
        exitPrice: priceUpdate.price,
        won,
        payout,
        profit: payout - bet.amount,
        duration: Date.now() - bet.entryTime,
        timestamp: Date.now()
      };

      setGameState(prev => ({
        ...prev,
        balance: prev.balance + payout,
        activeBet: null,
        betHistory: [...prev.betHistory, result]
      }));

      // Show result notification
      if (won) {
        toast.success(`Won $${bet.amount}! Price moved ${bet.direction} as predicted.`);
      } else {
        toast.error(`Lost $${bet.amount}. Price moved ${bet.direction === 'up' ? 'down' : 'up'}.`);
      }
    }
  }, [priceUpdate, gameState.activeBet]);

  const resetGame = () => {
    setGameState({
      balance: 1000,
      activeBet: null,
      betHistory: [],
      totalBets: 0,
      minuteMarkers: []
    });
    localStorage.removeItem('waitlistGameState');
  };

  return {
    ...gameState,
    currentPrice: priceUpdate?.price,
    priceHistory,
    placeBet,
    resetGame,
    canBet: !gameState.activeBet && gameState.balance > 0,
    isGameOver: gameState.balance <= 0 && !gameState.activeBet
  };
};
```

#### Waitlist Overlay UI
**Location:** `client/src/components/WaitlistOverlay.tsx`

```typescript
const WaitlistOverlay = ({ onClose }) => {
  const game = useWaitlistGame();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          finalBankroll: game.balance,
          totalBets: game.totalBets
        })
      });

      toast.success('Successfully joined the waitlist!');
      game.resetGame();
      onClose();
    } catch (error) {
      toast.error('Failed to join waitlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <Card className="relative z-10 w-full max-w-2xl p-6 bg-slate-900 border-slate-700">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Beat the Market, Join the Waitlist</h2>
          <p className="text-sm text-slate-400 mt-1">
            Predict BTC price movements and prove your trading skills
          </p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-mono text-cyan-400">${game.balance}</div>
            <div className="text-xs text-slate-500">Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono">
              {game.currentPrice ? `$${game.currentPrice.toLocaleString()}` : '--'}
            </div>
            <div className="text-xs text-slate-500">BTC Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono">{game.totalBets}</div>
            <div className="text-xs text-slate-500">Total Bets</div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={game.priceHistory.map((p, i) => ({
              index: i,
              price: p.price,
              isMinuteMarker: game.minuteMarkers.some(m =>
                Math.abs(m.timestamp - p.timestamp) < 1000
              )
            }))}>
              <XAxis dataKey="index" hide />
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  return (
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-xs font-mono">
                        ${payload[0].value?.toLocaleString()}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
              />
              {/* Minute markers */}
              <ReferenceLine
                x={game.priceHistory.length - 1}
                stroke="#6b7280"
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Betting Controls */}
        {!game.isGameOver && !showEmailForm && (
          <div className="space-y-4">
            {game.activeBet ? (
              <div className="p-4 bg-slate-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Active Bet:</span>
                  <Badge variant={game.activeBet.direction === 'up' ? 'success' : 'destructive'}>
                    {game.activeBet.direction.toUpperCase()} ${game.activeBet.amount}
                  </Badge>
                </div>
                <Progress
                  value={(game.activeBet.tickCount / 3) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Waiting for {3 - game.activeBet.tickCount} more price updates...
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => game.placeBet('up', 50)}
                    disabled={!game.canBet || game.balance < 50}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <ArrowUpIcon className="mr-2" />
                    BET UP ($50)
                  </Button>
                  <Button
                    onClick={() => game.placeBet('down', 50)}
                    disabled={!game.canBet || game.balance < 50}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <ArrowDownIcon className="mr-2" />
                    BET DOWN ($50)
                  </Button>
                </div>

                {/* Custom amount bets */}
                <div className="flex gap-2">
                  {[100, 250].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      disabled={game.balance < amount}
                      onClick={() => {
                        const direction = Math.random() > 0.5 ? 'up' : 'down';
                        game.placeBet(direction, amount);
                      }}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowEmailForm(true)}
            >
              Join Waitlist with Score: ${game.balance}
            </Button>
          </div>
        )}

        {/* Game Over State */}
        {game.isGameOver && (
          <div className="text-center py-8">
            <p className="text-xl mb-4">Game Over!</p>
            <p className="text-slate-400 mb-6">
              You placed {game.totalBets} bets. Better luck next time!
            </p>
            <Button onClick={game.resetGame} variant="primary">
              Try Again
            </Button>
          </div>
        )}

        {/* Email Submission Form */}
        {showEmailForm && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded">
              <p className="text-sm text-slate-400">Your Score:</p>
              <p className="text-2xl font-mono text-cyan-400">${game.balance}</p>
              <p className="text-xs text-slate-500 mt-1">
                From {game.totalBets} total bets
              </p>
            </div>

            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <Button
              onClick={handleSubmit}
              disabled={!email || isSubmitting}
              className="w-full"
              variant="primary"
            >
              {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
```

---

## 6. UI Components & Design System

### 6.1 Bloomberg Terminal Styling

#### Tailwind Configuration
**Location:** `tailwind.config.ts`

```typescript
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0e14',
        foreground: '#f9fafb',
        card: {
          DEFAULT: '#0d1117',
          foreground: '#f9fafb'
        },
        primary: {
          DEFAULT: '#06b6d4',
          foreground: '#0a0e14'
        },
        positive: '#f59e0b',
        negative: '#ef4444',
        muted: {
          DEFAULT: '#1a1f2e',
          foreground: '#6b7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out'
      }
    }
  }
};
```

#### Base Component Styles
**Location:** `client/src/index.css`

```css
@layer base {
  :root {
    --background: 216 33% 6%;      /* #0a0e14 */
    --foreground: 210 20% 98%;      /* #f9fafb */
    --card: 217 33% 8%;             /* #0d1117 */
    --primary: 189 94% 43%;         /* #06b6d4 */
    --positive: 38 92% 50%;         /* #f59e0b */
    --negative: 0 84% 60%;          /* #ef4444 */
    --muted: 217 33% 14%;           /* #1a1f2e */
    --muted-foreground: 220 9% 46%; /* #6b7280 */
  }

  * {
    @apply border-slate-800;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Monospace for all numbers */
  .font-mono,
  [data-numeric="true"] {
    font-variant-numeric: tabular-nums;
    @apply tracking-tight;
  }

  /* Data flash animation */
  @keyframes flash {
    0%, 100% { @apply bg-transparent; }
    50% { @apply bg-cyan-900/50; }
  }

  .data-flash {
    animation: flash 0.5s ease-in-out;
  }

  /* No rounded corners on data tables */
  .data-table {
    @apply rounded-none border border-slate-800;
  }

  .data-table th {
    @apply bg-slate-900 text-xs uppercase tracking-wider text-slate-500 font-normal;
    @apply px-3 py-2 text-left border-b border-slate-800;
  }

  .data-table td {
    @apply px-3 py-2 text-sm font-mono border-b border-slate-800;
  }

  /* Tight spacing for information density */
  .info-dense {
    @apply p-3 space-y-2;
  }

  .info-dense-xs {
    @apply p-2 space-y-1;
  }
}
```

### 6.2 Custom Components

#### Confidence Gauge
**Location:** `client/src/components/ConfidenceGauge.tsx`

```typescript
const ConfidenceGauge = ({ value, size = 'md' }) => {
  const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 40;
  const strokeWidth = size === 'sm' ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value < 30) return '#ef4444';
    if (value < 70) return '#f59e0b';
    return '#06b6d4';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="#1a1f2e"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono text-${size === 'sm' ? 'xs' : 'sm'}`}>
          {value}%
        </span>
      </div>
    </div>
  );
};
```

#### Loading States
**Location:** `client/src/components/LoadingState.tsx`

```typescript
const LoadingState = ({ type = 'card', count = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-slate-900 border border-slate-800 p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        );

      case 'table-row':
        return (
          <div className="flex items-center p-3 border-b border-slate-800">
            <Skeleton className="h-4 w-32 mr-4" />
            <Skeleton className="h-4 w-20 mr-4" />
            <Skeleton className="h-4 w-24 mr-4" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        );

      case 'chart':
        return (
          <div className="bg-slate-900 border border-slate-800 p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        );

      default:
        return <Skeleton className="h-4 w-full" />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
};
```

---

## 7. Error Handling & Edge Cases

### 7.1 API Error Handling

```typescript
// Client-side error handling
const apiRequest = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}`
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    toast.error(error.message || 'Something went wrong');
    throw error;
  }
};
```

### 7.2 WebSocket Reconnection

```typescript
// Exponential backoff with max retries
const reconnectWithBackoff = (
  attempt: number,
  maxAttempts: number = 10
) => {
  if (attempt >= maxAttempts) {
    setError('Max reconnection attempts reached');
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, attempt), 32000);
  setTimeout(() => connect(), delay);
};
```

### 7.3 Data Validation

```typescript
// Zod schema validation with error messages
const validateConfig = (data: unknown) => {
  try {
    return configSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i =>
        `${i.path.join('.')}: ${i.message}`
      );
      toast.error(`Validation failed: ${issues.join(', ')}`);
    }
    throw error;
  }
};
```

---

## Summary

This implementation guide provides detailed code examples and explanations for every major feature in the PolyMarketAgent application. Key implementation patterns to preserve in the rewrite:

1. **Side-specific price handling** for YES/NO markets
2. **Real-time WebSocket management** with reconnection
3. **LLM integration** with structured JSON responses
4. **Parameter coercion** with user notification
5. **Virtual scrolling** for large lists
6. **LocalStorage persistence** for game state
7. **Bloomberg Terminal aesthetics** with monospace numbers
8. **Kelly Criterion calculations** for bet sizing
9. **Comprehensive error handling** and loading states
10. **Responsive, information-dense layouts**

Each section includes the actual implementation code from the existing codebase, making it straightforward to recreate these features in your React + FastAPI rewrite.