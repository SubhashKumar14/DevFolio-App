import { Card, CardContent } from '@/components/ui/card';

export function StatsCard({ label, value, icon: Icon, description }) {
  return (
    <Card className="animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted" />}
        </div>
        <h3 className="text-2xl font-bold">{value}</h3>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
