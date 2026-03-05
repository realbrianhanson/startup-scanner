import { Sparkles, Lightbulb, AlertTriangle, TrendingUp, CheckSquare, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeArray } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const GameChangingIdeaSection = ({ reportData }: Props) => {
  if (!reportData.game_changing_idea) return null;

  const data = reportData.game_changing_idea;

  return (
    <div
      id="game-changing-idea"
      className="relative rounded-2xl scroll-mt-28 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--secondary) / 0.08), hsl(var(--primary) / 0.04))",
      }}
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-primary/20" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-t-2xl" />

      {/* Floating decorative orbs */}
      <div className="absolute top-6 right-8 w-32 h-32 rounded-full bg-primary/[0.04] blur-2xl pointer-events-none" />
      <div className="absolute bottom-8 left-12 w-24 h-24 rounded-full bg-secondary/[0.06] blur-2xl pointer-events-none" />

      <div className="relative p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 shadow-lg shadow-primary/5">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Game-Changing Idea</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Strategic enhancement powered by AI analysis</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 px-3 py-1 text-xs font-semibold shadow-md">
            AI Strategic Enhancement
          </Badge>
        </div>

        {/* Headline — large pull-quote */}
        {data.headline && (
          <div className="relative p-6 rounded-xl bg-gradient-to-r from-primary/[0.1] to-secondary/[0.1] border border-primary/20 shadow-inner">
            <div className="absolute top-3 left-4 text-5xl text-primary/15 font-serif leading-none select-none">"</div>
            <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed pl-6 pr-2">
              {data.headline}
            </p>
            <div className="absolute bottom-2 right-5 text-5xl text-primary/15 font-serif leading-none select-none">"</div>
          </div>
        )}

        {/* Description — larger text */}
        {data.description && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              The Vision
            </h3>
            <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">{data.description}</p>
          </div>
        )}

        {/* Why It Works */}
        {data.why_it_works && (
          <>
            <div className="border-t border-primary/10" />
            <div className="p-4 rounded-xl bg-success/[0.06] border border-success/15">
              <h4 className="font-semibold text-sm text-success flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4" />
                Why This Works
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">{data.why_it_works}</p>
            </div>
          </>
        )}

        {/* Implementation Steps — numbered with decorative checkboxes */}
        {safeArray(data.implementation_steps).length > 0 && (
          <>
            <div className="border-t border-primary/10" />
            <div>
              <h3 className="font-semibold text-lg mb-4">Action Plan</h3>
              <ol className="space-y-3">
                {safeArray(data.implementation_steps).map((step: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/50 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                      <CheckSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {i + 1}</span>
                      <p className="text-sm text-foreground/90 mt-0.5">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* Risk & Precedent row */}
        {(data.risk || data.example_precedent) && (
          <>
            <div className="border-t border-primary/10" />
            <div className="grid md:grid-cols-2 gap-4">
              {data.risk && (
                <div className="p-4 rounded-xl bg-destructive/[0.05] border border-destructive/15">
                  <h4 className="font-semibold text-sm text-destructive flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Key Risk & Mitigation
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{data.risk}</p>
                </div>
              )}
              {data.example_precedent && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-primary/10" />
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 pl-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-primary">Case Study Precedent</span>
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-3 italic">{data.example_precedent}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Potential Impact — highlighted box */}
        {data.potential_impact && (
          <>
            <div className="border-t border-primary/10" />
            <div className="p-5 rounded-xl bg-gradient-to-r from-primary/[0.08] to-success/[0.08] border border-primary/15 shadow-sm">
              <h4 className="font-bold text-base text-primary flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                Potential Impact
              </h4>
              <p className="text-base text-foreground font-medium leading-relaxed">{data.potential_impact}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
