import { Rocket, Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";
import { safeArray } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const GameChangingIdeaSection = ({ reportData }: Props) => {
  if (!reportData.game_changing_idea) return null;

  const data = reportData.game_changing_idea;

  return (
    <ReportSectionCard
      id="game-changing-idea"
      icon={<Rocket className="h-5 w-5 text-primary" />}
      title="Game-Changing Idea"
    >
      {/* Headline */}
      {data.headline && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-primary/[0.08] to-secondary/[0.08] border border-primary/15">
          <p className="text-xl font-bold text-foreground leading-relaxed">💡 {data.headline}</p>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div>
          <h3 className="font-semibold text-lg mb-3">The Idea</h3>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{data.description}</p>
        </div>
      )}

      {/* Why It Works */}
      {data.why_it_works && (
        <>
          <div className="border-t border-border/50" />
          <div className="p-4 rounded-xl bg-success/[0.05] border border-success/10">
            <h4 className="font-semibold text-sm text-success flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4" />
              Why This Works
            </h4>
            <p className="text-sm text-foreground/90">{data.why_it_works}</p>
          </div>
        </>
      )}

      {/* Implementation Steps */}
      {safeArray(data.implementation_steps).length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">How to Implement</h3>
            <ol className="space-y-3">
              {safeArray(data.implementation_steps).map((step: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {/* Risk & Precedent row */}
      {(data.risk || data.example_precedent) && (
        <>
          <div className="border-t border-border/50" />
          <div className="grid md:grid-cols-2 gap-4">
            {data.risk && (
              <div className="p-4 rounded-xl bg-destructive/[0.05] border border-destructive/10">
                <h4 className="font-semibold text-sm text-destructive flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Key Risk
                </h4>
                <p className="text-sm text-foreground/90">{data.risk}</p>
              </div>
            )}
            {data.example_precedent && (
              <div className="p-4 rounded-xl bg-muted/30 border">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">📚 Real-World Precedent</h4>
                <p className="text-sm text-foreground/90">{data.example_precedent}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Potential Impact */}
      {data.potential_impact && (
        <>
          <div className="border-t border-border/50" />
          <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
            <h4 className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              Potential Impact
            </h4>
            <p className="text-sm text-foreground/90 font-medium">{data.potential_impact}</p>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
