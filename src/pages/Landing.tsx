import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, MessageSquare, FileText, Gauge, Users, Swords, LineChart, ListChecks } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { PRODUCT_FACTS } from "@/lib/productFacts";
import { DecisionCockpit } from "@/components/landing/DecisionCockpit";
import { DecisionGrid } from "@/components/landing/DecisionGrid";

const F = PRODUCT_FACTS;
const SIGNUP_HREF = "/auth?mode=signup&next=%2Fprojects%2Fnew";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
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
        `A ${F.reportSectionCount}-section decision brief delivered ${F.reportTimeCopy}, covering demand, competition, economics, and your next 30 days so founders can make a confident go/no-go call.`,
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
    <div className="landing-dark min-h-screen bg-slate-950 text-slate-100 antialiased overflow-x-hidden">
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
        <section id="what-you-get" className="container mx-auto px-4 py-16 sm:py-20">
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
        <section id="report-preview" className="container mx-auto px-4 py-16 sm:py-20">
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
              <aside
                aria-label="Decision document outputs"
                className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-300" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300">
                      Decision document
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    {F.reportSectionCount} sections
                  </span>
                </div>
                <ul className="mt-4 divide-y divide-white/5">
                  {[
                    { icon: Gauge, t: "Weighted viability score", d: "0–100 with six-factor breakdown" },
                    { icon: Users, t: "Market sizing + personas", d: "TAM/SAM/SOM plus 3 buyer profiles" },
                    { icon: Swords, t: "Named competitors", d: "Strengths, weaknesses, and the gap" },
                    { icon: LineChart, t: "Startup cost + unit economics + break-even", d: "Modeled scenarios, not hand-waving" },
                    { icon: ListChecks, t: "Weekly 30-day plan", d: "Specific tasks for the next four weeks" },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <li key={row.t} className="py-3 flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] shrink-0">
                          <Icon className="h-3.5 w-3.5 text-sky-300" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-white">{row.t}</p>
                          <p className="text-xs text-slate-400 leading-snug">{row.d}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Real output categories · no fabricated values
                </p>
              </aside>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="container mx-auto px-4 py-16">
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
        <section className="container mx-auto px-4 py-12 sm:py-16">
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
        <section className="container mx-auto px-4 py-20 sm:py-24 text-center">
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
