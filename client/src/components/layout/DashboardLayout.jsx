import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Code2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function DashboardLayout() {
  const userRole = useAuthStore((state) => state.user?.role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dashboardSidebarCollapsed') === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dashboardSidebarCollapsed', isSidebarCollapsed ? '1' : '0');
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  const footerLabel = userRole === 'recruiter'
    ? 'Recruiter Workspace'
    : userRole === 'admin'
      ? 'Admin Workspace'
      : 'DevFolio Dashboard';

  const footerDescription = userRole === 'recruiter'
    ? 'Discover and evaluate candidates using role-aware filters'
    : userRole === 'admin'
      ? 'Manage users, governance, and platform operations'
      : 'Track core coding platforms with a unified DevScore';

  const footerSummary = userRole === 'recruiter'
    ? 'Recruiter tools only · Role-filtered navigation'
    : userRole === 'admin'
      ? 'Admin tools only · Role-filtered navigation'
      : 'All metrics tracked · All scores earned';

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar
        onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div
        className={`flex-1 pt-16 items-start md:grid ${isSidebarCollapsed
          ? 'md:grid-cols-[86px_minmax(0,1fr)] lg:grid-cols-[92px_minmax(0,1fr)]'
          : 'md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]'}`}
      >
        {/* Desktop Sidebar */}
        <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
          <div className={`h-full py-6 lg:py-8 border-r border-border bg-card ${isSidebarCollapsed ? 'px-2' : 'pl-8 pr-6'}`}>
            <Sidebar
              collapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          </div>
        </aside>

        {/* Mobile Menu Backdrop & Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              id="dashboard-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              className="relative h-full w-3/4 max-w-sm border-r border-border bg-card p-6 shadow-xl"
            >
              <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 flex-col">
          <div className="container mx-auto flex w-full min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </div>

          <footer className="mt-auto shrink-0 border-t border-border bg-card/35 px-4 py-4 sm:px-6 lg:px-8">
            <div className="container mx-auto flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-accent-cyan" />
                <span className="text-foreground">{footerLabel}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{footerDescription}</span>
              </div>
              <span>{footerSummary}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}