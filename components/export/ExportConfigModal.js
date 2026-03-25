import React, { useState, useMemo } from 'react';
import Modal from '../ui/modal';
import { getCSVExporter } from '../../lib/csvExporters';

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

function reconstructArray(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const numericKeys = Object.keys(data).filter(k => !isNaN(k));
    if (numericKeys.length === 0) return [];
    return numericKeys.sort((a, b) => Number(a) - Number(b)).map(k => data[k]);
}

export default function ExportConfigModal({ isOpen, onClose, results, studyName }) {
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
            alert('No results to export');
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
            alert('Export failed: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const exportStructuredCSV = () => {
        if (!selectedTestType || filteredResults.length === 0) {
            alert('Please select a test type with results');
            return;
        }

        const structured = buildStructuredCSV(filteredResults, selectedTestType);
        if (!structured) {
            alert(`Structured export not yet available for ${selectedTestType}. Use Raw CSV instead.`);
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
        <Modal isOpen={isOpen} onClose={onClose} title="Export Results">
            <div style={{ minWidth: '500px' }}>
                {/* Format Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Export Format
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="structured"
                                checked={exportFormat === 'structured'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            CSV (Structured)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="csv"
                                checked={exportFormat === 'csv'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            CSV (Raw)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            JSON
                        </label>
                    </div>
                </div>

                {/* Structured CSV: Test Type Selection */}
                {exportFormat === 'structured' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Test Type
                        </label>
                        <select
                            value={selectedTestType}
                            onChange={(e) => setSelectedTestType(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '4px',
                                border: '1px solid var(--border-color)', fontSize: '1rem',
                                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
                            }}
                        >
                            <option value="">Select test type...</option>
                            {testTypes.map(type => {
                                const count = results.filter(r => r.testAssignment?.testType === type).length;
                                return (
                                    <option key={type} value={type}>
                                        {type.toUpperCase()} ({count} result{count !== 1 ? 's' : ''})
                                    </option>
                                );
                            })}
                        </select>
                        {selectedTestType && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Exports one row per participant with key metrics as columns.
                            </p>
                        )}
                    </div>
                )}

                {/* Raw CSV / JSON: Field Selection */}
                {exportFormat !== 'structured' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: '500' }}>
                                Select Fields to Export
                            </label>
                            <div style={{ fontSize: '0.875rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFields({
                                        resultId: true, studyName: true, participantId: true,
                                        testType: true, completedAt: true, rawData: true
                                    })}
                                    style={{ marginRight: '0.5rem', color: 'var(--link-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                    disabled={allSelected}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFields({
                                        resultId: false, studyName: false, participantId: false,
                                        testType: false, completedAt: false, rawData: false
                                    })}
                                    style={{ color: 'var(--link-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                    disabled={noneSelected}
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '1rem', backgroundColor: 'var(--bg-accent)' }}>
                            {Object.entries({
                                resultId: 'Result ID',
                                studyName: 'Study Name',
                                participantId: 'Participant Identifier',
                                testType: 'Test Type',
                                completedAt: 'Completion Date/Time',
                                rawData: 'Raw Test Data (JSON)'
                            }).map(([key, label]) => (
                                <label key={key} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFields[key]}
                                        onChange={() => handleFieldToggle(key)}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Export Info */}
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-accent)', borderRadius: '4px', fontSize: '0.875rem', border: '1px solid var(--border-color)' }}>
                    <strong>Export Summary:</strong>{' '}
                    {exportFormat === 'structured'
                        ? `${filteredResults.length} result(s) for ${selectedTestType ? selectedTestType.toUpperCase() : '...'}`
                        : `${results.length} result(s)`
                    }{' '}
                    &bull; Format: {exportFormat === 'structured' ? 'Structured CSV' : exportFormat.toUpperCase()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isExporting}
                        style={{
                            padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white',
                            border: 'none', borderRadius: '4px',
                            cursor: isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || !canExport}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: !canExport || isExporting ? '#ccc' : '#28a745',
                            color: 'white', border: 'none', borderRadius: '4px',
                            cursor: !canExport || isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isExporting ? 'Exporting...' : 'Export Results'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
