import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { portfolioService } from '@/services/portfolioService';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import EditorHeader from '@/components/portfolio/EditorHeader';
import CodePanel from '@/components/portfolio/CodePanel';
import LivePreview from '@/components/portfolio/LivePreview';

export default function PortfolioEditor() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [dirty, setDirty] = useState(false);

  useBeforeUnload(dirty);

  // Load existing portfolio
  const { isLoading } = useQuery({
    queryKey: ['portfolio', user?._id],
    queryFn: () => portfolioService.getPortfolio(user._id),
    enabled: !!user?._id,
    onSuccess: (data) => {
      if (data) {
        setHtml(data.rawHtml || data.htmlContent || '');
        setCss(data.cssContent || '');
        setJs(data.jsContent || '');
      }
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => portfolioService.savePortfolio({ rawHtml: html, cssContent: css, jsContent: js }),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const handleChange = (setter) => (val) => { setter(val); setDirty(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <EditorHeader
        onSave={() => saveMutation.mutate()}
        onTogglePreview={() => setShowPreview(!showPreview)}
        isSaving={saveMutation.isPending}
        showPreview={showPreview}
      />

      <div className="flex-1 flex min-h-0">
        {/* Code Panels */}
        <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'} border-r border-border divide-y divide-border`}>
          <CodePanel language="HTML" value={html} onChange={handleChange(setHtml)} />
          <CodePanel language="CSS" value={css} onChange={handleChange(setCss)} />
          <CodePanel language="JavaScript" value={js} onChange={handleChange(setJs)} />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col p-4">
            <LivePreview html={html} css={css} js={js} />
          </div>
        )}
      </div>
    </div>
  );
}
