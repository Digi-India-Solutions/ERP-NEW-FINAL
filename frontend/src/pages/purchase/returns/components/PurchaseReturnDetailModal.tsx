import { useState } from 'react';

export interface PurchaseReturnItem {
  itemName: string;
  hsnCode?: string;
  returnQty: number;
  unit?: string;
  rate: number;
  amount: number;
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  billNo: string;
  returnNumber?: string;
  date: string;
  partyName: string;
  supplierName?: string;
  warehouseName?: string;
  originalInvoiceNo: string;
  originalInvoiceId: string;
  items: PurchaseReturnItem[];
  grandTotal?: number;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Print View ───────────────────────────────────────────────────────────────
interface PrintViewProps {
  ret: PurchaseReturn;
  onClose: () => void;
}

function PrintPurchaseReturnView({ ret, onClose }: PrintViewProps) {
  const totalAmount = (ret.items ?? []).reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Print toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white print:hidden">
          <div className="flex items-center gap-2">
            <i className="ri-arrow-go-back-line text-indigo-300" />
            <span className="text-sm font-medium">
              Purchase Return — {ret.billNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" />
              Print
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        <div className="p-8 text-[11px]">
          {/* Header */}
          <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#e2e8f0]">
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">Purchase Return</h1>
              <p className="text-[#64748b] mt-1">
                Supplier: {ret.partyName}
              </p>
              {ret.warehouseName && (
                <p className="mt-1">
                  <strong>Warehouse:</strong> {ret.warehouseName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-[#4f46e5]">
                PURCHASE RETURN
              </p>
              <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
                <p className="text-[10px] text-[#94a3b8] uppercase">Return No</p>
                <p className="font-bold">{ret.billNo}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-1">
                  Original Invoice
                </p>
                <p>{ret.originalInvoiceNo}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-1">Date</p>
                <p>{ret.date}</p>
              </div>
            </div>
          </div>

          {/* Party info */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#f8fafc] rounded-lg">
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">
                Returned To (Supplier)
              </p>
              <p className="font-bold text-sm">{ret.partyName}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">
                Returned From (Warehouse)
              </p>
              <p className="font-bold text-sm">{ret.warehouseName ?? '—'}</p>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-4">
            <thead>
              <tr className="bg-[#f8fafc]">
                {[
                  'Sr',
                  'Item Name',
                  'HSN',
                  'Return Qty',
                  'Unit',
                  'Rate (₹)',
                  'Amount (₹)',
                  'Reason',
                ].map((h) => (
                  <th
                    key={h}
                    className={`border border-[#e2e8f0] px-2 py-1.5 font-semibold text-[#64748b] uppercase ${
                      ['Return Qty', 'Rate (₹)', 'Amount (₹)'].includes(h)
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(ret.items ?? []).map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">
                    {item.itemName}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">
                    {item.hsnCode ?? '—'}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">
                    {item.returnQty}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">
                    {item.unit ?? '—'}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">
                    {Number(item.rate).toFixed(2)}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right font-bold">
                    {Number(item.amount).toFixed(2)}
                  </td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-[9px] text-[#64748b]">
                    {item.reason ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f8fafc] font-bold">
                <td
                  colSpan={6}
                  className="border border-[#e2e8f0] px-2 py-1.5 text-right"
                >
                  Total Return Amount
                </td>
                <td className="border border-[#e2e8f0] px-2 py-1.5 text-right text-[#4f46e5]">
                  {formatINR(totalAmount || 0)}
                </td>
                <td className="border border-[#e2e8f0] px-2 py-1.5" />
              </tr>
            </tfoot>
          </table>

          {/* Signature row */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-[#e2e8f0]">
            {['Prepared By', 'Supplier Acknowledgement', 'Authorised Signatory'].map(
              (label) => (
                <div key={label} className="text-center text-[10px] text-[#64748b]">
                  <p>{label}</p>
                  <p className="mt-8 border-t border-[#e2e8f0] pt-1">________________</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface Props {
  ret: PurchaseReturn;
  onClose: () => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export default function PurchaseReturnDetailModal({
  ret,
  onClose,
  onViewInvoice,
}: Props) {
  const [showPrint, setShowPrint] = useState(false);

  const totalAmount = ret.items.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-slate-50">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  Purchase Return
                </span>
                <span className="text-lg font-bold text-[#1e293b]">
                  {ret.billNo}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                  SAVED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ret.date}&nbsp;·&nbsp;{ret.partyName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Original Invoice:&nbsp;
                {onViewInvoice ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewInvoice(ret.originalInvoiceId);
                    }}
                    className="text-[#4f46e5] font-medium hover:underline cursor-pointer"
                  >
                    {ret.originalInvoiceNo}
                  </button>
                ) : (
                  <span className="font-medium text-[#4f46e5]">
                    {ret.originalInvoiceNo}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrint(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-printer-line" />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Items Returned', value: ret.items?.length ?? 0 },
                {
                  label: 'Total Qty',
                  value: (ret.items ?? []).reduce(
                    (s, i) => s + (Number(i.returnQty) || 0),
                    0
                  ),
                },
                { label: 'Total Amount', value: formatINR(totalAmount) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-slate-50 rounded-xl p-3 text-center border border-[#e2e8f0]"
                >
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                    {s.label}
                  </p>
                  <p className="text-base font-bold text-[#1e293b] mt-0.5">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Returned Items
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50">
                  <tr>
                    {[
                      '#',
                      'Item Name',
                      'HSN',
                      'Return Qty',
                      'Unit',
                      'Rate',
                      'Amount',
                      'Reason',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] ${
                          ['Return Qty', 'Rate', 'Amount'].includes(h)
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ret.items.map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-50 ${
                        i % 2 === 1 ? 'bg-[#f8fafc]' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-xs text-slate-400">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[#1e293b]">
                        {item.itemName}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">
                        {item.hsnCode ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-[#1e293b]">
                        {item.returnQty}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {item.unit ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {formatINR(Number(item.rate) || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">
                        {formatINR(Number(item.amount) || 0)}
                      </td>
                      <td className="px-3 py-2.5">
                        {item.reason ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                            {item.reason}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer total */}
              <div className="flex items-center justify-end px-4 py-3 bg-slate-50 border-t border-[#e2e8f0]">
                <div className="text-sm font-bold text-[#1e293b]">
                  Total Return Amount:
                  <span className="text-[#4f46e5] ml-2">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPrint(true)}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line mr-1.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showPrint && (
        <PrintPurchaseReturnView ret={ret} onClose={() => setShowPrint(false)} />
      )}
    </>
  );
}