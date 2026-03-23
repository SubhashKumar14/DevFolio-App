import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, FolderGit2, FileCode2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-accent-orange mx-auto" />
          <p className="text-lg font-medium text-muted">Admin access required</p>
        </div>
      </div>
    );
  }

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => { const res = await apiClient.get('/admin/stats'); return res.data; },
  });

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => { const res = await apiClient.get('/admin/users?limit=50'); return res.data; },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/trigger-sync'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminStats'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => apiClient.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => apiClient.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-accent-cyan' },
    { label: 'Public Portfolios', value: stats?.publicPortfolios ?? '—', icon: FileCode2, color: 'text-accent-green' },
    { label: 'Total Projects', value: stats?.totalProjects ?? '—', icon: FolderGit2, color: 'text-accent-purple' },
    { label: 'Score Records', value: stats?.totalScores ?? '—', icon: BarChart3, color: 'text-accent-orange' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-accent-red" /> Admin Panel
          </h1>
          <p className="text-muted mt-1">Platform management and user oversight.</p>
        </div>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Trigger Global Sync'}
        </Button>
      </div>

      {syncMutation.isSuccess && (
        <div className="p-3 rounded-lg bg-accent-green/10 text-accent-green text-sm font-medium border border-accent-green/20">
          ✅ {syncMutation.data?.data?.message}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={s.label} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="pt-6 text-center">
              <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({usersData?.users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users?.map((u) => (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-card-elevated/50">
                    <td className="p-3 font-medium">{u.displayName}</td>
                    <td className="p-3 text-muted">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ userId: u._id, role: e.target.value })}
                        disabled={u._id === user._id}
                        className="bg-card-elevated border border-border rounded px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="developer">developer</option>
                        <option value="recruiter">recruiter</option>
                        <option value="mentor">mentor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={u._id === user._id}
                        onClick={() => { if (confirm(`Delete ${u.displayName}?`)) deleteMutation.mutate(u._id); }}
                        className="text-accent-red hover:text-accent-red/80 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
