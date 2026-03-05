import { CheckCircle2, Zap, Clock, DollarSign, Users, Lightbulb, BarChart3, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  reportData: any;
}

export const GoToMarketSection = ({ reportData }: Props) => {
  if (!reportData.go_to_market_strategy) return null;
  const gtm = reportData.go_to_market_strategy;
  const valueProp = gtm.value_proposition;

  return (
    <ReportSectionCard id="go-to-market" title="Go-To-Market Strategy">
      {/* First 10 Customers */}
      {gtm.first_10_customers && (
        <>
          <div className="border-l-2 border-l-primary pl-5 py-2">
            <h3 className="font-sans text-base font-semibold text-primary mb-1 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              How to Get Your First 10 Customers
            </h3>
            <p className="text-sm leading-relaxed">{gtm.first_10_customers}</p>
          </div>
          <div className="border-t border-border/50" />
        </>
      )}

      {/* Value Proposition */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-2">Value Proposition</h3>
        <p className="text-sm font-medium mb-3">{valueProp?.primary || "Analysis in progress..."}</p>
        {(valueProp?.for_segment_1 || valueProp?.for_segment_2) && (
          <div className="grid md:grid-cols-2 gap-4">
            {valueProp.for_segment_1 && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Segment 1</p>
                <p>{valueProp.for_segment_1}</p>
              </div>
            )}
            {valueProp.for_segment_2 && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Segment 2</p>
                <p>{valueProp.for_segment_2}</p>
              </div>
            )}
          </div>
        )}
        {valueProp?.differentiators && (
          <ul className="mt-2 space-y-1">
            {valueProp.differentiators.map((diff: string, i: number) => (
              <li key={i} className="flex items-start text-sm gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{diff}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Target Segments */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Target Segments</h3>
        <div className="space-y-0">
          {gtm.target_segments?.map((seg: any, idx: number) => (
            <div key={idx} className="py-3 border-b border-border/30 last:border-0">
              <h4 className="text-sm font-medium">{seg.segment}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{seg.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                <span>Size: {seg.size}</span>
                {seg.where_to_find_them && <span>Where: {seg.where_to_find_them}</span>}
              </div>
              {seg.messaging_angle && (
                <p className="text-xs italic text-muted-foreground mt-1">"{seg.messaging_angle}"</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Marketing Channels */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Marketing Channels</h3>
        <div className="space-y-0">
          {gtm.marketing_channels?.map((ch: any, idx: number) => (
            <div key={idx} className="py-3 border-b border-border/30 last:border-0">
              <h4 className="text-sm font-medium mb-0.5">{ch.channel}</h4>
              <p className="text-sm text-muted-foreground">{ch.strategy}</p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                <span>Budget: {ch.budget_allocation}</span>
                <span>ROI: {ch.expected_roi}</span>
                {ch.timeline_to_results && <span>{ch.timeline_to_results}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Pricing Strategy */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Pricing Strategy</h3>
        <div className="space-y-3">
          {gtm.pricing_strategy?.model && (
            <p className="text-sm"><span className="font-medium">Model:</span> {gtm.pricing_strategy.model}</p>
          )}
          {gtm.pricing_strategy?.tiers?.length > 0 && (
            <div className="grid md:grid-cols-3 gap-0 divide-x divide-border/50">
              {gtm.pricing_strategy.tiers.map((tier: any, idx: number) => (
                <div key={idx} className="py-2 px-4 first:pl-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{tier.name}</span>
                    <span className="font-mono text-primary font-semibold">{tier.price}</span>
                  </div>
                  {tier.target && <p className="text-[11px] text-muted-foreground mb-1">{tier.target}</p>}
                  <ul className="text-[11px] space-y-0.5 text-muted-foreground">
                    {tier.features?.map((f: string, i: number) => (
                      <li key={i}>· {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {gtm.pricing_strategy?.competitive_position && (
            <p className="text-xs text-muted-foreground">{gtm.pricing_strategy.competitive_position}</p>
          )}
        </div>
      </div>

      {/* Launch Phases */}
      {gtm.launch_phases?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Launch Phases</h3>
            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-6">
                {gtm.launch_phases.map((phase: any, idx: number) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4 className="font-sans text-sm font-semibold">{phase.phase}</h4>
                      <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      {phase.budget && <span className="text-xs text-muted-foreground">· {phase.budget}</span>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Activities:</p>
                        <ul className="text-muted-foreground">{phase.activities?.map((a: string, i: number) => <li key={i}>· {a}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Goals:</p>
                        <ul className="text-muted-foreground">{phase.goals?.map((g: string, i: number) => <li key={i}>· {g}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Unconventional Tactic */}
      {gtm.unconventional_tactic?.tactic && (
        <>
          <div className="border-t border-border/50" />
          <div className="border-l-2 border-l-primary pl-5 py-2">
            <h3 className="font-sans text-base font-semibold flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Unconventional Growth Tactic
            </h3>
            <p className="text-sm font-medium mb-2">{gtm.unconventional_tactic.tactic}</p>
            {gtm.unconventional_tactic.why_it_works && (
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Why:</span> {gtm.unconventional_tactic.why_it_works}</p>
            )}
            {gtm.unconventional_tactic.how_to_execute && (
              <p className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">How:</span> {gtm.unconventional_tactic.how_to_execute}</p>
            )}
          </div>
        </>
      )}

      {/* Key Metrics */}
      {gtm.key_metrics?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Key Metrics to Track</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs h-8">Metric</TableHead>
                  <TableHead className="text-xs h-8">Target</TableHead>
                  <TableHead className="text-xs h-8">How to Measure</TableHead>
                  {gtm.key_metrics[0]?.tool && <TableHead className="text-xs h-8">Tool</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gtm.key_metrics.map((m: any, i: number) => (
                  <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <TableCell className="py-2 text-sm font-medium">{m.metric}</TableCell>
                    <TableCell className="py-2 text-sm font-mono">{m.target}</TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{m.measurement || m.measurement_frequency}</TableCell>
                    {gtm.key_metrics[0]?.tool && <TableCell className="py-2 text-sm text-muted-foreground">{m.tool}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Sales Strategy */}
      {gtm.sales_strategy && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Sales Strategy</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Process:</p>
                <p>{gtm.sales_strategy.process || "TBD"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Team:</p>
                <p>{(gtm.sales_strategy.team_structure || []).map((role: any) => typeof role === "object" ? role.role || role.name : role).join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tactics:</p>
                <ul>
                  {(gtm.sales_strategy.conversion_tactics || []).slice(0, 3).map((t: string, i: number) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Growth Tactics */}
      {gtm.growth_tactics?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Growth Tactics</h3>
            <div className="space-y-0">
              {gtm.growth_tactics.map((tactic: any, idx: number) => (
                <div key={idx} className="py-3 border-b border-border/30 last:border-0">
                  <h4 className="text-sm font-medium">{tactic.tactic}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{tactic.description}</p>
                  <p className="text-xs mt-0.5"><span className="text-muted-foreground">Impact:</span> {tactic.expected_impact}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
