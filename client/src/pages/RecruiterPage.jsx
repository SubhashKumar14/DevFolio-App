import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Users, Trophy, ExternalLink, AlertTriangle } from 'lucide-react';
import { ScoreBadge } from '@/components/dashboard/ScoreBadge';
import { ARCHETYPE_LIST } from '@/lib/constants';
import { getPublicProfilePath } from '@/lib/publicRoutes';

const DEFAULT_FILTERS = {
  name: '',
  techStack: '',
  college: '',
  minScore: '',
  maxScore: '',
  archetype: '',
  secondaryArchetype: '',
  hasPortfolio: '',
  matchTech: 'any',
  sortBy: 'devScore',
  sortOrder: 'desc',
  limit: 24,
};

const EMPTY_META = {
  total: 0,
  page: 1,
  totalPages: 1,
  limit: DEFAULT_FILTERS.limit,
  sortBy: DEFAULT_FILTERS.sortBy,
  sortOrder: DEFAULT_FILTERS.sortOrder,
  matchTech: DEFAULT_FILTERS.matchTech,
};

export default function RecruiterPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchParams, setSearchParams] = useState(null);

  // All hooks MUST be above any conditional return
  const { data: queryResult = { data: [], meta: EMPTY_META }, isLoading } = useQuery({
    queryKey: ['recruiterSearch', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.entries(searchParams || {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        params.set(key, String(value));
      });

      const res = await apiClient.get(`/recruiter/search?${params.toString()}`);
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const meta = res?.meta && typeof res.meta === 'object'
        ? { ...EMPTY_META, ...res.meta }
        : { ...EMPTY_META, total: data.length, limit: Number(searchParams?.limit || DEFAULT_FILTERS.limit) };

      return { data, meta };
    },
    enabled: !!searchParams,
  });

  const results = queryResult.data;
  const meta = queryResult.meta;
  const hasSearched = Boolean(searchParams);

  const pageSummary = useMemo(() => {
    const total = Number(meta?.total || 0);
    const currentPage = Number(meta?.page || 1);
    const pageSize = Number(meta?.limit || DEFAULT_FILTERS.limit);
    if (!hasSearched || total <= 0) {
      return { total, from: 0, to: 0, currentPage, pageSize };
    }

    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(total, from + results.length - 1);
    return { total, from, to, currentPage, pageSize };
  }, [hasSearched, meta?.limit, meta?.page, meta?.total, results.length]);

  const handleSearch = () => {
    setSearchParams({ ...filters, page: 1 });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams(null);
  };

  const handlePageChange = (page) => {
    if (!searchParams) return;
    setSearchParams((prev) => ({ ...prev, page }));
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const totalPages = Number(meta?.totalPages || 1);
  const currentPage = Number(meta?.page || 1);

  // Now safe to return early
  if (user?.role !== 'recruiter' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-accent-orange mx-auto" />
          <p className="text-lg font-medium text-muted">Recruiter access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-accent-purple" /> Developer Search
        </h1>
        <p className="text-muted mt-1">Find developers by score range, portfolio readiness, archetypes, and targeted tech filters.</p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recruiter-name">Name</Label>
              <Input
                id="recruiter-name"
                value={filters.name}
                onChange={(e) => updateFilter('name', e.target.value)}
                placeholder="Search by name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-tech">Tech Stack</Label>
              <Input
                id="recruiter-tech"
                value={filters.techStack}
                onChange={(e) => updateFilter('techStack', e.target.value)}
                placeholder="React, Node.js"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-college">College</Label>
              <Input
                id="recruiter-college"
                value={filters.college}
                onChange={(e) => updateFilter('college', e.target.value)}
                placeholder="Filter by college"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-min-score">Min DevScore</Label>
              <Input
                id="recruiter-min-score"
                type="number"
                min={0}
                max={1000}
                value={filters.minScore}
                onChange={(e) => updateFilter('minScore', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-max-score">Max DevScore</Label>
              <Input
                id="recruiter-max-score"
                type="number"
                min={0}
                max={1000}
                value={filters.maxScore}
                onChange={(e) => updateFilter('maxScore', e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recruiter-archetype">Primary archetype</Label>
              <select
                id="recruiter-archetype"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.archetype}
                onChange={(e) => updateFilter('archetype', e.target.value)}
              >
                <option value="">All archetypes</option>
                {ARCHETYPE_LIST.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-secondary-archetype">Secondary archetype</Label>
              <select
                id="recruiter-secondary-archetype"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.secondaryArchetype}
                onChange={(e) => updateFilter('secondaryArchetype', e.target.value)}
              >
                <option value="">Any secondary archetype</option>
                {ARCHETYPE_LIST.map((a) => (
                  <option key={`secondary-${a.id}`} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-portfolio">Portfolio filter</Label>
              <select
                id="recruiter-portfolio"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.hasPortfolio}
                onChange={(e) => updateFilter('hasPortfolio', e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Has portfolio</option>
                <option value="false">No portfolio</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-match-tech">Tech matching</Label>
              <select
                id="recruiter-match-tech"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.matchTech}
                onChange={(e) => updateFilter('matchTech', e.target.value)}
              >
                <option value="any">Match any listed skill</option>
                <option value="all">Require all listed skills</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-sort-by">Sort by</Label>
              <select
                id="recruiter-sort-by"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
              >
                <option value="devScore">DevScore</option>
                <option value="name">Name</option>
                <option value="college">College</option>
                <option value="portfolio">Portfolio status</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-sort-order">Sort order</Label>
              <select
                id="recruiter-sort-order"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-limit">Results per page</Label>
              <select
                id="recruiter-limit"
                className="h-10 w-full rounded-md border border-border bg-card-elevated px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                value={filters.limit}
                onChange={(e) => updateFilter('limit', Number(e.target.value) || DEFAULT_FILTERS.limit)}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" /> Search Developers
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-16 text-muted">No developers found matching your criteria.</div>
      ) : (
        <div className="space-y-3" aria-live="polite">
          {hasSearched && (
            <div className="rounded-lg border border-border bg-card-elevated/60 px-3 py-2 text-xs text-muted">
              Showing {pageSummary.from}-{pageSummary.to} of {pageSummary.total} results
            </div>
          )}

          {results.map((dev, i) => (
            <Card key={dev.userId} className="animate-slide-up hover:border-accent-purple/30 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ScoreBadge score={dev.devScore} />
                  <div>
                    <h3 className="font-semibold text-lg">{dev.displayName}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted mt-0.5">
                      {dev.college && <span>🎓 {dev.college}</span>}
                      <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {dev.devScore}</span>
                      {dev.archetype && dev.archetype !== 'none' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-card-elevated border border-border capitalize">
                          {dev.secondaryArchetype && dev.secondaryArchetype !== 'none'
                            ? `${dev.archetype.replace('_', ' ')} + ${dev.secondaryArchetype.replace('_', ' ')}`
                            : dev.archetype.replace('_', ' ')}
                        </span>
                      )}
                      {dev.hasPortfolio && <span className="text-accent-green text-xs font-medium">📄 Portfolio</span>}
                    </div>
                    {dev.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {dev.techStack.map(t => (
                          <span key={t} className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {getPublicProfilePath(dev) ? (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link to={getPublicProfilePath(dev)}>
                      View Profile <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled>
                    View Profile <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {hasSearched && totalPages > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Results navigation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                <p className="text-xs text-muted">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
