import React, { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { PricePoint, Bet } from '@/types/game';

interface PriceChartProps {
  priceHistory: PricePoint[];
  currentPrice: number | null;
  activeBet?: Bet | null;
  isConnected: boolean;
}

/**
 * Real-time BTC price chart
 * - Shows last 20 price points from WebSocket
 * - Minute reference line (amber dashed)
 * - Entry/exit markers for active bets
 * - Connection status indicator
 */
const PriceChart: React.FC<PriceChartProps> = ({
  priceHistory,
  currentPrice,
  activeBet,
  isConnected
}) => {
  /**
   * Enrich price history with highlight flag for last 3 seconds
   */
  const enrichedData = useMemo(() => {
    if (priceHistory.length === 0) return [];

    const now = Date.now();
    const threeSecondsAgo = now - 3000;

    return priceHistory.map(point => ({
      ...point,
      highlightPrice: point.timestamp >= threeSecondsAgo ? point.price : null
    }));
  }, [priceHistory]);

  /**
   * Calculate data for last 3 seconds (for marker)
   */
  const last3SecondsData = useMemo(() => {
    if (priceHistory.length === 0) return [];

    const now = Date.now();
    const threeSecondsAgo = now - 3000;

    return priceHistory.filter(point => point.timestamp >= threeSecondsAgo);
  }, [priceHistory]);

  /**
   * Get the timestamp where the 3-second window starts
   */
  const threeSecondMarker = useMemo(() => {
    if (last3SecondsData.length === 0) return null;
    return last3SecondsData[0];
  }, [last3SecondsData]);

  /**
   * Calculate minute reference price (price at start of current minute)
   * TODO: Implement logic to find first price of current minute
   */
  const minuteReferencePrice = useMemo(() => {
    // TODO: Find price at minute boundary
    if (priceHistory.length === 0) return null;

    // Placeholder: return first price in history
    return priceHistory[0]?.price || null;
  }, [priceHistory]);

  /**
   * Format price for display
   */
  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Calculate Y-axis domain for better chart scaling
   * TODO: Implement dynamic domain based on price range
   */
  const yAxisDomain = useMemo(() => {
    // TODO: Calculate min/max with padding
    if (priceHistory.length === 0) return ['auto', 'auto'];

    const prices = priceHistory.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1; // 10% padding

    return [min - padding, max + padding];
  }, [priceHistory]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-mono">BTC/USDT Live Price</h3>
          {/* Connection Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-negative'}`} />
        </div>
        <span className="text-primary font-mono text-xl">
          {formatPrice(currentPrice)}
        </span>
      </div>

      <div className="p-4">
        {priceHistory.length === 0 ? (
          /* Loading State */
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Loading price data...' : 'Connecting to Binance...'}
              </p>
            </div>
          </div>
        ) : (
          /* Chart */
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={enrichedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

              <XAxis
                dataKey="time"
                stroke="#6b7280"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                tick={{ fill: '#6b7280' }}
                interval="preserveStartEnd" // Show only first and last to avoid clutter
              />

              <YAxis
                stroke="#6b7280"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                tick={{ fill: '#6b7280' }}
                domain={yAxisDomain}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0e14',
                  border: '1px solid #1f2937',
                  fontFamily: 'JetBrains Mono',
                  borderRadius: '4px'
                }}
                labelStyle={{ color: '#6b7280' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              />

              {/* Minute Reference Line (amber dashed) */}
              {minuteReferencePrice && (
                <ReferenceLine
                  y={minuteReferencePrice}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Minute Start',
                    position: 'insideTopRight',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />
              )}

              {/* 3-Second Window Marker (vertical line at start of window) */}
              {threeSecondMarker && (
                <ReferenceLine
                  x={threeSecondMarker.time}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Bet Window',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />
              )}

              {/* Bet Entry Marker */}
              {activeBet && (
                <ReferenceLine
                  y={activeBet.entryPrice}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  label={{
                    value: 'Entry',
                    position: 'insideTopLeft',
                    fill: '#06b6d4',
                    fontSize: 10
                  }}
                />
              )}

              {/* Shaded Area for Last 3 Seconds - highlightPrice is only set for last 3s */}
              <Area
                type="monotone"
                dataKey="highlightPrice"
                stroke="none"
                fill="#06b6d4"
                fillOpacity={0.3}
                isAnimationActive={false}
                connectNulls={false}
              />

              {/* Main Price Line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PriceChart;