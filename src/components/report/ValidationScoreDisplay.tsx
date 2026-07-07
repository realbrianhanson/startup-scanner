import { useEffect, useState, useRef } from "react";
import { ScoreBreakdownChart } from "./ScoreBreakdownChart";

interface ScoreFactor {
  name: string;
  score: number;
  weight: string;
}

interface ValidationScoreDisplayProps {
  score: number;
  justification?: string;
  factors?: ScoreFactor[];
}

const getScoreColor = (score: number, resolved: boolean) => {
  if (!resolved) return "text-foreground/80";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getScoreStatus = (score: number) =>
  score >= 70 ? "Strong Potential" : score >= 40 ? "Moderate Potential" : "Needs Work";

export const ValidationScoreDisplay = ({ score, justification, factors }: ValidationScoreDisplayProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [resolved, setResolved] = useState(false);
  const hasAnimated = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1200;
          const steps = 60;
          const increment = score / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
              setDisplayScore(score);
              setResolved(true);
              clearInterval(timer);
            } else {
              setDisplayScore(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [score]);

  const hasFactors = factors && factors.length > 0;

  // Fallback bars for Standard reports (no factors)
  const fallbackBars = [
    { label: "Market", pct: Math.min(100, Math.round(score * 1.05)) },
    { label: "Competition", pct: Math.min(100, Math.round(score * 0.85)) },
    { label: "Feasibility", pct: Math.min(100, Math.round(score * 1.1)) },
    { label: "Financials", pct: Math.min(100, Math.round(score * 0.95)) },
  ];

  return (
    <div ref={containerRef} className="mb-16 md:mb-20">
      <div className="h-px bg-border mb-8" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
        {/* Score number & status */}
        <div className="space-y-2 shrink-0">
          <span className={`font-mono text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none transition-colors duration-500 ${getScoreColor(score, resolved)}`}>
            {displayScore}
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-medium text-foreground">
              {resolved ? getScoreStatus(score) : "Analyzing"}
            </span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          {justification && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mt-3">
              {justification}
            </p>
          )}
        </div>

        {/* Radar chart, or fallback score bars */}
        {hasFactors ? (
          <div className="mt-8 lg:mt-0">
            <ScoreBreakdownChart factors={factors} overallScore={score} />
          </div>
        ) : (
          <div className="mt-8 lg:mt-0 flex-1 w-full max-w-md space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Score breakdown
            </div>
            {fallbackBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs w-24 text-right font-mono text-muted-foreground/70">
                  {bar.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/60 transition-all duration-1000 ease-out"
                    style={{ width: resolved ? `${bar.pct}%` : "0%" }}
                  />
                </div>
                <span className="text-xs w-8 font-mono tabular-nums text-muted-foreground/70">
                  {resolved ? bar.pct : 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
