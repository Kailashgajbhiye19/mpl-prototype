import React, { useRef, useState } from 'react';
import { ArrowLeft, FileUp, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { participantService } from '../../services/participantService';
import { parseParticipantCsv } from './participantCsv';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;

const Development = () => {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [results, setResults] = useState([]);

  const readFile = async (file) => {
    setFileError('');
    setResults([]);
    setProgress({ completed: 0, total: 0 });
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') || file.size > MAX_FILE_SIZE) {
      setRows([]);
      setFileName('');
      setFileError('Choose a CSV file smaller than 5 MB.');
      return;
    }

    try {
      const parsedRows = parseParticipantCsv(await file.text());
      if (!parsedRows.length) throw new Error('CSV has a header but no participant rows.');
      if (parsedRows.length > MAX_ROWS) throw new Error(`CSV is limited to ${MAX_ROWS} participant rows per import.`);
      setRows(parsedRows);
      setFileName(file.name);
    } catch (error) {
      setRows([]);
      setFileName('');
      setFileError(error.message || 'Could not read this CSV file.');
    }
  };

  const handleImport = async () => {
    if (!rows.length || isImporting || (progress.total > 0 && progress.completed === progress.total)) return;
    setIsImporting(true);
    setResults([]);
    setProgress({ completed: 0, total: rows.length });
    const imported = [];

    for (const row of rows) {
      try {
        await participantService.create(row.data);
        imported.push({ line: row.line, success: true });
      } catch (error) {
        const message = error.response?.data?.message;
        imported.push({
          line: row.line,
          success: false,
          message: Array.isArray(message) ? message.join(', ') : message || 'The API rejected this row.',
        });
      }
      setProgress({ completed: imported.length, total: rows.length });
      setResults([...imported]);
    }

    setIsImporting(false);
  };

  const clearFile = () => {
    if (isImporting) return;
    setRows([]);
    setFileName('');
    setFileError('');
    setResults([]);
    setProgress({ completed: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    readFile(event.dataTransfer.files[0]);
  };

  const successCount = results.filter((result) => result.success).length;
  const failureCount = results.length - successCount;
  const importCompleted = progress.total > 0 && progress.completed === progress.total;

  return (
    <main style={styles.wrapper}>
      <section style={styles.card}>
        <Link to="/admin/participants" style={styles.backLink}><ArrowLeft size={16} /> Participants</Link>
        <div style={styles.icon}><FileUp size={24} /></div>
        <h1 style={styles.title}>Import participants from CSV</h1>
        <p style={styles.subtitle}>Upload participant records for existing trainings. Each row is submitted separately, so a failed row will not undo rows that already succeeded.</p>

        <div
          style={{ ...styles.dropZone, ...(dragActive ? styles.dropZoneActive : {}) }}
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <Upload size={28} color="#6366f1" />
          <p style={styles.dropText}>Drop a CSV file here, or</p>
          <button type="button" style={styles.secondaryButton} onClick={() => fileRef.current?.click()} disabled={isImporting}>Choose CSV file</button>
          <small style={styles.hint}>Maximum 5 MB and 500 rows</small>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(event) => readFile(event.target.files[0])} style={{ display: 'none' }} />
        </div>

        {fileError && <p role="alert" style={styles.error}>{fileError}</p>}
        {fileName && (
          <div style={styles.fileRow}>
            <span>{fileName} · {rows.length} participant rows</span>
            <button type="button" aria-label="Remove selected CSV" onClick={clearFile} disabled={isImporting} style={styles.iconButton}><X size={18} /></button>
          </div>
        )}

        <div style={styles.formatBox}>
          <strong>Required columns</strong>
          <code>training_id, name</code>
          <strong>Optional columns</strong>
          <code>phone, age, caste, education, category, attendance_status, profile_image_url</code>
          <small>Attendance must be present, absent, or late. Training IDs must refer to existing trainings.</small>
        </div>

        {rows.length > 0 && (
          <div style={styles.preview}>
            <strong>Preview</strong>
            {rows.slice(0, 5).map(({ line, data }) => <div key={line}>Row {line}: {data.name} · Training {data.training_id}</div>)}
            {rows.length > 5 && <small>and {rows.length - 5} more rows</small>}
          </div>
        )}

        {progress.total > 0 && (
          <div aria-live="polite" style={styles.progress}>
            <div>Processed {progress.completed} of {progress.total}</div>
            <div style={styles.resultCounts}><span>{successCount} imported</span><span>{failureCount} failed</span></div>
          </div>
        )}

        {results.some((result) => !result.success) && (
          <div role="alert" style={styles.failures}>
            <strong>Rows that need attention</strong>
            {results.filter((result) => !result.success).map((result) => <div key={result.line}>Row {result.line}: {result.message}</div>)}
          </div>
        )}

        <button type="button" style={{ ...styles.importButton, opacity: rows.length && !isImporting && !importCompleted ? 1 : 0.55 }} onClick={handleImport} disabled={!rows.length || isImporting || importCompleted}>
          {isImporting ? `Importing ${progress.completed + 1} of ${rows.length}…` : importCompleted ? 'Import complete' : `Import ${rows.length || ''} participants`}
        </button>
      </section>
    </main>
  );
};

const styles = {
  wrapper: { minHeight: '100%', padding: '32px 16px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' },
  card: { width: 'min(100%, 720px)', padding: '32px', borderRadius: '20px', background: '#fff', boxShadow: '0 16px 50px rgba(30, 41, 59, .12)', color: '#1e293b' },
  backLink: { display: 'inline-flex', gap: '8px', alignItems: 'center', color: '#4f46e5', textDecoration: 'none', fontWeight: 600 },
  icon: { width: '52px', height: '52px', display: 'grid', placeItems: 'center', margin: '24px auto 12px', color: '#4f46e5', background: '#eef2ff', borderRadius: '16px' },
  title: { margin: '0 0 8px', textAlign: 'center', fontSize: '1.6rem' },
  subtitle: { margin: '0 auto 24px', maxWidth: '560px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 },
  dropZone: { padding: '28px 16px', display: 'grid', justifyItems: 'center', border: '2px dashed #c7d2fe', borderRadius: '16px', background: '#fafaff', transition: 'background .15s' },
  dropZoneActive: { background: '#eef2ff', borderColor: '#6366f1' },
  dropText: { margin: '10px 0', color: '#475569' },
  secondaryButton: { padding: '9px 14px', border: '1px solid #c7d2fe', borderRadius: '9px', background: '#fff', color: '#4338ca', fontWeight: 600, cursor: 'pointer' },
  hint: { marginTop: '10px', color: '#64748b' },
  error: { color: '#b91c1c', padding: '10px 12px', background: '#fef2f2', borderRadius: '8px' },
  fileRow: { marginTop: '14px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', overflowWrap: 'anywhere' },
  iconButton: { border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer' },
  formatBox: { marginTop: '18px', padding: '16px', display: 'grid', gap: '8px', background: '#f8fafc', borderRadius: '10px' },
  preview: { marginTop: '16px', padding: '14px', display: 'grid', gap: '6px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#475569' },
  progress: { marginTop: '16px', padding: '12px', background: '#eef2ff', borderRadius: '10px' },
  resultCounts: { display: 'flex', gap: '16px', marginTop: '6px', fontWeight: 600 },
  failures: { marginTop: '12px', padding: '12px', display: 'grid', gap: '5px', color: '#991b1b', background: '#fef2f2', borderRadius: '10px' },
  importButton: { width: '100%', marginTop: '20px', padding: '13px', border: 0, borderRadius: '10px', background: '#4f46e5', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
};

export default Development;
