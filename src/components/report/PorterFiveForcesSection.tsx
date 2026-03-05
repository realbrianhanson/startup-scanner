import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString, getPorterFiveForces } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Props {
  reportData: any;
}

const ratingBorderColor = (rating: string) => {
  const r = rating?.toLowerCase();
  if (r === "high") return "border-l-red-500";
  if (r === "low") return "border-l-emerald-500";
  return "border-l-amber-500";
};

const ratingBadgeVariant = (rating: string): "destructive" | "default" | "secondary" => {
  if (rating?.toLowerCase() === "high") return "destructive";
  if (rating?.toLowerCase() === "low") return "default";
  return "secondary";
};

const firstSentence = (text: string | undefined): string => {
  if (!text) return "";
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0] : text.slice(0, 120);
};

const ForceNode = ({
  label,
  rating,
  analysis,
  compact,
}: {
  label: string;
  rating: string;
  analysis?: string;
  compact?: boolean;
}) => (
  <div
    className={cn(
      "bg-card rounded-lg border-l-[3px] transition-colors",
      ratingBorderColor(rating),
      compact ? "p-3" : "p-4"
    )}
  >
    <div className="flex items-center justify-between mb-1.5">
      <h4 className="font-medium text-xs md:text-sm leading-tight">{label}</h4>
      <Badge variant={ratingBadgeVariant(rating)} className="text-[10px] shrink-0 ml-2">
        {rating}
      </Badge>
    </div>
    {analysis && (
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {compact ? firstSentence(analysis) : analysis}
      </p>
    )}
  </div>
);

const DiagramDesktop = ({ porterData, projectName }: { porterData: any; projectName?: string }) => {
  const forces = {
    newEntry: { ...(porterData.threat_of_new_entry || {}), label: "Threat of New Entrants" },
    supplier: { ...(porterData.supplier_power || {}), label: "Supplier Power" },
    buyer: { ...(porterData.buyer_power || {}), label: "Buyer Power" },
    substitutes: { ...(porterData.threat_of_substitution || {}), label: "Threat of Substitutes" },
    rivalry: { ...(porterData.competitive_rivalry || {}), label: "Competitive Rivalry" },
  };

  return (
    <div className="space-y-4 my-6">
      {/* Diamond diagram */}
      <div className="relative grid grid-cols-3 grid-rows-3 gap-3 max-w-2xl mx-auto" style={{ minHeight: 340 }}>
        {/* Connecting lines — SVG overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 300 300"
        >
          {/* Top to center */}
          <line x1="150" y1="95" x2="150" y2="120" stroke="hsl(var(--border))" strokeWidth="1.5" />
          {/* Bottom to center */}
          <line x1="150" y1="180" x2="150" y2="205" stroke="hsl(var(--border))" strokeWidth="1.5" />
          {/* Left to center */}
          <line x1="95" y1="150" x2="120" y2="150" stroke="hsl(var(--border))" strokeWidth="1.5" />
          {/* Right to center */}
          <line x1="180" y1="150" x2="205" y2="150" stroke="hsl(var(--border))" strokeWidth="1.5" />
        </svg>

        {/* Top — New Entrants */}
        <div className="col-start-2 row-start-1 flex items-end justify-center">
          <ForceNode
            label={forces.newEntry.label}
            rating={forces.newEntry.rating || "Medium"}
            analysis={forces.newEntry.analysis}
            compact
          />
        </div>

        {/* Left — Supplier Power */}
        <div className="col-start-1 row-start-2 flex items-center justify-end">
          <ForceNode
            label={forces.supplier.label}
            rating={forces.supplier.rating || "Medium"}
            analysis={forces.supplier.analysis}
            compact
          />
        </div>

        {/* Center — Your Business */}
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <div className="w-full aspect-square max-w-[140px] rounded-full border-2 border-primary bg-primary/[0.06] flex flex-col items-center justify-center text-center p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Your</p>
            <p className="font-semibold text-sm text-primary">Business</p>
          </div>
        </div>

        {/* Right — Buyer Power */}
        <div className="col-start-3 row-start-2 flex items-center justify-start">
          <ForceNode
            label={forces.buyer.label}
            rating={forces.buyer.rating || "Medium"}
            analysis={forces.buyer.analysis}
            compact
          />
        </div>

        {/* Bottom — Substitutes */}
        <div className="col-start-2 row-start-3 flex items-start justify-center">
          <ForceNode
            label={forces.substitutes.label}
            rating={forces.substitutes.rating || "Medium"}
            analysis={forces.substitutes.analysis}
            compact
          />
        </div>
      </div>

      {/* Competitive Rivalry — full-width bar below */}
      <div className="max-w-2xl mx-auto">
        <div
          className={cn(
            "bg-card rounded-lg p-4 border-l-[3px]",
            ratingBorderColor(forces.rivalry.rating || "Medium")
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-medium text-sm">{forces.rivalry.label}</h4>
            <Badge variant={ratingBadgeVariant(forces.rivalry.rating || "Medium")} className="text-[10px]">
              {forces.rivalry.rating || "Medium"}
            </Badge>
          </div>
          {forces.rivalry.analysis && (
            <div className="text-sm text-muted-foreground">
              <MarkdownContent content={toMarkdownString(forces.rivalry.analysis)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FORCES_MOBILE = [
  { key: "threat_of_new_entry", label: "Threat of New Entrants" },
  { key: "supplier_power", label: "Supplier Power" },
  { key: "buyer_power", label: "Buyer Power" },
  { key: "threat_of_substitution", label: "Threat of Substitutes" },
  { key: "competitive_rivalry", label: "Competitive Rivalry" },
] as const;

const DiagramMobile = ({ porterData }: { porterData: any }) => (
  <div className="space-y-3">
    {/* Center badge */}
    <div className="flex justify-center my-4">
      <div className="rounded-full border-2 border-primary bg-primary/[0.06] px-6 py-3 text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your</p>
        <p className="font-semibold text-sm text-primary">Business</p>
      </div>
    </div>

    {FORCES_MOBILE.map((f) => {
      const force = porterData[f.key];
      const rating = force?.rating || "Medium";
      return (
        <div
          key={f.key}
          className={cn("bg-card rounded-lg p-4 border-l-[3px]", ratingBorderColor(rating))}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">{f.label}</h4>
            <Badge variant={ratingBadgeVariant(rating)} className="text-[10px]">
              {rating}
            </Badge>
          </div>
          {force?.analysis && (
            <div className="text-sm text-muted-foreground">
              <MarkdownContent content={toMarkdownString(force.analysis)} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export const PorterFiveForcesSection = ({ reportData }: Props) => {
  const isMobile = useIsMobile();

  if (!reportData.porter_five_forces) return null;

  const porterData = getPorterFiveForces(reportData.porter_five_forces);
  if (!porterData) return null;

  return (
    <ReportSectionCard id="porter-five-forces" title="Porter's Five Forces">
      {isMobile ? (
        <DiagramMobile porterData={porterData} />
      ) : (
        <DiagramDesktop porterData={porterData} />
      )}
    </ReportSectionCard>
  );
};
