export default function PricingPreviewSection() {
  const tiers = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for beginners exploring prediction markets",
      features: [
        "Access to 100+ markets",
        "Basic market analytics",
        "Community support",
        "Email notifications",
        "Portfolio tracking"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "Advanced tools for serious traders",
      features: [
        "Access to 500+ markets",
        "AI-powered strategy configuration",
        "Real-time data streaming",
        "Advanced analytics & charts",
        "Kelly Criterion bet sizing",
        "Priority support",
        "API access"
      ],
      cta: "Join Waitlist",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For institutions and high-volume traders",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "White-label options",
        "Advanced risk management",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ]

  return (
    <section id="pricing" className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
              Pricing
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your trading style
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, index) => (
            <div key={index} className="relative">
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="badge badge-primary px-4 py-1.5 whitespace-nowrap">Most Popular</span>
                </div>
              )}
              <div
                className={`panel p-8 ${
                  tier.highlighted
                    ? 'border-cyan-500 border-2'
                    : 'border-slate-800'
                }`}
              >

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  {tier.name}
                </h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-mono text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-base text-muted-foreground font-mono">
                    {tier.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <span className="text-cyan-400 text-lg">✓</span>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#signup"
                className={`block w-full text-center py-3 font-medium transition-colors ${
                  tier.highlighted
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {tier.cta}
              </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-mono">
            All plans include 14-day free trial • No credit card required
          </p>
        </div>
      </div>
    </section>
  )
}
