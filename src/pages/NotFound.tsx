import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Validifier</span>
        </div>
        <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">Page not found</p>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate("/")} variant="default">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
