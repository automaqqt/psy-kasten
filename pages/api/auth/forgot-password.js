import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { createAuthRateLimiter } from '../../../lib/rateLimit';
import { sendPasswordResetEmail } from '../../../lib/email';

const limiter = createAuthRateLimiter();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const rateLimitResult = await limiter.check(req, 3);
    if (!rateLimitResult.success) {
        return res.status(429).json({
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        });
    }

    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        // Always return success to prevent email enumeration
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (user && user.passwordHash) {
            // Delete any existing reset tokens for this user
            await prisma.verificationToken.deleteMany({
                where: {
                    identifier: `reset:${normalizedEmail}`,
                },
            });

            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.verificationToken.create({
                data: {
                    identifier: `reset:${normalizedEmail}`,
                    token,
                    expires,
                },
            });

            try {
                await sendPasswordResetEmail(normalizedEmail, token);
            } catch (emailErr) {
                console.error('Failed to send password reset email:', emailErr);
            }
        }

        // Always return same response regardless of whether user exists
        return res.status(200).json({
            message: 'If an account with that email exists, we sent a password reset link.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
}
