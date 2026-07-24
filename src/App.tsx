import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NetworkOfflineBanner } from "@/components/NetworkOfflineBanner";
import { CookieConsent } from "@/components/CookieConsent";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteSEO from "@/components/RouteSEO";
import PageTracker from "@/components/PageTracker";
import Landing from "./pages/Landing";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const ViewReport = lazy(() => import("./pages/ViewReport"));
const Chat = lazy(() => import("./pages/Chat"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SampleReport = lazy(() => import("./pages/SampleReport"));
const Contact = lazy(() => import("./pages/Contact"));
const Security = lazy(() => import("./pages/Security"));

const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading"
    className="min-h-[60vh] flex items-center justify-center"
  >
    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="validifier-ui-theme">
        <TooltipProvider>
          <Sonner />
          <NetworkOfflineBanner />
          <BrowserRouter>
            <RouteSEO />
            <PageTracker />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects/new" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
              <Route path="/projects/:id/report" element={<ViewReport />} />
              <Route path="/projects/:id/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/sample-report" element={<SampleReport />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/security" element={<Security />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
