import { Target, CheckCircle2, ShieldCheck, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeString, getCompetitiveLandscape } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";

interface Props {
  reportData: any;
}

const threatColor = (level: string) => {
  const l = level?.toLowerCase();
  if (l === 'high') return 'destructive';
  if (l === 'low') return 'secondary';
  return 'outline';
};

export const CompetitiveLandscapeSection = ({ reportData }: Props) => {
  if (!reportData.competitive_landscape) return null;

  const compData = getCompetitiveLandscape(reportData.competitive_landscape) as any;

  return (
    <ReportSectionCard
      id="competitive-landscape"
      icon={<Target className="h-5 w-5 text-primary" />}
      title="Competitive Landscape"
    >
      {/* Direct Competitors */}
      <h3 className="font-semibold text-lg">Direct Competitors</h3>
      {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {compData.direct_competitors.map((comp: any, i: number) => (
            <div
              key={i}
              className="relative rounded-xl border p-5 hover:border-primary/20 transition-all animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-destructive/60 to-destructive/20" />
              <div className="pl-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{comp.name}</h4>
                  {comp.threat_level && (
                    <Badge variant={threatColor(comp.threat_level)} className="text-[10px]">{comp.threat_level} Threat</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{comp.description}</p>
                {comp.estimated_size && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">Size:</span> {comp.estimated_size}</p>
                )}
                {comp.what_they_do_well && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-success/80">Strength:</span> {comp.what_they_do_well}</p>
                )}
                {comp.vulnerability && (
                  <p className="text-xs"><span className="font-medium text-primary">Vulnerability:</span> <span className="text-foreground/80">{comp.vulnerability}</span></p>
                )}
                {/* Legacy: differentiators */}
                {comp.differentiators && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
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

      {/* Indirect Competitors */}
      {compData.indirect_competitors && compData.indirect_competitors.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <h3 className="font-semibold text-lg">Indirect Competitors</h3>
          <div className="space-y-3">
            {compData.indirect_competitors.map((comp: any, i: number) => {
              const c = typeof comp === 'string' ? { name: comp } : comp;
              return (
                <div key={i} className="p-3 rounded-xl bg-muted/20 border">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                  {c.why_customers_choose_them && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium text-foreground/70">Why customers choose them:</span> {c.why_customers_choose_them}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="border-t border-border/50" />

      {/* Competitive Advantages */}
      <div className="rounded-xl bg-success/[0.06] border border-success/20 p-5">
        <h3 className="font-semibold text-lg mb-3 text-success flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Defensible Competitive Advantages
        </h3>
        {compData.competitive_advantages && compData.competitive_advantages.length > 0 ? (
          <div className="space-y-4">
            {compData.competitive_advantages.map((adv: any, i: number) => {
              const a = typeof adv === 'string' ? { advantage: adv } : adv;
              return (
                <div key={i} className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-3 text-success shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-foreground/90">{a.advantage}</p>
                    {a.why_defensible && <p className="text-xs text-muted-foreground mt-0.5">Defensibility: {a.why_defensible}</p>}
                    {a.duration && <p className="text-xs text-muted-foreground">Duration: {a.duration}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">Advantage analysis in progress...</p>
        )}
      </div>

      {/* Positioning */}
      {compData.positioning && (
        <>
          <div className="border-t border-border/50" />
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" />
              Positioning Strategy
            </h3>
            {typeof compData.positioning === 'string' ? (
              <p className="text-foreground/90 text-sm">{compData.positioning}</p>
            ) : (
              <div className="space-y-3">
                {compData.positioning.recommended_position && (
                  <p className="text-sm text-foreground/90">{compData.positioning.recommended_position}</p>
                )}
                {compData.positioning.tagline_suggestion && (
                  <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/15 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Suggested Tagline</p>
                    <p className="text-lg font-bold text-primary italic">"{compData.positioning.tagline_suggestion}"</p>
                  </div>
                )}
                {compData.positioning.positioning_against && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">vs. Top Competitor:</span> {compData.positioning.positioning_against}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Moat Strategy */}
      {compData.competitive_moat_strategy && (
        <>
          <div className="border-t border-border/50" />
          <div className="p-4 rounded-xl bg-primary/[0.05] border border-primary/10">
            <h4 className="font-semibold text-sm text-primary mb-2">🏰 Competitive Moat Strategy</h4>
            <p className="text-sm text-foreground/90">{compData.competitive_moat_strategy}</p>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
