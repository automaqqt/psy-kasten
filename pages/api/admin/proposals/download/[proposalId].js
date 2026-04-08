import { getServerSession } from "next-auth/next";
import prisma from '../../../../../lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check admin role
  let userRole = session.user.role;
  if (!userRole) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    userRole = user?.role;
  }

  if (userRole !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }

  const { proposalId } = req.query;

  if (!proposalId || typeof proposalId !== 'string') {
    return res.status(400).json({ message: 'Invalid proposal ID' });
  }

  try {
    const proposal = await prisma.testProposal.findUnique({
      where: { id: proposalId },
      select: { storagePath: true, originalFilename: true, fileType: true },
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const filePath = path.resolve(proposal.storagePath);
    const uploadDir = path.resolve(path.join(process.cwd(), 'uploads', 'proposals'));

    // Prevent path traversal
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Type', proposal.fileType || 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(proposal.originalFilename)}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error(`Error downloading proposal ${proposalId}:`, error);
    return res.status(500).json({ message: 'Error downloading file' });
  }
}
