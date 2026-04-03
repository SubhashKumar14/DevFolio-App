import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PLATFORMS } from '@/lib/constants';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_TIME = 'all';
const EMPTY_COLOR = 'var(--heatmap-empty)';
const CELL_SIZE = 11;
const CELL_GAP = 3;
const ROUNDING = 3;
const STRIPE_WIDTH = 2;
const FALLBACK_HSL = [220, 12, 52];

const ACTION_LABELS = {
  github: 'contributions',
  leetcode: 'submissions',
  codeforces: 'submissions',
  hackerrank: 'challenges',
  codechef: 'submissions',
  kaggle: 'events',
  huggingface: 'interactions',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  if (years.length) return years;
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

function computePercentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function computeIntensityCeiling(values) {
  if (!values.length) return 10;
  const p99 = computePercentile(values, 0.99);
  return Math.max(10, p99 || 10);
}

function getPlatformHsl(platformId) {
  const hsl = PLATFORMS[platformId]?.hsl;
  if (Array.isArray(hsl) && hsl.length === 3) return hsl;
  return FALLBACK_HSL;
}

function getActiveEntries(day, platformKeys) {
  return platformKeys
    .map((key) => ({ key, count: day[key] || 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

function formatDayLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildDayAriaLabel(day, platformKeys) {
  if (!day?.date) return 'Inactive day';

  const activeEntries = getActiveEntries(day, platformKeys);
  if (day.total <= 0 || activeEntries.length === 0) {
    return `${formatDayLabel(day.date)}: no activity`;
  }

  const breakdown = activeEntries
    .map((entry) => {
      const platformName = PLATFORMS[entry.key]?.name || entry.key;
      return `${platformName} ${entry.count}`;
    })
    .join(', ');

  return `${formatDayLabel(day.date)}: ${day.total} total activities. ${breakdown}`;
}

function circularMeanHue(weightedHues) {
  let x = 0;
  let y = 0;

  for (const entry of weightedHues) {
    const radians = (entry.hue * Math.PI) / 180;
    x += Math.cos(radians) * entry.weight;
    y += Math.sin(radians) * entry.weight;
  }

  if (x === 0 && y === 0) return weightedHues[0]?.hue || FALLBACK_HSL[0];

  let angle = (Math.atan2(y, x) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function mixActiveHsl(activeEntries) {
  if (!activeEntries.length) return FALLBACK_HSL;
  if (activeEntries.length === 1) return getPlatformHsl(activeEntries[0].key);

  const total = activeEntries.reduce((sum, entry) => sum + entry.count, 0);
  const weightedHues = [];
  let sat = 0;
  let light = 0;

  for (const entry of activeEntries) {
    const weight = entry.count / Math.max(1, total);
    const [h, s, l] = getPlatformHsl(entry.key);
    weightedHues.push({ hue: h, weight });
    sat += s * weight;
    light += l * weight;
  }

  return [circularMeanHue(weightedHues), sat, light];
}

function colorFromHslAndIntensity(hsl, intensity) {
  const [h, s, l] = hsl;
  const saturation = clamp(s * (0.5 + intensity * 0.5), 22, 98);
  const lightness = clamp(90 - intensity * 52 + (50 - l) * 0.08, 28, 90);
  return `hsl(${Math.round(h)} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

function getCellBackground(day, intensity, platformKeys) {
  if (!day || day.total <= 0 || intensity <= 0) {
    return { background: EMPTY_COLOR, striped: false };
  }

  const activeEntries = getActiveEntries(day, platformKeys);
  if (!activeEntries.length) {
    return { background: EMPTY_COLOR, striped: false };
  }

  if (activeEntries.length >= 4) {
    const [first, second] = activeEntries;
    const color1 = colorFromHslAndIntensity(getPlatformHsl(first.key), intensity);
    const color2 = colorFromHslAndIntensity(getPlatformHsl(second.key), intensity);

    return {
      background: `repeating-linear-gradient(45deg, ${color1} 0px, ${color1} ${STRIPE_WIDTH}px, ${color2} ${STRIPE_WIDTH}px, ${color2} ${STRIPE_WIDTH * 2}px)`,
      striped: true,
    };
  }

  const mixed = mixActiveHsl(activeEntries);
  return {
    background: colorFromHslAndIntensity(mixed, intensity),
    striped: false,
  };
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
    intensityCeiling: computeIntensityCeiling(totals),
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
  huggingfaceCalendar = [],
}) {
  const [tooltip, setTooltip] = useState(null);
  const [selectedYear, setSelectedYear] = useState(ALL_TIME);
  const tooltipRoot = typeof document !== 'undefined' ? document.body : null;

  const platformCalendars = useMemo(
    () => ({
      github: githubCalendar,
      leetcode: leetcodeCalendar,
      codeforces: codeforcesCalendar,
      hackerrank: hackerrankCalendar,
      codechef: codechefCalendar,
      kaggle: kaggleCalendar,
      huggingface: huggingfaceCalendar,
    }),
    [
      githubCalendar,
      leetcodeCalendar,
      codeforcesCalendar,
      hackerrankCalendar,
      codechefCalendar,
      kaggleCalendar,
      huggingfaceCalendar,
    ]
  );

  const { monthBlocks, intensityCeiling, platformKeys, years } = useMemo(
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
    <div
      className="rounded-xl border border-border bg-card p-4"
      role="group"
      aria-label="Cross-platform activity heatmap"
    >
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
        <div className="flex items-start" style={{ gap: '8px', minWidth: 'max-content' }} role="grid" aria-label="Daily contribution cells by month">
          {monthBlocks.map((monthBlock) => (
            <div
              key={monthBlock.key}
              className="flex shrink-0 flex-col items-start gap-2"
              role="group"
              aria-label={`${MONTH_NAMES[monthBlock.month]} activity`}
            >
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
                  const interactive = Boolean(day?.date);
                  const intensity = interactive
                    ? clamp((day.total || 0) / Math.max(1, intensityCeiling), 0, 1)
                    : 0;
                  const cellVisual = getCellBackground(day, intensity, platformKeys);

                  return (
                    <div
                      key={day?.date || `${monthBlock.key}-pad-${index}`}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        borderRadius: `${ROUNDING}px`,
                        background: cellVisual.background,
                        border: '1px solid var(--border)',
                      }}
                      className={interactive ? 'cursor-pointer transition-all duration-200 hover:border-foreground' : ''}
                      role={interactive ? 'button' : 'presentation'}
                      tabIndex={interactive ? 0 : -1}
                      aria-label={interactive ? buildDayAriaLabel(day, platformKeys) : undefined}
                      onMouseEnter={
                        interactive
                          ? (event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setTooltip({ x: rect.left + rect.width / 2, y: rect.top, day });
                            }
                          : undefined
                      }
                      onMouseLeave={interactive ? () => setTooltip(null) : undefined}
                      onFocus={
                        interactive
                          ? (event) => {
                              const rect = event.currentTarget.getBoundingClientRect();
                              setTooltip({ x: rect.left + rect.width / 2, y: rect.top, day });
                            }
                          : undefined
                      }
                      onBlur={interactive ? () => setTooltip(null) : undefined}
                      onKeyDown={
                        interactive
                          ? (event) => {
                              if (event.key === 'Escape') {
                                setTooltip(null);
                                return;
                              }

                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                const rect = event.currentTarget.getBoundingClientRect();
                                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, day });
                              }
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              <span className="text-[11px] leading-none text-muted dark:text-[#8b949e]">{MONTH_NAMES[monthBlock.month]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted dark:text-[#8b949e]">
          <span>Less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((intensityValue) => (
            <span
              key={intensityValue}
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-[3px] border border-white/5"
              style={{ backgroundColor: colorFromHslAndIntensity([210, 13, 47], intensityValue) }}
            />
          ))}
          <span>More</span>
          <span className="ml-2 rounded border border-border px-1.5 py-0.5">Striped = 4+ platforms</span>
        </div>

        <p className="sr-only" aria-live="polite">
          {tooltip
            ? buildDayAriaLabel(tooltip.day, platformKeys)
            : `${summary.totalActivities} total activities across ${summary.activeDays} active days in ${selectedYearLabel.toLowerCase()}.`}
        </p>
      </div>

      {tooltip && tooltipRoot && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] rounded-lg border border-border glass-card px-4 py-3 text-sm text-foreground shadow-xl transition-all"
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
              {getActiveEntries(tooltip.day, platformKeys).map((entry) => {
                const platform = PLATFORMS[entry.key];
                if (!platform) return null;

                const actionType = ACTION_LABELS[entry.key] || 'events';
                const label = entry.count === 1 && actionType.endsWith('s')
                  ? actionType.slice(0, -1)
                  : actionType;

                return (
                  <div key={entry.key} className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: platform.color }} />
                    <span>
                      {platform.name}: <span className="text-foreground">{entry.count} {label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>,
        tooltipRoot
      )}
    </div>
  );
}