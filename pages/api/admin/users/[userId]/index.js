import { getServerSession } from 'next-auth/next';
import prisma from '../../../../../lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@prisma/client';
import { withCsrfProtection } from '../../../../../lib/csrf';

async function handler(req, res) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (admin?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId } = req.query;

    if (userId === session.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    try {
        await prisma.user.delete({ where: { id: userId } });
        return res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        console.error('User delete error:', error);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
}

export default withCsrfProtection(handler);
