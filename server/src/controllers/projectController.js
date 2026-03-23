import axios from 'axios';
import Project from '../models/Project.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Helper: extract GitHub owner/repo from URL and fetch star count
async function fetchGithubStars(repoLink) {
  if (!repoLink) return 0;
  try {
    const match = repoLink.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return 0;
    const [, owner, repo] = match;
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, '')}`, { timeout: 10000 });
    return res.data.stargazers_count || 0;
  } catch {
    return 0;
  }
}

// ─── Get All Projects for a User ──────────────────
export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ userId: req.params.userId })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: projects });
});

// ─── Create Project ───────────────────────────────
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, repoLink, liveUrl, techStack } = req.body;

  if (!name) {
    throw new AppError('Project name is required', 400);
  }

  // Auto-fetch GitHub stars
  const githubStars = await fetchGithubStars(repoLink);

  const project = await Project.create({
    userId: req.user._id,
    name,
    description: description || '',
    repoLink: repoLink || '',
    liveUrl: liveUrl || '',
    techStack: techStack || [],
    githubStars,
  });

  res.status(201).json({ success: true, data: project });
});


// ─── Update Project ───────────────────────────────
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this project', 403);
  }

  const allowedFields = ['name', 'description', 'repoLink', 'liveUrl', 'techStack'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  }

  await project.save();

  res.json({ success: true, data: project });
});

// ─── Delete Project ───────────────────────────────
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this project', 403);
  }

  await project.deleteOne();

  res.json({ success: true, message: 'Project deleted' });
});
