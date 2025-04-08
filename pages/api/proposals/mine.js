import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    const { status } = req.query; // Check for ?status=pending

    try {
        const whereClause = {
            researcherId: researcherId,
        };

        if (status === 'pending') {
            whereClause.isReviewed = false;
        }
        // Could add other statuses like ?status=reviewed later if needed

        // Find the *first* matching proposal (expecting only one pending)
        const proposal = await prisma.testProposal.findFirst({
            where: whereClause,
            orderBy: { createdAt: 'desc' } // Get the latest if multiple somehow exist
        });

        if (!proposal) {
            return res.status(404).json({ message: 'No matching proposal found.' });
        }

        return res.status(200).json(proposal);

    } catch (error) {
        console.error(`Error fetching proposal for user ${researcherId}:`, error);
        return res.status(500).json({ message: 'Error fetching proposal status.' });
    }
}