// pages/api/studies/[studyId].js
import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import { withCsrfProtection } from '../../../lib/csrf';
import { sanitizeText, sanitizeRichText } from '../../../lib/sanitize';


async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const { studyId } = req.query;

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!studyId || typeof studyId !== 'string') {
      return res.status(400).json({ message: 'Invalid Study ID' });
  }

  const researcherId = session.user.id;

  // --- Authorization Check (Common for GET, PUT, DELETE) ---
  let study;
  try {
      study = await prisma.study.findUnique({
          where: { id: studyId },
      });

      if (!study) {
          return res.status(404).json({ message: 'Study not found' });
      }

      // IMPORTANT: Verify ownership
      if (study.researcherId !== researcherId) {
          console.warn(`Unauthorized access attempt: User ${researcherId} -> Study ${studyId}`);
          return res.status(403).json({ message: 'Forbidden: You do not own this study' });
      }
  } catch (error) {
       console.error(`Error fetching study ${studyId} for auth check:`, error);
       return res.status(500).json({ message: 'Error verifying study access' });
  }
  // --- END Authorization Check ---


  // --- GET: Fetch specific study details ---
  if (req.method === 'GET') {
    // Study already fetched for auth check
     // Optionally include related data
     try {
         const detailedStudy = await prisma.study.findUnique({
             where: { id: studyId },
             include: {
                 participants: { // Include participants of this study
                     orderBy: { createdAt: 'desc'},
                     include: {assignments:true}
                 },
                 // Optionally include testAssignments count etc.
                 _count: {
                    select: { testAssignments: true }
                 }
             },
         });

         // Add full test links to assignments
         const baseUrl = process.env.NEXTAUTH_URL || '';
         detailedStudy.participants = detailedStudy.participants.map(participant => ({
             ...participant,
             assignments: participant.assignments.map(assignment => ({
                 ...assignment,
                 testLink: `${baseUrl}/${assignment.testType}?assignmentId=${assignment.accessKey}`
             }))
         }));

         return res.status(200).json(detailedStudy);
     } catch (error) {
         console.error(`Error fetching detailed study ${studyId}:`, error);
         return res.status(500).json({ message: 'Error fetching study details' });
     }
  }
  // --- PUT: Update study details ---
  else if (req.method === 'PUT') {
    const { name, description, publicLinkEnabled, participantNaming } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Study name is required' });
    }

    try {
      const sanitizedName = sanitizeText(name);
      const sanitizedDescription = description ? sanitizeRichText(description) : null;

      if (!sanitizedName || sanitizedName.length === 0) {
        return res.status(400).json({ message: 'Study name cannot be empty after sanitization' });
      }

      const data = {
        name: sanitizedName,
        description: sanitizedDescription,
      };

      // Handle public link toggle
      if (publicLinkEnabled === true && !study.publicAccessKey) {
        data.publicAccessKey = crypto.randomBytes(16).toString('hex');
      } else if (publicLinkEnabled === false) {
        data.publicAccessKey = null;
      }

      // Handle participant naming mode
      if (participantNaming === 'self' || participantNaming === 'random') {
        data.participantNaming = participantNaming;
      }

      const updatedStudy = await prisma.study.update({
        where: { id: studyId },
        data,
      });
      return res.status(200).json(updatedStudy);
    } catch (error) {
      console.error(`Error updating study ${studyId}:`, error);
      return res.status(500).json({ message: 'Error updating study' });
    }
  }
  // --- DELETE: Delete study ---
  else if (req.method === 'DELETE') {
    try {
        // Use transaction to delete related data or rely on cascade deletes in schema
        // Be CAREFUL with cascade deletes in production!
      const deletedStudy = await prisma.study.delete({
        where: { id: studyId }, // Ownership already verified
      });
      // Deleting study will cascade delete Participants, Assignments, Results based on schema
      return res.status(204).end(); // No Content on successful delete
    } catch (error) {
      console.error(`Error deleting study ${studyId}:`, error);
      // Handle specific errors like foreign key constraints if cascade isn't set up perfectly
      return res.status(500).json({ message: 'Error deleting study' });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default withCsrfProtection(handler);