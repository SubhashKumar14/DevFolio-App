import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { compareService } from '@/services/compareService';
import apiClient from '@/lib/apiClient';
import { PLATFORMS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitCompare, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const COMPARE_MODES = [
  { value: 'devscore', label: 'DevFolio Ranking' },
  ...Object.values(PLATFORMS).map((platform) => ({ value: platform.id, label: `${platform.name} Ranking` })),
];

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatInteger(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return Math.round(numeric).toLocaleString();
}

function getModeRows(userData, mode) {
  if (!userData) return [];

  const github = userData.githubStats || {};
  const leetcode = userData.dsaStats?.leetcode || {};
  const codeforces = userData.dsaStats?.codeforces || {};
  const platformStats = userData.platformStats || {};

  if (mode === 'devscore') {
    return [
      { label: 'GitHub', value: github.totalCommits ? `${formatInteger(github.totalCommits)} commits` : '—' },
      { label: 'LeetCode Solved', value: leetcode.totalSolved ? formatInteger(leetcode.totalSolved) : '—' },
      { label: 'Connected Platforms', value: formatInteger(userData.connectedPlatforms || 0) },
      { label: 'Portfolio', value: userData.hasPortfolio ? 'Published' : '—' },
    ];
  }

  if (mode === 'github') {
    return [
      { label: 'Contributions', value: formatInteger(github.totalContributionsLastYear || github.totalContributionsAllTime) },
      { label: 'Stars', value: formatInteger(github.starsReceived) },
      { label: 'Merged PRs', value: formatInteger(github.pullRequestsMerged || github.pullRequests) },
      { label: 'Followers', value: formatInteger(github.followers) },
    ];
  }

  if (mode === 'leetcode') {
    return [
      { label: 'Global Contest Rank', value: leetcode.contestGlobalRanking ? `#${formatInteger(leetcode.contestGlobalRanking)}` : '—' },
      { label: 'Contest Rating', value: formatInteger(leetcode.contestRating) },
      { label: 'Problems Solved', value: formatInteger(leetcode.totalSolved) },
      { label: 'Acceptance', value: leetcode.acceptanceRate ? `${toNumber(leetcode.acceptanceRate).toFixed(1)}%` : '—' },
    ];
  }

  if (mode === 'codeforces') {
    return [
      { label: 'Current Rating', value: formatInteger(codeforces.currentRating || codeforces.rating) },
      { label: 'Peak Rating', value: formatInteger(codeforces.maxRating) },
      { label: 'Contests', value: formatInteger(codeforces.contestsParticipated) },
      { label: 'Problems Solved', value: formatInteger(codeforces.totalSolved) },
    ];
  }

  if (mode === 'hackerrank') {
    const data = platformStats.hackerrank || {};
    return [
      { label: 'Contest Rank', value: data.contestRanking ? `#${formatInteger(data.contestRanking)}` : '—' },
      { label: 'Total Stars', value: formatInteger(data.totalStars) },
      { label: 'Badges', value: formatInteger(data.totalBadges) },
      { label: 'Level', value: formatInteger(data.level) },
    ];
  }

  if (mode === 'codechef') {
    const data = platformStats.codechef || {};
    return [
      { label: 'Global Rank', value: data.globalRank ? `#${formatInteger(data.globalRank)}` : '—' },
      { label: 'Current Rating', value: formatInteger(data.currentRating) },
      { label: 'Stars', value: data.stars || formatInteger(data.starsCount) },
      { label: 'Problems Solved', value: formatInteger(data.problemsSolved) },
    ];
  }

  if (mode === 'kaggle') {
    const data = platformStats.kaggle || {};
    const medals = toNumber(data.competitionMedals?.total) + toNumber(data.notebookMedals?.total) + toNumber(data.datasetMedals?.total);
    return [
      { label: 'Global Rank', value: data.ranking ? `#${formatInteger(data.ranking)}` : '—' },
      { label: 'Tier', value: data.tier || '—' },
      { label: 'Total Medals', value: formatInteger(medals) },
      { label: 'Dataset Downloads', value: formatInteger(data.datasetDownloads) },
    ];
  }

  if (mode === 'huggingface') {
    const data = platformStats.huggingface || {};
    return [
      { label: 'Downloads', value: formatInteger(data.totalDownloads || (toNumber(data.modelDownloads) + toNumber(data.datasetDownloads))) },
      { label: 'Models', value: formatInteger(data.modelsPublished) },
      { label: 'Datasets', value: formatInteger(data.datasetsPublished) },
      { label: 'Followers', value: formatInteger(data.followers) },
    ];
  }

  return [];
}

export default function ComparePage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [compareId, setCompareId] = useState(null);
  const [platformMode, setPlatformMode] = useState('devscore');
  const dropdownRef = useRef(null);

  // Search users as you type
  useEffect(() => {
    if (searchQuery.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/user/search?q=${encodeURIComponent(searchQuery)}`);
        const filtered = (res.data || []).filter((u) => u._id !== user?._id);
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?._id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectUser = (u) => {
    setCompareId(u._id);
    setSearchQuery(u.displayName);
    setShowDropdown(false);
  };

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['compare', user?._id, compareId, platformMode],
    queryFn: () => compareService.compareDevelopers(user._id, compareId, platformMode),
    enabled: !!user?._id && !!compareId,
    retry: false,
  });

  const modeMeta = comparison?.compareMode;
  const user1Rows = getModeRows(comparison?.user1, platformMode);
  const user2Rows = getModeRows(comparison?.user2, platformMode);

  const modePrimaryValueUser1 = platformMode === 'devscore'
    ? `${comparison?.user1?.devScore || '—'} DevScore`
    : modeMeta?.user1MetricDisplay || 'N/A';
  const modePrimaryValueUser2 = platformMode === 'devscore'
    ? `${comparison?.user2?.devScore || 0} DevScore`
    : modeMeta?.user2MetricDisplay || 'N/A';

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GitCompare className="h-8 w-8 text-accent-cyan" /> Compare Developers
        </h1>
        <p className="text-muted mt-1">Pitch your stats against peers to see who comes out on top.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="compareMode" className="text-sm text-muted">Compare mode</label>
          <select
            id="compareMode"
            className="h-10 px-3 rounded-md border border-border bg-card-elevated text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan min-w-[220px]"
            value={platformMode}
            onChange={(e) => setPlatformMode(e.target.value)}
          >
            {COMPARE_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
          {modeMeta?.note && <span className="text-xs text-muted">{modeMeta.note}</span>}
        </div>
      </div>

      {modeMeta && platformMode !== 'devscore' && (!modeMeta.user1Connected || !modeMeta.user2Connected) && (
        <div className="rounded-lg border border-accent-yellow/30 bg-accent-yellow/10 p-3 text-sm text-accent-yellow">
          One or both developers have not connected {modeMeta.label}. Metrics and radar will reflect available data only.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
        {/* User 1 (You) */}
        <Card className="lg:col-span-2 shadow-sm border-accent-cyan/30">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-accent-cyan/10 rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-accent-cyan border border-accent-cyan/20">
              {user?.displayName?.[0]?.toUpperCase() || 'Y'}
            </div>
            <CardTitle>{user?.displayName || 'You'}</CardTitle>
            <CardDescription className="text-transparent bg-clip-text bg-gradient-devscore font-bold text-lg mt-2">
              {modePrimaryValueUser1}
            </CardDescription>
            {platformMode !== 'devscore' && modeMeta?.user1PlatformScore > 0 && (
              <p className="text-xs text-muted mt-1">Platform score: {Math.round(modeMeta.user1PlatformScore)}/100</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {user1Rows.map((row) => (
              <StatRow key={`u1-${row.label}`} label={row.label} value={row.value} />
            ))}
          </CardContent>
        </Card>

        {/* VS Label */}
        <div className="lg:col-span-1 flex justify-center py-4">
          <div className="flex bg-card-elevated px-4 py-2 rounded-full border border-border shadow-sm text-sm font-bold text-muted uppercase tracking-widest">
            VS
          </div>
        </div>

        {/* User 2 (Search) */}
        <Card className="lg:col-span-2 shadow-sm border-dashed">
          <CardHeader className="text-center pb-4 min-h-[140px] flex flex-col justify-center">
            <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 text-muted">
              {comparison?.user2 ? (
                <span className="text-2xl font-bold text-accent-purple">{comparison.user2.displayName?.[0]?.toUpperCase()}</span>
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div className="relative w-full max-w-xs mx-auto" ref={dropdownRef}>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    placeholder="Search by name..."
                    className="pl-9 bg-transparent border-muted/30 focus-visible:ring-accent-cyan/50"
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.length < 2) {
                        setSearchResults([]);
                        setShowDropdown(false);
                        return;
                      }
                      setShowDropdown(true);
                    }}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  />
                </div>
              </div>
              {/* Search results dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card-elevated transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-sm font-bold text-accent-purple">
                        {u.displayName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.displayName}</p>
                        {u.college && <p className="text-xs text-muted">{u.college}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {comparison?.user2 && (
              <CardDescription className="text-transparent bg-clip-text bg-gradient-devscore font-bold text-lg mt-2">
                {modePrimaryValueUser2}
              </CardDescription>
            )}
            {platformMode !== 'devscore' && modeMeta?.user2PlatformScore > 0 && (
              <p className="text-xs text-muted mt-1">Platform score: {Math.round(modeMeta.user2PlatformScore)}/100</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {user2Rows.map((row) => (
              <StatRow key={`u2-${row.label}`} label={row.label} value={row.value} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {comparison?.radarData && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>{platformMode === 'devscore' ? 'Comparison Radar' : `${modeMeta?.label || 'Platform'} Radar`}</CardTitle>
            <CardDescription>
              {platformMode === 'devscore'
                ? 'Multi-dimensional profile comparison'
                : 'Platform-specific metric comparison'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96 min-w-0">
            <div className="h-full w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart data={comparison.radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <Radar name={comparison.user1?.displayName || 'You'} dataKey="user1" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.3} />
                  <Radar name={comparison.user2?.displayName || 'Opponent'} dataKey="user2" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8 text-muted animate-pulse">Loading comparison...</div>
      )}

      {error && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg text-accent-red text-sm">
          User not found. Please search for a valid user.
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
