import React, { useState, useEffect } from 'react';
import Modal from './modal';

export default function ShareLinkModal({ isOpen, onClose, testLink, participantIdentifier }) {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && testLink) {
            // Generate QR code using Google Charts API (no dependencies needed)
            const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(testLink)}&chs=300x300&chld=L|0`;
            setQrCodeUrl(qrUrl);
        }
    }, [isOpen, testLink]);

    const handleCopy = () => {
        navigator.clipboard.writeText(testLink)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => alert('Failed to copy: ' + err));
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent('Your Test Link');
        const body = encodeURIComponent(
            `Hello,\n\n` +
            `Please complete your assigned test by clicking the link below:\n\n` +
            `${testLink}\n\n` +
            `Thank you!`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const downloadQRCode = () => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `qr-code-${participantIdentifier || 'test'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Test Link">
            <div style={{ minWidth: '500px' }}>
                {/* Link Display */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Test Link
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={testLink}
                            readOnly
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                backgroundColor: '#f8f9fa'
                            }}
                        />
                        <button
                            onClick={handleCopy}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: copied ? '#28a745' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                    </div>
                </div>

                {/* QR Code */}
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500' }}>
                        QR Code
                    </label>
                    {qrCodeUrl && (
                        <div style={{
                            display: 'inline-block',
                            padding: '1rem',
                            backgroundColor: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px'
                        }}>
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                style={{ display: 'block', width: '300px', height: '300px' }}
                            />
                        </div>
                    )}
                    <div style={{ marginTop: '1rem' }}>
                        <button
                            onClick={downloadQRCode}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            📥 Download QR Code
                        </button>
                    </div>
                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#6c757d' }}>
                        Participants can scan this QR code with their phone to access the test
                    </small>
                </div>

                {/* Sharing Options */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Quick Share
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleEmailShare}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            ✉️ Share via Email
                        </button>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Test Link',
                                        text: 'Please complete your assigned test',
                                        url: testLink
                                    }).catch(() => {});
                                } else {
                                    alert('Web Share API not supported on this browser');
                                }
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            📤 Share (Mobile)
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
