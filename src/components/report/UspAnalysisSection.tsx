import { Lightbulb, Target, Sparkles, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const UspAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.usp_analysis) return null;
  const usp = reportData.usp_analysis;

  return (
    <ReportSectionCard
      id="usp-analysis"
      icon={<Lightbulb className="h-5 w-5 text-primary" />}
      title="Unique Selling Proposition (USP)"
    >
      {/* Recommended USP */}
      <div className="rounded-xl bg-primary/[0.06] border-l-[3px] border-l-primary border border-primary/20 p-5">
        <h4 className="font-semibold mb-2">Recommended USP</h4>
        <p className="text-lg font-medium">{usp.recommended_usp}</p>
      </div>

      {/* Current Positioning */}
      {usp.current_positioning && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/[0.08]"><Target className="w-4 h-4 text-primary" /></div>
              <h4 className="font-semibold text-lg">Current Positioning</h4>
            </div>
            <p className="mb-4 text-muted-foreground leading-relaxed">{usp.current_positioning.summary}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-success/[0.06] border border-success/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="font-medium text-success">Strengths</p>
                </div>
                <ul className="space-y-2">
                  {usp.current_positioning.strengths?.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-warning/[0.06] border border-warning/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <p className="font-medium text-warning">Gaps to Address</p>
                </div>
                <ul className="space-y-2">
                  {usp.current_positioning.gaps?.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />{g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Key Differentiators */}
      {usp.key_differentiators && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/[0.08]"><Sparkles className="w-4 h-4 text-primary" /></div>
              <h4 className="font-semibold text-lg">Key Differentiators</h4>
            </div>
            <div className="space-y-3">
              {usp.key_differentiators.map((diff: any, i: number) => (
                <div key={i} className="rounded-xl border bg-gradient-to-r from-primary/[0.03] to-transparent p-4 hover:border-primary/20 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{i + 1}</span>
                    <div>
                      <p className="font-semibold">{diff.differentiator}</p>
                      <p className="text-sm text-muted-foreground mt-1">{diff.description}</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/[0.08] rounded-full text-xs font-medium text-primary mt-2">
                        <Zap className="w-3 h-3" /> Impact: {diff.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Competitive Advantages */}
      {usp.competitive_advantages && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Competitive Advantages</h4>
            <div className="space-y-3">
              {usp.competitive_advantages.map((adv: any, i: number) => (
                <div key={i} className="rounded-xl border p-4">
                  <p className="font-medium">{adv.advantage}</p>
                  <p className="text-sm text-muted-foreground mt-1">{adv.description}</p>
                  <p className="text-sm mt-2 text-primary">📊 {adv.quantifiable_benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Value Proposition */}
      {usp.value_proposition && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Value Proposition Components</h4>
            <div className="space-y-3">
              {[
                { key: "what", label: "What", bg: "bg-primary/[0.05]", text: "text-primary" },
                { key: "how", label: "How", bg: "bg-success/[0.05]", text: "text-success" },
                { key: "why", label: "Why", bg: "bg-secondary/[0.05]", text: "text-secondary" },
              ].map((item) => (
                <div key={item.key} className={`rounded-lg ${item.bg} p-3`}>
                  <p className={`font-medium ${item.text} text-sm`}>{item.label}</p>
                  <p className="text-sm mt-1">{(usp.value_proposition as any)[item.key]}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Target Alignment */}
      {usp.target_alignment && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Target Audience Alignment</h4>
            <p className="mb-3 text-sm"><span className="font-medium">Primary Audience:</span> {usp.target_alignment.primary_audience}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-2">Emotional Triggers:</p>
                <div className="flex flex-wrap gap-1.5">
                  {usp.target_alignment.emotional_triggers?.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-secondary/[0.05]">{t}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Rational Benefits:</p>
                <div className="flex flex-wrap gap-1.5">
                  {usp.target_alignment.rational_benefits?.map((b: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-primary/[0.05]">{b}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Proof Points */}
      {usp.proof_points && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Proof Points</h4>
            <div className="space-y-3">
              {usp.proof_points.map((point: any, i: number) => (
                <div key={i} className="rounded-xl border p-4">
                  <p className="font-medium">{point.claim}</p>
                  <p className="text-sm text-muted-foreground mt-1"><span className="font-medium">Evidence:</span> {point.evidence}</p>
                  <p className="text-sm mt-1"><span className="font-medium">Credibility:</span> {point.credibility}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Communication Guidelines */}
      {usp.communication_guidelines && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-semibold text-lg mb-3">Communication Guidelines</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold mb-1">Elevator Pitch (30 seconds):</p>
                <p className="p-3 rounded-lg bg-muted/30 text-sm italic">{usp.communication_guidelines.elevator_pitch}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Tagline Options:</p>
                <div className="space-y-2">
                  {usp.communication_guidelines.tagline_options?.map((t: string, i: number) => (
                    <p key={i} className="p-2.5 bg-primary/[0.04] rounded-lg text-center font-medium text-sm">{t}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Key Messages:</p>
                <ul className="space-y-1 text-sm">
                  {usp.communication_guidelines.key_messages?.map((m: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-primary">•</span> {m}</li>
                  ))}
                </ul>
              </div>
              {usp.communication_guidelines.tone && (
                <div>
                  <p className="text-xs font-semibold mb-1">Tone:</p>
                  <p className="text-sm">{usp.communication_guidelines.tone}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
