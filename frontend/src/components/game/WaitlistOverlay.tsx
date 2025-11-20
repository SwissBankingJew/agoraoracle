import React, { useState, useEffect } from 'react';
import PriceChart from './PriceChart';
import BettingControls from './BettingControls';
import GameStats from './GameStats';
import BetHistory from './BetHistory';

interface WaitlistOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: (email: string) => void;
}

/**
 * Main game modal container
 * - Non-dismissible overlay (must sign up to close)
 * - Contains all game components
 * - Manages WebSocket connection and game state
 */
const WaitlistOverlay: React.FC<WaitlistOverlayProps> = ({
  isOpen,
  onClose,
  onSignupSuccess
}) => {
  // TODO: Implement WebSocket connection
  // TODO: Implement game state management
  // TODO: Implement email signup form

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Modal Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-background border border-border rounded-lg w-full max-w-6xl">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-mono text-foreground">
              Bitcoin Prediction Game
            </h2>
            <p className="text-muted-foreground mt-2">
              Predict BTC price movements and join our waitlist!
            </p>
          </div>

          {/* Game Content */}
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

            {/* Email Signup Form */}
            <div className="mt-6 p-4 border border-border rounded">
              {/* TODO: Implement email form */}
              <p className="text-center text-muted-foreground">
                Email signup form will go here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistOverlay;