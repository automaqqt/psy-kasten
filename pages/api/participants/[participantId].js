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

    // --- PUT: Update a participant ---
    if (req.method === 'PUT') {
        try {
            const { identifier, metadata } = req.body;

            if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
                return res.status(400).json({ message: 'Identifier is required' });
            }

            // Validate metadata if provided
            if (metadata !== undefined && metadata !== null && typeof metadata !== 'object') {
                return res.status(400).json({ message: 'Metadata must be an object' });
            }

            // Verify ownership via the study the participant belongs to
            const participant = await prisma.participant.findUnique({
                where: { id: participantId },
                select: { studyId: true, study: { select: { researcherId: true } } }
            });

            if (!participant) {
                return res.status(404).json({ message: 'Participant not found' });
            }
            if (participant.study?.researcherId !== researcherId) {
                console.warn(`Unauthorized update attempt: User ${researcherId} -> Participant ${participantId}`);
                return res.status(403).json({ message: 'Forbidden: You do not own the study this participant belongs to' });
            }

            // Check if identifier already exists in this study
            const existingParticipant = await prisma.participant.findFirst({
                where: {
                    studyId: participant.studyId,
                    identifier: identifier.trim(),
                    id: { not: participantId }
                }
            });

            if (existingParticipant) {
                return res.status(409).json({ message: 'A participant with this identifier already exists in this study' });
            }

            // Build update data
            const updateData = { identifier: identifier.trim() };
            if (metadata !== undefined) {
                updateData.metadata = metadata;
            }

            // Update the participant
            const updatedParticipant = await prisma.participant.update({
                where: { id: participantId },
                data: updateData,
            });

            console.log(`Participant ${participantId} updated by user ${researcherId}`);
            return res.status(200).json(updatedParticipant);

        } catch (error) {
            console.error(`Error updating participant ${participantId}:`, error);
            return res.status(500).json({ message: 'Error updating participant' });
        }
    }
    // --- DELETE: Delete a participant ---
    else if (req.method === 'DELETE') {
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
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}