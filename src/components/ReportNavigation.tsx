import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Zap,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Globe,
  DollarSign,
  Lightbulb,
  FileText,
  Sparkles,
} from "lucide-react";

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ReportNavigationProps {
  reportData: any;
}

export function ReportNavigation({ reportData }: ReportNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  const sections: Section[] = [
    ...(reportData.executive_summary ? [{ id: "executive-summary", label: "Executive Summary", icon: <Zap className="h-4 w-4" /> }] : []),
    ...(reportData.game_changing_idea ? [{ id: "game-changing-idea", label: "Game-Changing Idea", icon: <Sparkles className="h-4 w-4" /> }] : []),
    ...(reportData.market_analysis ? [{ id: "market-analysis", label: "Market Analysis", icon: <TrendingUp className="h-4 w-4" /> }] : []),
    ...(reportData.customer_personas?.length > 0 ? [{ id: "customer-personas", label: "Target Customers", icon: <Users className="h-4 w-4" /> }] : []),
    ...(reportData.competitive_landscape ? [{ id: "competitive-landscape", label: "Competition", icon: <Target className="h-4 w-4" /> }] : []),
    ...(reportData.strategic_frameworks ? [{ id: "strategic-frameworks", label: "Strategic Frameworks", icon: <BarChart3 className="h-4 w-4" /> }] : []),
    ...(reportData.porter_five_forces ? [{ id: "porter-five-forces", label: "Porter's Five Forces", icon: <Target className="h-4 w-4" /> }] : []),
    ...(reportData.pestel_analysis ? [{ id: "pestel-analysis", label: "PESTEL Analysis", icon: <Globe className="h-4 w-4" /> }] : []),
    ...(reportData.catwoe_analysis ? [{ id: "catwoe-analysis", label: "CATWOE Analysis", icon: <Users className="h-4 w-4" /> }] : []),
    ...(reportData.path_to_mvp ? [{ id: "path-to-mvp", label: "Path to MVP", icon: <Lightbulb className="h-4 w-4" /> }] : []),
    ...(reportData.go_to_market_strategy ? [{ id: "go-to-market", label: "Go-to-Market", icon: <Target className="h-4 w-4" /> }] : []),
    ...(reportData.usp_analysis ? [{ id: "usp-analysis", label: "USP Analysis", icon: <Zap className="h-4 w-4" /> }] : []),
    ...(reportData.financial_basics ? [{ id: "financial-basics", label: "Financial Basics", icon: <DollarSign className="h-4 w-4" /> }] : []),
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
      <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Jump to Section
        </p>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {section.icon}
            <span className="truncate">{section.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
