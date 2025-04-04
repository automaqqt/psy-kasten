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

    // --- POST: Create a new Test Assignment ---
    if (req.method === 'POST') {
        const { participantId, testType, studyId } = req.body;

        if (!participantId || !testType) {
            return res.status(400).json({ message: 'Participant ID and Test Type are required' });
        }
        // Basic validation for testType - expand this list as you add tests
         const validTestTypes = ['corsi', 'stroop', 'sart', 'rpm', 'fome', 'gng-sst'];
         if (!validTestTypes.includes(testType)) {
             return res.status(400).json({ message: `Invalid test type: ${testType}` });
         }


        try {
            // Verify researcher owns the participant (via study)
            const participant = await prisma.participant.findUnique({
                where: { id: participantId },
                select: { studyId: true, study: { select: { researcherId: true } } }
            });

            if (!participant) {
                return res.status(404).json({ message: 'Participant not found' });
            }
            if (participant.study?.researcherId !== researcherId) {
                return res.status(403).json({ message: 'Forbidden: You do not own this participant' });
            }

            // Generate unique access key
            const accessKey = crypto.randomBytes(24).toString('hex'); // 48 characters hex

            // Create the assignment
            const newAssignment = await prisma.testAssignment.create({
                data: {
                    participantId: participantId,
                    studyId: participant.studyId, // Link to study
                    testType: testType,
                    accessKey: accessKey,
                    // expiresAt: Optional: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Example: 7 days expiry
                },
            });
            console.log(newAssignment.id)

             // Construct the full link (ensure NEXTAUTH_URL is set correctly)
             const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${testType}/?assignmentId=${accessKey}`;


            return res.status(201).json({
                assignmentId: newAssignment.id,
                accessKey: newAssignment.accessKey, // Can return key if needed, but link is better
                testLink: testLink, // Provide the full link
            });

        } catch (error) {
            console.error('Error creating test assignment:', error);
             // Handle potential unique key collision for accessKey (extremely unlikely)
            if (error.code === 'P2002' && error.meta?.target?.includes('accessKey')) {
                 return res.status(500).json({ message: 'Error generating unique key, please try again.' });
             }
            return res.status(500).json({ message: 'Error creating test assignment' });
        }
    }
     // --- GET: Fetch assignments (e.g., for a participant or study) ---
     else if (req.method === 'GET') {
        const { participantId, studyId } = req.query;
         try {
             let assignments;
             // Authorization check is important here
             if (participantId && typeof participantId === 'string') {
                 // Verify ownership via participant->study
                const participant = await prisma.participant.findUnique({where: { id: participantId }, select: { study: { select: { researcherId: true }}}});
                 if (!participant) return res.status(404).json({message: 'Participant not found'});
                 if (participant.study?.researcherId !== researcherId) return res.status(403).json({message: 'Forbidden'});

                 assignments = await prisma.testAssignment.findMany({
                     where: { participantId: participantId },
                     orderBy: { createdAt: 'desc' },
                 });
             } else if (studyId && typeof studyId === 'string') {
                 // Verify ownership via study
                 const study = await prisma.study.findUnique({ where: { id: studyId }, select: { researcherId: true } });
                 if (!study) return res.status(404).json({ message: 'Study not found' });
                 if (study.researcherId !== researcherId) return res.status(403).json({ message: 'Forbidden' });

                 assignments = await prisma.testAssignment.findMany({
                     where: { studyId: studyId },
                     orderBy: { createdAt: 'desc' },
                     include: { participant: { select: { identifier: true }} } // Include participant ID for context
                 });
             } else {
                 return res.status(400).json({ message: 'Please provide participantId or studyId query parameter.' });
             }
             return res.status(200).json(assignments);

         } catch (error) {
             console.error('Error fetching assignments:', error);
             return res.status(500).json({ message: 'Error fetching assignments' });
         }
     }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}