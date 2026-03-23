import { ExternalLink } from 'lucide-react';

export default function PortfolioPill({ userId, isPublic }) {
  if (!isPublic) return null;
  return (
    <a
      href={`/profile/${userId}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
    >
      Portfolio <ExternalLink className="h-3 w-3" />
    </a>
  );
}
