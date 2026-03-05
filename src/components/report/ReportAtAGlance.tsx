import { BarChart3, Users, Calendar, DollarSign } from "lucide-react";
import { getMarketData, getCompetitiveLandscape, safeString } from "@/lib/reportHelpers";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Props {
  reportData: any;
}

const MetricBox = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 py-3 px-4">
    <div className="text-muted-foreground shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-mono text-sm font-semibold tabular-nums truncate">{value}</p>
    </div>
  </div>
);

export const ReportAtAGlance = ({ reportData }: Props) => {
  if (!reportData) return null;

  // Extract metrics
  const marketData = reportData.market_analysis ? getMarketData(reportData.market_analysis) as any : null;
  const compData = reportData.competitive_landscape ? getCompetitiveLandscape(reportData.competitive_landscape) as any : null;
  const fin = reportData.financial_basics;

  const tam = marketData?.tam ? safeString(marketData.tam, "—") : "—";
  const competitorCount = compData?.direct_competitors?.length || 0;
  const breakEven = fin?.break_even_estimate ? safeString(fin.break_even_estimate, "—") : "—";
  const startupCost = fin?.startup_costs?.moderate
    ? (typeof fin.startup_costs.moderate === "object" ? fin.startup_costs.moderate.total : fin.startup_costs.moderate)
    : "—";

  // Strengths vs concerns
  const strengths = reportData.executive_summary?.strengths?.length || 0;
  const concerns = reportData.executive_summary?.concerns?.length || 0;
  const total = strengths + concerns || 1;
  const strengthPct = (strengths / total) * 100;

  // Recommendation first sentence
  const rec = reportData.executive_summary?.recommendation;
  const recText = typeof rec === "string" ? rec : rec?.text || rec?.content || "";
  const firstSentence = recText.match(/^[^.!?]*[.!?]/)?.[0] || recText.slice(0, 140);

  const hasAnyData = tam !== "—" || competitorCount > 0 || breakEven !== "—" || startupCost !== "—";
  if (!hasAnyData && !firstSentence) return null;

  return (
    <ScrollReveal>
      <div className="mb-10 bg-card/50 border border-border/50 rounded-xl overflow-hidden">
        {/* Row 1: Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/30">
          <MetricBox icon={<BarChart3 className="h-4 w-4" />} label="Market Size" value={tam} />
          <MetricBox icon={<Users className="h-4 w-4" />} label="Competitors" value={competitorCount > 0 ? String(competitorCount) : "—"} />
          <MetricBox icon={<Calendar className="h-4 w-4" />} label="Break Even" value={breakEven.length > 30 ? breakEven.slice(0, 28) + "…" : breakEven} />
          <MetricBox icon={<DollarSign className="h-4 w-4" />} label="Startup Cost" value={typeof startupCost === "string" ? startupCost : "—"} />
        </div>

        {/* Row 2: Strengths vs Concerns bar */}
        {(strengths > 0 || concerns > 0) && (
          <>
            <div className="border-t border-border/30" />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-emerald-500">{strengths} Strengths</span>
                <span className="font-medium text-amber-500">{concerns} Concerns</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-amber-500/20 flex">
                <div
                  className="h-full bg-emerald-500/60 rounded-l-full transition-all duration-700"
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Row 3: Top recommendation */}
        {firstSentence && (
          <>
            <div className="border-t border-border/30" />
            <div className="px-4 py-3">
              <p className="text-sm font-medium leading-relaxed text-foreground/90">{firstSentence}</p>
            </div>
          </>
        )}
      </div>
    </ScrollReveal>
  );
};
