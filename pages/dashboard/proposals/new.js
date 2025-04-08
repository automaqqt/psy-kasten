import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import UploadProposal from '../../../components/ui/uploadProposal'; // Import the upload component
import styles from '../../../styles/ProposalPage.module.css'; // Create styles for this page
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Fetch translations server-side
export async function getServerSideProps({ locale }) { // Use getServerSideProps if fetching proposal status server-side
    // You could optionally fetch the user's pending proposal status here
    // to avoid a client-side fetch flicker, but requires session handling here.
    // For simplicity, we'll fetch client-side first.
    return {
        props: {
            ...(await serverSideTranslations(locale ?? 'en', ['common'])), // Add 'proposals' namespace if needed
        },
    };
}

export default function NewProposalPage() {
    const { t } = useTranslation('common'); // Or a 'proposals' namespace
    const [pendingProposal, setPendingProposal] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch current pending proposal status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Need an API route to get *just* the user's pending proposal
                // Let's assume we create GET /api/proposals/mine?status=pending
                const res = await fetch('/api/proposals/mine?status=pending'); // Use the new specific route
                if (res.status === 404) { // No pending proposal found
                     setPendingProposal(null);
                     setIsLoading(false);
                     return;
                 }
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || 'Failed to fetch proposal status');
                }
                const data = await res.json();
                setPendingProposal(data); // Expects API to return the single proposal object or null/404
            } catch (err) {
                setError(err.message);
                setPendingProposal(null); // Clear on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []); // Run once on mount

    return (
        <DashboardLayout>
            <div className={styles.proposalContainer}>
                <h1>{t('propose_new_test', 'Propose a New Test')}</h1>

                {isLoading && <p className={styles.loadingText}>{t('loading_status', 'Loading status...')}</p>}
                {error && <p className={styles.errorText}>{t('error')}: {error}</p>}

                {!isLoading && !error && (
                    // Pass the fetched pending proposal to the Upload component
                    // The Upload component itself contains the logic to display
                    // the "pending" message or the upload form.
                    <UploadProposal currentProposal={pendingProposal} />
                )}

                 <div className={styles.infoBox}>
                    <h4>{t('proposal_process_title', 'Proposal Process')}</h4>
                    <p>{t('proposal_info_p1','Please upload a PDF containing details about the test: description, methodology, target population, scoring, and any existing validation data or references.')}</p>
                    <p>{t('proposal_info_p2','Administrators will review your submission. You can only have one pending proposal at a time.')}</p>
                 </div>
            </div>
        </DashboardLayout>
    );
}