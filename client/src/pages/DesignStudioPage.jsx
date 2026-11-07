import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, MonitorCog } from 'lucide-react';
import { DESIGN_PRESETS } from '@/lib/designPresets';
import { useDesignStore } from '@/stores/designStore';

const bars = ['42%', '68%', '57%', '83%', '50%'];

export default function DesignStudioPage() {
  const design = useDesignStore((state) => state.design);
  const setDesign = useDesignStore((state) => state.setDesign);

  return (
    <main className="dv-content-width px-5 sm:px-8 py-14 md:py-20">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-12">
        <ArrowLeft size={16} /> Return to DevFolio
      </Link>
      <div className="max-w-4xl mb-12">
        <p className="dv-kicker mb-4">DevFolio / Design Studio</p>
        <h1 className="text-5xl md:text-7xl leading-[1.02] mb-6">Five directions.<br/>One real product.</h1>
        <p className="text-muted leading-relaxed text-lg max-w-2xl">
          These are live themes of the DevFolio React interface, not invented dashboard screenshots.
          Choose one to apply its colors, typography, shapes, navigation and component styling across the website.
        </p>
      </div>

      <div className="dv-skin-grid" role="group" aria-label="Choose a visual design">
        {DESIGN_PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className="dv-studio-card text-left"
            data-design-preview={preset.id}
            aria-pressed={design === preset.id}
            aria-label={`Apply ${preset.name} website design`}
            onClick={() => setDesign(preset.id)}
          >
            <div className="dv-studio-sample">
              <div className="dv-studio-mini-nav">
                <span className="dv-platform-number">devfolio.</span>
                <span>{preset.number} / 05</span>
              </div>
              <p className="dv-kicker mb-3" style={{ color: 'var(--accent-cyan)' }}>Workspace / Analytics</p>
              <h3>See the whole picture.</h3>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Five-pillar scoring overview · illustrative layout</p>
              <div className="dv-studio-bars" aria-hidden="true">
                {bars.map((height, i) => <span key={i} style={{ '--bar-height': height }} />)}
              </div>
            </div>
            <div className="dv-studio-copy">
              <div className="flex justify-between items-center gap-3 mb-3">
                <span className="dv-kicker" style={{ color: 'var(--accent-cyan)' }}>{preset.category}</span>
                {design === preset.id && <Check size={20} aria-hidden="true" className="text-accent-cyan" />}
              </div>
              <h3 style={{ color: 'var(--foreground-bright)' }}>{preset.name}</h3>
              <p>{preset.description}</p>
              <span className="text-xs block mt-4" style={{ color: 'var(--muted)' }}>{preset.fit}</span>
              <span className="dv-studio-button">{design === preset.id ? 'Applied to site' : 'Apply this design'} <ArrowUpRight size={14} /></span>
            </div>
          </button>
        ))}
      </div>

      <section className="mt-16 border-t border-border pt-10 flex flex-col lg:flex-row gap-6 justify-between">
        <div>
          <h2 className="text-2xl mb-3">A design system, not five mockups.</h2>
          <p className="text-sm text-muted max-w-xl leading-relaxed">
            Every choice updates the same application routes: dashboard, analytics, projects,
            goals, portfolio, settings, public profiles, recruiter and admin areas.
            No fake user data is required to explore the visual direction.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Link to="/login" className="dv-secondary-link">See your workspace <MonitorCog size={16}/></Link>
          <Link to="/register" className="dv-primary-link">Create an account <ArrowUpRight size={16}/></Link>
        </div>
      </section>
    </main>
  );
}
