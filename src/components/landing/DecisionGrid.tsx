import { Gauge, Users, Swords, LineChart, ListChecks } from "lucide-react";

type Card = {
  q: string;
  a: string;
  icon: typeof Gauge;
  visual: React.ReactNode;
  span?: string;
};

const ScoreVisual = () => (
  <div className="flex items-end gap-3">
    <div className="font-mono text-4xl font-semibold text-emerald-300 leading-none">78</div>
    <div className="flex-1 space-y-1.5">
      {[82, 58, 85, 72].map((p, i) => (
        <div key={i} className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-sky-400/70" style={{ width: `${p}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const PersonaVisual = () => (
  <div className="flex gap-2">
    {["Clinic Ops", "Solo Vet", "Owner"].map((p) => (
      <div key={p} className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
        <div className="mx-auto h-6 w-6 rounded-full bg-sky-400/20 border border-sky-400/30" />
        <p className="mt-1 text-[10px] text-slate-300 truncate">{p}</p>
      </div>
    ))}
  </div>
);

const CompetitorVisual = () => (
  <div className="space-y-1.5">
    {[
      { n: "Chewy Health", w: "Consumer app" },
      { n: "Vetster", w: "Telehealth" },
      { n: "Rover", w: "Sitting only" },
    ].map((c) => (
      <div key={c.n} className="flex items-center justify-between text-[11px] rounded border border-white/10 bg-white/[0.03] px-2 py-1.5">
        <span className="text-slate-100">{c.n}</span>
        <span className="font-mono text-slate-400">{c.w}</span>
      </div>
    ))}
  </div>
);

const FinancialsVisual = () => (
  <div className="grid grid-cols-3 gap-2 text-center">
    {[
      { l: "CAC", v: "$38" },
      { l: "ARPU", v: "$42" },
      { l: "Break-even", v: "M9" },
    ].map((m) => (
      <div key={m.l} className="rounded-md border border-white/10 bg-white/[0.03] py-2">
        <div className="font-mono text-sm text-white">{m.v}</div>
        <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">{m.l}</div>
      </div>
    ))}
  </div>
);

const ActionVisual = () => (
  <ol className="space-y-1.5">
    {[
      "Wk 1 · 10 clinic interviews",
      "Wk 2 · Design clinic dashboard",
      "Wk 3 · Pilot with 2 clinics",
      "Wk 4 · Price + retention test",
    ].map((s, i) => (
      <li key={s} className="flex items-center gap-2 text-[11px] text-slate-200">
        <span className="font-mono text-[10px] text-sky-300 w-6">{String(i + 1).padStart(2, "0")}</span>
        <span>{s}</span>
      </li>
    ))}
  </ol>
);

const cards: Card[] = [
  {
    q: "Should I build this?",
    a: "A weighted viability score from 6 factors — market, competition, feasibility, financials, timing, and moat.",
    icon: Gauge,
    visual: <ScoreVisual />,
    span: "sm:col-span-2",
  },
  {
    q: "Who wants it?",
    a: "TAM/SAM/SOM sizing plus 3 buyer personas with pains, objections, and how to sell to each.",
    icon: Users,
    visual: <PersonaVisual />,
  },
  {
    q: "Who am I up against?",
    a: "Named competitors with strengths, weaknesses, and the specific gap you can attack.",
    icon: Swords,
    visual: <CompetitorVisual />,
  },
  {
    q: "Will the numbers work?",
    a: "Startup cost, unit economics, revenue projections, and break-even estimate — not hand-waving.",
    icon: LineChart,
    visual: <FinancialsVisual />,
  },
  {
    q: "What do I do next?",
    a: "A week-by-week 30-day action plan with specific tasks, not generic advice.",
    icon: ListChecks,
    visual: <ActionVisual />,
    span: "sm:col-span-2",
  },
];

export function DecisionGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <article
            key={c.q}
            className={`rounded-xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur ${c.span ?? ""}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-sky-300/80">
              <Icon className="h-3.5 w-3.5" />
              Question
            </div>
            <h3 className="mt-2 text-base sm:text-lg font-medium text-white">{c.q}</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{c.a}</p>
            <div className="mt-4 pt-4 border-t border-white/5">{c.visual}</div>
          </article>
        );
      })}
    </div>
  );
}

export default DecisionGrid;