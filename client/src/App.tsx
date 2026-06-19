import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import Treinos from "./pages/Treinos";
import Avaliacoes from "./pages/Avaliacoes";
import Frequencia from "./pages/Frequencia";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/"              component={Dashboard} />
        <Route path="/alunos"        component={Alunos} />
        <Route path="/alunos/:id"    component={Alunos} />
        <Route path="/treinos"       component={Treinos} />
        <Route path="/treinos/:id"   component={Treinos} />
        <Route path="/avaliacoes"    component={Avaliacoes} />
        <Route path="/frequencia"    component={Frequencia} />
        <Route path="/financeiro"    component={Financeiro} />
        <Route path="/relatorios"    component={Relatorios} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
