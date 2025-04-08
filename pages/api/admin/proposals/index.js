// pages/api/admin/proposals.js
import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../../lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import fs from 'fs';
import path from 'path';
import { UserRole } from '@prisma/client'; // Import enum if not auto-imported

const UPLOAD_DIR = path.join(process.cwd(), '/uploads/proposals');

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });

    // --- Authorization: ADMIN ONLY ---
    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized: Not logged in.' });
    }

    // Fetch user role (assuming role is added to session/token callbacks)
    // If not in session, fetch from DB based on session.user.id
    let userRole;
     // Example assuming role IS in session (modify if needed)
     if (session.user.role) { // Check if role is directly on session user
         userRole = session.user.role;
     } else {
        // Fallback: Fetch from DB if not in session (less efficient)
         try {
             const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
             userRole = user?.role;
         } catch (dbError) {
             console.error("Admin Check DB Error:", dbError);
             return res.status(500).json({ message: 'Error verifying user role.' });
         }
     }

    if (userRole !== UserRole.ADMIN) { // Use the enum value
        console.warn(`Forbidden access attempt to admin proposals by user ${session.user.id} (Role: ${userRole})`);
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    // --- End Authorization ---


    // --- GET: List proposals (e.g., filter by reviewed status) ---
    if (req.method === 'GET') {
        const { reviewed = 'false' } = req.query; // Default to showing pending proposals
        const showReviewed = reviewed === 'true';

        try {
            const proposals = await prisma.testProposal.findMany({
                where: { isReviewed: showReviewed },
                orderBy: { createdAt: showReviewed ? 'desc' : 'asc' }, // Show oldest pending first
                include: {
                    researcher: { select: { id: true, name: true, email: true } } // Include researcher info
                }
            });
            return res.status(200).json(proposals);
        } catch (error) {
            console.error("Admin: Error fetching proposals:", error);
            return res.status(500).json({ message: "Error fetching proposals" });
        }
    }
    // --- PATCH: Mark a proposal as reviewed ---
    else if (req.method === 'PATCH') {
         const { proposalId, adminNotes } = req.body;
          if (!proposalId || typeof proposalId !== 'string') {
            return res.status(400).json({ message: 'Proposal ID is required.' });
        }
         try {
             const updatedProposal = await prisma.testProposal.update({
                 where: { id: proposalId },
                 data: {
                     isReviewed: true,
                     reviewedAt: new Date(),
                     adminNotes: adminNotes || null,
                 }
             });
             console.log(`Proposal ${proposalId} marked as reviewed by admin ${session.user.id}`);
             return res.status(200).json(updatedProposal);
         } catch (error) {
              console.error(`Admin: Error updating proposal ${proposalId}:`, error);
              // Handle case where proposal doesn't exist (P2025)
             if (error.code === 'P2025') {
                 return res.status(404).json({ message: 'Proposal not found.' });
             }
              return res.status(500).json({ message: 'Error updating proposal status.' });
         }

    }
    // --- Method Not Allowed ---
    else {
        res.setHeader('Allow', ['GET', 'PATCH']); // Add DELETE if needed
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}