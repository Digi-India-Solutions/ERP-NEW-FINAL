import { useRef } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { exportToExcel, exportToPDF, printTable, type ExportColumn } from '@/utils/exportUtils';

interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  filterBar?: React.ReactNode;
  onGenerate?: () => void;
  generating?: boolean;
  generated?: boolean;
  children: React.ReactNode;
  exportData?: Record<string, unknown>[];
  exportColumns?: ExportColumn[];
  exportFilename?: string;
}

export default function ReportLayout({
  title, subtitle, filterBar, onGenerate, generating, generated,
  children, exportData, exportColumns, exportFilename,
}: ReportLayoutProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  const handleExcelExport = () => {
    if (!exportData || !exportColumns || !exportFilename) return;
    exportToExcel(exportData, exportColumns, exportFilename);
  };

  const handlePDFExport = () => {
    if (!exportData || !exportColumns || !exportFilename) return;
    exportToPDF(exportData, exportColumns, title, exportFilename, subtitle);
  };

  const handlePrint = () => {
    if (!exportData || !exportColumns) return;
    const headers = exportColumns.map((c) => c.header);
    const rows = exportData.map((row) => exportColumns!.map((col) => String(row[col.key] ?? '')));
    printTable(title, subtitle ?? '', headers, rows);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">{title}</h2>
            {subtitle && <p className="text-sm text-[#64748b] mt-0.5">{subtitle}</p>}
          </div>
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {generating ? (
                <><i className="ri-loader-4-line animate-spin text-base" /><span>Generating...</span></>
              ) : (
                <><i className="ri-play-circle-line text-base" /><span>Generate Report</span></>
              )}
            </button>
          )}
        </div>

        {/* Filter Bar */}
        {filterBar && (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            {filterBar}
          </div>
        )}

        {/* Export Bar — only shown when data is ready */}
        {generated && exportData && exportData.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b] mr-1">
              <i className="ri-information-line" /> {exportData.length} records
            </span>
            <div className="flex-1" />
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-excel-2-line text-green-600" />
              <span className="text-xs font-medium">Excel</span>
            </button>
            <button
              onClick={handlePDFExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-pdf-2-line text-red-500" />
              <span className="text-xs font-medium">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line text-slate-500" />
              <span className="text-xs font-medium">Print</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div ref={tableRef}>{children}</div>
      </div>
    </AppLayout>
  );
}
