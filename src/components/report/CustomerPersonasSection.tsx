import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  reportData: any;
}

export const CustomerPersonasSection = ({ reportData }: Props) => {
  if (!reportData.customer_personas || !Array.isArray(reportData.customer_personas) || reportData.customer_personas.length === 0) return null;

  return (
    <Collapsible>
      <Card id="customer-personas" className="overflow-hidden border-2 hover:border-primary/20 transition-all scroll-mt-28">
        <CollapsibleTrigger className="w-full p-6 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Your Target Customers</h2>
            </div>
            <Badge variant="secondary">Expand</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-6 pt-0">
          <p className="text-muted-foreground mb-8">
            Meet the 3-4 people most likely to buy from you
          </p>

          {reportData.customer_personas[0] && (
            <Card className="p-6 bg-primary/10 border-primary/30 mb-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    🎯
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">START WITH {reportData.customer_personas[0].name?.toUpperCase()}</h3>
                  <p className="text-foreground/90 mb-2">
                    <strong>Why:</strong> {reportData.customer_personas[0].priority_reason}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-8">
            {reportData.customer_personas.map((persona: any, idx: number) => (
              <Card key={idx} className="p-6 bg-muted/30">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-2xl font-bold">{persona.name}</h3>
                    {idx === 0 && <Badge variant="default" className="text-sm">START HERE</Badge>}
                    {idx > 0 && <Badge variant="secondary" className="text-sm">{persona.priority} PRIORITY</Badge>}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Who They Are
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Age:</span> <strong>{persona.age}</strong></div>
                      <div><span className="text-muted-foreground">Job:</span> <strong>{persona.job}</strong></div>
                      <div><span className="text-muted-foreground">Income:</span> <strong>{persona.income}</strong></div>
                      <div><span className="text-muted-foreground">Location:</span> <strong>{persona.location}</strong></div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Values:</p>
                      <p className="font-medium">{Array.isArray(persona.values) ? persona.values.join(', ') : persona.values}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Personality:</p>
                      <p className="font-medium">{Array.isArray(persona.personality) ? persona.personality.join(', ') : persona.personality}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      3 Big Pain Points
                    </h4>
                    <div className="space-y-3">
                      {persona.pain_points?.map((pp: any, i: number) => (
                        <div key={i} className="bg-warning/10 p-4 rounded-lg">
                          <p className="font-semibold text-warning">
                            {i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'TERTIARY'}: {pp.pain}
                          </p>
                          <p className="text-sm text-foreground/80 mt-1">
                            <strong>Impact:</strong> {pp.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm"><strong>Current broken solution:</strong> {persona.current_solution}</p>
                      <p className="text-sm mt-2"><strong>Dream outcome:</strong> {persona.dream_outcome}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      Objections (What stops them from buying)
                    </h4>
                    <div className="space-y-2">
                      {persona.objections?.map((obj: any, i: number) => (
                        <div key={i} className="bg-destructive/10 p-3 rounded-lg text-sm">
                          <p><strong>"{obj.objection}"</strong></p>
                          <p className="text-foreground/70 mt-1">→ Root cause: {obj.root_cause}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-success" />
                      Closing Angles (How to convert them)
                    </h4>
                    <div className="space-y-2">
                      {persona.closing_angles?.map((angle: any, i: number) => (
                        <div key={i} className="bg-success/10 p-3 rounded-lg text-sm">
                          <p className="font-semibold">{angle.angle}</p>
                          <p className="text-foreground/70 text-xs mt-1">Addresses: {angle.addresses}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                      <p><strong>Proof they need:</strong> {persona.proof_needed}</p>
                      <p><strong>Urgency trigger:</strong> {persona.urgency_trigger}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
