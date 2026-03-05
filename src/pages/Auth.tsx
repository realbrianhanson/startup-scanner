import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BarChart3, ArrowLeft } from "lucide-react";

type AuthView = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "true";

  const [view, setView] = useState<AuthView>(isReset ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isReset) {
      setView("reset");
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
        return;
      }
      if (session && view !== "reset") {
        navigate("/dashboard");
      }
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
        toast.success("Welcome back!");
      } else if (view === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
              promo_code: promoCode.trim().toUpperCase(),
            },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome to Validifier.");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
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
      toast.success("Check your email for a password reset link");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match. Please make sure both passwords are the same.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! You can now sign in with your new password.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const getHeading = () => {
    switch (view) {
      case "login": return "Welcome Back";
      case "signup": return "Get Started";
      case "forgot": return "Reset Password";
      case "reset": return "Set New Password";
    }
  };

  const getSubheading = () => {
    switch (view) {
      case "login": return "Sign in to continue validating your ideas";
      case "signup": return "Create your account to start validating";
      case "forgot": return "Enter your email and we'll send you a reset link";
      case "reset": return "Choose a new password for your account";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{getHeading()}</h1>
            <p className="text-muted-foreground mt-2">{getSubheading()}</p>
          </div>
        </div>

        <Card className="p-8 border-2 shadow-large">
          {(view === "login" || view === "signup") && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {view === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={6} />
                  {view === "signup" && <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>}
                </div>
                {view === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                    <Input id="promoCode" type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={loading} />
                    <p className="text-xs text-muted-foreground">Use code "REAL" to get 100 bonus credits!</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{view === "login" ? "Signing in..." : "Creating account..."}</>) : view === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
              {view === "login" && (
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => setView("forgot")} className="text-sm text-muted-foreground hover:text-primary transition-colors" disabled={loading}>
                    Forgot your password?
                  </button>
                </div>
              )}
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setView(view === "login" ? "signup" : "login")} className="text-sm text-muted-foreground hover:text-primary transition-colors" disabled={loading}>
                  {view === "login" ? (<>Don't have an account? <span className="font-semibold text-primary">Sign up</span></>) : (<>Already have an account? <span className="font-semibold text-primary">Sign in</span></>)}
                </button>
              </div>
            </>
          )}

          {view === "forgot" && (
            <>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input id="resetEmail" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>) : "Send Reset Link"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setView("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Back to <span className="font-semibold text-primary">Sign in</span>
                </button>
              </div>
            </>
          )}

          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} minLength={6} />
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>) : "Update Password"}
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-primary transition-colors">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
