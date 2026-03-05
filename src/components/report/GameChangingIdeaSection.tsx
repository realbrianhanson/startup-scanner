import { Lightbulb, BookOpen } from "lucide-react";
import { InsightCallout } from "./InsightCallout";
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
        {/* Distinct background with gradient left accent */}
        <div
          className="bg-card rounded-lg p-8 md:p-10 space-y-6"
          style={{ borderLeft: "4px solid", borderImage: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--secondary))) 1" }}
        >
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
              <div className="border-t border-border/30" />
              <InsightCallout type="insight" title="Why This Works">
                {data.why_it_works}
              </InsightCallout>
            </>
          )}

          {/* Implementation Steps — numbered circles */}
          {safeArray(data.implementation_steps).length > 0 && (
            <>
              <div className="border-t border-border/30" />
              <div>
                <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-4">Action Plan</h3>
                <ol className="space-y-3">
                  {safeArray(data.implementation_steps).map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
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
              <div className="border-t border-border/30" />
              <div className="grid md:grid-cols-2 gap-6">
                {data.risk && (
                  <InsightCallout type="warning" title="Key Risk">
                    {data.risk}
                  </InsightCallout>
                )}
                {data.example_precedent && (
                  <div className="bg-muted/30 rounded-lg p-4">
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
              <div className="border-t border-border/30" />
              <InsightCallout type="opportunity" title="Potential Impact">
                <span className="font-medium">{data.potential_impact}</span>
              </InsightCallout>
            </>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
};
