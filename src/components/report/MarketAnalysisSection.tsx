import { TrendingUp, ShieldAlert, Lightbulb } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, safeArray, getMarketData, toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";
import { Badge } from "@/components/ui/badge";

interface Props {
  reportData: any;
}

/* Concentric circles TAM/SAM/SOM */
const MarketSizeCircles = ({ tam, sam, som }: { tam: string; sam: string; som: string }) => (
  <div className="flex flex-col md:flex-row items-center gap-8 py-4">
    <div className="relative w-64 h-64 shrink-0">
      <div className="absolute inset-0 rounded-full bg-primary/[0.08] border border-primary/20 flex items-center justify-center">
        <span className="absolute top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">TAM</span>
      </div>
      <div className="absolute inset-[20%] rounded-full bg-primary/[0.15] border border-primary/30 flex items-center justify-center">
        <span className="absolute top-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SAM</span>
      </div>
      <div className="absolute inset-[40%] rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary-foreground">SOM</span>
      </div>
    </div>
    <div className="space-y-4 flex-1">
      {[
        { label: "Total Addressable Market", value: tam, opacity: "bg-primary/10" },
        { label: "Serviceable Available Market", value: sam, opacity: "bg-primary/20" },
        { label: "Serviceable Obtainable Market", value: som, opacity: "bg-primary/30" },
      ].map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <div className={`w-4 h-4 rounded-full ${item.opacity} border border-primary/30 shrink-0 mt-1`} />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-sm font-semibold text-foreground">{item.value || "Analysis in progress"}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const difficultyColor = (d: string) => {
  const l = d?.toLowerCase();
  if (l === 'high') return 'destructive';
  if (l === 'low') return 'secondary';
  return 'outline';
};

export const MarketAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.market_analysis) return null;

  const marketData = getMarketData(reportData.market_analysis) as any;

  return (
    <ReportSectionCard
      id="market-analysis"
      icon={<TrendingUp className="h-5 w-5 text-primary" />}
      title="Market Analysis"
      defaultOpen
    >
      {/* Concentric circles */}
      <MarketSizeCircles
        tam={safeString(marketData.tam, "")}
        sam={safeString(marketData.sam, "")}
        som={safeString(marketData.som, "")}
      />

      {/* Growth & Maturity row */}
      <div className="flex flex-wrap gap-4 items-center">
        {marketData.growth_rate && (
          <div className="p-3 rounded-xl bg-muted/30 border flex-1 min-w-[200px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Growth Rate</p>
            <p className="text-sm font-semibold text-foreground">{marketData.growth_rate}</p>
          </div>
        )}
        {marketData.market_maturity && (
          <div className="p-3 rounded-xl bg-muted/30 border flex-1 min-w-[200px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market Maturity</p>
            <p className="text-sm font-semibold text-foreground">{marketData.market_maturity}</p>
          </div>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Trends */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Market Trends</h3>
        {safeArray(marketData.trends).length > 0 ? (
          <ul className="space-y-3">
            {safeArray(marketData.trends).map((trend: string, i: number) => (
              <li key={i} className="flex items-start leading-relaxed">
                <span className="text-primary mr-3 mt-1">→</span>
                <span className="text-foreground/90">{trend}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground italic">Trend analysis in progress...</p>
        )}
      </div>

      {/* Barriers */}
      {safeArray(marketData.barriers).length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Entry Barriers</h3>
            <div className="space-y-3">
              {safeArray(marketData.barriers).map((b: any, i: number) => {
                const barrier = typeof b === 'string' ? { barrier: b } : b;
                return (
                  <div key={i} className="p-3 rounded-xl bg-muted/20 border space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm">{barrier.barrier}</span>
                      {barrier.difficulty && (
                        <Badge variant={difficultyColor(barrier.difficulty)} className="text-[10px]">{barrier.difficulty}</Badge>
                      )}
                    </div>
                    {barrier.how_to_overcome && (
                      <p className="text-xs text-muted-foreground pl-6">{barrier.how_to_overcome}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {marketData.timing_assessment && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Timing Assessment</h3>
            <MarkdownContent content={toMarkdownString(marketData.timing_assessment)} />
          </div>
        </>
      )}

      {/* Market Risks & Adjacent Opportunities */}
      {(safeArray(marketData.market_risks).length > 0 || marketData.adjacent_opportunities) && (
        <>
          <div className="border-t border-border/50" />
          <div className="grid md:grid-cols-2 gap-4">
            {safeArray(marketData.market_risks).length > 0 && (
              <div className="p-4 rounded-xl bg-destructive/[0.05] border border-destructive/10">
                <h4 className="font-semibold text-sm text-destructive mb-2">Market Risks</h4>
                <ul className="space-y-2">
                  {safeArray(marketData.market_risks).map((risk: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {marketData.adjacent_opportunities && (
              <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Adjacent Opportunity
                </h4>
                <p className="text-sm text-foreground/90">{marketData.adjacent_opportunities}</p>
              </div>
            )}
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
