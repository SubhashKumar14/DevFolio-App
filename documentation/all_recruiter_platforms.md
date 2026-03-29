# Recruiter Platform Signals Catalog

Last updated: 2026-03-29

## Purpose

This document describes what platform-derived signals recruiters can use today through the recruiter search experience.

## Current Recruiter Surface

Frontend route:

- /dashboard/recruiter

Backend endpoint:

- GET /api/recruiter/search

Access control:

- recruiter or admin role

## Search Filters Available

- name (displayName contains, escaped regex)
- techStack (comma separated)
- college
- minScore
- archetype (matches primary or secondary archetype)
- sortBy (devScore or name)

## Returned Candidate Fields

- userId
- displayName
- archetype
- secondaryArchetype
- devScore
- pillars (latest breakdown)
- techStack
- college
- hasPortfolio

## Platform Signal Sources Behind Recruiter Results

Recruiter does not currently filter directly by platform toggle, but score and profile results are powered by these platform streams:

| Platform | Upstream model | Used in recruiter output |
| --- | --- | --- |
| GitHub | GithubStats + DevScore | contributes to devScore + pillar metrics |
| LeetCode | DsaStats.leetcode + DevScore | contributes to devScore + pillar metrics |
| Codeforces | DsaStats.codeforces + DevScore | contributes to devScore + pillar metrics |
| HackerRank | PlatformStats.hackerrank + DevScore | contributes to devScore + pillar metrics |
| CodeChef | PlatformStats.codechef + DevScore | contributes to devScore + pillar metrics |
| Kaggle | PlatformStats.kaggle + DevScore | contributes to devScore + pillar metrics |
| Hugging Face | PlatformStats.huggingface + DevScore | contributes to devScore + pillar metrics |

## Practical Recruiter Interpretation Guide

- devScore: broad normalized signal for overall strength
- archetype + secondaryArchetype: role-fit context
- pillars: where candidate is strongest (problem solving, building, etc.)
- hasPortfolio: practical project demonstration signal
- techStack and college: direct filterable constraints

## Candidate Discovery Flow

1. recruiter sets filters
2. backend fetches only public profiles
3. corresponding users and latest scores are joined
4. candidates are sorted by selected mode
5. recruiter can navigate to public profile and portfolio

## Current Limitations

- no direct per-platform filter in recruiter endpoint
- recruiter search depends on latest available stats snapshots
- visibility/privacy hardening should be made consistent across all related read endpoints

## Recommended Enhancements

- add optional platform filter list (github/leetcode/etc.)
- add availability flags per platform in recruiter result payload
- add score recency timestamp to recruiter result rows
- add explicit filters for hasPortfolio and score pillar thresholds

## Cross-References

- [FEATURES.md](./FEATURES.md)
- [API_REFERENCE.md](./API_REFERENCE.md)
- [platform_analytics_catalog.md](./platform_analytics_catalog.md)
- [devfolio_project_audit.md](./devfolio_project_audit.md)
