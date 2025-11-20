import { useState, useEffect, useRef, useCallback } from 'react';
import type { PricePoint, BinanceTradeEvent } from '@/types/game';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';
const MAX_PRICE_HISTORY = 1000;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

interface UseBinanceWebSocketReturn {
  currentPrice: number | null;
  priceHistory: PricePoint[];
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing WebSocket connection to Binance BTC/USDT stream
 *
 * Features:
 * - Real-time price updates
 * - Maintains circular buffer of last 20 prices
 * - Auto-reconnect with exponential backoff
 * - Connection state management
 * - Error handling
 */
export function useBinanceWebSocket(): UseBinanceWebSocketReturn {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch historical kline data from Binance REST API
   * Fetches last 60 seconds of 1-second candles to initialize chart
   */
  const fetchHistoricalData = useCallback(async () => {
    try {
      const response = await fetch(
        `${BINANCE_API_URL}?symbol=BTCUSDT&interval=1s&limit=60`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const klines = await response.json();

      // Convert klines to PricePoint format
      // Kline format: [openTime, open, high, low, close, volume, ...]
      const historicalPoints: PricePoint[] = klines.map((kline: any[]) => ({
        time: new Date(kline[0]).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        timestamp: kline[0],
        price: parseFloat(kline[4]) // close price
      }));

      setPriceHistory(historicalPoints);
      console.log(`Loaded ${historicalPoints.length} historical price points`);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      // Not critical - WebSocket will start filling the buffer
    }
  }, []);

  /**
   * Add a new price point to history (circular buffer)
   * Keeps only last MAX_PRICE_HISTORY items
   */
  const addPriceToHistory = useCallback((price: number) => {
    const newPoint: PricePoint = {
      time: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      timestamp: Date.now(),
      price: price
    };

    setPriceHistory((prev) => {
      const updated = [...prev, newPoint];
      // Keep only last MAX_PRICE_HISTORY items (circular buffer)
      return updated.slice(-MAX_PRICE_HISTORY);
    });
  }, []);

  /**
   * Handle incoming WebSocket message
   * TODO: Implement message parsing
   * - Parse JSON
   * - Extract price from event.p
   * - Update current price
   * - Add to history
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    // TODO: Implement
    try {
      const data: BinanceTradeEvent = JSON.parse(event.data);
      const price = parseFloat(data.p);

      setCurrentPrice(price);
      addPriceToHistory(price);
      setError(null);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      setError('Failed to parse price data');
    }
  }, [addPriceToHistory]);

  /**
   * Connect to Binance WebSocket
   * Fetches historical data first, then connects
   */
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Step 1: Fetch historical data to pre-populate chart
      console.log('Fetching historical data...');
      await fetchHistoricalData();

      // Step 2: Connect to WebSocket
      console.log('Connecting to Binance WebSocket...');
      const ws = new WebSocket(BINANCE_WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;

        // TODO: Implement auto-reconnect with exponential backoff
        // - Check if should reconnect
        // - Calculate delay based on reconnectAttemptsRef
        // - Schedule reconnect
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect');
    }
  }, [handleMessage, fetchHistoricalData]);

  /**
   * Disconnect from WebSocket
   * TODO: Implement cleanup
   * - Close WebSocket connection
   * - Clear reconnect timeout
   * - Reset state
   */
  const disconnect = useCallback(() => {
    // TODO: Implement
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setCurrentPrice(null);
    setPriceHistory([]);
  }, []);

  /**
   * Cleanup on unmount
   * TODO: Ensure proper cleanup
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    currentPrice,
    priceHistory,
    isConnected,
    error,
    connect,
    disconnect
  };
}