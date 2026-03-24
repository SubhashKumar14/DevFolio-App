import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, LineChart, Calendar, Trophy, Settings,
  FileCode, Target, GitCompare, Sparkles, Eye, PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar({ className }) {
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
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const NavGroup = ({ label, items, badge }) => (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted uppercase flex items-center gap-2">
        {label}
        {badge && (
          <span className="bg-accent-purple/20 text-accent-purple text-[10px] px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </h2>
      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant={location.pathname === item.href ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-2",
                location.pathname === item.href && "bg-card-elevated text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <NavGroup label="Main" items={mainNav} />
        <NavGroup label="Portfolio" items={portfolioNav} />
        <NavGroup label="Tools" items={toolsNav} badge="Beta" />
      </div>
    </div>
  );
}