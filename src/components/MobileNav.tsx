import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  BarChart3,
  Home,
  FolderOpen,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileNavProps {
  user?: any;
  profile?: any;
}

export function MobileNav({ user, profile }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
    setOpen(false);
  };

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/dashboard" },
    { label: "My Projects", icon: FolderOpen, path: "/dashboard" },
    { label: "Pricing", icon: CreditCard, path: "/pricing" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const navigateTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Validifier
            </span>
          </SheetTitle>
        </SheetHeader>

        {user && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="font-medium truncate">
              {user?.user_metadata?.full_name || "Entrepreneur"}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            {profile && (
              <p className="text-xs text-muted-foreground mt-1">
                {profile.ai_credits_used}/{profile.ai_credits_monthly} credits used
              </p>
            )}
          </div>
        )}

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.path + item.label}
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => navigateTo(item.path)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
