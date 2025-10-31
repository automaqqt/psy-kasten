import { getServerSession } from "next-auth/next";
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';
import crypto from 'crypto';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const { studyId } = req.query;

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    if (!studyId || typeof studyId !== 'string') {
        return res.status(400).json({ message: 'Invalid Study ID' });
    }

    // --- POST: Duplicate study ---
    if (req.method === 'POST') {
        const { copyParticipants = false } = req.body;

        try {
            // Fetch original study and verify ownership
            const originalStudy = await prisma.study.findUnique({
                where: { id: studyId },
                include: {
                    participants: copyParticipants ? {
                        select: {
                            identifier: true
                        }
                    } : false
                }
            });

            if (!originalStudy) {
                return res.status(404).json({ message: 'Study not found' });
            }

            if (originalStudy.researcherId !== researcherId) {
                return res.status(403).json({ message: 'Forbidden: You do not own this study' });
            }

            // Create duplicate study with transaction
            const duplicatedStudy = await prisma.$transaction(async (tx) => {
                // Create new study with " - Copy" suffix
                const newStudy = await tx.study.create({
                    data: {
                        name: `${originalStudy.name} - Copy`,
                        description: originalStudy.description,
                        testType: originalStudy.testType,
                        researcherId: researcherId
                    }
                });

                // Optionally copy participants (without results)
                if (copyParticipants && originalStudy.participants && originalStudy.participants.length > 0) {
                    for (const participant of originalStudy.participants) {
                        // Create participant
                        const newParticipant = await tx.participant.create({
                            data: {
                                identifier: participant.identifier,
                                studyId: newStudy.id
                            }
                        });

                        // Create fresh assignment for the participant
                        const accessKey = crypto.randomBytes(24).toString('hex');
                        await tx.testAssignment.create({
                            data: {
                                participantId: newParticipant.id,
                                studyId: newStudy.id,
                                testType: newStudy.testType,
                                accessKey: accessKey
                            }
                        });
                    }
                }

                return newStudy;
            });

            return res.status(201).json({
                message: 'Study duplicated successfully',
                study: duplicatedStudy
            });

        } catch (error) {
            console.error(`Error duplicating study ${studyId}:`, error);
            return res.status(500).json({ message: 'Error duplicating study' });
        }
    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
