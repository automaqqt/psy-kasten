import { getServerSession } from "next-auth/next";
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';
import { extractScore, getScoreMetric } from '../../../../lib/testScoreExtractors';

function buildScoreAnalytics(scores) {
    if (scores.length === 0) return { average: null, distribution: [] };

    const average = Math.round(
        (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100
    ) / 100;

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore;
    const bucketSize = range > 0 ? Math.ceil(range / 5) : 1;
    const buckets = Array(5).fill(0);

    scores.forEach(score => {
        const idx = Math.min(Math.floor((score - minScore) / bucketSize), 4);
        buckets[idx]++;
    });

    const distribution = buckets.map((count, i) => ({
        range: `${Math.round(minScore + i * bucketSize)}-${Math.round(minScore + (i + 1) * bucketSize)}`,
        count
    }));

    return { average, distribution };
}

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const { studyId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    if (!studyId || typeof studyId !== 'string') {
        return res.status(400).json({ message: 'Invalid Study ID' });
    }

    // --- GET: Fetch study analytics ---
    if (req.method === 'GET') {
        try {
            // Verify ownership
            const study = await prisma.study.findUnique({
                where: { id: studyId },
                select: { researcherId: true, testType: true, createdAt: true }
            });

            if (!study) {
                return res.status(404).json({ message: 'Study not found' });
            }

            if (study.researcherId !== researcherId) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Fetch assignments with results
            const assignments = await prisma.testAssignment.findMany({
                where: { studyId },
                include: {
                    result: true,
                    participant: {
                        select: { identifier: true }
                    }
                }
            });

            // Overall summary
            const totalAssignments = assignments.length;
            const completedAssignments = assignments.filter(a => a.completedAt).length;
            const pendingAssignments = totalAssignments - completedAssignments;
            const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments * 100) : 0;

            // Group assignments by test type
            const byTestType = {};
            for (const a of assignments) {
                const tt = a.testType;
                if (!byTestType[tt]) byTestType[tt] = [];
                byTestType[tt].push(a);
            }

            // Per-test-type analytics
            const testTypeAnalytics = {};
            for (const [testType, typeAssignments] of Object.entries(byTestType)) {
                const total = typeAssignments.length;
                const completed = typeAssignments.filter(a => a.completedAt).length;
                const withResults = typeAssignments.filter(a => a.result);

                const scores = withResults
                    .map(a => extractScore(testType, a.result.data))
                    .filter(s => s !== null && !isNaN(s));

                const metric = getScoreMetric(testType);
                const scoreAnalytics = buildScoreAnalytics(scores);

                // Recent completions for this test type (last 5)
                const recentCompletions = typeAssignments
                    .filter(a => a.completedAt)
                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                    .slice(0, 5)
                    .map(a => ({
                        participantId: a.participant?.identifier || 'Unknown',
                        completedAt: a.completedAt,
                        testType,
                        score: a.result ? extractScore(testType, a.result.data) : null
                    }));

                testTypeAnalytics[testType] = {
                    metric,
                    total,
                    completed,
                    pending: total - completed,
                    completionRate: total > 0 ? Math.round(completed / total * 1000) / 10 : 0,
                    scores: {
                        average: scoreAnalytics.average,
                        distribution: scoreAnalytics.distribution,
                        count: scores.length
                    },
                    recentCompletions
                };
            }

            // Time-based completion trend (last 30 days, all test types combined)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const completionsByDay = assignments
                .filter(a => a.completedAt && new Date(a.completedAt) >= thirtyDaysAgo)
                .reduce((acc, a) => {
                    const date = new Date(a.completedAt).toISOString().split('T')[0];
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                }, {});

            const completionTrend = Object.entries(completionsByDay)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            return res.status(200).json({
                studyId,
                testType: study.testType,
                studyCreatedAt: study.createdAt,
                summary: {
                    totalAssignments,
                    completedAssignments,
                    pendingAssignments,
                    completionRate: Math.round(completionRate * 10) / 10,
                    totalParticipants: new Set(assignments.map(a => a.participantId)).size
                },
                testTypeAnalytics,
                completionTrend,
                generatedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(`Error fetching analytics for study ${studyId}:`, error);
            return res.status(500).json({ message: 'Error fetching analytics' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
