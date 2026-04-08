// pages/api/studies/public/[accessKey].js
// Public (unauthenticated) endpoint to fetch basic study info for the join page
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { accessKey } = req.query;

    if (!accessKey || typeof accessKey !== 'string') {
        return res.status(400).json({ message: 'Invalid access key' });
    }

    try {
        const study = await prisma.study.findUnique({
            where: { publicAccessKey: accessKey },
            select: {
                name: true,
                description: true,
                participantNaming: true,
                testTypes: true,
                testType: true,
            }
        });

        if (!study) {
            return res.status(404).json({ message: 'Study not found' });
        }

        // Only expose minimal info
        const testTypes = (study.testTypes && Array.isArray(study.testTypes) && study.testTypes.length > 0)
            ? study.testTypes
            : (study.testType ? [study.testType] : []);

        return res.status(200).json({
            name: study.name,
            description: study.description,
            participantNaming: study.participantNaming,
            testCount: testTypes.length,
        });

    } catch (error) {
        console.error('Error fetching public study info:', error);
        return res.status(500).json({ message: 'Error fetching study information' });
    }
}
