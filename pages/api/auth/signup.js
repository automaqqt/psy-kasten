import prisma from '../../../lib/prisma'; // Adjust path as needed
import bcrypt from 'bcryptjs';
import { createAuthRateLimiter } from '../../../lib/rateLimit';
import { checkCsrf } from '../../../lib/csrf';

// Basic email validation regex (adjust as needed)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password complexity requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

// Create rate limiter: 5 attempts per 15 minutes
const limiter = createAuthRateLimiter();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // Apply rate limiting to prevent brute force attacks
  const rateLimitResult = await limiter.check(req, 5);
  if (!rateLimitResult.success) {
    return res.status(429).json({
      message: 'Too many signup attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
    });
  }

  // Validate CSRF token
  const csrfValid = await checkCsrf(req, res);
  if (!csrfValid) {
    return; // Response already sent by checkCsrf
  }

  const { email, password, name } = req.body;

  // --- Input Validation ---
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  // Enforce strong password requirements
  if (typeof password !== 'string' || !passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&#)'
      });
  }

  // --- Check if user exists ---
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Store and check emails in lowercase
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use. Try signing in.' });
    }

    // --- Hash Password ---
    const saltRounds = 10; // Recommended value
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Create User ---
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name: name || null, // Optional name
        // emailVerified: null, // Set later if implementing email verification
      },
    });

    console.log('New user created:', newUser.email);
    // Don't return sensitive data like the hash
    return res.status(201).json({ message: 'User created successfully. Please sign in.' });

  } catch (error) {
    console.error('Signup Error:', error);
    // Handle potential Prisma errors (e.g., unique constraint violation if check failed somehow)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
         return res.status(409).json({ message: 'Email already in use.' });
    }
    return res.status(500).json({ message: 'An error occurred during signup.' });
  }
}