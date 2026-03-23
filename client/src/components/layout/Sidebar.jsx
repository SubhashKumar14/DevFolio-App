import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Trophy, Settings, Calendar, LineChart, Code2, Target, GitCompare, Sparkles, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
  { name: 'Contests', href: '/dashboard/contests', icon: Calendar },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Portfolio', href: '/portfolio/editor', icon: FileCode },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const roadmapItems = [
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Compare', href: '/dashboard/compare', icon: GitCompare },
  { name: 'DevFolio Wrapped', href: '/dashboard/wrapped', icon: Sparkles },
];

export function Sidebar({ className }) {
  const location = useLocation();

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted uppercase">
            Overview
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} to={item.href}>
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
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted uppercase flex items-center gap-2">
            Roadmap <span className="bg-accent-purple/20 text-accent-purple text-[10px] px-1.5 py-0.5 rounded ml-1">Beta</span>
          </h2>
          <div className="space-y-1">
            {roadmapItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={location.pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
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
      </div>
    </div>
  );
}