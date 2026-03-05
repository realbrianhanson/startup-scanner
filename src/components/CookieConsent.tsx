import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConsentState {
  essential: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "cookie-consent";

export const getConsent = (): ConsentState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const hasAnalyticsConsent = (): boolean => {
  const consent = getConsent();
  return consent?.analytics ?? false;
};

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = getConsent();
    if (!consent) setVisible(true);
  }, []);

  const saveConsent = (analyticsEnabled: boolean) => {
    const consent: ConsentState = {
      essential: true,
      analytics: analyticsEnabled,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] animate-fade-up">
      <div className="bg-card border-t border-border shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {!showPrefs ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  We use cookies to improve your experience. By continuing, you agree to our{" "}
                  <button
                    onClick={() => navigate("/privacy")}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrefs(true)}
                >
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                  Manage Preferences
                </Button>
                <Button size="sm" onClick={() => saveConsent(true)}>
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Cookie className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-medium">Cookie Preferences</p>
              </div>
              <div className="space-y-3 pl-8">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Essential Cookies</Label>
                    <p className="text-xs text-muted-foreground">Required for the app to function. Cannot be disabled.</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Analytics Cookies</Label>
                    <p className="text-xs text-muted-foreground">Help us understand how you use the app to improve it.</p>
                  </div>
                  <Switch checked={analytics} onCheckedChange={setAnalytics} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setShowPrefs(false)}>
                  Back
                </Button>
                <Button size="sm" onClick={() => saveConsent(analytics)}>
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
