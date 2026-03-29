import { useMemo } from 'react';
import { Flame } from 'lucide-react';

/**
 * Calculate consecutive activity streak from heatmap data.
 */
function calculateStreak(
  githubCalendar = [],
  leetcodeCalendar = [],
  codeforcesCalendar = [],
  hackerrankCalendar = [],
  codechefCalendar = [],
  kaggleCalendar = [],
  gfgCalendar = [],
  atcoderCalendar = [],
  stackoverflowCalendar = [],
  hackerearthCalendar = [],
  huggingfaceCalendar = [],
  tryhackmeCalendar = [],
  codesignalCalendar = [],
  devtoCalendar = [],
  gitlabCalendar = []
) {
  // Build date->activity map
  const activityMap = new Map();
  githubCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  leetcodeCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  codeforcesCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  hackerrankCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  codechefCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  kaggleCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  gfgCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  atcoderCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  stackoverflowCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  hackerearthCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  huggingfaceCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  tryhackmeCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  codesignalCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  devtoCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
  });
  gitlabCalendar.forEach((d) => {
    activityMap.set(d.date, (activityMap.get(d.date) || 0) + (d.count || 0));
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

export default function StreakCounter({
  githubCalendar = [],
  leetcodeCalendar = [],
  codeforcesCalendar = [],
  hackerrankCalendar = [],
  codechefCalendar = [],
  kaggleCalendar = [],
  gfgCalendar = [],
  atcoderCalendar = [],
  stackoverflowCalendar = [],
  hackerearthCalendar = [],
  huggingfaceCalendar = [],
  tryhackmeCalendar = [],
  codesignalCalendar = [],
  devtoCalendar = [],
  gitlabCalendar = [],
}) {
  const streak = useMemo(
    () => calculateStreak(
      githubCalendar,
      leetcodeCalendar,
      codeforcesCalendar,
      hackerrankCalendar,
      codechefCalendar,
      kaggleCalendar,
      gfgCalendar,
      atcoderCalendar,
      stackoverflowCalendar,
      hackerearthCalendar,
      huggingfaceCalendar,
      tryhackmeCalendar,
      codesignalCalendar,
      devtoCalendar,
      gitlabCalendar
    ),
    [
      githubCalendar,
      leetcodeCalendar,
      codeforcesCalendar,
      hackerrankCalendar,
      codechefCalendar,
      kaggleCalendar,
      gfgCalendar,
      atcoderCalendar,
      stackoverflowCalendar,
      hackerearthCalendar,
      huggingfaceCalendar,
      tryhackmeCalendar,
      codesignalCalendar,
      devtoCalendar,
      gitlabCalendar,
    ]
  );

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
