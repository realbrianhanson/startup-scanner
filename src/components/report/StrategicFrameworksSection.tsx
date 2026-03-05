import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  reportData: any;
}

export const StrategicFrameworksSection = ({ reportData }: Props) => {
  if (!reportData.strategic_frameworks) return null;

  return (
    <Collapsible>
      <Card id="strategic-frameworks" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Strategic Frameworks</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">SWOT Analysis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 bg-success/5">
                  <h4 className="font-semibold mb-2 text-success">Strengths</h4>
                  <ul className="space-y-1 text-sm">
                    {reportData.strategic_frameworks.swot?.strengths?.map((s: string, i: number) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4 bg-destructive/5">
                  <h4 className="font-semibold mb-2 text-destructive">Weaknesses</h4>
                  <ul className="space-y-1 text-sm">
                    {reportData.strategic_frameworks.swot?.weaknesses?.map((w: string, i: number) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4 bg-primary/5">
                  <h4 className="font-semibold mb-2 text-primary">Opportunities</h4>
                  <ul className="space-y-1 text-sm">
                    {reportData.strategic_frameworks.swot?.opportunities?.map((o: string, i: number) => (
                      <li key={i}>• {o}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4 bg-warning/5">
                  <h4 className="font-semibold mb-2 text-warning">Threats</h4>
                  <ul className="space-y-1 text-sm">
                    {reportData.strategic_frameworks.swot?.threats?.map((t: string, i: number) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Go-to-Market Strategy</h3>
              <ul className="space-y-2">
                {reportData.strategic_frameworks.gtm_strategy?.map((strategy: string, i: number) => (
                  <li key={i} className="text-sm flex items-start">
                    <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
