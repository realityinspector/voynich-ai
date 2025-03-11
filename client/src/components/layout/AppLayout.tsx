import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  
  // Fetch current user data
  const { data: sessionData } = useQuery({
    queryKey: ['/api/auth/session'],
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  // Get current page title based on location
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/manuscript':
        return 'Manuscript Viewer';
      case '/symbols':
        return 'Symbol Analysis';
      case '/analysis':
        return 'AI Analysis';
      case '/gallery':
        return 'Gallery';
      case '/api-docs':
        return 'API Documentation';
      case '/admin/upload':
        return 'Upload Pages';
      case '/admin/settings':
        return 'Settings';
      case '/credits':
        return 'Purchase Credits';
      default:
        return 'Voynich Manuscript Analysis Platform';
    }
  };
  
  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  if (!sessionData?.user) {
    return null; // Don't render layout if not authenticated
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={sessionData.user}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          title={getPageTitle()}
          isAuthenticated={!!sessionData?.user}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
