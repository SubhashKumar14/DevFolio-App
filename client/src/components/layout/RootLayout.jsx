import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function RootLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans text-foreground">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t border-border bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted">
            Built for developers. All metrics tracked.
          </p>
        </div>
      </footer>
    </div>
  );
}