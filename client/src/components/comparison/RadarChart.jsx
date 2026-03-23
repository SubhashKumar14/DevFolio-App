import { RadarChart as RechartsRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function RadarChart({ data, user1Name = 'You', user2Name = 'Opponent' }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
        <Radar name={user1Name} dataKey="user1" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.3} />
        <Radar name={user2Name} dataKey="user2" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.3} />
        <Legend />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
