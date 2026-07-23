import { Check, ChevronDown, Loader2, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: [
      "1 validation report per month",
      "Standard AI analysis (Gemini 3 Flash)",
      "All 12 report sections included",
      "10 AI advisor chat messages per month",
      "PDF export",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    badge: "Most popular",
    features: [
      "5 validation reports per month",
      "Premium AI analysis (Gemini 3.1 Pro — deeper, more specific)",
      "All 12 report sections + Game-Changing Idea + 30-Day Action Plan",
      "40 AI advisor chat messages per month",
      "Real competitor names and market data",
      "Detailed financial projections with unit economics",
      "PDF export + Markdown export",
      "Priority email support",
    ],
    cta: "Start 7-Day Free Trial",
    popular: true,
  },
];

const FEATURE_ROWS = [
  { label: "Validation reports per month", values: ["1", "5"] },
  { label: "AI analysis quality", values: ["Standard (Gemini 3 Flash)", "Premium (Gemini 3.1 Pro)"] },
  { label: "Report sections", values: ["12 core sections", "All 14 sections"] },
  { label: "AI advisor chat", values: ["10 messages/mo", "40 messages/mo"] },
  { label: "Real competitor names", values: [false, true] },
  { label: "Financial projections", values: ["Basic", "Detailed with unit economics"] },
  { label: "Game-Changing Idea section", values: [false, true] },
  { label: "30-Day Action Plan", values: [false, true] },
  { label: "PDF export", values: [true, true] },
  { label: "Markdown export", values: [false, true] },
  { label: "Priority email support", values: [false, true] },
];

const FAQS = [
  {
    q: "How many reports do I get?",
    a: "Free accounts get 1 validation report per month. Pro accounts get 5 reports per month. Each report analyzes your idea across 14 strategic frameworks."
  },
  {
    q: "What's the difference between Standard and Premium analysis?",
    a: "Standard analysis uses Gemini 3 Flash — fast, reliable, and great for initial idea screening. Premium analysis uses Gemini 3.1 Pro, Google's most capable model, which produces deeper analysis with real competitor names, specific market data, detailed financial projections, and more nuanced strategic recommendations."
  },
  {
    q: "Can I see a sample report before buying?",
    a: "Absolutely! You can view a complete sample report with every section and framework — no sign-up required. Check out the sample report from the landing page."
  },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes! Change your plan anytime. Upgrades take effect immediately, downgrades at the next billing cycle." },
  { q: "Do you offer refunds?", a: "Yes, 7-day money-back guarantee on Pro, no questions asked." },
  { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and never share your data. Your business ideas remain 100% yours." },
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

// ─────────────────────────────────────────────────────────────
// 💳 STRIPE CONFIG — REMIXER: SET THIS
// Paste your real Stripe price IDs here after connecting Stripe.
// While a value is still the placeholder (or empty) the checkout
// button is disabled and shows "Billing isn't configured yet".
// ─────────────────────────────────────────────────────────────
export const STRIPE_PRICE_PLACEHOLDER = "price_pro_monthly_placeholder";
export const STRIPE_PRICE_IDS: Record<string, string> = {
  Pro: STRIPE_PRICE_PLACEHOLDER,
};

function isPriceConfigured(planName: string): boolean {
  const id = STRIPE_PRICE_IDS[planName];
  return !!id && id !== STRIPE_PRICE_PLACEHOLDER;
}

const Pricing = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.title = "Pricing | Validifier";
    trackEvent('pricing_page_view');
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", u.id)
          .single();
        if (data) setProfile(data);
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!roleRow);
      }
    };
    loadUser();
  }, []);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.name === "Free") {
      navigate("/auth");
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isPriceConfigured(plan.name)) {
      toast.error("Billing isn't configured yet.");
      return;
    }
    const priceId = STRIPE_PRICE_IDS[plan.name];

    setLoadingPlan(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_name: plan.name.toLowerCase(),
        },
      });

      if (error) throw error;
      if (data?.url) {
        trackEvent('checkout_started', { plan: plan.name });
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen grain bg-background text-foreground animate-fade-in">
      {/* Navigation — matches Landing */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span
            className="text-2xl font-serif cursor-pointer tracking-tight text-foreground"
            onClick={() => navigate("/")}
          >
            Validifier
          </span>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-px bg-primary text-primary-foreground"
            >
              Start Analyzing
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-[-0.03em] text-foreground">
              Straightforward pricing
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start free with a full validation report. Upgrade to Pro for deeper, more specific analysis.
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
              const notConfigured = plan.name !== "Free" && !isPriceConfigured(plan.name);
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
                  ) : notConfigured ? (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 rounded-lg text-sm font-medium border border-border text-muted-foreground bg-transparent"
                      >
                        Billing isn&apos;t configured yet
                      </button>
                      {isAdmin && (
                        <p className="text-[11px] text-muted-foreground text-center">
                          Admin: set <code className="font-mono">STRIPE_PRICE_IDS.{plan.name}</code>{" "}
                          in <code className="font-mono">src/pages/Pricing.tsx</code>.
                        </p>
                      )}
                    </div>
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

      {/* Final CTA — editorial, calm */}
      <section className="py-24 md:py-32 relative border-t border-border">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="container mx-auto px-4 text-center space-y-8 max-w-3xl relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-[-0.03em] text-foreground">
            Your idea deserves real analysis.
          </h2>
          <p className="text-base leading-relaxed max-w-xl mx-auto text-muted-foreground">
            Get a full validation report in 90 seconds — for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/auth")}
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
