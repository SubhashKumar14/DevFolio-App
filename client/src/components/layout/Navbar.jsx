import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { getDefaultRouteForRole } from '@/lib/roleRoutes';
import { getPublicProfilePath } from '@/lib/publicRoutes';
import { ThemeToggle } from './ThemeToggle';
import { BrandMark } from './BrandMark';

export function Navbar({ onMenuClick, isMobileMenuOpen = false }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLanding = location.pathname === '/';
  const userId = user?._id;
  const dashboardPath = getDefaultRouteForRole(user?.role);
  const publicProfilePath = getPublicProfilePath(user);

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const avatarUrl = profile?.avatarUrl || null;
  const avatarFallback = user?.displayName?.[0]?.toUpperCase() || 'U';

  return (
    <header className="dv-nav fixed top-0 z-50 w-full border-b">
      <div className="dv-nav-inner mx-auto flex items-center justify-between px-5 sm:px-8 gap-5">
        <div className="flex items-center gap-3">
          {isDashboard && (
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-card-elevated"
              onClick={onMenuClick}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="dashboard-mobile-nav"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          )}
          <BrandMark />
        </div>
        {isLanding && (
          <nav className="hidden lg:flex items-center gap-8" aria-label="Website sections">
            <a href="#features" className="text-sm text-muted hover:text-foreground">What it does</a>
            <a href="#how-it-works" className="text-sm text-muted hover:text-foreground">How it works</a>
            <Link to="/design-studio" className="text-sm text-muted hover:text-foreground">Design studio</Link>
          </nav>
        )}
        <nav className="ml-auto flex items-center gap-2 sm:gap-3" aria-label="Account navigation">
          {isAuthenticated ? (
            <>
              {!isDashboard && <Link className="dv-nav-action hidden sm:inline-flex" to={dashboardPath}>Workspace</Link>}
              <button type="button" className="dv-nav-action hidden sm:inline-flex" onClick={logout}>Sign out</button>
              {publicProfilePath && (
                <Link to={publicProfilePath} title="View your public profile" aria-label="View your public profile" className="shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-border" />
                  ) : (
                    <span className="h-9 w-9 rounded-full border border-border bg-card-elevated grid place-items-center text-sm font-bold text-accent-cyan">{avatarFallback}</span>
                  )}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="dv-nav-action hidden sm:inline-flex">Log in</Link>
              <Link to="/register" className="dv-nav-cta">
                Start free <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
