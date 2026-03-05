import { DollarSign, Users, Zap, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const PESTEL_ITEMS = [
  { key: "political", label: "Political" },
  { key: "economic", label: "Economic" },
  { key: "social", label: "Social" },
  { key: "technological", label: "Technological" },
  { key: "environmental", label: "Environmental" },
  { key: "legal", label: "Legal" },
] as const;

export const PestelAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.pestel_analysis) return null;
  const p = reportData.pestel_analysis;

  return (
    <ReportSectionCard id="pestel-analysis" title="PESTEL Analysis">
      <div className="space-y-0">
        {PESTEL_ITEMS.map((item, idx) => {
          const content = p[item.key];
          if (!content) return null;
          return (
            <div key={item.key} className="py-4 border-b border-border/30 last:border-0">
              <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {item.label}
              </h3>
              <div className="text-sm">
                <MarkdownContent content={toMarkdownString(content)} />
              </div>
            </div>
          );
        })}
      </div>
    </ReportSectionCard>
  );
};
