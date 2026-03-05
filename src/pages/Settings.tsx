import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  BarChart3, 
  User, 
  CreditCard, 
  Bell, 
  TrendingUp,
  ArrowLeft 
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    report_completion: true,
    credit_alerts: true,
    weekly_digest: false,
    product_updates: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData) return;

      setUser(userData);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setEmail(profileData.email);
        if (profileData.notification_preferences) {
          setNotifPrefs(profileData.notification_preferences as typeof notifPrefs);
        }
      }

      const { data: logs } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setUsageLogs(logs || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      loadData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleToggleNotif = async (key: keyof typeof notifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: updated } as any)
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Preferences saved");
    } catch {
      setNotifPrefs(notifPrefs); // revert
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const creditsUsedPercentage = profile
    ? (profile.ai_credits_used / profile.ai_credits_monthly) * 100 
    : 0;

  const getCreditsColor = () => {
    if (creditsUsedPercentage < 50) return "text-success";
    if (creditsUsedPercentage < 75) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MobileNav user={user} profile={profile} />
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hidden md:flex">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Settings</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="usage">
              <TrendingUp className="h-4 w-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Account Information</h3>
                <p className="text-muted-foreground">
                  Update your personal information
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email
                  </p>
                </div>

                <Button onClick={handleUpdateProfile}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Current Plan</h3>
                <p className="text-muted-foreground">
                  Manage your subscription and billing
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-xl font-semibold capitalize">
                      {profile?.subscription_tier}
                    </h4>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.ai_credits_monthly} AI credits per month
                  </p>
                </div>
                <Button onClick={() => navigate("/pricing")}>
                  {profile?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </Button>
              </div>

              {profile?.subscription_tier === 'free' && (
                <div className="p-4 bg-gradient-hero text-white rounded-lg">
                  <h4 className="font-semibold mb-2">Upgrade to unlock more</h4>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>• More AI credits</li>
                    <li>• Advanced frameworks</li>
                    <li>• Priority support</li>
                  </ul>
                  <Button variant="secondary" onClick={() => navigate("/pricing")}>
                    View Plans
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">AI Credits Usage</h3>
                <p className="text-muted-foreground">
                  Track your AI credit consumption
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Credits Used</span>
                    <span className={`text-2xl font-bold ${getCreditsColor()}`}>
                      {profile?.ai_credits_used} / {profile?.ai_credits_monthly}
                    </span>
                  </div>
                  <Progress value={creditsUsedPercentage} />
                  <p className="text-xs text-muted-foreground">
                    Resets on the 1st of each month
                  </p>
                </div>

                {creditsUsedPercentage > 75 && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-2">
                      You're running low on credits!
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade your plan to get more credits and continue validating ideas.
                    </p>
                    <Button size="sm" variant="destructive" onClick={() => navigate("/pricing")}>
                      Upgrade Now
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {usageLogs.length > 0 ? (
                    usageLogs.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center p-3 border rounded-lg text-sm"
                      >
                        <div>
                          <span className="font-medium capitalize">
                            {log.operation_type.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-muted-foreground">
                          -{log.tokens_used || 1} credits
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No usage history yet
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Notification Preferences</h3>
                <p className="text-muted-foreground">
                  Manage how you receive updates
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="report-completion" className="font-medium cursor-pointer">Report Completion</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when validation reports are ready
                    </p>
                  </div>
                  <Switch id="report-completion" checked={notifPrefs.report_completion} disabled={savingPrefs} onCheckedChange={(v) => handleToggleNotif("report_completion", v)} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="credit-alerts" className="font-medium cursor-pointer">Credit Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when you've used 75% of monthly credits
                    </p>
                  </div>
                  <Switch id="credit-alerts" checked={notifPrefs.credit_alerts} disabled={savingPrefs} onCheckedChange={(v) => handleToggleNotif("credit_alerts", v)} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="weekly-digest" className="font-medium cursor-pointer">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your validation activity
                    </p>
                  </div>
                  <Switch id="weekly-digest" checked={notifPrefs.weekly_digest} disabled={savingPrefs} onCheckedChange={(v) => handleToggleNotif("weekly_digest", v)} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="product-updates" className="font-medium cursor-pointer">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      News about new features and improvements
                    </p>
                  </div>
                  <Switch id="product-updates" checked={notifPrefs.product_updates} disabled={savingPrefs} onCheckedChange={(v) => handleToggleNotif("product_updates", v)} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
