import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, BarChart3, X, ChevronDown, Star, Sparkles, Quote, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Free",
    subtitle: "Idea Explorer",
    monthlyPrice: 0,
    annualPrice: 0,
    badge: null,
    features: [
      "1 project per month",
      "5 AI chat messages",
      "Basic frameworks (SWOT only)",
      "PDF export with watermark",
      "Community access (read-only)",
    ],
    limitations: [
      "No market analysis",
      "No competitive landscape",
      "No financial projections",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Starter",
    subtitle: "Best for First Idea",
    monthlyPrice: 29,
    annualPrice: 24,
    badge: "BEST VALUE",
    features: [
      "3 active projects",
      "50 AI chat messages/month",
      "All strategic frameworks",
      "Financial projections",
      "Market & competitive analysis",
      "PDF export (no watermark)",
      "Community (post & comment)",
      "Email support",
    ],
    limitations: [],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Growth",
    subtitle: "For Growing Teams",
    monthlyPrice: 79,
    annualPrice: 66,
    badge: "MOST POPULAR",
    features: [
      "10 active projects",
      "200 AI chat messages/month",
      "Team collaboration (3 seats)",
      "Priority support",
      "Export to Google Docs/Slides",
      "API access (coming soon)",
      "Advanced analytics",
      "Custom branding",
    ],
    limitations: [],
    cta: "Start 14-Day Trial",
    popular: false,
  },
  {
    name: "Pro",
    subtitle: "For Serial Entrepreneurs",
    monthlyPrice: 199,
    annualPrice: 165,
    badge: "ENTERPRISE",
    features: [
      "Unlimited projects",
      "Unlimited AI chat",
      "Team collaboration (unlimited)",
      "Expert review (1/month, $75 value)",
      "White-label reports",
      "Full API access",
      "Priority phone support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const FEATURE_ROWS = [
  { label: "Active projects", values: ["1", "3", "10", "Unlimited"] },
  { label: "AI chat messages", values: ["5/mo", "50/mo", "200/mo", "Unlimited"] },
  { label: "SWOT Analysis", values: [true, true, true, true] },
  { label: "All Strategic Frameworks", values: [false, true, true, true] },
  { label: "Market Analysis", values: [false, true, true, true] },
  { label: "Competitive Landscape", values: [false, true, true, true] },
  { label: "Financial Projections", values: [false, true, true, true] },
  { label: "PDF Export", values: ["Watermarked", true, true, true] },
  { label: "Team Collaboration", values: [false, false, "3 seats", "Unlimited"] },
  { label: "API Access", values: [false, false, "Coming soon", true] },
  { label: "Custom Branding", values: [false, false, true, true] },
  { label: "Expert Review", values: [false, false, false, "1/month"] },
  { label: "Dedicated Account Manager", values: [false, false, false, true] },
];

const FAQS = [
  { q: "What are AI credits?", a: "AI credits power report generation and chat conversations. 1 report = ~5 credits, 1 chat message = 1 credit." },
  { q: "Can I upgrade or downgrade anytime?", a: "Yes! Change your plan anytime. Upgrades take effect immediately, downgrades at the next billing cycle." },
  { q: "What happens if I exceed my limits?", a: "You'll be notified when reaching 75% usage. You can upgrade anytime or wait until next month's reset." },
  { q: "Do you offer refunds?", a: "Yes, 14-day money-back guarantee on all paid plans, no questions asked." },
  { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and never share your data. Your business ideas remain 100% yours." },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Founder, FitTrack", quote: "Validifier saved me 3 months of research. The AI analysis was spot-on and helped me pivot before wasting money.", avatar: "SK" },
  { name: "Marcus T.", role: "CEO, DataBridge", quote: "The competitive landscape analysis alone was worth the subscription. Found gaps in the market I never would have seen.", avatar: "MT" },
  { name: "Elena R.", role: "Co-founder, GreenRoute", quote: "We use the Growth plan for our team. The collaboration features and unlimited frameworks are game-changers.", avatar: "ER" },
];

/* Animated price display */
const AnimatedPrice = ({ price, isAnnual }: { price: string; isAnnual: boolean }) => {
  const [display, setDisplay] = useState(price);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const t = setTimeout(() => {
      setDisplay(price);
      setAnimating(false);
    }, 150);
    return () => clearTimeout(t);
  }, [price]);

  return (
    <span
      className={`inline-block tabular-nums transition-all duration-300 ${animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
    >
      {display}
    </span>
  );
};

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
          <div className={`flex ${open ? "" : ""}`}>
            <div className={`w-1 shrink-0 rounded-full transition-all duration-300 ${open ? "bg-gradient-to-b from-primary to-secondary" : "bg-transparent"}`} />
            <p className="text-sm text-muted-foreground p-5 pt-0 pl-4">{a}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map plan names to Stripe price IDs — replace with real IDs from your Stripe dashboard
const STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  Starter: {
    monthly: "price_starter_monthly_placeholder",
    annual: "price_starter_annual_placeholder",
  },
  Growth: {
    monthly: "price_growth_monthly_placeholder",
    annual: "price_growth_annual_placeholder",
  },
  Pro: {
    monthly: "price_pro_monthly_placeholder",
    annual: "price_pro_annual_placeholder",
  },
};

const Pricing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthlyPrice === 0) return "$0";
    return `$${isAnnual ? plan.annualPrice : plan.monthlyPrice}`;
  };

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.name === "Free") {
      navigate("/auth");
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    const priceIds = STRIPE_PRICE_IDS[plan.name];
    if (!priceIds) return;

    setLoadingPlan(plan.name);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          price_id: isAnnual ? priceIds.annual : priceIds.monthly,
          plan_name: plan.name,
        },
      });

      if (error) throw error;
      if (data?.url) {
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
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Header with gradient mesh */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Decorative gradient mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-primary/5 blur-[80px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Start free, scale as you validate more ideas. No hidden fees, cancel anytime.
            </p>

            {/* Annual Toggle — gradient pill */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  !isAnnual
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isAnnual
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                    isAnnual
                      ? "bg-primary-foreground/20 text-primary-foreground animate-shimmer"
                      : "bg-success/20 text-success"
                  }`}
                  style={isAnnual ? { backgroundImage: "linear-gradient(90deg, transparent 0%, hsl(var(--primary-foreground) / 0.3) 50%, transparent 100%)", backgroundSize: "200% 100%" } : {}}
                >
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 max-w-7xl mx-auto items-start">
            {PLANS.map((plan, index) => {
              const isPopular = plan.popular;
              return (
                <div
                  key={index}
                  className={`relative group transition-all duration-500 ${
                    isPopular ? "lg:scale-105 lg:z-10" : ""
                  }`}
                >
                  {/* Animated gradient border for popular */}
                  {isPopular && (
                    <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient opacity-80" />
                  )}

                  <Card
                    className={`relative p-7 space-y-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
                      isPopular
                        ? "border-0 shadow-glow"
                        : "border border-border hover:border-primary/30 hover:shadow-medium"
                    }`}
                  >
                    {plan.badge && (
                      <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-medium ${
                        isPopular
                          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {plan.badge}
                      </div>
                    )}

                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      {plan.subtitle && (
                        <p className="text-sm text-muted-foreground mt-0.5">{plan.subtitle}</p>
                      )}
                      <div className="mt-5 mb-1">
                        <span className="text-4xl font-extrabold font-mono tabular-nums text-foreground">
                          <AnimatedPrice price={getPrice(plan)} isAnnual={isAnnual} />
                        </span>
                        {plan.monthlyPrice > 0 && (
                          <span className="text-muted-foreground text-sm ml-1">/month</span>
                        )}
                      </div>
                      {isAnnual && plan.monthlyPrice > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Billed ${plan.annualPrice * 12}/year
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-border" />

                    <ul className="space-y-3 flex-grow">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start gap-2.5 opacity-50">
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-sm line-through">{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    {user && profile?.subscription_tier === plan.name.toLowerCase() ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : user && profile?.subscription_tier !== "free" && plan.name !== "Free" ? (
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
                          "Change Plan"
                        )}
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

      <ScrollReveal>
      {/* Feature Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-center mb-2">Compare All Features</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">See exactly what's included in each plan</p>

          <div className="max-w-5xl mx-auto overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 bg-card z-10 border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground min-w-[200px]">Feature</th>
                  {PLANS.map((p, i) => (
                    <th key={i} className={`p-4 text-center font-semibold min-w-[120px] ${p.popular ? "text-primary" : "text-foreground"}`}>
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
                          <Check className="h-4 w-4 text-success mx-auto" />
                        ) : val === false ? (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
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

      <ScrollReveal>
      {/* Social Proof Strip */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            Trusted by founders building real businesses
          </p>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory max-w-5xl mx-auto scrollbar-hide">
            {TESTIMONIALS.map((t, i) => (
              <Card
                key={i}
                className="p-6 min-w-[300px] md:min-w-0 md:flex-1 snap-center border border-border hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Quote className="h-5 w-5 text-primary/30 mb-3" />
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
      {/* FAQ Section */}
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
            Ready to Validate Your Next Big Idea?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Join 10,000+ entrepreneurs who validated their ideas with Validifier
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="shadow-large"
          >
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
