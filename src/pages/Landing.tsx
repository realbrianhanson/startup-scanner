import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Target, Users, DollarSign, Lightbulb, CalendarCheck, TrendingUp, Sparkles, Check, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";
import { trackEvent } from "@/lib/analytics";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Validifier — Know If Your Idea Will Work Before You Build It";
    trackEvent('landing_page_view');

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Validifier",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "AI-powered business idea validation platform. Analyzes your idea across 14 strategic frameworks and returns a full validation report with viability score, competitor analysis, financial projections, and action plan in 90 seconds.",
      "url": "https://startup-scanner.lovable.app",
      "offers": [
        { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
        { "@type": "Offer", "price": "29", "priceCurrency": "USD", "name": "Starter" },
        { "@type": "Offer", "price": "79", "priceCurrency": "USD", "name": "Growth" },
        { "@type": "Offer", "price": "199", "priceCurrency": "USD", "name": "Pro" }
      ],
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const reportSections = [
    { icon: Target, title: "Viability Score", desc: "A 0–100 score based on 6 weighted factors including market size, competition intensity, and financial viability" },
    { icon: TrendingUp, title: "Market Intelligence", desc: "TAM/SAM/SOM sizing with growth rates, timing assessment, and emerging trends in your space" },
    { icon: Users, title: "Competitor Breakdown", desc: "Real companies by name with their strengths, weaknesses, and the gap you can exploit" },
    { icon: Sparkles, title: "Customer Personas", desc: "3 detailed profiles with pain points, objections, and exactly how to sell to each one" },
    { icon: DollarSign, title: "Financial Model", desc: "Startup cost scenarios, unit economics, revenue projections, and break-even estimate" },
    { icon: Lightbulb, title: "Game-Changing Enhancement", desc: "An AI-generated strategic twist that could 10x your idea's potential" },
    { icon: CalendarCheck, title: "30-Day Action Plan", desc: "Week-by-week plan with specific daily actions — not generic advice" },
  ];

  return (
    <div className="min-h-screen animate-fade-in" style={{ opacity: 1 }}>
      {/* Navigation */}
      <nav className="glass-nav-dark sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => navigate("/")}
          >
            <BarChart3 className="h-8 w-8 text-[hsl(221,83%,53%)]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(265,71%,57%)] bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/pricing")} className="text-white/70 hover:text-white hover:bg-white/10 animate-fade-down delay-100">
              Pricing
            </Button>
            <button onClick={() => navigate("/auth")} className="text-white/60 hover:text-white text-sm transition-colors animate-fade-down delay-150">
              Log in
            </button>
            <Button onClick={() => { trackEvent('cta_click', { button: 'nav_start', page: 'landing' }); navigate("/auth"); }} className="shadow-medium animate-fade-down delay-200">
              Start Analyzing
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[hsl(222,47%,8%)] py-28 md:py-40">
        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(221 83% 53% / 0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Floating gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
          <div className="absolute top-[10%] -left-24 w-[300px] h-[300px] rounded-full bg-primary opacity-[0.08] dark:opacity-[0.12] blur-[120px] animate-float float-slow will-change-transform" />
          <div className="absolute bottom-[15%] -right-20 w-[250px] h-[250px] rounded-full bg-secondary opacity-[0.08] dark:opacity-[0.12] blur-[100px] animate-float float-slower will-change-transform" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[60%] left-[30%] w-[200px] h-[200px] rounded-full bg-primary opacity-[0.06] dark:opacity-[0.10] blur-[120px] animate-float float-slowest will-change-transform" style={{ animationDelay: "4s" }} />
        </div>

        <div className="noise-bg absolute inset-0" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white animate-fade-up leading-[1.05]">
                Know if your idea will work
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-[hsl(221,83%,53%)] via-[hsl(265,71%,67%)] to-[hsl(221,83%,53%)] bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                  — before you build it
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/45 max-w-2xl mx-auto animate-fade-up delay-200 leading-relaxed">
                Validifier runs your business idea through 14 strategic frameworks and returns a full validation report with a viability score, real competitor analysis, financial projections, and a 30-day action plan.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 animate-fade-up delay-400">
              <Button
                size="lg"
                onClick={() => { trackEvent('cta_click', { button: 'hero_analyze', page: 'landing' }); navigate("/auth"); }}
                className="text-lg px-10 py-7 shadow-large animate-pulse-glow"
              >
                Analyze Your First Idea — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-white/30">No credit card. Report ready in ~90 seconds.</p>
            </div>

            {/* Product Preview */}
            <div className="animate-fade-up delay-600 pt-4">
              <div className="max-w-2xl mx-auto glass rounded-2xl p-6 md:p-8 border border-white/[0.08]" style={{ transform: "perspective(1200px) rotateX(4deg)" }}>
                {/* Browser chrome */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">validifier.com/report/ai-pet-care</span>
                </div>

                {/* Report header with score */}
                <div className="flex items-start justify-between mb-5">
                  <div className="space-y-1.5 text-left">
                    <div className="text-sm font-semibold text-white/70">AI-Powered Pet Care</div>
                    <div className="text-[10px] text-white/30">Pet Services · Validation Report</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-extrabold font-mono tabular-nums text-[hsl(142,71%,45%)]">78</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-wider">Viability Score</div>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-2.5 mb-5">
                  {[
                    { label: "Market Size", pct: "82%", color: "bg-[hsl(142,71%,45%)]/40" },
                    { label: "Competition", pct: "58%", color: "bg-[hsl(38,92%,50%)]/40" },
                    { label: "Feasibility", pct: "85%", color: "bg-[hsl(221,83%,53%)]/40" },
                    { label: "Financial Viability", pct: "72%", color: "bg-[hsl(265,71%,57%)]/40" },
                  ].map((bar) => (
                    <div key={bar.label} className="flex items-center space-x-3">
                      <span className="text-[9px] text-white/35 w-20 text-right">{bar.label}</span>
                      <div className={`h-2 rounded-full ${bar.color} flex-1`} style={{ maxWidth: bar.pct }} />
                    </div>
                  ))}
                </div>

                {/* Section nav tabs */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {["Summary", "Market", "Competitors", "Personas", "Financials", "Action Plan"].map((tab, i) => (
                    <div key={tab} className={`h-6 px-3 rounded text-[9px] flex items-center ${i === 0 ? 'bg-white/10 text-white/60' : 'bg-white/[0.04] text-white/25'}`}>
                      {tab}
                    </div>
                  ))}
                </div>

                {/* Blurred report body */}
                <div className="space-y-2 filter blur-[3px] select-none">
                  <div className="h-3 w-full rounded bg-white/[0.06]" />
                  <div className="h-3 w-[90%] rounded bg-white/[0.05]" />
                  <div className="h-3 w-[75%] rounded bg-white/[0.04]" />
                  <div className="h-3 w-[85%] rounded bg-white/[0.05]" />
                </div>
              </div>
            </div>

            {/* Social proof — honest */}
            <div className="animate-fade-up delay-700 pt-4">
              <div className="flex items-center justify-center space-x-2 text-white/40">
                <Globe className="h-4 w-4" />
                <span className="text-sm">Used by founders in 47 industries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Inside Your Report */}
      <ScrollReveal>
        <section id="features" className="py-24 md:py-32 bg-background relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16 animate-fade-up">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                  What's inside your validation report
                </h2>
                <div className="mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>

              <div className="space-y-1">
                {reportSections.map((section, index) => (
                  <div
                    key={index}
                    className={`group flex items-start gap-5 p-5 rounded-xl transition-all duration-300 hover:bg-muted/50 animate-fade-up`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How It Works — simplified flow */}
      <ScrollReveal>
        <section id="how-it-works" className="py-20 md:py-28 bg-gradient-subtle relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-14 animate-fade-up">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                  How it works
                </h2>
                <div className="mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 animate-fade-up delay-200">
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">Describe your idea in a few sentences</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block shrink-0" />
                <div className="text-center text-muted-foreground md:hidden text-sm">↓</div>
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">Validifier analyzes it across 14 frameworks</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block shrink-0" />
                <div className="text-center text-muted-foreground md:hidden text-sm">↓</div>
                <div className="text-center md:text-left">
                  <p className="font-semibold text-lg">Get your full report in ~90 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Pricing — two tiers side by side */}
      <ScrollReveal>
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-extrabold tracking-tight">Straightforward pricing</h2>
                <p className="text-lg text-muted-foreground">
                  Your first report is free. Upgrade when you need deeper analysis.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Free */}
                <div className="rounded-2xl border border-border p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">Free</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-extrabold font-mono">$0</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {["1 validation report per month", "Standard AI analysis (Gemini 3 Flash)", "All 12 report sections included", "AI advisor chat (10 messages)", "PDF export"].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                    Start Free
                  </Button>
                </div>

                {/* Pro */}
                <div className="relative rounded-2xl border-2 border-primary p-8 space-y-6 shadow-lg">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-medium">
                    Most popular
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Pro</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-extrabold font-mono">$29</span>
                      <span className="text-muted-foreground text-sm ml-1">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {["5 validation reports per month", "Premium AI analysis (Gemini 3.1 Pro)", "All sections + Game-Changing Idea + Action Plan", "AI advisor chat (unlimited)", "Real competitor names and market data", "Detailed financial projections", "PDF + Markdown export", "Priority email support"].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" onClick={() => navigate("/auth")}>
                    Start 7-Day Free Trial
                  </Button>
                </div>
              </div>

              <p className="text-center mt-8 text-sm text-muted-foreground">
                <button onClick={() => navigate("/pricing")} className="text-primary hover:underline cursor-pointer">
                  See full pricing details →
                </button>
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Sample Report CTA (replaces fake testimonials) */}
      <ScrollReveal>
        <section className="py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                See what you'll get
              </h2>
              <p className="text-muted-foreground text-lg">
                Browse a complete validation report — every section, every framework, every data point. No sign-up required.
              </p>
              <Button
                size="lg"
                onClick={() => { trackEvent('cta_click', { button: 'sample_report', page: 'landing' }); navigate("/sample-report"); }}
                variant="outline"
                className="text-lg px-8 py-6"
              >
                <Star className="mr-2 h-5 w-5" />
                View Sample Report
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Your idea deserves more than a gut feeling.
          </h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
            Most startups fail because the founder didn't validate first. Validifier gives you the analysis in 90 seconds that used to take a consulting firm 3 weeks.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => { trackEvent('cta_click', { button: 'final_cta', page: 'landing' }); navigate("/auth"); }}
            className="text-lg px-8 py-6 shadow-large"
          >
            Analyze Your Idea Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Validifier</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Pricing</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy</button>
              <button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Terms</button>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025-2026 Validifier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Missing import used inline
const Globe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);

export default Landing;
