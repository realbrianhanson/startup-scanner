import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, Lightbulb, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { INSPIRATION_IDEAS } from "@/lib/inspirationIdeas";
import { PRODUCT_FACTS } from "@/lib/productFacts";

const INDUSTRIES = ["B2B SaaS", "E-commerce", "Local Services", "Healthcare", "Fintech", "Other"];
const BUSINESS_MODELS = ["Subscription", "One-time purchase", "Marketplace", "Advertising", "Freemium", "Other"];

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"describe" | "website">("describe");

  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [reportQuality, setReportQuality] = useState<"standard" | "premium">("standard");
  const [userTier, setUserTier] = useState<string>("free");
  const [creditsMonthly, setCreditsMonthly] = useState<number>(PRODUCT_FACTS.free.monthlyCredits);
  const [creditsUsed, setCreditsUsed] = useState<number>(0);

  useEffect(() => { document.title = "New Report | Validifier"; }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, ai_credits_monthly, ai_credits_used")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUserTier(profile.subscription_tier || "free");
        setCreditsMonthly(profile.ai_credits_monthly ?? PRODUCT_FACTS.free.monthlyCredits);
        setCreditsUsed(profile.ai_credits_used ?? 0);
      }
    };
    fetchProfile();
  }, []);

  const isFree = userTier === "free";
  const effectiveQuality: "standard" | "premium" = isFree ? "standard" : reportQuality;
  const selectedCost = effectiveQuality === "premium"
    ? PRODUCT_FACTS.credits.premiumReport
    : PRODUCT_FACTS.credits.standardReport;
  const creditsRemaining = Math.max(0, creditsMonthly - creditsUsed);
  const insufficientCredits = creditsRemaining < selectedCost;

  const analyzeWebsite = async () => {
    if (!websiteUrl) { toast.error("Enter a website URL"); return; }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-website", { body: { url: websiteUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExtractedData(data);
      toast.success("Website analyzed!");
    } catch (error: any) {
      toast.error("Website analysis failed. Try the Describe tab instead.", { duration: 6000 });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (useWebsite: boolean) => {
    if (!projectName || !industry) { toast.error("Fill in idea name and industry"); return; }
    if (useWebsite && !extractedData) { toast.error("Analyze the website first"); return; }
    if (!useWebsite && !description) { toast.error("Describe your idea"); return; }
    if (insufficientCredits) {
      toast.error(`You need ${selectedCost} credits to generate this report.`);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const qualityToUse = isFree ? "standard" : reportQuality;
      const projectData = useWebsite
        ? { user_id: user.id, name: projectName, description: extractedData?.description || "", website_url: websiteUrl, industry, status: "draft", report_quality: qualityToUse }
        : { user_id: user.id, name: projectName, description: `${description}\n\nTarget Market: ${targetMarket}\nCompetitors: ${competitors || "Not specified"}\nBusiness Model: ${businessModel}`, industry, status: "draft", report_quality: qualityToUse };

      const { data: project, error: projectError } = await supabase.from("projects").insert(projectData).select().single();
      if (projectError) throw projectError;
      toast.success("Starting analysis...");
      trackEvent('project_created', { industry, input_method: useWebsite ? 'website' : 'describe' });
      navigate(`/projects/${project.id}/report`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const ctaDisabledWebsite = loading || analyzing || !extractedData || !projectName || !industry || insufficientCredits;
  const ctaDisabledDescribe = loading || !description || !projectName || !industry || insufficientCredits;

  const CtaFooter = () => (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{creditsRemaining} credits remaining</span>
        <span>Selected cost: {selectedCost} credits</span>
      </div>
      {insufficientCredits && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm flex flex-wrap items-center justify-between gap-2">
          <span>You need {selectedCost} credits to generate this report.</span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/pricing">View plans</Link>
          </Button>
        </div>
      )}
    </div>
  );

  const CtaMeta = () => (
    <p className="text-xs text-muted-foreground text-center">
      {PRODUCT_FACTS.reportSectionCount} sections · usually {PRODUCT_FACTS.reportTimeRange} · {selectedCost} credits
    </p>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNav showNewReport={false} />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="mb-8 space-y-2">
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Pressure-test a business idea</h1>
          <p className="text-muted-foreground">Give us the essentials. We’ll turn them into a scored 15-section decision brief.</p>
        </header>

        <div className="space-y-8">
          {/* Report quality */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Report type</Label>
            {isFree ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <p className="text-sm font-medium">Standard decision brief</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Included on Free · {PRODUCT_FACTS.credits.standardReport} credits
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportQuality("standard")}
                  disabled={loading}
                  className={`rounded-lg border p-4 text-left transition-colors min-h-[44px] ${
                    reportQuality === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="text-sm font-medium">Standard decision brief</p>
                  <p className="text-xs text-muted-foreground mt-1">Fast, complete 15-section analysis</p>
                  <p className="text-xs text-muted-foreground mt-2">{PRODUCT_FACTS.credits.standardReport} credits</p>
                </button>
                <button
                  type="button"
                  onClick={() => setReportQuality("premium")}
                  disabled={loading}
                  className={`rounded-lg border p-4 text-left transition-colors min-h-[44px] ${
                    reportQuality === "premium" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="text-sm font-medium">Premium decision brief</p>
                  <p className="text-xs text-muted-foreground mt-1">Deeper reasoning for higher-stakes decisions</p>
                  <p className="text-xs text-muted-foreground mt-2">{PRODUCT_FACTS.credits.premiumReport} credits</p>
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Segmented control — Describe first */}
          <div role="tablist" aria-label="Input method" className="flex bg-muted rounded-lg p-1">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "describe"}
              onClick={() => setActiveTab("describe")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
                activeTab === "describe" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Describe an idea
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "website"}
              onClick={() => setActiveTab("website")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors ${
                activeTab === "website" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Globe className="h-4 w-4" />
              Import a website
            </button>
          </div>

          {/* Describe tab */}
          {activeTab === "describe" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="idea-description" className="text-sm text-muted-foreground">Describe the idea</Label>
                <p className="text-xs text-muted-foreground">What problem does it solve, for whom, and why is your approach different?</p>
                <div className="relative">
                  <Textarea
                    id="idea-description"
                    required
                    placeholder="e.g., A scheduling tool for independent home-service pros that auto-fills gaps in the calendar with nearby jobs."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={6}
                    maxLength={1000}
                    className="resize-none bg-transparent border-border"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-muted-foreground font-mono">
                    {description.length}/1000
                  </span>
                </div>
              </div>

              {/* Inspiration cards — right below textarea */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Need inspiration? Click to pre-fill</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {INSPIRATION_IDEAS.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setProjectName(idea.name);
                        setIndustry(idea.industry);
                        setDescription(idea.description);
                        setTargetMarket(idea.targetMarket);
                        setCompetitors(idea.competitors);
                        setBusinessModel(idea.businessModel);
                        setActiveTab("describe");
                        toast.success(`Pre-filled with "${idea.name}"`);
                      }}
                      disabled={loading}
                      className="text-left p-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors min-h-[44px]"
                    >
                      <p className="text-sm font-medium">{idea.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.description.slice(0, 60)}...</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="idea-name" className="text-sm text-muted-foreground">Idea name</Label>
                  <Input
                    id="idea-name"
                    required
                    placeholder="e.g., GapFill Scheduler"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={100}
                    disabled={loading}
                    className="h-11 bg-transparent border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idea-industry" className="text-sm text-muted-foreground">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                    <SelectTrigger id="idea-industry" className="h-11 bg-transparent border-border">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Optional context</p>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target-market" className="text-sm text-muted-foreground">Target market</Label>
                    <Input id="target-market" placeholder="e.g., Small business owners" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} disabled={loading} className="h-11 bg-transparent border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitors" className="text-sm text-muted-foreground">Competitors</Label>
                    <Input id="competitors" placeholder="e.g., Competitor A, B" value={competitors} onChange={(e) => setCompetitors(e.target.value)} disabled={loading} className="h-11 bg-transparent border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-model" className="text-sm text-muted-foreground">Business model</Label>
                  <Select value={businessModel} onValueChange={setBusinessModel} disabled={loading}>
                    <SelectTrigger id="business-model" className="h-11 bg-transparent border-border">
                      <SelectValue placeholder="Select business model" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CtaFooter />

              <Button
                onClick={() => handleSubmit(false)}
                disabled={ctaDisabledDescribe}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your report…</> : "Generate my decision brief"}
              </Button>
              <CtaMeta />
            </div>
          )}

          {/* Website tab */}
          {activeTab === "website" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="website-url" className="text-sm text-muted-foreground">Website URL</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="website-url"
                    type="url"
                    required
                    placeholder="https://yourwebsite.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={analyzing || loading}
                    className="h-11 bg-transparent border-border"
                  />
                  <Button onClick={analyzeWebsite} disabled={analyzing || loading || !websiteUrl} variant="secondary" className="shrink-0 h-11">
                    {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing</> : "Analyze"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="idea-name-web" className="text-sm text-muted-foreground">Idea name</Label>
                  <Input
                    id="idea-name-web"
                    required
                    placeholder="e.g., GapFill Scheduler"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={100}
                    disabled={loading}
                    className="h-11 bg-transparent border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idea-industry-web" className="text-sm text-muted-foreground">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                    <SelectTrigger id="idea-industry-web" className="h-11 bg-transparent border-border">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {extractedData && (
                <div className="rounded-lg border border-success/20 bg-success/5 p-5 space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Analysis complete
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {extractedData.description?.slice(0, 300)}
                  </p>
                </div>
              )}

              <CtaFooter />

              <Button
                onClick={() => handleSubmit(true)}
                disabled={ctaDisabledWebsite}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your report…</> : "Generate my decision brief"}
              </Button>
              <CtaMeta />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProject;