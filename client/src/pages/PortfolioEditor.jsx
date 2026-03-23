import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('html');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [dirty, setDirty] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useBeforeUnload(dirty);

  // Load existing portfolio
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', user?._id],
    queryFn: () => portfolioService.getPortfolio(user._id),
    enabled: !!user?._id,
  });

  // Populate form when data loads
  useEffect(() => {
    if (portfolio) {
      setHtml(portfolio.rawHtml || portfolio.htmlContent || '');
      setCss(portfolio.cssContent || '');
      setJs(portfolio.jsContent || '');
      setIsPublic(portfolio.isPublic || false);
    }
  }, [portfolio]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => portfolioService.savePortfolio({ rawHtml: html, cssContent: css, jsContent: js }),
    onSuccess: () => {
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  // Visibility toggle mutation
  const visibilityMutation = useMutation({
    mutationFn: (val) => portfolioService.toggleVisibility(val),
    onSuccess: (_, val) => {
      setIsPublic(val);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const handleChange = (setter) => (val) => { setter(val); setDirty(true); };

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
        onSave={() => saveMutation.mutate()}
        onTogglePreview={() => setShowPreview(!showPreview)}
        isSaving={saveMutation.isPending}
        saveSuccess={saveSuccess}
        showPreview={showPreview}
        isPublic={isPublic}
        onToggleVisibility={() => visibilityMutation.mutate(!isPublic)}
        dirty={dirty}
        displayName={user?.displayName}
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
              <CodePanel language="HTML" value={html} onChange={handleChange(setHtml)} placeholder="<div>\n  <h1>Hello World</h1>\n  <p>Build your portfolio here...</p>\n</div>" />
            )}
            {activeTab === 'css' && (
              <CodePanel language="CSS" value={css} onChange={handleChange(setCss)} placeholder="body {\n  font-family: 'Inter', sans-serif;\n  background: #0f172a;\n  color: white;\n}" />
            )}
            {activeTab === 'js' && (
              <CodePanel language="JavaScript" value={js} onChange={handleChange(setJs)} placeholder="// Add interactivity\nconsole.log('Portfolio loaded!');" />
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
