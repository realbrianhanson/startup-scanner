import { ShieldAlert, Lightbulb } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, safeArray, getMarketData, toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";
import { Badge } from "@/components/ui/badge";

interface Props {
  reportData: any;
}

/* Horizontal bars for TAM/SAM/SOM */
const MarketSizeBars = ({ tam, sam, som }: { tam: string; sam: string; som: string }) => (
  <div className="space-y-4 py-2">
    {[
      { label: "TAM", sublabel: "Total Addressable Market", value: tam, width: "100%" },
      { label: "SAM", sublabel: "Serviceable Available Market", value: sam, width: "60%" },
      { label: "SOM", sublabel: "Serviceable Obtainable Market", value: som, width: "25%" },
    ].map((item) => (
      <div key={item.label} className="space-y-1">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-primary">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.sublabel}</span>
          </div>
          <span className="font-mono text-sm font-medium">{item.value || "—"}</span>
        </div>
        <div className="h-2 bg-muted rounded-sm overflow-hidden">
          <div
            className="h-full bg-primary/40 rounded-sm transition-all duration-700"
            style={{ width: item.width }}
          />
        </div>
      </div>
    ))}
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
    <ReportSectionCard id="market-analysis" title="Market Analysis" defaultOpen>
      <MarketSizeBars
        tam={safeString(marketData.tam, "")}
        sam={safeString(marketData.sam, "")}
        som={safeString(marketData.som, "")}
      />

      {/* Growth & Maturity */}
      <div className="flex flex-wrap gap-8 py-2">
        {marketData.growth_rate && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Growth Rate</p>
            <p className="text-sm font-medium">{marketData.growth_rate}</p>
          </div>
        )}
        {marketData.market_maturity && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market Maturity</p>
            <p className="text-sm font-medium">{marketData.market_maturity}</p>
          </div>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Trends */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3">Market Trends</h3>
        {safeArray(marketData.trends).length > 0 ? (
          <ul className="space-y-3">
            {safeArray(marketData.trends).map((trend: string, i: number) => (
              <li key={i} className="flex items-start leading-relaxed text-sm">
                <span className="text-muted-foreground mr-3 mt-0.5">→</span>
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground italic text-sm">Trend analysis in progress...</p>
        )}
      </div>

      {/* Barriers */}
      {safeArray(marketData.barriers).length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Entry Barriers</h3>
            <div className="space-y-3">
              {safeArray(marketData.barriers).map((b: any, i: number) => {
                const barrier = typeof b === 'string' ? { barrier: b } : b;
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{barrier.barrier}</span>
                        {barrier.difficulty && (
                          <Badge variant={difficultyColor(barrier.difficulty)} className="text-[10px]">{barrier.difficulty}</Badge>
                        )}
                      </div>
                      {barrier.how_to_overcome && (
                        <p className="text-xs text-muted-foreground mt-1">{barrier.how_to_overcome}</p>
                      )}
                    </div>
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
            <h3 className="font-sans text-lg font-semibold mb-3">Timing Assessment</h3>
            <MarkdownContent content={toMarkdownString(marketData.timing_assessment)} />
          </div>
        </>
      )}

      {(safeArray(marketData.market_risks).length > 0 || marketData.adjacent_opportunities) && (
        <>
          <div className="border-t border-border/50" />
          <div className="grid md:grid-cols-2 gap-6">
            {safeArray(marketData.market_risks).length > 0 && (
              <div>
                <h4 className="font-sans text-sm font-semibold text-red-500 mb-2">Market Risks</h4>
                <ul className="space-y-2">
                  {safeArray(marketData.market_risks).map((risk: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {marketData.adjacent_opportunities && (
              <div>
                <h4 className="font-sans text-sm font-semibold text-primary flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  Adjacent Opportunity
                </h4>
                <p className="text-sm">{marketData.adjacent_opportunities}</p>
              </div>
            )}
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
