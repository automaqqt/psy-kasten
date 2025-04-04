import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });
    const { assignmentId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
     if (!assignmentId || typeof assignmentId !== 'string') {
          return res.status(400).json({ message: 'Invalid Assignment ID' });
      }

    const researcherId = session.user.id;

    // --- DELETE: Delete an assignment (e.g., if unused/mistake) ---
    if (req.method === 'DELETE') {
        try {
            // Verify ownership via assignment -> study -> researcher
            const assignment = await prisma.testAssignment.findUnique({
                where: { id: assignmentId },
                select: { study: { select: { researcherId: true } }, completedAt: true } // Check completion and owner
            });

            if (!assignment) {
                return res.status(404).json({ message: 'Assignment not found' });
            }
            if (assignment.study?.researcherId !== researcherId) {
                console.warn(`Unauthorized delete attempt: User ${researcherId} -> Assignment ${assignmentId}`);
                return res.status(403).json({ message: 'Forbidden' });
            }
             // Optional: Prevent deletion of completed tests?
             // if (assignment.completedAt) {
             //     return res.status(400).json({ message: 'Cannot delete a completed test assignment.' });
             // }

            // Delete assignment (Cascade should handle result if schema set)
            await prisma.testAssignment.delete({
                where: { id: assignmentId },
            });
             console.log(`Assignment ${assignmentId} deleted by user ${researcherId}`);
            return res.status(204).end(); // No Content

        } catch (error) {
            console.error(`Error deleting assignment ${assignmentId}:`, error);
            return res.status(500).json({ message: 'Error deleting assignment' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['DELETE']); // Add GET/PUT if needed later
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}