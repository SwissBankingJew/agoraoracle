export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Describe Your Strategy",
      description: "Chat with our AI to configure your trading strategy in natural language. No complex forms or technical jargon required.",
      code: '> "Follow markets with high confidence"'
    },
    {
      step: "02",
      title: "Review & Optimize",
      description: "AI generates validated parameters for your chosen strategy. Edit inline, get instant feedback, and optimize for your risk profile.",
      code: 'Strategy: Go with the Crowd\nmin_probability: 0.75'
    },
    {
      step: "03",
      title: "Browse Markets",
      description: "Explore 500+ prediction markets with advanced filtering. Sort by volume, probability, liquidity, or let AI find opportunities for you.",
      code: 'Markets: 523 | Volume: $12.3M'
    },
    {
      step: "04",
      title: "Execute & Track",
      description: "Place trades with Kelly Criterion sizing, track real-time P&L, and analyze portfolio performance with institutional-grade metrics.",
      code: 'P&L: +$1,247 | Win Rate: 68%'
    }
  ]

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
              How It Works
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            From Strategy to Profit in 4 Steps
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered workflow makes professional trading accessible to everyone
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 items-center`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-6xl font-bold font-mono text-cyan-500/20">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terminal Window */}
              <div className="flex-1 w-full">
                <div className="panel p-2">
                  <div className="panel-header flex items-center justify-between mb-0">
                    <span className="text-xs">TERMINAL</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-6 border-t border-slate-800">
                    <pre className="text-sm font-mono text-cyan-400 whitespace-pre-wrap">
                      {item.code}
                    </pre>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground font-mono">READY</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 pt-16 border-t border-slate-800">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to get started?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join the waitlist and be among the first to experience professional prediction market trading.
          </p>
          <a href="#signup" className="btn-primary text-base px-8 py-3">
            Join Waitlist Now
          </a>
        </div>
      </div>
    </section>
  )
}
