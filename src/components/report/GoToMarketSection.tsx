import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { safeString, safeArray, getGoToMarketData } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const GoToMarketSection = ({ reportData }: Props) => {
  if (!reportData.go_to_market_strategy) return null;

  const gtmData = getGoToMarketData(reportData.go_to_market_strategy);
  if (!gtmData) return null;

  return (
    <Collapsible>
      <Card id="go-to-market" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Go-To-Market Strategy</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-lg mb-3 text-primary">Value Proposition</h3>
              <p className="mb-3">{gtmData.value_proposition?.primary || 'Analysis in progress...'}</p>
              <div>
                <span className="font-semibold text-sm">Differentiators:</span>
                <ul className="mt-2 space-y-1">
                  {gtmData.value_proposition?.differentiators?.map((diff: string, i: number) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-success shrink-0 mt-0.5" />
                      {diff}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <div>
              <h3 className="font-semibold text-lg mb-3">Target Market Segments</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {gtmData.target_segments?.map((segment: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <h4 className="font-semibold mb-2">{segment.segment}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                    <div className="text-xs mb-2"><span className="text-muted-foreground">Size:</span> {segment.size}</div>
                    <ul className="text-sm space-y-1">
                      {segment.characteristics?.map((char: string, i: number) => (
                        <li key={i}>• {char}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Marketing Channels</h3>
                <div className="space-y-3">
                  {gtmData.marketing_channels?.map((channel: any, idx: number) => (
                    <Card key={idx} className="p-3 bg-success/5">
                      <h4 className="font-semibold text-sm mb-1">{channel.channel}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{channel.strategy}</p>
                      <div className="flex gap-4 text-xs">
                        <span><span className="text-muted-foreground">Budget:</span> {channel.budget_allocation}</span>
                        <span><span className="text-muted-foreground">ROI:</span> {channel.expected_roi}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Pricing Strategy</h3>
                <Card className="p-4 bg-warning/5">
                  <div className="mb-3">
                    <span className="font-semibold text-sm">Model:</span>
                    <p className="text-sm">{gtmData.pricing_strategy?.model}</p>
                  </div>
                  <div className="space-y-2">
                    {gtmData.pricing_strategy?.tiers?.map((tier: any, idx: number) => (
                      <div key={idx} className="p-2 bg-background rounded border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{tier.name}</span>
                          <span className="text-primary font-bold">{tier.price}</span>
                        </div>
                        <ul className="text-xs space-y-0.5">
                          {tier.features?.slice(0, 3).map((f: string, i: number) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">{gtmData.pricing_strategy?.competitive_position}</p>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Sales Strategy</h3>
              <Card className="p-4 bg-muted/30">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Process:</span>
                    <p className="text-muted-foreground mt-1">{safeString(gtmData.sales_strategy?.process, 'TBD')}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Team:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {safeArray(gtmData.sales_strategy?.team_structure).map((role: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {typeof role === 'object' ? (role as any).role || (role as any).name || JSON.stringify(role) : role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Tactics:</span>
                    <ul className="mt-1">
                      {safeArray(gtmData.sales_strategy?.conversion_tactics).slice(0, 3).map((t: string, i: number) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Launch Phases</h3>
              <div className="space-y-3">
                {gtmData.launch_phases?.map((phase: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold">{phase.phase}</h4>
                        <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 ml-11 text-sm">
                      <div>
                        <span className="font-semibold">Activities:</span>
                        <ul className="mt-1">
                          {phase.activities?.map((a: string, i: number) => (
                            <li key={i}>• {a}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold">Goals:</span>
                        <ul className="mt-1">
                          {phase.goals?.map((g: string, i: number) => (
                            <li key={i}>• {g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Growth Tactics</h3>
                <div className="space-y-2">
                  {gtmData.growth_tactics?.map((tactic: any, idx: number) => (
                    <Card key={idx} className="p-3 bg-success/5">
                      <h4 className="font-semibold text-sm mb-1">{tactic.tactic}</h4>
                      <p className="text-xs text-muted-foreground">{tactic.description}</p>
                      <p className="text-xs mt-1"><span className="text-muted-foreground">Impact:</span> {tactic.expected_impact}</p>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Metrics</h3>
                <div className="space-y-2">
                  {gtmData.key_metrics?.map((metric: any, idx: number) => (
                    <Card key={idx} className="p-3 bg-primary/5">
                      <h4 className="font-semibold text-sm mb-1">{metric.metric}</h4>
                      <div className="flex gap-4 text-xs">
                        <span><span className="text-muted-foreground">Target:</span> {metric.target}</span>
                        <span><span className="text-muted-foreground">Frequency:</span> {metric.measurement_frequency}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
