import { CheckCircle2, TrendingUp, Users, Wrench, DollarSign, Sparkles, Target } from "lucide-react";

type Row = {
  label: string;
  icon: typeof TrendingUp;
  pct: number;
  note: string;
  tone: "success" | "warning" | "primary";
};

const rows: Row[] = [
  { label: "Market", icon: TrendingUp, pct: 82, note: "TAM $4.2B · growing 11% YoY", tone: "success" },
  { label: "Competition", icon: Users, pct: 58, note: "Crowded consumer app tier · clinic gap open", tone: "warning" },
  { label: "Feasibility", icon: Wrench, pct: 85, note: "MVP achievable in 6–8 weeks", tone: "success" },
  { label: "Financials", icon: DollarSign, pct: 72, note: "Break-even ~ month 9 at $42 ARPU", tone: "primary" },
];

const toneBar: Record<Row["tone"], string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  primary: "bg-sky-400",
};

export function DecisionCockpit() {
  return (
    <div className="relative w-full max-w-full">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.18),transparent_55%)] blur-2xl" />

      <div className="relative rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(2,6,23,0.9)] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-widest uppercase text-slate-300/80">
              Decision brief · Complete
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400/70 hidden sm:inline">
            validifier · illustrative preview
          </span>
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-sky-300/80">Idea</div>
            <h3 className="mt-1 text-base sm:text-lg font-medium text-white truncate">
              AI-Powered Pet Care
            </h3>
            <p className="mt-1 text-xs text-slate-400">Pet Services · 15-section validation</p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-4xl sm:text-5xl font-semibold tabular-nums text-emerald-300 leading-none">
              78
            </div>
            <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400">
              Viability
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="mx-4 sm:mx-6 mb-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-300 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-100 leading-snug">
            <span className="font-medium">Promising</span> — narrow the wedge before spending.
          </p>
        </div>

        {/* Evidence rows */}
        <div className="px-4 sm:px-6 pb-5 space-y-3">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div className="flex items-center gap-2 w-[110px]">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-200">{r.label}</span>
                </div>
                <div className="min-w-0">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${toneBar[r.tone]}`} style={{ width: `${r.pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10.5px] sm:text-[11px] text-slate-400 truncate">{r.note}</p>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-300 w-8 text-right">{r.pct}</span>
              </div>
            );
          })}
        </div>

        {/* Strategic + Next best action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 sm:px-6 pb-5">
          <div className="rounded-lg border border-sky-400/20 bg-sky-400/[0.05] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-sky-300">
              <Sparkles className="h-3 w-3" /> Strategic move
            </div>
            <p className="mt-1.5 text-xs sm:text-[13px] text-slate-100 leading-snug">
              Start with veterinary clinics, not consumers.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-300">
              <Target className="h-3 w-3" /> Next best action
            </div>
            <p className="mt-1.5 text-xs sm:text-[13px] text-slate-100 leading-snug">
              Interview 10 clinic managers this week.
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Illustrative report preview
          </span>
          <span className="text-[10px] font-mono text-slate-500">15 sections</span>
        </div>
      </div>
    </div>
  );
}

export default DecisionCockpit;