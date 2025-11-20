import { useCallback } from 'react';
import type { GameState } from '@/types/game';

const STORAGE_KEY = 'agoraoracle_game_state';
const EXPIRY_DAYS = 7;

interface PersistedGameState {
  state: GameState;
  timestamp: number;
  version: number;
}

/**
 * Custom hook for persisting game state to localStorage
 *
 * Features:
 * - Auto-save game state to localStorage
 * - Load state on mount with validation
 * - Auto-expiry after 7 days
 * - Version tracking for future migrations
 */
export function useGameStatePersistence() {
  /**
   * Save game state to localStorage
   */
  const saveGameState = useCallback((state: GameState) => {
    try {
      const persistedData: PersistedGameState = {
        state,
        timestamp: Date.now(),
        version: 1
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
    } catch (error) {
      console.error('Failed to save game state to localStorage:', error);
    }
  }, []);

  /**
   * Load game state from localStorage
   * Returns null if no valid state found
   */
  const loadGameState = useCallback((): GameState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed: PersistedGameState = JSON.parse(stored);

      // Check if data is expired (7 days)
      const now = Date.now();
      const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (now - parsed.timestamp > expiryTime) {
        console.log('Game state expired, clearing localStorage');
        clearGameState();
        return null;
      }

      // Validate state structure
      if (!isValidGameState(parsed.state)) {
        console.warn('Invalid game state in localStorage, clearing');
        clearGameState();
        return null;
      }

      return parsed.state;
    } catch (error) {
      console.error('Failed to load game state from localStorage:', error);
      clearGameState();
      return null;
    }
  }, []);

  /**
   * Clear game state from localStorage
   */
  const clearGameState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear game state from localStorage:', error);
    }
  }, []);

  /**
   * Validate game state structure
   */
  const isValidGameState = (state: any): state is GameState => {
    return (
      state !== null &&
      typeof state === 'object' &&
      typeof state.bankroll === 'number' &&
      typeof state.totalBets === 'number' &&
      typeof state.wins === 'number' &&
      typeof state.losses === 'number' &&
      typeof state.winRate === 'number' &&
      Array.isArray(state.betHistory)
    );
  };

  return {
    saveGameState,
    loadGameState,
    clearGameState
  };
}
