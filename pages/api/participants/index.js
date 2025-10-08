import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import crypto from 'crypto'; // For generating secure access keys

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions); // Or getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const researcherId = session.user.id;

  // --- POST: Create a new participant for a study ---
  if (req.method === 'POST') {
    const { studyId, identifier } = req.body;

    if (!studyId || !identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
      return res.status(400).json({ message: 'Study ID and Participant Identifier are required' });
    }

    try {
      // Verify researcher owns the target study and get test type
      const study = await prisma.study.findUnique({
        where: { id: studyId },
        select: { researcherId: true, testType: true } // Get test type
      });

      if (!study) {
        return res.status(404).json({ message: 'Study not found' });
      }
      if (study.researcherId !== researcherId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this study' });
      }

      // Create the participant (Prisma handles the unique constraint within the study)
      const newParticipant = await prisma.participant.create({
        data: {
          identifier: identifier.trim(), // Consider lowercasing emails here if identifier is email
          studyId: studyId,
        },
      });

      // Automatically create test assignment for the participant
      const accessKey = crypto.randomBytes(24).toString('hex'); // 48 characters hex

      await prisma.testAssignment.create({
        data: {
          participantId: newParticipant.id,
          studyId: studyId,
          testType: study.testType,
          accessKey: accessKey,
        },
      });

      return res.status(201).json(newParticipant);

    } catch (error) {
        console.error('Error creating participant:', error);
        // Handle potential unique constraint violation explicitly
        if (error.code === 'P2002' && error.meta?.target?.includes('identifier') && error.meta?.target?.includes('studyId')) {
            return res.status(409).json({ message: 'Participant identifier already exists in this study.' });
        }
        return res.status(500).json({ message: 'Error creating participant' });
    }
  }
  // --- GET: Fetch participants for a study (alternative to GET /api/studies/[studyId]) ---
  // This could be used if you don't want participant list on the main study GET
  else if (req.method === 'GET') {
      const { studyId } = req.query;
       if (!studyId || typeof studyId !== 'string') {
          return res.status(400).json({ message: 'Study ID query parameter is required' });
       }
       try {
            // Verify ownership first
            const study = await prisma.study.findUnique({ where: { id: studyId }, select: { researcherId: true } });
            if (!study) return res.status(404).json({ message: 'Study not found' });
            if (study.researcherId !== researcherId) return res.status(403).json({ message: 'Forbidden' });

            // Fetch participants
            const participants = await prisma.participant.findMany({
                where: { studyId: studyId },
                orderBy: { createdAt: 'asc' },
                // include assignment count?
                 include: { _count: { select: { assignments: true } } },
            });
            return res.status(200).json(participants);

       } catch (error) {
            console.error(`Error fetching participants for study ${studyId}:`, error);
            return res.status(500).json({ message: 'Error fetching participants' });
       }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['POST', 'GET']); // Add GET if implementing list here
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}