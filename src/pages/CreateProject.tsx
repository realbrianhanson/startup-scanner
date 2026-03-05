import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
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
import { Globe, Lightbulb, Loader2, Lock, Sparkles } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { AppNav } from "@/components/AppNav";
import { INSPIRATION_IDEAS } from "@/lib/inspirationIdeas";

const INDUSTRIES = ["B2B SaaS", "E-commerce", "Local Services", "Healthcare", "Fintech", "Other"];
const BUSINESS_MODELS = ["Subscription", "One-time purchase", "Marketplace", "Advertising", "Freemium", "Other"];

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"website" | "describe">("website");

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

  useEffect(() => { document.title = "New Report | Validifier"; }, []);

  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single();
        if (profile) setUserTier(profile.subscription_tier);
      }
    };
    fetchTier();
  }, []);

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
    if (!projectName || !industry) { toast.error("Fill in project name and industry"); return; }
    if (useWebsite && !extractedData) { toast.error("Analyze the website first"); return; }
    if (!useWebsite && !description) { toast.error("Describe your idea"); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const qualityToUse = userTier === "free" ? "standard" : reportQuality;
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

  const ctaDisabledWebsite = loading || analyzing || !extractedData || !projectName || !industry;
  const ctaDisabledDescribe = loading || !description || !projectName || !industry;

  return (
    <div className="min-h-screen bg-background">
      <AppNav showNewReport={false} />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-8">New Analysis</h1>

        <div className="space-y-8">
          {/* Common fields */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Business name</Label>
              <Input
                placeholder="e.g., AI-powered meal planning for busy families"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                maxLength={100}
                disabled={loading}
                className="h-11 bg-transparent border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Industry</Label>
              <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                <SelectTrigger className="h-11 bg-transparent border-border">
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

          {/* Report quality */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Analysis Quality</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportQuality("standard")}
                disabled={loading}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  reportQuality === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="text-sm font-medium">Standard</p>
                <p className="text-xs text-muted-foreground mt-1">Gemini 3 Flash</p>
              </button>
              <button
                type="button"
                onClick={() => userTier !== "free" && setReportQuality("premium")}
                disabled={loading || userTier === "free"}
                className={`relative rounded-lg border p-4 text-left transition-colors ${
                  reportQuality === "premium" ? "border-primary bg-primary/5" : userTier === "free" ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {userTier === "free" && <Lock className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />}
                <p className="text-sm font-medium">Premium</p>
                <p className="text-xs text-muted-foreground mt-1">Gemini 3.1 Pro</p>
                {userTier === "free" && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); navigate("/pricing"); }} className="text-xs text-primary hover:underline mt-2">
                    Upgrade to unlock →
                  </button>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Segmented control */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab("website")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "website" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Globe className="h-4 w-4" />
              Website
            </button>
            <button
              onClick={() => setActiveTab("describe")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "describe" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              Describe
            </button>
          </div>

          {/* Website tab */}
          {activeTab === "website" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Website URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
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

              <Button
                onClick={() => handleSubmit(true)}
                disabled={ctaDisabledWebsite}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Generate Report"}
              </Button>
            </div>
          )}

          {/* Describe tab */}
          {activeTab === "describe" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Business Idea</Label>
                <div className="relative">
                  <Textarea
                    placeholder="Describe your business idea. What problem does it solve?"
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Target Market</Label>
                  <Input placeholder="e.g., Small business owners" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} disabled={loading} className="h-11 bg-transparent border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Competitors</Label>
                  <Input placeholder="e.g., Competitor A, B" value={competitors} onChange={(e) => setCompetitors(e.target.value)} disabled={loading} className="h-11 bg-transparent border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Business Model</Label>
                <Select value={businessModel} onValueChange={setBusinessModel} disabled={loading}>
                  <SelectTrigger className="h-11 bg-transparent border-border">
                    <SelectValue placeholder="Select business model" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => handleSubmit(false)}
                disabled={ctaDisabledDescribe}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Generate Report"}
              </Button>
            </div>
          )}

          {/* Inspiration */}
          <div className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">Need inspiration? Click to pre-fill</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {INSPIRATION_IDEAS.map((idea, i) => (
                <button
                  key={i}
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
                  className="text-left p-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors"
                >
                  <p className="text-sm font-medium">{idea.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.description.slice(0, 60)}...</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
