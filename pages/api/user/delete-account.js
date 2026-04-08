import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { withCsrfProtection } from '../../../lib/csrf';
import prisma from '../../../lib/prisma';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
    // Delete user — Prisma cascade deletes will handle:
    // - Account (onDelete: Cascade)
    // - Session (onDelete: Cascade)
    // - Study (onDelete: Cascade) -> Participant (Cascade) -> TestAssignment (Cascade) -> TestResult (Cascade)
    // - TestProposal (onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return res.status(500).json({ message: 'Failed to delete account. Please try again.' });
  }
}

export default withCsrfProtection(handler);
