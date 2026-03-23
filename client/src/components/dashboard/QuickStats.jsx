import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function QuickStats({ stats }) {
  if (!stats) return null;

  const items = [
    { label: 'Problems Solved', value: stats.totalProblemsSolved, change: '+12%', trend: 'up' },
    { label: 'Repositories', value: stats.totalRepos, change: '+2', trend: 'up' },
    { label: 'Active Platforms', value: stats.activePlatforms, change: '0', trend: 'neutral' },
    { label: 'Current Streak', value: `${stats.currentStreak} days`, change: 'Personal best!', trend: 'up' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted mb-1">{item.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{item.value}</h3>
              <span className={`flex items-center text-xs font-medium ${
                item.trend === 'up' ? 'text-accent-green' : 
                item.trend === 'down' ? 'text-accent-red' : 
                'text-muted'
              }`}>
                {item.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                {item.trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                {item.trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
                {item.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}