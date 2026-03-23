import { Button } from '@/components/ui/button';
import { Save, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function EditorHeader({ onSave, onTogglePreview, isSaving, showPreview }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <h2 className="text-lg font-bold tracking-tight">Portfolio Editor</h2>
      <div className="flex items-center gap-2">
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
