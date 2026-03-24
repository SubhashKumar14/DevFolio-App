import { useMemo, useState } from 'react';

const PLATFORM_COLORS = {
  github: { base: '#39d353', light: '#39d35330', label: 'GitHub' },
  leetcode: { base: '#ffa116', light: '#ffa11630', label: 'LeetCode' },
  codeforces: { base: '#3b82f6', light: '#3b82f630', label: 'Codeforces' },
};

const EMPTY_COLOR = '#161b22';
const CELL_SIZE = 13;
const CELL_GAP = 3;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDominantColor(ghCount, lcCount, cfCount) {
  const total = ghCount + lcCount + cfCount;
  if (total === 0) return EMPTY_COLOR;

  // Find the dominant platform
  const max = Math.max(ghCount, lcCount, cfCount);
  const platformCount = (ghCount > 0 ? 1 : 0) + (lcCount > 0 ? 1 : 0) + (cfCount > 0 ? 1 : 0);

  if (platformCount === 1) {
    // Single platform — use its color with intensity
    if (ghCount > 0) return getIntensity(PLATFORM_COLORS.github.base, total);
    if (lcCount > 0) return getIntensity(PLATFORM_COLORS.leetcode.base, total);
    return getIntensity(PLATFORM_COLORS.codeforces.base, total);
  }

  // Multiple platforms — blend based on contribution ratios
  const r = Math.round(
    (ghCount / total) * parseInt('39', 16) +
    (lcCount / total) * parseInt('ff', 16) +
    (cfCount / total) * parseInt('3b', 16)
  );
  const g = Math.round(
    (ghCount / total) * parseInt('d3', 16) +
    (lcCount / total) * parseInt('a1', 16) +
    (cfCount / total) * parseInt('82', 16)
  );
  const b = Math.round(
    (ghCount / total) * parseInt('53', 16) +
    (lcCount / total) * parseInt('16', 16) +
    (cfCount / total) * parseInt('f6', 16)
  );

  return getIntensity(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`, total);
}

function getIntensity(hexColor, count) {
  // Adjust opacity/brightness based on count
  if (count <= 0) return EMPTY_COLOR;
  const opacity = Math.min(0.3 + count * 0.15, 1);
  return `${hexColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

function buildYearGrid(githubCalendar = [], dsaActivity = []) {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setDate(oneYearAgo.getDate() + 1);

  // Build lookup maps
  const ghMap = new Map(githubCalendar.map((d) => [d.date, d.count || 0]));
  const lcMap = new Map();
  const cfMap = new Map();
  dsaActivity.forEach((d) => {
    if (d.leetcodeCount) lcMap.set(d.date, d.leetcodeCount);
    if (d.codeforcesCount) cfMap.set(d.date, d.codeforcesCount);
  });

  const weeks = [];
  let currentWeek = [];
  const startDay = oneYearAgo.getDay(); // 0=Sun

  // Pad first week
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  const d = new Date(oneYearAgo);
  while (d <= today) {
    const dateStr = d.toISOString().split('T')[0];
    const gh = ghMap.get(dateStr) || 0;
    const lc = lcMap.get(dateStr) || 0;
    const cf = cfMap.get(dateStr) || 0;

    currentWeek.push({
      date: dateStr,
      github: gh,
      leetcode: lc,
      codeforces: cf,
      total: gh + lc + cf,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return weeks;
}

function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d !== null);
    if (firstDay) {
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTH_NAMES[month], x: wi });
        lastMonth = month;
      }
    }
  });
  return labels;
}

export default function ActivityHeatmap({ githubCalendar = [], dsaActivity = [] }) {
  const [tooltip, setTooltip] = useState(null);

  const weeks = useMemo(() => buildYearGrid(githubCalendar, dsaActivity), [githubCalendar, dsaActivity]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const svgWidth = weeks.length * (CELL_SIZE + CELL_GAP) + 40;
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 30;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Activity</h3>
        <div className="flex items-center gap-4 text-xs text-muted">
          {Object.entries(PLATFORM_COLORS).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: val.base }} />
              {val.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-[#0d1117] border border-[#21262d] p-4">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
          role="img"
          aria-label="Activity contribution graph"
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={`${m.label}-${m.x}`}
              x={40 + m.x * (CELL_SIZE + CELL_GAP)}
              y={10}
              className="fill-[#8b949e]"
              fontSize="10"
              fontFamily="system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={16}
                y={22 + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
                className="fill-[#8b949e]"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
                textAnchor="end"
                dominantBaseline="central"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Grid cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) return null;
              const color = getDominantColor(day.github, day.leetcode, day.codeforces);
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={40 + wi * (CELL_SIZE + CELL_GAP)}
                  y={18 + di * (CELL_SIZE + CELL_GAP)}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={day.total > 0 ? color : EMPTY_COLOR}
                  stroke="#21262d"
                  strokeWidth={0.5}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      day,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#30363d] text-xs text-[#e6edf3] shadow-xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold mb-1">
            {new Date(tooltip.day.date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </div>
          {tooltip.day.total === 0 ? (
            <span className="text-[#8b949e]">No activity</span>
          ) : (
            <div className="space-y-0.5">
              {tooltip.day.github > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS.github.base }} />
                  GitHub: {tooltip.day.github} contributions
                </div>
              )}
              {tooltip.day.leetcode > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS.leetcode.base }} />
                  LeetCode: {tooltip.day.leetcode} submissions
                </div>
              )}
              {tooltip.day.codeforces > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PLATFORM_COLORS.codeforces.base }} />
                  Codeforces: {tooltip.day.codeforces} submissions
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
