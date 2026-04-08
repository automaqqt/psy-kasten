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

    const { type, q, page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = 20;
    const skip = (pageNum - 1) * pageSize;

    try {
        if (type === 'users') {
            const where = q ? {
                OR: [
                    { name: { contains: q } },
                    { email: { contains: q } },
                ],
            } : {};

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        emailVerified: true,
                        createdAt: true,
                        _count: { select: { studies: true, proposals: true } },
                    },
                }),
                prisma.user.count({ where }),
            ]);

            return res.status(200).json({ items: users, total, page: pageNum, pageSize });
        }

        if (type === 'studies') {
            const where = q ? {
                OR: [
                    { name: { contains: q } },
                    { description: { contains: q } },
                ],
            } : {};

            const [studies, total] = await Promise.all([
                prisma.study.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        testTypes: true,
                        createdAt: true,
                        researcher: { select: { name: true, email: true } },
                        _count: { select: { participants: true, testAssignments: true } },
                    },
                }),
                prisma.study.count({ where }),
            ]);

            return res.status(200).json({ items: studies, total, page: pageNum, pageSize });
        }

        if (type === 'proposals') {
            const where = q ? {
                OR: [
                    { originalFilename: { contains: q } },
                    { notes: { contains: q } },
                ],
            } : {};

            const [proposals, total] = await Promise.all([
                prisma.testProposal.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        originalFilename: true,
                        notes: true,
                        isReviewed: true,
                        adminNotes: true,
                        createdAt: true,
                        researcher: { select: { name: true, email: true } },
                    },
                }),
                prisma.testProposal.count({ where }),
            ]);

            return res.status(200).json({ items: proposals, total, page: pageNum, pageSize });
        }

        return res.status(400).json({ message: 'Invalid type. Use: users, studies, proposals' });
    } catch (error) {
        console.error('Admin search error:', error);
        return res.status(500).json({ message: 'Search failed' });
    }
}
