import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

interface ReportSectionCardProps {
  id?: string;
  icon?: ReactNode;
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
}: ReportSectionCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <ScrollReveal>
      <section id={id} className="scroll-mt-28 mb-16 md:mb-20">
        {/* Thin top border */}
        <div className="h-px bg-border mb-8" />

        {/* Header trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between group text-left mb-6"
        >
          <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Content */}
        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};
