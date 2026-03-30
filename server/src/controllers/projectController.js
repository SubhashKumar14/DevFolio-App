import axios from 'axios';
import Project from '../models/Project.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { normalizeOptionalHttpUrl } from '../utils/inputValidation.js';

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
  const requestedUserId = String(req.params.userId || '');
  const requesterId = String(req.user?._id || '');
  const isAdmin = req.user?.role === 'admin';

  if (!isAdmin && requestedUserId !== requesterId) {
    throw new AppError('Not authorized to read projects for this user', 403);
  }

  const projects = await Project.find({ userId: requestedUserId })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: projects });
});

// ─── Create Project ───────────────────────────────
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, repoLink, liveUrl, techStack } = req.body;

  if (!name) {
    throw new AppError('Project name is required', 400);
  }

  const normalizedRepoLink = normalizeOptionalHttpUrl(repoLink, { allowedHosts: ['github.com'] });
  if (normalizedRepoLink === null) {
    throw new AppError('repoLink must be a valid GitHub URL', 400);
  }

  const normalizedLiveUrl = normalizeOptionalHttpUrl(liveUrl);
  if (normalizedLiveUrl === null) {
    throw new AppError('liveUrl must be a valid http/https URL', 400);
  }

  // Auto-fetch GitHub stars
  const githubStars = await fetchGithubStars(normalizedRepoLink);

  const project = await Project.create({
    userId: req.user._id,
    name,
    description: description || '',
    repoLink: normalizedRepoLink || '',
    liveUrl: normalizedLiveUrl || '',
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
      if (field === 'repoLink') {
        const normalizedRepoLink = normalizeOptionalHttpUrl(req.body[field], { allowedHosts: ['github.com'] });
        if (normalizedRepoLink === null) {
          throw new AppError('repoLink must be a valid GitHub URL', 400);
        }
        project[field] = normalizedRepoLink;
        continue;
      }

      if (field === 'liveUrl') {
        const normalizedLiveUrl = normalizeOptionalHttpUrl(req.body[field]);
        if (normalizedLiveUrl === null) {
          throw new AppError('liveUrl must be a valid http/https URL', 400);
        }
        project[field] = normalizedLiveUrl;
        continue;
      }

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
