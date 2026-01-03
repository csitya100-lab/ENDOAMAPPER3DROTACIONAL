import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Vistas2D from "@/pages/Vistas2D";
import PublicReport from "@/pages/PublicReport";
import PrintReport from "@/pages/PrintReport";
import PreviewReport from "@/pages/PreviewReport";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/3d" component={Home} />
      <Route path="/vistas-2d" component={Vistas2D} />
      <Route path="/relatorio/:id" component={PublicReport} />
      <Route path="/imprimir" component={PrintReport} />
      <Route path="/preview-report" component={PreviewReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
