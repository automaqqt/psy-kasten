import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout'; // Assuming admin uses same layout
import ProposalList from '../../components/ui/proposalList'; // Import the list component
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client'; // Import enum
import styles from '../../styles/AdminPage.module.css'; // Create styles for admin pages
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'; // For layout translations
import { getSession } from 'next-auth/react'; // Use standard getSession for getServerSideProps
import prisma from '../../lib/prisma';

// Server-side check for Admin role BEFORE rendering the page
export async function getServerSideProps(context) {
    const session = await getSession(context); // Get session server-side

    // Redirect if not logged in
    if (!session) {
        return {
            redirect: { destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`, permanent: false },
        };
    }

    // Fetch user role from DB (session might not have it updated immediately)
    // Add error handling
    let userRole = null;
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });
        userRole = user?.role;
    } catch (e) {
         console.error("Error fetching user role for admin page:", e);
         // Handle error appropriately, maybe redirect to generic error page
          return { redirect: { destination: '/500', permanent: false } }; // Example error redirect
    }


    // Check if user is ADMIN
    if (userRole !== UserRole.ADMIN) {
        console.warn(`Admin Access Denied: User ${session.user.id} (Role: ${userRole}) tried accessing /admin/proposals`);
        return {
            // redirect: { destination: '/dashboard?error=forbidden', permanent: false }, // Redirect to dashboard with error
             notFound: true // Or simply show 404
        };
    }

    // User is admin, load translations and allow rendering
    return {
        props: {
            ...(await serverSideTranslations(context.locale ?? 'en', ['common'])), // Load common translations for layout
             // Pass any other necessary props
        },
    };
}


export default function AdminProposalsPage() {
    // Session data is available via hook, but authorization already happened server-side
    // const { data: session } = useSession();

    return (
        <DashboardLayout>
            <div className={styles.adminContainer}>
                 {/* Add Admin-specific header/styling if needed */}
                <ProposalList />
            </div>
        </DashboardLayout>
    );
}