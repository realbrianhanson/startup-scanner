import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ScoreFactor {
  name: string;
  score: number;
  weight: string;
}

interface ScoreBreakdownChartProps {
  factors: ScoreFactor[];
  overallScore: number;
}

const ABBREVIATED: Record<string, string> = {
  "Market Opportunity": "Market",
  "Competitive Edge": "Competition",
  "Customer Clarity": "Customer",
  "Financial Viability": "Financial",
  "Strategic Position": "Strategy",
  "AI Assessment": "AI Score",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{data.fullName}</p>
      <p className="text-muted-foreground">
        Score: <span className="font-mono font-semibold text-foreground">{data.score}</span>/100
      </p>
      <p className="text-muted-foreground text-xs">Weight: {data.weight}</p>
    </div>
  );
};

export const ScoreBreakdownChart = ({ factors, overallScore }: ScoreBreakdownChartProps) => {
  const chartData = factors.map((f) => ({
    subject: ABBREVIATED[f.name] || f.name,
    fullName: f.name,
    score: f.score,
    weight: f.weight,
    fullMark: 100,
  }));

  const fillColor =
    overallScore >= 70
      ? "hsl(142.1 76.2% 36.3%)"  // emerald-500
      : overallScore >= 40
      ? "hsl(37.7 92.1% 50.2%)"   // amber-500
      : "hsl(0 84.2% 60.2%)";     // red-500

  const strokeColor = fillColor;

  return (
    <div className="w-full max-w-[280px] mx-auto lg:mx-0">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
              fontFamily: "var(--font-sans, system-ui)",
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={strokeColor}
            fill={fillColor}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
