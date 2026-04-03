import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { portfolioService } from '@/services/portfolioService';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import EditorHeader from '@/components/portfolio/EditorHeader';
import CodePanel from '@/components/portfolio/CodePanel';
import LivePreview from '@/components/portfolio/LivePreview';
import { getPublicIdentifier } from '@/lib/publicRoutes';

export default function PortfolioEditor() {
  const { user } = useAuthStore();
  const publicIdentifier = getPublicIdentifier(user);
  const queryClient = useQueryClient();
  const portfolioQueryKey = ['portfolio', user?._id];
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('html');
  const [draft, setDraft] = useState(null);
  const [visibilityOverride, setVisibilityOverride] = useState(undefined);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing portfolio
  const { data: portfolio, isLoading } = useQuery({
    queryKey: portfolioQueryKey,
    queryFn: () => portfolioService.getPortfolio(user._id),
    enabled: !!user?._id,
  });

  const baseHtml = portfolio?.rawHtml || portfolio?.htmlContent || '';
  const baseCss = portfolio?.cssContent || '';
  const baseJs = portfolio?.jsContent || '';

  const html = draft?.html ?? baseHtml;
  const css = draft?.css ?? baseCss;
  const js = draft?.js ?? baseJs;
  const isPublic = visibilityOverride ?? (portfolio?.isPublic || false);

  const dirty = !!draft && (
    draft.html !== baseHtml ||
    draft.css !== baseCss ||
    draft.js !== baseJs
  );

  useBeforeUnload(dirty);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (nextCode) => portfolioService.savePortfolio(nextCode),
    onMutate: async (nextCode) => {
      await queryClient.cancelQueries({ queryKey: portfolioQueryKey });

      const previousPortfolio = queryClient.getQueryData(portfolioQueryKey);

      queryClient.setQueryData(portfolioQueryKey, (current) => ({
        ...(current || {}),
        rawHtml: nextCode.rawHtml,
        htmlContent: nextCode.rawHtml,
        cssContent: nextCode.cssContent,
        jsContent: nextCode.jsContent,
      }));

      return { previousPortfolio };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(portfolioQueryKey, context.previousPortfolio);
      }
    },
    onSuccess: (savedPortfolio) => {
      queryClient.setQueryData(portfolioQueryKey, savedPortfolio);
      setDraft(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      queryClient.invalidateQueries({ queryKey: portfolioQueryKey });
    },
  });

  // Visibility toggle mutation
  const visibilityMutation = useMutation({
    mutationFn: (val) => portfolioService.toggleVisibility(val),
    onSuccess: (_, val) => {
      setVisibilityOverride(val);
      queryClient.setQueryData(portfolioQueryKey, (current) => ({
        ...(current || {}),
        isPublic: val,
      }));
      queryClient.invalidateQueries({ queryKey: portfolioQueryKey });
    },
  });

  const handleChange = (field) => (value) => {
    setDraft((prev) => {
      const next = prev ?? {
        html: baseHtml,
        css: baseCss,
        js: baseJs,
      };

      return {
        ...next,
        [field]: value,
      };
    });
  };

  const tabs = [
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'js', label: 'JS' },
  ];

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
        onSave={() => saveMutation.mutate({ rawHtml: html, cssContent: css, jsContent: js })}
        onTogglePreview={() => setShowPreview(!showPreview)}
        isSaving={saveMutation.isPending}
        saveSuccess={saveSuccess}
        showPreview={showPreview}
        isPublic={isPublic}
        onToggleVisibility={() => visibilityMutation.mutate(!isPublic)}
        dirty={dirty}
        publicIdentifier={publicIdentifier}
      />

      <div className="flex-1 flex min-h-0">
        {/* Editor Side */}
        <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'} border-r border-border`}>
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-card-elevated">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent-cyan border-b-2 border-accent-cyan bg-card'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Panel */}
          <div className="flex-1 min-h-0">
            {activeTab === 'html' && (
              <CodePanel language="HTML" value={html} onChange={handleChange('html')} placeholder="<div>\n  <h1>Hello World</h1>\n  <p>Build your portfolio here...</p>\n</div>" />
            )}
            {activeTab === 'css' && (
              <CodePanel language="CSS" value={css} onChange={handleChange('css')} placeholder="body {\n  font-family: 'Inter', sans-serif;\n  background: #0f172a;\n  color: white;\n}" />
            )}
            {activeTab === 'js' && (
              <CodePanel language="JavaScript" value={js} onChange={handleChange('js')} placeholder="// Add interactivity\nconsole.log('Portfolio loaded!');" />
            )}
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-card-elevated border-b border-border">
              <span className="text-xs font-mono font-medium text-muted uppercase">Live Preview</span>
            </div>
            <div className="flex-1 p-4">
              <LivePreview html={html} css={css} js={js} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
