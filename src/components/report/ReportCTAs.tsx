import { useState, useEffect } from "react";
import { CalendarCheck, ArrowRight, X, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CALENDLY_URL = "https://calendly.com/REPLACE_WITH_YOUR_LINK";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

function openCalendly(utm: string) {
  const url = `${CALENDLY_URL}?utm_source=validifier&utm_medium=report&utm_campaign=${utm}`;
  if (window.Calendly) {
    window.Calendly.initPopupWidget({ url });
  } else {
    window.open(url, "_blank");
  }
}

/* ─── LOCATION 1: Inline CTA after Game-Changing Idea ─── */
export const InlineReportCTA = () => (
  <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-secondary p-[1px]">
    <div className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-3 text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-bold text-primary-foreground">
            Love this idea? Let's make it happen.
          </h3>
          <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg">
            Book a free 15-minute strategy call. We'll review your validation report together and map out your next steps.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              size="lg"
              onClick={() => openCalendly("inline_cta")}
              className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg animate-[pulse_3s_ease-in-out_infinite] hover:animate-none"
            >
              Book Your Free Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-[11px] text-primary-foreground/60">
              No obligation. No pitch. Just actionable advice.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shrink-0">
          <CalendarCheck className="h-12 w-12 text-primary-foreground/80" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── LOCATION 2: Sticky Bottom Bar ─── */
export const StickyReportCTA = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("report-cta-dismissed")) {
      setDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.5);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("report-cta-dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-out hidden md:block",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background/80 backdrop-blur-xl border-t shadow-[0_-4px_20px_-4px_hsl(var(--primary)/0.15)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">Have questions about your report? </span>
            <span className="font-medium text-foreground">Talk to a strategist for free.</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openCalendly("sticky_bar")}
              className="font-semibold"
            >
              <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
              Book a Free Strategy Call
            </Button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── LOCATION 3: End-of-Report CTA ─── */
export const EndOfReportCTA = () => {
  const valuePoints = [
    "Walk through your validation results with an expert",
    "Get personalized advice on your biggest challenges",
    "Build a custom action plan for your first 30 days",
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-[1.5px]">
      <div className="rounded-2xl bg-card p-8 md:p-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Next Step</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold">
          Ready to Turn This Report Into Reality?
        </h3>

        <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
          {valuePoints.map((point, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-left w-full">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <span>{point}</span>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          onClick={() => openCalendly("end_of_report")}
          className="text-base px-8 font-semibold shadow-lg"
        >
          <CalendarCheck className="mr-2 h-5 w-5" />
          Schedule Your Free Strategy Session
        </Button>

        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Avatar group for social proof */}
          <div className="flex items-center -space-x-2">
            {[
              "bg-primary/70",
              "bg-secondary/70",
              "bg-primary/50",
              "bg-secondary/50",
            ].map((bg, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary-foreground",
                  bg
                )}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Trusted by 500+ founders who validated with Validifier
          </p>
        </div>
      </div>
    </div>
  );
};
