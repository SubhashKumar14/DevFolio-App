import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Code2, Menu } from 'lucide-react';

export function Navbar({ onMenuClick }) {
  const { isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile menu button via onMenuClick when in dashboard */}
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

          <Link to="/" className="flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-accent-cyan" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              DevFolio
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors hidden sm:block">
                  Login
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            ) : (
              <>
                {!isDashboard && (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={logout}>
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