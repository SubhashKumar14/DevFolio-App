import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { portfolioService } from '@/services/portfolioService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink, PenTool, FileCode, Loader2, Globe, Lock } from 'lucide-react';

export default function PortfolioPage() {
  const { user } = useAuthStore();
  const userId = user?._id;
  const isRecruiter = user?.role === 'recruiter';

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', userId],
    queryFn: () => portfolioService.getPortfolio(userId),
    enabled: !!userId,
    retry: false,
  });

  const srcdoc = useMemo(() => {
    if (!portfolio) return null;
    const html = portfolio.htmlContent || portfolio.rawHtml || '';
    const css = portfolio.cssContent || '';
    const js = portfolio.jsContent || '';
    return `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
  }, [portfolio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="h-8 w-8 text-accent-cyan" /> Portfolio Preview
          </h1>
          <p className="text-muted mt-1">
            {portfolio?.isPublic ? (
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-accent-green" /> Public — visible to everyone</span>
            ) : portfolio ? (
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-accent-orange" /> Private — only you can see this</span>
            ) : 'Create your portfolio to showcase your work.'}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.displayName && portfolio && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link to={`/portfolio/preview/${encodeURIComponent(user.displayName)}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" /> Open Live
              </Link>
            </Button>
          )}
          {!isRecruiter && (
            <Button size="sm" asChild className="gap-1.5">
              <Link to="/portfolio/editor">
                <PenTool className="h-3.5 w-3.5" /> {portfolio ? 'Edit Code' : 'Create Portfolio'}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {srcdoc ? (
        <Card className="overflow-hidden">
          <div className="bg-[#1a1a2e] border-b border-border px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-muted ml-2">
              {user?.displayName ? `devfolio.dev/portfolio/${user.displayName}` : 'portfolio preview'}
            </span>
          </div>
          <div className="h-[70vh] bg-white">
            <iframe
              srcDoc={srcdoc}
              title="Portfolio Preview"
              sandbox="allow-scripts"
              className="w-full h-full border-0"
            />
          </div>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-accent-cyan/20">
          <CardContent className="py-20 text-center">
            <FileCode className="h-16 w-16 mx-auto mb-4 text-muted opacity-40" />
            <h2 className="text-xl font-bold mb-2">No Portfolio Yet</h2>
            <p className="text-muted max-w-md mx-auto mb-6">
              Build your personal portfolio with HTML, CSS & JS. It'll be visible on your public profile.
            </p>
            {!isRecruiter && (
              <Button asChild>
                <Link to="/portfolio/editor">Start Building</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
