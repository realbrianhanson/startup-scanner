import { useEffect, useState, useRef, useMemo } from "react";
import { Check, Sparkles } from "lucide-react";
import { ValidationScoreRing } from "./ValidationScoreRing";

/* ── Section metadata ── */
const SECTIONS = [
  { key: "executive_summary", label: "Executive Summary", verb: "Crafting executive overview..." },
  { key: "market_analysis", label: "Market Analysis", verb: "Analyzing market landscape..." },
  { key: "customer_personas", label: "Customer Personas", verb: "Building customer profiles..." },
  { key: "competitive_landscape", label: "Competitive Landscape", verb: "Mapping competitors..." },
  { key: "strategic_frameworks", label: "SWOT Analysis", verb: "Evaluating strategic position..." },
  { key: "porter_five_forces", label: "Porter's Five Forces", verb: "Assessing competitive forces..." },
  { key: "pestel_analysis", label: "PESTEL Analysis", verb: "Scanning macro-environment..." },
  { key: "catwoe_analysis", label: "CATWOE Analysis", verb: "Analyzing stakeholder perspectives..." },
  { key: "path_to_mvp", label: "Path to MVP", verb: "Planning your MVP roadmap..." },
  { key: "go_to_market_strategy", label: "Go-to-Market Strategy", verb: "Designing launch strategy..." },
  { key: "usp_analysis", label: "Unique Selling Proposition", verb: "Identifying your edge..." },
  { key: "game_changing_idea", label: "Game-Changing Idea", verb: "Generating a strategic breakthrough..." },
  { key: "financial_basics", label: "Financial Basics", verb: "Running financial projections..." },
  { key: "risk_matrix", label: "Risk Matrix", verb: "Mapping risks and mitigations..." },
  { key: "action_plan", label: "30-Day Action Plan", verb: "Building your action plan..." },
] as const;

const PRO_TIPS = [
  "Think about who your first 10 customers would be",
  "Great startups solve painful problems, not nice-to-haves",
  "Your unfair advantage is what competitors can't easily copy",
  "Talk to 5 potential customers before writing any code",
  "Focus on one channel that works before trying them all",
  "The best MVPs solve one problem exceptionally well",
];

/* ── Radar Scan animation (SVG) ── */
const RadarScan = () => (
  <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto">
    {/* Glow */}
    <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl animate-pulse" />
    <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
      {/* Concentric circles */}
      {[70, 50, 30].map((r) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          opacity="0.2"
        />
      ))}
      {/* Cross lines */}
      <line x1="100" y1="20" x2="100" y2="180" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.15" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.15" />
      {/* Sweep */}
      <defs>
        <linearGradient id="sweep-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <g className="origin-center animate-[spin_3s_linear_infinite]" style={{ transformOrigin: "100px 100px" }}>
        <path
          d="M100,100 L100,30 A70,70 0 0,1 160,60 Z"
          fill="url(#sweep-grad)"
          opacity="0.6"
        />
        <line x1="100" y1="100" x2="100" y2="30" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.8" />
      </g>
      {/* Center dot */}
      <circle cx="100" cy="100" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
    </svg>
  </div>
);

/* ── Sparkle burst animation ── */
const SparkleBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <span className="absolute -top-1 -right-1 flex">
      <Sparkles className="h-3.5 w-3.5 text-success animate-scale-in" />
    </span>
  );
};

/* ── Completion celebration ── */
const CompletionCelebration = ({ score }: { score: number }) => (
  <div className="flex flex-col items-center space-y-6 animate-scale-in py-8">
    {/* Sparkle ring */}
    <div className="relative">
      <div className="absolute -inset-8 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary animate-ping"
            style={{
              left: `${50 + 42 * Math.cos((i * Math.PI * 2) / 8)}%`,
              top: `${50 + 42 * Math.sin((i * Math.PI * 2) / 8)}%`,
              animationDelay: `${i * 100}ms`,
              animationDuration: "1.5s",
              animationIterationCount: "2",
            }}
          />
        ))}
      </div>
      <ValidationScoreRing score={score} size="lg" />
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-3xl font-bold gradient-text">Your report is ready</h2>
      <p className="text-muted-foreground">Scroll down to explore your analysis</p>
    </div>
  </div>
);

/* ── Main component ── */
interface GenerationExperienceProps {
  generationStatus: Record<string, string> | null;
  isComplete: boolean;
  validationScore: number;
  startedAt?: number;
}

export const GenerationExperience = ({
  generationStatus,
  isComplete,
  validationScore,
  startedAt,
}: GenerationExperienceProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());
  const prevStatus = useRef<Record<string, string>>({});
  const tipIndex = useRef(Math.floor(Math.random() * PRO_TIPS.length));

  const status = generationStatus || {};

  // Detect newly completed sections for sparkle
  useEffect(() => {
    const prev = prevStatus.current;
    const newlyDone = new Set<string>();
    for (const s of SECTIONS) {
      if (status[s.key] === "complete" && prev[s.key] !== "complete") {
        newlyDone.add(s.key);
      }
    }
    if (newlyDone.size > 0) {
      setJustCompleted(newlyDone);
      setTimeout(() => setJustCompleted(new Set()), 1200);
    }
    prevStatus.current = { ...status };
  }, [status]);

  // Handle completion
  useEffect(() => {
    if (isComplete) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Current section and estimated time
  const currentSection = useMemo(() => {
    return SECTIONS.find((s) => status[s.key] === "generating");
  }, [status]);

  const completedCount = useMemo(
    () => SECTIONS.filter((s) => status[s.key] === "complete").length,
    [status]
  );

  const estimatedRemaining = useMemo(() => {
    const remaining = SECTIONS.length - completedCount;
    const seconds = remaining * 8; // ~8s per section
    if (seconds <= 10) return "Almost done...";
    if (seconds <= 30) return `About ${Math.round(seconds / 5) * 5} seconds remaining`;
    return `About ${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) > 1 ? "s" : ""} remaining`;
  }, [completedCount]);

  if (showCelebration) {
    return <CompletionCelebration score={validationScore} />;
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* ── Section Timeline (left) ── */}
        <div className="relative">
          <div className="space-y-0">
            {SECTIONS.map((section, idx) => {
              const s = status[section.key] || "pending";
              const isGenerating = s === "generating";
              const isDone = s === "complete";
              const sparked = justCompleted.has(section.key);

              return (
                <div key={section.key} className="flex items-center gap-3 relative py-2.5">
                  {/* Vertical connecting line */}
                  {idx < SECTIONS.length - 1 && (
                    <div
                      className="absolute left-[11px] top-[30px] w-[2px] h-[calc(100%-10px)]"
                      style={{
                        background: isDone
                          ? "hsl(var(--success))"
                          : "hsl(var(--border))",
                        transition: "background 0.5s ease",
                      }}
                    />
                  )}

                  {/* Circle indicator */}
                  <div className="relative shrink-0 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isDone
                          ? "bg-success border-success"
                          : isGenerating
                          ? "border-primary bg-primary/10 animate-pulse"
                          : "border-border bg-muted"
                      }`}
                    >
                      {isDone && (
                        <Check className="h-3.5 w-3.5 text-success-foreground animate-scale-in" />
                      )}
                      {isGenerating && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      )}
                    </div>
                    <SparkleBurst active={sparked} />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm transition-all duration-300 ${
                      isDone
                        ? "text-foreground font-medium"
                        : isGenerating
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {section.label}
                    {isGenerating && (
                      <span className="inline-block ml-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Center Stage (right) ── */}
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-6 lg:py-12">
          <RadarScan />

          {/* Current action */}
          <div className="space-y-3">
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
              {currentSection?.verb || "Preparing analysis..."}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {estimatedRemaining}
            </p>
          </div>

          {/* Progress fraction */}
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
                style={{ width: `${(completedCount / SECTIONS.length) * 100}%` }}
              />
            </div>
            <span className="tabular-nums font-medium">
              {completedCount}/{SECTIONS.length}
            </span>
          </div>

          {/* Pro tip */}
          <div className="max-w-sm mx-auto">
            <p className="text-xs text-muted-foreground/70 italic">
              <span className="font-semibold text-muted-foreground not-italic">Pro tip:</span>{" "}
              {PRO_TIPS[tipIndex.current]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
