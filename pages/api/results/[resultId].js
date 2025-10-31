import { getServerSession } from "next-auth/next";
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const { resultId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    if (!resultId || typeof resultId !== 'string') {
        return res.status(400).json({ message: 'Invalid Result ID' });
    }

    // --- GET: Fetch specific result ---
    if (req.method === 'GET') {
        try {
            const result = await prisma.testResult.findUnique({
                where: { id: resultId },
                include: {
                    testAssignment: {
                        include: {
                            participant: {
                                select: { identifier: true, id: true }
                            },
                            study: {
                                select: { researcherId: true, name: true }
                            }
                        }
                    }
                }
            });

            if (!result) {
                return res.status(404).json({ message: 'Result not found' });
            }

            // Verify ownership
            if (result.testAssignment?.study?.researcherId !== researcherId) {
                return res.status(403).json({ message: 'Forbidden: You do not own this result' });
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error(`Error fetching result ${resultId}:`, error);
            return res.status(500).json({ message: 'Error fetching result' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
