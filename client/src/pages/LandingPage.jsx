import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Trophy, LineChart, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full px-6 py-24 md:py-32 lg:py-40 text-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-devscore animate-fade-in">
          Your Entire Developer Journey in One Dashboard
        </h1>
        <p className="text-xl text-muted animate-slide-up max-w-2xl mx-auto">
          Aggregate metrics from 12+ platforms including GitHub, LeetCode, Codeforces, and StackOverflow into a single shareable profile.
        </p>
        <div className="flex justify-center gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-lg font-semibold rounded-full">
              Start Free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-semibold rounded-full border-2">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="container mx-auto px-6 py-20 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Code2 className="h-10 w-10 text-accent-cyan" />}
            title="12+ Platforms Supported"
            description="From competitive programming to open source contributions, we track it all."
            delay="0ms"
          />
          <FeatureCard 
            icon={<LineChart className="h-10 w-10 text-accent-purple" />}
            title="Unified DevScore"
            description="Get a comprehensive Developer DNA profile based on all your platforms."
            delay="100ms"
          />
          <FeatureCard 
            icon={<Trophy className="h-10 w-10 text-accent-orange" />}
            title="Contests & Leaderboards"
            description="Track upcoming contests and benchmark yourself globally."
            delay="200ms"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <div 
      className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:-translate-y-2 transition-all duration-300 hover:shadow-xl hover:shadow-accent-cyan/5 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
