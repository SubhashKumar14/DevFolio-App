import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Users, Trophy, ExternalLink, AlertTriangle } from 'lucide-react';
import { ScoreBadge } from '@/components/dashboard/ScoreBadge';

export default function RecruiterPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({ name: '', techStack: '', college: '', minScore: '' });
  const [searchParams, setSearchParams] = useState(null);

  // All hooks MUST be above any conditional return
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['recruiterSearch', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.name) params.set('name', searchParams.name);
      if (searchParams.techStack) params.set('techStack', searchParams.techStack);
      if (searchParams.college) params.set('college', searchParams.college);
      if (searchParams.minScore) params.set('minScore', searchParams.minScore);
      const res = await apiClient.get(`/recruiter/search?${params.toString()}`);
      return res.data;
    },
    enabled: !!searchParams,
  });

  const handleSearch = () => setSearchParams({ ...filters });

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
        <p className="text-muted mt-1">Find developers by name, tech stack, college, or minimum DevScore.</p>
      </div>

      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} placeholder="Search by name" />
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <Input value={filters.techStack} onChange={(e) => setFilters({ ...filters, techStack: e.target.value })} placeholder="React, Node.js" />
            </div>
            <div className="space-y-2">
              <Label>College</Label>
              <Input value={filters.college} onChange={(e) => setFilters({ ...filters, college: e.target.value })} placeholder="Filter by college" />
            </div>
            <div className="space-y-2">
              <Label>Min DevScore</Label>
              <Input type="number" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })} placeholder="0" />
            </div>
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" /> Search Developers
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
        </div>
      ) : searchParams && results.length === 0 ? (
        <div className="text-center py-16 text-muted">No developers found matching your criteria.</div>
      ) : (
        <div className="space-y-3">
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
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <a href={`/p/${dev.userId}`} target="_blank" rel="noreferrer">
                    View Profile <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
