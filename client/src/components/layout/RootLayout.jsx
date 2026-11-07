import { Outlet, Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { BrandMark } from './BrandMark';

export function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-[72px]" id="main-content">
        <Outlet />
      </main>
      <footer className="dv-footer py-12">
        <div className="dv-content-width px-5 sm:px-8">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10 pb-12">
            <div>
              <BrandMark />
              <p className="text-sm text-muted max-w-sm leading-relaxed mt-5">
                DevFolio brings a developer's platforms, progress, projects and portfolio into one place.
              </p>
            </div>
            <div>
              <h2 className="dv-kicker mb-5">Product</h2>
              <div className="flex flex-col items-start gap-3 text-sm">
                <Link to="/register" className="text-muted hover:text-foreground">Create an account</Link>
                <Link to="/login" className="text-muted hover:text-foreground">Sign in</Link>
                <Link to="/design-studio" className="text-muted hover:text-foreground">Explore designs</Link>
              </div>
            </div>
            <div>
              <h2 className="dv-kicker mb-5">Platform support</h2>
              <p className="text-sm text-muted leading-relaxed">GitHub · LeetCode · Codeforces · HackerRank · CodeChef · Kaggle · Hugging Face</p>
            </div>
          </div>
          <div className="dv-rule pt-6 flex flex-wrap justify-between items-center gap-3 text-xs text-muted">
            <span>© {new Date().getFullYear()} DevFolio</span>
            <span className="inline-flex gap-2 items-center">Built to make work visible <ArrowUpRight size={14} aria-hidden="true"/></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
