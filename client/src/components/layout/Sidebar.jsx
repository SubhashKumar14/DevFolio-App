import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, LineChart, Calendar, Trophy, Settings,
  Target, GitCompare, Layers3, Eye, PenTool, PanelLeftClose, PanelLeftOpen,
  FolderGit2, Users, Shield,
} from 'lucide-react';

function NavGroup({ label, items, pathname, collapsed, onNavigate }) {
  if (!items.length) return null;

  return (
    <section className={cn('py-3', collapsed ? 'px-1' : 'px-3')} aria-label={label}>
      {!collapsed && <h2 className="dv-side-label mb-3 px-3">{label}</h2>}
      {collapsed && <div className="h-px bg-border my-2" aria-hidden="true" />}
      <nav aria-label={label} className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? 'page' : undefined}
            aria-label={item.name}
            title={collapsed ? item.name : undefined}
            className={cn('dv-side-link', collapsed && 'justify-center px-0')}
          >
            <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </section>
  );
}

export function Sidebar({ className, collapsed = false, onNavigate, onToggleCollapse }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'developer';
  const isDeveloperRole = role === 'developer' || role === 'mentor';
  const isRecruiterRole = role === 'recruiter';

  const mainNav = isDeveloperRole
    ? [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
        { name: 'Projects', href: '/dashboard/projects', icon: FolderGit2 },
        { name: 'Contests', href: '/dashboard/contests', icon: Calendar },
        { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
      ]
    : isRecruiterRole
      ? [{ name: 'Recruiter workspace', href: '/dashboard/recruiter', icon: Users }]
      : [{ name: 'Admin panel', href: '/dashboard/admin', icon: Shield }];

  const portfolioNav = isDeveloperRole
    ? [
        { name: 'Portfolio', href: '/dashboard/portfolio', icon: Eye },
        { name: 'Portfolio editor', href: '/portfolio/editor', icon: PenTool },
      ]
    : [];

  const toolsNav = isDeveloperRole
    ? [
        { name: 'Goals', href: '/dashboard/goals', icon: Target },
        { name: 'Compare', href: '/dashboard/compare', icon: GitCompare },
        { name: 'Wrapped', href: '/dashboard/wrapped', icon: Layers3 },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    : [
        ...(role === 'admin' ? [{ name: 'Recruiter workspace', href: '/dashboard/recruiter', icon: Users }] : []),
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];

  return (
    <div className={cn('pb-10', className)}>
      {onToggleCollapse && (
        <div className={cn('py-3', collapsed ? 'px-2' : 'px-5')}>
          <button
            type="button"
            className={cn('dv-side-link', collapsed ? 'justify-center px-0' : 'justify-between')}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {!collapsed && <span className="dv-side-label">Navigation</span>}
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      )}
      <NavGroup label="Workspace" items={mainNav} pathname={location.pathname} collapsed={collapsed} onNavigate={onNavigate} />
      <NavGroup label="Portfolio" items={portfolioNav} pathname={location.pathname} collapsed={collapsed} onNavigate={onNavigate} />
      <NavGroup label="Tools" items={toolsNav} pathname={location.pathname} collapsed={collapsed} onNavigate={onNavigate} />
      {!collapsed && (
        <div className="mx-6 mt-7 pt-6 border-t border-border">
          <p className="dv-side-label mb-2">Your workspace</p>
          <p className="text-xs text-muted leading-relaxed">Projects, metrics and your portfolio — kept together.</p>
        </div>
      )}
    </div>
  );
}
