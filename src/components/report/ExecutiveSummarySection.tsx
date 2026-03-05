import { CheckCircle2, AlertTriangle, Lightbulb, CalendarClock } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Props {
  reportData: any;
}

export const ExecutiveSummarySection = ({ reportData }: Props) => {
  if (!reportData.executive_summary) return null;

  return (
    <ScrollReveal>
      <section id="executive-summary" className="scroll-mt-28 mb-16 md:mb-20">
        <div className="h-px bg-border mb-8" />
        <h2 className="font-serif text-2xl tracking-tight mb-6">Executive Summary</h2>

        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="border-l-2 border-l-emerald-500/30 pl-4 space-y-4">
              <h3 className="font-sans text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Top Strengths
              </h3>
              <ul className="space-y-3">
                {reportData.executive_summary.strengths?.map((strength: string, i: number) => (
                  <li key={i} className="flex items-start leading-relaxed text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 mr-3 shrink-0" />
                    <span className="text-foreground/90">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-l-2 border-l-amber-500/30 pl-4 space-y-4">
              <h3 className="font-sans text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Key Concerns
              </h3>
              <ul className="space-y-3">
                {reportData.executive_summary.concerns?.map((concern: string, i: number) => (
                  <li key={i} className="flex items-start leading-relaxed text-base">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 mr-3 shrink-0" />
                    <span className="text-foreground/90">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {reportData.executive_summary.score_justification && (
            <div className="py-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Score Justification</p>
              <p className="text-base text-foreground/90 leading-relaxed">{reportData.executive_summary.score_justification}</p>
            </div>
          )}

          <div className="border-t border-border/50 pt-6">
            <h3 className="font-sans text-lg font-semibold mb-4">Recommendation</h3>
            <MarkdownContent content={toMarkdownString(reportData.executive_summary.recommendation)} />
            {reportData.executive_summary.reasoning && (
              <div className="mt-4 py-4 border-t border-border/30">
                <MarkdownContent content={toMarkdownString(reportData.executive_summary.reasoning)} />
              </div>
            )}
          </div>

          {(reportData.executive_summary.contrarian_insight || reportData.executive_summary.seven_day_action) && (
            <div className="grid md:grid-cols-2 gap-6 border-t border-border/50 pt-6">
              {reportData.executive_summary.contrarian_insight && (
                <div className="bg-primary/[0.04] border border-primary/10 rounded-lg p-4">
                  <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2 text-primary">
                    <Lightbulb className="h-4 w-4" />
                    Contrarian Insight
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{reportData.executive_summary.contrarian_insight}</p>
                </div>
              )}
              {reportData.executive_summary.seven_day_action && (
                <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-lg p-4">
                  <h4 className="font-sans text-sm font-semibold flex items-center gap-2 mb-2 text-emerald-500">
                    <CalendarClock className="h-4 w-4" />
                    7-Day Action Item
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">{reportData.executive_summary.seven_day_action}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
};
