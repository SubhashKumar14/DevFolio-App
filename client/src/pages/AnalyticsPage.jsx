import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { scoreService } from '@/services/scoreService';
import { statsService } from '@/services/statsService';
import { PLATFORMS } from '@/lib/constants';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#f97316'];
const OVERVIEW_PLATFORM_ORDER = ['leetcode', 'github', 'codeforces', 'hackerrank', 'codechef', 'kaggle', 'huggingface'];

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Rust: '#dea584',
  Go: '#00ADD8',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Jupyter: '#DA5B0B',
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseStarsCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const raw = String(value || '');
  const parsed = parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return (raw.match(/★/g) || []).length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) return null;
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function daysBetween(fromDateKey, toDateKeyValue) {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKeyValue);
  if (!from || !to) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

function relativeTimeLabel(timestamp) {
  if (!timestamp) return 'never';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const elapsedMs = Date.now() - date.getTime();
  const minutes = Math.floor(elapsedMs / (60 * 1000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMetricValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'N/A';
    if (Math.abs(value) >= 1000 || Number.isInteger(value)) {
      return `${Math.round(value).toLocaleString()}${suffix}`;
    }
    return `${value.toFixed(1)}${suffix}`;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return `${value}${suffix}`;
}

function formatMetricLabel(key) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function scoreBandLabel(score) {
  if (score >= 850) return 'Elite';
  if (score >= 700) return 'Proficient';
  if (score >= 550) return 'Emerging';
  return 'Starter';
}

function monthStartKey(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return null;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return toDateKey(start);
}

function weekStartKey(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return null;
  const dayOfWeek = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayOfWeek);
  return toDateKey(date);
}

function buildLast12MonthsSeries(dailySeries = []) {
  const now = new Date();
  const buckets = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: toDateKey(monthDate),
      label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      total: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const entry of dailySeries) {
    const dateKey = String(entry?.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const key = monthStartKey(dateKey);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.total += toNumber(entry?.count);
  }

  return buckets;
}

function buildLast12WeeksSeries(dailySeries = []) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const currentWeekStart = new Date(today);
  const dayOfWeek = (today.getUTCDay() + 6) % 7;
  currentWeekStart.setUTCDate(today.getUTCDate() - dayOfWeek);

  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setUTCDate(currentWeekStart.getUTCDate() - i * 7);
    buckets.push({
      key: toDateKey(weekStart),
      label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const entry of dailySeries) {
    const dateKey = String(entry?.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const key = weekStartKey(dateKey);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.total += toNumber(entry?.count);
  }

  return buckets;
}

function getPlatformCalendar(platformId, platformDataMap) {
  const data = platformDataMap[platformId] || {};
  if (platformId === 'github') return asArray(data.contributionCalendar);
  if (platformId === 'leetcode') return asArray(data.dailyActivity);
  if (platformId === 'codeforces') return asArray(data.dailySubmissions);
  return asArray(data.dailyActivity);
}

function getPlatformTrendData(platformId, platformData, platformCalendar) {
  if (platformId === 'codeforces') {
    const ratingHistory = asArray(platformData?.ratingHistory);
    return ratingHistory.slice(-20).map((entry, index) => ({
      name: String(entry?.contestName || `Contest ${index + 1}`).slice(0, 14),
      value: toNumber(entry?.newRating),
    }));
  }

  return buildLast12MonthsSeries(platformCalendar).map((entry) => ({
    name: entry.label,
    value: entry.total,
  }));
}

function platformProfileUrl(platformId, user, data) {
  switch (platformId) {
    case 'github':
      return data?.githubProfileUrl || (user?.githubUsername ? `https://github.com/${user.githubUsername}` : null);
    case 'leetcode':
      return user?.leetcodeUsername ? `https://leetcode.com/${user.leetcodeUsername}` : null;
    case 'codeforces':
      return user?.codeforcesUsername ? `https://codeforces.com/profile/${user.codeforcesUsername}` : null;
    case 'codechef':
      return user?.codechefUsername ? `https://www.codechef.com/users/${user.codechefUsername}` : null;
    case 'kaggle':
      return user?.kaggleUsername ? `https://www.kaggle.com/${user.kaggleUsername}` : null;
    case 'huggingface':
      return data?.profileUrl || (user?.huggingfaceUsername ? `https://huggingface.co/${user.huggingfaceUsername}` : null);
    case 'hackerrank':
      return user?.hackerrankUsername ? `https://www.hackerrank.com/profile/${user.hackerrankUsername}` : null;
    default:
      return null;
  }
}

function getPlatformMetrics(platformId, data) {
  switch (platformId) {
    case 'leetcode':
      return [
        { label: 'Total Solved', value: data?.totalSolved },
        { label: 'Easy Solved', value: data?.easySolved },
        { label: 'Medium Solved', value: data?.mediumSolved },
        { label: 'Hard Solved', value: data?.hardSolved },
        { label: 'Contest Rating', value: data?.contestRating },
        { label: 'Global Contest Rank', value: data?.contestGlobalRanking },
        { label: 'Top Percentage', value: data?.topPercentage, suffix: '%' },
        { label: 'Current Streak', value: data?.currentStreak, suffix: ' days' },
        { label: 'Longest Streak', value: data?.maxStreak, suffix: ' days' },
        { label: 'Acceptance Rate', value: data?.acceptanceRate, suffix: '%' },
        { label: 'Contests Attended', value: data?.contestsParticipated },
        { label: 'Badge Count', value: data?.badgesEarned },
      ];
    case 'github':
      return [
        { label: 'Total Contributions (All Time)', value: data?.totalContributionsAllTime },
        { label: 'Total Contributions (Last Year)', value: data?.totalContributionsLastYear },
        { label: 'Current Streak', value: data?.currentStreak, suffix: ' days' },
        { label: 'Longest Streak', value: data?.longestStreak, suffix: ' days' },
        { label: 'Public Repositories', value: data?.publicRepos },
        { label: 'Total Stars', value: data?.starsReceived },
        { label: 'Total Forks', value: data?.forksCount },
        { label: 'Merged PRs', value: data?.pullRequestsMerged || data?.pullRequests },
        { label: 'Issues Opened', value: data?.issuesOpened },
        { label: 'Issues Closed', value: data?.issuesClosed },
        { label: 'Followers', value: data?.followers },
        { label: 'Organizations', value: asArray(data?.organizations).length },
      ];
    case 'codeforces':
      return [
        { label: 'Current Rating', value: data?.currentRating },
        { label: 'Max Rating', value: data?.maxRating },
        { label: 'Rank Title', value: data?.rank },
        { label: 'Contest Count', value: data?.contestsParticipated },
        { label: 'Problems Solved', value: data?.totalSolved },
        { label: 'Recent Contests', value: asArray(data?.recentContestResults).length },
        { label: 'Rating History Points', value: asArray(data?.ratingHistory).length },
        { label: 'Solved Tag Groups', value: asArray(data?.tagsDistribution).length },
      ];
    case 'codechef':
      return [
        { label: 'Current Rating', value: data?.currentRating },
        { label: 'Stars', value: data?.stars || data?.starsCount },
        { label: 'Global Rank', value: data?.globalRank },
        { label: 'Country Rank', value: data?.countryRank },
        { label: 'Highest Rating', value: data?.highestRating },
        { label: 'Contest Count', value: data?.contestCount },
        { label: 'Fully Solved', value: data?.fullySolvedCount },
        { label: 'Partially Solved', value: data?.partiallySolvedCount },
      ];
    case 'kaggle':
      return [
        { label: 'Tier', value: data?.tier },
        { label: 'Competition Medals', value: data?.competitionMedals?.total },
        { label: 'Notebook Medals', value: data?.notebookMedals?.total },
        { label: 'Dataset Medals', value: data?.datasetMedals?.total },
        { label: 'Competition Count', value: data?.competitionsCount || data?.competitions },
        { label: 'Notebook Votes', value: data?.notebookVotesReceived },
        { label: 'Dataset Downloads', value: data?.datasetDownloads },
      ];
    case 'huggingface':
      return [
        { label: 'Models Published', value: data?.modelsPublished },
        { label: 'Model Downloads', value: data?.modelDownloads },
        { label: 'Datasets Published', value: data?.datasetsPublished },
        { label: 'Dataset Downloads', value: data?.datasetDownloads },
        { label: 'Spaces Created', value: data?.spacesCreated },
        { label: 'Spaces Likes', value: data?.spacesLikes },
        { label: 'Followers', value: data?.followers },
        { label: 'Following', value: data?.following },
      ];
    case 'hackerrank':
      return [
        { label: 'Total Badges', value: data?.totalBadges },
        { label: 'Total Stars', value: data?.totalStars },
        { label: 'Domain Scores', value: asArray(data?.domainScores).length },
        { label: 'Domain Ranks', value: Object.keys(data?.domainRanks || {}).length },
        { label: 'Contest Ranking', value: data?.contestRanking },
        { label: 'Contests Participated', value: data?.contestsParticipated },
      ];
    default:
      return Object.entries(data || {})
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .slice(0, 12)
        .map(([key, value]) => ({ label: formatMetricLabel(key), value }));
  }
}

function buildStatsRowFromMetrics(metrics, limit = 6) {
  return metrics.slice(0, limit).map((metric, index) => ({
    label: metric.label,
    value: formatMetricValue(metric.value, metric.suffix || ''),
    emphasis: index === 0,
  }));
}

function buildNumericMetricBars(metrics, limit = 6) {
  return metrics
    .filter((metric) => typeof metric?.value === 'number' && Number.isFinite(metric.value))
    .slice(0, limit)
    .map((metric) => ({
      name: metric.label.length > 16 ? `${metric.label.slice(0, 15)}...` : metric.label,
      value: toNumber(metric.value),
    }));
}

function computeStreaksFromDateKeys(dateKeys) {
  if (dateKeys.length === 0) return { longestStreak: 0, currentStreak: 0 };

  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < dateKeys.length; i++) {
    const diff = daysBetween(dateKeys[i - 1], dateKeys[i]);
    if (diff === 1) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  let currentStreak = 1;
  for (let i = dateKeys.length - 1; i > 0; i--) {
    const diff = daysBetween(dateKeys[i - 1], dateKeys[i]);
    if (diff === 1) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return { longestStreak, currentStreak };
}

function buildCombinedHeatmap(platformDataMap, platformIds = OVERVIEW_PLATFORM_ORDER, weeks = 34) {
  const dailyMap = new Map();
  const platformTotals = {};

  for (const platformId of platformIds) {
    const series = getPlatformCalendar(platformId, platformDataMap);
    for (const entry of series) {
      const dateKey = String(entry?.date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      const count = Math.max(0, toNumber(entry?.count));
      if (count <= 0) continue;

      const row = dailyMap.get(dateKey) || { total: 0, perPlatform: {} };
      row.total += count;
      row.perPlatform[platformId] = (row.perPlatform[platformId] || 0) + count;
      dailyMap.set(dateKey, row);

      platformTotals[platformId] = (platformTotals[platformId] || 0) + count;
    }
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - (weeks * 7 - 1));

  const columns = [];
  const monthMarkers = [];
  let previousMonthLabel = '';

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(start);
    weekStart.setUTCDate(start.getUTCDate() + week * 7);

    const monthLabel = weekStart.toLocaleDateString('en-US', { month: 'short' });
    if (monthLabel !== previousMonthLabel) {
      monthMarkers.push({ weekIndex: week, label: monthLabel });
      previousMonthLabel = monthLabel;
    }

    const days = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(weekStart);
      currentDate.setUTCDate(weekStart.getUTCDate() + day);
      const key = toDateKey(currentDate);

      const row = dailyMap.get(key) || { total: 0, perPlatform: {} };
      let dominantPlatformId = null;
      let dominantTotal = 0;

      for (const [platformId, value] of Object.entries(row.perPlatform)) {
        if (value > dominantTotal) {
          dominantTotal = value;
          dominantPlatformId = platformId;
        }
      }

      days.push({
        date: key,
        total: row.total,
        dominantPlatformId,
      });
    }

    columns.push(days);
  }

  const activeDateKeys = Array.from(dailyMap.entries())
    .filter(([, row]) => toNumber(row.total) > 0)
    .map(([dateKey]) => dateKey)
    .sort();

  const { longestStreak, currentStreak } = computeStreaksFromDateKeys(activeDateKeys);

  const totalActivities = Object.values(platformTotals).reduce((sum, value) => sum + toNumber(value), 0);
  const maxTotal = Math.max(1, ...Array.from(dailyMap.values()).map((row) => toNumber(row.total)));
  const mostActiveEntry = Object.entries(platformTotals).sort((a, b) => toNumber(b[1]) - toNumber(a[1]))[0];

  return {
    columns,
    monthMarkers,
    maxTotal,
    activeDays: activeDateKeys.length,
    longestStreak,
    currentStreak,
    totalActivities,
    mostActivePlatformId: mostActiveEntry?.[0] || null,
    mostActivePlatformPct: mostActiveEntry ? Math.round((toNumber(mostActiveEntry[1]) / Math.max(1, totalActivities)) * 100) : 0,
  };
}

function EmptyChart({ msg }) {
  return (
    <div className="h-full min-h-36 flex items-center justify-center text-muted">
      <p className="text-xs text-center">{msg}</p>
    </div>
  );
}

function ScoreRing({ score }) {
  const clamped = clamp(Math.round(toNumber(score)), 0, 1000);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * clamped) / 1000;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#7f77dd"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold leading-none">{clamped}</span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted">DevScore</span>
      </div>
    </div>
  );
}

function ScoreSparkline({ data }) {
  if (data.length === 0) {
    return <p className="text-[11px] text-muted">No historical score trend yet.</p>;
  }

  return (
    <div className="h-8 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#7f77dd" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ContributionPill({ row }) {
  const platform = PLATFORMS[row.id];
  const platformColor = platform?.color || '#7f77dd';

  return (
    <div className="rounded-lg border border-border/70 bg-card/60 p-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: platformColor }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{row.name}</p>
          <p className="text-[11px] text-muted">{row.sharePct}% of DevScore</p>
          <div className="mt-1 h-1 w-full rounded bg-border/60">
            <div
              className="h-1 rounded"
              style={{ width: `${clamp(row.score, 0, 100)}%`, backgroundColor: platformColor }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-foreground/80">{Math.round(row.score)}</span>
      </div>
    </div>
  );
}

function FocusItem({ item }) {
  const tone = {
    danger: {
      wrapper: 'border-red-500/30 bg-red-500/10',
      dot: 'bg-red-500',
    },
    warn: {
      wrapper: 'border-amber-500/30 bg-amber-500/10',
      dot: 'bg-amber-500',
    },
    good: {
      wrapper: 'border-emerald-500/30 bg-emerald-500/10',
      dot: 'bg-emerald-500',
    },
  }[item.tone] || {
    wrapper: 'border-border bg-card',
    dot: 'bg-border',
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${tone.wrapper}`}>
      <div className="flex items-start gap-2">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
        <div>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-0.5 text-[11px] text-muted">{item.detail}</p>
        </div>
      </div>
    </div>
  );
}

function PlatformSection({
  platformId,
  subtitle,
  score,
  stats,
  leftTitle,
  leftChart,
  rightTitle,
  rightChart,
  footer,
  onViewFull,
}) {
  const meta = PLATFORMS[platformId];
  const platformColor = meta?.color || '#7f77dd';
  const logoText = platformId === 'github' ? 'GH' : meta?.name?.slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden border-border/80 bg-card/60">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-card text-[10px] font-semibold" style={{ color: platformColor }}>
          {logoText}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-foreground">{meta?.name || platformId}</p>
          <p className="text-[11px] text-muted">{subtitle}</p>
        </div>

        <div className="flex w-full max-w-xs items-center gap-2 md:w-auto">
          <div className="h-1.5 flex-1 rounded bg-border/60">
            <div
              className="h-1.5 rounded"
              style={{ width: `${clamp(score, 0, 100)}%`, backgroundColor: platformColor }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold text-foreground">{Math.round(score)}</span>
        </div>

        <Button variant="ghost" size="sm" onClick={onViewFull} className="ml-auto">
          View full analytics {'->'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-0 border-b border-border/70 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="border-r border-border/70 px-3 py-3 text-center last:border-r-0">
            <p className={`text-lg font-semibold ${stat.emphasis ? 'text-foreground' : 'text-foreground/90'}`}>{stat.value}</p>
            <p className="text-[10px] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-medium text-muted">{leftTitle}</p>
          <div className="h-40">{leftChart}</div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium text-muted">{rightTitle}</p>
          <div className="h-40">{rightChart}</div>
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-2 text-center">
        <span className="text-xs text-muted">{footer}</span>
      </div>
    </Card>
  );
}

function PlatformBreakdown({ platformId, platformData }) {
  if (platformId === 'leetcode') {
    const difficultyData = [
      { name: 'Easy', value: toNumber(platformData?.easySolved), fill: '#10b981' },
      { name: 'Medium', value: toNumber(platformData?.mediumSolved), fill: '#f59e0b' },
      { name: 'Hard', value: toNumber(platformData?.hardSolved), fill: '#ef4444' },
    ].filter((entry) => entry.value > 0);

    const languageData = asArray(platformData?.languagesUsed)
      .slice(0, 6)
      .map((entry, index) => ({
        name: entry.language,
        value: toNumber(entry.solved),
        fill: getLanguageColor(entry.language, index),
      }))
      .filter((entry) => entry.value > 0);

    if (difficultyData.length === 0 && languageData.length === 0) {
      return <EmptyChart msg="No category breakdown available yet for LeetCode." />;
    }

    return (
      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-full min-h-0">
          {difficultyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={74}>
                  {difficultyData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No solved difficulty mix yet." />
          )}
        </div>

        <div className="h-full min-h-0">
          {languageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData} layout="vertical" margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={95} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                  {languageData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No language usage breakdown yet." />
          )}
        </div>
      </div>
    );
  }

  if (platformId === 'github') {
    const languageData = asArray(platformData?.languageDistribution).slice(0, 8).map((entry, index) => ({
      name: entry.language,
      value: toNumber(entry.bytes || entry.count),
      fill: getLanguageColor(entry.language, index),
    }));

    if (languageData.length === 0) {
      return <EmptyChart msg="No language distribution available for GitHub." />;
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={languageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78}>
            {languageData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (platformId === 'codeforces') {
    const tags = asArray(platformData?.tagsDistribution).slice(0, 10).map((entry) => ({
      name: entry.tag,
      value: toNumber(entry.count),
    }));

    if (tags.length === 0) {
      return <EmptyChart msg="No solved-tag distribution available for Codeforces." />;
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={tags} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (platformId === 'hackerrank') {
    const domainData = asArray(platformData?.domainScores)
      .slice(0, 8)
      .map((entry, index) => ({
        axis: String(entry?.domain || `Domain ${index + 1}`).slice(0, 14),
        value: toNumber(entry?.score || entry?.stars),
      }))
      .filter((entry) => entry.value > 0);

    if (domainData.length === 0) {
      return <EmptyChart msg="No domain score distribution available yet for HackerRank." />;
    }

    const maxValue = Math.max(1, ...domainData.map((entry) => entry.value));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={domainData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="axis" stroke="var(--muted-foreground)" fontSize={10} />
          <PolarRadiusAxis domain={[0, maxValue]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (platformId === 'codechef') {
    const starsCount = parseStarsCount(platformData?.stars || platformData?.starsCount);
    const splitData = [
      { name: 'Fully Solved', value: toNumber(platformData?.fullySolvedCount), fill: '#10B981' },
      { name: 'Partially Solved', value: toNumber(platformData?.partiallySolvedCount), fill: '#F59E0B' },
    ].filter((entry) => entry.value > 0);

    return (
      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/70 bg-card/50 p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Star Rating</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{starsCount > 0 ? `${starsCount}★` : 'N/A'}</p>
          <div className="mt-2 text-lg leading-none">
            {Array.from({ length: 7 }).map((_, index) => (
              <span key={`cc-star-${index}`} className={index < starsCount ? 'text-amber-400' : 'text-muted/40'}>★</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">Current: {formatMetricValue(platformData?.currentRating)}</p>
          <p className="text-[11px] text-muted">Peak: {formatMetricValue(platformData?.highestRating || platformData?.currentRating)}</p>
        </div>

        <div className="h-full min-h-0">
          {splitData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={splitData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={74}>
                  {splitData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No solved split data yet for CodeChef." />
          )}
        </div>
      </div>
    );
  }

  if (platformId === 'kaggle') {
    const medalByType = [
      {
        name: 'Gold',
        value: toNumber(platformData?.competitionMedals?.gold) + toNumber(platformData?.notebookMedals?.gold) + toNumber(platformData?.datasetMedals?.gold),
        fill: '#FBBF24',
      },
      {
        name: 'Silver',
        value: toNumber(platformData?.competitionMedals?.silver) + toNumber(platformData?.notebookMedals?.silver) + toNumber(platformData?.datasetMedals?.silver),
        fill: '#94A3B8',
      },
      {
        name: 'Bronze',
        value: toNumber(platformData?.competitionMedals?.bronze) + toNumber(platformData?.notebookMedals?.bronze) + toNumber(platformData?.datasetMedals?.bronze),
        fill: '#B45309',
      },
    ].filter((entry) => entry.value > 0);

    const tierProgressMap = {
      novice: 0.15,
      contributor: 0.35,
      expert: 0.55,
      master: 0.75,
      grandmaster: 0.95,
    };
    const tierKey = String(platformData?.tier || '').toLowerCase();
    const tierProgress = tierProgressMap[tierKey] || 0.05;

    return (
      <div className="flex h-full flex-col gap-3">
        <div className="rounded-lg border border-border/70 bg-card/50 p-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
            <span>Tier Progression</span>
            <span className="text-foreground">{platformData?.tier || 'Unknown'}</span>
          </div>
          <div className="mt-2 h-2 rounded bg-border/70">
            <div className="h-2 rounded bg-cyan-400" style={{ width: `${Math.round(tierProgress * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted">Novice {'->'} Contributor {'->'} Expert {'->'} Master {'->'} Grandmaster</p>
        </div>

        <div className="h-full min-h-0">
          {medalByType.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={medalByType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72}>
                  {medalByType.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No medal distribution available yet for Kaggle." />
          )}
        </div>
      </div>
    );
  }

  if (platformId === 'huggingface') {
    const modelPoints = asArray(platformData?.topModels)
      .slice(0, 20)
      .map((entry, index) => ({
        name: String(entry?.name || `Model ${index + 1}`).split('/').pop().slice(0, 14),
        downloads: toNumber(entry?.downloads),
        likes: toNumber(entry?.likes),
      }))
      .filter((entry) => entry.downloads > 0 || entry.likes > 0);

    const pipelineDataMap = new Map();
    for (const entry of asArray(platformData?.topModels).slice(0, 30)) {
      const key = String(entry?.pipeline || entry?.pipeline_tag || 'unknown').replace(/_/g, '-');
      pipelineDataMap.set(key, (pipelineDataMap.get(key) || 0) + 1);
    }

    const pipelineData = [...pipelineDataMap.entries()]
      .map(([name, value]) => ({ name: name.slice(0, 16), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    if (modelPoints.length === 0 && pipelineData.length === 0) {
      return <EmptyChart msg="No asset-impact breakdown available yet for Hugging Face." />;
    }

    return (
      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-full min-h-0">
          {modelPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" dataKey="downloads" name="Downloads" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="likes" name="Likes" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={modelPoints} fill="#84CC16" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No downloads vs likes scatter points yet." />
          )}
        </div>

        <div className="h-full min-h-0">
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#84CC16" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No pipeline distribution available yet." />
          )}
        </div>
      </div>
    );
  }

  return <EmptyChart msg="No platform-specific breakdown available yet." />;
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?._id;
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: scoreHistory = [] } = useQuery({
    queryKey: ['scoreHistory', userId],
    queryFn: () => scoreService.getScoreHistory(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: dsaStats } = useQuery({
    queryKey: ['dsaStats', userId],
    queryFn: () => statsService.getDsaStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: githubStats } = useQuery({
    queryKey: ['githubStats', userId],
    queryFn: () => statsService.getGithubStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats', userId],
    queryFn: () => statsService.getPlatformStats(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: devScore } = useQuery({
    queryKey: ['devScore', userId],
    queryFn: () => scoreService.getScore(userId),
    enabled: !!userId,
    retry: false,
  });

  const { data: benchmark } = useQuery({
    queryKey: ['scoreBenchmark', userId],
    queryFn: () => scoreService.getScoreBenchmark(userId),
    enabled: !!userId,
    retry: false,
  });

  const syncMutation = useMutation({
    mutationFn: () => statsService.syncStats(),
    onSuccess: async () => {
      toast.success('All platforms synced');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['githubStats', userId] }),
        queryClient.invalidateQueries({ queryKey: ['dsaStats', userId] }),
        queryClient.invalidateQueries({ queryKey: ['platformStats', userId] }),
        queryClient.invalidateQueries({ queryKey: ['devScore', userId] }),
        queryClient.invalidateQueries({ queryKey: ['scoreHistory', userId] }),
        queryClient.invalidateQueries({ queryKey: ['scoreBenchmark', userId] }),
      ]);
    },
    onError: () => {
      toast.error('Sync failed. Please try again.');
    },
  });

  const scoreData = useMemo(() => devScore?.data || devScore || {}, [devScore]);
  const diagnostics = useMemo(() => scoreData?.diagnostics || {}, [scoreData]);
  const benchmarkData = useMemo(() => benchmark?.data || benchmark || null, [benchmark]);

  const platformDataMap = useMemo(
    () => ({
      github: githubStats || {},
      leetcode: dsaStats?.leetcode || {},
      codeforces: dsaStats?.codeforces || {},
      hackerrank: platformStats?.hackerrank || {},
      codechef: platformStats?.codechef || {},
      kaggle: platformStats?.kaggle || {},
      huggingface: platformStats?.huggingface || {},
    }),
    [githubStats, dsaStats, platformStats]
  );

  const connectedPlatformIds = useMemo(
    () => OVERVIEW_PLATFORM_ORDER.filter((platformId) => {
      const field = PLATFORMS[platformId]?.field;
      return Boolean(field && user?.[field]);
    }),
    [user]
  );

  const historyRows = useMemo(() => asArray(scoreHistory?.data || scoreHistory), [scoreHistory]);
  const trendData = useMemo(
    () => historyRows
      .map((entry) => {
        const timestamp = entry?.computedAt || entry?.createdAt;
        const date = timestamp ? new Date(timestamp) : null;
        return {
          name: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
          score: toNumber(entry?.score ?? entry?.overallScore),
          ts: date?.getTime() || 0,
        };
      })
      .sort((a, b) => a.ts - b.ts),
    [historyRows]
  );

  const sparklineData = useMemo(
    () => trendData.slice(-15).map((entry, index) => ({ name: `${index}`, value: entry.score })),
    [trendData]
  );

  const latestScore = trendData.length > 0
    ? toNumber(trendData[trendData.length - 1]?.score)
    : toNumber(scoreData?.overallScore);

  const previousScore = trendData.length > 1
    ? toNumber(trendData[trendData.length - 2]?.score)
    : latestScore;

  const scoreDelta = Math.round((latestScore - previousScore) * 10) / 10;

  const platformScoreRows = useMemo(
    () => connectedPlatformIds
      .map((platformId) => {
        const value = scoreData?.platformScores?.[platformId] || {};
        return {
          id: platformId,
          name: value?.platformLabel || PLATFORMS[platformId]?.name || platformId,
          score: toNumber(value?.score),
          weight: toNumber(value?.weight),
        };
      })
      .sort((a, b) => b.score * b.weight - a.score * a.weight),
    [connectedPlatformIds, scoreData]
  );

  const platformContributionRows = useMemo(() => {
    const withContribution = platformScoreRows.map((row) => ({
      ...row,
      contribution: row.score * row.weight,
    }));

    const totalContribution = withContribution.reduce((sum, row) => sum + row.contribution, 0);
    return withContribution.map((row) => ({
      ...row,
      sharePct: Math.round((row.contribution / Math.max(1, totalContribution)) * 100),
    }));
  }, [platformScoreRows]);

  const contributionLookup = useMemo(
    () => Object.fromEntries(platformContributionRows.map((row) => [row.id, row])),
    [platformContributionRows]
  );

  const topContributionRows = useMemo(
    () => platformContributionRows,
    [platformContributionRows]
  );

  const pillars = useMemo(() => scoreData?.pillars || {}, [scoreData]);
  const pillarPercent = (pillar) => Math.round((toNumber(pillar?.score) / Math.max(1, toNumber(pillar?.max || 100))) * 100);

  const platformScoreLookup = useMemo(
    () => Object.fromEntries(platformScoreRows.map((row) => [row.id, row.score])),
    [platformScoreRows]
  );

  const aiMlComposite = Math.round((toNumber(platformScoreLookup.kaggle) + toNumber(platformScoreLookup.huggingface)) / 2);

  const radarData = useMemo(
    () => [
      { axis: 'Code Quality', value: pillarPercent(pillars.building) },
      { axis: 'Contest Perf', value: pillarPercent(pillars.problemSolving) },
      { axis: 'Open Source', value: Math.round(toNumber(platformScoreLookup.github)) },
      { axis: 'AI / ML', value: aiMlComposite },
      { axis: 'Community', value: pillarPercent(pillars.community) },
      { axis: 'Learning', value: pillarPercent(pillars.consistency) },
    ],
    [aiMlComposite, pillars, platformScoreLookup]
  );

  const strongestAxis = useMemo(() => [...radarData].sort((a, b) => b.value - a.value)[0], [radarData]);
  const weakestAxis = useMemo(() => [...radarData].sort((a, b) => a.value - b.value)[0], [radarData]);

  const trendWindow = useMemo(() => trendData.slice(-15), [trendData]);
  const trendScores = useMemo(() => trendWindow.map((entry) => entry.score), [trendWindow]);
  const peakScore = trendScores.length > 0 ? Math.round(Math.max(...trendScores)) : 0;
  const averageScore = trendScores.length > 0
    ? Math.round(trendScores.reduce((sum, score) => sum + score, 0) / trendScores.length)
    : 0;
  const startScore = trendScores.length > 0 ? Math.round(trendScores[0]) : 0;

  const weakSignals = asArray(diagnostics?.weakSignals);
  const strongestSignals = asArray(diagnostics?.strongestSignals);
  const focusItems = useMemo(() => {
    const weak = weakSignals.slice(0, 3).map((signal) => ({
      tone: toNumber(signal?.score) < 30 ? 'danger' : 'warn',
      title: signal.metric || 'Weak signal',
      detail: `${signal.platformLabel || signal.platform || 'Platform'} | ${Math.round(toNumber(signal?.score))}/100`,
    }));

    const strong = strongestSignals.slice(0, 1).map((signal) => ({
      tone: 'good',
      title: signal.metric || 'Strong signal',
      detail: `${signal.platformLabel || signal.platform || 'Platform'} | ${Math.round(toNumber(signal?.score))}/100`,
    }));

    return [...weak, ...strong];
  }, [strongestSignals, weakSignals]);

  const latestSyncedAt = useMemo(() => {
    const candidates = [
      githubStats?.updatedAt,
      githubStats?.lastSyncedAt,
      dsaStats?.updatedAt,
      dsaStats?.lastSyncedAt,
      platformStats?.updatedAt,
      platformStats?.lastSyncedAt,
    ]
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    return candidates[0] || null;
  }, [dsaStats, githubStats, platformStats]);

  const heatmapData = useMemo(
    () => buildCombinedHeatmap(platformDataMap, connectedPlatformIds),
    [platformDataMap, connectedPlatformIds]
  );

  const leetcodeData = platformDataMap.leetcode || {};
  const githubData = platformDataMap.github || {};
  const codeforcesData = platformDataMap.codeforces || {};
  const hackerrankData = platformDataMap.hackerrank || {};
  const codechefData = platformDataMap.codechef || {};
  const kaggleData = platformDataMap.kaggle || {};
  const huggingfaceData = platformDataMap.huggingface || {};

  const leetcodeDifficultyData = [
    { name: 'Easy', value: toNumber(leetcodeData?.easySolved), fill: '#10b981' },
    { name: 'Medium', value: toNumber(leetcodeData?.mediumSolved), fill: '#f59e0b' },
    { name: 'Hard', value: toNumber(leetcodeData?.hardSolved), fill: '#ef4444' },
  ];

  const leetcodeConsistencyData = buildLast12WeeksSeries(asArray(leetcodeData?.dailyActivity)).map((entry) => ({
    name: entry.label,
    value: entry.total,
  }));

  const githubLanguageData = asArray(githubData?.languageDistribution)
    .slice(0, 6)
    .map((entry, index) => ({
      name: entry.language || 'Unknown',
      value: toNumber(entry.bytes || entry.count),
      fill: getLanguageColor(entry.language, index),
    }));

  const githubMonthlyData = buildLast12MonthsSeries(asArray(githubData?.contributionCalendar)).map((entry) => ({
    name: entry.label,
    value: entry.total,
  }));

  const codeforcesRatingData = asArray(codeforcesData?.ratingHistory).slice(-12).map((entry, index) => ({
    name: String(entry?.contestName || `Contest ${index + 1}`).slice(0, 10),
    value: toNumber(entry?.newRating),
  }));

  const codeforcesTagData = asArray(codeforcesData?.tagsDistribution)
    .slice(0, 6)
    .map((entry) => ({
      name: entry.tag,
      value: toNumber(entry.count),
    }));

  const hackerrankDomainData = asArray(hackerrankData?.domainScores)
    .slice(0, 6)
    .map((entry, index) => ({
      name: String(entry?.domain || `Domain ${index + 1}`).slice(0, 14),
      score: toNumber(entry?.score || entry?.stars),
    }));

  const hackerrankBadgeTierData = Object.entries(hackerrankData?.badgeTierByDomain || {})
    .slice(0, 6)
    .map(([domain, tier]) => ({
      name: String(domain).slice(0, 14),
      gold: toNumber(tier?.gold),
      silver: toNumber(tier?.silver),
      bronze: toNumber(tier?.bronze),
    }));

  const codechefRatingData = [
    { name: 'Current', value: toNumber(codechefData?.currentRating) },
    { name: 'Highest', value: toNumber(codechefData?.highestRating || codechefData?.currentRating) },
    { name: 'Contests', value: toNumber(codechefData?.contestCount) },
  ].filter((row) => row.value > 0);

  const codechefSolveSplitData = [
    { name: 'Fully Solved', value: toNumber(codechefData?.fullySolvedCount), fill: '#22c55e' },
    { name: 'Partially Solved', value: toNumber(codechefData?.partiallySolvedCount), fill: '#f59e0b' },
  ].filter((row) => row.value > 0);

  const kaggleMedalTrackData = [
    {
      name: 'Competition',
      gold: toNumber(kaggleData?.competitionMedals?.gold),
      silver: toNumber(kaggleData?.competitionMedals?.silver),
      bronze: toNumber(kaggleData?.competitionMedals?.bronze),
    },
    {
      name: 'Notebook',
      gold: toNumber(kaggleData?.notebookMedals?.gold),
      silver: toNumber(kaggleData?.notebookMedals?.silver),
      bronze: toNumber(kaggleData?.notebookMedals?.bronze),
    },
    {
      name: 'Dataset',
      gold: toNumber(kaggleData?.datasetMedals?.gold),
      silver: toNumber(kaggleData?.datasetMedals?.silver),
      bronze: toNumber(kaggleData?.datasetMedals?.bronze),
    },
  ].filter((row) => row.gold > 0 || row.silver > 0 || row.bronze > 0);

  const kaggleImpactData = [
    { name: 'Notebook Votes', value: toNumber(kaggleData?.notebookVotesReceived || kaggleData?.notebookVotes) },
    { name: 'Dataset Downloads', value: toNumber(kaggleData?.datasetDownloads) },
    { name: 'Followers', value: toNumber(kaggleData?.followers) },
  ].filter((row) => row.value > 0);

  const huggingfaceAssetData = [
    { name: 'Models', value: toNumber(huggingfaceData?.modelsPublished) },
    { name: 'Datasets', value: toNumber(huggingfaceData?.datasetsPublished) },
    { name: 'Spaces', value: toNumber(huggingfaceData?.spacesCreated) },
  ].filter((row) => row.value > 0);

  const huggingfaceTopModelData = asArray(huggingfaceData?.topModels)
    .slice(0, 5)
    .map((entry, index) => ({
      name: String(entry?.name || `Model ${index + 1}`).split('/').pop().slice(0, 14),
      value: toNumber(entry?.downloads),
    }))
    .filter((row) => row.value > 0);

  const codeforcesLastActiveDate = asArray(codeforcesData?.dailySubmissions)
    .filter((entry) => toNumber(entry?.count) > 0)
    .map((entry) => entry.date)
    .sort()
    .at(-1);

  const codeforcesDaysSinceActive = codeforcesLastActiveDate
    ? daysBetween(codeforcesLastActiveDate, toDateKey(new Date()))
    : null;

  const leetcodeStatsRow = [
    { label: 'Contest rating', value: formatMetricValue(leetcodeData?.contestRating) },
    {
      label: 'Global ranking',
      value: leetcodeData?.topPercentage !== null && leetcodeData?.topPercentage !== undefined
        ? `Top ${formatMetricValue(leetcodeData?.topPercentage, '%')}`
        : 'N/A',
      emphasis: true,
    },
    { label: 'Problems solved', value: formatMetricValue(leetcodeData?.totalSolved) },
    { label: 'Acceptance rate', value: formatMetricValue(leetcodeData?.acceptanceRate, '%') },
    { label: 'Contests attended', value: formatMetricValue(leetcodeData?.contestsParticipated) },
    { label: 'Current streak', value: formatMetricValue(leetcodeData?.currentStreak, ' days') },
  ];

  const githubStatsRow = [
    { label: 'Total contributions', value: formatMetricValue(githubData?.totalContributionsLastYear || githubData?.totalContributionsAllTime) },
    { label: 'Longest streak', value: formatMetricValue(githubData?.longestStreak) },
    { label: 'Public repos', value: formatMetricValue(githubData?.publicRepos) },
    { label: 'Stars received', value: formatMetricValue(githubData?.starsReceived) },
    { label: 'PRs merged', value: formatMetricValue(githubData?.pullRequestsMerged || githubData?.pullRequests) },
    { label: 'Followers', value: formatMetricValue(githubData?.followers) },
  ];

  const codeforcesStatsRow = [
    { label: 'Current rating', value: formatMetricValue(codeforcesData?.currentRating), emphasis: true },
    { label: 'Peak rating', value: formatMetricValue(codeforcesData?.maxRating) },
    { label: 'Rank', value: formatMetricValue(codeforcesData?.rank), emphasis: true },
    { label: 'Contests', value: formatMetricValue(codeforcesData?.contestsParticipated) },
    { label: 'Problems solved', value: formatMetricValue(codeforcesData?.totalSolved) },
    { label: 'Days since active', value: formatMetricValue(codeforcesDaysSinceActive) },
  ];

  const hackerrankStatsRow = [
    { label: 'Contest rank', value: hackerrankData?.contestRanking ? `#${formatMetricValue(hackerrankData?.contestRanking)}` : 'N/A', emphasis: true },
    { label: 'Total stars', value: formatMetricValue(hackerrankData?.totalStars) },
    { label: 'Badges', value: formatMetricValue(hackerrankData?.totalBadges) },
    { label: 'Level', value: formatMetricValue(hackerrankData?.level) },
    { label: 'Contests', value: formatMetricValue(hackerrankData?.contestsParticipated) },
    { label: 'Domains tracked', value: formatMetricValue(asArray(hackerrankData?.domainScores).length) },
  ];

  const codechefStatsRow = [
    { label: 'Global rank', value: codechefData?.globalRank ? `#${formatMetricValue(codechefData?.globalRank)}` : 'N/A', emphasis: true },
    { label: 'Current rating', value: formatMetricValue(codechefData?.currentRating), emphasis: true },
    { label: 'Stars', value: formatMetricValue(codechefData?.stars || codechefData?.starsCount) },
    { label: 'Problems solved', value: formatMetricValue(codechefData?.problemsSolved) },
    { label: 'Contests', value: formatMetricValue(codechefData?.contestCount) },
    { label: 'Country rank', value: codechefData?.countryRank ? `#${formatMetricValue(codechefData?.countryRank)}` : 'N/A' },
  ];

  const kaggleStatsRow = [
    { label: 'Global rank', value: kaggleData?.ranking ? `#${formatMetricValue(kaggleData?.ranking)}` : 'N/A', emphasis: true },
    { label: 'Tier', value: formatMetricValue(kaggleData?.tier) },
    { label: 'Competition medals', value: formatMetricValue(kaggleData?.competitionMedals?.total) },
    { label: 'Notebook medals', value: formatMetricValue(kaggleData?.notebookMedals?.total) },
    { label: 'Dataset medals', value: formatMetricValue(kaggleData?.datasetMedals?.total) },
    { label: 'Dataset downloads', value: formatMetricValue(kaggleData?.datasetDownloads) },
  ];

  const huggingfaceStatsRow = [
    { label: 'Total downloads', value: formatMetricValue(huggingfaceData?.totalDownloads), emphasis: true },
    { label: 'Models published', value: formatMetricValue(huggingfaceData?.modelsPublished) },
    { label: 'Datasets published', value: formatMetricValue(huggingfaceData?.datasetsPublished) },
    { label: 'Spaces created', value: formatMetricValue(huggingfaceData?.spacesCreated) },
    { label: 'Likes', value: formatMetricValue(huggingfaceData?.totalLikes || huggingfaceData?.spacesLikes) },
    { label: 'Followers', value: formatMetricValue(huggingfaceData?.followers) },
  ];

  const requestedPlatform = searchParams.get('platform');
  const activePlatformId = connectedPlatformIds.includes(requestedPlatform) ? requestedPlatform : null;

  const openPlatformView = (platformId) => {
    const next = new URLSearchParams(searchParams);
    next.set('platform', platformId);
    setSearchParams(next);
  };

  const closePlatformView = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('platform');
    setSearchParams(next);
  };

  const renderOverviewPlatformSection = (platformId) => {
    if (platformId === 'leetcode') {
      return (
        <PlatformSection
          key={platformId}
          platformId="leetcode"
          subtitle={`Contributes ${contributionLookup.leetcode?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.leetcode?.score || 0)}/100`}
          score={contributionLookup.leetcode?.score || 0}
          stats={leetcodeStatsRow}
          leftTitle="Problem difficulty breakdown"
          leftChart={(
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leetcodeDifficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70}>
                  {leetcodeDifficultyData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
          rightTitle="90-day submission consistency"
          rightChart={(
            leetcodeConsistencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leetcodeConsistencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leetcodeConsistencyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#leetcodeConsistencyFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No submission consistency data yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('leetcode', leetcodeData).length} metrics (skills, badges, category progress...)`}
          onViewFull={() => openPlatformView('leetcode')}
        />
      );
    }

    if (platformId === 'github') {
      return (
        <PlatformSection
          key={platformId}
          platformId="github"
          subtitle={`Contributes ${contributionLookup.github?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.github?.score || 0)}/100`}
          score={contributionLookup.github?.score || 0}
          stats={githubStatsRow}
          leftTitle="Top languages"
          leftChart={(
            githubLanguageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={githubLanguageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                    {githubLanguageData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No language data yet." />
            )
          )}
          rightTitle="Monthly contributions (12 months)"
          rightChart={(
            githubMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={githubMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(148,163,184,0.75)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No contribution calendar data yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('github', githubData).length} metrics (PR history, issue activity, repo quality...)`}
          onViewFull={() => openPlatformView('github')}
        />
      );
    }

    if (platformId === 'codeforces') {
      return (
        <PlatformSection
          key={platformId}
          platformId="codeforces"
          subtitle={`Contributes ${contributionLookup.codeforces?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.codeforces?.score || 0)}/100`}
          score={contributionLookup.codeforces?.score || 0}
          stats={codeforcesStatsRow}
          leftTitle="Rating history"
          leftChart={(
            codeforcesRatingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={codeforcesRatingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No rating history data yet." />
            )
          )}
          rightTitle="Problem tags (top 6)"
          rightChart={(
            codeforcesTagData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={codeforcesTagData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={90} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(96,165,250,0.75)" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No tag distribution data yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('codeforces', codeforcesData).length} metrics (tag distribution, recent contests, rank changes...)`}
          onViewFull={() => openPlatformView('codeforces')}
        />
      );
    }

    if (platformId === 'hackerrank') {
      return (
        <PlatformSection
          key={platformId}
          platformId="hackerrank"
          subtitle={`Contributes ${contributionLookup.hackerrank?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.hackerrank?.score || 0)}/100`}
          score={contributionLookup.hackerrank?.score || 0}
          stats={hackerrankStatsRow}
          leftTitle="Domain performance"
          leftChart={(
            hackerrankDomainData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hackerrankDomainData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={95} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="score" fill="rgba(0,195,140,0.75)" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No domain performance data available yet." />
            )
          )}
          rightTitle="Badge tier distribution"
          rightChart={(
            hackerrankBadgeTierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hackerrankBadgeTierData} margin={{ top: 10, right: 10, left: -10, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={46} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Bar dataKey="gold" stackId="tier" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="silver" stackId="tier" fill="#94a3b8" />
                  <Bar dataKey="bronze" stackId="tier" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No badge-tier breakdown available yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('hackerrank', hackerrankData).length} metrics (domain strengths, contest standing, badge depth...)`}
          onViewFull={() => openPlatformView('hackerrank')}
        />
      );
    }

    if (platformId === 'codechef') {
      return (
        <PlatformSection
          key={platformId}
          platformId="codechef"
          subtitle={`Contributes ${contributionLookup.codechef?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.codechef?.score || 0)}/100`}
          score={contributionLookup.codechef?.score || 0}
          stats={codechefStatsRow}
          leftTitle="Rating and contest snapshot"
          leftChart={(
            codechefRatingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={codechefRatingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(181,112,68,0.8)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No rating snapshot available yet." />
            )
          )}
          rightTitle="Solve split"
          rightChart={(
            codechefSolveSplitData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={codechefSolveSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72}>
                    {codechefSolveSplitData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No fully/partially solved split yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('codechef', codechefData).length} metrics (rank profile, solve depth, contest trend...)`}
          onViewFull={() => openPlatformView('codechef')}
        />
      );
    }

    if (platformId === 'kaggle') {
      return (
        <PlatformSection
          key={platformId}
          platformId="kaggle"
          subtitle={`Contributes ${contributionLookup.kaggle?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.kaggle?.score || 0)}/100`}
          score={contributionLookup.kaggle?.score || 0}
          stats={kaggleStatsRow}
          leftTitle="Medals by track"
          leftChart={(
            kaggleMedalTrackData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kaggleMedalTrackData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Bar dataKey="gold" stackId="medals" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="silver" stackId="medals" fill="#94a3b8" />
                  <Bar dataKey="bronze" stackId="medals" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No medal breakdown available yet." />
            )
          )}
          rightTitle="Impact signals"
          rightChart={(
            kaggleImpactData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kaggleImpactData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={110} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(32,190,255,0.78)" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No impact metrics available yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('kaggle', kaggleData).length} metrics (tier, medals, notebook and dataset impact...)`}
          onViewFull={() => openPlatformView('kaggle')}
        />
      );
    }

    if (platformId === 'huggingface') {
      const huggingfaceFallbackImpact = [
        { name: 'Likes', value: toNumber(huggingfaceData?.totalLikes || huggingfaceData?.spacesLikes) },
        { name: 'Followers', value: toNumber(huggingfaceData?.followers) },
      ].filter((row) => row.value > 0);

      return (
        <PlatformSection
          key={platformId}
          platformId="huggingface"
          subtitle={`Contributes ${contributionLookup.huggingface?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contributionLookup.huggingface?.score || 0)}/100`}
          score={contributionLookup.huggingface?.score || 0}
          stats={huggingfaceStatsRow}
          leftTitle="Published assets"
          leftChart={(
            huggingfaceAssetData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={huggingfaceAssetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(255,213,51,0.78)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No published-asset counts available yet." />
            )
          )}
          rightTitle={huggingfaceTopModelData.length > 0 ? 'Top model downloads' : 'Community impact'}
          rightChart={(
            huggingfaceTopModelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={huggingfaceTopModelData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={95} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(250,204,21,0.82)" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : huggingfaceFallbackImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={huggingfaceFallbackImpact} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(250,204,21,0.82)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart msg="No model download or community impact data yet." />
            )
          )}
          footer={`Show all ${getPlatformMetrics('huggingface', huggingfaceData).length} metrics (assets, downloads, likes, followers...)`}
          onViewFull={() => openPlatformView('huggingface')}
        />
      );
    }

    const platformData = platformDataMap[platformId] || {};
    const contribution = contributionLookup[platformId];
    const metrics = getPlatformMetrics(platformId, platformData);
    const stats = buildStatsRowFromMetrics(metrics);
    const calendarSeries = getPlatformCalendar(platformId, platformDataMap);
    const weeklySeries = buildLast12WeeksSeries(calendarSeries).map((entry) => ({
      name: entry.label,
      value: entry.total,
    }));
    const trendSeries = getPlatformTrendData(platformId, platformData, calendarSeries);
    const metricBars = buildNumericMetricBars(metrics);
    const platformColor = PLATFORMS[platformId]?.color || '#7f77dd';
    const areaGradientId = `${platformId}ActivityFill`;

    return (
      <PlatformSection
        key={platformId}
        platformId={platformId}
        subtitle={`Contributes ${contribution?.sharePct || 0}% to your DevScore | Platform score: ${Math.round(contribution?.score || 0)}/100`}
        score={contribution?.score || 0}
        stats={stats}
        leftTitle="Weekly activity (12 weeks)"
        leftChart={(
          weeklySeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={platformColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={platformColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke={platformColor} fill={`url(#${areaGradientId})`} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No weekly activity series available yet." />
          )
        )}
        rightTitle={metricBars.length > 0 ? 'Top numeric metrics' : 'Trend over time'}
        rightChart={(
          metricBars.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricBars} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={46} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill={platformColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : trendSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={platformColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart msg="No chartable metrics available yet." />
          )
        )}
        footer={`Show all ${metrics.length} metrics for ${PLATFORMS[platformId]?.name || platformId}.`}
        onViewFull={() => openPlatformView(platformId)}
      />
    );
  };

  if (activePlatformId) {
    const selectedPlatformMeta = PLATFORMS[activePlatformId];
    const selectedPlatformData = platformDataMap[activePlatformId] || {};
    const selectedCalendar = getPlatformCalendar(activePlatformId, platformDataMap);
    const selectedTrend = getPlatformTrendData(activePlatformId, selectedPlatformData, selectedCalendar);
    const selectedMetrics = getPlatformMetrics(activePlatformId, selectedPlatformData);
    const selectedProfileUrl = platformProfileUrl(activePlatformId, user, selectedPlatformData);
    const selectedContribution = contributionLookup[activePlatformId];
    const selectedHeatmapProps = {
      githubCalendar: activePlatformId === 'github' ? selectedCalendar : [],
      leetcodeCalendar: activePlatformId === 'leetcode' ? selectedCalendar : [],
      codeforcesCalendar: activePlatformId === 'codeforces' ? selectedCalendar : [],
      hackerrankCalendar: activePlatformId === 'hackerrank' ? selectedCalendar : [],
      codechefCalendar: activePlatformId === 'codechef' ? selectedCalendar : [],
      kaggleCalendar: activePlatformId === 'kaggle' ? selectedCalendar : [],
      huggingfaceCalendar: activePlatformId === 'huggingface' ? selectedCalendar : [],
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{selectedPlatformMeta?.name} Analytics</h1>
            <p className="text-sm text-muted">
              Contribution: {selectedContribution ? `${selectedContribution.sharePct}%` : 'N/A'} | Platform score: {selectedContribution ? `${Math.round(selectedContribution.score)}/100` : 'N/A'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedProfileUrl && (
              <Button asChild variant="ghost" size="sm">
                <a href={selectedProfileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                  Open profile
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={closePlatformView}>Back to overview</Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {connectedPlatformIds.map((platformId) => {
            const platform = PLATFORMS[platformId];
            const active = activePlatformId === platformId;

            return (
              <button
                key={platformId}
                type="button"
                onClick={() => openPlatformView(platformId)}
                className={`rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${active
                  ? 'bg-accent-cyan/15 border-accent-cyan/40 text-foreground'
                  : 'border-border text-muted hover:text-foreground hover:bg-card-elevated'}`}
              >
                {platform?.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Activity Heatmap</CardTitle>
              <CardDescription>Daily activity intensity for this platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap {...selectedHeatmapProps} />
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>All Metrics</CardTitle>
              <CardDescription>Complete metric inventory for this platform</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMetrics.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-border p-3">
                      <p className="text-xs uppercase tracking-wide text-muted">{metric.label}</p>
                      <p className="mt-1 text-xl font-bold">{formatMetricValue(metric.value, metric.suffix || '')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No metrics available for this platform yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Trend Over Time</CardTitle>
              <CardDescription>Historical trend where platform history exists</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {selectedTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke={selectedPlatformMeta?.color || '#06b6d4'} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart msg="No trend data available for this platform." />
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Platform-Specific Breakdown</CardTitle>
              <CardDescription>Custom chart by platform capabilities</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <PlatformBreakdown platformId={activePlatformId} platformData={selectedPlatformData} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border/80 bg-card/40 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-muted">
            Dashboard <span className="mx-1 text-border">&gt;</span>
            <span className="text-foreground">Analytics</span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent-purple/45 bg-accent-purple/10 px-2.5 py-1 text-[11px] font-medium text-accent-purple">
              {scoreData?.domainLabel || 'All Rounder'}
            </span>
            <span className="text-xs text-muted">Synced {relativeTimeLabel(latestSyncedAt)}</span>
            <Button variant="ghost" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync all'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border/80 bg-card/60 xl:col-span-4">
          <CardContent className="flex h-full items-center gap-4 p-5">
            <ScoreRing score={latestScore} />

            <div className="min-w-0 space-y-1">
              <p className="text-2xl font-semibold text-accent-purple">{scoreBandLabel(latestScore)}</p>
              <p className={`text-sm font-medium ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {scoreDelta >= 0 ? '+' : ''}
                {scoreDelta} this window
              </p>
              <ScoreSparkline data={sparklineData} />
              <p className="text-xs text-muted">
                {scoreData?.domainLabel || 'All Rounder'}
                {' '}.
                <Link to="/dashboard/settings" className="text-accent-purple hover:underline">change</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 xl:col-span-8">
          <CardContent className="p-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-muted">Platform contributions</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {topContributionRows.length > 0 ? topContributionRows.map((row) => (
                <ContributionPill key={row.id} row={row} />
              )) : (
                <p className="text-sm text-muted">No connected platform scores yet. Run sync to populate contributions.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="border-border/80 bg-card/60 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Domain strength</CardTitle>
            <CardDescription>Across 6 competency axes</CardDescription>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="axis" stroke="var(--muted-foreground)" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#7f77dd" fill="#7f77dd" fillOpacity={0.22} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="mt-3 text-center text-[11px] text-muted">
              Strongest in {strongestAxis?.axis || 'N/A'}.
              {' '}Weakest in {weakestAxis?.axis || 'N/A'}.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 xl:col-span-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Score over time</CardTitle>
                <CardDescription>90-day trend</CardDescription>
              </div>
              <div className="flex gap-1 text-[10px]">
                <span className="rounded border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-accent-purple">90D</span>
                <span className="rounded border border-border px-2 py-0.5 text-muted">30D</span>
                <span className="rounded border border-border px-2 py-0.5 text-muted">1Y</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {trendWindow.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendWindow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 1000]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#7f77dd" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart msg="No score history available yet." />
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-muted">Peak</p>
                <p className="font-semibold">{peakScore}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted">Average</p>
                <p className="font-semibold">{averageScore}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted">Start</p>
                <p className="font-semibold">{startScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Focus areas</CardTitle>
            <CardDescription>Prioritized improvement targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {focusItems.length > 0 ? (
              focusItems.map((item) => (
                <FocusItem key={`${item.title}-${item.detail}`} item={item} />
              ))
            ) : (
              <p className="text-sm text-muted">No focus signals yet. Sync more data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardContent className="space-y-3 p-5">
          <ActivityHeatmap
            githubCalendar={asArray(githubData?.contributionCalendar)}
            leetcodeCalendar={asArray(leetcodeData?.dailyActivity)}
            codeforcesCalendar={asArray(codeforcesData?.dailySubmissions)}
            hackerrankCalendar={asArray(hackerrankData?.dailyActivity)}
            codechefCalendar={asArray(codechefData?.dailyActivity)}
            kaggleCalendar={asArray(kaggleData?.dailyActivity)}
            huggingfaceCalendar={asArray(huggingfaceData?.dailyActivity)}
          />

          <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-[11px] text-muted md:grid-cols-5">
            <p>Active days: <span className="text-foreground">{heatmapData.activeDays}</span></p>
            <p>Longest streak: <span className="text-foreground">{heatmapData.longestStreak} days</span></p>
            <p>Current streak: <span className="text-foreground">{heatmapData.currentStreak} days</span></p>
            <p>
              Most active: <span className="text-foreground">
                {heatmapData.mostActivePlatformId ? `${PLATFORMS[heatmapData.mostActivePlatformId]?.name} (${heatmapData.mostActivePlatformPct}%)` : 'N/A'}
              </span>
            </p>
            <p>Total activities: <span className="text-foreground">{Math.round(heatmapData.totalActivities).toLocaleString()}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {connectedPlatformIds.length > 0 ? (
          connectedPlatformIds.map((platformId) => renderOverviewPlatformSection(platformId))
        ) : (
          <Card className="border-dashed border-border/80 bg-card/40">
            <CardContent className="py-8 text-center text-muted">
              <p className="text-sm">No connected platforms yet. Add handles in settings to see platform analytics cards.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-border/80 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Benchmark Snapshot</CardTitle>
          <CardDescription>Domain comparison against anonymized peers</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted">Domain</p>
            <p className="text-base font-semibold">{scoreData?.domainLabel || 'All Rounder'}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted">You</p>
            <p className="text-base font-semibold">{formatMetricValue(scoreData?.overallScore)}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted">Domain Avg</p>
            <p className="text-base font-semibold">{formatMetricValue(benchmarkData?.averageScore)}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted">Percentile</p>
            <p className="text-base font-semibold">{formatMetricValue(benchmarkData?.percentile, '%')}</p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-1 text-xs text-muted">
        Showing section cards for {connectedPlatformIds.length} connected platform{connectedPlatformIds.length === 1 ? '' : 's'}.
      </div>
    </div>
  );
}

function getLanguageColor(languageName, index) {
  return LANGUAGE_COLORS[String(languageName)] || COLORS[index % COLORS.length];
}