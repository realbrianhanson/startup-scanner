import { CheckCircle2, ShieldCheck, Crosshair } from "lucide-react";
import { InsightCallout } from "./InsightCallout";
import { Badge } from "@/components/ui/badge";
import { getCompetitiveLandscape } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";
import { cn } from "@/lib/utils";

interface Props {
  reportData: any;
}

const threatColor = (level: string) => {
  const l = level?.toLowerCase();
  if (l === 'high') return 'destructive';
  if (l === 'low') return 'secondary';
  return 'outline';
};

const threatBarColor = (level: string) => {
  const l = level?.toLowerCase();
  if (l === 'high') return 'bg-red-500';
  if (l === 'low') return 'bg-emerald-500';
  return 'bg-amber-500';
};

/* ── Positioning Spectrum ── */

const estimatePosition = (text: string): number => {
  const t = (text || "").toLowerCase();
  if (/premium|luxury|high.?end|enterprise|exclusive/.test(t)) return 85;
  if (/affordable|budget|cheap|low.?cost|free/.test(t)) return 15;
  if (/value|mid.?range|balanced|moderate/.test(t)) return 45;
  if (/disrupt|undercut/.test(t)) return 25;
  return 55; // default slightly right of center
};

const estimateCompetitorPosition = (comp: any, idx: number, total: number): number => {
  const desc = [comp.what_they_do_well, comp.name, comp.vulnerability].filter(Boolean).join(" ");
  const base = estimatePosition(desc);
  // Spread competitors so they don't overlap
  const spread = (idx / Math.max(total - 1, 1)) * 30 + 25; // 25-55 range as default
  if (base !== 55) return Math.min(95, Math.max(5, base + (idx * 8 - total * 4)));
  return Math.min(95, Math.max(5, spread + (idx % 2 === 0 ? 10 : -5)));
};

const PositioningSpectrum = ({
  competitors,
  positioning,
  projectName,
}: {
  competitors: any[];
  positioning: any;
  projectName?: string;
}) => {
  const posText = typeof positioning === "string"
    ? positioning
    : positioning?.recommended_position || positioning?.positioning_against || "";

  const userPos = estimatePosition(posText);

  const compPositions = competitors.slice(0, 5).map((c, i) => ({
    name: c.name || `Competitor ${i + 1}`,
    pos: estimateCompetitorPosition(c, i, competitors.length),
    threat: c.threat_level,
  }));

  return (
    <div className="mb-2">
      <h3 className="font-sans text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Market Positioning
      </h3>
      <div className="relative py-8">
        {/* Axis labels */}
        <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          <span>Budget</span>
          <span>Mid-Market</span>
          <span>Premium</span>
        </div>

        {/* Track */}
        <div className="relative h-[3px] bg-border rounded-full mx-1">
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: "linear-gradient(to right, hsl(var(--muted-foreground)/0.2), hsl(var(--primary)/0.4))",
            }}
          />

          {/* Competitor dots */}
          {compPositions.map((c, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${c.pos}%`, top: "-28px" }}
            >
              <span className="text-[10px] text-muted-foreground font-medium mb-1 whitespace-nowrap max-w-[70px] truncate text-center block">
                {c.name}
              </span>
              <div className={cn(
                "w-3 h-3 rounded-full border-2 border-background",
                c.threat?.toLowerCase() === "high" ? "bg-red-500" :
                c.threat?.toLowerCase() === "low" ? "bg-emerald-500" : "bg-muted-foreground/60"
              )} />
            </div>
          ))}

          {/* User's business dot — larger, below the line */}
          <div
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${userPos}%`, top: "6px" }}
          >
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-background shadow-md shadow-primary/30" />
            <span className="text-[10px] text-primary font-bold mt-1 whitespace-nowrap">
              {projectName || "You"}
            </span>
          </div>
        </div>

        {/* Midpoint reference */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[26px] h-6 border-l border-dashed border-muted-foreground/20" />
      </div>
    </div>
  );
};

export const CompetitiveLandscapeSection = ({ reportData }: Props) => {
  if (!reportData.competitive_landscape) return null;

  const compData = getCompetitiveLandscape(reportData.competitive_landscape) as any;

  return (
    <ReportSectionCard id="competitive-landscape" title="Competitive Landscape">
      {/* Positioning Spectrum — visual map at top */}
      {compData.direct_competitors?.length > 0 && (
        <>
          <PositioningSpectrum
            competitors={compData.direct_competitors}
            positioning={compData.positioning}
            projectName={reportData._projectName}
          />
          <div className="border-t border-border/30" />
        </>
      )}

      {/* Direct Competitors — card layout */}
      <h3 className="font-sans text-lg font-semibold flex items-center gap-2">Direct Competitors</h3>
      {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
        <div className="space-y-4">
          {compData.direct_competitors.map((comp: any, i: number) => (
            <div key={i} className="bg-card/50 rounded-lg p-4 border border-border/50">
              {/* Threat bar */}
              <div className={`h-0.5 ${threatBarColor(comp.threat_level)} rounded-full mb-3`} />
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{comp.name}</h4>
                <div className="flex items-center gap-2">
                  {comp.estimated_size && (
                    <span className="text-xs text-muted-foreground font-mono">{comp.estimated_size}</span>
                  )}
                  {comp.threat_level && (
                    <Badge variant={threatColor(comp.threat_level)} className="text-[10px]">{comp.threat_level}</Badge>
                  )}
                </div>
              </div>
              {comp.what_they_do_well && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Strength:</span> {comp.what_they_do_well}
                </p>
              )}
              {comp.vulnerability && (
                <InsightCallout type="opportunity" title="Exploitable Vulnerability">
                  {comp.vulnerability}
                </InsightCallout>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic text-sm">Competitor analysis in progress...</p>
      )}

      {/* Indirect Competitors */}
      {compData.indirect_competitors && compData.indirect_competitors.length > 0 && (
        <>
          <div className="border-t border-border/30" />
          <h3 className="font-sans text-lg font-semibold flex items-center gap-2">Indirect Competitors</h3>
          <div className="space-y-2">
            {compData.indirect_competitors.map((comp: any, i: number) => {
              const c = typeof comp === 'string' ? { name: comp } : comp;
              return (
                <div key={i} className="py-2 border-b border-border/30 last:border-0">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  {c.why_customers_choose_them && <p className="text-xs text-muted-foreground mt-0.5"><span className="font-medium">Why chosen:</span> {c.why_customers_choose_them}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="border-t border-border/30" />

      {/* Competitive Advantages */}
      <div>
        <h3 className="font-sans text-lg font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Defensible Competitive Advantages
        </h3>
        {compData.competitive_advantages && compData.competitive_advantages.length > 0 ? (
          <div className="space-y-3">
            {compData.competitive_advantages.map((adv: any, i: number) => {
              const a = typeof adv === 'string' ? { advantage: adv } : adv;
              return (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{a.advantage}</p>
                    {a.why_defensible && <p className="text-xs text-muted-foreground mt-0.5">{a.why_defensible}</p>}
                    {a.duration && <p className="text-xs text-muted-foreground">{a.duration}</p>}
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
          <div className="border-t border-border/30" />
          <div>
            <h3 className="font-sans text-lg font-semibold mb-3 flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" />
              Positioning Strategy
            </h3>
            {typeof compData.positioning === 'string' ? (
              <p className="text-sm">{compData.positioning}</p>
            ) : (
              <div className="space-y-3">
                {compData.positioning.recommended_position && (
                  <p className="text-sm">{compData.positioning.recommended_position}</p>
                )}
                {compData.positioning.tagline_suggestion && (
                  <blockquote className="border-l-2 border-primary/30 pl-4 py-1">
                    <p className="font-serif text-lg italic text-primary">"{compData.positioning.tagline_suggestion}"</p>
                  </blockquote>
                )}
                {compData.positioning.positioning_against && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">vs. Top Competitor:</span> {compData.positioning.positioning_against}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Moat Strategy */}
      {compData.competitive_moat_strategy && (
        <>
          <div className="border-t border-border/30" />
          <InsightCallout type="action" title="Your Moat Strategy">
            {compData.competitive_moat_strategy}
          </InsightCallout>
        </>
      )}
    </ReportSectionCard>
  );
};
