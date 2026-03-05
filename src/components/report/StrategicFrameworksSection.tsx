import { BarChart3 } from "lucide-react";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const QUADRANTS = [
  { key: "strengths", label: "Strengths", bg: "bg-success/[0.06]", border: "border-success/20", dot: "bg-success", text: "text-success" },
  { key: "weaknesses", label: "Weaknesses", bg: "bg-destructive/[0.06]", border: "border-destructive/20", dot: "bg-destructive", text: "text-destructive" },
  { key: "opportunities", label: "Opportunities", bg: "bg-primary/[0.06]", border: "border-primary/20", dot: "bg-primary", text: "text-primary" },
  { key: "threats", label: "Threats", bg: "bg-warning/[0.06]", border: "border-warning/20", dot: "bg-warning", text: "text-warning" },
] as const;

export const StrategicFrameworksSection = ({ reportData }: Props) => {
  if (!reportData.strategic_frameworks) return null;

  return (
    <ReportSectionCard
      id="strategic-frameworks"
      icon={<BarChart3 className="h-5 w-5 text-primary" />}
      title="Strategic Frameworks"
    >
      <h3 className="font-semibold text-lg">SWOT Analysis</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {QUADRANTS.map((q, idx) => (
          <div
            key={q.key}
            className={`rounded-xl p-5 ${q.bg} border ${q.border} animate-scale-in`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <h4 className={`font-semibold mb-3 ${q.text}`}>{q.label}</h4>
            <ul className="space-y-2">
              {reportData.strategic_frameworks.swot?.[q.key]?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className={`w-1.5 h-1.5 rounded-full ${q.dot} mt-2 shrink-0`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {reportData.strategic_frameworks.gtm_strategy?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Go-to-Market Strategy</h3>
            <ul className="space-y-2">
              {reportData.strategic_frameworks.gtm_strategy.map((strategy: string, i: number) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                  <span>{strategy}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
