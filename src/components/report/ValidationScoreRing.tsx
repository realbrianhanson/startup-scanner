import { useEffect, useState, useRef, useId } from "react";
import { Badge } from "@/components/ui/badge";

interface ValidationScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
}

const sizeConfig = {
  sm: { px: 80, viewBox: 120, strokeWidth: 8, fontSize: "text-lg", subSize: "text-[8px]", ring: 48 },
  md: { px: 160, viewBox: 120, strokeWidth: 7, fontSize: "text-4xl", subSize: "text-xs", ring: 48 },
  lg: { px: 200, viewBox: 120, strokeWidth: 6, fontSize: "text-5xl", subSize: "text-sm", ring: 48 },
};

const getScoreGradient = (score: number) => {
  if (score >= 70) return { start: "hsl(142, 71%, 45%)", end: "hsl(142, 71%, 60%)" };
  if (score >= 40) return { start: "hsl(38, 92%, 50%)", end: "hsl(45, 93%, 60%)" };
  return { start: "hsl(0, 84%, 60%)", end: "hsl(0, 84%, 45%)" };
};

const getScoreStatus = (score: number) =>
  score >= 70 ? "Strong Potential" : score >= 40 ? "Moderate Potential" : "Needs Work";

const getGlowColor = (score: number) => {
  if (score >= 70) return "hsl(142 71% 45% / 0.25)";
  if (score >= 40) return "hsl(38 92% 50% / 0.2)";
  return "hsl(0 84% 60% / 0.2)";
};

export const ValidationScoreRing = ({ score, size = "lg", showBadge = true }: ValidationScoreRingProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(100);
  const hasAnimated = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  const config = sizeConfig[size];
  const center = config.viewBox / 2;
  const radius = config.ring;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          // Animate ring fill
          requestAnimationFrame(() => {
            const targetOffset = ((100 - score) / 100) * circumference;
            setOffset(targetOffset);
          });

          // Animate counter
          const duration = 1500;
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
  }, [score, circumference]);

  const gradient = getScoreGradient(score);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      {/* Glow */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: getGlowColor(score),
            transform: "scale(1.1)",
          }}
        />
        <svg
          width={config.px}
          height={config.px}
          viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
          className="relative z-10 -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            opacity={0.4}
          />
          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={`${config.fontSize} font-bold tabular-nums leading-none`}>
            {displayScore}
          </span>
          {size !== "sm" && (
            <span className={`${config.subSize} text-muted-foreground mt-0.5`}>/100</span>
          )}
        </div>
      </div>

      {/* Badge */}
      {showBadge && size !== "sm" && (
        <Badge variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"}>
          {getScoreStatus(score)}
        </Badge>
      )}
    </div>
  );
};
