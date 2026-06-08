interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
}

interface ReportTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  footerRow?: React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  stickyHeader?: boolean;
}

export default function ReportTable<T>({
  columns, data, keyField, footerRow, emptyMessage = 'No data to display.',
  loading, stickyHeader = true,
}: ReportTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-[#64748b]">
          <i className="ri-loader-4-line text-3xl animate-spin text-[#4f46e5]" />
          <span className="text-sm">Loading report data...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-[#64748b]">
          <i className="ri-file-chart-line text-4xl text-slate-300" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e2e8f0] min-[700px] rounded-xl overflow-hidden">
      <div className="overflow-x-auto w-full scrollbar-thin">
        <table className="w-full text-sm">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap ${col.headerClassName ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr
                key={String(row[keyField])}
                className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${ri % 2 === 0 ? '' : 'bg-[#fafbff]'}`}
              >
                {columns.map((col, ci) => (
                  <td key={ci} className={`px-3 py-2.5 text-[#1e293b] whitespace-nowrap ${col.className ?? ''}`}>
                    {typeof col.accessor === 'function' ? col.accessor(row) : String(row[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footerRow && (
            <tfoot>
              <tr className="bg-[#f1f5f9] border-t-2 border-[#e2e8f0] font-semibold">{footerRow}</tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
