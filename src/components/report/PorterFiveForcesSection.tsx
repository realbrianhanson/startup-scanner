import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString, getPorterFiveForces } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const FORCES = [
  { key: "supplier_power", label: "Supplier Power", angle: -90 },
  { key: "buyer_power", label: "Buyer Power", angle: -18 },
  { key: "competitive_rivalry", label: "Competitive Rivalry", angle: 54 },
  { key: "threat_of_substitution", label: "Threat of Substitution", angle: 126 },
  { key: "threat_of_new_entry", label: "Threat of New Entry", angle: 198 },
] as const;

const ratingColor = (r: string) =>
  r === "High" ? "bg-destructive" : r === "Low" ? "bg-success" : "bg-warning";

const ratingWidth = (r: string) =>
  r === "High" ? "w-full" : r === "Low" ? "w-1/3" : "w-2/3";

export const PorterFiveForcesSection = ({ reportData }: Props) => {
  if (!reportData.porter_five_forces) return null;

  const porterData = getPorterFiveForces(reportData.porter_five_forces);
  if (!porterData) return null;

  return (
    <ReportSectionCard
      id="porter-five-forces"
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Porter's Five Forces"
    >
      {/* Pentagon layout - desktop: circle arrangement, mobile: stack */}
      <div className="hidden md:block relative mx-auto" style={{ width: 600, height: 500 }}>
        {/* Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-center z-10">
          <span className="text-xs font-semibold text-primary leading-tight">Competitive<br />Analysis</span>
        </div>

        {/* Lines from center */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 500">
          {FORCES.map((f) => {
            const rad = (f.angle * Math.PI) / 180;
            const cx = 300, cy = 250, r = 180;
            return (
              <line
                key={f.key}
                x1={cx}
                y1={cy}
                x2={cx + r * Math.cos(rad)}
                y2={cy + r * Math.sin(rad)}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Force cards */}
        {FORCES.map((f) => {
          const rad = (f.angle * Math.PI) / 180;
          const cx = 300, cy = 250, r = 200;
          const x = cx + r * Math.cos(rad);
          const y = cy + r * Math.sin(rad);
          const force = (porterData as any)[f.key];
          const rating = force?.rating || "Medium";

          return (
            <div
              key={f.key}
              className="absolute w-44 bg-card border rounded-xl p-4 shadow-sm -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <h4 className="font-semibold text-sm mb-2">{f.label}</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${ratingColor(rating)} ${ratingWidth(rating)} transition-all duration-700`} />
                </div>
                <Badge variant={rating === "High" ? "destructive" : rating === "Low" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                  {rating}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-4">
        {FORCES.map((f) => {
          const force = (porterData as any)[f.key];
          const rating = force?.rating || "Medium";
          return (
            <div key={f.key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{f.label}</h4>
                <Badge variant={rating === "High" ? "destructive" : rating === "Low" ? "default" : "secondary"}>
                  {rating}
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                <div className={`h-full rounded-full ${ratingColor(rating)} ${ratingWidth(rating)} transition-all duration-700`} />
              </div>
              {force?.analysis && (
                <MarkdownContent content={toMarkdownString(force.analysis)} />
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed analysis below pentagon */}
      <div className="hidden md:block border-t border-border/50 pt-6 space-y-4">
        {FORCES.map((f) => {
          const force = (porterData as any)[f.key];
          if (!force?.analysis) return null;
          return (
            <div key={f.key}>
              <h4 className="font-semibold text-sm mb-1">{f.label}</h4>
              <MarkdownContent content={toMarkdownString(force.analysis)} />
            </div>
          );
        })}
      </div>
    </ReportSectionCard>
  );
};
