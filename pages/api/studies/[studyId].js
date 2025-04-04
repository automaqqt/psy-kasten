// pages/api/studies/[studyId].js
import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";


export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions); // Or getSession({ req });
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
                     orderBy: { createdAt: 'desc'}
                 },
                 // Optionally include testAssignments count etc.
                 _count: {
                    select: { testAssignments: true }
                 }
             },
         });
         return res.status(200).json(detailedStudy);
     } catch (error) {
         console.error(`Error fetching detailed study ${studyId}:`, error);
         return res.status(500).json({ message: 'Error fetching study details' });
     }
  }
  // --- PUT: Update study details ---
  else if (req.method === 'PUT') {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Study name is required' });
    }

    try {
      const updatedStudy = await prisma.study.update({
        where: { id: studyId }, // Ownership already verified
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
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
      console.log(`Study ${studyId} deleted by user ${researcherId}`);
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