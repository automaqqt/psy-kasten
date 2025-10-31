import React, { useState } from 'react';
import Modal from './modal';

export default function BulkImportModal({ isOpen, onClose, studyId, onImportComplete }) {
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Please enter at least one participant identifier');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      // Parse input - split by newlines, commas, or semicolons
      const identifiers = importText
        .split(/[\n,;]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (identifiers.length === 0) {
        setError('No valid identifiers found');
        setIsImporting(false);
        return;
      }

      if (identifiers.length > 500) {
        setError('Maximum 500 participants per import');
        setIsImporting(false);
        return;
      }

      // Create participants array
      const participants = identifiers.map(id => ({ identifier: id }));

      // Call bulk API
      const res = await fetch('/api/participants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyId, participants }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to import participants');
      }

      setResult(data);

      // Auto-close after 2 seconds if fully successful
      if (data.skipped === 0) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (result && result.created > 0) {
      onImportComplete(); // Refresh participant list
    }
    setImportText('');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Participants">
      <div style={{ minWidth: '500px' }}>
        {!result ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="importText" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Participant Identifiers
              </label>
              <textarea
                id="importText"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Enter participant identifiers (one per line)&#10;Example:&#10;participant001&#10;participant002&#10;participant003&#10;&#10;You can also paste comma or semicolon-separated values."
                rows={12}
                disabled={isImporting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              />
              <small style={{ color: '#6c757d' }}>
                Supported formats: One per line, comma-separated, or semicolon-separated. Maximum 500 participants.
              </small>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isImporting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isImporting ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isImporting || !importText.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isImporting ? 'Importing...' : 'Import Participants'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {result.skipped === 0 ? '✅' : '⚠️'}
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Import Complete</h3>
              <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <strong>{result.created}</strong> participant(s) successfully created
              </div>
              {result.skipped > 0 && (
                <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <strong>{result.skipped}</strong> duplicate(s) skipped
                  {result.duplicates && result.duplicates.length > 0 && (
                    <details style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                      <summary style={{ cursor: 'pointer' }}>Show duplicates</summary>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        {result.duplicates.map((dup, idx) => (
                          <li key={idx}>{dup}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
