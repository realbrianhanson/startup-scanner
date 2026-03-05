import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, safeArray, getMarketData, toMarkdownString } from "@/lib/reportHelpers";

interface Props {
  reportData: any;
}

export const MarketAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.market_analysis) return null;

  const marketData = getMarketData(reportData.market_analysis) as {
    tam?: string;
    sam?: string;
    som?: string;
    growth_rate?: string;
    trends?: string[];
    barriers?: string[];
    timing_assessment?: string;
  };

  return (
    <Collapsible defaultOpen>
      <Card id="market-analysis" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Market Analysis</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Total Addressable Market</p>
                <div className="text-xl font-bold text-primary">
                  {safeString(marketData.tam, 'Analysis in progress')}
                </div>
              </Card>
              <Card className="p-5 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Available Market</p>
                <div className="text-xl font-bold text-primary">
                  {safeString(marketData.sam, 'Analysis in progress')}
                </div>
              </Card>
              <Card className="p-5 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Serviceable Obtainable Market</p>
                <div className="text-xl font-bold text-primary">
                  {safeString(marketData.som, 'Analysis in progress')}
                </div>
              </Card>
            </div>
            
            <div className="bg-muted/20 p-5 rounded-lg">
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

            <div>
              <h3 className="font-semibold text-lg mb-3">Timing Assessment</h3>
              <MarkdownContent content={toMarkdownString(marketData.timing_assessment)} />
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
