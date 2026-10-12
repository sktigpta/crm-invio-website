// Google Sheets audit store helpers.
//
// The Sheet IS the audit store now: the backend appends every staff action
// as a row and GET /api/crm/audit-logs reads from it. This module only
// provides the sheet link + Sheets-ready CSV export of the current view.

export const GOOGLE_SHEET_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_SHEET_ID) ||
  '1Ojgd5-EQI6MCx-4YXXSwS779PF9sI87fPHoKKR2G6MU';

export const GOOGLE_SHEETS_TAB = 'audit_logs';

export function getGoogleSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`;
}

// Matches backend column layout A:J.
export const AUDIT_SHEET_HEADER = [
  'timestamp',
  'id',
  'actor_id',
  'actor_name',
  'actor_role',
  'action',
  'target_type',
  'target_id',
  'ip_address',
  'details_json',
];

export function auditLogToRow(log = {}) {
  const ts = log.created_at || log.createdAt || log.timestamp || new Date().toISOString();
  return [
    typeof ts === 'string' ? ts : new Date(ts).toISOString(),
    log.id || '',
    log.actor_id || log.actorId || '',
    log.actor_name || log.actorName || 'Staff',
    log.actor_role || log.actorRole || '',
    log.action || '',
    log.target_type || log.targetType || '',
    log.target_id || log.targetId || '',
    log.ip_address || log.ipAddress || '',
    JSON.stringify(log.details ?? log.payload ?? {}),
  ];
}

function escapeCsvCell(value) {
  let s = String(value ?? '');
  // Neutralize formula injection in spreadsheet applications (Excel, Google Sheets)
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function auditLogsToCsv(logs = []) {
  const lines = [AUDIT_SHEET_HEADER.join(',')];
  for (const log of logs) {
    lines.push(auditLogToRow(log).map(escapeCsvCell).join(','));
  }
  return lines.join('\r\n');
}

export function downloadAuditLogsCsv(logs = [], filename = '') {
  if (!logs.length) return false;
  const csv = auditLogsToCsv(logs);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const name = filename || `invio-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
