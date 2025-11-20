export default function FeaturesSection() {
  const features = [
    {
      title: "AI-Powered Strategy Configuration",
      description: "Natural language trading strategy setup powered by advanced LLMs. Just describe your approach and get validated, optimized parameters instantly.",
      stats: "3 Curated Strategies"
    },
    {
      title: "Bloomberg Terminal Aesthetic",
      description: "Professional-grade interface designed for serious traders. High information density with real-time updates and institutional-quality visualizations.",
      stats: "Real-Time Analytics"
    },
    {
      title: "Advanced Market Intelligence",
      description: "AI-generated insights with confidence scoring. Track strong signals, trending markets, and dip opportunities across 500+ prediction markets.",
      stats: "500+ Markets"
    },
    {
      title: "Real-Time Data Streaming",
      description: "Live price feeds with WebSocket integration. Auto-reconnection, sub-second latency, and comprehensive market data for informed decision-making.",
      stats: "Sub-Second Updates"
    },
    {
      title: "Portfolio Management",
      description: "Track your positions with real-time P&L, equity curves, and risk metrics. Sharpe ratio, max drawdown, and win rate analytics built-in.",
      stats: "Institutional Metrics"
    },
    {
      title: "Kelly Criterion Bet Sizing",
      description: "Mathematical optimal position sizing based on your edge and risk profile. Conservative, balanced, or aggressive presets for every trader.",
      stats: "Optimal Sizing"
    }
  ]

  return (
    <section id="features" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
              Features
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Professional Trading Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to trade prediction markets like a professional
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="panel p-6 hover:border-cyan-500/30 transition-colors">
              {/* Title */}
              <div className="flex items-start justify-between mb-4">
                <span className="badge badge-primary font-mono text-xs">{feature.stats}</span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-3">
                {feature.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a href="#signup" className="btn-primary text-base px-8 py-3">
            Get Early Access
          </a>
        </div>
      </div>
    </section>
  )
}
