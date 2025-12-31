import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Vistas2D from "@/pages/Vistas2D";
import PublicReport from "@/pages/PublicReport";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vistas-2d" component={Vistas2D} />
      <Route path="/relatorio/:id" component={PublicReport} />
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
