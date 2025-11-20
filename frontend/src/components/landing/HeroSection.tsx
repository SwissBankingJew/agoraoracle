import { useState, useEffect } from 'react'
import { PriceChart, BettingControls, GameStats, BetHistory } from '../game'
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket'
import { useWaitlistGame } from '@/hooks/useWaitlistGame'
import { useGameStatePersistence } from '@/hooks/useGameStatePersistence'

export default function HeroSection() {
  const [isGameStarted, setIsGameStarted] = useState(false)

  // localStorage persistence
  const { saveGameState, loadGameState } = useGameStatePersistence()

  // WebSocket connection for real-time BTC prices
  const {
    currentPrice,
    currentPriceRef,
    priceHistory,
    isConnected,
    error,
    connect,
    disconnect
  } = useBinanceWebSocket()

  // Game state management with localStorage persistence
  const {
    gameState,
    placeBet,
    canPlaceBet,
    timeRemaining
  } = useWaitlistGame({
    currentPrice,
    currentPriceRef,
    isConnected,
    initialState: loadGameState() || undefined
  })

  const handleStartGame = () => {
    setIsGameStarted(true)
    // Connect to Binance WebSocket when game starts
    connect()
  }

  // Auto-save game state to localStorage whenever it changes
  useEffect(() => {
    if (isGameStarted && gameState.totalBets > 0) {
      saveGameState(gameState)
    }
  }, [gameState, isGameStarted, saveGameState])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (isGameStarted) {
        disconnect()
      }
    }
  }, [isGameStarted, disconnect])
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-background to-background"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 mb-8">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            Professional Prediction Market Oracle
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
          Bloomberg-Grade Analytics
          <br />
          <span className="text-cyan-400">For Prediction Markets</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
          AI-powered trading strategies, real-time market data, and institutional-grade
          tools for the next generation of prediction market traders.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#signup"
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Join Waitlist
          </a>
          <a
            href="#features"
            className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Learn More
          </a>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-slate-800">
          <div>
            <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">500+</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Markets</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">24/7</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Real-Time Data</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">AI</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Powered</div>
          </div>
        </div>

        {/* Bitcoin Game Dashboard */}
        <div className="mt-16 panel p-2">
          <div className="panel-header flex items-center justify-between mb-0">
            <span>BITCOIN PREDICTION GAME</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            </div>
          </div>

          {!isGameStarted ? (
            /* Initial State - Start Game */
            <div className="bg-slate-950 p-12 flex items-center justify-center min-h-[400px] border-t border-slate-800">
              <div className="text-center max-w-2xl space-y-6">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-2xl font-bold text-foreground">
                  Try It Now - Bitcoin Prediction Game
                </h3>
                <p className="text-muted-foreground">
                  Practice trading with $1,000 virtual cash and real-time Bitcoin prices.
                  No signup required to play.
                </p>

                <button
                  onClick={handleStartGame}
                  className="btn-primary bg-primary hover:bg-primary/80 px-8 py-4 text-lg font-bold mt-4"
                >
                  Start Game - Free Trial
                </button>

                <div className="grid grid-cols-3 gap-6 pt-6">
                  <div className="space-y-1">
                    <div className="text-xl">💰</div>
                    <div className="text-xs text-foreground font-semibold">$1,000 Virtual Cash</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl">📊</div>
                    <div className="text-xs text-foreground font-semibold">Real-Time Data</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl">⚡</div>
                    <div className="text-xs text-foreground font-semibold">3s Settlement</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Active Game State */
            <div className="bg-slate-950 p-6 border-t border-slate-800">
              {/* WebSocket Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-negative/10 border border-negative/20 rounded">
                  <p className="text-sm text-negative">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Chart & Controls */}
                <div className="lg:col-span-2 space-y-4">
                  <PriceChart
                    priceHistory={priceHistory}
                    currentPrice={currentPrice}
                    activeBet={gameState.activeBet}
                    isConnected={isConnected}
                  />
                  <BettingControls
                    bankroll={gameState.bankroll}
                    onBet={placeBet}
                    disabled={!canPlaceBet}
                    activeBet={gameState.activeBet}
                    timeRemaining={timeRemaining}
                  />
                </div>

                {/* Right Column: Stats & History */}
                <div className="space-y-4">
                  <GameStats
                    bankroll={gameState.bankroll}
                    winRate={gameState.winRate}
                    totalBets={gameState.totalBets}
                    currentPrice={currentPrice}
                  />
                  <BetHistory betHistory={gameState.betHistory} />
                </div>
              </div>

              {/* CTA to Save Progress */}
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded text-center">
                <p className="text-sm text-foreground font-semibold">
                  💾 Join our waitlist below to save your progress and get early access
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
