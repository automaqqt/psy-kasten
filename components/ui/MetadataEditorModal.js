import React, { useState, useEffect } from 'react';
import Modal from './modal';
import styles from '../../styles/DashboardPage.module.css';

// Common metadata fields for cognitive research
const COMMON_FIELDS = [
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { key: 'group', label: 'Group/Condition', type: 'text' },
    { key: 'education', label: 'Education Level', type: 'text' },
    { key: 'handedness', label: 'Handedness', type: 'select', options: ['Right', 'Left', 'Ambidextrous'] },
    { key: 'notes', label: 'Notes', type: 'textarea' }
];

export default function MetadataEditorModal({ isOpen, onClose, participant, onSave }) {
    const [metadata, setMetadata] = useState({});
    const [customFields, setCustomFields] = useState([]);
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Initialize metadata from participant
    useEffect(() => {
        if (participant?.metadata) {
            const existingMetadata = typeof participant.metadata === 'string'
                ? JSON.parse(participant.metadata)
                : participant.metadata;

            // Separate common fields from custom fields
            const commonKeys = COMMON_FIELDS.map(f => f.key);
            const custom = Object.entries(existingMetadata)
                .filter(([key]) => !commonKeys.includes(key))
                .map(([key, value]) => ({ key, value }));

            setMetadata(existingMetadata);
            setCustomFields(custom);
        } else {
            setMetadata({});
            setCustomFields([]);
        }
    }, [participant]);

    const handleCommonFieldChange = (key, value) => {
        setMetadata(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const handleAddCustomField = () => {
        if (!newFieldKey.trim()) {
            setError('Field name cannot be empty');
            return;
        }
        if (metadata.hasOwnProperty(newFieldKey)) {
            setError('Field already exists');
            return;
        }

        const newField = { key: newFieldKey.trim(), value: newFieldValue };
        setCustomFields(prev => [...prev, newField]);
        setMetadata(prev => ({
            ...prev,
            [newFieldKey.trim()]: newFieldValue
        }));
        setNewFieldKey('');
        setNewFieldValue('');
        setError(null);
    };

    const handleRemoveCustomField = (key) => {
        setCustomFields(prev => prev.filter(f => f.key !== key));
        setMetadata(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const handleUpdateCustomField = (key, newValue) => {
        setCustomFields(prev => prev.map(f => f.key === key ? { ...f, value: newValue } : f));
        setMetadata(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Clean up metadata - remove empty values
            const cleanedMetadata = Object.fromEntries(
                Object.entries(metadata).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
            );

            await onSave(participant.id, cleanedMetadata);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (!isSaving) {
            setError(null);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Edit Metadata: ${participant?.identifier || ''}`}>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {error && <p className={styles.errorTextModal}>{error}</p>}

                {/* Common Fields */}
                <h4 style={{ marginTop: '0', marginBottom: '1rem', fontSize: '1rem', color: '#495057' }}>
                    Standard Fields
                </h4>
                {COMMON_FIELDS.map(field => (
                    <div key={field.key} className={styles.formGroup}>
                        <label htmlFor={`field-${field.key}`}>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                id={`field-${field.key}`}
                                value={metadata[field.key] || ''}
                                onChange={(e) => handleCommonFieldChange(field.key, e.target.value)}
                                disabled={isSaving}
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                            >
                                <option value="">-- Select --</option>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : field.type === 'textarea' ? (
                            <textarea
                                id={`field-${field.key}`}
                                value={metadata[field.key] || ''}
                                onChange={(e) => handleCommonFieldChange(field.key, e.target.value)}
                                disabled={isSaving}
                                rows={3}
                            />
                        ) : (
                            <input
                                type={field.type}
                                id={`field-${field.key}`}
                                value={metadata[field.key] || ''}
                                onChange={(e) => handleCommonFieldChange(field.key, e.target.value)}
                                disabled={isSaving}
                            />
                        )}
                    </div>
                ))}

                {/* Custom Fields */}
                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', color: '#495057' }}>
                    Custom Fields
                </h4>

                {customFields.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        {customFields.map(field => (
                            <div key={field.key} style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    value={field.key}
                                    disabled
                                    style={{
                                        flex: '0 0 30%',
                                        backgroundColor: '#e9ecef',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid #ced4da'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => handleUpdateCustomField(field.key, e.target.value)}
                                    disabled={isSaving}
                                    style={{
                                        flex: '1',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid #ced4da'
                                    }}
                                />
                                <button
                                    onClick={() => handleRemoveCustomField(field.key)}
                                    disabled={isSaving}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                    title="Remove field"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Custom Field */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Add Custom Field
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Field name"
                            value={newFieldKey}
                            onChange={(e) => setNewFieldKey(e.target.value)}
                            disabled={isSaving}
                            style={{
                                flex: '0 0 30%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ced4da'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Value"
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            disabled={isSaving}
                            style={{
                                flex: '1',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ced4da'
                            }}
                        />
                        <button
                            onClick={handleAddCustomField}
                            disabled={isSaving || !newFieldKey.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: !newFieldKey.trim() ? 'not-allowed' : 'pointer',
                                opacity: !newFieldKey.trim() ? 0.6 : 1
                            }}
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.modalActions}>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className={styles.secondaryButtonModal}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={styles.primaryButtonModal}
                    >
                        {isSaving ? 'Saving...' : 'Save Metadata'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
