import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const QUADRANTS = [
  { key: "strengths", label: "Strengths", bg: "bg-emerald-500/[0.06]" },
  { key: "weaknesses", label: "Weaknesses", bg: "bg-red-500/[0.06]" },
  { key: "opportunities", label: "Opportunities", bg: "bg-blue-500/[0.06]" },
  { key: "threats", label: "Threats", bg: "bg-amber-500/[0.06]" },
] as const;

export const StrategicFrameworksSection = ({ reportData }: Props) => {
  if (!reportData.strategic_frameworks) return null;

  return (
    <ReportSectionCard id="strategic-frameworks" title="SWOT Analysis">
      <div className="grid grid-cols-2 gap-0">
        {QUADRANTS.map((q) => (
          <div key={q.key} className={`${q.bg} p-5`}>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{q.label}</h4>
            <ul className="space-y-2">
              {reportData.strategic_frameworks.swot?.[q.key]?.map((item: string, i: number) => (
                <li key={i} className="text-sm leading-relaxed">
                  {item}
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
            <h3 className="font-sans text-lg font-semibold mb-3">Go-to-Market Strategy</h3>
            <ul className="space-y-2">
              {reportData.strategic_frameworks.gtm_strategy.map((strategy: string, i: number) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="font-mono text-muted-foreground mr-3 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
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
