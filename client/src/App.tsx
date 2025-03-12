import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

// Import pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Manuscript from "@/pages/manuscript";
import Symbols from "@/pages/symbols";
import Analysis from "@/pages/analysis";
import Gallery from "@/pages/gallery";
import ApiDocs from "@/pages/api-docs";
import Upload from "@/pages/admin/upload";
import Settings from "@/pages/admin/settings";
import Credits from "@/pages/credits";

// Import components
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "./hooks/use-toast";

function Router() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest('GET', '/api/auth/session');
      } catch (error) {
        // If we're not already on the login page and not on register, redirect to login
        if (location !== '/login' && location !== '/register') {
          toast({
            title: "Session expired",
            description: "Please log in to continue",
            variant: "destructive",
          });
          setLocation('/login');
        }
      }
    };

    checkAuth();
  }, []);
  
  return (
    <Switch>
      {/* Auth routes - no layout */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes with layout */}
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      
      <Route path="/manuscript">
        <AppLayout>
          <Manuscript />
        </AppLayout>
      </Route>
      
      {/* Redirect from old path to new path */}
      <Route path="/manuscript-viewer">
        {() => {
          const [_, setLocation] = useLocation();
          useEffect(() => {
            setLocation('/manuscript');
          }, []);
          return null;
        }}
      </Route>
      
      <Route path="/symbols">
        <AppLayout>
          <Symbols />
        </AppLayout>
      </Route>
      
      <Route path="/analysis">
        <AppLayout>
          <Analysis />
        </AppLayout>
      </Route>
      
      <Route path="/gallery">
        <AppLayout>
          <Gallery />
        </AppLayout>
      </Route>
      
      <Route path="/api-docs">
        <AppLayout>
          <ApiDocs />
        </AppLayout>
      </Route>
      
      <Route path="/admin/upload">
        <AppLayout>
          <Upload />
        </AppLayout>
      </Route>
      
      <Route path="/admin/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      
      <Route path="/credits">
        <AppLayout>
          <Credits />
        </AppLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
