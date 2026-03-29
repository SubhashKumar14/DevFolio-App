import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolioService';
import { useMemo } from 'react';
import { buildPortfolioHtml } from '@/utils/portfolioUtils';

export default function PortfolioPreview() {
  const { username } = useParams();

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolioPreview', username],
    queryFn: () => portfolioService.getPortfolio(username),
    enabled: !!username,
    retry: false,
  });

  const srcDoc = useMemo(() => {
    if (!portfolio) {
      return '';
    }

    return buildPortfolioHtml(
      portfolio.htmlContent || portfolio.rawHtml || '',
      portfolio.cssContent || '',
      portfolio.jsContent || ''
    );
  }, [portfolio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-lg">Portfolio not found or is private.</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={srcDoc}
      title="Portfolio Preview"
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
    />
  );
}
