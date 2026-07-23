import { Check, ChevronDown, Loader2, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PRODUCT_FACTS } from "@/lib/productFacts";

const F = PRODUCT_FACTS;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: [
      `${F.free.monthlyCredits} credits per month (about ${F.free.includedStandardReports} Standard report + ${F.free.includedChatMessages} advisor messages)`,
      "Standard AI analysis (Gemini 3 Flash)",
      `All ${F.reportSectionCount} report sections, including Game-Changing Idea and 30-Day Action Plan`,
      "AI advisor chat",
      "PDF export",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: `$${F.proPriceMonthly}`,
    badge: "Most popular",
    features: [
      `${F.pro.monthlyCredits} credits per month (about ${F.pro.includedPremiumReports} Premium reports + ${F.pro.includedChatMessages} advisor messages)`,
      "Premium AI analysis (Gemini 3.1 Pro — deeper, more specific)",
      `All ${F.reportSectionCount} report sections with deeper competitive and financial reasoning`,
      "AI advisor chat with higher monthly volume",
      "PDF + Markdown export",
      "Priority email support",
    ],
    cta: `Start ${F.proTrialDays}-Day Free Trial`,
    popular: true,
  },
];

const FEATURE_ROWS: { label: string; values: (string | boolean)[] }[] = [
  { label: "Monthly credits", values: [`${F.free.monthlyCredits}`, `${F.pro.monthlyCredits}`] },
  { label: "Typical monthly usage", values: [`~${F.free.includedStandardReports} Standard report + ${F.free.includedChatMessages} chats`, `~${F.pro.includedPremiumReports} Premium reports + ${F.pro.includedChatMessages} chats`] },
  { label: "AI analysis quality", values: ["Standard (Gemini 3 Flash)", "Premium (Gemini 3.1 Pro)"] },
  { label: "Report sections", values: [`All ${F.reportSectionCount}`, `All ${F.reportSectionCount}`] },
  { label: "Game-Changing Idea", values: [true, true] },
  { label: "30-Day Action Plan", values: [true, true] },
  { label: "Depth of competitive & financial reasoning", values: ["Standard", "Deeper, more specific"] },
  { label: "PDF export", values: [true, true] },
  { label: "Markdown export", values: [false, true] },
  { label: "Priority email support", values: [false, true] },
];

const FAQS = [
  {
    q: "How does credit usage work?",
    a: `Every action costs credits from your monthly balance. A Standard report costs ${F.credits.standardReport} credits, a Premium report costs ${F.credits.premiumReport} credits, and each advisor chat message costs ${F.credits.chatMessage} credit. The plan bundles above show the intended monthly mix, but you can spend your credits however you like.`,
  },
  {
    q: "How many sections are in a report?",
    a: `Every report — Standard or Premium — includes all ${F.reportSectionCount} sections, from viability score and market intelligence to Game-Changing Idea and the 30-Day Action Plan.`,
  },
  {
    q: "What's the difference between Standard and Premium?",
    a: "Both produce a complete report. Standard uses Gemini 3 Flash — fast and great for screening ideas. Premium uses Gemini 3.1 Pro for deeper, more specific competitive analysis and financial reasoning.",
  },
  {
    q: "How long does a report take?",
    a: `${F.reportTimeCopy[0].toUpperCase()}${F.reportTimeCopy.slice(1)} from submission to a finished report.`,
  },
  {
    q: "Can I see a sample report before buying?",
    a: "Yes — you can view a complete sample report with every section from the landing page. No sign-up required.",
  },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes. Upgrades take effect immediately, downgrades at the next billing cycle." },
  { q: "Do you offer refunds?", a: `Yes, ${F.proTrialDays}-day money-back guarantee on Pro, no questions asked.` },
  { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption and never share your data. Your business ideas remain 100% yours." },
];

/* FAQ Accordion Item */
const FaqItem = ({ q, a, index }: { q: string; a: string; index: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border border-border rounded-lg overflow-hidden bg-card transition-colors duration-200 hover:border-foreground/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between p-5 text-left group"
      >
        <span className="font-medium text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-muted-foreground px-5 pb-5">{a}</p>
        </div>
      </div>
    </div>
  );
};

const Pricing = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    document.title = "Pricing | Validifier";
    trackEvent("pricing_page_view");
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          setUser(u);
          const { data } = await supabase
            .from("profiles")
            .select("subscription_tier")
            .eq("id", u.id)
            .single();
          if (data) setProfile(data);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.name === "Free") {
      navigate("/auth?mode=signup&next=%2Fdashboard");
      return;
    }

    if (!user) {
      navigate("/auth?mode=signup&next=%2Fpricing&plan=pro");
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan_name: "pro" },
      });

      if (error) {
        // 503 => billing temporarily unavailable
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        if (status === 503) {
          toast.error("Billing setup is temporarily unavailable. Please try again shortly.");
          return;
        }
        throw error;
      }
      if (data?.url) {
        trackEvent("checkout_started", { plan: plan.name });
        window.location.href = data.url;
      } else {
        toast.error("Billing setup is temporarily unavailable. Please try again shortly.");
      }
    } catch (err: any) {
      toast.error("Billing setup is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen grain bg-background text-foreground animate-fade-in">
      {/* Navigation — compact one-line on mobile */}
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
            {authLoading ? (
              <div
                aria-hidden="true"
                className="h-9 w-24 sm:w-40 rounded-lg bg-muted/40 animate-pulse"
              />
            ) : user ? (
              <>
                <button
                  onClick={() => navigate("/projects/new")}
                  className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  New report
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-sm font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-px bg-primary text-primary-foreground whitespace-nowrap"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/auth?mode=signup&next=%2Fdashboard")}
                  className="text-sm font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-px bg-primary text-primary-foreground whitespace-nowrap"
                >
                  Start free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[-0.03em] text-foreground">
              Straightforward pricing
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start free with a complete {F.reportSectionCount}-section report. Upgrade to Pro for deeper, more specific analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
            {PLANS.map((plan, index) => {
              const isPopular = plan.popular;
              const isCurrent = user && profile?.subscription_tier === plan.name.toLowerCase();
              return (
                <div
                  key={index}
                  className={`relative rounded-xl border p-8 space-y-6 flex flex-col bg-card transition-all duration-200 hover:-translate-y-px ${
                    isPopular ? "border-primary/30" : "border-border"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-medium bg-primary text-primary-foreground whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-medium text-foreground/90">{plan.name}</h3>
                    <div className="mt-3">
                      <span className="text-4xl font-mono font-bold text-foreground tabular-nums">
                        {plan.price}
                      </span>
                      {plan.price !== "$0" && (
                        <span className="text-sm ml-1 text-muted-foreground">/month</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-lg text-sm font-medium border border-border text-muted-foreground bg-transparent"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loadingPlan === plan.name}
                      className={`w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px flex items-center justify-center ${
                        isPopular
                          ? "bg-primary text-primary-foreground hover:brightness-110"
                          : "border border-border text-foreground/80 bg-transparent hover:border-foreground/30"
                      }`}
                    >
                      {loadingPlan === plan.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        plan.cta
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground/70 mt-6 max-w-2xl mx-auto">
            Credits are flexible: Standard report {F.credits.standardReport} · Premium report {F.credits.premiumReport} · advisor message {F.credits.chatMessage}.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <ScrollReveal>
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] text-center mb-4 text-foreground">
                Compare plans
              </h2>
              <p className="text-muted-foreground text-center mb-12 text-base">
                See exactly what's included
              </p>

              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-foreground/80 min-w-[200px]">Feature</th>
                      {PLANS.map((p, i) => (
                        <th
                          key={i}
                          className="p-4 text-center font-medium text-foreground min-w-[140px]"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="p-4 text-foreground/80">{row.label}</td>
                        {row.values.map((val, j) => (
                          <td key={j} className="p-4 text-center">
                            {val === true ? (
                              <Check className="h-4 w-4 text-primary mx-auto" />
                            ) : val === false ? (
                              <span className="text-muted-foreground/40">—</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ Section */}
      <ScrollReveal>
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-[-0.03em] text-center mb-4 text-foreground">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground text-center mb-12 text-base">
                Everything you need to know about our plans
              </p>

              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Final CTA */}
      <section className="py-24 md:py-32 relative border-t border-border">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-foreground">
            Your idea deserves real analysis.
          </h2>
          <p className="text-base leading-relaxed max-w-xl mx-auto text-muted-foreground">
            Get a full {F.reportSectionCount}-section validation report — {F.reportTimeCopy}. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/auth?mode=signup&next=%2Fdashboard")}
              className="text-base font-medium px-7 py-3.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:brightness-110 inline-flex items-center gap-2 bg-primary text-primary-foreground"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/sample-report")}
              className="text-sm font-medium px-6 py-3.5 rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:-translate-y-px inline-flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              View Sample Report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
