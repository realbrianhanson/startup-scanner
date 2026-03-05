import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type AuthView = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "true";
  const refCode = searchParams.get("ref") || "";

  const [view, setView] = useState<AuthView>(isReset ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (refCode && !isReset) setView("signup");
  }, [refCode, isReset]);

  useEffect(() => { document.title = "Sign In | Validifier"; }, []);

  useEffect(() => {
    if (isReset) { setView("reset"); return; }
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { setView("reset"); return; }
      if (session && view !== "reset") navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate, isReset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        trackEvent('sign_in');
        toast.success("Welcome back!");
      } else if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, referral_code: refCode.trim().toUpperCase() },
          },
        });
        if (error) throw error;
        trackEvent('sign_up', { method: 'email', has_referral: !!refCode });
        toast.success("Account created! Welcome to Validifier.");
        if (data?.user) {
          supabase.functions.invoke("send-email", {
            body: { to: email, template: "welcome", template_data: { name: fullName || email } },
          }).catch(() => {});
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast.success("Check your email for a reset link");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords don't match."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <button onClick={() => navigate("/")} className="font-serif text-2xl tracking-tight text-foreground">
            Validifier
          </button>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">
            {view === "login" && "Sign in"}
            {view === "signup" && "Create account"}
            {view === "forgot" && "Reset password"}
            {view === "reset" && "Set new password"}
          </h1>
        </div>

        {/* Form */}
        {(view === "login" || view === "signup") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="h-11 bg-transparent border-border"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-transparent border-border"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="h-11 bg-transparent border-border"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : view === "login" ? "Sign In" : "Create Account"}
            </Button>

            {view === "login" && (
              <div className="text-center">
                <button type="button" onClick={() => setView("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView(view === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {view === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11 bg-transparent border-border"
            />
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </Button>
            <div className="text-center">
              <button type="button" onClick={() => setView("login")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={6} className="h-11 bg-transparent border-border" />
            <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} minLength={6} className="h-11 bg-transparent border-border" />
            <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
