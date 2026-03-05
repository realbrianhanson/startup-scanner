import { Target, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, getCompetitiveLandscape } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const CompetitiveLandscapeSection = ({ reportData }: Props) => {
  if (!reportData.competitive_landscape) return null;

  const compData = getCompetitiveLandscape(reportData.competitive_landscape) as {
    direct_competitors?: any[];
    indirect_competitors?: any[];
    competitive_advantages?: string[];
    positioning?: string;
  };

  return (
    <ReportSectionCard
      id="competitive-landscape"
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Competitive Landscape"
    >
      {/* Competitor cards */}
      <h3 className="font-semibold text-lg">Direct Competitors</h3>
      {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {compData.direct_competitors.map((comp: any, i: number) => (
            <div
              key={i}
              className="relative rounded-xl border p-5 hover:border-primary/20 transition-all animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Left accent */}
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-destructive/60 to-destructive/20" />
              <div className="pl-3">
                <h4 className="font-bold text-lg mb-1">{comp.name}</h4>
                {comp.strength && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-32">
                      <div
                        className="h-full rounded-full bg-destructive/60"
                        style={{ width: `${Math.min(100, (comp.strength || 50))}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Threat</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{comp.description}</p>
                {comp.differentiators && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(Array.isArray(comp.differentiators) ? comp.differentiators : [comp.differentiators]).map((d: string, j: number) => (
                      <Badge key={j} variant="outline" className="text-[10px]">{d}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic">Competitor analysis in progress...</p>
      )}

      <div className="border-t border-border/50" />

      {/* Competitive advantages */}
      <div className="rounded-xl bg-success/[0.06] border border-success/20 p-5">
        <h3 className="font-semibold text-lg mb-3 text-success">Your Competitive Advantages</h3>
        {compData.competitive_advantages && compData.competitive_advantages.length > 0 ? (
          <ul className="space-y-3">
            {compData.competitive_advantages.map((adv: string, i: number) => (
              <li key={i} className="flex items-start leading-relaxed">
                <CheckCircle2 className="h-4 w-4 mr-3 text-success shrink-0 mt-1" />
                <span className="text-foreground/90 text-sm">{adv}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground italic text-sm">Advantage analysis in progress...</p>
        )}
      </div>

      {compData.positioning && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3">Positioning Recommendation</h3>
            <MarkdownContent content={safeString(compData.positioning, "Positioning analysis in progress...")} />
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
