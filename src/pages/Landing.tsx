import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Target, Users, Check, ArrowRight, BarChart3, Globe, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Landing = () => {
  const navigate = useNavigate();

  const valueProps = [
    {
      icon: Zap,
      title: "Fast Analysis",
      description: "Complete validation report in 60 seconds",
    },
    {
      icon: Target,
      title: "Expert Frameworks",
      description: "SWOT, PESTEL, Porter's Five Forces, Financial Projections",
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join 10K+ founders validating their ideas",
    },
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      features: ["1 project per month", "5 AI chat messages", "Basic frameworks"],
      cta: "Start Free",
    },
    {
      name: "Starter",
      price: "$29",
      features: ["3 active projects", "50 AI chat messages/month", "All strategic frameworks"],
      popular: true,
      badge: "BEST FOR FIRST IDEA",
      cta: "Start 14-Day Trial",
    },
    {
      name: "Growth",
      price: "$79",
      features: ["10 active projects", "200 AI chat messages/month", "Team collaboration"],
      cta: "Start 14-Day Trial",
    },
  ];

  const testimonials = [
    {
      quote: "Validifier helped me avoid building a product nobody wanted. Saved me 6 months!",
      author: "Sarah Chen",
      role: "First-time Founder",
    },
    {
      quote: "The McKinsey-style analysis gave me confidence to pitch investors. Raised $500K seed.",
      author: "Marcus Rodriguez",
      role: "SaaS Entrepreneur",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-medium">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-subtle py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Validate Your Business Idea in{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  60 Seconds
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Stop building products nobody wants. Get AI-powered validation with McKinsey-style
                strategic analysis—before you waste months.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="text-sm">Trusted by 10,000+ first-time entrepreneurs</span>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 shadow-large hover:shadow-glow transition-all"
            >
              Validate My Idea Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="pt-8 flex justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-success" />
                <span>60-second reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <Card
                key={index}
                className="p-8 text-center space-y-4 hover:shadow-medium transition-all border-2 hover:border-primary/20"
              >
                <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-glow">
                  <prop.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{prop.title}</h3>
                <p className="text-muted-foreground">{prop.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4">How Validifier Works</h2>
              <p className="text-xl text-muted-foreground">
                Professional-grade business validation in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <h3 className="text-xl font-bold">Describe Your Idea</h3>
                <p className="text-muted-foreground">
                  Tell us about your business concept, target market, and goals
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <h3 className="text-xl font-bold">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes market fit using proven strategic frameworks
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-accent text-accent-foreground rounded-xl flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-bold">Get Your Report</h3>
                <p className="text-muted-foreground">
                  Receive actionable insights and validation score in 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">
                Start free, scale as you validate more ideas
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <Card
                  key={index}
                  className={`p-8 space-y-6 relative ${
                    tier.popular
                      ? "border-2 border-primary shadow-large"
                      : "border-2 hover:border-primary/20"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-hero text-white px-4 py-1 rounded-full text-sm font-medium shadow-medium">
                      {tier.badge || "Most Popular"}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {tier.cta}
                  </Button>
                </Card>
              ))}
            </div>

            <p className="text-center mt-8 text-sm text-muted-foreground">
              <button
                onClick={() => navigate("/pricing")}
                className="text-primary hover:underline cursor-pointer"
              >
                See all plans including Pro →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">
              What Founders Are Saying
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-8 space-y-4 border-2">
                  <p className="text-lg italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Validate Your Idea?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who validated their ideas before building
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 shadow-large"
          >
            Start Free Validation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Validifier</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered business validation for first-time entrepreneurs
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Pricing</button></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy</button></li>
                <li><button onClick={() => navigate("/terms")} className="hover:text-primary transition-colors">Terms</button></li>
              </ul>
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

export default Landing;
