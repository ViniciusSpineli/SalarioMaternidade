import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { useAuth } from "./_core/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Clientes from "./pages/Clientes";
import GPS from "./pages/GPS";
import ClientesPorStatus from "./pages/ClientesPorStatus";
import Honorarios from "./pages/Honorarios";
import Relatorios from "./pages/Relatorios";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path={"/kanban"}>
        <DashboardLayout>
          <Kanban />
        </DashboardLayout>
      </Route>
      <Route path={"/clientes"}>
        <DashboardLayout>
          <Clientes />
        </DashboardLayout>
      </Route>
      <Route path={"/gps"}>
        <DashboardLayout>
          <GPS />
        </DashboardLayout>
      </Route>
      <Route path={"/status/:slug"}>
        <DashboardLayout>
          <ClientesPorStatus />
        </DashboardLayout>
      </Route>
      <Route path={"/honorarios"}>
        <DashboardLayout>
          <Honorarios />
        </DashboardLayout>
      </Route>
      <Route path={"/relatorios"}>
        <DashboardLayout>
          <Relatorios />
        </DashboardLayout>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Trava de autenticação: mostra o login enquanto não houver usuário logado.
function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
