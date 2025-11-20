import React from 'react';
import type { Bet } from '@/types/game';

interface BetHistoryProps {
  betHistory: Bet[];
}

/**
 * Recent bet history display
 * - Shows last 5 bets
 * - Entry/exit prices
 * - P&L for each bet
 * - Win/loss status with color coding
 */
const BetHistory: React.FC<BetHistoryProps> = ({ betHistory }) => {

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-foreground font-mono">Recent Bets</h3>
      </div>

      <div className="p-4">
        {betHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No bets placed yet
          </p>
        ) : (
          <div className="space-y-2">
            {betHistory.map((bet) => (
              <div
                key={bet.id}
                className="border border-border rounded p-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className={`font-mono font-bold ${
                    bet.direction === 'UP' ? 'text-positive' : 'text-negative'
                  }`}>
                    {bet.direction} ${bet.amount}
                  </span>
                  <span className={`font-mono ${
                    bet.result === 'win' ? 'text-positive' :
                    bet.result === 'tie' ? 'text-muted-foreground' :
                    'text-negative'
                  }`}>
                    {bet.result === 'tie' && '≈ '}
                    {bet.pnl && bet.pnl > 0 ? '+' : ''}{bet.pnl?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Entry: ${bet.entryPrice.toLocaleString()}</span>
                  <span>Exit: ${bet.exitPrice?.toLocaleString() || '--'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BetHistory;