import React, { useState, useCallback, useRef } from 'react';
import styles from '../../styles/UploadProposal.module.css'; // Create this CSS file
import Modal from './modal'; // Assuming Modal component exists

export default function UploadProposal({ currentProposal }) {
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
                setError('Invalid file type. Only PDF files are accepted.');
                setFile(null);
            } else if (droppedFile.size > 10 * 1024 * 1024) { // 10MB Limit
                 setError('File is too large. Maximum size is 10MB.');
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
                setError('Invalid file type. Only PDF files are accepted.');
                setFile(null);
             } else if (selectedFile.size > 10 * 1024 * 1024) { // 10MB Limit
                 setError('File is too large. Maximum size is 10MB.');
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
            setError('No file selected.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('proposalFile', file); // Key must match API route expectation
        formData.append('notes', notes);

        try {
            const response = await fetch('/api/proposals/upload', {
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
                 <h3>Pending Proposal</h3>
                 <p>You have already submitted a test proposal ("{currentProposal.originalFilename}") on {new Date(currentProposal.createdAt).toLocaleDateString()}.</p>
                 <p>Please wait for it to be reviewed by an administrator before submitting another.</p>
                  {/* Optional: Add button to view/cancel pending proposal */}
            </div>
        );
    }


    return (
        <div className={styles.uploadContainer}>
            <h3>Submit New Test Proposal</h3>
            <p>Upload a PDF document describing the test you would like to add.</p>

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
                    <p>Selected: <strong>{file.name}</strong> ({ (file.size / 1024 / 1024).toFixed(2) } MB)</p>
                 ) : (
                     <p>Drag & Drop your PDF here, or click to select.</p>
                 )}
                 <span className={styles.browseLink}>Browse Files</span>
            </div>

            {/* Modal for Notes and Final Submit */}
            <Modal
                isOpen={isNotesModalOpen && !!file} // Open only if modal flag is true AND file exists
                onClose={() => {
                    setIsNotesModalOpen(false);
                    // Optional: Clear file if modal closed without submitting?
                    // setFile(null);
                }}
                title="Add Notes & Confirm Upload"
            >
                <form onSubmit={handleFormSubmit}>
                    <p>File selected: <strong>{file?.name}</strong></p>
                    <div className={styles.formGroupModal}>
                        <label htmlFor="notes">Optional Notes:</label>
                        <textarea
                            id="notes"
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any relevant information about the test or PDF..."
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className={styles.errorTextModal}>{error}</p>}
                    <div className={styles.modalActions}>
                         <button type="button" onClick={() => setIsNotesModalOpen(false)} disabled={isLoading} className={styles.secondaryButtonModal}>Cancel</button>
                         <button type="submit" disabled={isLoading || !file} className={styles.primaryButtonModal}>
                            {isLoading ? 'Uploading...' : 'Submit Proposal'}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}