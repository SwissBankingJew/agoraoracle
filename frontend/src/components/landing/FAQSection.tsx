import { useState } from 'react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What is Agora Oracle?",
      answer: "Agora Oracle is a professional trading platform for prediction markets, featuring Bloomberg Terminal-inspired analytics, AI-powered strategy configuration, and real-time market data. We provide institutional-grade tools for traders at all levels."
    },
    {
      question: "How does AI strategy configuration work?",
      answer: "Simply describe your trading approach in natural language (e.g., 'I want to follow markets with high confidence'). Our AI will map your intent to one of three curated strategies and generate validated parameters. You can review and adjust these parameters inline before activating your strategy."
    },
    {
      question: "What markets can I trade?",
      answer: "We support 500+ prediction markets across politics, sports, crypto, economics, and science. Markets are sourced from leading platforms like Polymarket, with real-time price feeds and comprehensive analytics for each market."
    },
    {
      question: "Do I need trading experience?",
      answer: "No! Our AI-guided approach makes professional trading accessible to beginners, while power users can leverage advanced features like Kelly Criterion bet sizing, custom position management, and detailed risk analytics."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption for all data transmission and storage. We never share your trading data or personal information with third parties. All financial transactions are processed through secure, regulated payment providers."
    },
    {
      question: "When will Agora Oracle launch?",
      answer: "We're currently in private beta development. Waitlist members will be the first to get early access and will receive priority onboarding. Join the waitlist to stay updated on our launch timeline and feature announcements."
    }
  ]

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
              FAQ
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Agora Oracle
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="panel overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-lg font-medium text-foreground pr-8">
                  {faq.question}
                </span>
                <span className="text-cyan-400 text-2xl flex-shrink-0">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 border-t border-slate-800 pt-4 animate-slide-up">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 pt-16 border-t border-slate-800">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Still have questions?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join our waitlist and we'll be in touch with more details.
          </p>
          <a href="#signup" className="btn-primary text-base px-8 py-3">
            Join Waitlist
          </a>
        </div>
      </div>
    </section>
  )
}
