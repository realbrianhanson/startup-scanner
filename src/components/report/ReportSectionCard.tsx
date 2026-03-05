import { useState, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface ReportSectionCardProps {
  id?: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  accentFrom?: string;
  accentTo?: string;
}

export const ReportSectionCard = ({
  id,
  icon,
  title,
  children,
  defaultOpen = false,
  accentFrom = "hsl(var(--primary))",
  accentTo = "hsl(var(--secondary))",
}: ReportSectionCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card
      id={id}
      className="relative overflow-hidden border hover:border-primary/20 transition-all duration-300 scroll-mt-28"
    >
      {/* Left gradient accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: `linear-gradient(to bottom, ${accentFrom}, ${accentTo})` }}
      />

      {/* Header trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 pl-7 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/[0.08] border border-primary/10">
            {icon}
          </div>
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Animated content */}
      <div
        className="grid transition-all duration-500 ease-in-out"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="p-6 pl-7 pt-0 space-y-6">{children}</div>
        </div>
      </div>
    </Card>
  );
};
