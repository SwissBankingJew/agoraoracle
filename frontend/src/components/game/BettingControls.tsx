import React, { useState } from 'react';
import type { Bet, BetDirection, BetAmount } from '@/types/game';

interface BettingControlsProps {
  bankroll: number;
  onBet: (direction: BetDirection, amount: BetAmount) => void;
  disabled: boolean;
  activeBet: Bet | null;
  timeRemaining: number;
}

/**
 * Betting control panel
 * - UP/DOWN prediction buttons
 * - Stake amount selection ($50, $100, $250)
 * - Disabled during active bet
 * - Shows countdown timer when bet is active
 */
const BettingControls: React.FC<BettingControlsProps> = ({
  bankroll,
  onBet,
  disabled,
  activeBet,
  timeRemaining
}) => {
  const [selectedAmount, setSelectedAmount] = useState<BetAmount>(100);

  const betAmounts: BetAmount[] = [50, 100, 250];
  const isDisabled = disabled || activeBet !== null;

  const handleBet = (direction: BetDirection) => {
    onBet(direction, selectedAmount);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-foreground font-mono">Place Your Bet</h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Select Amount
          </label>
          <div className="flex gap-2">
            {betAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`flex-1 py-2 px-4 rounded font-mono transition-all ${
                  selectedAmount === amount
                    ? 'bg-positive text-background'
                    : 'bg-background border border-border text-foreground hover:border-positive'
                }`}
                disabled={isDisabled}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Direction Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleBet('UP')}
            className="btn-primary bg-positive hover:bg-positive/80 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            ↑ UP
          </button>
          <button
            onClick={() => handleBet('DOWN')}
            className="btn-primary bg-negative hover:bg-negative/80 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          >
            ↓ DOWN
          </button>
        </div>

        {/* Active Bet Status / Info */}
        {activeBet ? (
          <div className="text-center space-y-2">
            <div className="text-foreground font-mono font-bold">
              {activeBet.direction} ${activeBet.amount} @ ${activeBet.entryPrice.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm">
              Settlement in {formatTime(timeRemaining)}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-xs">
            Current bankroll: ${bankroll.toFixed(2)}
            {bankroll < 50 && <span className="text-negative"> (Insufficient funds)</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingControls;