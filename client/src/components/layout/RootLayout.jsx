import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className="py-12 md:py-16 border-t border-border bg-card/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" className="flex items-center space-x-2">
                <Code2 className="h-6 w-6 text-accent-cyan" />
                <span className="font-extrabold text-xl">Dev<span className="text-accent-cyan">Folio</span></span>
              </Link>
              <p className="text-sm text-muted max-w-xs leading-relaxed">
                The unified developer profile platform. Track core coding platforms, get your DevScore, and stand out to recruiters.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground-bright uppercase tracking-wider">Product</h4>
              <div className="space-y-2">
                <Link to="/register" className="block text-sm text-muted hover:text-foreground transition-colors">Get Started</Link>
                <Link to="/login" className="block text-sm text-muted hover:text-foreground transition-colors">Sign In</Link>
                <Link to="/dashboard/leaderboard" className="block text-sm text-muted hover:text-foreground transition-colors">Leaderboard</Link>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground-bright uppercase tracking-wider">Platforms</h4>
              <div className="space-y-2">
                <span className="block text-sm text-muted">GitHub · LeetCode</span>
                <span className="block text-sm text-muted">Codeforces · Kaggle</span>
                <span className="block text-sm text-muted">HackerRank · CodeChef · Hugging Face</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} DevFolio. Built for developers.
            </p>
            <p className="text-xs text-muted/60">
              All metrics tracked · All scores earned
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}