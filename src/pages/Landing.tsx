import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Target, Users, Check, ArrowRight, BarChart3, Globe, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ScrollReveal } from "@/components/ScrollReveal";

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
    <div className="min-h-screen animate-fade-in" style={{ opacity: 1 }}>
      {/* Navigation */}
      <nav className="glass-nav-dark sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            onClick={() => navigate("/")}
          >
            <BarChart3 className="h-8 w-8 text-[hsl(221,83%,53%)]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(265,71%,57%)] bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-white/70 hover:text-white hover:bg-white/10 animate-fade-down delay-100">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="shadow-medium animate-fade-down delay-200">
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
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
          <div className="absolute top-[10%] -left-24 w-[300px] h-[300px] rounded-full bg-primary opacity-[0.08] dark:opacity-[0.12] blur-[120px] animate-float float-slow will-change-transform" />
          <div className="absolute bottom-[15%] -right-20 w-[250px] h-[250px] rounded-full bg-secondary opacity-[0.08] dark:opacity-[0.12] blur-[100px] animate-float float-slower will-change-transform" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[60%] left-[30%] w-[200px] h-[200px] rounded-full bg-primary opacity-[0.06] dark:opacity-[0.10] blur-[120px] animate-float float-slowest will-change-transform" style={{ animationDelay: "4s" }} />
          <div className="absolute top-[5%] right-[25%] w-[180px] h-[180px] rounded-full bg-secondary opacity-[0.06] dark:opacity-[0.10] blur-[100px] animate-float float-slow will-change-transform" style={{ animationDelay: "1s" }} />
        </div>

        {/* Noise texture */}
        <div className="noise-bg absolute inset-0" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white animate-fade-up">
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
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-[hsl(142,71%,45%)]">78</div>
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
      <ScrollReveal>
      <section id="features" className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section heading */}
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Why Founders Choose Validifier
            </h2>
            <div className="mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className={`group relative animate-fade-up delay-${(index + 1) * 200} ${index === 0 ? "md:col-span-2 md:row-span-1" : ""}`}
              >
                {/* Gradient border glow */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />
                <div className={`relative h-full rounded-2xl border border-border/50 bg-card p-8 ${index === 0 ? "md:p-10" : ""} space-y-4 transition-all duration-300 group-hover:border-primary/20 group-hover:shadow-large`}>
                  <div className="w-14 h-14 rounded-xl glass flex items-center justify-center border border-primary/20 group-hover:animate-float transition-transform duration-300">
                    <prop.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className={`font-bold ${index === 0 ? "text-2xl md:text-3xl" : "text-2xl"}`}>{prop.title}</h3>
                  <p className={`text-muted-foreground ${index === 0 ? "text-base md:text-lg max-w-lg" : ""}`}>{prop.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* How It Works */}
      <ScrollReveal>
      <section id="how-it-works" className="py-24 md:py-32 bg-gradient-subtle relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Section heading */}
            <div className="text-center mb-20 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                How Validifier Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Professional-grade business validation in three simple steps
              </p>
              <div className="mx-auto mt-4 w-24 h-1 rounded-full bg-gradient-to-r from-primary to-secondary" />
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Connecting line — desktop */}
              <div className="hidden md:block absolute top-[44px] left-[16.66%] right-[16.66%] h-[2px]">
                <div className="w-full h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full animate-shimmer bg-[length:200%_100%]" />
              </div>

              <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                {[
                  { num: "1", title: "Describe Your Idea", desc: "Tell us about your business concept, target market, and goals", color: "from-primary to-primary" },
                  { num: "2", title: "AI Analysis", desc: "Our AI analyzes market fit using proven strategic frameworks", color: "from-secondary to-secondary" },
                  { num: "3", title: "Get Your Report", desc: "Receive actionable insights and validation score in 60 seconds", color: "from-accent to-accent" },
                ].map((step, index) => (
                  <div key={index} className={`relative animate-fade-up delay-${(index + 1) * 200}`}>
                    {/* Mobile connecting line */}
                    {index < 2 && (
                      <div className="md:hidden absolute left-[22px] top-[56px] w-[2px] h-[calc(100%+48px-56px)] bg-gradient-to-b from-primary/30 to-secondary/30" />
                    )}

                    <div className="group text-center md:text-center space-y-4 transition-transform duration-300 hover:-translate-y-1">
                      {/* Step number */}
                      <div className="relative mx-auto w-[56px] h-[56px] md:mx-auto flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
                        <div className="relative w-[52px] h-[52px] rounded-full border-2 border-primary/30 bg-card flex items-center justify-center group-hover:border-primary/60 transition-colors duration-300">
                          <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                            {step.num}
                          </span>
                        </div>
                      </div>

                      {/* Desktop chevron */}
                      {index < 2 && (
                        <div className="hidden md:block absolute top-[34px] -right-4 text-muted-foreground/30">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      )}

                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Pricing */}
      <ScrollReveal>
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight">Simple, Transparent Pricing</h2>
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
                      <span className="text-4xl font-extrabold font-mono tabular-nums">{tier.price}</span>
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
      </ScrollReveal>

      {/* Testimonials */}
      <ScrollReveal>
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tight text-center mb-12">
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
      </ScrollReveal>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
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
