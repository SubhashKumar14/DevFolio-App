import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createElement, useState, useEffect, useRef } from 'react';
import {
  Code2, Trophy, LineChart, Users, Shield, Zap, Globe, ArrowRight,
  ChevronRight, Star, GitBranch, Layers, Brain, BarChart3, Target,
  CheckCircle, Github, Monitor, Sparkles,
} from 'lucide-react';

// ─── Animated Counter ──────────────────────────────
function AnimatedNumber({ target, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const inc = target / (duration / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Orbs Background ─────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -left-20 w-60 h-60 bg-accent-purple/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

// ─── DevScore Ring Animation ──────────────────────
function DevScoreRing({ score = 742 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const circumference = 2 * Math.PI * 54;
  const progress = (animatedScore / 1000) * circumference;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const inc = score / 60;
    const timer = setInterval(() => {
      start += inc;
      if (start >= score) { setAnimatedScore(score); clearInterval(timer); }
      else setAnimatedScore(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, score]);

  return (
    <div ref={ref} className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground-bright">{animatedScore}</span>
        <span className="text-xs text-muted">/ 1000</span>
      </div>
    </div>
  );
}

// ─── Platform Logo Grid ───────────────────────────
const platformLogos = [
  { name: 'GitHub', color: '#39d353' },
  { name: 'LeetCode', color: '#FFA116' },
  { name: 'Codeforces', color: '#3B82F6' },
  { name: 'HackerRank', color: '#00C38C' },
  { name: 'CodeChef', color: '#B57044' },
  { name: 'Kaggle', color: '#20BEFF' },
  { name: 'GFG', color: '#1FA759' },
  { name: 'AtCoder', color: '#00BFFF' },
  { name: 'Stack Overflow', color: '#F48024' },
  { name: 'HackerEarth', color: '#444CF7' },
  { name: 'Hugging Face', color: '#FFD533' },
  { name: 'TryHackMe', color: '#D43232' },
  { name: 'CodeSignal', color: '#8149F3' },
  { name: 'Dev.to', color: '#5A67D8' },
  { name: 'GitLab', color: '#FC6D26' },
];

function PlatformMarquee() {
  return (
    <div className="overflow-hidden py-8">
      <div className="flex animate-marquee gap-6">
        {[...platformLogos, ...platformLogos].map((p, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card/60 backdrop-blur-sm hover:border-accent-cyan/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-cyan/5"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────
function FeatureCard({ icon, title, description, color, delay = '0ms' }) {
  return (
    <div
      className="group relative p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl animate-slide-up overflow-hidden"
      style={{ animationDelay: delay, '--feature-color': color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }} />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
          {createElement(icon, { className: 'h-7 w-7', style: { color } })}
        </div>
        <h3 className="text-xl font-bold mb-3 text-foreground-bright">{title}</h3>
        <p className="text-muted leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}

// ─── How It Works Step ────────────────────────────
function StepCard({ number, title, description, icon }) {
  return (
    <div className="relative flex flex-col items-center text-center group">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {createElement(icon, { className: 'w-8 h-8 text-accent-cyan' })}
      </div>
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent-cyan text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-accent-cyan/30">
        {number}
      </div>
      <h3 className="text-lg font-bold mb-2 text-foreground-bright">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Testimonial Card ────────────────────────────
function TestimonialCard({ quote, name, role, rating }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-accent-cyan/30 transition-all duration-300">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-accent-yellow text-accent-yellow" />
        ))}
      </div>
      <p className="text-foreground/80 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground-bright">{name}</p>
          <p className="text-xs text-muted">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Archetype Card ──────────────────────────────
function ArchetypeCard({ icon, badge, description, color }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card/50 hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 group" style={{ '--archetype-color': color }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-foreground-bright">{badge}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Main Landing Page
// ═══════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* ─── Hero Section ─────────────────────────── */}
      <section className="relative w-full px-6 py-24 md:py-32 lg:py-44 text-center max-w-6xl mx-auto">
        <FloatingOrbs />
        <div className="relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan text-sm font-medium animate-fade-in">
            <Sparkles className="w-4 h-4" />
            15 Platforms · DevScore 0–1000 · AI-Powered Insights
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-devscore animate-fade-in leading-tight">
            Your Entire Developer
            <br />
            Journey in One Place
          </h1>

          <p className="text-lg md:text-xl text-muted animate-slide-up max-w-2xl mx-auto leading-relaxed">
            Aggregate metrics from <span className="text-foreground-bright font-semibold">15+ platforms</span> including GitHub, LeetCode, Codeforces, Kaggle, and more into a single shareable profile with a unified <span className="text-accent-cyan font-semibold">DevScore</span>.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg shadow-accent-cyan/25 hover:shadow-xl hover:shadow-accent-cyan/30 transition-all duration-300">
                Get Started — It's Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold rounded-full border-2 hover:bg-card-elevated transition-all duration-300">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-foreground-bright">
                <AnimatedNumber target={15} suffix="+" />
              </p>
              <p className="text-sm text-muted mt-1">Platforms Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-foreground-bright">
                <AnimatedNumber target={1000} />
              </p>
              <p className="text-sm text-muted mt-1">DevScore Scale</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-foreground-bright">
                <AnimatedNumber target={6} />
              </p>
              <p className="text-sm text-muted mt-1">Developer Archetypes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-foreground-bright">
                <AnimatedNumber target={5} />
              </p>
              <p className="text-sm text-muted mt-1">Scoring Pillars</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Marquee ─────────────────────── */}
      <section className="w-full border-y border-border bg-card/30 py-2">
        <div className="text-center mb-4 pt-6">
          <p className="text-sm text-muted font-medium uppercase tracking-widest">Platforms We Integrate With</p>
        </div>
        <PlatformMarquee />
      </section>

      {/* ─── DevScore Showcase Section ────────────── */}
      <section className="w-full px-6 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-purple/30 bg-accent-purple/5 text-accent-purple text-xs font-medium">
              <BarChart3 className="w-3.5 h-3.5" />
              DevScore v2 Algorithm
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              One Score to
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> Rule Them All</span>
            </h2>
            <p className="text-muted leading-relaxed text-lg">
              Our 5-pillar scoring engine evaluates your skills across Problem Solving, Building & Shipping, Community, Consistency, and Specialization — tailored to your developer archetype.
            </p>
            <div className="space-y-3">
              {['Problem-Solving Prowess', 'Building & Shipping', 'Community & Knowledge', 'Consistency & Growth', 'Specialization Depth'].map((pillar) => (
                <div key={pillar} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0" />
                  <span className="text-foreground">{pillar}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DevScore Demo Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-purple/10 rounded-3xl blur-xl" />
            <div className="relative p-8 rounded-3xl border border-border bg-card/80 backdrop-blur-sm space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted mb-4">Sample Developer Profile</p>
                <DevScoreRing score={742} />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-xl">🧩</span>
                  <span className="text-lg font-bold text-foreground-bright">Problem Solver</span>
                </div>
              </div>
              {/* Pillar Bars */}
              <div className="space-y-3">
                {[
                  { name: 'Problem Solving', score: 210, max: 250, color: '#06b6d4' },
                  { name: 'Building', score: 65, max: 100, color: '#8b5cf6' },
                  { name: 'Community', score: 30, max: 100, color: '#22c55e' },
                  { name: 'Consistency', score: 180, max: 200, color: '#f59e0b' },
                  { name: 'Specialization', score: 257, max: 350, color: '#ec4899' },
                ].map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">{p.name}</span>
                      <span className="text-foreground font-medium">{p.score}/{p.max}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(p.score / p.max) * 100}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────── */}
      <section className="w-full px-6 py-24 lg:py-32 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> Stand Out</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              From real-time analytics to portfolio building — DevFolio is the complete developer profile platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Layers}
              title="15+ Platform Integration"
              description="Connect GitHub, LeetCode, Codeforces, Kaggle, HackerRank, CodeChef, and 9 more platforms in one click."
              color="#06b6d4"
              delay="0ms"
            />
            <FeatureCard
              icon={BarChart3}
              title="DevScore 0–1000"
              description="Get scored across 5 pillars with archetype-aware weighting. Quality over quantity — your real skill, quantified."
              color="#8b5cf6"
              delay="100ms"
            />
            <FeatureCard
              icon={Target}
              title="Developer Archetypes"
              description="Choose your identity: Builder, Problem Solver, AI Engineer, Security Expert, Open Source, or Competitor."
              color="#ec4899"
              delay="200ms"
            />
            <FeatureCard
              icon={LineChart}
              title="Advanced Analytics"
              description="3-level analytics depth with radar charts, heatmaps, trend lines, and per-platform deep dives."
              color="#22c55e"
              delay="300ms"
            />
            <FeatureCard
              icon={Globe}
              title="Portfolio Builder"
              description="Create stunning HTML/CSS/JS portfolios with live preview, console output, and CDN library support."
              color="#f59e0b"
              delay="400ms"
            />
            <FeatureCard
              icon={Users}
              title="Recruiter Dashboard"
              description="Recruiters can search developers by archetype, DevScore, and skills — with full profile visibility."
              color="#f97316"
              delay="500ms"
            />
          </div>
        </div>
      </section>

      {/* ─── App Screenshots Section ─────────────── */}
      <section className="w-full px-6 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              See DevFolio in
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> Action</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              A beautifully designed dashboard that makes your developer data actionable.
            </p>
          </div>

          {/* Screenshot Placeholder Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* INSERT SCREENSHOT: Dashboard Overview - Replace the placeholder below with your dashboard screenshot */}
            {/* To insert: replace the div below with <img src="/path/to/dashboard-screenshot.png" alt="Dashboard" className="w-full rounded-2xl" /> */}
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center group hover:border-accent-cyan/40 transition-colors duration-300">
              <div className="text-center space-y-3 p-6">
                <Monitor className="w-12 h-12 text-muted mx-auto group-hover:text-accent-cyan transition-colors" />
                <p className="text-muted font-medium">Dashboard Overview</p>
                <p className="text-xs text-muted/60">Insert screenshot here</p>
              </div>
            </div>

            {/* INSERT SCREENSHOT: Analytics Page - Replace the placeholder below with your analytics screenshot */}
            {/* To insert: replace the div below with <img src="/path/to/analytics-screenshot.png" alt="Analytics" className="w-full rounded-2xl" /> */}
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center group hover:border-accent-purple/40 transition-colors duration-300">
              <div className="text-center space-y-3 p-6">
                <BarChart3 className="w-12 h-12 text-muted mx-auto group-hover:text-accent-purple transition-colors" />
                <p className="text-muted font-medium">Analytics Deep Dive</p>
                <p className="text-xs text-muted/60">Insert screenshot here</p>
              </div>
            </div>

            {/* INSERT SCREENSHOT: Portfolio Editor - Replace the placeholder below with your portfolio editor screenshot */}
            {/* To insert: replace the div below with <img src="/path/to/portfolio-screenshot.png" alt="Portfolio" className="w-full rounded-2xl" /> */}
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center group hover:border-accent-green/40 transition-colors duration-300">
              <div className="text-center space-y-3 p-6">
                <Code2 className="w-12 h-12 text-muted mx-auto group-hover:text-accent-green transition-colors" />
                <p className="text-muted font-medium">Portfolio Editor</p>
                <p className="text-xs text-muted/60">Insert screenshot here</p>
              </div>
            </div>

            {/* INSERT SCREENSHOT: Public Profile - Replace the placeholder below with your public profile screenshot */}
            {/* To insert: replace the div below with <img src="/path/to/profile-screenshot.png" alt="Profile" className="w-full rounded-2xl" /> */}
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center group hover:border-accent-orange/40 transition-colors duration-300">
              <div className="text-center space-y-3 p-6">
                <Users className="w-12 h-12 text-muted mx-auto group-hover:text-accent-orange transition-colors" />
                <p className="text-muted font-medium">Public Profile</p>
                <p className="text-xs text-muted/60">Insert screenshot here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Archetypes Section ───────────────────── */}
      <section className="w-full px-6 py-24 lg:py-32 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              Find Your Developer
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> Identity</span>
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Choose your archetype to get personalized scoring, recommendations, and a badge on your public profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ArchetypeCard icon="🔨" badge="Full-Stack Builder" description="Builds production apps, contributes to OSS, blogs about tech" color="#06b6d4" />
            <ArchetypeCard icon="🧩" badge="DSA Specialist" description="Master of algorithms and data structures, contest warrior" color="#8b5cf6" />
            <ArchetypeCard icon="🤖" badge="AI/ML Engineer" description="ML models, datasets, Kaggle competitions, Hugging Face" color="#f59e0b" />
            <ArchetypeCard icon="🛡️" badge="Security Researcher" description="CTF challenges, penetration testing, security certifications" color="#ef4444" />
            <ArchetypeCard icon="🌐" badge="Open Source Contributor" description="Max contributions, community reputation, code reviews" color="#22c55e" />
            <ArchetypeCard icon="⚔️" badge="Competitive Programmer" description="Pure contest performance, ratings across CP platforms" color="#ec4899" />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────── */}
      <section className="w-full px-6 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              Get Started in
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> 3 Minutes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard
              number={1}
              icon={Users}
              title="Create Your Profile"
              description="Sign up and choose your developer archetype to personalize your experience."
            />
            <StepCard
              number={2}
              icon={GitBranch}
              title="Connect Platforms"
              description="Link your GitHub, LeetCode, Codeforces, and up to 15 platforms in seconds."
            />
            <StepCard
              number={3}
              icon={Zap}
              title="Get Your DevScore"
              description="Your unified developer score, analytics, and sharable profile are ready instantly."
            />
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────── */}
      <section className="w-full px-6 py-24 lg:py-32 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground-bright">
              Loved by
              <span className="text-transparent bg-clip-text bg-gradient-devscore"> Developers</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="DevFolio replaced 5 different profile tools for me. The DevScore is exactly what I share with recruiters now."
              name="Priya Sharma"
              role="SDE @ Amazon"
              rating={5}
            />
            <TestimonialCard
              quote="The activity heatmap combining all my platforms in one view is genius. Finally one place to track everything."
              name="Alex Chen"
              role="CP Specialist"
              rating={5}
            />
            <TestimonialCard
              quote="As a recruiter, filtering candidates by archetype and DevScore saves me hours of manual profile checking."
              name="Sarah Williams"
              role="Tech Recruiter"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ─── For Companies / For Developers (HackerRank-style) */}
      <section className="w-full px-6 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 md:divide-x divide-border">
            {/* For Companies */}
            <div className="text-center px-8 md:px-16 py-12 space-y-6">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan text-xs font-semibold uppercase tracking-wider">
                Business
              </div>
              <h3 className="text-3xl font-extrabold text-foreground-bright">For Companies</h3>
              <p className="text-muted leading-relaxed">
                Thousands of companies have embraced the new way to hire and evaluate developers across roles and throughout their careers.
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 rounded-lg text-base font-semibold">
                  Login as Recruiter
                </Button>
              </Link>
              <p className="text-sm text-muted">
                Don't have an account? <Link to="/register" className="text-accent-cyan hover:underline font-medium">Get free trial</Link>
              </p>
            </div>

            {/* For Developers */}
            <div className="text-center px-8 md:px-16 py-12 space-y-6">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-green/10 text-accent-green text-xs font-semibold uppercase tracking-wider">
                Developer
              </div>
              <h3 className="text-3xl font-extrabold text-foreground-bright">For Developers</h3>
              <p className="text-muted leading-relaxed">
                Join developers who track their coding journey, practice DSA, prepare for interviews, and get hired faster.
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 rounded-lg text-base font-semibold bg-accent-green hover:bg-accent-green/90">
                  Login as Developer
                </Button>
              </Link>
              <p className="text-sm text-muted">
                Don't have an account? <Link to="/register" className="text-accent-green hover:underline font-medium">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────── */}
      <section className="w-full px-6 py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-purple/5" />
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground-bright">
            Ready to Build Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-devscore">Developer Brand?</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Join DevFolio today and let your code speak louder than your resume.
          </p>
          <Link to="/register">
            <Button size="lg" className="h-16 px-12 text-lg font-bold rounded-full shadow-xl shadow-accent-cyan/25 hover:shadow-2xl hover:shadow-accent-cyan/30 transition-all duration-300 hover:-translate-y-1">
              Start Your Profile — Free Forever
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
