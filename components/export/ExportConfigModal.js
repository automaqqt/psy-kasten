import React, { useState } from 'react';
import Modal from '../ui/modal';

export default function ExportConfigModal({ isOpen, onClose, results, studyName }) {
    const [exportFormat, setExportFormat] = useState('csv');
    const [selectedFields, setSelectedFields] = useState({
        resultId: true,
        studyName: true,
        participantId: true,
        testType: true,
        completedAt: true,
        rawData: true
    });
    const [isExporting, setIsExporting] = useState(false);

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
            if (exportFormat === 'csv') {
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
            if (selectedFields.completedAt) {
                const completedAt = res.testAssignment?.completedAt
                    ? new Date(res.testAssignment.completedAt).toLocaleString('de-DE', {
                        timeZone: 'Europe/Berlin',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                    : 'Incomplete';
                row.push(completedAt);
            }
            if (selectedFields.rawData) {
                row.push(JSON.stringify(res.data).replace(/"/g, '""'));
            }
            return row;
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `results-${studyName || 'export'}-${timestamp}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `results-${studyName || 'export'}-${timestamp}.json`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const allSelected = Object.values(selectedFields).every(v => v);
    const noneSelected = Object.values(selectedFields).every(v => !v);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Results">
            <div style={{ minWidth: '500px' }}>
                {/* Format Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Export Format
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="csv"
                                checked={exportFormat === 'csv'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            CSV (Spreadsheet)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            JSON (Structured Data)
                        </label>
                    </div>
                </div>

                {/* Field Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: '500' }}>
                            Select Fields to Export
                        </label>
                        <div style={{ fontSize: '0.875rem' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedFields({
                                    resultId: true,
                                    studyName: true,
                                    participantId: true,
                                    testType: true,
                                    completedAt: true,
                                    rawData: true
                                })}
                                style={{ marginRight: '0.5rem', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                disabled={allSelected}
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedFields({
                                    resultId: false,
                                    studyName: false,
                                    participantId: false,
                                    testType: false,
                                    completedAt: false,
                                    rawData: false
                                })}
                                style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                disabled={noneSelected}
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                    <div style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '1rem', backgroundColor: '#f8f9fa' }}>
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

                {/* Export Info */}
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '0.875rem' }}>
                    <strong>📊 Export Summary:</strong> {results.length} result(s) • Format: {exportFormat.toUpperCase()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isExporting}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || noneSelected}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: noneSelected || isExporting ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: noneSelected || isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isExporting ? '⏳ Exporting...' : '📥 Export Results'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
