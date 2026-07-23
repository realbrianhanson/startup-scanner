import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, MessageSquare, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { trackEvent } from "@/lib/analytics";
import { PRODUCT_FACTS } from "@/lib/productFacts";
import { DecisionCockpit } from "@/components/landing/DecisionCockpit";
import { DecisionGrid } from "@/components/landing/DecisionGrid";

const F = PRODUCT_FACTS;
const SIGNUP_HREF = "/auth?mode=signup&next=%2Fdashboard";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Validifier — Turn a business idea into a go / no-go decision";
    trackEvent("landing_page_view");

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Validifier",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        `Turn a business idea into a go/no-go decision. A ${F.reportSectionCount}-section decision brief ${F.reportTimeCopy}, covering demand, competition, economics, and your next 30 days.`,
      url: "https://validifier.com",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "29", priceCurrency: "USD", name: "Pro" },
      ],
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const goSignup = (button: string) => {
    trackEvent("cta_click", { button, page: "landing" });
    navigate(SIGNUP_HREF);
  };

  return (
    <div className="landing-dark min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(29,78,216,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-serif tracking-tight text-white shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded"
            aria-label="Validifier home"
          >
            Validifier
          </button>
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
            <a
              href="#report-preview"
              className="hidden md:inline text-sm text-slate-300 hover:text-white transition-colors"
            >
              What you get
            </a>
            <a
              href="#how-it-works"
              className="hidden md:inline text-sm text-slate-300 hover:text-white transition-colors"
            >
              How it works
            </a>
            <button
              onClick={() => navigate("/pricing")}
              className="hidden sm:inline text-sm text-slate-300 hover:text-white transition-colors"
            >
              Pricing
            </button>
            <div className="hidden sm:block"><ThemeToggle /></div>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Log in
            </button>
            <button
              onClick={() => goSignup("nav_start")}
              className="text-sm font-medium px-3 sm:px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Validate idea
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-14 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
            <div className="min-w-0 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/[0.06] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span className="text-[10.5px] font-mono tracking-[0.2em] uppercase text-sky-200/90">
                  AI Business Validation for Founders
                </span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.03em] text-white">
                Turn a business idea into a{" "}
                <span className="text-sky-300">go / no-go decision.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                {`In about ${F.reportTimeRange}, get a ${F.reportSectionCount}-section brief that pressure-tests demand, competition, economics, and your next 30 days.`}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => goSignup("hero_validate")}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Validate my idea — free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#report-preview"
                  onClick={() => trackEvent("cta_click", { button: "hero_see_what", page: "landing" })}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 hover:border-white/30 text-slate-100 font-medium px-5 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  See what you'll get
                </a>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                Full report on the free plan · No credit card · Your idea stays yours.
              </p>
            </div>
            <div className="min-w-0">
              <DecisionCockpit />
            </div>
          </div>
        </section>

        {/* Product proof strip */}
        <section aria-label="Product proof" className="border-y border-white/5 bg-white/[0.015]">
          <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-widest uppercase text-slate-400">
            <span>{F.reportSectionCount} sections</span>
            <span className="text-slate-600">·</span>
            <span>typically {F.reportTimeShort}</span>
            <span className="text-slate-600">·</span>
            <span>0 fluff</span>
          </div>
        </section>

        {/* Decision grid */}
        <section id="what-you-get" className="container mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[-0.02em] text-white">
              Stop collecting opinions.<br />Start collecting evidence.
            </h2>
            <p className="mt-4 text-slate-400 text-base sm:text-lg">
              Every report answers the five questions that decide whether an idea is worth your next month.
            </p>
          </div>
          <DecisionGrid />
        </section>

        {/* Differentiation + report preview */}
        <section id="report-preview" className="container mx-auto px-4 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="min-w-0 space-y-5">
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[-0.02em] text-white">
                Not another chat response.<br />A decision document.
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Generic AI gives you more ideas, caveats, and follow-up questions. Validifier gives you a decision surface.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    <MessageSquare className="h-3 w-3" /> Generic AI
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-400">
                    <li>· More ideas to consider</li>
                    <li>· Caveats and disclaimers</li>
                    <li>· "It depends" answers</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-sky-400/25 bg-sky-400/[0.05] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-sky-300">
                    <FileText className="h-3 w-3" /> Validifier
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-100">
                    <li>· Weighted viability score</li>
                    <li>· Named competitors + market sizing</li>
                    <li>· Unit economics + weekly action plan</li>
                  </ul>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="#what-you-get"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-200 transition-colors"
                >
                  Explore the report structure
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="min-w-0">
              <DecisionCockpit />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="container mx-auto px-4 py-20 sm:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[-0.02em] text-center text-white">
              Idea → Evidence → Decision
            </h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { n: "01", t: "Describe the idea", d: "A few sentences. No pitch deck required." },
                { n: "02", t: "We gather the evidence", d: `${F.reportSectionCount} sections analyzed ${F.reportTimeCopy}.` },
                { n: "03", t: "Make the call", d: "Score, verdict, and the next 30 days on one screen." },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="font-mono text-xs tracking-widest text-sky-300">{s.n}</div>
                  <h3 className="mt-2 text-lg font-medium text-white">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="container mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-slate-950/60 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-sky-300">Start free</div>
                <h3 className="mt-1 text-xl font-medium text-white">One complete report, on us</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Full {F.reportSectionCount}-section brief. No credit card.
                </p>
                <button
                  onClick={() => goSignup("pricing_teaser_free")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-4 py-2 text-sm transition-colors"
                >
                  Get my free report <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="sm:border-l sm:border-white/10 sm:pl-6">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Pro</div>
                <h3 className="mt-1 text-xl font-medium text-white">
                  Deeper analysis from ${F.proPriceMonthly}/mo
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Premium model, more reports, priority support.
                </p>
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "pricing_teaser_pro", page: "landing" });
                    navigate("/pricing");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 hover:border-white/30 text-slate-100 font-medium px-4 py-2 text-sm transition-colors"
                >
                  See pricing <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-24 sm:py-28 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <Sparkles className="h-6 w-6 text-sky-300 mx-auto" aria-hidden />
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-[-0.02em] text-white">
              Get the answer before you spend the money.
            </h2>
            <div>
              <button
                onClick={() => goSignup("final_cta")}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-6 py-3 transition-colors"
              >
                Validate my idea — free
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-xs text-slate-400">
                Full report on the free plan · No credit card · Ready {F.reportTimeCopy}.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-10">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-serif text-base text-slate-300">Validifier</span>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">Pricing</button>
              <button onClick={() => navigate("/privacy")} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => navigate("/terms")} className="hover:text-white transition-colors">Terms</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3 min-w-0">
          <span
            className="text-2xl font-serif cursor-pointer tracking-tight text-foreground shrink-0"
            onClick={() => navigate("/")}
          >
            Validifier
          </span>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => navigate("/pricing")}
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Log in
            </button>
            <button
              onClick={() => {
                trackEvent("cta_click", { button: "nav_start", page: "landing" });
                navigate("/auth?mode=signup&next=%2Fdashboard");
              }}
              className="text-sm font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-px bg-primary text-primary-foreground whitespace-nowrap"
            >
              Start free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background spinning brain video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15 dark:opacity-20 pointer-events-none"
          src="/brain-spin.mp4"
        />
        <div className="absolute inset-0 bg-background/70 dark:bg-background/60" />
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 relative z-10 py-32 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — copy */}
            <div className="space-y-8 max-w-xl min-w-0">
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-0.04em] text-foreground">
                Know if your idea
                <br />
                will work
              </h1>
              <p className="text-base md:text-lg leading-relaxed max-w-lg text-muted-foreground">
                Validifier analyzes your business idea across {F.reportSectionCount} sections and returns a full
                validation report with a viability score, competitor analysis, financial projections,
                and a 30-day action plan.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "hero_analyze", page: "landing" });
                    navigate("/auth?mode=signup&next=%2Fdashboard");
                  }}
                  className="text-base font-medium px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  Analyze Your First Idea — Free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "sample_report", page: "landing" });
                    navigate("/sample-report");
                  }}
                  className="text-sm font-medium px-5 py-3.5 rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:-translate-y-px flex items-center gap-2"
                >
                  See a Sample Report
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60">
                No credit card. Report ready {F.reportTimeCopy}.
              </p>
            </div>

            {/* Right — Product screenshot */}
            <div ref={scoreRef} className="relative min-w-0 w-full max-w-full">
              <div
                className="rounded-xl overflow-hidden border border-border bg-card w-full max-w-full"
                style={{
                  transform: "perspective(1000px) rotateY(-4deg)",
                }}
              >
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <span className="font-mono text-[10px] ml-3 text-muted-foreground/50">
                    validifier.com/report/ai-pet-care
                  </span>
                </div>

                {/* Report content */}
                <div className="p-6">
                  {/* Header + score */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-sm font-medium text-foreground/80">AI-Powered Pet Care</div>
                      <div className="text-xs mt-1 text-muted-foreground/60">Pet Services · Validation Report</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-mono font-bold tabular-nums text-success">
                        {animatedScore}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest mt-0.5 text-muted-foreground/60">
                        Viability
                      </div>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3 mb-6">
                    {[
                      { label: "Market Size", pct: 82, cls: "bg-success" },
                      { label: "Competition", pct: 58, cls: "bg-warning" },
                      { label: "Feasibility", pct: 85, cls: "bg-primary" },
                      { label: "Financials", pct: 72, cls: "bg-primary" },
                    ].map((bar) => (
                      <div key={bar.label} className="flex items-center gap-3">
                        <span className="text-[10px] w-20 text-right font-mono text-muted-foreground/60">
                          {bar.label}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 opacity-70 ${bar.cls}`}
                            style={{
                              width: scoreVisible ? `${bar.pct}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section tabs */}
                  <div className="flex gap-1.5 mb-5">
                    {["Summary", "Market", "Competitors", "Personas", "Financials"].map((tab, i) => (
                      <div
                        key={tab}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono ${
                          i === 0
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground/50"
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  {/* Blurred body */}
                  <div className="space-y-2 select-none" style={{ filter: "blur(3px)" }}>
                    <div className="h-2.5 rounded bg-muted w-full" />
                    <div className="h-2.5 rounded bg-muted w-[88%]" />
                    <div className="h-2.5 rounded bg-muted w-[72%]" />
                    <div className="h-2.5 rounded bg-muted w-[80%]" />
                  </div>
                </div>
              </div>

              {/* Reflection glow */}
              <div className="absolute -bottom-8 left-[10%] right-[10%] h-16 rounded-full blur-[40px] bg-primary/[0.06]" />
            </div>
          </div>

          {/* Product proof */}
          <div className="mt-20 text-center">
            <span className="font-mono text-sm tracking-wide text-muted-foreground/50">
              {F.reportSectionCount} sections · {F.reportTimeShort} · 0 fluff
            </span>
          </div>
        </div>
      </section>

      {/* What's inside your report */}
      <section className="py-32 md:py-40 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] mb-20 text-foreground">
              What's inside your<br />validation report
            </h2>

            <div className="space-y-0">
              {reportSections.map((section, index) => (
                <div
                  key={index}
                  className="py-6 border-t border-border flex items-start gap-6"
                >
                  <span className="font-mono text-xs tabular-nums mt-1 text-muted-foreground/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1.5 text-foreground/90">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {section.desc}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-t border-border" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 md:py-40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-center mb-16 text-foreground">
              How it works
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
              {[
                "Describe your idea in a few sentences",
                `Validifier analyzes it across ${F.reportSectionCount} sections`,
                `Most reports are ready ${F.reportTimeCopy}`,
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 md:gap-0">
                  <p className="text-center text-base font-medium max-w-[220px] text-foreground/80">
                    {step}
                  </p>
                  {i < 2 && (
                    <ArrowRight className="hidden md:block mx-6 shrink-0 text-muted-foreground/40 w-4 h-4" />
                  )}
                  {i < 2 && (
                    <span className="md:hidden text-sm text-muted-foreground/40">↓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 md:py-28 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-center mb-6 text-foreground">
              Straightforward pricing
            </h2>
            <p className="text-center text-base mb-16 text-muted-foreground">
              Your first report is free. Upgrade when you need deeper analysis.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free */}
              <div className="rounded-xl border border-border bg-card p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-foreground/90">Free</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-mono font-bold text-foreground">$0</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    `${F.free.monthlyCredits} credits/mo (about ${F.free.includedStandardReports} Standard report + ${F.free.includedChatMessages} advisor messages)`,
                    "Standard AI analysis (Gemini 3 Flash)",
                    `All ${F.reportSectionCount} report sections, including Game-Changing Idea and 30-Day Action Plan`,
                    "AI advisor chat",
                    "PDF export",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth?mode=signup&next=%2Fdashboard")}
                  className="w-full py-3 rounded-lg text-sm font-medium border border-border text-foreground/80 bg-transparent transition-all duration-200 hover:-translate-y-px"
                >
                  Start Free
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-xl border border-primary/30 bg-card p-8 space-y-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-medium bg-primary text-primary-foreground">
                  Most popular
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground/90">Pro</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-mono font-bold text-foreground">$29</span>
                    <span className="text-sm ml-1 text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    `${F.pro.monthlyCredits} credits/mo (about ${F.pro.includedPremiumReports} Premium reports + ${F.pro.includedChatMessages} advisor messages)`,
                    "Premium AI analysis (Gemini 3.1 Pro — deeper, more specific)",
                    `All ${F.reportSectionCount} report sections with deeper competitive and financial reasoning`,
                    "AI advisor chat with higher monthly volume",
                    "PDF + Markdown export",
                    "Priority email support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/pricing?plan=pro")}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:brightness-110 bg-primary text-primary-foreground"
                >
                  Start {F.proTrialDays}-Day Free Trial
                </button>
              </div>
            </div>

            <p className="text-center mt-8 text-sm">
              <button onClick={() => navigate("/pricing")} className="text-primary transition-colors hover:brightness-110">
                See full pricing details →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* See what a report looks like */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] text-foreground">
                See what a report looks like
              </h2>
              <p className="text-base text-muted-foreground">
                No signup required. See the full analysis for a real business idea.
              </p>
            </div>

            {/* Blurred report preview */}
            <div className="relative rounded-xl overflow-hidden border border-border bg-card">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                </div>
                <span className="font-mono text-[10px] ml-3 text-muted-foreground/50">
                  validifier.com/report/sample
                </span>
              </div>

              {/* Report preview content */}
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-medium text-foreground/80">AI-Powered Pet Care Platform</div>
                    <div className="text-xs mt-1 text-muted-foreground/60">Pet Services · Full Validation Report</div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-mono font-bold text-success">78</div>
                    <div className="text-[9px] uppercase tracking-widest mt-0.5 text-muted-foreground/60">Viability Score</div>
                  </div>
                </div>

                {/* Blurred sections */}
                <div className="space-y-4" style={{ filter: "blur(4px)", userSelect: "none" }}>
                  <div className="space-y-2">
                    <div className="h-3 rounded w-48 bg-muted" />
                    <div className="h-2.5 rounded w-full bg-muted" />
                    <div className="h-2.5 rounded w-[90%] bg-muted" />
                    <div className="h-2.5 rounded w-[75%] bg-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="h-2.5 rounded w-20 bg-muted" />
                      <div className="h-2 rounded w-full bg-muted" />
                      <div className="h-2 rounded w-[60%] bg-muted" />
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="h-2.5 rounded w-24 bg-muted" />
                      <div className="h-2 rounded w-[80%] bg-muted" />
                      <div className="h-2 rounded w-full bg-muted" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-end justify-center pb-12 bg-gradient-to-t from-background via-background/50 to-transparent">
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "sample_report_preview", page: "landing" });
                    navigate("/sample-report");
                  }}
                  className="text-sm font-medium px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 inline-flex items-center gap-2 bg-primary text-primary-foreground"
                >
                  View Sample Report
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-foreground">
            Your idea deserves more than a gut feeling.
          </h2>
          <p className="text-base leading-relaxed max-w-xl mx-auto text-muted-foreground">
            Most startups fail because the founder didn't validate first. Validifier gives you the analysis
            {" "}{F.reportTimeCopy} that used to take a consulting firm weeks.
          </p>
          <button
            onClick={() => {
              trackEvent("cta_click", { button: "final_cta", page: "landing" });
              navigate("/auth?mode=signup&next=%2Fdashboard");
            }}
            className="text-base font-medium px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 inline-flex items-center gap-2 bg-primary text-primary-foreground"
          >
            Analyze Your Idea Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-serif text-lg text-foreground/80">
              Validifier
            </span>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">
                Pricing
              </button>
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">
                Terms
              </button>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-xs text-muted-foreground/50">
            © 2025-2026 Validifier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
