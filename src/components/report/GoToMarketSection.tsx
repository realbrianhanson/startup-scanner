import { Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeString, safeArray, getGoToMarketData } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const GoToMarketSection = ({ reportData }: Props) => {
  if (!reportData.go_to_market_strategy) return null;
  const gtmData = getGoToMarketData(reportData.go_to_market_strategy);
  if (!gtmData) return null;

  return (
    <ReportSectionCard
      id="go-to-market"
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Go-To-Market Strategy"
    >
      {/* Value Proposition */}
      <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-5">
        <h3 className="font-semibold text-lg mb-2 text-primary">Value Proposition</h3>
        <p className="mb-3">{gtmData.value_proposition?.primary || "Analysis in progress..."}</p>
        <div>
          <span className="font-semibold text-sm">Differentiators:</span>
          <ul className="mt-2 space-y-1">
            {gtmData.value_proposition?.differentiators?.map((diff: string, i: number) => (
              <li key={i} className="flex items-start text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-success shrink-0 mt-0.5" />{diff}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Target Segments */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Target Market Segments</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {gtmData.target_segments?.map((segment: any, idx: number) => (
            <div key={idx} className="rounded-xl border p-4 hover:border-primary/20 transition-all">
              <h4 className="font-semibold mb-1">{segment.segment}</h4>
              <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
              <div className="text-xs mb-2"><span className="text-muted-foreground">Size:</span> {segment.size}</div>
              <div className="flex flex-wrap gap-1">
                {segment.characteristics?.map((c: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Marketing & Pricing side-by-side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-lg mb-3">Marketing Channels</h3>
          <div className="space-y-3">
            {gtmData.marketing_channels?.map((channel: any, idx: number) => (
              <div key={idx} className="rounded-xl bg-success/[0.04] border border-success/10 p-4">
                <h4 className="font-semibold text-sm mb-1">{channel.channel}</h4>
                <p className="text-xs text-muted-foreground mb-2">{channel.strategy}</p>
                <div className="flex gap-4 text-xs">
                  <span><span className="text-muted-foreground">Budget:</span> {channel.budget_allocation}</span>
                  <span><span className="text-muted-foreground">ROI:</span> {channel.expected_roi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-3">Pricing Strategy</h3>
          <div className="rounded-xl bg-warning/[0.04] border border-warning/10 p-4">
            <div className="mb-3">
              <span className="font-semibold text-sm">Model:</span>
              <p className="text-sm">{gtmData.pricing_strategy?.model}</p>
            </div>
            <div className="space-y-2">
              {gtmData.pricing_strategy?.tiers?.map((tier: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-card rounded-lg border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{tier.name}</span>
                    <span className="text-primary font-bold text-sm">{tier.price}</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-muted-foreground">
                    {tier.features?.slice(0, 3).map((f: string, i: number) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">{gtmData.pricing_strategy?.competitive_position}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Sales Strategy */}
      <div className="rounded-xl border p-4">
        <h3 className="font-semibold text-lg mb-3">Sales Strategy</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold text-xs">Process:</span>
            <p className="text-muted-foreground mt-1">{safeString(gtmData.sales_strategy?.process, "TBD")}</p>
          </div>
          <div>
            <span className="font-semibold text-xs">Team:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {safeArray(gtmData.sales_strategy?.team_structure).map((role: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px]">
                  {typeof role === "object" ? (role as any).role || (role as any).name || JSON.stringify(role) : role}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="font-semibold text-xs">Tactics:</span>
            <ul className="mt-1 text-muted-foreground">
              {safeArray(gtmData.sales_strategy?.conversion_tactics).slice(0, 3).map((t: string, i: number) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Launch Phases */}
      {gtmData.launch_phases?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Launch Phases</h3>
            <div className="space-y-0">
              {gtmData.launch_phases.map((phase: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30">
                      {idx + 1}
                    </div>
                    {idx < gtmData.launch_phases.length - 1 && <div className="w-[2px] flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{phase.phase}</h4>
                      <span className="text-xs text-muted-foreground">{phase.duration}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-semibold text-xs">Activities:</span>
                        <ul className="mt-1 text-muted-foreground">{phase.activities?.map((a: string, i: number) => <li key={i}>• {a}</li>)}</ul>
                      </div>
                      <div>
                        <span className="font-semibold text-xs">Goals:</span>
                        <ul className="mt-1 text-muted-foreground">{phase.goals?.map((g: string, i: number) => <li key={i}>• {g}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Growth & Metrics */}
      <div className="border-t border-border/50" />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-lg mb-3">Growth Tactics</h3>
          <div className="space-y-2">
            {gtmData.growth_tactics?.map((tactic: any, idx: number) => (
              <div key={idx} className="rounded-xl bg-success/[0.04] border border-success/10 p-3">
                <h4 className="font-semibold text-sm mb-1">{tactic.tactic}</h4>
                <p className="text-xs text-muted-foreground">{tactic.description}</p>
                <p className="text-xs mt-1"><span className="text-muted-foreground">Impact:</span> {tactic.expected_impact}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-3">Key Metrics</h3>
          <div className="space-y-2">
            {gtmData.key_metrics?.map((metric: any, idx: number) => (
              <div key={idx} className="rounded-xl bg-primary/[0.04] border border-primary/10 p-3">
                <h4 className="font-semibold text-sm mb-1">{metric.metric}</h4>
                <div className="flex gap-4 text-xs">
                  <span><span className="text-muted-foreground">Target:</span> {metric.target}</span>
                  <span><span className="text-muted-foreground">Frequency:</span> {metric.measurement_frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReportSectionCard>
  );
};
