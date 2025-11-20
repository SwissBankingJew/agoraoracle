/**
 * Type definitions for the Bitcoin prediction game
 */

export type BetDirection = 'UP' | 'DOWN';
export type BetStatus = 'pending' | 'settled';
export type BetResult = 'win' | 'loss' | 'pending';
export type BetAmount = 50 | 100 | 250;

export interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
}

export interface Bet {
  id: string;
  direction: BetDirection;
  amount: BetAmount;
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  status: BetStatus;
  result: BetResult;
  pnl?: number;
}

export interface GameState {
  bankroll: number;
  initialBankroll: number;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  activeBet: Bet | null;
  betHistory: Bet[];
  isPlaying: boolean;
  lastPlayedAt?: number;
}

export interface GameStats {
  bankroll: number;
  winRate: number;
  totalBets: number;
  finalBankroll?: number;
}

export interface BinanceTradeEvent {
  e: string;  // Event type
  E: number;  // Event time
  s: string;  // Symbol
  p: string;  // Price
  q: string;  // Quantity
  T: number;  // Trade time
  m: boolean; // Is buyer maker
  M: boolean; // Ignore
}