import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        // Sign up
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

        toast({
          title: "Account created!",
          description: "Welcome to Validifier. Let's validate your first idea.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
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
            <h1 className="text-3xl font-bold">
              {isLogin ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? "Sign in to continue validating your ideas"
                : "Create your account to start validating"}
            </p>
          </div>
        </div>

        <Card className="p-8 border-2 shadow-large">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                <Input
                  id="promoCode"
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Use code "REAL" to get 100 bonus credits!
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <span className="font-semibold text-primary">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-semibold text-primary">Sign in</span>
                </>
              )}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
