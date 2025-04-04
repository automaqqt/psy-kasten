import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });
    const { participantId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
     if (!participantId || typeof participantId !== 'string') {
          return res.status(400).json({ message: 'Invalid Participant ID' });
      }

    const researcherId = session.user.id;

    // --- DELETE: Delete a participant ---
    if (req.method === 'DELETE') {
        try {
            // Verify ownership via the study the participant belongs to
            const participant = await prisma.participant.findUnique({
                where: { id: participantId },
                select: { study: { select: { researcherId: true } } } // Select nested researcherId
            });

            if (!participant) {
                return res.status(404).json({ message: 'Participant not found' });
            }
            if (participant.study?.researcherId !== researcherId) {
                console.warn(`Unauthorized delete attempt: User ${researcherId} -> Participant ${participantId}`);
                return res.status(403).json({ message: 'Forbidden: You do not own the study this participant belongs to' });
            }

            // Delete the participant (Cascade should handle assignments/results based on schema)
            await prisma.participant.delete({
                where: { id: participantId },
            });
             console.log(`Participant ${participantId} deleted by user ${researcherId}`);
            return res.status(204).end(); // No Content

        } catch (error) {
            console.error(`Error deleting participant ${participantId}:`, error);
            return res.status(500).json({ message: 'Error deleting participant' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}