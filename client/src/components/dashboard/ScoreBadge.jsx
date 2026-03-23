export function ScoreBadge({ score }) {
  const getGrade = (s) => {
    if (s >= 90) return { grade: 'S', color: 'bg-accent-purple/20 text-accent-purple' };
    if (s >= 75) return { grade: 'A', color: 'bg-accent-cyan/20 text-accent-cyan' };
    if (s >= 60) return { grade: 'B', color: 'bg-accent-green/20 text-accent-green' };
    if (s >= 40) return { grade: 'C', color: 'bg-accent-orange/20 text-accent-orange' };
    return { grade: 'D', color: 'bg-accent-red/20 text-accent-red' };
  };

  const { grade, color } = getGrade(score || 0);

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${color}`}>
      {grade}
    </span>
  );
}
