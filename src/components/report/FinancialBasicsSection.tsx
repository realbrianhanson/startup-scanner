import { TrendingUp, Landmark, ArrowUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { InsightCallout } from "./InsightCallout";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Line, ComposedChart } from "recharts";
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

const parseNumericValue = (val: any): number | null => {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return null;
  const cleaned = val.replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const isNegative = (val: any): boolean => {
  const num = parseNumericValue(val);
  return num !== null && num < 0;
};

const formatCompact = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
};

const ScenarioCard = ({ label, data, highlight }: { label: string; data: any; highlight?: boolean }) => {
  const isStructured = typeof data === "object" && data?.total;
  const total = isStructured ? data.total : data;
  const breakdown = isStructured ? data.breakdown || [] : [];

  return (
    <div className={`py-4 ${highlight ? "border-l-2 border-l-primary pl-4 bg-primary/[0.03] rounded-r-lg pr-4" : ""}`}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-mono text-lg font-semibold">{total}</p>
      </div>
      {breakdown.length > 0 && (
        <div className="space-y-1">
          {breakdown.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.item}</span>
              <span className="font-mono">{item.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Revenue Projection Chart ── */
const RevenueProjectionChart = ({ projections }: { projections: any }) => {
  const data = [
    {
      name: "Year 1",
      revenue: parseNumericValue(projections.year1?.revenue) || 0,
      net: parseNumericValue(projections.year1?.net),
      label: projections.year1?.revenue || "",
    },
    {
      name: "Year 2",
      revenue: parseNumericValue(projections.year2?.revenue) || 0,
      net: parseNumericValue(projections.year2?.net),
      label: projections.year2?.revenue || "",
    },
    {
      name: "Year 3",
      revenue: parseNumericValue(projections.year3?.revenue) || 0,
      net: parseNumericValue(projections.year3?.net),
      label: projections.year3?.revenue || "",
    },
  ];

  const hasRevenue = data.some((d) => d.revenue > 0);
  if (!hasRevenue) return null;

  const hasNet = data.some((d) => d.net !== null);

  const CustomLabel = (props: any) => {
    const { x, y, width, index } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        className="fill-foreground text-xs font-mono font-medium"
      >
        {data[index]?.label}
      </text>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 4 }}>
          <XAxis
            dataKey="name"
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis hide />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
          >
            <LabelList content={<CustomLabel />} />
          </Bar>
          {hasNet && (
            <Line
              type="monotone"
              dataKey="net"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ fill: "hsl(var(--muted-foreground))", r: 3 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {hasNet && (
        <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-muted-foreground inline-block" /> Net Income
          </span>
        </div>
      )}
    </div>
  );
};

/* ── Unit Economics Visual ── */
const UnitEconomicsVisual = ({ unitEcon }: { unitEcon: any }) => {
  const cac = parseNumericValue(unitEcon.estimated_cac);
  const ltv = parseNumericValue(unitEcon.estimated_ltv);
  const ratio = parseNumericValue(unitEcon.ltv_to_cac_ratio);

  if (cac === null || ltv === null || (cac === 0 && ltv === 0)) return null;

  const maxVal = Math.max(cac, ltv, 1);
  const cacWidth = Math.max((cac / maxVal) * 100, 8);
  const ltvWidth = Math.max((ltv / maxVal) * 100, 8);
  const isHealthy = ratio !== null && ratio >= 3;
  const isDangerous = ratio !== null && ratio < 1;

  return (
    <div className="space-y-4 py-2">
      {/* Visual bars */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground uppercase tracking-wider">CAC</span>
            <span className="font-mono font-semibold">{unitEcon.estimated_cac}</span>
          </div>
          <div className="h-5 bg-muted rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all duration-700 ${isDangerous ? "bg-red-500" : "bg-amber-500"}`}
              style={{ width: `${cacWidth}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground uppercase tracking-wider">LTV</span>
            <span className="font-mono font-semibold">{unitEcon.estimated_ltv}</span>
          </div>
          <div className="h-5 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-sm transition-all duration-700"
              style={{ width: `${ltvWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ratio display */}
      {ratio !== null && (
        <div className="flex items-center gap-3 pt-1">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LTV:CAC Ratio</p>
            <p className={`font-mono text-2xl font-bold ${isHealthy ? "text-emerald-500" : "text-amber-500"}`}>
              {unitEcon.ltv_to_cac_ratio}
            </p>
          </div>
          {isHealthy ? (
            <div className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Healthy</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Below 3:1 target</span>
            </div>
          )}
        </div>
      )}

      {/* Payback period */}
      {unitEcon.payback_period && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M2 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">Payback</span>
          </div>
          <span className="font-mono text-sm font-semibold">{unitEcon.payback_period}</span>
        </div>
      )}
    </div>
  );
};


export const FinancialBasicsSection = ({ reportData }: Props) => {
  if (!reportData.financial_basics) return null;
  const fin = reportData.financial_basics;

  const projections = fin.projections;
  const isStructuredProjections = typeof projections?.year1 === "object";

  const revenueModel = fin.revenue_model;
  const isStructuredRevenue = typeof revenueModel === "object" && revenueModel?.primary_model;
  const unitEcon = fin.unit_economics;

  return (
    <ReportSectionCard title="Financial Basics">
      {/* Startup Cost Scenarios */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Startup Cost Scenarios</h3>
        <div className="grid md:grid-cols-3 gap-0 divide-x divide-border/50">
          <ScenarioCard label="Conservative" data={fin.startup_costs?.conservative} />
          <ScenarioCard label="Moderate" data={fin.startup_costs?.moderate} highlight />
          <ScenarioCard label="Aggressive" data={fin.startup_costs?.aggressive} />
        </div>
      </div>

      <div className="border-t border-border/30" />

      {/* Revenue Model */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Revenue Model</h3>
        {isStructuredRevenue ? (
          <div className="space-y-4">
            <p className="text-sm"><span className="font-medium">Model:</span> {revenueModel.primary_model}</p>
            {revenueModel.pricing_recommendation && (
              <p className="text-sm text-muted-foreground">{revenueModel.pricing_recommendation}</p>
            )}
            {revenueModel.revenue_streams?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Stream</TableHead>
                    <TableHead className="text-xs h-8 text-center">Share</TableHead>
                    <TableHead className="text-xs h-8">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueModel.revenue_streams.map((s: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="py-2 text-sm font-medium">{s.stream}</TableCell>
                      <TableCell className="py-2 text-sm text-center font-mono">{s.percentage}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{s.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line">{typeof revenueModel === "string" ? revenueModel : JSON.stringify(revenueModel)}</p>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* Unit Economics */}
      {unitEcon && (
        <>
          <div>
            <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">Unit Economics</h3>

            {/* Visual CAC vs LTV comparison */}
            <UnitEconomicsVisual unitEcon={unitEcon} />

            {/* Fallback metrics for when visual can't render */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 mt-4">
              {[
                { label: "Revenue / Customer", value: unitEcon.average_revenue_per_customer },
              ].map((m) => m.value && (
                <div key={m.label}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="font-mono text-lg font-semibold">{m.value}</p>
                </div>
              ))}
            </div>

            {unitEcon.cac_breakdown?.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Channel</TableHead>
                    <TableHead className="text-xs h-8 text-right">Cost / Acquisition</TableHead>
                    <TableHead className="text-xs h-8 text-right">Expected Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitEcon.cac_breakdown.map((ch: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="py-2 text-sm font-medium">{ch.channel}</TableCell>
                      <TableCell className="py-2 text-sm text-right font-mono">{ch.cost_per_acquisition}</TableCell>
                      <TableCell className="py-2 text-sm text-right">{ch.expected_volume}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {unitEcon.viability_assessment && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Viability Assessment</p>
                <p className="text-sm">{unitEcon.viability_assessment}</p>
              </div>
            )}
          </div>
          <div className="border-t border-border/30" />
        </>
      )}

      {/* 3-Year Projections */}
      <div>
        <h3 className="font-sans text-lg font-semibold flex items-center gap-2 mb-3">3-Year Projections</h3>

        {/* Revenue bar chart */}
        {isStructuredProjections && (
          <RevenueProjectionChart projections={projections} />
        )}

        {/* Detailed breakdown */}
        {isStructuredProjections ? (
          <div className="grid md:grid-cols-3 gap-0 divide-x divide-border/50 mt-4">
            {[
              { label: "Year 1", data: projections.year1, prev: null },
              { label: "Year 2", data: projections.year2, prev: projections.year1 },
              { label: "Year 3", data: projections.year3, prev: projections.year2 },
            ].map((yr) => {
              const prevRevenue = parseNumericValue(yr.prev?.revenue);
              const currRevenue = parseNumericValue(yr.data?.revenue);
              const showGrowth = prevRevenue !== null && currRevenue !== null && currRevenue > prevRevenue;
              const netNegative = isNegative(yr.data?.net);

              return (
                <div key={yr.label} className="py-3 px-4 first:pl-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{yr.label}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-mono font-semibold text-primary flex items-center gap-1">
                        {yr.data?.revenue}
                        {showGrowth && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customers</span>
                      <span className="font-mono">{yr.data?.customers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-mono">{yr.data?.expenses}</span>
                    </div>
                    <div className="border-t border-border/30 pt-2 flex justify-between text-sm">
                      <span className="font-medium">Net</span>
                      <span className={`font-mono font-semibold ${netNegative ? "text-red-500" : ""}`}>{yr.data?.net}</span>
                    </div>
                  </div>
                  {yr.data?.assumptions && (
                    <p className="text-[11px] text-muted-foreground italic mt-3">{yr.data.assumptions}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {["year1", "year2", "year3"].map((key, i) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Year {i + 1}</p>
                <p className="font-mono text-lg font-semibold">{projections?.[key] || "TBD"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/30" />

      {/* Funding & Break-Even */}
      <div className="grid md:grid-cols-2 gap-6">
        {fin.funding_recommendation && (
          <InsightCallout type="action" title="Funding Recommendation">
            {fin.funding_recommendation}
          </InsightCallout>
        )}
        {fin.break_even_estimate && (
          <InsightCallout type="insight" title="Path to Break-Even">
            {fin.break_even_estimate}
          </InsightCallout>
        )}
      </div>
    </ReportSectionCard>
  );
};
