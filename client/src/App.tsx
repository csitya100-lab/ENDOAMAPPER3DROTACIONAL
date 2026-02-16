import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "@/lib/themeStore";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Vistas2D from "@/pages/Vistas2D";
import PublicReport from "@/pages/PublicReport";
import PrintReport from "@/pages/PrintReport";
import PreviewReport from "@/pages/PreviewReport";
import CaseViewer from "@/pages/CaseViewer";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/3d">
        <AuthGuard><Home /></AuthGuard>
      </Route>
      <Route path="/vistas-2d">
        <AuthGuard><Vistas2D /></AuthGuard>
      </Route>
      <Route path="/view/:caseId" component={CaseViewer} />
      <Route path="/relatorio/:id" component={PublicReport} />
      <Route path="/imprimir">
        <AuthGuard><PrintReport /></AuthGuard>
      </Route>
      <Route path="/preview-report">
        <AuthGuard><PreviewReport /></AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
