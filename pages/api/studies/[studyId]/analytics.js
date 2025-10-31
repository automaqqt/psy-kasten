import { getServerSession } from "next-auth/next";
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';

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

            // Calculate analytics
            const totalAssignments = assignments.length;
            const completedAssignments = assignments.filter(a => a.completedAt).length;
            const pendingAssignments = totalAssignments - completedAssignments;
            const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments * 100) : 0;

            // Analyze results data
            const results = assignments.filter(a => a.result).map(a => a.result);
            let averageScore = null;
            let scoreDistribution = [];
            let recentCompletions = [];

            if (results.length > 0) {
                // Extract scores (this is generic - specific tests might have different structures)
                const scores = results.map(r => {
                    if (r.data?.totalScore !== undefined) {
                        return r.data.totalScore;
                    }
                    return null;
                }).filter(s => s !== null);

                if (scores.length > 0) {
                    averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

                    // Create distribution buckets
                    const maxScore = Math.max(...scores);
                    const bucketSize = Math.ceil(maxScore / 5);
                    const buckets = Array(6).fill(0);

                    scores.forEach(score => {
                        const bucketIndex = Math.min(Math.floor(score / bucketSize), 5);
                        buckets[bucketIndex]++;
                    });

                    scoreDistribution = buckets.map((count, i) => ({
                        range: `${i * bucketSize}-${(i + 1) * bucketSize}`,
                        count
                    }));
                }

                // Recent completions (last 10)
                const completed = assignments
                    .filter(a => a.completedAt)
                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                    .slice(0, 10);

                recentCompletions = completed.map(a => ({
                    participantId: a.participant?.identifier || 'Unknown',
                    completedAt: a.completedAt,
                    score: a.result?.data?.totalScore || null
                }));
            }

            // Time-based completion trend (last 30 days)
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
                scores: {
                    average: averageScore ? Math.round(averageScore * 100) / 100 : null,
                    distribution: scoreDistribution,
                    count: results.length
                },
                recentCompletions,
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
