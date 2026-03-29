import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import env from '../config/env.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// ─── Helper: Generate Tokens ─────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
}

// ─── Register ─────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { email, password, displayName, role } = req.body;

  if (!email || !password || !displayName) {
    throw new AppError('Email, password, and display name are required', 400);
  }

  // Validate role
  const validRoles = ['developer', 'recruiter', 'mentor'];
  const userRole = validRoles.includes(role) ? role : 'developer';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ email, password, displayName, role: userRole });

  // Create empty profile
  await Profile.create({ userId: user._id });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token via update (avoid user.save() which fails with select:false password)
  await User.findByIdAndUpdate(user._id, { refreshToken });

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  });
});

// ─── Login ────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await User.findByIdAndUpdate(user._id, { refreshToken });

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    },
  });
});

// ─── Refresh Token ────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.userId).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

  res.json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

// ─── Logout ───────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GitHub OAuth: Redirect ───────────────────────
export const githubRedirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: 'read:user,repo',
    redirect_uri: env.GITHUB_CALLBACK_URL,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

// ─── GitHub OAuth: Callback ───────────────────────
export const githubCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new AppError('GitHub authorization code is missing', 400);
  }

  // Exchange code for access token
  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );

  const githubAccessToken = tokenRes.data.access_token;
  if (!githubAccessToken) {
    throw new AppError('Failed to exchange code for GitHub access token', 400);
  }

  // Fetch GitHub user info
  const userRes = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${githubAccessToken}` },
  });

  const { id: githubId, login: githubUsername } = userRes.data;

  // Check if GitHub account is already linked to a user
  let user = await User.findOne({ githubId: String(githubId) });

  if (!user) {
    // If user is authenticated, link to their account
    // Otherwise, this is a new OAuth-only signup (not supported yet, redirect with error)
    throw new AppError('Please log in first and then connect GitHub from settings', 400);
  }

  // Update GitHub info
  user.githubUsername = githubUsername;
  user.githubAccessToken = githubAccessToken;
  await user.save();

  // Generate tokens and redirect to frontend
  const accessToken = generateAccessToken(user);
  res.redirect(`${env.CLIENT_URL}/dashboard#token=${encodeURIComponent(accessToken)}`);
});

// ─── Link GitHub (for authenticated users) ────────
export const linkGithub = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('GitHub authorization code is required', 400);
  }

  // Exchange code for access token
  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );

  const githubAccessToken = tokenRes.data.access_token;
  if (!githubAccessToken) {
    throw new AppError('Failed to exchange code for GitHub access token', 400);
  }

  // Fetch GitHub user info
  const userRes = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${githubAccessToken}` },
  });

  const { id: githubId, login: githubUsername } = userRes.data;

  // Update user with GitHub info
  const user = await User.findById(req.user._id).select('+githubAccessToken');
  user.githubId = String(githubId);
  user.githubUsername = githubUsername;
  user.githubAccessToken = githubAccessToken;
  await user.save();

  res.json({
    success: true,
    message: 'GitHub account connected',
    data: { githubUsername },
  });
});
