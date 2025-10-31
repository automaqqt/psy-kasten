// pages/api/studies/index.js
import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]'; // If using getServerSession
import { getServerSession } from "next-auth/next";


export default async function handler(req, res) {
  // Use getServerSession for Server Components/Route Handlers if possible
  // Otherwise, use getSession for traditional API routes called by client
  const session = await getServerSession(req, res, authOptions); // Or await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const researcherId = session.user.id;

  // --- GET: Fetch researcher's studies ---
  if (req.method === 'GET') {
    try {
      const studies = await prisma.study.findMany({
        where: { researcherId: researcherId },
        orderBy: { createdAt: 'desc' },
        // Optionally include participant count etc.
         include: {
             _count: {
                 select: { participants: true, testAssignments: true },
             },
         },
      });
      return res.status(200).json(studies);
    } catch (error) {
      console.error('Error fetching studies:', error);
      return res.status(500).json({ message: 'Error fetching studies' });
    }
  }
  // --- POST: Create a new study ---
  else if (req.method === 'POST') {
    const { name, description, testType, testTypes } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Study name is required' });
    }

    // Support both old (single testType) and new (multiple testTypes) formats
    let typesArray = [];
    if (testTypes && Array.isArray(testTypes) && testTypes.length > 0) {
      typesArray = testTypes;
    } else if (testType && typeof testType === 'string') {
      // Backward compatibility: convert single testType to array
      typesArray = [testType];
    } else {
      return res.status(400).json({ message: 'At least one test type is required' });
    }

    try {
      const newStudy = await prisma.study.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          testType: typesArray[0], // For backward compatibility
          testTypes: typesArray,
          researcherId: researcherId,
        },
      });
      return res.status(201).json(newStudy);
    } catch (error) {
      console.error('Error creating study:', error);
      return res.status(500).json({ message: 'Error creating study' });
    }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}