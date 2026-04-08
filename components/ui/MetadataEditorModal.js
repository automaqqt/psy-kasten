import React, { useState, useEffect } from 'react';
import Modal from './modal';
import styles from '../../styles/DashboardPage.module.css';
import s from '../../styles/ModalShared.module.css';
import { useTranslation } from 'next-i18next';

const COMMON_FIELD_KEYS = ['age', 'gender', 'group', 'education', 'handedness', 'notes'];

export default function MetadataEditorModal({ isOpen, onClose, participant, onSave }) {
    const [metadata, setMetadata] = useState({});
    const [customFields, setCustomFields] = useState([]);
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation('dashboard');

    const commonFields = [
        { key: 'age', label: t('field_age'), type: 'number' },
        { key: 'gender', label: t('field_gender'), type: 'select', options: [
            { value: 'Male', label: t('gender_male') },
            { value: 'Female', label: t('gender_female') },
            { value: 'Other', label: t('gender_other') },
            { value: 'Prefer not to say', label: t('gender_prefer_not') },
        ]},
        { key: 'group', label: t('field_group'), type: 'text' },
        { key: 'education', label: t('field_education'), type: 'text' },
        { key: 'handedness', label: t('field_handedness'), type: 'select', options: [
            { value: 'Right', label: t('handedness_right') },
            { value: 'Left', label: t('handedness_left') },
            { value: 'Ambidextrous', label: t('handedness_ambidextrous') },
        ]},
        { key: 'notes', label: t('field_notes'), type: 'textarea' },
    ];

    useEffect(() => {
        if (participant?.metadata) {
            const existingMetadata = typeof participant.metadata === 'string'
                ? JSON.parse(participant.metadata)
                : participant.metadata;

            const custom = Object.entries(existingMetadata)
                .filter(([key]) => !COMMON_FIELD_KEYS.includes(key))
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
            setError(t('error_field_empty'));
            return;
        }
        if (metadata.hasOwnProperty(newFieldKey)) {
            setError(t('error_field_exists'));
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
        <Modal isOpen={isOpen} onClose={handleClose} title={t('metadata_modal_title', { identifier: participant?.identifier || '' })}>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>
                {error && <div className={s.errorBox}>{error}</div>}

                {/* Common Fields */}
                <h4 className={s.sectionTitle}>{t('standard_fields_title')}</h4>
                {commonFields.map(field => (
                    <div key={field.key} className={styles.formGroup}>
                        <label htmlFor={`field-${field.key}`}>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                id={`field-${field.key}`}
                                value={metadata[field.key] || ''}
                                onChange={(e) => handleCommonFieldChange(field.key, e.target.value)}
                                disabled={isSaving}
                            >
                                <option value="">{t('select_placeholder')}</option>
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                <h4 className={s.sectionTitleSpaced}>{t('custom_fields_title')}</h4>

                {customFields.length > 0 && (
                    <div className={s.mb1}>
                        {customFields.map(field => (
                            <div key={field.key} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{
                                    flex: '1 1 100px',
                                    minWidth: 0,
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-accent)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {field.key}
                                </span>
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => handleUpdateCustomField(field.key, e.target.value)}
                                    disabled={isSaving}
                                    className={s.inputSmall}
                                    style={{ flex: '2 1 120px', minWidth: 0 }}
                                />
                                <button
                                    onClick={() => handleRemoveCustomField(field.key)}
                                    disabled={isSaving}
                                    className={s.btnDanger}
                                    title={t('remove_btn')}
                                >
                                    {t('remove_btn')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Custom Field */}
                <div className={s.addFieldContainer}>
                    <label className={s.formLabel}>{t('add_custom_field_label')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder={t('field_name_placeholder')}
                            value={newFieldKey}
                            onChange={(e) => setNewFieldKey(e.target.value)}
                            disabled={isSaving}
                            className={s.inputSmall}
                            style={{ flex: '1 1 120px', minWidth: 0 }}
                        />
                        <input
                            type="text"
                            placeholder={t('value_placeholder')}
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            disabled={isSaving}
                            className={s.inputSmall}
                            style={{ flex: '2 1 120px', minWidth: 0 }}
                        />
                        <button
                            onClick={handleAddCustomField}
                            disabled={isSaving || !newFieldKey.trim()}
                            className={s.btnSuccess}
                        >
                            {t('add_field_btn')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons — outside scroll area */}
            <div className={styles.modalActions}>
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className={styles.secondaryButtonModal}
                >
                    {t('cancel')}
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className={styles.primaryButtonModal}
                >
                    {isSaving ? t('saving') : t('save_metadata_btn')}
                </button>
            </div>
        </Modal>
    );
}
