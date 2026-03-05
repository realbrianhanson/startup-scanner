import { CheckCircle2, ShieldCheck, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeString, getCompetitiveLandscape } from "@/lib/reportHelpers";
import { ReportSectionCard } from "./ReportSectionCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <ReportSectionCard id="competitive-landscape" title="Competitive Landscape">
      {/* Direct Competitors — proper table */}
      <h3 className="font-sans text-lg font-semibold">Direct Competitors</h3>
      {compData.direct_competitors && compData.direct_competitors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Name</TableHead>
              <TableHead className="text-xs h-8">Size</TableHead>
              <TableHead className="text-xs h-8">Strength</TableHead>
              <TableHead className="text-xs h-8">Vulnerability</TableHead>
              <TableHead className="text-xs h-8 text-right">Threat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compData.direct_competitors.map((comp: any, i: number) => (
              <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <TableCell className="py-3 font-medium">{comp.name}</TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{comp.estimated_size || "—"}</TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{comp.what_they_do_well || "—"}</TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{comp.vulnerability || "—"}</TableCell>
                <TableCell className="py-3 text-right">
                  {comp.threat_level && (
                    <Badge variant={threatColor(comp.threat_level)} className="text-[10px]">{comp.threat_level}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground italic text-sm">Competitor analysis in progress...</p>
      )}

      {/* Indirect Competitors */}
      {compData.indirect_competitors && compData.indirect_competitors.length > 0 && (
        <>
          <div className="border-t border-border/50" />
          <h3 className="font-sans text-lg font-semibold">Indirect Competitors</h3>
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

      <div className="border-t border-border/50" />

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
          <div className="border-t border-border/50" />
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
          <div className="border-t border-border/50" />
          <div>
            <h4 className="font-sans text-sm font-semibold text-primary mb-2">Competitive Moat Strategy</h4>
            <p className="text-sm">{compData.competitive_moat_strategy}</p>
          </div>
        </>
      )}
    </ReportSectionCard>
  );
};
