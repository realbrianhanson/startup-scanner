import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, BarChart3, ChevronDown, Sparkles, Loader2, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: [
      "1 validation report per month",
      "Standard AI analysis (Gemini 3 Flash)",
      "All 12 report sections included",
      "AI advisor chat (10 messages)",
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
      "AI advisor chat (unlimited)",
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
  { label: "AI advisor chat", values: ["10 messages/mo", "Unlimited"] },
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
      className="border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-primary/30"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left group"
      >
        <span className="font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex">
            <div className={`w-1 shrink-0 rounded-full transition-all duration-300 ${open ? "bg-gradient-to-b from-primary to-secondary" : "bg-transparent"}`} />
            <p className="text-sm text-muted-foreground p-5 pt-0 pl-4">{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const STRIPE_PRICE_IDS: Record<string, string> = {
  Pro: "price_pro_monthly_placeholder",
};

const Pricing = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

    const priceId = STRIPE_PRICE_IDS[plan.name];
    if (!priceId) return;

    setLoadingPlan(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          price_id: priceId,
          plan_name: plan.name,
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
    <div className="min-h-screen bg-background animate-fade-in" style={{ opacity: 1 }}>
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => navigate("/")}
          >
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">Validifier</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button onClick={() => navigate("/auth")}>Start Analyzing</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              Straightforward <span className="gradient-text">pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Start free with a full validation report. Upgrade to Pro for deeper, more specific analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
            {PLANS.map((plan, index) => {
              const isPopular = plan.popular;
              return (
                <div
                  key={index}
                  className={`relative group transition-all duration-500 ${isPopular ? "md:scale-105 md:z-10" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient opacity-80" />
                  )}

                  <Card
                    className={`relative p-8 space-y-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
                      isPopular
                        ? "border-0 shadow-glow"
                        : "border border-border hover:border-primary/30 hover:shadow-medium"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                        {plan.badge}
                      </div>
                    )}

                    <div className="pt-2">
                      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-4 mb-1">
                        <span className="text-5xl font-extrabold font-mono tabular-nums text-foreground">
                          {plan.price}
                        </span>
                        {plan.price !== "$0" && (
                          <span className="text-muted-foreground text-sm ml-1">/month</span>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    <ul className="space-y-3 flex-grow">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {user && profile?.subscription_tier === plan.name.toLowerCase() ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full transition-all duration-300 ${
                          isPopular
                            ? "bg-gradient-to-r from-primary to-secondary hover:shadow-glow text-primary-foreground border-0"
                            : ""
                        }`}
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan)}
                        disabled={loadingPlan === plan.name}
                      >
                        {loadingPlan === plan.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          plan.cta
                        )}
                      </Button>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <ScrollReveal>
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2">Compare plans</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">See exactly what's included</p>

            <div className="max-w-3xl mx-auto overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-card z-10 border-b border-border">
                    <th className="text-left p-4 font-semibold text-foreground min-w-[200px]">Feature</th>
                    {PLANS.map((p, i) => (
                      <th key={i} className={`p-4 text-center font-semibold min-w-[140px] ${p.popular ? "text-primary" : "text-foreground"}`}>
                        {p.name}
                        {p.popular && <Sparkles className="inline h-3.5 w-3.5 ml-1 text-primary" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row, i) => (
                    <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                      <td className="p-4 text-foreground">{row.label}</td>
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
        </section>
      </ScrollReveal>

      {/* FAQ Section */}
      <ScrollReveal>
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-center mb-10">Everything you need to know about our plans</p>

              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary-foreground/20 blur-[60px]" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-primary-foreground/10 blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary-foreground">
            Your idea deserves real analysis.
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Get a full validation report in 90 seconds — for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="shadow-large"
            >
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/sample-report")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Star className="mr-2 h-4 w-4" />
              View Sample Report
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
