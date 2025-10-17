import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, BarChart3, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
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
      subtitle: null,
      monthlyPrice: 29,
      annualPrice: 24,
      badge: "BEST FOR FIRST IDEA",
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
      subtitle: null,
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
      subtitle: null,
      monthlyPrice: 199,
      annualPrice: 165,
      badge: "FOR SERIAL ENTREPRENEURS",
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

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return "$0";
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you validate more ideas. No hidden fees.
            </p>

            {/* Annual Toggle */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <span className={!isAnnual ? "font-semibold" : "text-muted-foreground"}>
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={isAnnual ? "font-semibold" : "text-muted-foreground"}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="ml-2">
                  Save 17%
                </Badge>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`p-8 space-y-6 relative flex flex-col ${
                  plan.popular
                    ? "border-2 border-primary shadow-large scale-105"
                    : "border-2 hover:border-primary/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-white px-4 py-1 rounded-full text-xs font-medium shadow-medium whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  {plan.subtitle && (
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  )}
                  <div className="mt-4 mb-2">
                    <span className="text-4xl font-bold">{getPrice(plan)}</span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Billed ${plan.annualPrice * 12}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start space-x-2 opacity-50">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm line-through">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20 space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What are AI credits?</h3>
              <p className="text-sm text-muted-foreground">
                AI credits power report generation and chat conversations. 1 report = ~5 credits, 1 chat message = 1 credit.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Change your plan anytime. Upgrades take effect immediately, downgrades at the next billing cycle.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
              <p className="text-sm text-muted-foreground">
                You'll be notified when reaching 75% usage. You can upgrade anytime or wait until next month's reset.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, 14-day money-back guarantee on all paid plans, no questions asked.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">
            Ready to Validate Your Next Big Idea?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
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
