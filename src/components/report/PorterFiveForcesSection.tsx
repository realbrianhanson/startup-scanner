import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString, getPorterFiveForces } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const FORCES = [
  { key: "supplier_power", label: "Supplier Power" },
  { key: "buyer_power", label: "Buyer Power" },
  { key: "competitive_rivalry", label: "Competitive Rivalry" },
  { key: "threat_of_substitution", label: "Threat of Substitution" },
  { key: "threat_of_new_entry", label: "Threat of New Entry" },
] as const;

const ratingBorderColor = (rating: string) => {
  const r = rating?.toLowerCase();
  if (r === "high") return "border-l-red-500";
  if (r === "low") return "border-l-emerald-500";
  return "border-l-amber-500";
};

export const PorterFiveForcesSection = ({ reportData }: Props) => {
  if (!reportData.porter_five_forces) return null;

  const porterData = getPorterFiveForces(reportData.porter_five_forces);
  if (!porterData) return null;

  return (
    <ReportSectionCard id="porter-five-forces" title="Porter's Five Forces">
      <div className="space-y-3">
        {FORCES.map((f) => {
          const force = (porterData as any)[f.key];
          const rating = force?.rating || "Medium";
          return (
            <div
              key={f.key}
              className={`bg-card rounded-lg p-4 border-l-[3px] ${ratingBorderColor(rating)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{f.label}</h4>
                <Badge
                  variant={rating === "High" ? "destructive" : rating === "Low" ? "default" : "secondary"}
                  className="text-[10px]"
                >
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
    </ReportSectionCard>
  );
};
