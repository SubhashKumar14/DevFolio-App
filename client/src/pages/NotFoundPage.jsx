import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 animate-fade-in">
        <Construction className="h-16 w-16 text-accent-orange mx-auto" />
        <div>
          <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl text-muted mt-2">Page not found</p>
          <p className="text-sm text-muted/70 mt-1">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
