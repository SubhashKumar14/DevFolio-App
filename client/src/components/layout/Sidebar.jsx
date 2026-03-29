import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, LineChart, Calendar, Trophy, Settings,
  Target, GitCompare, Sparkles, Eye, PenTool, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function NavGroup({ label, items, badge, pathname, collapsed, onNavigate }) {
  if (!items.length) return null;

  return (
    <div className={cn('py-2', collapsed ? 'px-1' : 'px-3')}>
      {collapsed ? (
        <div className="mb-2 px-2">
          <div className="h-px w-full bg-border/70" />
          <span className="sr-only">{label}</span>
        </div>
      ) : (
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted uppercase flex items-center gap-2">
          {label}
          {badge && (
            <span className="bg-accent-purple/20 text-accent-purple text-[10px] px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </h2>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} to={item.href} onClick={onNavigate}>
            <Button
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={cn(
                'w-full',
                collapsed ? 'justify-center px-0 h-10' : 'justify-start gap-2',
                pathname === item.href && 'bg-card-elevated text-foreground'
              )}
              title={collapsed ? item.name : undefined}
              aria-label={item.name}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && item.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ className, collapsed = false, onNavigate, onToggleCollapse }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const isRecruiter = user?.role === 'recruiter';

  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
    { name: 'Contests', href: '/dashboard/contests', icon: Calendar },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  ];

  const portfolioNav = [
    { name: 'Portfolio Preview', href: '/dashboard/portfolio', icon: Eye },
    ...(!isRecruiter ? [{ name: 'Portfolio Editor', href: '/portfolio/editor', icon: PenTool }] : []),
  ];

  const toolsNav = [
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Compare', href: '/dashboard/compare', icon: GitCompare },
    { name: 'Wrapped', href: '/dashboard/wrapped', icon: Sparkles },
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', href: '/dashboard/admin', icon: Settings }] : []),
    ...(user?.role === 'recruiter' ? [{ name: 'Recruiter', href: '/dashboard/recruiter', icon: Settings }] : []),
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        {onToggleCollapse && (
          <div className={cn('pb-2', collapsed ? 'px-1' : 'px-3')}>
            <Button
              type="button"
              variant="ghost"
              className={cn('w-full', collapsed ? 'justify-center px-0 h-10' : 'justify-between gap-2')}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : undefined}
            >
              {!collapsed && <span className="text-xs uppercase tracking-tight text-muted">Navigation</span>}
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <NavGroup
          label="Main"
          items={mainNav}
          pathname={location.pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Portfolio"
          items={portfolioNav}
          pathname={location.pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Tools"
          items={toolsNav}
          badge="Beta"
          pathname={location.pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}