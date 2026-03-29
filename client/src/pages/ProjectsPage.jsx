import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { projectService } from '@/services/projectService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Plus, FolderGit2, X } from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', repoLink: '', liveUrl: '', techStack: '' });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?._id],
    queryFn: () => projectService.getProjects(user._id),
    enabled: !!user?._id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setForm({ name: '', description: '', repoLink: '', liveUrl: '', techStack: '' });
    },
  });

  const handleCreate = () => {
    const data = {
      ...form,
      techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderGit2 className="h-8 w-8 text-accent-cyan" />
            Projects
          </h1>
          <p className="text-muted mt-1">Showcase your best work and open-source contributions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Project'}
        </Button>
      </div>

      {/* Add Project Form */}
      {showForm && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>New Project</CardTitle>
            <CardDescription>Add a project to your portfolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Awesome App" />
              </div>
              <div className="space-y-2">
                <Label>Tech Stack (comma-separated)</Label>
                <Input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="React, Node.js, MongoDB" />
              </div>
              <div className="space-y-2">
                <Label>Repository Link</Label>
                <Input value={form.repoLink} onChange={(e) => setForm({ ...form, repoLink: e.target.value })} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Live URL</Label>
                <Input value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-card-elevated px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what this project does..."
              />
            </div>
            <Button onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted">
          <FolderGit2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-2">Click "Add Project" to showcase your work</p>
        </div>
      )}
    </div>
  );
}
