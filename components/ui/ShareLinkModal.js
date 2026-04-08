import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './modal';
import s from '../../styles/ModalShared.module.css';
import { useTranslation } from 'next-i18next';

export default function ShareLinkModal({ isOpen, onClose, testLink, participantIdentifier }) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        if (isOpen && testLink) {
            QRCode.toDataURL(testLink, {
                width: 220,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
            })
                .then(setQrDataUrl)
                .catch(() => setQrDataUrl(''));
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
        const subject = encodeURIComponent(t('email_subject'));
        const body = encodeURIComponent(t('email_body', { link: testLink }));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const downloadQRCode = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qr-${participantIdentifier || 'test'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('share_link_modal_title')}>
            <div className={s.modalBody} style={{ minWidth: 'unset', maxWidth: 420 }}>
                {/* Link + Copy */}
                <div className={s.mb15}>
                    <label className={s.formLabel}>{t('test_link_label')}</label>
                    <div className={s.flexRow} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={testLink}
                            readOnly
                            className={s.inputReadonly}
                            style={{ fontSize: '0.8rem' }}
                        />
                        <button
                            onClick={handleCopy}
                            className={copied ? s.btnSuccess : s.btnPrimary}
                        >
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </div>
                </div>

                {/* QR Code */}
                {qrDataUrl && (
                    <div className={s.mb15} style={{ textAlign: 'center' }}>
                        <label className={s.formLabel}>{t('qr_code_label')}</label>
                        <div className={s.qrContainer}>
                            <img
                                src={qrDataUrl}
                                alt="QR Code"
                                style={{ display: 'block', width: 200, height: 200 }}
                            />
                        </div>
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button onClick={downloadQRCode} className={s.btnSecondary}>
                                {t('download_qr')}
                            </button>
                        </div>
                        <small className={s.smallTextBlock}>{t('qr_help')}</small>
                    </div>
                )}

                {/* Quick Share */}
                <div className={s.mb1}>
                    <label className={s.formLabel}>{t('quick_share_label')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleEmailShare} className={s.btnPrimary}>
                            {t('email_btn')}
                        </button>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: t('test_link_label'),
                                        text: t('email_subject'),
                                        url: testLink
                                    }).catch(() => {});
                                } else {
                                    alert(t('web_share_unsupported'));
                                }
                            }}
                            className={s.btnSecondary}
                        >
                            {t('share_btn')}
                        </button>
                    </div>
                </div>

                {/* Close */}
                <div className={s.flexEnd}>
                    <button onClick={onClose} className={s.btnSecondary}>
                        {t('close')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
