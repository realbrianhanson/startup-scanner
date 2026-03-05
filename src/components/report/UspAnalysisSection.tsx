import { Target, Sparkles, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

export const UspAnalysisSection = ({ reportData }: Props) => {
  if (!reportData.usp_analysis) return null;
  const usp = reportData.usp_analysis;

  return (
    <ReportSectionCard id="usp-analysis" title="Unique Selling Proposition">
      {/* Recommended USP */}
      <div className="border-l-2 border-l-primary pl-5 py-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Recommended USP</p>
        <p className="text-lg font-medium">{usp.recommended_usp}</p>
      </div>

      {/* Current Positioning */}
      {usp.current_positioning && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3">Current Positioning</h3>
            <p className="text-sm text-muted-foreground mb-4">{usp.current_positioning.summary}</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-sans text-sm font-semibold text-emerald-500 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Strengths
                </h4>
                <ul className="space-y-1.5">
                  {usp.current_positioning.strengths?.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-amber-500 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> Gaps
                </h4>
                <ul className="space-y-1.5">
                  {usp.current_positioning.gaps?.map((g: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />{g}
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
            <h3 className="font-sans text-lg font-semibold mb-3">Key Differentiators</h3>
            <div className="space-y-0">
              {usp.key_differentiators.map((diff: any, i: number) => (
                <div key={i} className="py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-sm text-muted-foreground w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-sm font-medium">{diff.differentiator}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{diff.description}</p>
                      <span className="text-xs text-primary font-medium mt-1 inline-block">Impact: {diff.impact}</span>
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
            <h3 className="font-sans text-lg font-semibold mb-3">Competitive Advantages</h3>
            <div className="space-y-0">
              {usp.competitive_advantages.map((adv: any, i: number) => (
                <div key={i} className="py-3 border-b border-border/30 last:border-0">
                  <p className="text-sm font-medium">{adv.advantage}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{adv.description}</p>
                  {adv.quantifiable_benefit && <p className="text-xs text-primary mt-1">{adv.quantifiable_benefit}</p>}
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
            <h3 className="font-sans text-lg font-semibold mb-3">Value Proposition</h3>
            <div className="space-y-2">
              {[
                { key: "what", label: "What" },
                { key: "how", label: "How" },
                { key: "why", label: "Why" },
              ].map((item) => (
                <div key={item.key} className="py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</span>
                  <p className="text-sm mt-0.5">{(usp.value_proposition as any)[item.key]}</p>
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
            <h3 className="font-sans text-lg font-semibold mb-3">Target Audience Alignment</h3>
            <p className="text-sm mb-3"><span className="font-medium">Primary:</span> {usp.target_alignment.primary_audience}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Emotional Triggers:</p>
                <p className="text-sm">{usp.target_alignment.emotional_triggers?.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Rational Benefits:</p>
                <p className="text-sm">{usp.target_alignment.rational_benefits?.join(", ")}</p>
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
            <h3 className="font-sans text-lg font-semibold mb-3">Proof Points</h3>
            <div className="space-y-0">
              {usp.proof_points.map((point: any, i: number) => (
                <div key={i} className="py-3 border-b border-border/30 last:border-0">
                  <p className="text-sm font-medium">{point.claim}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Evidence: {point.evidence}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Credibility: {point.credibility}</p>
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
            <h3 className="font-sans text-lg font-semibold mb-3">Communication Guidelines</h3>
            <div className="space-y-4">
              {usp.communication_guidelines.elevator_pitch && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Elevator Pitch:</p>
                  <blockquote className="border-l-2 border-muted-foreground/20 pl-4 py-1 text-sm italic">
                    {usp.communication_guidelines.elevator_pitch}
                  </blockquote>
                </div>
              )}
              {usp.communication_guidelines.tagline_options && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tagline Options:</p>
                  <div className="space-y-1">
                    {usp.communication_guidelines.tagline_options.map((t: string, i: number) => (
                      <p key={i} className="text-sm font-medium">{t}</p>
                    ))}
                  </div>
                </div>
              )}
              {usp.communication_guidelines.key_messages && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Key Messages:</p>
                  <ul className="space-y-1 text-sm">
                    {usp.communication_guidelines.key_messages.map((m: string, i: number) => (
                      <li key={i}>· {m}</li>
                    ))}
                  </ul>
                </div>
              )}
              {usp.communication_guidelines.tone && (
                <p className="text-sm"><span className="text-muted-foreground">Tone:</span> {usp.communication_guidelines.tone}</p>
              )}
            </div>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
