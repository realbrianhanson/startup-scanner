import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface ReportNavigationProps {
  reportData: any;
}

export function ReportNavigation({ reportData }: ReportNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  const sections: Section[] = [
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
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      })).filter(s => s.element);

      const scrollPosition = window.scrollY + 150;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth"
      });
    }
  };

  if (sections.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24 h-fit">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Sections
        </p>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "w-full text-left text-sm py-1.5 px-3 transition-colors border-l-2",
              activeSection === section.id
                ? "border-l-primary text-foreground font-medium"
                : "border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-muted-foreground/30"
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
