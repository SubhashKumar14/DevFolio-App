import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Github, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProjectCard({ project }) {
  return (
    <Card className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{project.name}</span>
          <div className="flex items-center gap-1 text-sm text-muted">
            <Star className="h-3.5 w-3.5 text-accent-orange" />
            <span>{project.githubStars || 0}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted line-clamp-2">{project.description || 'No description'}</p>
        {project.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map(tech => (
              <span key={tech} className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-full">{tech}</span>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          {project.repoLink && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repoLink} target="_blank" rel="noreferrer" className="gap-1.5">
                <Github className="h-3.5 w-3.5" /> Repo
              </a>
            </Button>
          )}
          {project.liveUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Live
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
