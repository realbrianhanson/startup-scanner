import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles, Gauge } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { PRODUCT_FACTS } from "@/lib/productFacts";

type AuthView = "login" | "signup" | "forgot" | "reset";

const ALLOWED_NEXT = new Set([
  "/pricing",
  "/dashboard",
  "/projects/new",
  "/settings",
  "/admin",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DYNAMIC_NEXT_RE = /^\/projects\/([^/]+)\/(chat|report)$/;
const MIN_PASSWORD = 8;

function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  const [pathOnly, queryOnly] = raw.split("#")[0].split("?");
  if (ALLOWED_NEXT.has(pathOnly)) {
    return queryOnly ? `${pathOnly}?${queryOnly}` : pathOnly;
  }
  const m = pathOnly.match(DYNAMIC_NEXT_RE);
  if (m && UUID_RE.test(m[1])) {
    return queryOnly ? `${pathOnly}?${queryOnly}` : pathOnly;
  }
  return fallback;
}

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "true";
  const refCode = searchParams.get("ref") || "";
  const mode = searchParams.get("mode");
  const rawNext = searchParams.get("next");

  const [view, setView] = useState<AuthView>(
    isReset ? "reset" : mode === "signup" ? "signup" : "login"
  );

  // Resolve destination per view; signup defaults to /projects/new, login to /dashboard.
  const nextDest = safeNext(rawNext, view === "signup" ? "/projects/new" : "/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  // Verification-required state (after signup with email confirmation)
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if ((refCode || mode === "signup") && !isReset) setView("signup");
  }, [refCode, isReset, mode]);

  useEffect(() => {
    if (isReset) { setView("reset"); return; }
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate(nextDest);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { setView("reset"); return; }
      // Never navigate away from the reset flow or the verification-required success state.
      if (session && view !== "reset" && !awaitingVerification) navigate(nextDest);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isReset, nextDest, awaitingVerification]);

  const startResendCooldown = (seconds = 30) => {
    setResendCooldown(seconds);
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
    cooldownTimer.current = window.setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current);
  }, []);

  const mapError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already")) {
      return "An account with this email already exists. Sign in or reset your password.";
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (view === "signup" && password.length < MIN_PASSWORD) {
      setStatusMsg({ kind: "error", text: `Password must be at least ${MIN_PASSWORD} characters.` });
      return;
    }
    setLoading(true);
    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackEvent("sign_in");
        toast.success("Welcome back!");
      } else if (view === "signup") {
        const emailRedirectTo = `${window.location.origin}${nextDest}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: { referral_code: refCode.trim().toUpperCase() },
          },
        });
        if (error) throw error;

        if (data.session) {
          // Auto-confirmed. Safe to send welcome email while authenticated.
          trackEvent("auth_signup_complete", { method: "email", has_referral: !!refCode });
          supabase.functions.invoke("send-email", {
            body: { to: email, template: "welcome", template_data: { name: email } },
          }).catch(() => {});
          toast.success("Account created! Welcome to Validifier.");
          navigate(nextDest);
        } else {
          // Email confirmation required — do NOT claim they are logged in.
          trackEvent("auth_verification_required", { method: "email", has_referral: !!refCode });
          setPendingEmail(email);
          setAwaitingVerification(true);
          startResendCooldown(30);
        }
      }
    } catch (error: any) {
      const text = mapError(error?.message || "Something went wrong.");
      setStatusMsg({ kind: "error", text });
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      setStatusMsg({ kind: "success", text: "Check your email for a reset link." });
      toast.success("Check your email for a reset link");
    } catch (error: any) {
      const text = error?.message || "Failed to send reset email.";
      setStatusMsg({ kind: "error", text });
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (password !== confirmPassword) {
      setStatusMsg({ kind: "error", text: "Passwords don't match." });
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setStatusMsg({ kind: "error", text: `Password must be at least ${MIN_PASSWORD} characters.` });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated!");
      navigate("/dashboard");
    } catch (error: any) {
      const text = error?.message || "Failed to update password.";
      setStatusMsg({ kind: "error", text });
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !pendingEmail) return;
    setLoading(true);
    try {
      const emailRedirectTo = `${window.location.origin}${nextDest}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo },
      });
      if (error) throw error;
      toast.success("Verification email sent.");
      startResendCooldown(30);
    } catch (error: any) {
      toast.error(error?.message || "Could not resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const isAuthForm = view === "login" || view === "signup";

  const headline =
    view === "signup" ? "Create your free account"
    : view === "login" ? "Welcome back"
    : view === "forgot" ? "Reset your password"
    : "Set a new password";

  const subheadline =
    view === "signup" ? `Your complete ${PRODUCT_FACTS.reportSectionCount}-section validation report is included. No credit card.`
    : view === "login" ? "Continue pressure-testing your business ideas."
    : view === "forgot" ? "Enter your email and we'll send you a reset link."
    : "Choose a new password to finish signing in.";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Form side (mobile first) */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10 order-1 lg:order-2">
          <div className="w-full max-w-md space-y-8">
            <div>
              <button
                onClick={() => navigate("/")}
                className="font-serif text-2xl tracking-tight text-foreground"
              >
                Validifier
              </button>
            </div>

            {awaitingVerification ? (
              <div className="space-y-6" aria-live="polite">
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl tracking-tight">Check your inbox</h1>
                  <p className="text-sm text-muted-foreground">
                    We sent a verification link to{" "}
                    <span className="font-medium text-foreground">{pendingEmail}</span>.
                    Verify your email before continuing.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Didn't get the email? Check spam, or resend it below.
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                    className="w-full h-11"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : resendCooldown > 0 ? (
                      `Resend verification email (${resendCooldown}s)`
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingVerification(false);
                      setView("login");
                      setPassword("");
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl tracking-tight">{headline}</h1>
                  <p className="text-sm text-muted-foreground">{subheadline}</p>
                </div>

                <div
                  aria-live="polite"
                  className={statusMsg ? (statusMsg.kind === "error" ? "text-sm text-destructive" : "text-sm text-foreground") : "sr-only"}
                >
                  {statusMsg?.text ?? ""}
                </div>

                {isAuthForm && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                        className="h-11 bg-transparent border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {view === "login" && (
                          <button
                            type="button"
                            onClick={() => { setStatusMsg(null); setView("forgot"); }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={view === "signup" ? "At least 8 characters" : "Your password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          minLength={view === "signup" ? MIN_PASSWORD : undefined}
                          autoComplete={view === "signup" ? "new-password" : "current-password"}
                          className="h-11 bg-transparent border-border pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {view === "signup" && (
                        <p className="text-xs text-muted-foreground">
                          Must be at least {MIN_PASSWORD} characters.
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-lg font-medium"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : view === "login" ? (
                        "Sign in"
                      ) : (
                        "Create free account"
                      )}
                    </Button>

                    {view === "signup" && (
                      <p className="text-center text-xs text-muted-foreground">
                        One full report · No credit card · Your idea stays yours.
                      </p>
                    )}

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusMsg(null);
                          setView(view === "login" ? "signup" : "login");
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {view === "login"
                          ? "Don't have an account? Sign up"
                          : "Already have an account? Sign in"}
                      </button>
                    </div>
                  </form>
                )}

                {view === "forgot" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                        className="h-11 bg-transparent border-border"
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg font-medium">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setStatusMsg(null); setView("login"); }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Back to sign in
                      </button>
                    </div>
                  </form>
                )}

                {view === "reset" && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          minLength={MIN_PASSWORD}
                          autoComplete="new-password"
                          className="h-11 bg-transparent border-border pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be at least {MIN_PASSWORD} characters.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                          minLength={MIN_PASSWORD}
                          autoComplete="new-password"
                          className="h-11 bg-transparent border-border pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 rounded-lg font-medium">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                    </Button>
                  </form>
                )}
              </>
            )}

            <p className="text-center text-[11px] text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a>
              {" "}and{" "}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Proof panel (desktop only) */}
        <aside className="hidden lg:flex order-2 lg:order-1 bg-neutral-950 text-neutral-100 p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="font-serif text-2xl tracking-tight">Validifier</div>
            <p className="mt-2 text-xs uppercase tracking-widest text-neutral-400">Decision intelligence</p>
          </div>

          <div className="relative space-y-10 max-w-md">
            <div>
              <h2 className="font-serif text-3xl xl:text-4xl leading-tight">
                Turn a business idea into a go / no-go decision.
              </h2>
              <p className="mt-4 text-sm text-neutral-400">
                A complete {PRODUCT_FACTS.reportSectionCount}-section validation brief, {PRODUCT_FACTS.reportTimeCopy}.
              </p>
            </div>

            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <Gauge className="h-5 w-5 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <div className="font-medium text-neutral-100">Scored on evidence, not vibes</div>
                  <div className="text-neutral-400">Market, competition, unit economics, and risk — quantified.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Sparkles className="h-5 w-5 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <div className="font-medium text-neutral-100">Built to act on</div>
                  <div className="text-neutral-400">GTM plan, first ICPs, and a clear next step per section.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="h-5 w-5 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <div className="font-medium text-neutral-100">Your idea stays yours</div>
                  <div className="text-neutral-400">Private by default. Share only when you choose.</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-neutral-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Free plan includes a full report · No credit card
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Auth;
