import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "@/lib/themeStore";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Vistas2D from "@/pages/Vistas2D";
import PublicReport from "@/pages/PublicReport";
import PrintReport from "@/pages/PrintReport";
import PreviewReport from "@/pages/PreviewReport";
import CaseViewer from "@/pages/CaseViewer";
import Model3DViewer from "@/pages/Model3DViewer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/3d" component={Home} />
      <Route path="/3d/:caseId" component={Model3DViewer} />
      <Route path="/vistas-2d" component={Vistas2D} />
      <Route path="/view/:caseId" component={CaseViewer} />
      <Route path="/relatorio/:id" component={PublicReport} />
      <Route path="/imprimir" component={PrintReport} />
      <Route path="/preview-report" component={PreviewReport} />
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
