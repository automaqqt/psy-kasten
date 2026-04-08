import React, { useState, useMemo } from 'react';
import Modal from '../ui/modal';
import { getCSVExporter } from '../../lib/csvExporters';
import { reconstructArray } from '../../lib/testScoreExtractors';
import s from '../../styles/ModalShared.module.css';
import { useTranslation } from 'next-i18next';

// Build structured CSV content for a single test type's results
function buildStructuredCSV(results, testType) {
    // Get the test-specific exporter's logic
    // We need to build a combined CSV with participant info + test-specific columns
    // Since the individual exporters trigger downloads directly, we'll replicate the logic here

    const exporterMap = {
        'corsi': buildCorsiStructuredRows,
        'pvt': buildPvtStructuredRows,
        'gng-sst': buildGngStructuredRows,
        'rpm': buildRpmStructuredRows,
        'vm': buildVmStructuredRows,
        'akt': buildAktStructuredRows,
        'wtb': buildWtbStructuredRows,
    };

    const builder = exporterMap[testType];
    if (!builder) return null;

    return builder(results);
}

function buildCorsiStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'UBS', 'F1_Errors', 'F2_Errors', 'F3_Errors', 'Total_Rounds'];
    const rows = results.map(res => {
        const d = res.data || {};
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            d.ubs || d.corsiSpan || 0,
            d.errorCountF1 || 0,
            d.errorCountF2 || 0,
            d.errorCountF3 || 0,
            (d.rounds || []).length
        ];
    });
    return { headers, rows };
}

function buildPvtStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'Mean_RT_ms', 'Median_RT_ms', 'Total_Trials', 'False_Starts'];
    const rows = results.map(res => {
        const d = res.data || {};
        const trials = d.trials || reconstructArray(d);
        const validTrials = trials.filter(t => t.reactionTime && !t.falseStart);
        const rts = validTrials.map(t => t.reactionTime).sort((a, b) => a - b);
        const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
        const medianRT = rts.length > 0 ? rts[Math.floor(rts.length / 2)] : 0;
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            meanRT.toFixed(2),
            medianRT.toFixed(2),
            trials.length,
            trials.filter(t => t.falseStart).length
        ];
    });
    return { headers, rows };
}

function buildGngStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'Total_Trials', 'Mean_Go_RT_ms', 'Omission_Rate_%', 'Commission_Rate_%'];
    const rows = results.map(res => {
        const d = res.data || {};
        let trialData = Array.isArray(d) ? d : (d.trials || reconstructArray(d));
        const goTrials = trialData.filter(r => r.type === 'go');
        const correctGoRTs = trialData.filter(r => r.outcome === 'correctGo').map(r => r.responseTime).filter(Boolean);
        const meanGoRT = correctGoRTs.length > 0 ? correctGoRTs.reduce((a, b) => a + b, 0) / correctGoRTs.length : 0;
        const omissions = trialData.filter(r => r.outcome === 'omission').length;
        const commissions = trialData.filter(r => r.outcome === 'commission').length;
        const inhibitoryTrials = trialData.filter(r => r.type === 'nogo' || r.type === 'stop').length;
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            trialData.length,
            meanGoRT.toFixed(2),
            goTrials.length > 0 ? (omissions / goTrials.length * 100).toFixed(1) : 'N/A',
            inhibitoryTrials > 0 ? (commissions / inhibitoryTrials * 100).toFixed(1) : 'N/A'
        ];
    });
    return { headers, rows };
}

function buildRpmStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'Total_Score', 'Total_Problems', 'Accuracy_%', 'Time_Taken_s'];
    const rows = results.map(res => {
        const d = res.data || {};
        const timeTaken = d.startTime && d.endTime ? Math.round((d.endTime - d.startTime) / 1000) : '';
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            d.correctCount || d.totalScore || 0,
            d.totalProblems || 0,
            d.accuracy ? d.accuracy.toFixed(1) : 'N/A',
            timeTaken
        ];
    });
    return { headers, rows };
}

function buildVmStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'VM_Span', 'Total_Hits', 'Total_False_Alarms', 'Total_Rounds'];
    const rows = results.map(res => {
        const d = res.data || {};
        const roundData = d.roundData || [];
        const successLevels = roundData.filter(r => r.success).map(r => r.level);
        const vmSpan = successLevels.length ? Math.max(...successLevels) : 0;
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            vmSpan,
            roundData.reduce((sum, r) => sum + r.hits, 0),
            roundData.reduce((sum, r) => sum + r.falseAlarms, 0),
            roundData.length
        ];
    });
    return { headers, rows };
}

function buildAktStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'G_Score', 'T_Time', 'R_Correct', 'F_Errors', 'F1', 'F2', 'F3', 'Omissions', 'F_Percent'];
    const rows = results.map(res => {
        const d = res.data || {};
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            d.G ?? '', d.T ?? '', d.R ?? '', d.F ?? '',
            d.F1 ?? '', d.F2 ?? '', d.F3 ?? '', d.Omissions ?? '', d.F_perc ?? ''
        ];
    });
    return { headers, rows };
}

function buildWtbStructuredRows(results) {
    const headers = ['Participant_ID', 'Study', 'Completed_At', 'Total_Score', 'Max_Level', 'Total_Rounds', 'Accuracy_%'];
    const rows = results.map(res => {
        const d = res.data || {};
        const rounds = d.rounds || [];
        const successRounds = rounds.filter(r => r.success).length;
        const accuracy = rounds.length > 0 ? (successRounds / rounds.length * 100).toFixed(1) : 0;
        return [
            quote(res.testAssignment?.participant?.identifier || 'N/A'),
            quote(res.testAssignment?.study?.name || 'N/A'),
            quote(formatDateDE(res.testAssignment?.completedAt)),
            d.totalScore || 0,
            d.maxLevel || 0,
            rounds.length,
            accuracy
        ];
    });
    return { headers, rows };
}

// Helpers
function quote(val) {
    return `"${String(val).replace(/"/g, '""')}"`;
}

function formatDateDE(dateStr) {
    if (!dateStr) return 'Incomplete';
    return new Date(dateStr).toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

export default function ExportConfigModal({ isOpen, onClose, results, studyName }) {
    const { t } = useTranslation('dashboard');
    const [exportFormat, setExportFormat] = useState('structured');
    const [selectedFields, setSelectedFields] = useState({
        resultId: true,
        studyName: true,
        participantId: true,
        testType: true,
        completedAt: true,
        rawData: true
    });
    const [selectedTestType, setSelectedTestType] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Get unique test types from results
    const testTypes = useMemo(() => {
        if (!results) return [];
        const types = [...new Set(results.map(r => r.testAssignment?.testType).filter(Boolean))];
        return types.sort();
    }, [results]);

    // Auto-select test type if there's only one
    useMemo(() => {
        if (testTypes.length === 1 && !selectedTestType) {
            setSelectedTestType(testTypes[0]);
        }
    }, [testTypes]);

    // Filter results by selected test type for structured export
    const filteredResults = useMemo(() => {
        if (exportFormat !== 'structured' || !selectedTestType) return results;
        return results?.filter(r => r.testAssignment?.testType === selectedTestType) || [];
    }, [results, exportFormat, selectedTestType]);

    const handleFieldToggle = (field) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleExport = () => {
        if (!results || results.length === 0) {
            alert(t('error_no_results_export'));
            return;
        }

        setIsExporting(true);
        try {
            if (exportFormat === 'structured') {
                exportStructuredCSV();
            } else if (exportFormat === 'csv') {
                exportToCSV();
            } else if (exportFormat === 'json') {
                exportToJSON();
            }
            onClose();
        } catch (err) {
            alert(t('error_export_failed', { message: err.message }));
        } finally {
            setIsExporting(false);
        }
    };

    const exportStructuredCSV = () => {
        if (!selectedTestType || filteredResults.length === 0) {
            alert(t('error_select_type'));
            return;
        }

        const structured = buildStructuredCSV(filteredResults, selectedTestType);
        if (!structured) {
            alert(t('error_no_structured', { testType: selectedTestType }));
            return;
        }

        const csvContent = [
            structured.headers.join(','),
            ...structured.rows.map(row => row.join(','))
        ].join('\n');

        downloadFile(csvContent, 'text/csv;charset=utf-8;',
            `results-${selectedTestType}-${studyName || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportToCSV = () => {
        const headers = [];
        if (selectedFields.resultId) headers.push('Result_ID');
        if (selectedFields.studyName) headers.push('Study');
        if (selectedFields.participantId) headers.push('Participant_ID');
        if (selectedFields.testType) headers.push('Test_Type');
        if (selectedFields.completedAt) headers.push('Completed_At_DE');
        if (selectedFields.rawData) headers.push('Data_JSON');

        const rows = results.map(res => {
            const row = [];
            if (selectedFields.resultId) row.push(res.id);
            if (selectedFields.studyName) row.push(res.testAssignment?.study?.name || 'N/A');
            if (selectedFields.participantId) row.push(res.testAssignment?.participant?.identifier || 'N/A');
            if (selectedFields.testType) row.push(res.testAssignment?.testType || 'Unknown');
            if (selectedFields.completedAt) row.push(formatDateDE(res.testAssignment?.completedAt));
            if (selectedFields.rawData) row.push(JSON.stringify(res.data).replace(/"/g, '""'));
            return row;
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        downloadFile(csvContent, 'text/csv;charset=utf-8;',
            `results-${studyName || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportToJSON = () => {
        const exportData = results.map(res => {
            const record = {};
            if (selectedFields.resultId) record.resultId = res.id;
            if (selectedFields.studyName) record.studyName = res.testAssignment?.study?.name || 'N/A';
            if (selectedFields.participantId) record.participantId = res.testAssignment?.participant?.identifier || 'N/A';
            if (selectedFields.testType) record.testType = res.testAssignment?.testType || 'Unknown';
            if (selectedFields.completedAt) record.completedAt = res.testAssignment?.completedAt || null;
            if (selectedFields.rawData) record.data = res.data;
            return record;
        });

        downloadFile(JSON.stringify(exportData, null, 2), 'application/json;charset=utf-8;',
            `results-${studyName || 'export'}-${new Date().toISOString().split('T')[0]}.json`);
    };

    const downloadFile = (content, mimeType, filename) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const allSelected = Object.values(selectedFields).every(v => v);
    const noneSelected = Object.values(selectedFields).every(v => !v);

    const canExport = exportFormat === 'structured'
        ? (selectedTestType && filteredResults.length > 0)
        : !noneSelected;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('export_config_title')}>
            <div className={s.modalBody}>
                {/* Format Selection */}
                <div className={s.mb15}>
                    <label className={s.formLabel}>{t('export_format_label')}</label>
                    <div className={s.radioGroup}>
                        <label className={s.radioLabel}>
                            <input
                                type="radio"
                                value="structured"
                                checked={exportFormat === 'structured'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            {t('format_csv_structured')}
                        </label>
                        <label className={s.radioLabel}>
                            <input
                                type="radio"
                                value="csv"
                                checked={exportFormat === 'csv'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            {t('format_csv_raw')}
                        </label>
                        <label className={s.radioLabel}>
                            <input
                                type="radio"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            {t('format_json')}
                        </label>
                    </div>
                </div>

                {/* Structured CSV: Test Type Selection */}
                {exportFormat === 'structured' && (
                    <div className={s.mb15}>
                        <label className={s.formLabel}>{t('filter_test_type')}</label>
                        <select
                            value={selectedTestType}
                            onChange={(e) => setSelectedTestType(e.target.value)}
                            className={s.selectInput}
                        >
                            <option value="">{t('select_test_type_placeholder')}</option>
                            {testTypes.map(type => {
                                const count = results.filter(r => r.testAssignment?.testType === type).length;
                                return (
                                    <option key={type} value={type}>
                                        {type.toUpperCase()} ({t('result_count', { count })})
                                    </option>
                                );
                            })}
                        </select>
                        {selectedTestType && (
                            <p className={s.smallTextBlock}>
                                {t('csv_structured_help')}
                            </p>
                        )}
                    </div>
                )}

                {/* Raw CSV / JSON: Field Selection */}
                {exportFormat !== 'structured' && (
                    <div className={s.mb15}>
                        <div className={s.flexBetween} style={{ marginBottom: '0.5rem' }}>
                            <label className={s.formLabel} style={{ marginBottom: 0 }}>
                                {t('select_fields_label')}
                            </label>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFields({
                                        resultId: true, studyName: true, participantId: true,
                                        testType: true, completedAt: true, rawData: true
                                    })}
                                    className={s.linkButton}
                                    style={{ marginRight: '0.5rem' }}
                                    disabled={allSelected}
                                >
                                    {t('select_all')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFields({
                                        resultId: false, studyName: false, participantId: false,
                                        testType: false, completedAt: false, rawData: false
                                    })}
                                    className={s.linkButton}
                                    disabled={noneSelected}
                                >
                                    {t('deselect_all')}
                                </button>
                            </div>
                        </div>
                        <div className={s.addFieldContainer}>
                            {[
                                ['resultId', t('field_result_id')],
                                ['studyName', t('field_study_name')],
                                ['participantId', t('field_participant_id')],
                                ['testType', t('field_test_type_label')],
                                ['completedAt', t('field_completion_datetime')],
                                ['rawData', t('field_raw_data')],
                            ].map(([key, label]) => (
                                <label key={key} className={s.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFields[key]}
                                        onChange={() => handleFieldToggle(key)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Export Info */}
                <div className={`${s.infoBox} ${s.mb15}`}>
                    <strong>{t('export_summary_label')}</strong>{' '}
                    {exportFormat === 'structured'
                        ? t('export_summary_typed', { count: filteredResults.length, testType: selectedTestType ? selectedTestType.toUpperCase() : '...' })
                        : t('export_summary_all', { count: results.length })
                    }{' '}
                    &bull; {exportFormat === 'structured' ? t('format_structured_csv') : exportFormat.toUpperCase()}
                </div>

                {/* Action Buttons */}
                <div className={s.flexEnd}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isExporting}
                        className={s.btnSecondary}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || !canExport}
                        className={s.btnSuccess}
                    >
                        {isExporting ? t('exporting') : t('export_results_btn')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
