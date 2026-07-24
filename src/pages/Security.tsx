import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, KeyRound, Database, CreditCard, Activity, AlertOctagon, FileWarning, Server } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Control = {
  icon: typeof Lock;
  title: string;
  body: string;
};

const CONTROLS: Control[] = [
  {
    icon: Lock,
    title: "TLS in transit",
    body:
      "All traffic to Validifier is served over HTTPS. Requests to our backend and to third-party APIs (Stripe, AI providers) are made over TLS.",
  },
  {
    icon: KeyRound,
    title: "Managed authentication",
    body:
      "Sign-in is handled by our managed auth provider with hashed credentials, session refresh, and password-reset flows. We never see or store your password in plain text.",
  },
  {
    icon: Database,
    title: "Row-level security on user data",
    body:
      "Projects, reports, chats, credits, and profiles enforce row-level security policies so authenticated users can only read and modify their own rows. Admin access is gated by a separate role table.",
  },
  {
    icon: CreditCard,
    title: "Server-only billing entitlements",
    body:
      "Subscription tier, credit balances, and Stripe metadata can only be written by our backend service role. The client can read its own tier and remaining credits but cannot elevate them.",
  },
  {
    icon: Server,
    title: "Verified, idempotent Stripe webhooks",
    body:
      "Stripe events are verified with the webhook signing secret and de-duplicated through a dedicated events table with a bounded retry lease, so a replayed or repeated delivery cannot double-apply a subscription or credit change.",
  },
  {
    icon: Activity,
    title: "Input, rate, and credit controls",
    body:
      "Report generation, chat, website analysis, and comparison endpoints validate input length, enforce per-user rate limits, and consume credits through atomic database functions so failures release the hold rather than silently deducting.",
  },
  {
    icon: FileWarning,
    title: "Privacy-aware operational logging",
    body:
      "We log operational events (failures, retries, admin actions) to help us keep the service healthy. Analytics event properties are sanitized and path segments containing UUIDs are normalized before storage. We do not log passwords, Stripe IDs, or raw AI prompts.",
  },
  {
    icon: AlertOctagon,
    title: "Responsible disclosure",
    body:
      "If you believe you've found a vulnerability, please email security@validifier.com with reproduction steps. Please do not test against other users' accounts or data. We do not currently run a paid bug bounty program.",
  },
];

const Security = () => {
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
          <h1 className="text-4xl font-bold mb-3">Security overview</h1>
          <p className="text-muted-foreground text-lg">
            This page is maintained by Validifier to answer common security and privacy questions about the
            product. It describes the controls we currently have in place. It is <strong>not a certification</strong>{" "}
            and does not claim SOC 2, ISO 27001, HIPAA, PCI, or GDPR-audited status. For legal terms see our{" "}
            <button onClick={() => navigate("/privacy")} className="text-primary underline underline-offset-4">Privacy Policy</button>{" "}
            and{" "}
            <button onClick={() => navigate("/terms")} className="text-primary underline underline-offset-4">Terms</button>.
          </p>
        </header>

        <section aria-label="Security controls" className="grid gap-4 sm:grid-cols-2">
          {CONTROLS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold text-foreground">Shared responsibility</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Validifier operates on top of managed hosting and third-party providers (Stripe for payments, AI
            model providers for report generation). Their platform-level controls sit underneath ours. You are
            responsible for protecting your account credentials, keeping your recovery email current, and being
            thoughtful about the sensitivity of ideas you submit for analysis.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Incident response</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We investigate security reports as they come in and use our operational event log to detect service
            failures. If we identify an incident that materially affects your data, we will contact affected
            account holders by email with a description of what happened, what data was affected, and what steps
            we took.
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Report a security issue:{" "}
            <a href="mailto:security@validifier.com" className="text-primary font-medium underline underline-offset-4">
              security@validifier.com
            </a>
          </p>
        </section>

        <p className="text-xs text-muted-foreground mt-10">
          This overview reflects the product as currently implemented and may change as the service evolves.
        </p>
      </main>
    </div>
  );
};

export default Security;