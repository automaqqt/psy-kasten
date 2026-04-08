import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@prisma/client';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        const [
            totalUsers,
            verifiedUsers,
            totalStudies,
            totalParticipants,
            totalAssignments,
            completedAssignments,
            totalResults,
            pendingProposals,
            totalProposals,
            recentUsers,
            recentStudies,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { emailVerified: { not: null } } }),
            prisma.study.count(),
            prisma.participant.count(),
            prisma.testAssignment.count(),
            prisma.testAssignment.count({ where: { completedAt: { not: null } } }),
            prisma.testResult.count(),
            prisma.testProposal.count({ where: { isReviewed: false } }),
            prisma.testProposal.count(),
            prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true,
                    createdAt: true,
                    _count: { select: { studies: true } },
                },
            }),
            prisma.study.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    testTypes: true,
                    createdAt: true,
                    researcher: { select: { name: true, email: true } },
                    _count: { select: { participants: true, testAssignments: true } },
                },
            }),
        ]);

        return res.status(200).json({
            stats: {
                totalUsers,
                verifiedUsers,
                totalStudies,
                totalParticipants,
                totalAssignments,
                completedAssignments,
                completionRate: totalAssignments > 0
                    ? Math.round((completedAssignments / totalAssignments) * 100)
                    : 0,
                totalResults,
                pendingProposals,
                totalProposals,
            },
            recentUsers,
            recentStudies,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ message: 'Failed to fetch stats' });
    }
}
