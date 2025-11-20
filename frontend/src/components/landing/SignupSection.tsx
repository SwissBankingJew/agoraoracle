import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useGameStatePersistence } from '@/hooks/useGameStatePersistence'

interface WaitlistStats {
  total_signups: number
  recent_signups_24h: number
  recent_signups_7d: number
}

export default function SignupSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // localStorage persistence
  const { loadGameState, clearGameState } = useGameStatePersistence()

  // Load game state to check if user played
  const gameState = loadGameState()

  // Fetch waitlist stats
  const { data: stats } = useQuery<WaitlistStats>({
    queryKey: ['waitlist-stats'],
    queryFn: async () => {
      const response = await axios.get('/api/waitlist/stats')
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (email: string) => {
      // Include game stats if user played
      const payload: any = {
        email,
        source: 'landing_page',
      }

      if (gameState) {
        payload.game_played = true
        payload.final_bankroll = gameState.bankroll
        payload.total_bets = gameState.totalBets
        payload.win_rate = gameState.winRate
      }

      const response = await axios.post('/api/waitlist', payload)
      return response.data
    },
    onSuccess: () => {
      setSubmitted(true)
      setEmail('')
      // Clear game state from localStorage after successful signup
      clearGameState()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && !signupMutation.isPending) {
      signupMutation.mutate(email)
    }
  }

  return (
    <section id="signup" className="py-24 bg-slate-950">
      <div className="max-w-4xl mx-auto px-6">
        <div className="panel p-12">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Join the Waitlist
                </h2>
                <p className="text-xl text-muted-foreground">
                  Be among the first to experience professional prediction market trading
                </p>
              </div>

              {/* Game Stats Preview */}
              {gameState && gameState.totalBets > 0 && (
                <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded">
                  <div className="text-center mb-3">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Save Your Game Progress
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Join the waitlist to save your stats and get early access
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className={`text-lg font-bold font-mono ${
                        gameState.bankroll > 1000 ? 'text-positive' :
                        gameState.bankroll < 1000 ? 'text-negative' : 'text-foreground'
                      }`}>
                        ${gameState.bankroll.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold font-mono ${
                        gameState.winRate >= 50 ? 'text-positive' : 'text-negative'
                      }`}>
                        {gameState.winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono text-foreground">
                        {gameState.totalBets}
                      </div>
                      <div className="text-xs text-muted-foreground">Bets</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-slate-950 border border-slate-700 text-foreground px-4 py-3 focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                    disabled={signupMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={signupMutation.isPending || !email}
                    className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {signupMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>

                {/* Error Message */}
                {signupMutation.isError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {axios.isAxiosError(signupMutation.error) && signupMutation.error.response?.data?.detail
                      ? signupMutation.error.response.data.detail
                      : 'Failed to join waitlist. Please try again.'}
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-4">
                  We'll notify you when we launch. No spam, ever.
                </p>
              </form>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800">
                  <div className="text-center">
                    <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">
                      {stats.total_signups.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total Signups
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">
                      +{stats.recent_signups_24h}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Last 24 Hours
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold font-mono text-cyan-400 mb-1">
                      +{stats.recent_signups_7d}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      Last 7 Days
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-cyan-500/10 border-2 border-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                You're on the list!
              </h3>
              <p className="text-muted-foreground mb-8">
                {gameState && gameState.totalBets > 0 ? (
                  <>
                    Your game stats have been saved! We'll send you an email when we launch.
                    {gameState.winRate >= 50 && gameState.bankroll > 1000 && (
                      <span className="block mt-2 text-positive font-semibold">
                        Great performance - {gameState.winRate}% win rate!
                      </span>
                    )}
                  </>
                ) : (
                  "We'll send you an email when we launch. Get ready to trade like a pro."
                )}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="btn-ghost text-sm"
              >
                Sign up another email
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
