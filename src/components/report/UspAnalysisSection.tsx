import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lightbulb, Target, Sparkles, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props {
  reportData: any;
}

export const UspAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.usp_analysis) return null;

  const usp = reportData.usp_analysis;

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="usp">
          <AccordionTrigger className="px-6 hover:no-underline">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                Unique Selling Proposition (USP)
              </CardTitle>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-6">
              {/* Recommended USP */}
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="font-semibold mb-2">Recommended USP</h4>
                <p className="text-lg font-medium">{usp.recommended_usp}</p>
              </div>

              {/* Current Positioning */}
              {usp.current_positioning && (
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg">Current Positioning</h4>
                  </div>
                  <p className="mb-5 text-muted-foreground leading-relaxed">{usp.current_positioning.summary}</p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">Strengths</p>
                      </div>
                      <ul className="space-y-2">
                        {usp.current_positioning.strengths?.map((strength: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <p className="font-medium text-amber-600 dark:text-amber-400">Gaps to Address</p>
                      </div>
                      <ul className="space-y-2">
                        {usp.current_positioning.gaps?.map((gap: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Differentiators */}
              {usp.key_differentiators && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg">Key Differentiators</h4>
                  </div>
                  <div className="grid gap-4">
                    {usp.key_differentiators.map((diff: any, i: number) => (
                      <div key={i} className="group relative bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-xl p-5 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="ml-12">
                          <p className="font-semibold text-foreground mb-1">{diff.differentiator}</p>
                          <p className="text-sm text-muted-foreground mb-3">{diff.description}</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
                            <Zap className="w-3 h-3" />
                            Impact: {diff.impact}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Advantages */}
              {usp.competitive_advantages && (
                <div>
                  <h4 className="font-semibold mb-3">Competitive Advantages</h4>
                  <div className="grid gap-3">
                    {usp.competitive_advantages.map((adv: any, i: number) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{adv.advantage}</p>
                        <p className="text-sm text-muted-foreground mt-1">{adv.description}</p>
                        <p className="text-sm mt-2 text-primary">📊 {adv.quantifiable_benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Value Proposition */}
              {usp.value_proposition && (
                <div>
                  <h4 className="font-semibold mb-3">Value Proposition Components</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 rounded">
                      <p className="font-medium text-blue-700 dark:text-blue-300">What</p>
                      <p className="text-sm">{usp.value_proposition.what}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded">
                      <p className="font-medium text-green-700 dark:text-green-300">How</p>
                      <p className="text-sm">{usp.value_proposition.how}</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded">
                      <p className="font-medium text-purple-700 dark:text-purple-300">Why</p>
                      <p className="text-sm">{usp.value_proposition.why}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Alignment */}
              {usp.target_alignment && (
                <div>
                  <h4 className="font-semibold mb-3">Target Audience Alignment</h4>
                  <p className="mb-3"><span className="font-medium">Primary Audience:</span> {usp.target_alignment.primary_audience}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Emotional Triggers:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {usp.target_alignment.emotional_triggers?.map((trigger: string, i: number) => (
                          <li key={i}>{trigger}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Rational Benefits:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {usp.target_alignment.rational_benefits?.map((benefit: string, i: number) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof Points */}
              {usp.proof_points && (
                <div>
                  <h4 className="font-semibold mb-3">Proof Points</h4>
                  <div className="space-y-3">
                    {usp.proof_points.map((point: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3">
                        <p className="font-medium">{point.claim}</p>
                        <p className="text-sm text-muted-foreground mt-1"><span className="font-medium">Evidence:</span> {point.evidence}</p>
                        <p className="text-sm mt-1"><span className="font-medium">Credibility:</span> {point.credibility}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communication Guidelines */}
              {usp.communication_guidelines && (
                <div>
                  <h4 className="font-semibold mb-3">Communication Guidelines</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Elevator Pitch (30 seconds):</p>
                      <p className="p-3 bg-muted/50 rounded">{usp.communication_guidelines.elevator_pitch}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Tagline Options:</p>
                      <div className="space-y-2">
                        {usp.communication_guidelines.tagline_options?.map((tagline: string, i: number) => (
                          <p key={i} className="p-2 bg-primary/5 rounded text-center font-medium">{tagline}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Key Messages:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {usp.communication_guidelines.key_messages?.map((message: string, i: number) => (
                          <li key={i}>{message}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Tone:</p>
                      <p>{usp.communication_guidelines.tone}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
