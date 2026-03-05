import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  reportData: any;
}

export const CatwoeAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.catwoe_analysis) return null;

  const c = reportData.catwoe_analysis;

  return (
    <Collapsible>
      <Card id="catwoe-analysis" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">CATWOE Analysis</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-primary/5">
              <h4 className="font-semibold mb-2 text-primary flex items-center gap-2">
                <span className="text-lg font-bold">C</span> Customers
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.customers?.description}</p>
              <ul className="space-y-1 text-sm">
                {c.customers?.key_points?.map((point: string, i: number) => (
                  <li key={i}>• {point}</li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-4 bg-success/5">
              <h4 className="font-semibold mb-2 text-success flex items-center gap-2">
                <span className="text-lg font-bold">A</span> Actors
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.actors?.description}</p>
              <ul className="space-y-1 text-sm">
                {c.actors?.key_points?.map((point: string, i: number) => (
                  <li key={i}>• {point}</li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-4 bg-warning/5">
              <h4 className="font-semibold mb-2 text-warning flex items-center gap-2">
                <span className="text-lg font-bold">T</span> Transformation
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.transformation?.description}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Inputs:</span>
                  <ul className="ml-2">
                    {c.transformation?.inputs?.map((input: string, i: number) => (
                      <li key={i}>• {input}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Outputs:</span>
                  <ul className="ml-2">
                    {c.transformation?.outputs?.map((output: string, i: number) => (
                      <li key={i}>• {output}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-secondary/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg font-bold">W</span> World View
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.world_view?.description}</p>
              <div className="text-sm">
                <span className="font-medium">Assumptions:</span>
                <ul className="ml-2 mt-1">
                  {c.world_view?.assumptions?.map((assumption: string, i: number) => (
                    <li key={i}>• {assumption}</li>
                  ))}
                </ul>
              </div>
            </Card>
            
            <Card className="p-4 bg-destructive/5">
              <h4 className="font-semibold mb-2 text-destructive flex items-center gap-2">
                <span className="text-lg font-bold">O</span> Owners
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.owners?.description}</p>
              <div className="text-sm">
                <span className="font-medium">Stakeholders:</span>
                <ul className="ml-2 mt-1">
                  {c.owners?.stakeholders?.map((stakeholder: string, i: number) => (
                    <li key={i}>• {stakeholder}</li>
                  ))}
                </ul>
              </div>
            </Card>
            
            <Card className="p-4 bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg font-bold">E</span> Environment
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{c.environmental_constraints?.description}</p>
              <div className="text-sm">
                <span className="font-medium">Constraints:</span>
                <ul className="ml-2 mt-1">
                  {c.environmental_constraints?.constraints?.map((constraint: string, i: number) => (
                    <li key={i}>• {constraint}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
