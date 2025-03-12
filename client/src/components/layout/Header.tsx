import { Link } from 'wouter';
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle,
  ChevronRight,
  Github
} from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  isAuthenticated: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, isAuthenticated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
  };
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={onToggleSidebar} 
            className="md:hidden text-neutral-600 hover:text-neutral-800"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Page Title */}
          <h1 className="text-xl font-heading font-bold text-neutral-800 hidden md:block">{title}</h1>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  className="pl-10 pr-4 py-2 w-64 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  placeholder="Search symbols, pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </form>
            </div>
            
            {/* Notifications */}
            <button className="text-neutral-600 hover:text-neutral-800 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </button>
            
            {/* Help */}
            <button className="text-neutral-600 hover:text-neutral-800">
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="px-4 py-2 bg-neutral-100 text-sm flex items-center space-x-2">
          <Link href="/">
            <a className="text-primary hover:underline">Home</a>
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-500" />
          <Link href={`/${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <a className="text-primary hover:underline">{title}</a>
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-500" />
          <span className="text-neutral-600">Current Page</span>
        </div>
      </header>
    </>
  );
};

export default Header;
