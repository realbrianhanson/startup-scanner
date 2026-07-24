import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, ShieldAlert, Scale, LifeBuoy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Channel = {
  icon: typeof Mail;
  label: string;
  email: string;
  purpose: string;
  response: string;
};

const CHANNELS: Channel[] = [
  {
    icon: LifeBuoy,
    label: "Product & billing support",
    email: "support@validifier.com",
    purpose:
      "Account access, report generation issues, subscription and invoice questions, feature feedback.",
    response: "We aim to reply within 2 business days.",
  },
  {
    icon: Mail,
    label: "Privacy & data requests",
    email: "privacy@validifier.com",
    purpose:
      "Data access, export, correction, or deletion requests, and questions about how your data is handled.",
    response: "We aim to acknowledge within 5 business days and complete within 30 days.",
  },
  {
    icon: Scale,
    label: "Legal & terms",
    email: "legal@validifier.com",
    purpose:
      "Questions about the Terms of Service, DMCA notices, or other legal correspondence.",
    response: "We aim to reply within 5 business days.",
  },
  {
    icon: ShieldAlert,
    label: "Security & responsible disclosure",
    email: "security@validifier.com",
    purpose:
      "Vulnerability reports and security concerns. Please include reproduction steps and affected URLs.",
    response:
      "We aim to acknowledge within 3 business days. Please do not test against other users' data.",
  },
];

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span
            className="text-2xl font-serif cursor-pointer tracking-tight text-foreground"
            onClick={() => navigate("/")}
          >
            Validifier
          </span>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Button>
            <Button variant="outline" onClick={() => navigate("/pricing")}>
              Pricing
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Contact Validifier</h1>
          <p className="text-muted-foreground text-lg">
            Reach the right team by email. We do not run a phone line and don't collect contact
            information through this page — a direct email keeps a record for both of us.
          </p>
        </header>

        <section aria-label="Contact channels" className="space-y-4">
          {CHANNELS.map(({ icon: Icon, label, email, purpose, response }) => (
            <article
              key={email}
              className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row gap-4"
            >
              <div className="shrink-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground">{label}</h2>
                <p className="text-sm text-muted-foreground mt-1">{purpose}</p>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <a
                    href={`mailto:${email}`}
                    className="text-primary font-medium underline underline-offset-4 break-all"
                  >
                    {email}
                  </a>
                  <span className="text-xs text-muted-foreground">{response}</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Account locked out or urgent security issue?</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Email <a href="mailto:security@validifier.com" className="text-primary underline underline-offset-4">security@validifier.com</a>{" "}
            with the subject line prefixed <code className="rounded bg-muted px-1 py-0.5 text-xs">[URGENT]</code>. Include
            the affected email address and a clear description. For lost access, do not share your password — we will
            never ask for it.
          </p>
        </section>

        <p className="text-xs text-muted-foreground mt-10">
          Response times are targets, not guarantees, and may be longer on weekends or public holidays.
        </p>
      </main>
    </div>
  );
};

export default Contact;