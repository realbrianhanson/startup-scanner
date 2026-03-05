import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Target,
  Clock,
  Rocket,
  CreditCard,
  Settings,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface OnboardingOverlayProps {
  userName: string;
  credits: number;
  onComplete: () => void;
  userId: string;
}

const OnboardingOverlay = ({ userName, credits, onComplete, userId }: OnboardingOverlayProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const completeOnboarding = async () => {
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("id", userId);
    } catch {}
    onComplete();
  };

  const handleValidateNow = async () => {
    await completeOnboarding();
    navigate("/projects/new");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg mx-4">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6 animate-fade-up text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                Welcome to Validifier, {userName}! 🎉
              </h2>
              <p className="text-muted-foreground">
                Let's validate your first business idea in 60 seconds.
              </p>
            </div>

            <div className="grid gap-3 text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">AI-Powered Analysis</p>
                  <p className="text-xs text-muted-foreground">Get market, competitor & financial insights instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">60-Second Reports</p>
                  <p className="text-xs text-muted-foreground">Full validation report generated in under a minute</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Actionable Insights</p>
                  <p className="text-xs text-muted-foreground">Strategic frameworks to guide your next steps</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={() => setStep(1)}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Quick Tour */}
        {step === 1 && (
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6 animate-fade-up text-center">
            <h2 className="text-xl font-bold">Quick Tour</h2>
            <p className="text-sm text-muted-foreground">Here's how Validifier works</p>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">New Project</p>
                  <p className="text-xs text-muted-foreground">Click "New Project" to start validating an idea</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                <div className="p-2.5 rounded-xl bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Credits</p>
                  <p className="text-xs text-muted-foreground">You have {credits} AI credits to use this month</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                <div className="p-2.5 rounded-xl bg-muted">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Settings</p>
                  <p className="text-xs text-muted-foreground">Manage your account and subscription here</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: First Action */}
        {step === 2 && (
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6 animate-fade-up text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/20">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Ready to validate your first idea?</h2>
              <p className="text-sm text-muted-foreground">
                Start your first validation or explore the dashboard first.
              </p>
            </div>

            <div className="grid gap-3">
              <Button size="lg" className="w-full" onClick={handleValidateNow}>
                <Rocket className="mr-2 h-4 w-4" />
                Validate Now
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={completeOnboarding}>
                Explore Dashboard
              </Button>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step indicators for steps 0 & 1 */}
        {step < 2 && (
          <div className="flex justify-center gap-1.5 pt-4">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Skip button */}
        {step < 2 && (
          <div className="text-center pt-3">
            <button
              onClick={completeOnboarding}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Skip onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingOverlay;
