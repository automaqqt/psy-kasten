import React, { useState, useCallback, useRef } from 'react';
import styles from '../../styles/UploadProposal.module.css';
import Modal from './modal';
import { fetchWithCsrf } from '../../lib/fetchWithCsrf';
import { useTranslation } from 'next-i18next';

export default function UploadProposal({ currentProposal }) {
    const { t } = useTranslation('dashboard');
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const fileInputRef = useRef(null); // Ref to trigger file input click

    // --- Drag and Drop Handlers ---
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if leaving the actual drop zone, not child elements
        if (e.target === e.currentTarget) {
             setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault(); // Necessary to allow drop
        e.stopPropagation();
        setIsDragging(true); // Keep active while hovering over
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError(null); // Clear previous errors
        setSuccess(null);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            // Basic validation (can add more checks)
            if (droppedFile.type !== 'application/pdf') {
                setError(t('upload_error_invalid_type'));
                setFile(null);
            } else if (droppedFile.size > 10 * 1024 * 1024) { // 10MB Limit
                 setError(t('upload_error_too_large'));
                 setFile(null);
            } else {
                setFile(droppedFile);
                setIsNotesModalOpen(true); // Open modal after valid file drop
            }
            e.dataTransfer.clearData(); // Clear drag data
        }
    }, []);

     // --- Manual File Selection Handler ---
     const handleFileSelect = (e) => {
        setError(null);
        setSuccess(null);
         if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
             if (selectedFile.type !== 'application/pdf') {
                setError(t('upload_error_invalid_type'));
                setFile(null);
             } else if (selectedFile.size > 10 * 1024 * 1024) { // 10MB Limit
                 setError(t('upload_error_too_large'));
                 setFile(null);
            } else {
                setFile(selectedFile);
                setIsNotesModalOpen(true); // Open modal after valid file selection
            }
        }
     };

     // Trigger hidden file input click
     const triggerFileSelect = () => {
         fileInputRef.current?.click();
     };

    // --- Form Submission Handler (Inside Modal) ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError(t('upload_error_no_file'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('proposalFile', file); // Key must match API route expectation
        formData.append('notes', notes);

        try {
            const response = await fetchWithCsrf('/api/proposals/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }
            setSuccess(data.message || 'Upload successful!');
            setFile(null); // Clear file after success
            setNotes('');
            setIsNotesModalOpen(false);
            // TODO: Trigger a refresh of the parent component's proposal status if needed
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---
    if (currentProposal && !currentProposal.isReviewed) {
         return (
            <div className={styles.pendingContainer}>
                 <h3>{t('upload_pending_title')}</h3>
                 <p>{t('upload_pending_submitted', { filename: currentProposal.originalFilename, date: new Date(currentProposal.createdAt).toLocaleDateString() })}</p>
                 <p>{t('upload_pending_wait')}</p>
            </div>
        );
    }


    return (
        <div className={styles.uploadContainer}>
            <h3>{t('upload_submit_title')}</h3>
            <p>{t('upload_submit_desc')}</p>

            {error && <p className={styles.errorText}>{error}</p>}
            {success && <p className={styles.successText}>{success}</p>}

            <div
                className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileSelect} // Make the whole zone clickable
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className={styles.fileInput} // Hidden input
                    name="proposalFile" // Important for FormData key
                    disabled={isLoading}
                />
                 {file ? (
                    <p>{t('upload_selected', { name: file.name, size: (file.size / 1024 / 1024).toFixed(2) })}</p>
                 ) : (
                     <p>{t('upload_drop_hint')}</p>
                 )}
                 <span className={styles.browseLink}>{t('upload_browse')}</span>
            </div>

            {/* Modal for Notes and Final Submit */}
            <Modal
                isOpen={isNotesModalOpen && !!file}
                onClose={() => setIsNotesModalOpen(false)}
                title={t('upload_modal_title')}
            >
                <form onSubmit={handleFormSubmit}>
                    <p>{t('upload_file_selected', { name: file?.name })}</p>
                    <div className={styles.formGroupModal}>
                        <label htmlFor="notes">{t('upload_notes_label')}</label>
                        <textarea
                            id="notes"
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('upload_notes_placeholder')}
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className={styles.errorTextModal}>{error}</p>}
                    <div className={styles.modalActions}>
                         <button type="button" onClick={() => setIsNotesModalOpen(false)} disabled={isLoading} className={styles.secondaryButtonModal}>{t('cancel')}</button>
                         <button type="submit" disabled={isLoading || !file} className={styles.primaryButtonModal}>
                            {isLoading ? t('uploading') : t('upload_submit_btn')}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}