import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BarChart3, ArrowLeft, Lock, CreditCard, Zap, Quote } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type AuthView = "login" | "signup" | "forgot" | "reset";

/* Floating input with animated label */
const FloatingInput = ({
  id, label, type = "text", value, onChange, required = false, disabled = false, minLength, placeholder,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; disabled?: boolean; minLength?: number; placeholder?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative group">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        minLength={minLength}
        className="peer w-full h-12 px-4 pt-4 pb-1 rounded-lg border border-border bg-background text-foreground text-sm outline-none transition-all duration-300 focus:border-transparent disabled:opacity-50"
        placeholder={isActive ? placeholder : " "}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-300 pointer-events-none ${
          isActive
            ? "top-1.5 text-[10px] font-medium text-primary"
            : "top-3.5 text-sm text-muted-foreground"
        }`}
      >
        {label}
      </label>
      {/* Gradient accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-500 ${
        focused
          ? "bg-gradient-to-r from-primary to-secondary opacity-100 scale-x-100"
          : "opacity-0 scale-x-0"
      }`} />
    </div>
  );
};

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
    document.title = "Sign In | Validifier";
  }, []);

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
        trackEvent('sign_in');
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
        trackEvent('sign_up', { method: 'email', has_promo: !!promoCode.trim() });
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

  const isSignupFields = view === "signup";

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Visual panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        {/* Floating gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-[250px] h-[250px] rounded-full bg-secondary/40 blur-[100px] animate-float float-slow will-change-transform" />
          <div className="absolute bottom-[15%] right-[5%] w-[200px] h-[200px] rounded-full bg-primary-foreground/15 blur-[80px] animate-float float-slower will-change-transform" style={{ animationDelay: "2s" }} />
          <div className="absolute top-[50%] left-[40%] w-[150px] h-[150px] rounded-full bg-primary-foreground/10 blur-[100px] animate-float float-slowest will-change-transform" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <BarChart3 className="h-8 w-8 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">Validifier</span>
          </div>

          {/* Testimonial */}
          <div className="space-y-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
            <Quote className="h-10 w-10 text-primary-foreground/30" />
            <blockquote className="text-2xl font-medium text-primary-foreground/90 leading-relaxed max-w-md">
              "Validifier saved us 3 months of market research. The AI analysis was spot-on and helped us pivot before wasting money."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-bold text-primary-foreground">
                SK
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Sarah K.</p>
                <p className="text-xs text-primary-foreground/60">Founder, FitTrack</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "500ms" }}>
            {[
              { value: "10K+", label: "Founders" },
              { value: "78", label: "Avg Score" },
              { value: "60s", label: "Reports" },
            ].map((stat, i) => (
              <div key={i} className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4 text-center border border-primary-foreground/10">
                <p className="text-2xl font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6 animate-scale-in">
          {/* Mobile-only back + logo */}
          <div className="lg:hidden text-center space-y-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Validifier</span>
            </div>
          </div>

          {/* Desktop back button */}
          <div className="hidden lg:block">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getHeading()}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{getSubheading()}</p>
          </div>

          {/* Form Card */}
          <Card className="p-7 border border-border shadow-medium">
            {(view === "login" || view === "signup") && (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Signup-only fields with slide transition */}
                  <div
                    className="grid transition-all duration-500 ease-in-out"
                    style={{ gridTemplateRows: isSignupFields ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-5 pb-1">
                        <FloatingInput
                          id="fullName"
                          label="Full Name"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={isSignupFields}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <FloatingInput
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />

                  <div>
                    <FloatingInput
                      id="password"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    {view === "signup" && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 pl-1">Must be at least 6 characters</p>
                    )}
                  </div>

                  {/* Promo code slide-in */}
                  <div
                    className="grid transition-all duration-500 ease-in-out"
                    style={{ gridTemplateRows: isSignupFields ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1 pb-1">
                        <FloatingInput
                          id="promoCode"
                          label="Promo Code (Optional)"
                          placeholder="LAUNCH2024"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          disabled={loading}
                        />
                        <p className="text-[11px] text-muted-foreground pl-1">Have a promo code? Enter it for bonus credits.</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-glow text-primary-foreground border-0 transition-all duration-300 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{view === "login" ? "Signing in..." : "Creating account..."}</>
                    ) : (
                      view === "login" ? "Sign In" : "Create Account"
                    )}
                  </Button>
                </form>

                {view === "login" && (
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => setView("forgot")} className="text-xs text-muted-foreground hover:text-primary transition-colors" disabled={loading}>
                      Forgot your password?
                    </button>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setView(view === "login" ? "signup" : "login")}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    disabled={loading}
                  >
                    {view === "login" ? (
                      <>Don't have an account? <span className="font-semibold text-primary">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="font-semibold text-primary">Sign in</span></>
                    )}
                  </button>
                </div>
              </>
            )}

            {view === "forgot" && (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <FloatingInput
                    id="resetEmail"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-glow text-primary-foreground border-0 transition-all duration-300 font-semibold"
                    disabled={loading}
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Reset Link"}
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
              <form onSubmit={handleResetPassword} className="space-y-5">
                <FloatingInput
                  id="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <FloatingInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-glow text-primary-foreground border-0 transition-all duration-300 font-semibold"
                  disabled={loading}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
                </Button>
              </form>
            )}
          </Card>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-5 flex-wrap">
            {[
              { icon: Lock, text: "Secure & encrypted" },
              { icon: CreditCard, text: "No credit card required" },
              { icon: Zap, text: "Free plan available" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                <item.icon className="h-3 w-3" />
                <span className="text-[11px]">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-primary transition-colors">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
