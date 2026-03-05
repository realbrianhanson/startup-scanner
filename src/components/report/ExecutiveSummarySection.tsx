import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Zap, Lightbulb, CalendarClock } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const ExecutiveSummarySection = ({ reportData }: Props) => {
  if (!reportData.executive_summary) return null;

  return (
    <Card id="executive-summary" className="relative overflow-hidden p-8 bg-gradient-card border shadow-large scroll-mt-28">
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />

      <div className="space-y-6 pl-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Executive Summary</h2>
          <div className="p-2 rounded-xl bg-primary/[0.08] border border-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-success flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Top Strengths
            </h3>
            <ul className="space-y-3">
              {reportData.executive_summary.strengths?.map((strength: string, i: number) => (
                <li key={i} className="flex items-start leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 mr-3 shrink-0" />
                  <span className="text-foreground/90">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-warning flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Key Concerns
            </h3>
            <ul className="space-y-3">
              {reportData.executive_summary.concerns?.map((concern: string, i: number) => (
                <li key={i} className="flex items-start leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 mr-3 shrink-0" />
                  <span className="text-foreground/90">{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {reportData.executive_summary.score_justification && (
          <div className="p-4 rounded-xl bg-muted/30 border">
            <p className="text-sm font-medium text-muted-foreground mb-1">Score Justification</p>
            <p className="text-foreground/90">{reportData.executive_summary.score_justification}</p>
          </div>
        )}

        <div className="border-t border-border/50" />

        <div>
          <h3 className="font-semibold text-lg mb-4">Recommendation</h3>
          <MarkdownContent content={toMarkdownString(reportData.executive_summary.recommendation)} />
          {reportData.executive_summary.reasoning && (
            <div className="mt-4 p-4 rounded-xl bg-muted/30 border">
              <MarkdownContent content={toMarkdownString(reportData.executive_summary.reasoning)} />
            </div>
          )}
        </div>

        {(reportData.executive_summary.contrarian_insight || reportData.executive_summary.seven_day_action) && (
          <div className="grid md:grid-cols-2 gap-4">
            {reportData.executive_summary.contrarian_insight && (
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                  <Lightbulb className="h-4 w-4" />
                  Contrarian Insight
                </h4>
                <p className="text-sm text-foreground/90">{reportData.executive_summary.contrarian_insight}</p>
              </div>
            )}
            {reportData.executive_summary.seven_day_action && (
              <div className="p-4 rounded-xl bg-success/[0.05] border border-success/10">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-success">
                  <CalendarClock className="h-4 w-4" />
                  7-Day Action Item
                </h4>
                <p className="text-sm text-foreground/90">{reportData.executive_summary.seven_day_action}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
