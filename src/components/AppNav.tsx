import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, LogOut, X, Menu, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppNavProps {
  user?: any;
  profile?: any;
  showNewReport?: boolean;
}

export function AppNav({ user, profile, showNewReport = true }: AppNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    ...(showNewReport ? [{ label: "New Report", path: "/projects/new" }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="font-serif text-lg tracking-tight text-foreground hover:opacity-80 transition-opacity"
            >
              Validifier
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`text-sm transition-colors ${
                    location.pathname === link.path
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/settings")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[11px] font-medium text-primary">{initials}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <span className="font-serif text-lg">Validifier</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileOpen(false); }}
                className={`text-2xl font-medium transition-colors ${
                  location.pathname === link.path ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => { navigate("/settings"); setMobileOpen(false); }}
              className="text-2xl font-medium text-muted-foreground"
            >
              Settings
            </button>
            <div className="pt-4 border-t border-border w-32 flex justify-center">
              <ThemeToggle />
            </div>
            <button
              onClick={() => { handleSignOut(); setMobileOpen(false); }}
              className="text-lg text-destructive"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
