import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  ArrowLeft, Globe, Lightbulb, Loader2, Zap, BarChart3,
  Check, Building2, ShoppingCart, MapPin, HeartPulse, Landmark, MoreHorizontal,
  Target, Users, Briefcase, Tag,
} from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";

/* ── Industry icons ── */
const INDUSTRY_MAP: { label: string; icon: React.ElementType }[] = [
  { label: "B2B SaaS", icon: Building2 },
  { label: "E-commerce", icon: ShoppingCart },
  { label: "Local Services", icon: MapPin },
  { label: "Healthcare", icon: HeartPulse },
  { label: "Fintech", icon: Landmark },
  { label: "Other", icon: MoreHorizontal },
];

const businessModels = [
  "Subscription", "One-time purchase", "Marketplace", "Advertising", "Freemium", "Other",
];

/* ── Step indicator ── */
const StepIndicator = ({ currentStep, activeTab }: { currentStep: number; activeTab: string }) => {
  const steps = [
    { num: 1, label: "Choose Method" },
    { num: 2, label: "Fill Details" },
    { num: 3, label: "Review & Generate" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-0 w-full max-w-md mx-auto">
      {steps.map((step, i) => {
        const isComplete = step.num < currentStep;
        const isActive = step.num === currentStep;
        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                  isComplete
                    ? "bg-success text-success-foreground"
                    : isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-medium"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : step.num}
              </div>
              <span className={`text-[11px] font-medium transition-colors duration-300 whitespace-nowrap ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] flex-1 mx-2 rounded-full transition-all duration-500 min-w-[24px] ${
                isComplete ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Circular char counter ── */
const CharCounter = ({ current, max }: { current: number; max: number }) => {
  const pct = Math.min(current / max, 1);
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const isGood = current >= 200;
  const color = current === 0 ? "hsl(var(--muted-foreground))" : isGood ? "hsl(var(--success))" : "hsl(var(--primary))";

  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
        <circle cx="18" cy="18" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          className="transition-all duration-300"
        />
      </svg>
      <span className="text-xs text-muted-foreground font-medium tabular-nums">
        {current}/{max}
      </span>
    </div>
  );
};

/* ── Typewriter effect for extracted text ── */
const TypewriterText = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    document.title = "New Project | Validifier";
  }, []);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idx.current += 3;
      if (idx.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, idx.current));
      }
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
};

/* ── Extracted data tags ── */
const ExtractedTag = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  </div>
);

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("website");

  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [businessModel, setBusinessModel] = useState("");

  /* Compute current step */
  const getCurrentStep = () => {
    if (!projectName && !industry) return 1;
    if (activeTab === "website") {
      if (!extractedData && !analyzing) return 2;
      if (extractedData) return 3;
      return 2;
    }
    if (!description) return 2;
    if (description.length >= 50) return 3;
    return 2;
  };

  const analyzeWebsite = async () => {
    if (!websiteUrl) { toast.error("Please enter a website URL"); return; }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-website", { body: { url: websiteUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExtractedData(data);
      toast.success("Website data extracted successfully!");
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("429") || msg.includes("rate")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error("Website analysis failed. The site might be blocking our scraper. Try the 'Describe Idea' tab instead.", {
          duration: 6000,
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (useWebsite: boolean) => {
    if (!projectName || !industry) { toast.error("Please fill in project name and industry"); return; }
    if (useWebsite && !extractedData) { toast.error("Please analyze the website first"); return; }
    if (!useWebsite && !description) { toast.error("Please describe your business idea"); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const projectData = useWebsite
        ? { user_id: user.id, name: projectName, description: extractedData?.description || "", website_url: websiteUrl, industry, status: "draft" }
        : { user_id: user.id, name: projectName, description: `${description}\n\nTarget Market: ${targetMarket}\nCompetitors: ${competitors || "Not specified"}\nBusiness Model: ${businessModel}`, industry, status: "draft" };

      const { data: project, error: projectError } = await supabase.from("projects").insert(projectData).select().single();
      if (projectError) throw projectError;
      toast.success("Project created! Starting validation analysis...");
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
    <div className="min-h-screen bg-gradient-subtle animate-fade-in" style={{ opacity: 1 }}>
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02]" onClick={() => navigate("/dashboard")}>
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-extrabold gradient-text">Validifier</span>
            </div>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight">Create New Project</h1>
            <p className="text-lg text-muted-foreground">
              Let's validate your business idea with AI-powered analysis
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={getCurrentStep()} activeTab={activeTab} />

          {/* Main Card with animated gradient border */}
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 bg-[length:200%_100%] animate-gradient opacity-60 blur-[1px]" />

            <Card className="relative p-8 border-0 shadow-large space-y-6">
              {/* Common Fields */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="font-medium">Project Name *</Label>
                  <Input
                    id="projectName"
                    placeholder="My Awesome Startup"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="font-medium">Industry *</Label>
                  <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_MAP.map(({ label, icon: Icon }) => (
                        <SelectItem key={label} value={label}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="website" disabled={loading} className="gap-2 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    Analyze Website
                  </TabsTrigger>
                  <TabsTrigger value="describe" disabled={loading} className="gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4" />
                    Describe Idea
                  </TabsTrigger>
                </TabsList>

                {/* ── Website Tab ── */}
                <TabsContent value="website" className="mt-6 animate-fade-in" style={{ opacity: 1 }}>
                  <div className="space-y-5">
                    {/* Illustration + info */}
                    <div className="flex items-start gap-4 bg-primary/5 rounded-xl p-5 border border-primary/10">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Website Analysis</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Already have a website or landing page? We'll extract your business model, value proposition, and target market automatically.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="font-medium">Website URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="websiteUrl"
                          type="url"
                          placeholder="https://yourwebsite.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          disabled={analyzing || loading}
                        />
                        <Button onClick={analyzeWebsite} disabled={analyzing || loading || !websiteUrl} variant="secondary" className="shrink-0">
                          {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Analyze"}
                        </Button>
                      </div>
                    </div>

                    {/* Extracted data display */}
                    {extractedData && (
                      <div className="rounded-xl border-2 border-success/30 bg-success/5 p-6 space-y-4 animate-scale-in" style={{ opacity: 1 }}>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                          <p className="font-semibold text-foreground">Analysis Complete</p>
                        </div>

                        {/* Tags preview */}
                        <div className="grid gap-2 sm:grid-cols-3">
                          <ExtractedTag icon={Target} label="Value Prop" value={extractedData.valueProp || "Extracted from site"} />
                          <ExtractedTag icon={Users} label="Target Market" value={extractedData.targetMarket || "Identified"} />
                          <ExtractedTag icon={Briefcase} label="Business Model" value={extractedData.businessModel || "Analyzed"} />
                        </div>

                        <div className="border-t border-success/20 pt-4">
                          <p className="text-sm text-foreground leading-relaxed">
                            <TypewriterText text={extractedData.description?.slice(0, 300) || ""} />
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              onClick={() => handleSubmit(true)}
                              disabled={ctaDisabledWebsite}
                              className={`w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 font-semibold transition-all duration-300 ${
                                !ctaDisabledWebsite ? "animate-pulse-glow hover:shadow-glow" : ""
                              }`}
                              size="lg"
                            >
                              {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating Project...</>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-5 w-5" />
                                  Start Validation
                                  <span className="ml-2 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">~5 credits</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">This will generate a comprehensive 12-section report</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TabsContent>

                {/* ── Describe Tab ── */}
                <TabsContent value="describe" className="mt-6 animate-fade-in" style={{ opacity: 1 }}>
                  <div className="space-y-5">
                    {/* Illustration + info */}
                    <div className="flex items-start gap-4 bg-secondary/5 rounded-xl p-5 border border-secondary/10">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center shrink-0">
                        <Lightbulb className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Describe Your Idea</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Tell us about your business concept. The more detail you provide, the better our analysis will be.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-medium">Business Idea Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your business idea in detail. What problem does it solve? Who are your customers?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={6}
                        maxLength={1000}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground font-medium">200–1000 characters recommended</p>
                        <CharCounter current={description.length} max={1000} />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="targetMarket" className="font-medium">Target Market</Label>
                        <Input
                          id="targetMarket"
                          placeholder="e.g., Small business owners"
                          value={targetMarket}
                          onChange={(e) => setTargetMarket(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="competitors" className="font-medium">Main Competitors</Label>
                        <Input
                          id="competitors"
                          placeholder="e.g., Competitor A, B"
                          value={competitors}
                          onChange={(e) => setCompetitors(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessModel" className="font-medium">Business Model</Label>
                      <Select value={businessModel} onValueChange={setBusinessModel} disabled={loading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business model" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CTA */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              onClick={() => handleSubmit(false)}
                              disabled={ctaDisabledDescribe}
                              className={`w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 font-semibold transition-all duration-300 ${
                                !ctaDisabledDescribe ? "animate-pulse-glow hover:shadow-glow" : ""
                              }`}
                              size="lg"
                            >
                              {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating Project...</>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-5 w-5" />
                                  Start Validation
                                  <span className="ml-2 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">~5 credits</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">This will generate a comprehensive 12-section report</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
