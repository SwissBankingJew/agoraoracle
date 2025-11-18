export default function HeroSection() {
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

        {/* Terminal Preview mockup placeholder */}
        <div className="mt-16 panel p-2">
          <div className="panel-header flex items-center justify-between mb-0">
            <span>MARKET ANALYTICS</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            </div>
          </div>
          <div className="bg-slate-950 p-8 flex items-center justify-center min-h-[400px] border-t border-slate-800">
            <div className="text-center">
              <div className="inline-block animate-pulse">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              </div>
              <p className="text-sm font-mono text-cyan-400">Terminal Dashboard Preview</p>
              <p className="text-xs text-muted-foreground mt-2">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
