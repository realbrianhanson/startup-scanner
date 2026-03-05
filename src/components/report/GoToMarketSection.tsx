import { Target, CheckCircle2, Zap, Clock, DollarSign, Users, Lightbulb, BarChart3, Rocket } from "lucide-react";
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

  // Detect new vs old format
  const isNewFormat = !!gtm.first_10_customers || !!gtm.unconventional_tactic;

  // Backwards compat: old format used differentiators array
  const valueProp = gtm.value_proposition;

  return (
    <ReportSectionCard
      id="go-to-market"
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Go-To-Market Strategy"
    >
      {/* First 10 Customers — Hero callout */}
      {gtm.first_10_customers && (
        <>
          <div className="rounded-xl bg-primary/[0.08] border-2 border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg text-primary">How to Get Your First 10 Customers</h3>
            </div>
            <p className="text-sm leading-relaxed">{gtm.first_10_customers}</p>
          </div>
          <div className="border-t border-border/50" />
        </>
      )}

      {/* Value Proposition */}
      <div className="rounded-xl bg-primary/[0.06] border border-primary/20 p-5">
        <h3 className="font-semibold text-lg mb-2 text-primary">Value Proposition</h3>
        <p className="mb-3 font-medium">{valueProp?.primary || "Analysis in progress..."}</p>
        {/* New format: segment-specific framing */}
        {(valueProp?.for_segment_1 || valueProp?.for_segment_2) && (
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {valueProp.for_segment_1 && (
              <div className="rounded-lg bg-card border p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Segment 1 Framing</p>
                <p className="text-sm">{valueProp.for_segment_1}</p>
              </div>
            )}
            {valueProp.for_segment_2 && (
              <div className="rounded-lg bg-card border p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Segment 2 Framing</p>
                <p className="text-sm">{valueProp.for_segment_2}</p>
              </div>
            )}
          </div>
        )}
        {/* Old format: differentiators */}
        {valueProp?.differentiators && (
          <ul className="mt-2 space-y-1">
            {valueProp.differentiators.map((diff: string, i: number) => (
              <li key={i} className="flex items-start text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-primary shrink-0 mt-0.5" />{diff}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Target Segments */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Target Segments
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {gtm.target_segments?.map((seg: any, idx: number) => (
            <div key={idx} className="rounded-xl border p-4 hover:border-primary/20 transition-all space-y-2">
              <h4 className="font-semibold">{seg.segment}</h4>
              <p className="text-sm text-muted-foreground">{seg.description}</p>
              <div className="text-xs"><span className="text-muted-foreground">Size:</span> {seg.size}</div>
              {seg.where_to_find_them && (
                <div className="text-xs"><span className="text-muted-foreground">Where to find them:</span> {seg.where_to_find_them}</div>
              )}
              {seg.messaging_angle && (
                <div className="rounded-lg bg-muted/40 p-2 mt-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Messaging Angle</p>
                  <p className="text-xs italic">"{seg.messaging_angle}"</p>
                </div>
              )}
              {seg.characteristics && (
                <div className="flex flex-wrap gap-1">
                  {seg.characteristics.map((c: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Marketing Channels */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Marketing Channels
        </h3>
        <div className="space-y-3">
          {gtm.marketing_channels?.map((ch: any, idx: number) => (
            <div key={idx} className="rounded-xl border p-4 hover:border-primary/20 transition-all">
              <h4 className="font-semibold text-sm mb-1">{ch.channel}</h4>
              <p className="text-sm text-muted-foreground mb-3">{ch.strategy}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-muted-foreground" /> {ch.budget_allocation}</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3 text-muted-foreground" /> ROI: {ch.expected_roi}</span>
                {ch.timeline_to_results && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> {ch.timeline_to_results}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Pricing Strategy */}
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Pricing Strategy
        </h3>
        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{gtm.pricing_strategy?.model}</Badge>
          </div>
          {gtm.pricing_strategy?.tiers?.length > 0 && (
            <div className="grid md:grid-cols-3 gap-3">
              {gtm.pricing_strategy.tiers.map((tier: any, idx: number) => (
                <div key={idx} className="rounded-lg border bg-card p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{tier.name}</span>
                    <span className="text-primary font-bold">{tier.price}</span>
                  </div>
                  {tier.target && <p className="text-[11px] text-muted-foreground mb-2">{tier.target}</p>}
                  <ul className="text-[11px] space-y-0.5 text-muted-foreground">
                    {tier.features?.map((f: string, i: number) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {gtm.pricing_strategy?.competitive_position && (
            <p className="text-xs text-muted-foreground border-t pt-2">{gtm.pricing_strategy.competitive_position}</p>
          )}
          {gtm.pricing_strategy?.psychological_reasoning && (
            <p className="text-xs text-muted-foreground italic">{gtm.pricing_strategy.psychological_reasoning}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border/50" />

      {/* Launch Phases */}
      {gtm.launch_phases?.length > 0 && (
        <>
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-muted-foreground" />
              Launch Phases
            </h3>
            <div className="space-y-0">
              {gtm.launch_phases.map((phase: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/30">
                      {idx + 1}
                    </div>
                    {idx < gtm.launch_phases.length - 1 && <div className="w-[2px] flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{phase.phase}</h4>
                      <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      {phase.budget && <Badge variant="outline" className="text-[10px]">{phase.budget}</Badge>}
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
          <div className="border-t border-border/50" />
        </>
      )}

      {/* Unconventional Tactic */}
      {gtm.unconventional_tactic?.tactic && (
        <>
          <div className="rounded-xl bg-accent/50 border border-accent p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Unconventional Growth Tactic</h3>
            </div>
            <p className="font-medium mb-2">{gtm.unconventional_tactic.tactic}</p>
            {gtm.unconventional_tactic.why_it_works && (
              <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold text-foreground">Why it works:</span> {gtm.unconventional_tactic.why_it_works}</p>
            )}
            {gtm.unconventional_tactic.how_to_execute && (
              <p className="text-sm text-muted-foreground mb-2"><span className="font-semibold text-foreground">How to execute:</span> {gtm.unconventional_tactic.how_to_execute}</p>
            )}
            {gtm.unconventional_tactic.example && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2 mt-2">Precedent: {gtm.unconventional_tactic.example}</p>
            )}
          </div>
          <div className="border-t border-border/50" />
        </>
      )}

      {/* Key Metrics */}
      {gtm.key_metrics?.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Key Metrics to Track
          </h3>
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
                <TableRow key={i}>
                  <TableCell className="py-2 text-sm font-medium">{m.metric}</TableCell>
                  <TableCell className="py-2 text-sm font-mono">{m.target}</TableCell>
                  <TableCell className="py-2 text-sm text-muted-foreground">{m.measurement || m.measurement_frequency}</TableCell>
                  {gtm.key_metrics[0]?.tool && <TableCell className="py-2 text-sm text-muted-foreground">{m.tool}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Old format: Sales Strategy & Growth Tactics */}
      {gtm.sales_strategy && (
        <>
          <div className="border-t border-border/50" />
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold text-lg mb-3">Sales Strategy</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-xs">Process:</span>
                <p className="text-muted-foreground mt-1">{gtm.sales_strategy.process || "TBD"}</p>
              </div>
              <div>
                <span className="font-semibold text-xs">Team:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(gtm.sales_strategy.team_structure || []).map((role: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {typeof role === "object" ? role.role || role.name || JSON.stringify(role) : role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold text-xs">Tactics:</span>
                <ul className="mt-1 text-muted-foreground">
                  {(gtm.sales_strategy.conversion_tactics || []).slice(0, 3).map((t: string, i: number) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {gtm.growth_tactics?.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Growth Tactics</h3>
            <div className="space-y-2">
              {gtm.growth_tactics.map((tactic: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-primary/[0.04] border border-primary/10 p-3">
                  <h4 className="font-semibold text-sm mb-1">{tactic.tactic}</h4>
                  <p className="text-xs text-muted-foreground">{tactic.description}</p>
                  <p className="text-xs mt-1"><span className="text-muted-foreground">Impact:</span> {tactic.expected_impact}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
