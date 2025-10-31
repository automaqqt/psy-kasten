import { getServerSession } from "next-auth/next";
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';
import crypto from 'crypto';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const { assignmentId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    if (!assignmentId || typeof assignmentId !== 'string') {
        return res.status(400).json({ message: 'Invalid Assignment ID' });
    }

    // --- POST: Regenerate/extend assignment access key ---
    if (req.method === 'POST') {
        try {
            // Fetch assignment and verify ownership
            const assignment = await prisma.testAssignment.findUnique({
                where: { id: assignmentId },
                include: {
                    participant: {
                        include: {
                            study: {
                                select: { researcherId: true }
                            }
                        }
                    }
                }
            });

            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }

            if (assignment.participant?.study?.researcherId !== researcherId) {
                return res.status(403).json({ message: 'Forbidden: You do not own this assignment' });
            }

            // Check if assignment is already completed
            if (assignment.completedAt) {
                return res.status(400).json({ message: 'Cannot regenerate link for completed assignment' });
            }

            // Generate new access key
            const newAccessKey = crypto.randomBytes(24).toString('hex');

            // Update assignment with new key and reset/extend expiration
            const updatedAssignment = await prisma.testAssignment.update({
                where: { id: assignmentId },
                data: {
                    accessKey: newAccessKey,
                    expiresAt: null, // Clear expiration, or set new date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });

            // Construct the full link
            const baseUrl = process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
            const testLink = `${baseUrl}/${updatedAssignment.testType}?assignmentId=${newAccessKey}`;

            return res.status(200).json({
                message: 'Assignment link regenerated successfully',
                assignment: {
                    id: updatedAssignment.id,
                    accessKey: newAccessKey,
                    testLink,
                    expiresAt: updatedAssignment.expiresAt
                }
            });

        } catch (error) {
            console.error(`Error regenerating assignment ${assignmentId}:`, error);
            return res.status(500).json({ message: 'Error regenerating assignment link' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
