import { Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Code2 className="h-4 w-4 text-accent-cyan" />
          <span className="font-semibold text-foreground">DevFolio</span>
          <span>· {new Date().getFullYear()}</span>
        </div>
        <p className="text-xs text-muted">Built for developers who ship.</p>
      </div>
    </footer>
  );
}
