import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface ReportNavigationProps {
  reportData: any;
  variant?: "desktop" | "mobile";
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const offset = 100;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

export function ReportNavigation({ reportData, variant = "desktop" }: ReportNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  const sections: Section[] = useMemo(() => [
    ...(reportData.executive_summary ? [{ id: "executive-summary", label: "Executive Summary" }] : []),
    ...(reportData.game_changing_idea ? [{ id: "game-changing-idea", label: "Game-Changing Idea" }] : []),
    ...(reportData.market_analysis ? [{ id: "market-analysis", label: "Market Analysis" }] : []),
    ...(reportData.customer_personas?.length > 0 ? [{ id: "customer-personas", label: "Target Customers" }] : []),
    ...(reportData.competitive_landscape ? [{ id: "competitive-landscape", label: "Competition" }] : []),
    ...(reportData.strategic_frameworks ? [{ id: "strategic-frameworks", label: "SWOT Analysis" }] : []),
    ...(reportData.porter_five_forces ? [{ id: "porter-five-forces", label: "Porter's Five Forces" }] : []),
    ...(reportData.pestel_analysis ? [{ id: "pestel-analysis", label: "PESTEL Analysis" }] : []),
    ...(reportData.catwoe_analysis ? [{ id: "catwoe-analysis", label: "CATWOE Analysis" }] : []),
    ...(reportData.path_to_mvp ? [{ id: "path-to-mvp", label: "Path to MVP" }] : []),
    ...(reportData.go_to_market_strategy ? [{ id: "go-to-market", label: "Go-to-Market" }] : []),
    ...(reportData.usp_analysis ? [{ id: "usp-analysis", label: "USP Analysis" }] : []),
    ...(reportData.financial_basics ? [{ id: "financial-basics", label: "Financial Basics" }] : []),
    ...(reportData.risk_matrix ? [{ id: "risk-matrix", label: "Risk Matrix" }] : []),
    ...(reportData.action_plan ? [{ id: "action-plan", label: "Action Plan" }] : []),
  ], [reportData]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      let current = sections[0]?.id || "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el) {
          const elementTop = el.getBoundingClientRect().top + window.scrollY;
          if (elementTop <= scrollPosition) {
            current = s.id;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  if (sections.length === 0) return null;

  if (variant === "mobile") {
    return (
      <div className="lg:hidden sticky top-[64px] z-40 bg-background/90 backdrop-blur-sm border-b border-border/60">
        <div className="container mx-auto px-4 py-2 max-w-3xl">
          <label htmlFor="report-section-jump" className="sr-only">
            Jump to report section
          </label>
          <select
            id="report-section-jump"
            aria-label="Jump to report section"
            value={activeSection || sections[0].id}
            onChange={(e) => {
              const id = e.target.value;
              setActiveSection(id);
              scrollToSection(id);
            }}
            className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 text-sm"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <nav className="hidden lg:block sticky top-24 h-fit">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Sections
        </p>
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "location" : undefined}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "w-full text-left text-sm py-1.5 px-3 transition-colors border-l-2",
                isActive
                  ? "border-l-primary text-foreground font-medium"
                  : "border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-muted-foreground/30"
              )}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}