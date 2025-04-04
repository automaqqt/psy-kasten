import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";


export default async function handler(req, res) {

    if (req.method === 'POST') {
        const { assignmentId, testData } = req.body;
    
        // 1. Basic Validation
        if (!assignmentId || !testData || typeof assignmentId !== 'string' || typeof testData !== 'object') {
          return res.status(400).json({ message: 'Missing or invalid assignment ID or test data' });
        }
    
        try {
          // 2. Transaction for Atomicity
          const result = await prisma.$transaction(async (tx) => {
            // === VERIFICATION ===
            const assignment = await tx.testAssignment.findUnique({
              where: { accessKey: assignmentId },
              select: { completedAt: true, testType: true } // Select fields needed for checks
            });
            console.log(assignmentId)
            console.log(assignment)
    
            // Check 1: Does the assignment exist?
            if (!assignment) {
              console.warn(`Result submission attempt for non-existent assignment: ${assignmentId}`);
              throw new Error('AssignmentNotFound');
            }
    
            // Check 2: Has it already been completed?
            if (assignment.completedAt) {
               console.warn(`Result submission attempt for already completed assignment: ${assignmentId}`);
               throw new Error('AssignmentAlreadyCompleted');
            }
            // Optional Check 3: Does testData structure match assignment.testType? (More advanced)
    
            // === END VERIFICATION ===
    
            // 3. Create Result
            const newResult = await tx.testResult.create({
              data: {
                testAssignmentId: assignmentId,
                data: {...testData, completedAt: new Date() },
              },
            });
    
            // 4. Mark Assignment as Completed
            // await tx.testAssignment.update({
            //   where: { id: newResult.id },
              
            // });
    
            return newResult;
          });
    
          console.log(`Result submitted successfully for assignment ${assignmentId}`);
          return res.status(201).json({ message: 'Results submitted successfully.', resultId: result.id });
    
        } catch (error) {
          console.error(`Error submitting results for assignment ${assignmentId}:`, error);
          if (error.message === 'AssignmentNotFound') {
            return res.status(404).json({ message: 'Invalid or non-existent test assignment.' });
          }
          if (error.message === 'AssignmentAlreadyCompleted') {
            return res.status(409).json({ message: 'Results for this test have already been submitted.' });
          }
          return res.status(500).json({ message: 'An internal error occurred while submitting results.' });
        }
      }

  // --- GET: Fetch results list (Protected for Researchers) ---
  else if (req.method === 'GET') {
    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;
    const { studyId, participantId, testType } = req.query; // Allow filtering

     try {
         const whereClause = {};

         // --- Authorization & Filtering ---
         // Need to ensure the requested results belong to the researcher.
         // Best way is usually filtering by studyId owned by the researcher.
         if (studyId && typeof studyId === 'string') {
             // Verify researcher owns this study
             const study = await prisma.study.findUnique({ where: { id: studyId }, select: { researcherId: true }});
             if (!study || study.researcherId !== researcherId) {
                 return res.status(403).json({ message: 'Forbidden: Cannot access results for this study' });
             }
             whereClause.testAssignment = { studyId: studyId };
         } else if (participantId && typeof participantId === 'string') {
              // Verify researcher owns this participant's study
              const participant = await prisma.participant.findUnique({where: { id: participantId }, select: { study: { select: { researcherId: true }}}});
              if (!participant || participant.study?.researcherId !== researcherId) {
                 return res.status(403).json({ message: 'Forbidden: Cannot access results for this participant' });
              }
             whereClause.testAssignment = { participantId: participantId };
         } else {
              // If no specific study/participant, fetch ALL results for the researcher's studies
              whereClause.testAssignment = {
                  study: {
                      researcherId: researcherId,
                  },
              };
         }

          // Add testType filter if provided
         if (testType && typeof testType === 'string') {
              whereClause.testAssignment.testType = testType;
         }


         const results = await prisma.testResult.findMany({
             where: whereClause,
             orderBy: { submittedAt: 'desc' },
             include: {
                 testAssignment: { // Include assignment details
                     select: {
                         testType: true,
                         completedAt: true,
                         participantId: true,
                         studyId: true,
                         participant: { select: { identifier: true } } // Get participant ID
                     }
                 }
             }
         });

         return res.status(200).json(results);

     } catch (error) {
         console.error('Error fetching results:', error);
         return res.status(500).json({ message: 'Error fetching results' });
     }
  }
  // --- Method Not Allowed ---
  else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}