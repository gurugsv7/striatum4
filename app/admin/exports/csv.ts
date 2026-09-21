/**
 * STRIATUM 4.0 admin — minimal CSV serializer for the export center.
 *
 * Normalized flat data: real column headers, ISO timestamps as-is (no UI
 * formatting), correctly quoted fields (RFC 4180 — a field containing a
 * comma, quote, or newline is wrapped in quotes with quotes doubled).
 */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escapeCell = (cell: string | number | null): string => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}
