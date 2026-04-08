// pages/api/studies/index.js
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import { sanitizeText, sanitizeRichText } from '../../../lib/sanitize';
import { withCsrfProtection } from '../../../lib/csrf';
import { TEST_TYPES } from '../../../lib/testConfig';


async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

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

    // Validate all test types against configured tests
    const validTestTypes = TEST_TYPES.map(t => t.id);
    const invalidTypes = typesArray.filter(t => !validTestTypes.includes(t));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ message: `Invalid test type(s): ${invalidTypes.join(', ')}. Valid types: ${validTestTypes.join(', ')}` });
    }

    try {
      // Sanitize inputs to prevent XSS
      const sanitizedName = sanitizeText(name);
      const sanitizedDescription = description ? sanitizeRichText(description) : null;

      if (!sanitizedName || sanitizedName.length === 0) {
        return res.status(400).json({ message: 'Study name cannot be empty after sanitization' });
      }

      const newStudy = await prisma.study.create({
        data: {
          name: sanitizedName,
          description: sanitizedDescription,
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

export default withCsrfProtection(handler);