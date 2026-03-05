import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <BarChart3 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Validifier
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 5, 2026</p>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Your privacy is important to us. This page will contain our full privacy policy detailing how we collect, use, and protect your personal information.
          </p>
          <p className="text-muted-foreground">
            Content coming soon. If you have questions, please contact us at support@validifier.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
