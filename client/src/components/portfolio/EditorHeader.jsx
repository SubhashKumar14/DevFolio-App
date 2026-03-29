import { Button } from '@/components/ui/button';
import { Save, Eye, EyeOff, Loader2, ExternalLink, Globe, Lock, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EditorHeader({ onSave, onTogglePreview, isSaving, saveSuccess, showPreview, isPublic, onToggleVisibility, dirty, displayName }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-muted hover:text-foreground transition-colors" title="Back to Dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-lg font-bold tracking-tight">Portfolio Editor</h2>
        {dirty && (
          <span className="text-xs text-accent-orange font-medium animate-pulse">● Unsaved changes</span>
        )}
        {saveSuccess && (
          <span className="text-xs text-accent-green font-medium flex items-center gap-1">
            <Check className="h-3 w-3" /> Saved!
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Visibility toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="gap-1.5"
          title={isPublic ? 'Portfolio is public' : 'Portfolio is private'}
        >
          {isPublic ? <Globe className="h-3.5 w-3.5 text-accent-green" /> : <Lock className="h-3.5 w-3.5 text-muted" />}
          {isPublic ? 'Public' : 'Private'}
        </Button>

        {/* Open public preview */}
        {displayName && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(`/portfolio/${encodeURIComponent(displayName)}`, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Live
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onTogglePreview} className="gap-1.5">
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>

        <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
