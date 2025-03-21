import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from '../Logo';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Icons
import { 
  Home, 
  BookOpen, 
  Puzzle, 
  MessageSquare, 
  Bot, 
  Images, 
  Code, 
  Upload, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  ScrollText,
  ActivitySquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [symbolsExpanded, setSymbolsExpanded] = useState(false);
  
  // Fetch user credits
  const { data: creditsData } = useQuery({
    queryKey: ['/api/ai/credits'],
    retry: false,
  });
  
  const credits = creditsData?.credits || 0;

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account',
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: 'Error logging out',
        description: 'There was a problem logging out',
        variant: 'destructive',
      });
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-primary text-white transition duration-300 md:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-primary-700">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Logo />
              <span className="ml-2 text-xl font-heading font-bold">Voynich Analysis</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="px-2 py-4">
          <div className="space-y-2">
            {/* Navigation Groups */}
            <div className="space-y-1">
              <Link href="/">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <Home className="mr-3 h-5 w-5 text-secondary" />
                  Dashboard
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <Link href="/manuscript">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/manuscript' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <BookOpen className="mr-3 h-5 w-5 text-secondary" />
                  Manuscript Viewer
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={() => setSymbolsExpanded(!symbolsExpanded)}
                className={`flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md ${
                  (location === '/symbols' || symbolsExpanded) 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}
              >
                <div className="flex items-center">
                  <Puzzle className="mr-3 h-5 w-5 text-secondary" />
                  Symbol Analysis
                </div>
                {symbolsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {symbolsExpanded && (
                <div className="ml-8 space-y-1">
                  <Link href="/symbols?tab=extraction">
                    <div className="block px-2 py-1 text-sm text-white hover:text-secondary cursor-pointer">
                      Extraction
                    </div>
                  </Link>
                  <Link href="/symbols?tab=classification">
                    <div className="block px-2 py-1 text-sm text-white hover:text-secondary cursor-pointer">
                      Classification
                    </div>
                  </Link>
                  <Link href="/symbols?tab=statistics">
                    <div className="block px-2 py-1 text-sm text-white hover:text-secondary cursor-pointer">
                      Statistics
                    </div>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <Link href="/annotations">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/annotations' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <MessageSquare className="mr-3 h-5 w-5 text-secondary" />
                  Annotations
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <Link href="/analysis">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/analysis' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <Bot className="mr-3 h-5 w-5 text-secondary" />
                  AI Analysis
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full text-primary-900">
                    {credits} Credits
                  </span>
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <Link href="/gallery">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/gallery' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <Images className="mr-3 h-5 w-5 text-secondary" />
                  Gallery
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <Link href="/blog">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/blog' || location.startsWith('/blog/') 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <ScrollText className="mr-3 h-5 w-5 text-secondary" />
                  Blog
                </div>
              </Link>
            </div>
            
            <div className="space-y-1">
              <Link href="/api-docs">
                <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === '/api-docs' 
                    ? 'bg-primary-700 text-white font-semibold' 
                    : 'text-white hover:bg-primary-700'
                }`}>
                  <Code className="mr-3 h-5 w-5 text-secondary" />
                  API Documentation
                </div>
              </Link>
            </div>
            
            {/* Admin Section */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-primary-700">
                <div className="px-2 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                  Admin
                </div>
                
                <div className="space-y-1">
                  <Link href="/admin/upload">
                    <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      location === '/admin/upload' 
                        ? 'bg-primary-700 text-white font-semibold' 
                        : 'text-white hover:bg-primary-700'
                    }`}>
                      <Upload className="mr-3 h-5 w-5 text-secondary" />
                      Upload Pages
                    </div>
                  </Link>
                </div>
                
                <div className="space-y-1">
                  <Link href="/admin/settings">
                    <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      location === '/admin/settings' 
                        ? 'bg-primary-700 text-white font-semibold' 
                        : 'text-white hover:bg-primary-700'
                    }`}>
                      <Settings className="mr-3 h-5 w-5 text-secondary" />
                      Settings
                    </div>
                  </Link>
                </div>
                
                <div className="space-y-1">
                  <Link href="/admin/testing">
                    <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      location === '/admin/testing' 
                        ? 'bg-primary-700 text-white font-semibold' 
                        : 'text-white hover:bg-primary-700'
                    }`}>
                      <ActivitySquare className="mr-3 h-5 w-5 text-secondary" />
                      System Testing
                    </div>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Credit link for all users */}
            <div className="pt-4 mt-4 border-t border-primary-700">
              <div className="space-y-1">
                <Link href="/credits">
                  <div className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    location === '/credits' 
                      ? 'bg-primary-700 text-white font-semibold' 
                      : 'text-white hover:bg-primary-700'
                  }`}>
                    <div className="mr-3 h-5 w-5 text-secondary flex items-center justify-center">
                      <span className="text-lg font-bold">+</span>
                    </div>
                    Purchase Credits
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* User Menu */}
        <div className="absolute bottom-0 w-full p-4 border-t border-primary-700">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary font-medium">
              {user?.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-neutral-300">{user?.role === 'admin' ? 'Admin' : 'User'}</div>
            </div>
            <button onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-neutral-300 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
