import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  sheetName = 'Report',
): void {
  const rows = data.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, col) => {
      acc[col.header] = row[col.key] ?? '';
      return acc;
    }, {}),
  );
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns.map((c) => c.header) });
  const colWidths = columns.map((c) => ({ wch: c.width ?? 18 }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  title: string,
  filename: string,
  subtitle?: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 14, 25);
    doc.setTextColor(0);
  }

  const headers = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((col) => String(row[col.key] ?? '')));

  // jspdf-autotable patches the jsPDF prototype; call via the instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: subtitle ? 30 : 24,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}

export function printTable(title: string, subtitle: string, headers: string[], rows: string[][]): void {
  const tableRows = rows
    .map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h2 { color: #1e293b; margin-bottom: 4px; }
      p { color: #64748b; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #4f46e5; color: white; padding: 7px 10px; text-align: left; font-size: 11px; }
      td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
      tr:nth-child(even) td { background: #f8f8ff; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head>
    <body>
      <h2>${title}</h2><p>${subtitle}</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody></table>
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
