import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Missing verification token' });
    }

    try {
        // Find the token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return res.status(400).json({ message: 'invalid' });
        }

        // Check expiration
        if (new Date() > verificationToken.expires) {
            // Clean up expired token
            await prisma.verificationToken.delete({
                where: { token },
            });
            return res.status(400).json({ message: 'expired' });
        }

        // Find the user and verify
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!user) {
            return res.status(400).json({ message: 'invalid' });
        }

        if (user.emailVerified) {
            // Already verified, clean up token
            await prisma.verificationToken.delete({
                where: { token },
            });
            return res.status(200).json({ message: 'already_verified' });
        }

        // Verify user and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { email: verificationToken.identifier },
                data: { emailVerified: new Date() },
            }),
            prisma.verificationToken.delete({
                where: { token },
            }),
        ]);

        return res.status(200).json({ message: 'verified' });

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ message: 'error' });
    }
}
