import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Search, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isAgent = location.pathname.startsWith('/partner-vault');
  const isAdmin = location.pathname.startsWith('/staff-hq');

  if (isAdmin) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-navy text-white shadow-md border-b border-navy/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/staff-hq/dashboard" className="flex items-center gap-3">
              <img src="/photo_2026-05-09_23-28-19.jpg" alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
              <span className="font-hanken font-extrabold text-sm sm:text-lg tracking-tight leading-none max-w-[140px] sm:max-w-none">
                DAIK
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="bg-white/10 text-yellow text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Portal</span>
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-surface-highest">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/photo_2026-05-09_23-28-19.jpg" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-navy font-hanken font-extrabold text-base sm:text-xl tracking-tight leading-tight max-w-[120px] sm:max-w-none">DAIK</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className={cn(
                  "text-sm font-semibold transition-colors",
                  !isAgent ? "text-navy" : "text-on-surface-variant hover:text-navy"
                )}
              >
                Client
              </Link>
              <Link 
                to="/partner-vault" 
                className={cn(
                  "text-xs font-bold px-4 py-2 rounded-full transition-all",
                  isAgent ? "bg-navy text-yellow shadow-md" : "bg-surface-container text-on-surface-variant hover:bg-navy hover:text-white"
                )}
              >
                Agent Access
              </Link>
              <Link 
                to="/status" 
                className="text-sm font-semibold text-on-surface-variant hover:text-navy transition-colors flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Track Order
              </Link>
            </div>
          </div>

          <div className="flex md:hidden items-center">
            <Link to="/status" className="p-2 rounded-full bg-surface-container text-navy hover:bg-navy hover:text-white transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="text-xs font-bold pr-2">Track</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
