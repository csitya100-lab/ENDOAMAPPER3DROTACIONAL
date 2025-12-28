import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ExamReport from "@/pages/ExamReport";
import Dashboard from "@/pages/Dashboard";
import DitadoIA from "@/pages/DitadoIA";
import GerenciarModelos from "@/pages/GerenciarModelos";
import Vistas2D from "@/pages/Vistas2D";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/report" component={ExamReport} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vistas-2d" component={Vistas2D} />
      <Route path="/ditado-ia" component={DitadoIA} />
      <Route path="/modelos" component={GerenciarModelos} />
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
