import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Bet, BetDirection, BetAmount } from '@/types/game';

const INITIAL_BANKROLL = 1000;
const WIN_MULTIPLIER = 1.9;
const TIE_REFUND_MULTIPLIER = 0.9; // 90% refund on tie (10% fee)
const SETTLEMENT_DELAY = 3000; // 3 seconds

interface UseWaitlistGameProps {
  currentPrice: number | null;
  currentPriceRef: React.MutableRefObject<number | null>;
  isConnected: boolean;
  initialState?: Partial<GameState>;
}

interface UseWaitlistGameReturn {
  gameState: GameState;
  placeBet: (direction: BetDirection, amount: BetAmount) => void;
  canPlaceBet: boolean;
  isSettling: boolean;
  timeRemaining: number; // Countdown to settlement
}

/**
 * Custom hook for managing Bitcoin prediction game state
 *
 * Features:
 * - Bet placement with validation
 * - Automatic settlement after 3 seconds
 * - Win/Loss/Tie evaluation
 * - Bankroll management
 * - Bet history tracking
 * - Stats calculation
 * - Resume from saved state (localStorage)
 */
export function useWaitlistGame({
  currentPrice,
  currentPriceRef,
  isConnected,
  initialState
}: UseWaitlistGameProps): UseWaitlistGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Default state
    const defaultState: GameState = {
      bankroll: INITIAL_BANKROLL,
      initialBankroll: INITIAL_BANKROLL,
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      activeBet: null,
      betHistory: [],
      isPlaying: true,
      lastPlayedAt: Date.now()
    };

    // Merge with initial state if provided (resume from localStorage)
    if (initialState) {
      return {
        ...defaultState,
        ...initialState,
        activeBet: null, // Never restore active bets
        isPlaying: true
      };
    }

    return defaultState;
  });

  const [timeRemaining, setTimeRemaining] = useState(0);

  const settlementTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  /**
   * Evaluate bet outcome
   * Uses epsilon-based comparison to handle floating-point precision
   * - Compare entry vs exit price with tolerance
   * - Check direction
   * - Return win/loss/tie
   */
  const evaluateBet = useCallback((
    direction: BetDirection,
    entryPrice: number,
    exitPrice: number
  ): 'win' | 'loss' | 'tie' => {
    // Price tolerance threshold - $0.01 is negligible for Bitcoin prices
    const PRICE_TOLERANCE = 0.01;

    const priceDiff = exitPrice - entryPrice;
    const absDiff = Math.abs(priceDiff);

    // Check if prices are essentially equal (within tolerance)
    if (absDiff < PRICE_TOLERANCE) {
      return 'tie'; // No meaningful price movement
    }

    // Determine win/loss based on direction and price movement
    if (direction === 'UP') {
      return priceDiff > 0 ? 'win' : 'loss';
    } else {
      return priceDiff < 0 ? 'win' : 'loss';
    }
  }, []);

  /**
   * Calculate payout based on bet result
   * TODO: Implement payout calculation
   * - Win: amount × 1.9
   * - Tie: amount × 0.9 (10% fee)
   * - Loss: 0
   */
  const calculatePayout = useCallback((
    amount: number,
    result: 'win' | 'loss' | 'tie'
  ): number => {
    // TODO: Implement
    if (result === 'win') {
      return amount * WIN_MULTIPLIER;
    } else if (result === 'tie') {
      return amount * TIE_REFUND_MULTIPLIER;
    } else {
      return 0; // Loss
    }
  }, []);

  /**
   * Settle the active bet
   * Uses functional state updates to avoid stale closure bugs
   * Uses ref for current price to avoid stale closure on price
   * - Get current price from ref (always latest)
   * - Evaluate outcome
   * - Calculate payout
   * - Update game state
   */
  const settleBet = useCallback(() => {
    const exitPrice = currentPriceRef.current;
    if (!exitPrice) return;

    // Use functional state update to access latest state
    setGameState(prev => {
      // Guard: Check if there's actually an active bet
      if (!prev.activeBet) return prev;

      const bet = prev.activeBet;
      const result = evaluateBet(bet.direction, bet.entryPrice, exitPrice);
      const payout = calculatePayout(bet.amount, result);
      const pnl = payout - bet.amount;

      // Complete the bet
      const completedBet: Bet = {
        ...bet,
        exitPrice,
        exitTime: Date.now(),
        status: 'settled',
        result, // Store actual result (win/loss/tie)
        pnl
      };

      // Return updated state
      return {
        ...prev,
        activeBet: null,
        bankroll: prev.bankroll + payout,
        betHistory: [completedBet, ...prev.betHistory].slice(0, 5), // Keep last 5
        totalBets: prev.totalBets + 1,
        wins: prev.wins + (result === 'win' ? 1 : 0),
        losses: prev.losses + (result === 'loss' ? 1 : 0), // Only count actual losses
        winRate: calculateWinRate(
          prev.wins + (result === 'win' ? 1 : 0),
          prev.losses + (result === 'loss' ? 1 : 0)
        )
      };
    });

    // Clear timers
    if (settlementTimerRef.current) {
      clearTimeout(settlementTimerRef.current);
      settlementTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setTimeRemaining(0);
  }, [currentPriceRef, evaluateBet, calculatePayout]);

  /**
   * Calculate win rate percentage
   * Only counts wins vs losses (excludes ties from calculation)
   */
  const calculateWinRate = (wins: number, losses: number): number => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  /**
   * Start settlement countdown
   * TODO: Implement countdown timer
   * - Update timeRemaining every 100ms
   * - Trigger settlement after 3 seconds
   */
  const startSettlementTimer = useCallback(() => {
    // TODO: Implement
    const startTime = Date.now();
    const endTime = startTime + SETTLEMENT_DELAY;

    // Update countdown every 100ms
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    }, 100);

    // Trigger settlement after delay
    settlementTimerRef.current = setTimeout(() => {
      settleBet();
    }, SETTLEMENT_DELAY);
  }, [settleBet]);

  /**
   * Place a new bet
   * Uses functional state updates to avoid stale closure bugs
   * - Validate (no active bet, sufficient funds)
   * - Create bet object
   * - Deduct from bankroll
   * - Start settlement timer
   */
  const placeBet = useCallback((direction: BetDirection, amount: BetAmount) => {
    // Check current price available
    if (!currentPrice) {
      console.warn('Cannot place bet: price not available');
      return;
    }

    // Check WebSocket connected
    if (!isConnected) {
      console.warn('Cannot place bet: not connected to price feed');
      return;
    }

    // Create bet
    const bet: Bet = {
      id: crypto.randomUUID(),
      direction,
      amount,
      entryPrice: currentPrice,
      entryTime: Date.now(),
      status: 'pending',
      result: 'pending',
    };

    // Update state with validation inside functional update
    setGameState(prev => {
      // Check no active bet
      if (prev.activeBet !== null) {
        console.warn('Cannot place bet: bet already active');
        return prev;
      }

      // Check sufficient bankroll
      if (prev.bankroll < amount) {
        console.warn('Cannot place bet: insufficient bankroll');
        return prev;
      }

      return {
        ...prev,
        activeBet: bet,
        bankroll: prev.bankroll - amount, // Deduct immediately
        lastPlayedAt: Date.now()
      };
    });

    // Start settlement timer
    startSettlementTimer();
  }, [currentPrice, isConnected, startSettlementTimer]);

  /**
   * Handle WebSocket disconnection during active bet
   * TODO: Implement disconnection handling
   * - Refund bet amount if disconnected
   */
  useEffect(() => {
    if (!isConnected && gameState.activeBet) {
      console.warn('WebSocket disconnected during active bet - refunding');

      // Refund the bet amount
      setGameState(prev => ({
        ...prev,
        activeBet: null,
        bankroll: prev.bankroll + (prev.activeBet?.amount || 0)
      }));

      // Clear timers
      if (settlementTimerRef.current) {
        clearTimeout(settlementTimerRef.current);
        settlementTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setTimeRemaining(0);
    }
  }, [isConnected, gameState.activeBet]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (settlementTimerRef.current) {
        clearTimeout(settlementTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const canPlaceBet =
    gameState.activeBet === null &&
    gameState.bankroll >= 50 &&
    currentPrice !== null &&
    isConnected;

  const isSettling = gameState.activeBet !== null;

  return {
    gameState,
    placeBet,
    canPlaceBet,
    isSettling,
    timeRemaining
  };
}