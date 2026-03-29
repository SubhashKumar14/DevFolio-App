import { useMemo, useState } from 'react';
import { PLATFORMS } from '@/lib/constants';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_TIME = 'all';
const EMPTY_COLOR = 'var(--heatmap-empty)';
const BASE_RGB = [40, 40, 40];
const LEVEL_TINT = [0, 0.35, 0.6, 0.8, 1];
const CELL_SIZE = 11;
const CELL_GAP = 3;
const ROUNDING = 3;

function tintRgb(rgb, level) {
  const tint = LEVEL_TINT[level];
  return [
    BASE_RGB[0] + (rgb[0] - BASE_RGB[0]) * tint,
    BASE_RGB[1] + (rgb[1] - BASE_RGB[1]) * tint,
    BASE_RGB[2] + (rgb[2] - BASE_RGB[2]) * tint,
  ];
}

function getActiveEntries(day, platformKeys) {
  return platformKeys
    .map((key) => ({ key, count: day[key] || 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

function toSafeCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeCalendar(list = []) {
  const normalized = [];
  for (const item of list) {
    if (!item?.date) continue;
    normalized.push({ date: item.date, count: toSafeCount(item.count) });
  }
  return normalized;
}

function getYearFromDate(date) {
  return new Date(`${date}T00:00:00`).getFullYear();
}

function getAvailableYears(allDates = []) {
  const years = [...new Set(allDates.map((date) => getYearFromDate(date)))].sort((a, b) => b - a);
  if (years.length) {
    return years;
  }
  return [new Date().getFullYear()];
}

function getCalendarBounds(allDates, selectedYear) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedYear !== ALL_TIME) {
    const year = Number(selectedYear);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (allDates.length > 0) {
    const start = new Date(`${allDates[0]}T00:00:00`);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return { start, end: today };
  }

  const currentYear = today.getFullYear();
  const start = new Date(currentYear, 0, 1);
  const end = new Date(currentYear, 11, 31);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

function toHex([r, g, b]) {
  const hex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function computeQuartiles(values) {
  if (!values.length) return { q1: 0, q2: 0, q3: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return { q1: pick(0.25), q2: pick(0.5), q3: pick(0.75) };
}

function getLevel(total, quartiles) {
  if (total <= 0) return 0;
  if (total <= quartiles.q1) return 1;
  if (total <= quartiles.q2) return 2;
  if (total <= quartiles.q3) return 3;
  return 4;
}

function blendColor(day, level, platformKeys) {
  if (day.total <= 0 || level === 0) return EMPTY_COLOR;

  let blendR = 0;
  let blendG = 0;
  let blendB = 0;

  for (const key of platformKeys) {
    const count = day[key] || 0;
    if (!count) continue;
    const pRGB = PLATFORMS[key]?.rgb || [100, 100, 100];
    blendR += pRGB[0] * count;
    blendG += pRGB[1] * count;
    blendB += pRGB[2] * count;
  }

  const mixed = [blendR / day.total, blendG / day.total, blendB / day.total];
  return toHex(tintRgb(mixed, level));
}

function buildGradientStops(day, level, platformKeys) {
  const activeEntries = getActiveEntries(day, platformKeys);
  if (activeEntries.length < 2) {
    return null;
  }

  let acc = 0;
  const stops = [];

  for (const entry of activeEntries) {
    const platform = PLATFORMS[entry.key];
    if (!platform?.rgb) {
      continue;
    }

    const start = (acc / day.total) * 100;
    acc += entry.count;
    const end = (acc / day.total) * 100;
    const color = toHex(tintRgb(platform.rgb, level));

    stops.push({ offset: start, color });
    stops.push({ offset: end, color });
  }

  return stops.length ? stops : null;
}

function getCellBackground(day, level, platformKeys) {
  if (!day || day.total <= 0 || level === 0) {
    return EMPTY_COLOR;
  }

  const stops = buildGradientStops(day, level, platformKeys);
  if (!stops) {
    return blendColor(day, level, platformKeys);
  }

  return `linear-gradient(90deg, ${stops
    .map((stop) => `${stop.color} ${stop.offset.toFixed(2)}%`)
    .join(', ')})`;
}

function buildHeatmapData(platformCalendars, selectedYear = ALL_TIME) {
  const platformKeys = Object.keys(platformCalendars);
  const normalizedCalendars = {};
  const allDates = [];

  for (const key of platformKeys) {
    normalizedCalendars[key] = normalizeCalendar(platformCalendars[key]);
    for (const item of normalizedCalendars[key]) {
      allDates.push(item.date);
    }
  }

  allDates.sort();

  const years = getAvailableYears(allDates);
  const { start, end } = getCalendarBounds(allDates, selectedYear);

  const dayMap = new Map();
  const ensureDay = (date) => {
    if (!dayMap.has(date)) {
      const base = { date, total: 0 };
      for (const key of platformKeys) base[key] = 0;
      dayMap.set(date, base);
    }
    return dayMap.get(date);
  };

  for (const key of platformKeys) {
    for (const item of normalizedCalendars[key]) {
      const day = ensureDay(item.date);
      day[key] += item.count;
      day.total += item.count;
    }
  }

  const totals = [];
  const monthBlocks = [];
  const monthCursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (monthCursor <= finalMonth) {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);

    const visibleStart = monthStart < start ? new Date(start) : monthStart;
    const visibleEnd = monthEnd > end ? new Date(end) : monthEnd;

    if (visibleStart <= visibleEnd) {
      const cells = [];
      const leadingSlots = visibleStart.getDay();

      for (let i = 0; i < leadingSlots; i += 1) {
        cells.push({ date: null, total: 0 });
      }

      const dayCursor = new Date(visibleStart);
      while (dayCursor <= visibleEnd) {
        const date = dayCursor.toISOString().slice(0, 10);
        const day = dayMap.get(date) || ensureDay(date);
        if (day.total > 0) totals.push(day.total);
        cells.push(day);
        dayCursor.setDate(dayCursor.getDate() + 1);
      }

      const trailingSlots = (7 - (cells.length % 7)) % 7;
      for (let i = 0; i < trailingSlots; i += 1) {
        cells.push({ date: null, total: 0 });
      }

      monthBlocks.push({
        key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
        month: monthStart.getMonth(),
        cells,
      });
    }

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return {
    monthBlocks,
    quartiles: computeQuartiles(totals),
    platformKeys,
    years,
  };
}

export default function ActivityHeatmap({
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
  const [tooltip, setTooltip] = useState(null);
  const [selectedYear, setSelectedYear] = useState(ALL_TIME);

  const platformCalendars = useMemo(
    () => ({
      github: githubCalendar,
      leetcode: leetcodeCalendar,
      codeforces: codeforcesCalendar,
      hackerrank: hackerrankCalendar,
      codechef: codechefCalendar,
      kaggle: kaggleCalendar,
      geeksforgeeks: gfgCalendar,
      atcoder: atcoderCalendar,
      stackoverflow: stackoverflowCalendar,
      hackerearth: hackerearthCalendar,
      huggingface: huggingfaceCalendar,
      tryhackme: tryhackmeCalendar,
      codesignal: codesignalCalendar,
      devto: devtoCalendar,
      gitlab: gitlabCalendar,
    }),
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

  const { monthBlocks, quartiles, platformKeys, years } = useMemo(
    () => buildHeatmapData(platformCalendars, selectedYear),
    [platformCalendars, selectedYear]
  );

  const selectedYearLabel = selectedYear === ALL_TIME ? 'All time' : selectedYear;

  const summary = useMemo(() => {
    let totalActivities = 0;
    let activeDays = 0;

    for (const monthBlock of monthBlocks) {
      for (const day of monthBlock.cells) {
        if (!day || day.total <= 0) continue;
        totalActivities += day.total;
        activeDays += 1;
      }
    }

    return { totalActivities, activeDays };
  }, [monthBlocks]);

  const activeLegendKeys = useMemo(
    () => platformKeys.filter((key) => (platformCalendars[key] || []).length > 0 && PLATFORMS[key]),
    [platformKeys, platformCalendars]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {summary.totalActivities} activities in {selectedYearLabel.toLowerCase()}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Active days: {summary.activeDays}</span>
          <label className="flex items-center gap-2 rounded-md border border-border bg-card-elevated px-2.5 py-1.5 dark:border-[#30363d] dark:bg-[#0d1117]/90">
            <span className="font-semibold uppercase tracking-wide text-muted">Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="min-w-[88px] rounded border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none transition-colors focus:border-accent-cyan dark:border-[#30363d] dark:bg-[#0d1117] dark:text-[#e6edf3]"
              style={{ colorScheme: 'light dark' }}
              aria-label="Select activity year"
            >
              <option value={ALL_TIME} style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                All time
              </option>
              {years.map((year) => (
                <option key={year} value={year} style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Platforms</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {(activeLegendKeys.length ? activeLegendKeys : ['github', 'leetcode', 'codeforces']).map((key) => {
            const platform = PLATFORMS[key];
            if (!platform) return null;
            return (
              <span key={key} className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: platform.color }} />
                {platform.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card-elevated p-3 dark:border-[#21262d] dark:bg-[#0d1117]">
        <div className="flex items-start" style={{ gap: '8px', minWidth: 'max-content' }}>
          {monthBlocks.map((monthBlock) => (
            <div key={monthBlock.key} className="flex shrink-0 flex-col items-start gap-2">
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                  gridAutoFlow: 'column',
                  gridAutoColumns: `${CELL_SIZE}px`,
                  gap: `${CELL_GAP}px`,
                }}
              >
                {monthBlock.cells.map((day, index) => {
                  const level = getLevel(day?.total || 0, quartiles);
                  const background = getCellBackground(day, level, platformKeys);
                  const interactive = Boolean(day?.date);

                  return (
                    <div
                      key={day?.date || `${monthBlock.key}-pad-${index}`}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        borderRadius: `${ROUNDING}px`,
                        background,
                        border: '1px solid var(--border)',
                      }}
                      className={interactive ? 'cursor-pointer transition-all duration-200 hover:border-foreground' : ''}
                      onMouseEnter={
                        interactive
                          ? (event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setTooltip({ x: rect.left + rect.width / 2, y: rect.top, day });
                            }
                          : undefined
                      }
                      onMouseLeave={interactive ? () => setTooltip(null) : undefined}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] leading-none text-muted dark:text-[#8b949e]">{MONTH_NAMES[monthBlock.month]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted dark:text-[#8b949e]">
          <span>Less</span>
          {[1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block h-2.5 w-2.5 rounded-[3px] border border-white/5"
              style={{ backgroundColor: toHex(tintRgb([57, 211, 83], level)) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border glass-card px-4 py-3 text-sm text-foreground shadow-xl transition-all"
          style={{ left: tooltip.x, top: tooltip.y - 12, transform: 'translate(-50%, -100%)' }}
        >
          <div className="mb-2 font-bold text-foreground">
            {new Date(`${tooltip.day.date}T00:00:00`).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          {tooltip.day.total === 0 ? (
            <span className="text-muted">No activity</span>
          ) : (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-accent-cyan">Total: {tooltip.day.total}</div>
              {platformKeys.map((key) => {
                const platform = PLATFORMS[key];
                if (!platform) return null;
                return tooltip.day[key] > 0 ? (
                  <div key={key} className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: platform.color }} />
                    {platform.name}: <span className="text-foreground">{tooltip.day[key]}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
