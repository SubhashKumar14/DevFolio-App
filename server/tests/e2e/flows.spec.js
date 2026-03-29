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
});
