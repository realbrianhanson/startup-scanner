import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Lightbulb, Loader2, Zap, BarChart3 } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Common fields
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("");

  // Tab 1 - Website analysis
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);

  // Tab 2 - Manual description
  const [description, setDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [businessModel, setBusinessModel] = useState("");

  const industries = [
    "B2B SaaS",
    "E-commerce",
    "Local Services",
    "Healthcare",
    "Fintech",
    "Other",
  ];

  const businessModels = [
    "Subscription",
    "One-time purchase",
    "Marketplace",
    "Advertising",
    "Freemium",
    "Other",
  ];

  const analyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        variant: "destructive",
        title: "Missing URL",
        description: "Please enter a website URL",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { url: websiteUrl },
      });

      if (error) throw error;

      setExtractedData(data);
      toast({
        title: "Analysis complete!",
        description: "Website data extracted successfully",
      });
    } catch (error: any) {
      console.error("Error analyzing website:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to analyze website",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (useWebsite: boolean) => {
    if (!projectName || !industry) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in project name and industry",
      });
      return;
    }

    if (useWebsite && !extractedData) {
      toast({
        variant: "destructive",
        title: "Website not analyzed",
        description: "Please analyze the website first",
      });
      return;
    }

    if (!useWebsite && !description) {
      toast({
        variant: "destructive",
        title: "Missing description",
        description: "Please describe your business idea",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create project
      const projectData = useWebsite
        ? {
            user_id: user.id,
            name: projectName,
            description: extractedData?.description || "",
            website_url: websiteUrl,
            industry,
            status: "draft",
          }
        : {
            user_id: user.id,
            name: projectName,
            description: `${description}\n\nTarget Market: ${targetMarket}\nCompetitors: ${competitors || "Not specified"}\nBusiness Model: ${businessModel}`,
            industry,
            status: "draft",
          };

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      toast({
        title: "Project created!",
        description: "Starting validation analysis...",
      });

      // Navigate to report page
      navigate(`/projects/${project.id}/report`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message || "Failed to create project",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Validifier
              </span>
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
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Create New Project</h1>
            <p className="text-xl text-muted-foreground">
              Let's validate your business idea with AI-powered analysis
            </p>
          </div>

          <Card className="p-8 border-2 shadow-large space-y-6">
            {/* Common Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
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
                <Label htmlFor="industry">Industry *</Label>
                <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs for input methods */}
            <Tabs defaultValue="website" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="website" disabled={loading}>
                  <Globe className="mr-2 h-4 w-4" />
                  Analyze Website
                </TabsTrigger>
                <TabsTrigger value="describe" disabled={loading}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Describe Idea
                </TabsTrigger>
              </TabsList>

              <TabsContent value="website" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Already have a website or landing page? We'll extract your business
                      model automatically using AI-powered analysis.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="websiteUrl"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        disabled={analyzing || loading}
                      />
                      <Button
                        onClick={analyzeWebsite}
                        disabled={analyzing || loading || !websiteUrl}
                        variant="secondary"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze"
                        )}
                      </Button>
                    </div>
                  </div>

                  {extractedData && (
                    <Card className="p-6 bg-background border-2 border-primary/20 shadow-lg">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          <p className="font-semibold text-lg">Analysis Complete</p>
                        </div>
                        <MarkdownContent 
                          content={extractedData.description} 
                          className="prose prose-sm max-w-none"
                        />
                      </div>
                    </Card>
                  )}

                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={loading || analyzing || !extractedData}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Start Validation (Uses ~5 AI Credits)
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="describe" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Idea Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your business idea in detail. What problem does it solve? Who are your customers?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                      rows={6}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.length}/1000 characters (200-1000 recommended)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetMarket">Target Market</Label>
                    <Input
                      id="targetMarket"
                      placeholder="e.g., Small business owners, Healthcare professionals"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitors">Main Competitors (Optional)</Label>
                    <Input
                      id="competitors"
                      placeholder="e.g., Competitor A, Competitor B"
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessModel">Business Model</Label>
                    <Select
                      value={businessModel}
                      onValueChange={setBusinessModel}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business model" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={loading || !description}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Start Validation (Uses ~5 AI Credits)
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
