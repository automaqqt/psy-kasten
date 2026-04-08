// pages/api/studies/join.js
// Public (unauthenticated) endpoint for participants to join a study via public link
import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import rateLimit from '../../../lib/rateLimit';
import { sanitizeIdentifier } from '../../../lib/sanitize';

const joinLimiter = rateLimit({
    interval: 60 * 1000,
    maxRequests: 10,
});

// Word lists for random identifier generation
const ADJECTIVES = [
    'blue', 'red', 'green', 'swift', 'calm', 'bold', 'warm', 'cool',
    'bright', 'quiet', 'proud', 'kind', 'fair', 'wise', 'keen', 'glad',
    'brave', 'tall', 'soft', 'wild', 'deep', 'clear', 'fresh', 'light'
];
const NOUNS = [
    'fox', 'owl', 'bear', 'wolf', 'deer', 'hawk', 'fish', 'swan',
    'lynx', 'hare', 'seal', 'dove', 'lark', 'crow', 'pike', 'moth',
    'robin', 'finch', 'otter', 'crane', 'eagle', 'raven', 'mouse', 'coral'
];

function generateRandomIdentifier() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${adj}-${noun}-${num}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // Rate limit
    const rateLimitResult = await joinLimiter.check(req, 10);
    if (!rateLimitResult.success) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const { publicAccessKey, identifier } = req.body;

    if (!publicAccessKey || typeof publicAccessKey !== 'string') {
        return res.status(400).json({ message: 'Invalid access key' });
    }

    try {
        // Find study by public access key
        const study = await prisma.study.findUnique({
            where: { publicAccessKey },
            select: {
                id: true,
                name: true,
                participantNaming: true,
                testType: true,
                testTypes: true,
            }
        });

        if (!study) {
            return res.status(404).json({ message: 'Study not found or public link is disabled' });
        }

        // Determine test types
        let testTypesToAssign = [];
        if (study.testTypes && Array.isArray(study.testTypes) && study.testTypes.length > 0) {
            testTypesToAssign = study.testTypes;
        } else if (study.testType) {
            testTypesToAssign = [study.testType];
        } else {
            return res.status(500).json({ message: 'Study has no test types configured' });
        }

        // Determine participant identifier
        let participantIdentifier;
        if (study.participantNaming === 'random') {
            // Generate random identifier, retry if collision
            let found = false;
            for (let i = 0; i < 10; i++) {
                participantIdentifier = generateRandomIdentifier();
                const existing = await prisma.participant.findUnique({
                    where: { studyId_identifier: { studyId: study.id, identifier: participantIdentifier } }
                });
                if (!existing) { found = true; break; }
            }
            if (!found) {
                return res.status(503).json({ message: 'Could not generate a unique identifier. Please try again.' });
            }
        } else {
            // Self-assigned identifier
            if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
                return res.status(400).json({ message: 'Please enter an identifier' });
            }
            participantIdentifier = sanitizeIdentifier(identifier);
            if (!participantIdentifier || participantIdentifier.length === 0) {
                return res.status(400).json({ message: 'Invalid identifier' });
            }

            // Check if identifier already exists in this study
            const existing = await prisma.participant.findUnique({
                where: { studyId_identifier: { studyId: study.id, identifier: participantIdentifier } },
                include: {
                    assignments: {
                        select: { testType: true, accessKey: true, completedAt: true }
                    }
                }
            });

            if (existing) {
                // Return existing assignments so participant can resume
                const baseUrl = process.env.NEXTAUTH_URL || '';
                const testLinks = existing.assignments
                    .filter(a => !a.completedAt)
                    .map(a => ({
                        testType: a.testType,
                        testLink: `${baseUrl}/${a.testType}?assignmentId=${a.accessKey}`
                    }));

                return res.status(200).json({
                    participantId: existing.id,
                    identifier: existing.identifier,
                    studyName: study.name,
                    testLinks,
                    isExisting: true,
                });
            }
        }

        // Create participant and assignments in a transaction
        const baseUrl = process.env.NEXTAUTH_URL || '';
        const result = await prisma.$transaction(async (tx) => {
            const participant = await tx.participant.create({
                data: {
                    identifier: participantIdentifier,
                    studyId: study.id,
                },
            });

            const assignments = [];
            for (const testType of testTypesToAssign) {
                const accessKey = crypto.randomBytes(24).toString('hex');
                const assignment = await tx.testAssignment.create({
                    data: {
                        participantId: participant.id,
                        studyId: study.id,
                        testType,
                        accessKey,
                    },
                });
                assignments.push({
                    testType,
                    testLink: `${baseUrl}/${testType}?assignmentId=${accessKey}`,
                });
            }

            return { participant, assignments };
        });

        return res.status(201).json({
            participantId: result.participant.id,
            identifier: participantIdentifier,
            studyName: study.name,
            testLinks: result.assignments,
            isExisting: false,
        });

    } catch (error) {
        console.error('Error joining study:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'This identifier is already taken. Please choose another.' });
        }
        return res.status(500).json({ message: 'Error joining study' });
    }
}
