import { useQuery } from '@tanstack/react-query';
import { contestService } from '@/services/contestService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, ExternalLink, Timer, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const PLATFORM_STYLE = {
  codeforces: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Codeforces' },
  leetcode: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'LeetCode' },
};

function Countdown({ startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(startTime) - Date.now();
      if (diff <= 0) { setTimeLeft('Started'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="font-mono text-sm text-accent-cyan">{timeLeft}</span>;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function ContestsPage() {
  const { data: contests = [], isLoading, error } = useQuery({
    queryKey: ['upcomingContests'],
    queryFn: () => contestService.getUpcomingContests(),
    staleTime: 5 * 60 * 1000,
  });

  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? contests : contests.filter((c) => c.platform === filter);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-accent-cyan" />
            Upcoming Contests
          </h1>
          <p className="text-muted mt-1">Never miss a coding competition across your favorite platforms.</p>
        </div>
        <div className="flex gap-2">
          {['all', 'codeforces', 'leetcode'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'all' ? 'All' : PLATFORM_STYLE[f]?.label || f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
        </div>
      ) : error ? (
        <Card className="border-dashed border-accent-red/30">
          <CardContent className="py-12 text-center text-muted">
            Failed to load contests. Please try again later.
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-accent-cyan/30">
          <CardContent className="py-12 text-center text-muted">
            No upcoming contests found for this platform.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((contest, i) => {
            const style = PLATFORM_STYLE[contest.platform] || PLATFORM_STYLE.codeforces;
            return (
              <Card
                key={`${contest.platform}-${contest.name}-${i}`}
                className="animate-slide-up hover:border-accent-cyan/30 transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Platform Badge */}
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${style.bg} ${style.text} border ${style.border} shrink-0`}>
                      {style.label}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{contest.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted mt-1.5">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(contest.startTime)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(contest.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted mb-0.5 flex items-center gap-1">
                        <Timer className="h-3 w-3" /> Starts in
                      </div>
                      <Countdown startTime={contest.startTime} />
                    </div>
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a href={contest.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
