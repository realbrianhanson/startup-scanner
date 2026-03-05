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

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
};

const getScoreStatus = (score: number) =>
  score >= 70 ? "Strong Potential" : score >= 40 ? "Moderate Potential" : "Needs Work";

export const ValidationScoreDisplay = ({ score, justification, factors }: ValidationScoreDisplayProps) => {
  const [displayScore, setDisplayScore] = useState(0);
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

  return (
    <div ref={containerRef} className="mb-16 md:mb-20">
      <div className="h-px bg-border mb-8" />
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
        {/* Score number & status */}
        <div className="space-y-2 shrink-0">
          <span className={`font-mono text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none ${getScoreColor(score)}`}>
            {displayScore}
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-lg font-medium text-foreground">{getScoreStatus(score)}</span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          {justification && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mt-3">
              {justification}
            </p>
          )}
        </div>

        {/* Radar chart */}
        {factors && factors.length > 0 && (
          <div className="mt-8 lg:mt-0">
            <ScoreBreakdownChart factors={factors} overallScore={score} />
          </div>
        )}
      </div>
    </div>
  );
};
