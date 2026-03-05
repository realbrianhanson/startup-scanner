import { TrendingUp } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, safeArray, getMarketData, toMarkdownString } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

/* Concentric circles TAM/SAM/SOM */
const MarketSizeCircles = ({ tam, sam, som }: { tam: string; sam: string; som: string }) => (
  <div className="flex flex-col md:flex-row items-center gap-8 py-4">
    <div className="relative w-64 h-64 shrink-0">
      {/* TAM */}
      <div className="absolute inset-0 rounded-full bg-primary/[0.08] border border-primary/20 flex items-center justify-center">
        <span className="absolute top-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">TAM</span>
      </div>
      {/* SAM */}
      <div className="absolute inset-[20%] rounded-full bg-primary/[0.15] border border-primary/30 flex items-center justify-center">
        <span className="absolute top-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SAM</span>
      </div>
      {/* SOM */}
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
        <div key={item.label} className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${item.opacity} border border-primary/30 shrink-0`} />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
            <p className="text-lg font-bold text-primary">{item.value || "Analysis in progress"}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

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

      {marketData.timing_assessment && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Timing Assessment</h3>
            <MarkdownContent content={toMarkdownString(marketData.timing_assessment)} />
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
