import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

function createObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

function mockFindOneSelectLean(spy, value) {
  const lean = jest.fn().mockResolvedValue(value);
  const select = jest.fn().mockReturnValue({ lean });
  spy.mockReturnValue({ select });
  return { select, lean };
}

describe('Auth/privacy/role route integration', () => {
  let app;
  let User;
  let Profile;
  let Project;
  let GithubStats;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devfolio_test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_e2e_routes_only_123456';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_e2e_routes_only_123456';

    const express = (await import('express')).default;
    const { errorHandler } = await import('../../src/middleware/errorHandler.js');
    const { default: authRoutes } = await import('../../src/routes/authRoutes.js');
    const { default: profileRoutes } = await import('../../src/routes/profileRoutes.js');
    const { default: projectRoutes } = await import('../../src/routes/projectRoutes.js');
    const { default: statsRoutes } = await import('../../src/routes/statsRoutes.js');
    const { default: scoreRoutes } = await import('../../src/routes/scoreRoutes.js');
    const { default: recruiterRoutes } = await import('../../src/routes/recruiterRoutes.js');
    const { default: exportRoutes } = await import('../../src/routes/exportRoutes.js');

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/score', scoreRoutes);
    app.use('/api/recruiter', recruiterRoutes);
    app.use('/api/user', exportRoutes);
    app.use(errorHandler);

    ({ default: User } = await import('../../src/models/User.js'));
    ({ default: Profile } = await import('../../src/models/Profile.js'));
    ({ default: Project } = await import('../../src/models/Project.js'));
    ({ default: GithubStats } = await import('../../src/models/GithubStats.js'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('GET /api/projects/:userId blocks cross-user reads for non-admin', async () => {
    const requesterId = createObjectId();
    const otherUserId = createObjectId();

    const accessToken = jwt.sign(
      { userId: requesterId, role: 'developer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    jest.spyOn(User, 'findById').mockResolvedValue({ _id: requesterId, role: 'developer' });
    const projectFindSpy = jest.spyOn(Project, 'find').mockResolvedValue([]);

    const response = await request(app)
      .get(`/api/projects/${otherUserId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not authorized/i);
    expect(projectFindSpy).not.toHaveBeenCalled();
  });

  test('GET /api/stats/github/:userId denies private profile to non-owner', async () => {
    const targetUserId = createObjectId();

    mockFindOneSelectLean(jest.spyOn(Profile, 'findOne'), { isPublic: false });
    const githubStatsSpy = jest.spyOn(GithubStats, 'findOne').mockResolvedValue(null);

    const response = await request(app).get(`/api/stats/github/${targetUserId}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/private/i);
    expect(githubStatsSpy).not.toHaveBeenCalled();
  });

  test('GET /api/score/:userId denies private profile to non-owner', async () => {
    const targetUserId = createObjectId();

    jest.spyOn(User, 'findById').mockResolvedValue({ _id: targetUserId, archetype: 'builder' });
    mockFindOneSelectLean(jest.spyOn(Profile, 'findOne'), { isPublic: false });

    const response = await request(app).get(`/api/score/${targetUserId}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/private/i);
  });

  test('GET /api/profile/:userId excludes email for visitors but includes it for the owner', async () => {
    const targetUserId = createObjectId();
    const selectedFields = [];

    jest.spyOn(Profile, 'findOne').mockImplementation(() => ({
      populate: async (_field, projection) => {
        selectedFields.push(projection.split(' '));
        const user = {
          _id: targetUserId,
          displayName: 'Example Developer',
          email: 'private@example.test',
        };
        if (!projection.split(' ').includes('email')) delete user.email;
        return { isPublic: true, userId: user };
      },
    }));

    const publicResponse = await request(app).get(`/api/profile/${targetUserId}`);
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.data.userId.email).toBeUndefined();
    expect(selectedFields[0]).not.toContain('email');

    const accessToken = jwt.sign({ userId: targetUserId, role: 'developer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: targetUserId, role: 'developer' });

    const ownerResponse = await request(app)
      .get(`/api/profile/${targetUserId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data.userId.email).toBe('private@example.test');
    expect(selectedFields[1]).toContain('email');
  });

  test('GET /api/user/search returns only users with public profiles', async () => {
    const publicUserId = createObjectId();
    const privateUserId = createObjectId();

    const userSelect = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([
        { _id: publicUserId, displayName: 'PublicUser' },
        { _id: privateUserId, displayName: 'PrivateUser' },
      ]),
    });
    jest.spyOn(User, 'find').mockReturnValue({ select: userSelect });

    const profileSelect = jest.fn().mockResolvedValue([
      { userId: publicUserId, avatarUrl: 'https://example.com/a.png', college: 'A College', isPublic: true },
    ]);
    jest.spyOn(Profile, 'find').mockReturnValue({ select: profileSelect });

    const response = await request(app).get('/api/user/search').query({ q: 'user' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].displayName).toBe('PublicUser');
  });

  test('GET /api/recruiter/search blocks non-recruiter role', async () => {
    const requesterId = createObjectId();
    const accessToken = jwt.sign(
      { userId: requesterId, role: 'developer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    jest.spyOn(User, 'findById').mockResolvedValue({ _id: requesterId, role: 'developer' });

    const response = await request(app)
      .get('/api/recruiter/search')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/insufficient permissions|access denied/i);
  });

  test('POST /api/auth/refresh accepts cookie token and rotates auth cookie', async () => {
    const userId = createObjectId();
    const oldRefreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const select = jest.fn().mockResolvedValue({ _id: userId, refreshToken: oldRefreshToken });
    jest.spyOn(User, 'findById').mockReturnValue({ select });
    jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${encodeURIComponent(oldRefreshToken)}`])
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.refreshToken).toBeUndefined();

    const setCookie = response.headers['set-cookie'] || [];
    expect(setCookie.some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);
    expect(setCookie.some((cookie) => /HttpOnly/i.test(cookie))).toBe(true);
  });
});
