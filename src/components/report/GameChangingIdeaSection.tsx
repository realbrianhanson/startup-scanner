import { Lightbulb, AlertTriangle, TrendingUp, CheckSquare, BookOpen } from "lucide-react";
import { safeArray } from "@/lib/reportHelpers";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Props {
  reportData: any;
}

export const GameChangingIdeaSection = ({ reportData }: Props) => {
  if (!reportData.game_changing_idea) return null;

  const data = reportData.game_changing_idea;

  return (
    <ScrollReveal>
      <section
        id="game-changing-idea"
        className="scroll-mt-28 mb-16 md:mb-20"
      >
        {/* Distinct background with left accent */}
        <div className="bg-card rounded-lg border-l-4 border-l-primary p-8 md:p-10 space-y-6">
          {/* Header */}
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Strategic Enhancement</p>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight">Game-Changing Idea</h2>
          </div>

          {/* Headline — large pull-quote */}
          {data.headline && (
            <blockquote className="border-l-2 border-muted-foreground/20 pl-6 py-2">
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground">
                {data.headline}
              </p>
            </blockquote>
          )}

          {/* Description */}
          {data.description && (
            <div>
              <h3 className="font-sans text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                The Vision
              </h3>
              <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">{data.description}</p>
            </div>
          )}

          {/* Why It Works */}
          {data.why_it_works && (
            <>
              <div className="border-t border-border/50" />
              <div>
                <h4 className="font-sans text-sm font-semibold text-emerald-500 flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Why This Works
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{data.why_it_works}</p>
              </div>
            </>
          )}

          {/* Implementation Steps */}
          {safeArray(data.implementation_steps).length > 0 && (
            <>
              <div className="border-t border-border/50" />
              <div>
                <h3 className="font-sans text-lg font-semibold mb-4">Action Plan</h3>
                <ol className="space-y-3">
                  {safeArray(data.implementation_steps).map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="font-mono text-sm text-muted-foreground w-6 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <p className="text-sm text-foreground/90">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {/* Risk & Precedent */}
          {(data.risk || data.example_precedent) && (
            <>
              <div className="border-t border-border/50" />
              <div className="grid md:grid-cols-2 gap-6">
                {data.risk && (
                  <div>
                    <h4 className="font-sans text-sm font-semibold text-red-500 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Key Risk & Mitigation
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed">{data.risk}</p>
                  </div>
                )}
                {data.example_precedent && (
                  <div>
                    <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Case Study Precedent
                    </h4>
                    <p className="text-sm text-foreground/90 leading-relaxed italic">{data.example_precedent}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Potential Impact */}
          {data.potential_impact && (
            <>
              <div className="border-t border-border/50" />
              <div>
                <h4 className="font-sans text-sm font-semibold text-primary flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Potential Impact
                </h4>
                <p className="text-base text-foreground font-medium leading-relaxed">{data.potential_impact}</p>
              </div>
            </>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
};
