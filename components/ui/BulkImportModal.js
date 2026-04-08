import React, { useState } from 'react';
import Modal from './modal';
import s from '../../styles/ModalShared.module.css';
import { fetchWithCsrf } from '../../lib/fetchWithCsrf';
import { useTranslation } from 'next-i18next';

export default function BulkImportModal({ isOpen, onClose, studyId, onImportComplete }) {
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const { t } = useTranslation('dashboard');

  const handleImport = async () => {
    if (!importText.trim()) {
      setError(t('error_min_one'));
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const identifiers = importText
        .split(/[\n,;]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (identifiers.length === 0) {
        setError(t('error_no_valid'));
        setIsImporting(false);
        return;
      }

      if (identifiers.length > 500) {
        setError(t('error_max_500'));
        setIsImporting(false);
        return;
      }

      const participants = identifiers.map(id => ({ identifier: id }));

      const res = await fetchWithCsrf('/api/participants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyId, participants }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('error_import_failed'));
      }

      setResult(data);

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
      onImportComplete();
    }
    setImportText('');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('bulk_import_modal_title')}>
      <div className={s.modalBody}>
        {!result ? (
          <>
            <div className={s.mb1}>
              <label htmlFor="importText" className={s.formLabel}>
                {t('identifiers_label')}
              </label>
              <textarea
                id="importText"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={t('identifiers_placeholder')}
                rows={12}
                disabled={isImporting}
                className={s.textareaInput}
              />
              <small className={s.smallText}>
                {t('identifiers_help')}
              </small>
            </div>

            {error && (
              <div className={s.errorBox}>{error}</div>
            )}

            <div className={s.flexEnd}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className={s.btnSecondary}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className={s.btnPrimary}
              >
                {isImporting ? t('importing') : t('import_btn')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={s.resultContainer}>
              <h3 className={s.resultTitle}>{t('import_complete_title')}</h3>
              <div className={s.successBox}>
                {t('import_created', { count: result.created })}
              </div>
              {result.skipped > 0 && (
                <div className={s.warningBox}>
                  {t('import_skipped', { count: result.skipped })}
                  {result.duplicates && result.duplicates.length > 0 && (
                    <details className={s.mt1}>
                      <summary className={s.detailsSummary}>{t('show_duplicates')}</summary>
                      <ul className={s.detailsList}>
                        {result.duplicates.map((dup, idx) => (
                          <li key={idx}>{dup}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
            <div className={s.flexCenter}>
              <button
                type="button"
                onClick={handleClose}
                className={s.btnPrimary}
              >
                {t('close')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
