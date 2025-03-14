import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Manuscript from "@/pages/manuscript";
import Symbols from "@/pages/symbols";
import SymbolGallery from "@/pages/symbol-gallery";
import Analysis from "@/pages/analysis";
import AnalysisResult from "@/pages/analysis-result";
import Gallery from "@/pages/gallery";
import ApiDocs from "@/pages/api-docs";
import PythonClient from "@/pages/python-client";
import Upload from "@/pages/admin/upload";
import Settings from "@/pages/admin/settings";
import Credits from "@/pages/credits";

// Import components
import AppLayout from "@/components/layout/AppLayout";
import React, { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "./hooks/use-toast";

function Router() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest('GET', '/api/auth/session');
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        // If trying to access a protected route, redirect to login
        if (
          location !== '/' && 
          location !== '/login' && 
          location !== '/register' &&
          location !== '/api-docs' &&
          location !== '/python-client'
        ) {
          toast({
            title: "Authentication required",
            description: "Please log in to access this page",
            variant: "destructive",
          });
          setLocation('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {isAuthenticated ? (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        ) : (
          <Home />
        )}
      </Route>
      
      {/* Public API documentation */}
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/python-client" component={PythonClient} />
      
      {/* Auth routes - no layout */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes with layout */}
      
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
      
      <Route path="/symbol-gallery">
        <AppLayout>
          <SymbolGallery />
        </AppLayout>
      </Route>
      
      <Route path="/analysis">
        <AppLayout>
          <Analysis />
        </AppLayout>
      </Route>
      
      <Route path="/analysis/:id">
        <AppLayout>
          <AnalysisResult />
        </AppLayout>
      </Route>
      
      <Route path="/gallery">
        <AppLayout>
          <Gallery />
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
