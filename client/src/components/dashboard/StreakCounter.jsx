import { useMemo } from 'react';
import { Flame } from 'lucide-react';

/**
 * Calculate consecutive activity streak from heatmap data.
 */
function calculateStreak(githubCalendar = [], dsaActivity = []) {
  // Build date→activity map
  const activityMap = new Map();
  githubCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  dsaActivity.forEach((d) => {
    const total = (d.leetcodeCount || 0) + (d.codeforcesCount || 0);
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + total);
  });

  // Walk backwards from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let d = new Date(today);

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if ((activityMap.get(dateStr) || 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function StreakCounter({ githubCalendar = [], dsaActivity = [] }) {
  const streak = useMemo(() => calculateStreak(githubCalendar, dsaActivity), [githubCalendar, dsaActivity]);

  const flameColor = streak >= 30 ? 'text-red-500' : streak >= 7 ? 'text-orange-400' : streak >= 1 ? 'text-yellow-400' : 'text-muted/40';

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
      <Flame className={`h-6 w-6 ${flameColor} ${streak >= 7 ? 'animate-pulse' : ''}`} />
      <div>
        <div className="text-xl font-bold tabular-nums">{streak}</div>
        <div className="text-xs text-muted">Day{streak !== 1 ? 's' : ''} Streak</div>
      </div>
    </div>
  );
}
