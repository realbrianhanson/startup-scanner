import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarkdownContent } from "@/components/MarkdownContent";
import { safeString, getCompetitiveLandscape } from "@/lib/reportHelpers";

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
    <Collapsible>
      <Card id="competitive-landscape" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Competitive Landscape</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Direct Competitors</h3>
              <div className="space-y-4">
                {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
                  compData.direct_competitors.map((comp: any, i: number) => (
                    <Card key={i} className="p-5 bg-muted/30">
                      <p className="font-semibold text-lg mb-2">{comp.name}</p>
                      <p className="text-foreground/80 leading-relaxed">{comp.description}</p>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">Competitor analysis in progress...</p>
                )}
              </div>
            </div>

            <div className="bg-success/10 p-5 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Your Competitive Advantages</h3>
              {compData.competitive_advantages && compData.competitive_advantages.length > 0 ? (
                <ul className="space-y-3">
                  {compData.competitive_advantages.map((adv: string, i: number) => (
                    <li key={i} className="flex items-start leading-relaxed">
                      <CheckCircle2 className="h-5 w-5 mr-3 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{adv}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Advantage analysis in progress...</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Positioning Recommendation</h3>
              <MarkdownContent content={safeString(compData.positioning || '', 'Positioning analysis in progress...')} />
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
