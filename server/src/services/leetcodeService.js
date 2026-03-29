import axios from 'axios';

function parseDailyActivity(submissionCalendar) {
  let dailyActivity = [];
  try {
    const calendar = JSON.parse(submissionCalendar || '{}');
    dailyActivity = Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(parseInt(ts, 10) * 1000).toISOString().split('T')[0],
      count,
    }));
  } catch {
    dailyActivity = [];
  }
  return dailyActivity;
}

function computeMaxStreak(dailyActivity) {
  if (!Array.isArray(dailyActivity) || dailyActivity.length === 0) return 0;
  const activeDates = dailyActivity
    .filter((d) => Number(d.count) > 0)
    .map((d) => d.date)
    .sort();

  if (activeDates.length === 0) return 0;

  let maxStreak = 1;
  let current = 1;
  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(`${activeDates[i - 1]}T00:00:00.000Z`);
    const next = new Date(`${activeDates[i]}T00:00:00.000Z`);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      current += 1;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }
  return maxStreak;
}

function computeCurrentStreak(dailyActivity) {
  if (!Array.isArray(dailyActivity) || dailyActivity.length === 0) return 0;

  const activeDates = dailyActivity
    .filter((d) => Number(d.count) > 0)
    .map((d) => d.date)
    .sort();

  if (activeDates.length === 0) return 0;

  let streak = 1;
  for (let i = activeDates.length - 1; i > 0; i--) {
    const curr = new Date(`${activeDates[i]}T00:00:00.000Z`);
    const prev = new Date(`${activeDates[i - 1]}T00:00:00.000Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Fetch LeetCode stats via the unofficial GraphQL API.
 * @param {string} username - LeetCode username
 * @returns {Object} LeetCode problem-solving stats + submission calendar
 */
export async function fetchLeetcodeStats(username) {
  const enhancedQuery = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        submissionCalendar
        badges {
          id
          displayName
        }
        tagProblemCounts {
          fundamental {
            tagName
            problemsSolved
          }
          intermediate {
            tagName
            problemsSolved
          }
          advanced {
            tagName
            problemsSolved
          }
        }
        languageProblemCount {
          languageName
          problemsSolved
        }
        profile {
          reputation
          solutionCount
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        attendedContestsCount
      }
    }
  `;

  const fallbackQuery = `
    query getUserProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        submissionCalendar
      }
    }
  `;

  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query: enhancedQuery,
      variables: { username },
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const matchedUser = response.data?.data?.matchedUser;
    if (!matchedUser) {
      return {
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalSolved: 0,
        contestRating: null,
        contestGlobalRanking: null,
        acceptanceRate: null,
        currentStreak: 0,
        activeDays: 0,
        maxStreak: 0,
        topPercentage: null,
        contestsParticipated: null,
        badgesEarned: 0,
        categoryWiseProblemCount: [],
        languagesUsed: [],
        solutionCount: null,
        reputation: null,
        dailyActivity: [],
      };
    }

    const acStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const totalStats = matchedUser.submitStatsGlobal?.totalSubmissionNum || [];

    const acAll = acStats.find((s) => s.difficulty === 'All')?.submissions
      ?? acStats.find((s) => s.difficulty === 'All')?.count
      ?? 0;
    const totalAll = totalStats.find((s) => s.difficulty === 'All')?.submissions
      ?? totalStats.find((s) => s.difficulty === 'All')?.count
      ?? 0;
    const acceptanceRate = totalAll > 0 ? (acAll / totalAll) * 100 : null;

    const dailyActivity = parseDailyActivity(matchedUser.submissionCalendar);
    const activeDays = dailyActivity.filter((d) => Number(d.count) > 0).length;
    const maxStreak = computeMaxStreak(dailyActivity);
    const currentStreak = computeCurrentStreak(dailyActivity);
    const contest = response.data?.data?.userContestRanking || null;

    const categoryMap = new Map();
    const tagBuckets = [
      ...(matchedUser.tagProblemCounts?.fundamental || []),
      ...(matchedUser.tagProblemCounts?.intermediate || []),
      ...(matchedUser.tagProblemCounts?.advanced || []),
    ];
    for (const entry of tagBuckets) {
      const tag = String(entry?.tagName || '').trim();
      if (!tag) continue;
      categoryMap.set(tag, (categoryMap.get(tag) || 0) + (Number(entry?.problemsSolved) || 0));
    }
    const categoryWiseProblemCount = [...categoryMap.entries()]
      .map(([tag, solved]) => ({ tag, solved }))
      .sort((a, b) => b.solved - a.solved);

    const languagesUsed = (matchedUser.languageProblemCount || [])
      .map((entry) => ({
        language: entry?.languageName || 'Unknown',
        solved: Number(entry?.problemsSolved) || 0,
      }))
      .sort((a, b) => b.solved - a.solved);

    return {
      easySolved: acStats.find((s) => s.difficulty === 'Easy')?.count || 0,
      mediumSolved: acStats.find((s) => s.difficulty === 'Medium')?.count || 0,
      hardSolved: acStats.find((s) => s.difficulty === 'Hard')?.count || 0,
      totalSolved: acStats.find((s) => s.difficulty === 'All')?.count || 0,
      contestRating: contest?.rating ?? null,
      contestGlobalRanking: contest?.globalRanking ?? null,
      acceptanceRate,
      currentStreak,
      activeDays,
      maxStreak,
      topPercentage: contest?.topPercentage ?? null,
      contestsParticipated: contest?.attendedContestsCount ?? null,
      badgesEarned: Array.isArray(matchedUser.badges) ? matchedUser.badges.length : 0,
      categoryWiseProblemCount,
      languagesUsed,
      solutionCount: matchedUser?.profile?.solutionCount ?? null,
      reputation: matchedUser?.profile?.reputation ?? null,
      dailyActivity,
    };
  } catch {
    const fallbackResponse = await axios.post('https://leetcode.com/graphql', {
      query: fallbackQuery,
      variables: { username },
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const matchedUser = fallbackResponse.data?.data?.matchedUser;
    if (!matchedUser) {
      return {
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalSolved: 0,
        contestRating: null,
        contestGlobalRanking: null,
        acceptanceRate: null,
        currentStreak: 0,
        activeDays: 0,
        maxStreak: 0,
        topPercentage: null,
        contestsParticipated: null,
        badgesEarned: 0,
        categoryWiseProblemCount: [],
        languagesUsed: [],
        solutionCount: null,
        reputation: null,
        dailyActivity: [],
      };
    }

    const stats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const dailyActivity = parseDailyActivity(matchedUser.submissionCalendar);
    const activeDays = dailyActivity.filter((d) => Number(d.count) > 0).length;
    const maxStreak = computeMaxStreak(dailyActivity);
    const currentStreak = computeCurrentStreak(dailyActivity);

    return {
      easySolved: stats.find((s) => s.difficulty === 'Easy')?.count || 0,
      mediumSolved: stats.find((s) => s.difficulty === 'Medium')?.count || 0,
      hardSolved: stats.find((s) => s.difficulty === 'Hard')?.count || 0,
      totalSolved: stats.find((s) => s.difficulty === 'All')?.count || 0,
      contestRating: null,
      contestGlobalRanking: null,
      acceptanceRate: null,
      currentStreak,
      activeDays,
      maxStreak,
      topPercentage: null,
      contestsParticipated: null,
      badgesEarned: 0,
      categoryWiseProblemCount: [],
      languagesUsed: [],
      solutionCount: null,
      reputation: null,
      dailyActivity,
    };
  }
}
