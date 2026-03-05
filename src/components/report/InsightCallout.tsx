import { Lightbulb, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface InsightCalloutProps {
  type: 'insight' | 'warning' | 'opportunity' | 'action';
  title?: string;
  children: ReactNode;
}

const iconMap = {
  insight: <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  opportunity: <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  action: <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
};

export const InsightCallout = ({ type, title, children }: InsightCalloutProps) => (
  <div className={cn(
    "rounded-lg p-4 border-l-[3px] my-4",
    type === 'insight' && "bg-primary/[0.04] border-l-primary",
    type === 'warning' && "bg-amber-500/[0.04] border-l-amber-500",
    type === 'opportunity' && "bg-emerald-500/[0.04] border-l-emerald-500",
    type === 'action' && "bg-blue-500/[0.04] border-l-blue-500",
  )}>
    <div className="flex items-start gap-3">
      {iconMap[type]}
      <div>
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
      </div>
    </div>
  </div>
);
