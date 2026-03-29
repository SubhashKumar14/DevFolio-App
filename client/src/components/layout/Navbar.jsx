import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Code2, Menu, Sparkles } from 'lucide-react';

export function Navbar({ onMenuClick }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLanding = location.pathname === '/';

  return (
    <nav className={`fixed top-0 z-50 w-full border-b border-border ${isLanding ? 'bg-background/60' : 'bg-card/80'} backdrop-blur-xl supports-[backdrop-filter]:bg-card/60`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {isDashboard && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Code2 className="h-7 w-7 text-accent-cyan transition-transform group-hover:scale-110 duration-300" />
              <div className="absolute -inset-1 bg-accent-cyan/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:inline-block">
              Dev<span className="text-accent-cyan">Folio</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <nav className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="rounded-full px-5 font-semibold shadow-lg shadow-accent-cyan/20">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {!isDashboard && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                )}
                {user?.displayName && (
                  <Link to={`/p/${encodeURIComponent(user.displayName)}`} target="_blank">
                    <Button variant="ghost" size="sm">Public Profile</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={logout} className="rounded-full">
                  Logout
                </Button>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </nav>
  );
}