import { Globe, DollarSign, Users, Zap, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const PESTEL_ITEMS = [
  { key: "political", label: "Political", icon: <span className="text-lg">🏛️</span>, color: "border-l-primary" },
  { key: "economic", label: "Economic", icon: <DollarSign className="h-4 w-4 text-success" />, color: "border-l-success" },
  { key: "social", label: "Social", icon: <Users className="h-4 w-4 text-secondary" />, color: "border-l-secondary" },
  { key: "technological", label: "Technological", icon: <Zap className="h-4 w-4 text-warning" />, color: "border-l-warning" },
  { key: "environmental", label: "Environmental", icon: <span className="text-lg">🌱</span>, color: "border-l-success" },
  { key: "legal", label: "Legal", icon: <FileText className="h-4 w-4 text-primary" />, color: "border-l-primary" },
] as const;

export const PestelAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.pestel_analysis) return null;
  const p = reportData.pestel_analysis;

  return (
    <ReportSectionCard
      id="pestel-analysis"
      icon={<Globe className="h-5 w-5 text-primary" />}
      title="PESTEL Analysis"
    >
      <div className="space-y-4">
        {PESTEL_ITEMS.map((item, idx) => {
          const content = p[item.key];
          if (!content) return null;
          return (
            <div key={item.key}>
              {idx > 0 && <div className="border-t border-border/50 mb-4" />}
              <div className={`rounded-lg border-l-[3px] ${item.color} bg-muted/20 p-4`}>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  {item.icon} {item.label}
                </h3>
                <MarkdownContent content={toMarkdownString(content)} />
              </div>
            </div>
          );
        })}
      </div>
    </ReportSectionCard>
  );
};
