# Agora Oracle Design Guidelines

## Design Approach

**Selected Approach:** Bloomberg Terminal Design System
- **Primary Reference:** Bloomberg Terminal's dense, data-first architecture
- **Secondary References:** Professional trading platforms (ThinkOrSwim, Interactive Brokers)
- **Rationale:** Professional prediction market oracle requiring high information density, real-time data clarity, and institutional-grade credibility

## Color System

**Oracle Foundation:**
- Background: #0a0e14 (deep charcoal-black)
- Panel Surface: #111827 (elevated panels)
- Panel Border: #1f2937
- Dividers: rgba(255, 255, 255, 0.1)

**Data Visualization:**
- Positive/Long: #f59e0b (amber-500) for gains, upward trends
- Negative/Short: #ef4444 (red-500) for losses, downward trends
- Neutral/Info: #06b6d4 (cyan-500) for data points
- Alert: #f97316 (orange-500) for warnings
- Success: #10b981 (emerald-500) for confirmations

**Text Hierarchy:**
- Primary: #f9fafb (near-white)
- Secondary: #d1d5db (light gray)
- Muted: #6b7280 (medium gray)
- Disabled: #4b5563

**Accent Highlights:**
- Active Panel: cyan-500 with 2px border-l
- Ticker Highlight: amber-500 background flash
- Command Focus: cyan-400 glow

## Typography System

**Font Stack:**
- UI Labels: Inter (professional sans-serif)
- Numerical Data: JetBrains Mono (all numbers, prices, percentages, timestamps)
- Oracle Input: JetBrains Mono

**Hierarchy:**
- Panel Titles: text-xs font-semibold uppercase tracking-widest (Inter)
- Data Headers: text-sm font-medium uppercase tracking-wide
- Large Numbers: text-3xl font-bold (JetBrains Mono)
- Standard Numbers: text-base font-medium (JetBrains Mono)
- Body Text: text-sm
- Ticker Text: text-xs font-medium (JetBrains Mono)
- Timestamps: text-xs (JetBrains Mono)
- Labels: text-xs uppercase tracking-wider

## Layout System

**Spacing Primitives:** Tailwind units 1, 2, 3, 4, 6, 8 (tighter spacing for density)

**Oracle Grid Structure:**
```
Desktop: grid grid-cols-12 gap-2 (minimal gaps)
- Left ticker panel: col-span-2
- Main trading view: col-span-7
- Right analytics/AI: col-span-3

Mobile: Stack vertically with collapsible panels
```

**Panel System:**
- All panels: border border-gray-800 bg-gray-900
- Active panel: border-l-2 border-l-cyan-500
- Minimal padding: p-3 to p-4 (maximize data density)
- Panel headers: sticky top-0 bg-gray-900 border-b border-gray-800 p-2

## Component Library

### Hero Section (Marketing/Landing)

**Oracle Dashboard Screenshot Approach:**
- Large screenshot/mockup of the oracle interface (80% width)
- Shows multi-panel layout with live data, charts, ticker
- Dark oracle aesthetic with bright data highlights
- Placement: Center-dominant with slight parallax depth

**Content:**
- Headline: text-4xl font-bold "Professional Prediction Market Oracle"
- Subheading: text-lg text-gray-400 "Bloomberg-grade analytics for Polymarket"
- CTA: Bright cyan button with backdrop-blur on oracle screenshot
- Stats bar: "Real-time • 500+ Markets • Institutional Tools" in monospace

### Ticker Bar

**Fixed Top Strip:**
- height: h-8, fixed top position
- Scrolling market tickers with auto-scroll animation
- Format: "MARKET_ID +5.2% $1.2M VOL" in monospace
- Color-coded by movement (amber positive, red negative)
- Separator: vertical bars (|) in gray-600

### Oracle Command Input

**Bottom-Fixed or Inline:**
- Input: border-2 border-gray-700 focus:border-cyan-500
- Background: bg-gray-950 with monospace font
- Prefix: ">" or "AGORA>" in cyan-500
- Placeholder: "Enter command or search markets..." in gray-600
- Keyboard hints: Small badges showing shortcuts (⌘K, ESC)

### Data Panel Cards

**Dense Information Blocks:**
- Minimal padding: p-3
- No rounded corners (sharp oracle aesthetic)
- Headers: 1-2px height with uppercase label + icon
- Content: Grid of label-value pairs with monospace values
- Separator lines between sections (border-t border-gray-800)

**Market Data Block Example:**
- Market Name: text-sm font-semibold
- Price: Large monospace number with color-coded change
- Volume/Liquidity: Smaller monospace in gray-400
- 24h Change: Colored percentage with up/down arrow
- Sparkline chart: Minimal line graph using cyan/amber

### AI Oracle Panel (Oracle Style)

**Redesigned as "Analytics Engine":**
- Header: "ORACLE ANALYTICS" in uppercase with status indicator
- Status: "PROCESSING..." with animated dots (cyan)
- Suggestions displayed as oracle output:
  - Timestamp prefix in gray-600
  - Confidence score in monospace (85.2%)
  - Recommendation text in white
  - Supporting data in tabular format

### Multi-Panel Layout Sections

**Trading View (Main Panel):**
- Top: Market selector dropdown (oracle-style)
- Center: Large price chart with technical indicators
- Bottom: Order book visualization (bid/ask spread)
- Side: Recent trades stream (scrolling list)

**Market List Panel:**
- Dense table layout with fixed header
- Columns: Market | Price | Change | Volume
- Alternating row backgrounds (subtle)
- Hover: Highlight row with cyan-900 background
- Sort indicators in column headers

**Analytics Panel:**
- Stacked mini-widgets with 1px borders
- Probability distribution graph
- Historical performance metrics
- AI confidence meters with horizontal bars
- Strategy recommendations in list format

## Images

**Hero Section:**
- Large oracle dashboard screenshot or mockup
- Shows: Multi-panel interface, live data streams, charts, ticker bar
- Style: High-fidelity oracle UI with bright data highlights on dark background
- Placement: Center-dominant, 80% width, subtle shadow/depth

**Data Visualization Graphics:**
- Candlestick charts with amber/red coloring
- Line graphs with cyan strokes
- Probability curves with gradient fills
- Market depth visualizations

## Interaction Patterns

**Minimal Animations:**
- Ticker scroll: Smooth continuous scroll
- Data updates: Brief flash in amber when value changes
- Panel focus: Instant cyan border-l appearance
- Hover rows: Subtle background change, no transform
- NO card lifts, NO complex transitions

**Oracle Behaviors:**
- Keyboard shortcuts prominently displayed
- Command input always accessible (⌘K global)
- Panel resize with drag handles
- Tab switching between panels
- Real-time data streaming with smooth updates

## Accessibility

- High contrast text on dark backgrounds (WCAG AAA)
- Keyboard navigation with visible focus states (cyan rings)
- Screen reader labels for all data panels
- Color-blind safe palette (use icons + colors for positive/negative)
- Live regions for streaming data updates
- Skip-to-panel navigation shortcuts

## Professional Trust Patterns

- All timestamps in ISO format with timezone
- Data source attribution in panel footers
- Latency indicators for real-time feeds
- Confidence intervals shown with all predictions
- Clear labeling of AI-generated vs. market data
- Monospace for all numerical precision