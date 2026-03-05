import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const CATWOE_ITEMS = [
  { key: "customers", letter: "C", label: "Customers" },
  { key: "actors", letter: "A", label: "Actors" },
  { key: "transformation", letter: "T", label: "Transformation" },
  { key: "world_view", letter: "W", label: "World View" },
  { key: "owners", letter: "O", label: "Owners" },
  { key: "environmental_constraints", letter: "E", label: "Environment" },
] as const;

export const CatwoeAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.catwoe_analysis) return null;
  const c = reportData.catwoe_analysis;

  return (
    <ReportSectionCard id="catwoe-analysis" title="CATWOE Analysis">
      <div className="space-y-0">
        {CATWOE_ITEMS.map((item) => {
          const data = c[item.key];
          if (!data) return null;
          const points = data.key_points || data.assumptions || data.stakeholders || data.constraints || data.inputs || [];

          return (
            <div key={item.key} className="py-4 border-b border-border/30 last:border-0">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-mono text-lg font-semibold text-primary">{item.letter}</span>
                <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</h4>
              </div>
              {data.description && <p className="text-sm text-muted-foreground mb-2">{data.description}</p>}
              <ul className="space-y-1.5">
                {points.map((point: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground">·</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {item.key === "transformation" && data.outputs && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Outputs:</p>
                  <ul className="space-y-1">
                    {data.outputs.map((o: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-1.5">
                        <span className="text-muted-foreground">→</span> {o}
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
