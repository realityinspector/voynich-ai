import { useLocation, Link } from 'wouter';
import { 
  Github,
  ChevronRight,
  Home as HomeIcon
} from 'lucide-react';
import Logo from '@/components/Logo';

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

const PublicPageLayout: React.FC<PublicPageLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  
  // Get current page title based on location
  const getPageTitle = () => {
    switch (location) {
      case '/api-docs':
        return 'API Documentation';
      case '/python-client':
        return 'Python API Client';
      default:
        return 'Voynich Manuscript Analysis Platform';
    }
  };

  const title = getPageTitle();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-heading font-bold text-neutral-800 hidden md:block">
                  Voynich Research Platform
                </span>
            </Link>
          </div>
          
          {/* Page Title - Mobile only */}
          <h1 className="text-xl font-heading font-bold text-neutral-800 block md:hidden">{title}</h1>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/api-docs" 
              className={`text-sm ${location === '/api-docs' ? 'text-primary font-medium' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              API Docs
            </Link>
            
            <Link 
              href="/python-client" 
              className={`text-sm ${location === '/python-client' ? 'text-primary font-medium' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              Python Client
            </Link>
            
            <a 
              href="https://github.com/realityinspector/voynich-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-neutral-800"
              title="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            
            <Link 
              href="/login"
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              Sign In
            </Link>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="px-4 py-2 bg-neutral-100 text-sm flex items-center space-x-2">
          <Link 
            href="/" 
            className="text-primary hover:underline flex items-center"
          >
            <HomeIcon className="h-3.5 w-3.5 mr-1" />
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-500" />
          <span className="text-neutral-600">{title}</span>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-50">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 p-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Logo size={24} />
              <span className="text-lg font-semibold">Voynich Research Platform</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/realityinspector/voynich-ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
                <Link href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Docs
                </Link>
                <Link
                  href="/python-client"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span>Python API Client</span>
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Voynich Research Platform. Open Source under MIT License.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicPageLayout;