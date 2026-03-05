import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const ExecutiveSummarySection = ({ reportData }: Props) => {
  if (!reportData.executive_summary) return null;

  return (
    <Card id="executive-summary" className="p-8 bg-gradient-card border-2 shadow-large scroll-mt-28">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Executive Summary</h2>
          <Zap className="h-6 w-6 text-primary" />
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
                  <span className="text-success mr-3 mt-1">✓</span>
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
                  <span className="text-warning mr-3 mt-1">⚠</span>
                  <span className="text-foreground/90">{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold text-lg mb-4">Recommendation</h3>
          <MarkdownContent content={toMarkdownString(reportData.executive_summary.recommendation)} />
          {reportData.executive_summary.reasoning && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <MarkdownContent content={toMarkdownString(reportData.executive_summary.reasoning)} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
