import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolioService';
import LivePreview from '@/components/portfolio/LivePreview';

export default function PortfolioPreview() {
  const { userId } = useParams();

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolioPreview', userId],
    queryFn: () => portfolioService.getPortfolio(userId),
    enabled: !!userId,
    retry: false,
  });

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
    <div className="min-h-screen bg-white">
      <LivePreview
        html={portfolio.htmlContent || portfolio.rawHtml || ''}
        css={portfolio.cssContent || ''}
        js={portfolio.jsContent || ''}
      />
    </div>
  );
}
