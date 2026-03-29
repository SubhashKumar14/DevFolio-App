describe('DevScore engine smoke tests', () => {
	test('computeDevScore returns bounded score and pillar breakdown', async () => {
		const { computeDevScore } = await import('../../src/services/devscoreEngine.js');

		const result = computeDevScore({
			archetype: 'builder',
			platformData: {
				github: {
					publicRepos: 12,
					starsReceived: 40,
					totalCommits: 350,
					pullRequests: 18,
					followers: 10,
					currentStreak: 9,
					forksCount: 6,
				},
				leetcode: {
					totalSolved: 200,
					easySolved: 80,
					mediumSolved: 95,
					hardSolved: 25,
					acceptanceRate: 55,
					contestRating: 1700,
					activeDays: 120,
					maxStreak: 30,
					topPercentage: 22,
				},
			},
		});

		expect(result.overallScore).toBeGreaterThanOrEqual(0);
		expect(result.overallScore).toBeLessThanOrEqual(1000);
		expect(result.maxScore).toBe(1000);
		expect(result.pillars).toHaveProperty('problemSolving');
		expect(result.pillars).toHaveProperty('building');
		expect(result.pillars).toHaveProperty('community');
		expect(result.pillars).toHaveProperty('consistency');
		expect(result.pillars).toHaveProperty('specialization');
	});

	test('missing signals are excluded instead of zero-padded', async () => {
		const { computeDevScore } = await import('../../src/services/devscoreEngine.js');

		const result = computeDevScore({
			archetype: 'problem_solver',
			platformData: {
				leetcode: {
					totalSolved: 180,
					easySolved: 70,
					mediumSolved: 85,
					hardSolved: 25,
					// Intentionally missing contest metrics
				},
			},
		});

		expect(result.platformScores.leetcode.score).toBeGreaterThan(0);
		expect(result.overallScore).toBeGreaterThan(0);
	});

	test('adding a dormant platform does not reduce score', async () => {
		const { computeDevScore } = await import('../../src/services/devscoreEngine.js');

		const baseline = computeDevScore({
			archetype: 'builder',
			platformData: {
				github: {
					publicRepos: 10,
					totalCommits: 300,
					starsReceived: 25,
					pullRequestsTotal: 20,
					pullRequestsMerged: 14,
					followers: 8,
				},
				leetcode: {
					totalSolved: 220,
					easySolved: 90,
					mediumSolved: 100,
					hardSolved: 30,
					contestRating: 1650,
					contestsParticipated: 12,
				},
			},
		});

		const withDormant = computeDevScore({
			archetype: 'builder',
			platformData: {
				github: {
					publicRepos: 10,
					totalCommits: 300,
					starsReceived: 25,
					pullRequestsTotal: 20,
					pullRequestsMerged: 14,
					followers: 8,
				},
				leetcode: {
					totalSolved: 220,
					easySolved: 90,
					mediumSolved: 100,
					hardSolved: 30,
					contestRating: 1650,
					contestsParticipated: 12,
				},
				kaggle: {
					tier: 'Unknown',
				},
			},
		});

		expect(withDormant.overallScore).toBeGreaterThanOrEqual(baseline.overallScore);
	});
});
