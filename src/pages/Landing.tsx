import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Target, Users, Check, ArrowRight, BarChart3, Globe, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

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
      <nav className="border-b border-white/10 bg-[hsl(222,47%,8%)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-[hsl(221,83%,53%)]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(265,71%,57%)] bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-white/70 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-medium">
              Get Started
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
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-[hsl(221,83%,53%)] opacity-[0.08] blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[hsl(265,71%,57%)] opacity-[0.1] blur-[100px] animate-float delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(240,60%,50%)] opacity-[0.05] blur-[140px] animate-float delay-300" />

        {/* Noise texture */}
        <div className="noise-bg absolute inset-0" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.03em] text-white animate-fade-up">
                Validate Your Idea{" "}
                <br className="hidden md:block" />
                in{" "}
                <span className="bg-gradient-to-r from-[hsl(221,83%,53%)] via-[hsl(265,71%,67%)] to-[hsl(221,83%,53%)] bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                  60 Seconds
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto animate-fade-up delay-200">
                Stop building products nobody wants. Get AI-powered validation with McKinsey-style
                strategic analysis—before you waste months.
              </p>
            </div>

            {/* CTA */}
            <div className="animate-fade-up delay-400">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-10 py-7 shadow-large animate-pulse-glow"
              >
                Validate My Idea Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-center space-x-8 text-sm text-white/40 animate-fade-up delay-500">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-[hsl(142,71%,45%)]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-[hsl(142,71%,45%)]" />
                <span>60-second reports</span>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="animate-fade-up delay-600 pt-4">
              <div className="max-w-lg mx-auto glass rounded-2xl p-6 border border-white/[0.08]" style={{ transform: "perspective(1200px) rotateX(4deg)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">validifier.com/report</span>
                </div>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 rounded bg-white/10" />
                    <div className="h-2 w-20 rounded bg-white/5" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[hsl(142,71%,45%)]">78</div>
                    <div className="text-[9px] text-white/30">Score</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 rounded-full bg-[hsl(142,71%,45%)]/40 flex-1" style={{ maxWidth: "78%" }} />
                    <span className="text-[9px] text-white/25">Market</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 rounded-full bg-[hsl(221,83%,53%)]/40 flex-1" style={{ maxWidth: "65%" }} />
                    <span className="text-[9px] text-white/25">Competition</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 rounded-full bg-[hsl(265,71%,57%)]/40 flex-1" style={{ maxWidth: "85%" }} />
                    <span className="text-[9px] text-white/25">Feasibility</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <div className="h-6 w-16 rounded bg-white/5" />
                  <div className="h-6 w-20 rounded bg-white/5" />
                  <div className="h-6 w-14 rounded bg-white/5" />
                </div>
              </div>
            </div>

            {/* Trust Bar */}
            <div className="animate-fade-up delay-700 pt-6 space-y-6">
              <div className="flex items-center justify-center space-x-2 text-white/50">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Trusted by <AnimatedCounter target={10000} suffix="+" /> entrepreneurs
                </span>
              </div>
              <div className="flex items-center justify-center space-x-6">
                {["TechCrunch", "Product Hunt", "Y Combinator"].map((name) => (
                  <div
                    key={name}
                    className="px-4 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/25 font-medium tracking-wide"
                  >
                    {name}
                  </div>
                ))}
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
