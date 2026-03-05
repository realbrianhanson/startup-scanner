import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const Landing = () => {
  const navigate = useNavigate();
  const scoreRef = useRef<HTMLDivElement>(null);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    document.title = "Validifier — Know If Your Idea Will Work Before You Build It";
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
        "Validate your business idea in 90 seconds. Full strategic analysis across 14 frameworks with viability score, competitor analysis, financial projections, and action plan.",
      url: "https://startup-scanner.lovable.app",
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

  // Animate score when product preview scrolls into view
  useEffect(() => {
    const el = scoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !scoreVisible) {
          setScoreVisible(true);
          let current = 0;
          const target = 78;
          const timer = setInterval(() => {
            current += 2;
            if (current >= target) {
              setAnimatedScore(target);
              clearInterval(timer);
            } else {
              setAnimatedScore(current);
            }
          }, 20);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [scoreVisible]);

  const reportSections = [
    { title: "Viability Score", desc: "A 0–100 score based on 6 weighted factors including market size, competition intensity, and financial viability" },
    { title: "Market Intelligence", desc: "TAM/SAM/SOM sizing with growth rates, timing assessment, and emerging trends in your space" },
    { title: "Competitor Breakdown", desc: "Real companies by name with their strengths, weaknesses, and the gap you can exploit" },
    { title: "Customer Personas", desc: "3 detailed profiles with pain points, objections, and exactly how to sell to each one" },
    { title: "Financial Model", desc: "Startup cost scenarios, unit economics, revenue projections, and break-even estimate" },
    { title: "Game-Changing Enhancement", desc: "An AI-generated strategic twist that could 10x your idea's potential" },
    { title: "30-Day Action Plan", desc: "Week-by-week plan with specific daily actions — not generic advice" },
  ];

  return (
    <div className="min-h-screen grain" style={{ background: "hsl(220 15% 6%)", color: "hsl(210 10% 93%)" }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "hsl(220 15% 6% / 0.9)", backdropFilter: "blur(12px)", borderColor: "hsl(220 15% 12%)" }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span
            className="text-2xl font-serif cursor-pointer tracking-tight"
            style={{ color: "hsl(210 10% 93%)" }}
            onClick={() => navigate("/")}
          >
            Validifier
          </span>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm transition-colors"
              style={{ color: "hsl(215 15% 55%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(210 10% 93%)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(215 15% 55%)")}
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm transition-colors"
              style={{ color: "hsl(215 15% 55%)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(210 10% 93%)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(215 15% 55%)")}
            >
              Log in
            </button>
            <button
              onClick={() => {
                trackEvent("cta_click", { button: "nav_start", page: "landing" });
                navigate("/auth");
              }}
              className="text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-px"
              style={{ background: "hsl(217 91% 60%)", color: "#fff" }}
            >
              Start Analyzing
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 relative z-10 py-32 md:py-40">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — copy */}
            <div className="space-y-8 max-w-xl">
              <h1
                className="font-serif text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-[-0.04em]"
                style={{ color: "hsl(210 10% 93%)" }}
              >
                Know if your idea
                <br />
                will work
              </h1>
              <p className="text-base md:text-lg leading-relaxed max-w-lg" style={{ color: "hsl(215 15% 55%)" }}>
                Validifier runs your business idea through 14 strategic frameworks and returns a full
                validation report with a viability score, real competitor analysis, financial projections,
                and a 30-day action plan.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "hero_analyze", page: "landing" });
                    navigate("/auth");
                  }}
                  className="text-base font-medium px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 flex items-center gap-2"
                  style={{ background: "hsl(217 91% 60%)", color: "#fff" }}
                >
                  Analyze Your First Idea — Free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "sample_report", page: "landing" });
                    navigate("/sample-report");
                  }}
                  className="text-sm font-medium px-5 py-3.5 rounded-lg border transition-all duration-200 hover:-translate-y-px flex items-center gap-2"
                  style={{ borderColor: "hsl(220 15% 18%)", color: "hsl(215 15% 55%)" }}
                >
                  See a Sample Report
                </button>
              </div>
              <p className="text-xs" style={{ color: "hsl(215 15% 40%)" }}>
                No credit card. Report ready in ~90 seconds.
              </p>
            </div>

            {/* Right — Product screenshot */}
            <div ref={scoreRef} className="relative">
              <div
                className="rounded-xl overflow-hidden border"
                style={{
                  background: "hsl(220 15% 9%)",
                  borderColor: "hsl(220 15% 14%)",
                  transform: "perspective(1000px) rotateY(-4deg)",
                }}
              >
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "hsl(220 15% 14%)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                  </div>
                  <span className="font-mono text-[10px] ml-3" style={{ color: "hsl(215 15% 35%)" }}>
                    validifier.com/report/ai-pet-care
                  </span>
                </div>

                {/* Report content */}
                <div className="p-6">
                  {/* Header + score */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-sm font-medium" style={{ color: "hsl(210 10% 80%)" }}>AI-Powered Pet Care</div>
                      <div className="text-xs mt-1" style={{ color: "hsl(215 15% 40%)" }}>Pet Services · Validation Report</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-mono font-bold tabular-nums" style={{ color: "hsl(142 71% 55%)" }}>
                        {animatedScore}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "hsl(215 15% 40%)" }}>
                        Viability
                      </div>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3 mb-6">
                    {[
                      { label: "Market Size", pct: 82, color: "hsl(142 71% 55%)" },
                      { label: "Competition", pct: 58, color: "hsl(38 92% 55%)" },
                      { label: "Feasibility", pct: 85, color: "hsl(217 91% 60%)" },
                      { label: "Financials", pct: 72, color: "hsl(217 91% 60%)" },
                    ].map((bar) => (
                      <div key={bar.label} className="flex items-center gap-3">
                        <span className="text-[10px] w-20 text-right font-mono" style={{ color: "hsl(215 15% 40%)" }}>
                          {bar.label}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "hsl(220 15% 14%)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: scoreVisible ? `${bar.pct}%` : "0%",
                              background: bar.color,
                              opacity: 0.7,
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
                        className="px-2.5 py-1 rounded text-[10px] font-mono"
                        style={{
                          background: i === 0 ? "hsl(217 91% 60% / 0.15)" : "hsl(220 15% 14%)",
                          color: i === 0 ? "hsl(217 91% 70%)" : "hsl(215 15% 35%)",
                        }}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  {/* Blurred body */}
                  <div className="space-y-2 select-none" style={{ filter: "blur(3px)" }}>
                    <div className="h-2.5 rounded" style={{ background: "hsl(220 15% 14%)", width: "100%" }} />
                    <div className="h-2.5 rounded" style={{ background: "hsl(220 15% 13%)", width: "88%" }} />
                    <div className="h-2.5 rounded" style={{ background: "hsl(220 15% 12%)", width: "72%" }} />
                    <div className="h-2.5 rounded" style={{ background: "hsl(220 15% 13%)", width: "80%" }} />
                  </div>
                </div>
              </div>

              {/* Reflection glow */}
              <div
                className="absolute -bottom-8 left-[10%] right-[10%] h-16 rounded-full blur-[40px]"
                style={{ background: "hsl(217 91% 60% / 0.06)" }}
              />
            </div>
          </div>

          {/* Product proof */}
          <div className="mt-20 text-center">
            <span className="font-mono text-sm tracking-wide" style={{ color: "hsl(215 15% 35%)" }}>
              14 frameworks · 90 seconds · 0 fluff
            </span>
          </div>
        </div>
      </section>

      {/* What's inside your report */}
      <section className="py-32 md:py-40 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] mb-20" style={{ color: "hsl(210 10% 93%)" }}>
              What's inside your<br />validation report
            </h2>

            <div className="space-y-0">
              {reportSections.map((section, index) => (
                <div
                  key={index}
                  className="py-6 border-t flex items-start gap-6"
                  style={{ borderColor: "hsl(220 15% 12%)" }}
                >
                  <span className="font-mono text-xs tabular-nums mt-1" style={{ color: "hsl(215 15% 35%)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1.5" style={{ color: "hsl(210 10% 88%)" }}>
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(215 15% 50%)" }}>
                      {section.desc}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-t" style={{ borderColor: "hsl(220 15% 12%)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 md:py-40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-center mb-16" style={{ color: "hsl(210 10% 93%)" }}>
              How it works
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
              {[
                "Describe your idea in a few sentences",
                "Validifier analyzes it across 14 frameworks",
                "Get your full report in ~90 seconds",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 md:gap-0">
                  <p className="text-center text-base font-medium max-w-[220px]" style={{ color: "hsl(210 10% 80%)" }}>
                    {step}
                  </p>
                  {i < 2 && (
                    <ArrowRight className="hidden md:block mx-6 shrink-0" style={{ color: "hsl(215 15% 30%)", width: 16, height: 16 }} />
                  )}
                  {i < 2 && (
                    <span className="md:hidden text-sm" style={{ color: "hsl(215 15% 30%)" }}>↓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 md:py-40 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-center mb-6" style={{ color: "hsl(210 10% 93%)" }}>
              Straightforward pricing
            </h2>
            <p className="text-center text-base mb-16" style={{ color: "hsl(215 15% 50%)" }}>
              Your first report is free. Upgrade when you need deeper analysis.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Free */}
              <div className="rounded-xl border p-8 space-y-6" style={{ borderColor: "hsl(220 15% 14%)", background: "hsl(220 15% 8%)" }}>
                <div>
                  <h3 className="text-xl font-medium" style={{ color: "hsl(210 10% 88%)" }}>Free</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-mono font-bold">$0</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {["1 validation report per month", "Standard AI analysis", "All 12 report sections", "AI advisor chat (10 messages)", "PDF export"].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "hsl(215 15% 55%)" }}>
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(217 91% 60%)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-lg text-sm font-medium border transition-all duration-200 hover:-translate-y-px"
                  style={{ borderColor: "hsl(220 15% 18%)", color: "hsl(210 10% 80%)", background: "transparent" }}
                >
                  Start Free
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-xl border p-8 space-y-6 relative" style={{ borderColor: "hsl(217 91% 60% / 0.3)", background: "hsl(220 15% 8%)" }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-medium" style={{ background: "hsl(217 91% 60%)", color: "#fff" }}>
                  Most popular
                </div>
                <div>
                  <h3 className="text-xl font-medium" style={{ color: "hsl(210 10% 88%)" }}>Pro</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-mono font-bold">$29</span>
                    <span className="text-sm ml-1" style={{ color: "hsl(215 15% 45%)" }}>/month</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    "5 validation reports per month",
                    "Premium AI analysis (Gemini 3.1 Pro)",
                    "All sections + Game-Changing Idea + Action Plan",
                    "AI advisor chat (unlimited)",
                    "Real competitor names and market data",
                    "Detailed financial projections",
                    "PDF + Markdown export",
                    "Priority email support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "hsl(215 15% 55%)" }}>
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(217 91% 60%)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:brightness-110"
                  style={{ background: "hsl(217 91% 60%)", color: "#fff" }}
                >
                  Start 7-Day Free Trial
                </button>
              </div>
            </div>

            <p className="text-center mt-8 text-sm">
              <button onClick={() => navigate("/pricing")} className="transition-colors" style={{ color: "hsl(217 91% 60%)" }}>
                See full pricing details →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* See what a report looks like */}
      <section className="py-32 md:py-40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em]" style={{ color: "hsl(210 10% 93%)" }}>
                See what a report looks like
              </h2>
              <p className="text-base" style={{ color: "hsl(215 15% 50%)" }}>
                No signup required. See the full analysis for a real business idea.
              </p>
            </div>

            {/* Blurred report preview */}
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "hsl(220 15% 14%)", background: "hsl(220 15% 9%)" }}>
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "hsl(220 15% 14%)" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 0% 30%)" }} />
                </div>
                <span className="font-mono text-[10px] ml-3" style={{ color: "hsl(215 15% 35%)" }}>
                  validifier.com/report/sample
                </span>
              </div>

              {/* Report preview content */}
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-medium" style={{ color: "hsl(210 10% 80%)" }}>AI-Powered Pet Care Platform</div>
                    <div className="text-xs mt-1" style={{ color: "hsl(215 15% 40%)" }}>Pet Services · Full Validation Report</div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-mono font-bold" style={{ color: "hsl(142 71% 55%)" }}>78</div>
                    <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "hsl(215 15% 40%)" }}>Viability Score</div>
                  </div>
                </div>

                {/* Blurred sections */}
                <div className="space-y-4" style={{ filter: "blur(4px)", userSelect: "none" }}>
                  <div className="space-y-2">
                    <div className="h-3 rounded w-48" style={{ background: "hsl(220 15% 14%)" }} />
                    <div className="h-2.5 rounded w-full" style={{ background: "hsl(220 15% 13%)" }} />
                    <div className="h-2.5 rounded w-[90%]" style={{ background: "hsl(220 15% 12%)" }} />
                    <div className="h-2.5 rounded w-[75%]" style={{ background: "hsl(220 15% 13%)" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg" style={{ background: "hsl(220 15% 11%)" }}>
                      <div className="h-2.5 rounded w-20" style={{ background: "hsl(220 15% 16%)" }} />
                      <div className="h-2 rounded w-full" style={{ background: "hsl(220 15% 14%)" }} />
                      <div className="h-2 rounded w-[60%]" style={{ background: "hsl(220 15% 14%)" }} />
                    </div>
                    <div className="space-y-2 p-4 rounded-lg" style={{ background: "hsl(220 15% 11%)" }}>
                      <div className="h-2.5 rounded w-24" style={{ background: "hsl(220 15% 16%)" }} />
                      <div className="h-2 rounded w-[80%]" style={{ background: "hsl(220 15% 14%)" }} />
                      <div className="h-2 rounded w-full" style={{ background: "hsl(220 15% 14%)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex items-end justify-center pb-12" style={{ background: "linear-gradient(to top, hsl(220 15% 6%) 20%, transparent 70%)" }}>
                <button
                  onClick={() => {
                    trackEvent("cta_click", { button: "sample_report_preview", page: "landing" });
                    navigate("/sample-report");
                  }}
                  className="text-sm font-medium px-6 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 inline-flex items-center gap-2"
                  style={{ background: "hsl(217 91% 60%)", color: "#fff" }}
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
      <section className="py-32 md:py-40 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em]" style={{ color: "hsl(210 10% 93%)" }}>
            Your idea deserves more than a gut feeling.
          </h2>
          <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: "hsl(215 15% 50%)" }}>
            Most startups fail because the founder didn't validate first. Validifier gives you the analysis
            in 90 seconds that used to take a consulting firm 3 weeks.
          </p>
          <button
            onClick={() => {
              trackEvent("cta_click", { button: "final_cta", page: "landing" });
              navigate("/auth");
            }}
            className="text-base font-medium px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 inline-flex items-center gap-2"
            style={{ background: "hsl(217 91% 60%)", color: "#fff" }}
          >
            Analyze Your Idea Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: "hsl(220 15% 12%)" }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-serif text-lg" style={{ color: "hsl(210 10% 80%)" }}>
              Validifier
            </span>
            <div className="flex items-center gap-6 text-sm" style={{ color: "hsl(215 15% 45%)" }}>
              <button onClick={() => navigate("/pricing")} className="hover:text-white transition-colors">
                Pricing
              </button>
              <button onClick={() => navigate("/privacy")} className="hover:text-white transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate("/terms")} className="hover:text-white transition-colors">
                Terms
              </button>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-xs" style={{ borderColor: "hsl(220 15% 12%)", color: "hsl(215 15% 35%)" }}>
            © 2025-2026 Validifier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
