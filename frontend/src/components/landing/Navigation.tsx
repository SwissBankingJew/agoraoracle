export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-500 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-lg font-mono">A</span>
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            AGORA ORACLE
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors uppercase tracking-wider"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors uppercase tracking-wider"
          >
            How It Works
          </a>
          <a
            href="#faq"
            className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors uppercase tracking-wider"
          >
            FAQ
          </a>
        </div>

        {/* CTA Button */}
        <div className="flex items-center space-x-4">
          <a
            href="#signup"
            className="btn-primary text-sm"
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </nav>
  )
}
