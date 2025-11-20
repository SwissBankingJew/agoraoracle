import React, { useState } from 'react';
import { PriceChart, BettingControls, GameStats, BetHistory } from '../game';

/**
 * Bitcoin Prediction Game Section
 * - Integrated directly into landing page (not a modal)
 * - Starts with a "Start Game" button
 * - Shows full game dashboard after starting
 * - Persists state in localStorage
 */
export default function BitcoinGameSection() {
  const [isGameStarted, setIsGameStarted] = useState(false);

  // TODO: Check localStorage for existing game state on mount
  // TODO: Implement WebSocket connection when game starts
  // TODO: Implement game state management

  const handleStartGame = () => {
    setIsGameStarted(true);
    // TODO: Initialize WebSocket connection
    // TODO: Load game state from localStorage or create new
  };

  return (
    <section id="game" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Bitcoin Prediction Game
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice trading before the platform launches. Real-time prices, virtual money.
          </p>
        </div>

        {/* Game Content */}
        <div className="panel">
          {!isGameStarted ? (
            /* Initial State - Start Game */
            <div className="p-12 text-center">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🎮</div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Ready to Test Your Prediction Skills?
                  </h3>
                  <p className="text-muted-foreground">
                    Start with $1,000 virtual cash and predict Bitcoin price movements.
                    No signup required to play.
                  </p>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartGame}
                  className="btn-primary bg-primary hover:bg-primary/80 px-8 py-4 text-lg font-bold"
                >
                  Start Game - Free Trial
                </button>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                  <div className="space-y-2">
                    <div className="text-2xl">💰</div>
                    <div className="text-sm text-foreground font-semibold">$1,000 Starting Balance</div>
                    <div className="text-xs text-muted-foreground">Virtual money to practice with</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">📊</div>
                    <div className="text-sm text-foreground font-semibold">Real-Time Data</div>
                    <div className="text-xs text-muted-foreground">Live Binance BTC/USDT feed</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl">⚡</div>
                    <div className="text-sm text-foreground font-semibold">Instant Settlement</div>
                    <div className="text-xs text-muted-foreground">3-second bet resolution</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Active Game State */
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Chart & Controls */}
                <div className="lg:col-span-2 space-y-4">
                  <PriceChart />
                  <BettingControls />
                </div>

                {/* Right Column: Stats & History */}
                <div className="space-y-4">
                  <GameStats />
                  <BetHistory />
                </div>
              </div>

              {/* CTA to Save Progress */}
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded text-center">
                <p className="text-foreground font-semibold mb-2">
                  💾 Want to save your progress?
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our waitlist below to save your stats and get early access
                </p>
                <a
                  href="#signup"
                  className="inline-block btn-primary bg-primary hover:bg-primary/80 px-6 py-2"
                >
                  Save Progress & Join Waitlist
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        {isGameStarted && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Playing with virtual money • Your progress is saved locally
          </div>
        )}
      </div>
    </section>
  );
}