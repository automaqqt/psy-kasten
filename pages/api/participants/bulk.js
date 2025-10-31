import { getServerSession } from "next-auth/next";
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import crypto from 'crypto';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const researcherId = session.user.id;

  // --- POST: Bulk create participants ---
  if (req.method === 'POST') {
    const { studyId, participants } = req.body;

    // Validation
    if (!studyId || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Study ID and participants array are required' });
    }

    if (participants.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 participants per batch' });
    }

    // Validate each participant has an identifier and valid metadata
    const invalidParticipants = participants.filter(p => {
      if (!p.identifier || typeof p.identifier !== 'string' || p.identifier.trim().length === 0) {
        return true;
      }
      if (p.metadata !== undefined && p.metadata !== null && typeof p.metadata !== 'object') {
        return true;
      }
      return false;
    });
    if (invalidParticipants.length > 0) {
      return res.status(400).json({ message: 'All participants must have a valid identifier and metadata must be an object if provided' });
    }

    try {
      // Verify researcher owns the target study and get test types
      const study = await prisma.study.findUnique({
        where: { id: studyId },
        select: { researcherId: true, testType: true, testTypes: true }
      });

      if (!study) {
        return res.status(404).json({ message: 'Study not found' });
      }
      if (study.researcherId !== researcherId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this study' });
      }

      // Determine which test types to create assignments for
      let testTypesToAssign = [];
      if (study.testTypes && Array.isArray(study.testTypes) && study.testTypes.length > 0) {
        testTypesToAssign = study.testTypes;
      } else if (study.testType) {
        testTypesToAssign = [study.testType];
      } else {
        return res.status(500).json({ message: 'Study has no test types configured' });
      }

      // Get existing participants to check for duplicates
      const existingParticipants = await prisma.participant.findMany({
        where: {
          studyId: studyId,
          identifier: {
            in: participants.map(p => p.identifier.trim())
          }
        },
        select: { identifier: true }
      });

      const existingIdentifiers = new Set(existingParticipants.map(p => p.identifier));
      const newParticipants = participants.filter(p => !existingIdentifiers.has(p.identifier.trim()));
      const duplicates = participants.filter(p => existingIdentifiers.has(p.identifier.trim()));

      if (newParticipants.length === 0) {
        return res.status(400).json({
          message: 'All participants already exist in this study',
          duplicates: duplicates.map(p => p.identifier),
          created: 0
        });
      }

      // Use transaction to create all participants and assignments
      const results = await prisma.$transaction(async (tx) => {
        const createdParticipants = [];
        const createdAssignments = [];

        for (const p of newParticipants) {
          // Create participant
          const participant = await tx.participant.create({
            data: {
              identifier: p.identifier.trim(),
              studyId: studyId,
              metadata: p.metadata || undefined,
            },
          });
          createdParticipants.push(participant);

          // Create assignments for all test types
          for (const testType of testTypesToAssign) {
            const accessKey = crypto.randomBytes(24).toString('hex');
            const assignment = await tx.testAssignment.create({
              data: {
                participantId: participant.id,
                studyId: studyId,
                testType: testType,
                accessKey: accessKey,
              },
            });
            createdAssignments.push(assignment);
          }
        }

        return { participants: createdParticipants, assignments: createdAssignments };
      });

      return res.status(201).json({
        message: `Successfully created ${results.participants.length} participants`,
        created: results.participants.length,
        skipped: duplicates.length,
        duplicates: duplicates.length > 0 ? duplicates.map(p => p.identifier) : undefined,
        participants: results.participants
      });

    } catch (error) {
      console.error('Error bulk creating participants:', error);
      return res.status(500).json({ message: 'Error creating participants' });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
