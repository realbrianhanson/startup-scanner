import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Loader2, ExternalLink, Copy, Users } from "lucide-react";
import { AppNav } from "@/components/AppNav";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    report_completion: true,
    credit_alerts: true,
    weekly_digest: false,
    product_updates: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { document.title = "Settings | Validifier"; }, []);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData) return;
      setUser(userData);

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userData.id).single();
      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setEmail(profileData.email);
        if (profileData.notification_preferences) setNotifPrefs(profileData.notification_preferences as typeof notifPrefs);
      }

      const { data: logs } = await supabase.from("ai_usage_logs").select("*").eq("user_id", userData.id).order("created_at", { ascending: false }).limit(50);
      setUsageLogs(logs || []);

      const { count } = await supabase.from("referrals" as any).select("id", { count: "exact", head: true }).eq("referrer_id", userData.id);
      setReferralCount(count || 0);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      loadData();
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleToggleNotif = async (key: keyof typeof notifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setSavingPrefs(true);
    try {
      const { error } = await supabase.from("profiles").update({ notification_preferences: updated } as any).eq("id", user.id);
      if (error) throw error;
      toast.success("Preferences saved");
    } catch {
      setNotifPrefs(notifPrefs);
      toast.error("Failed to save");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Account deleted.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  };

  const creditsUsedPct = profile ? (profile.ai_credits_used / profile.ai_credits_monthly) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-card border-b border-border h-14" />
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav user={user} profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-serif text-3xl tracking-tight mb-8">Settings</h1>

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="subscription">Plan</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Account */}
          <TabsContent value="account" className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 bg-transparent border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <Input value={email} disabled className="h-11 bg-muted border-border" />
                </div>
                <Button onClick={handleUpdateProfile} size="sm">Save</Button>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Referral */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Refer & Earn</h3>
              <p className="text-sm text-muted-foreground">Earn 20 bonus credits for each friend who signs up.</p>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/auth?ref=${(profile as any)?.referral_code || ''}`} className="bg-muted text-sm font-mono" />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${(profile as any)?.referral_code || ''}`); toast.success("Copied!"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{referralCount} referral{referralCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Danger Zone */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>Delete Account</Button>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirmText(""); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes your account, projects, and data. Type <span className="font-mono font-bold">DELETE</span> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="font-mono" />
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <Button variant="destructive" disabled={deleteConfirmText !== "DELETE" || deleting} onClick={handleDeleteAccount}>
                    {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Current Plan</h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-medium capitalize">{profile?.subscription_tier}</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.ai_credits_monthly} credits/month</p>
                </div>
                <Button size="sm" onClick={() => navigate("/pricing")}>
                  {profile?.subscription_tier === 'free' ? 'Upgrade' : 'Change Plan'}
                </Button>
              </div>
            </div>

            {profile?.subscription_tier !== 'free' && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Billing</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("create-portal-session");
                      if (error) throw error;
                      if (data?.url) window.location.href = data.url;
                    } catch {
                      toast.error("Failed to open billing portal");
                    }
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />Manage Billing
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Usage */}
          <TabsContent value="usage" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Credit Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits used</span>
                  <span className="font-mono">{profile?.ai_credits_used}/{profile?.ai_credits_monthly}</span>
                </div>
                <Progress value={creditsUsedPct} className="h-2" />
              </div>
            </div>

            {usageLogs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <div className="space-y-1">
                  {usageLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                      <span className="text-muted-foreground">{log.operation_type}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              {[
                { key: "report_completion" as const, label: "Report completion", desc: "Get notified when your report is ready" },
                { key: "credit_alerts" as const, label: "Credit alerts", desc: "When you're running low on credits" },
                { key: "weekly_digest" as const, label: "Weekly digest", desc: "Summary of your activity" },
                { key: "product_updates" as const, label: "Product updates", desc: "New features and improvements" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[item.key]}
                    onCheckedChange={(val) => handleToggleNotif(item.key, val)}
                    disabled={savingPrefs}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
