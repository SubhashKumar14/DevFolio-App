import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PLATFORMS } from '@/lib/constants';
import { ArrowRight, RefreshCw, Code2 } from 'lucide-react';

export function PlatformCard({ platform, onSync, isSyncing, readonly = false }) {
  const meta = PLATFORMS[platform.id] || {
    name: platform.id || 'Platform',
    color: '#9ca3af',
    icon: Code2,
  };
  const Icon = meta.icon;

  return (
    <Card className="flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-slide-up">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${meta.color}20` }}>
              <Icon className="h-5 w-5" style={{ color: meta.color }} />
            </div>
            <div>
              <CardTitle className="text-lg">{meta.name}</CardTitle>
              <p className="text-sm text-muted">@{platform.username}</p>
            </div>
          </div>
          {!readonly && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSync && onSync(platform.id)}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 text-muted ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Primary Stat</p>
            <p className="text-2xl font-bold">{platform.primaryStat || '0'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">Rating</p>
            <p className="text-2xl font-bold">{platform.rating || 'N/A'}</p>
          </div>
        </div>

        {/* Visual Bar Breakdown (e.g. Easy/Med/Hard) */}
        {platform.breakdown && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{platform.breakdown.label1}</span>
              <span>{platform.breakdown.label2}</span>
              <span>{platform.breakdown.label3}</span>
            </div>
            <div className="h-2 flex rounded-full overflow-hidden w-full bg-card-elevated">
              <div style={{ width: `${platform.breakdown.pct1}%`, backgroundColor: 'var(--accent-green)' }} />
              <div style={{ width: `${platform.breakdown.pct2}%`, backgroundColor: 'var(--accent-orange)' }} />
              <div style={{ width: `${platform.breakdown.pct3}%`, backgroundColor: 'var(--accent-red)' }} />
            </div>
          </div>
        )}
      </CardContent>

      {!readonly && (
        <CardFooter className="pt-2 border-t border-border mt-auto">
          <Button variant="ghost" className="w-full justify-between text-muted hover:text-foreground" asChild>
            <Link to={`/dashboard/analytics?platform=${encodeURIComponent(platform.id)}`}>
              View Full Stats
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}