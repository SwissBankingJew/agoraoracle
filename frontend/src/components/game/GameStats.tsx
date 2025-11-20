import React from 'react';

interface GameStatsProps {
  bankroll: number;
  winRate: number;
  totalBets: number;
  currentPrice: number | null;
}

/**
 * Game statistics dashboard
 * - Current bankroll
 * - Win rate percentage
 * - Total bets counter
 * - Current BTC price with flash animation
 */
const GameStats: React.FC<GameStatsProps> = ({
  bankroll,
  winRate,
  totalBets,
  currentPrice
}) => {

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-foreground font-mono">Game Stats</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Bankroll */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Bankroll</span>
          <span className="text-foreground font-mono text-lg font-bold">
            ${bankroll.toFixed(2)}
          </span>
        </div>

        {/* Win Rate */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Win Rate</span>
          <span className={`font-mono text-lg ${
            winRate >= 50 ? 'text-positive' : 'text-negative'
          }`}>
            {winRate}%
          </span>
        </div>

        {/* Total Bets */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Total Bets</span>
          <span className="text-foreground font-mono">
            {totalBets}
          </span>
        </div>

        {/* Current Price */}
        <div className="pt-3 mt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">BTC Price</span>
            <span className="text-primary font-mono text-lg data-flash">
              {currentPrice ? `$${currentPrice.toLocaleString()}` : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStats;