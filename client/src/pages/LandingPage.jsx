import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Activity, BarChart3, Boxes, Braces,
  BriefcaseBusiness, Check, Code2, Compass, GitBranch,
  GraduationCap, LayoutDashboard, Layers3, Target, UserRoundSearch,
} from 'lucide-react';

const trackedPlatforms = [
  'GitHub', 'LeetCode', 'Codeforces', 'HackerRank', 'CodeChef', 'Kaggle', 'Hugging Face',
];

const fivePillars = [
  ['Problem solving', '68%'],
  ['Building', '80%'],
  ['Community', '54%'],
  ['Consistency', '73%'],
  ['Specialization', '61%'],
];

const productFeatures = [
  { index: '01', icon: GitBranch, title: 'Your platforms, connected', description: 'Bring activity from seven supported coding platforms into one view. Stop switching tabs just to see your progress.' },
  { index: '02', icon: BarChart3, title: 'A score with context', description: 'Explore a five-pillar DevScore shaped by your developer archetype, not just a single number.' },
  { index: '03', icon: Target, title: 'Progress you can follow', description: 'Review activity, goals, contests and platform history in the same workspace.' },
  { index: '04', icon: Braces, title: 'Work worth showing', description: 'Bring projects, developer identity and a public portfolio together for people who want to see your work.' },
];

function ProductPlate() {
  return (
    <div className="dv-product-plate" aria-label="Illustration of the DevScore interface, with no live account data">
      <div className="dv-plate-header">
        <div className="flex items-center gap-3">
          <div className="dv-dots" aria-hidden="true"><span /><span /><span /></div>
          <span className="dv-panel-label">Workspace / score overview</span>
        </div>
        <Activity size={17} className="text-accent-cyan" aria-hidden="true" />
      </div>
      <div className="dv-plate-body">
        <div className="flex flex-col justify-between py-2">
          <div>
            <p className="dv-panel-label mb-3">Your DevScore</p>
            <div className="dv-score-large">—<span>/</span>1000</div>
          </div>
          <p className="text-xs text-muted leading-relaxed max-w-[210px]">
            Your score appears after you connect and sync your profiles.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="dv-plate-metric">
            <GitBranch size={18} className="text-accent-cyan" />
            <p className="dv-panel-label mt-3">Connections</p>
            <strong>7 available</strong>
          </div>
          <div className="dv-plate-metric">
            <Layers3 size={18} className="text-accent-cyan" />
            <p className="dv-panel-label mt-3">Scoring</p>
            <strong>5 pillars</strong>
          </div>
          <div className="dv-plate-metric col-span-2">
            <div className="flex items-center justify-between">
              <p className="dv-panel-label">Developer identity</p>
              <Code2 size={16} className="text-accent-cyan" />
            </div>
            <strong>Choose your archetype</strong>
          </div>
        </div>
      </div>
      <p className="dv-panel-label mb-2">How DevScore is organized</p>
      <div aria-label="Illustrative pillar layout; bars do not represent real scores">
        {fivePillars.map(([name, width]) => (
          <div className="dv-plate-pillar" key={name}>
            <span>{name}</span>
            <i style={{ '--pillar-width': width }} aria-hidden="true" />
          </div>
        ))}
      </div>
      <p className="dv-plate-annotation">
        Interface illustration, not live user data. Exact metrics are available after account connection.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="dv-landing">
      <section className="dv-hero dv-content-width" aria-labelledby="hero-title">
        <div>
          <p className="dv-hero-kicker dv-kicker">A better record of your work</p>
          <h1 id="hero-title" className="dv-hero-title">
            Show the work.<br /><em>Not just</em><br />the résumé.
          </h1>
          <p className="dv-hero-copy">
            Code, contests, projects, and progress tend to live in different places.
            DevFolio brings them together in a developer profile built for how you actually work.
          </p>
          <div className="dv-hero-actions">
            <Link to="/register" className="dv-primary-link">
              Build your DevFolio <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/login" className="dv-secondary-link">
              Sign in <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <p className="dv-hero-footnote">7 platforms · 5 scoring pillars · built around real developer activity</p>
        </div>
        <ProductPlate />
      </section>

      <section className="dv-section-alt" aria-label="Supported coding platforms">
        <div className="dv-content-width px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <span className="dv-kicker">Works with the tools you use</span>
            <span className="dv-panel-label">Seven supported platforms</span>
          </div>
          <div className="dv-platform-grid">
            {trackedPlatforms.map((platform, i) => (
              <div className="dv-platform" key={platform}>
                <span className="dv-platform-number">0{i + 1}</span>{platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dv-section dv-content-width" id="features" aria-labelledby="feature-heading">
        <div className="dv-section-header">
          <div>
            <p className="dv-kicker mb-4">A workspace, not a scoreboard</p>
            <h2 className="dv-section-title" id="feature-heading">Everything connects.<br />Nothing gets lost.</h2>
          </div>
          <p className="dv-section-intro">The tools are useful on their own. The real value is seeing how each part of your work fits together.</p>
        </div>
        <div className="dv-features">
          {productFeatures.map(({ index, icon: Icon, title, description }) => (
            <article className="dv-feature" key={index}>
              <span className="dv-feature-index">{index} / 04</span>
              <div className="dv-feature-icon"><Icon size={22} strokeWidth={1.65} aria-hidden="true" /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dv-section dv-section-alt" id="how-it-works" aria-labelledby="flow-heading">
        <div className="dv-content-width">
          <p className="dv-kicker mb-4">The workflow</p>
          <div className="dv-section-header">
            <h2 className="dv-section-title" id="flow-heading">From scattered activity<br />to a clearer story.</h2>
            <p className="dv-section-intro">The app is built around three familiar steps. No imaginary insights, no made-up developer rankings.</p>
          </div>
          <div className="dv-journey">
            <div className="dv-step">
              <span className="dv-kicker">01 — Connect</span>
              <GitBranch size={26} strokeWidth={1.4} className="text-accent-cyan mt-6" />
              <strong>Start with your accounts.</strong>
              <p>Connect supported platform handles and let DevFolio bring available public metrics into your dashboard.</p>
            </div>
            <div className="dv-step">
              <span className="dv-kicker">02 — Understand</span>
              <Activity size={26} strokeWidth={1.4} className="text-accent-cyan mt-6" />
              <strong>Make sense of the signals.</strong>
              <p>Explore your DevScore pillars, activity patterns, projects and goals from one consistent workspace.</p>
            </div>
            <div className="dv-step">
              <span className="dv-kicker">03 — Present</span>
              <Compass size={26} strokeWidth={1.4} className="text-accent-cyan mt-6" />
              <strong>Let the work speak.</strong>
              <p>Shape a portfolio and public profile that helps others understand what you build and how you grow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dv-section dv-content-width" aria-labelledby="roles-heading">
        <div className="dv-section-header">
          <div>
            <p className="dv-kicker mb-4">Different perspectives</p>
            <h2 id="roles-heading" className="dv-section-title">Made for the people<br />around the work.</h2>
          </div>
          <p className="dv-section-intro">DevFolio has role-specific spaces. Your view changes according to how you use the platform.</p>
        </div>
        <div className="dv-role-grid">
          <div className="dv-role">
            <Code2 size={24} strokeWidth={1.5} className="text-accent-cyan" />
            <h3>Developers</h3>
            <p>Track your technical activity, shape your identity, and publish work you are proud to show.</p>
          </div>
          <div className="dv-role">
            <UserRoundSearch size={24} strokeWidth={1.5} className="text-accent-cyan" />
            <h3>Recruiters</h3>
            <p>Discover developers and evaluate profiles using skills, archetypes and platform signals.</p>
          </div>
          <div className="dv-role">
            <GraduationCap size={24} strokeWidth={1.5} className="text-accent-cyan" />
            <h3>Mentors</h3>
            <p>Follow development over time and bring goals, progress and guidance into one place.</p>
          </div>
        </div>
      </section>

      <section className="dv-section dv-section-alt" aria-labelledby="cta-heading">
        <div className="dv-content-width dv-endcap">
          <div>
            <p className="dv-kicker mb-4">Your next chapter</p>
            <h2 id="cta-heading">Your work deserves<br />a better home.</h2>
            <p>Start with what you already do. Build a record of your progress, then make it yours.</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link to="/register" className="dv-primary-link">Create your account <ArrowUpRight size={17} /></Link>
            <Link to="/design-studio" className="text-sm text-muted hover:text-foreground underline underline-offset-4">
              Explore the five visual directions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
