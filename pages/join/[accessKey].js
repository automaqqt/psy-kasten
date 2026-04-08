import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/JoinPage.module.css';

export default function JoinStudyPage() {
    const router = useRouter();
    const { accessKey } = router.query;

    const [studyInfo, setStudyInfo] = useState(null);
    const [identifier, setIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    // Fetch study info on load
    useEffect(() => {
        if (!accessKey) return;

        const fetchStudy = async () => {
            try {
                const res = await fetch(`/api/studies/public/${accessKey}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('This study link is no longer active.');
                    } else {
                        setError('Could not load study information.');
                    }
                    return;
                }
                const data = await res.json();
                setStudyInfo(data);
            } catch {
                setError('Could not connect to the server.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudy();
    }, [accessKey]);

    const handleJoin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsJoining(true);

        try {
            const res = await fetch('/api/studies/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicAccessKey: accessKey,
                    identifier: studyInfo?.participantNaming === 'self' ? identifier : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to join study');
                return;
            }

            setResult(data);
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleStartTest = (testLink) => {
        window.location.href = testLink;
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <Head><title>Join Study</title></Head>
                <div className={styles.card}>
                    <p className={styles.loadingText}>Loading...</p>
                </div>
            </div>
        );
    }

    if (error && !studyInfo && !result) {
        return (
            <div className={styles.container}>
                <Head><title>Study Not Found</title></Head>
                <div className={styles.card}>
                    <h1 className={styles.title}>Link Not Available</h1>
                    <p className={styles.errorText}>{error}</p>
                </div>
            </div>
        );
    }

    // Show test links after joining
    if (result) {
        return (
            <div className={styles.container}>
                <Head><title>Ready - {result.studyName}</title></Head>
                <div className={styles.card}>
                    <h1 className={styles.title}>
                        {result.isExisting ? 'Welcome Back' : 'You\'re In'}
                    </h1>
                    <p className={styles.subtitle}>
                        Study: <strong>{result.studyName}</strong>
                    </p>
                    <p className={styles.identifierDisplay}>
                        Your ID: <strong>{result.identifier}</strong>
                    </p>

                    {result.testLinks.length === 0 ? (
                        <p className={styles.completedText}>
                            All tests have been completed. Thank you for participating.
                        </p>
                    ) : (
                        <div className={styles.testList}>
                            <p className={styles.instruction}>
                                {result.testLinks.length === 1
                                    ? 'Click below to start your test:'
                                    : 'Click on a test to begin:'}
                            </p>
                            {result.testLinks.map((link) => (
                                <button
                                    key={link.testType}
                                    className={styles.testButton}
                                    onClick={() => handleStartTest(link.testLink)}
                                >
                                    {link.testType.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Join form
    return (
        <div className={styles.container}>
            <Head><title>Join - {studyInfo?.name || 'Study'}</title></Head>
            <div className={styles.card}>
                <h1 className={styles.title}>{studyInfo?.name}</h1>
                {studyInfo?.description && (
                    <p className={styles.description}>{studyInfo.description}</p>
                )}

                <form onSubmit={handleJoin} className={styles.form}>
                    {studyInfo?.participantNaming === 'self' ? (
                        <div className={styles.formGroup}>
                            <label htmlFor="identifier" className={styles.label}>
                                Choose your participant ID
                            </label>
                            <input
                                type="text"
                                id="identifier"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. your initials, a nickname..."
                                className={styles.input}
                                required
                                disabled={isJoining}
                                autoFocus
                                maxLength={50}
                            />
                            <small className={styles.hint}>
                                This will be your anonymous identifier throughout the study.
                            </small>
                        </div>
                    ) : (
                        <p className={styles.randomInfo}>
                            You will be assigned a random anonymous ID.
                        </p>
                    )}

                    {error && <p className={styles.errorText}>{error}</p>}

                    <button
                        type="submit"
                        className={styles.joinButton}
                        disabled={isJoining || (studyInfo?.participantNaming === 'self' && !identifier.trim())}
                    >
                        {isJoining ? 'Joining...' : 'Join Study'}
                    </button>
                </form>
            </div>
        </div>
    );
}
