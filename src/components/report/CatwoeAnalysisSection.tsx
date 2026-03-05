import { Users } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const CATWOE_ITEMS = [
  { key: "customers", letter: "C", label: "Customers", bg: "bg-primary/[0.06]", border: "border-primary/20", text: "text-primary" },
  { key: "actors", letter: "A", label: "Actors", bg: "bg-success/[0.06]", border: "border-success/20", text: "text-success" },
  { key: "transformation", letter: "T", label: "Transformation", bg: "bg-warning/[0.06]", border: "border-warning/20", text: "text-warning" },
  { key: "world_view", letter: "W", label: "World View", bg: "bg-secondary/[0.06]", border: "border-secondary/20", text: "text-secondary" },
  { key: "owners", letter: "O", label: "Owners", bg: "bg-destructive/[0.06]", border: "border-destructive/20", text: "text-destructive" },
  { key: "environmental_constraints", letter: "E", label: "Environment", bg: "bg-muted/30", border: "border-border", text: "text-muted-foreground" },
] as const;

export const CatwoeAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.catwoe_analysis) return null;
  const c = reportData.catwoe_analysis;

  return (
    <ReportSectionCard
      id="catwoe-analysis"
      icon={<Users className="h-5 w-5 text-primary" />}
      title="CATWOE Analysis"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATWOE_ITEMS.map((item, idx) => {
          const data = c[item.key];
          if (!data) return null;
          const points = data.key_points || data.assumptions || data.stakeholders || data.constraints || data.inputs || [];

          return (
            <div
              key={item.key}
              className={`rounded-xl ${item.bg} border ${item.border} p-5 animate-fade-up`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-lg font-bold ${item.text}`}>{item.letter}</span>
                <h4 className={`font-semibold ${item.text}`}>{item.label}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
              <ul className="space-y-1.5">
                {points.map((point: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.text.replace("text-", "bg-")}`} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* Transformation extras */}
              {item.key === "transformation" && data.outputs && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-semibold mb-1">Outputs:</p>
                  <ul className="space-y-1">
                    {data.outputs.map((o: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-warning">→</span> {o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ReportSectionCard>
  );
};
