import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuthRateLimiter } from '../../../lib/rateLimit';
import { sendVerificationEmail } from '../../../lib/email';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      message: 'Too many signup attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
    });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (typeof email !== 'string' || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (typeof password !== 'string' || !passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&#)'
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If user exists but hasn't verified, resend verification email
      if (!existingUser.emailVerified && existingUser.passwordHash) {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Delete any existing tokens for this email
        await prisma.verificationToken.deleteMany({
          where: { identifier: normalizedEmail },
        });

        await prisma.verificationToken.create({
          data: {
            identifier: normalizedEmail,
            token,
            expires,
          },
        });

        try {
          await sendVerificationEmail(normalizedEmail, token);
        } catch (emailErr) {
          console.error('Failed to resend verification email:', emailErr);
        }

        return res.status(200).json({
          message: 'A verification email has been sent. Please check your inbox.',
          requiresVerification: true,
        });
      }

      return res.status(409).json({ message: 'Email already in use. Try signing in.' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        name: name || null,
        // emailVerified stays null until verification
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, token);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      // User was created but email failed - they can request a resend
    }

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your address.',
      requiresVerification: true,
    });

  } catch (error) {
    console.error('Signup Error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    return res.status(500).json({ message: 'An error occurred during signup.' });
  }
}
