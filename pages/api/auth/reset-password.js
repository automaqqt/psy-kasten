import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuthRateLimiter } from '../../../lib/rateLimit';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const limiter = createAuthRateLimiter();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const rateLimitResult = await limiter.check(req, 5);
    if (!rateLimitResult.success) {
        return res.status(429).json({
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        });
    }

    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'invalid' });
    }

    if (!password || typeof password !== 'string' || !passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&#).' });
    }

    try {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken || !verificationToken.identifier.startsWith('reset:')) {
            return res.status(400).json({ message: 'invalid' });
        }

        if (new Date() > verificationToken.expires) {
            await prisma.verificationToken.delete({ where: { token } });
            return res.status(400).json({ message: 'expired' });
        }

        const email = verificationToken.identifier.replace('reset:', '');

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({ message: 'invalid' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { email },
                data: {
                    passwordHash: hashedPassword,
                    // Also verify email if not yet verified
                    ...(user.emailVerified ? {} : { emailVerified: new Date() }),
                },
            }),
            prisma.verificationToken.delete({
                where: { token },
            }),
        ]);

        return res.status(200).json({ message: 'success' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'error' });
    }
}
