import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolioService';
import { useMemo } from 'react';

export default function PortfolioPreview() {
  const { username } = useParams();

  const { data: portfolio, isLoading, error } = useQuery({
    queryKey: ['portfolioPreview', username],
    queryFn: () => portfolioService.getPortfolio(username),
    enabled: !!username,
    retry: false,
  });

  const srcdoc = useMemo(() => {
    if (!portfolio) return '';
    const html = portfolio.htmlContent || portfolio.rawHtml || '';
    const css = portfolio.cssContent || '';
    const js = portfolio.jsContent || '';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}<\/script>
</body>
</html>`;
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
      srcDoc={srcdoc}
      title="Portfolio Preview"
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
    />
  );
}
