import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const FIELDS = [
  { key: 'displayName', label: 'Display name', check: (u) => !!u?.displayName },
  { key: 'bio', label: 'Bio', check: (_, p) => !!p?.bio },
  { key: 'avatarUrl', label: 'Profile photo', check: (_, p) => !!p?.avatarUrl },
  { key: 'githubUsername', label: 'GitHub connected', check: (u) => !!u?.githubUsername },
  { key: 'leetcodeUsername', label: 'LeetCode connected', check: (u) => !!u?.leetcodeUsername },
  { key: 'codeforcesUsername', label: 'Codeforces connected', check: (u) => !!u?.codeforcesUsername },
  { key: 'techStack', label: 'Tech stack', check: (_, p) => p?.techStack?.length > 0 },
  { key: 'college', label: 'College / University', check: (_, p) => !!p?.college },
  { key: 'linkedin', label: 'LinkedIn link', check: (_, p) => !!p?.socialLinks?.linkedin },
  { key: 'portfolio', label: 'Portfolio created', check: (_, __, hasPortfolio) => !!hasPortfolio },
];

export default function ProfileCompleteness({ user, profile, hasPortfolio }) {
  const { pct, completed, missing } = useMemo(() => {
    const results = FIELDS.map((f) => ({
      ...f,
      done: f.check(user, profile, hasPortfolio),
    }));
    const done = results.filter((r) => r.done).length;
    return {
      pct: Math.round((done / FIELDS.length) * 100),
      completed: done,
      missing: results.filter((r) => !r.done),
    };
  }, [user, profile, hasPortfolio]);

  const gradientColor = pct >= 80 ? 'from-green-500 to-emerald-400' :
                         pct >= 50 ? 'from-cyan-500 to-blue-400' :
                                     'from-orange-500 to-amber-400';

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Profile Completeness</h3>
        <span className={`text-lg font-bold bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-card-elevated overflow-hidden mb-4">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientColor} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Missing items */}
      {missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted mb-2">Complete these to improve your profile:</p>
          {missing.slice(0, 4).map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-xs text-muted">
              <Circle className="h-3 w-3 text-muted/40 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
          {missing.length > 4 && (
            <Link to="/dashboard/settings" className="text-xs text-accent-cyan hover:underline flex items-center gap-1 mt-1">
              +{missing.length - 4} more <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {pct === 100 && (
        <div className="flex items-center gap-2 text-xs text-accent-green">
          <CheckCircle2 className="h-4 w-4" />
          Profile is 100% complete!
        </div>
      )}
    </div>
  );
}
