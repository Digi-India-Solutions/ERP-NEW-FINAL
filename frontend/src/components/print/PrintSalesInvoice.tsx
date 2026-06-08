import { mockCompany } from '@/mocks/masters';
import type { PrintInvoiceData } from '@/utils/printDocument';

interface PrintSalesInvoiceProps {
  data: PrintInvoiceData;
  onClose: () => void;
  onPrint: () => void;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function PrintSalesInvoice({ data, onClose, onPrint }: PrintSalesInvoiceProps) {
  const c = mockCompany;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div
        className="bg-white w-[210mm] min-h-[297mm] shadow-2xl rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white">
          <div className="flex items-center gap-2">
            <i className="ri-file-text-line text-indigo-300" />
            <span className="text-sm font-medium">Tax Invoice Preview — {data.invoiceNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" />Print (F10)
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300">
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-8 text-[11px] font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#e2e8f0]">
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">{c.name}</h1>
              <p className="text-[#64748b] mt-1 leading-relaxed">{c.address}</p>
              <p className="mt-1"><strong>GSTIN:</strong> {c.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> {c.pan}</p>
              <p><strong>Ph:</strong> {c.phone} &nbsp;|&nbsp; <strong>Email:</strong> {c.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-[#4f46e5] tracking-wide">TAX INVOICE</p>
              <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide">Invoice No</p>
                <p className="font-bold text-base text-[#1e293b]">{data.invoiceNo}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mt-2">Date</p>
                <p>{data.date}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mt-2">Payment</p>
                <p>{data.paymentMode}</p>
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#f8fafc] rounded-lg">
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide font-semibold mb-1">Bill To</p>
              <p className="font-bold text-sm text-[#1e293b]">{data.customerName}</p>
              {data.customerGstin && <p className="text-[#64748b] mt-0.5">GSTIN: {data.customerGstin}</p>}
              <p className="text-[#64748b] mt-0.5 leading-relaxed">{data.billingAddress}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide font-semibold mb-1">Ship To</p>
              <p className="font-bold text-sm text-[#1e293b]">{data.customerName}</p>
              <p className="text-[#64748b] mt-0.5 leading-relaxed">{data.shippingAddress || data.billingAddress}</p>
            </div>
          </div>

          {data.showPaymentTable !== false && (
            <>
              <div className="mb-4 border border-[#e2e8f0] rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-[#e2e8f0]">
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Payment Details</p>
                </div>
                {[
                  { label: 'Payment Mode', value: data.paymentMode || '—' },
                  { label: 'Payment Status', value: data.paymentStatus || '—' },
                  { label: 'Invoice Amount', value: formatINR(data.grandTotal ?? 0) },
                  { label: 'Amount Paid', value: formatINR(data.paidAmount ?? 0) },
                  { label: 'Balance Due', value: formatINR(data.balanceDue ?? 0) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between px-3 py-2 border-b border-[#f1f5f9] text-[10px] last:border-0">
                    <span className="text-[#64748b]">{row.label}</span>
                    <span className="font-semibold text-[#1e293b]">{row.value}</span>
                  </div>
                ))}
              </div>

              {data.paymentModes && data.paymentModes.length > 0 && (
                <div className="mb-4 border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50">
                  <div className="px-3 py-2 bg-emerald-100 border-b border-emerald-200">
                    <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Payment Breakdown</p>
                  </div>
                  <div className="grid grid-cols-3 px-3 py-1.5 bg-emerald-100/70 border-b border-emerald-200 text-[10px] font-semibold text-emerald-900">
                    <span>Mode</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {data.paymentModes.map((pm, idx) => (
                    <div key={idx} className="grid grid-cols-3 px-3 py-2 border-b border-emerald-100 text-[10px] last:border-0 items-center">
                      <span className="text-emerald-700 font-medium">{pm.mode}</span>
                      <span className="text-center text-emerald-800 font-medium">{pm.status || data.paymentStatus || 'PAID'}</span>
                      <span className="text-right font-semibold text-emerald-900">{formatINR(pm.amount)}</span>
                    </div>
                  ))}
                  {data.remainingDue && data.remainingDue > 0 && (
                    <div className="flex justify-between px-3 py-2 bg-red-50 border-t border-red-200 text-[10px] font-bold">
                      <span className="text-red-700">Remaining Due</span>
                      <span className="text-red-600">{formatINR(data.remainingDue)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Items table */}
          <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-4">
            <thead>
              <tr className="bg-[#f8fafc]">
                {['Sr', 'Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'Taxable', 'GST%', 'Tax Amt', 'Total'].map((h, i) => (
                  <th key={i} className={`border border-[#e2e8f0] px-2 py-1.5 text-left font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap ${i >= 3 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">{item.sr}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">{item.name}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.hsn}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.qty}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.unit}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.rate)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.taxable)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.taxRate}%</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.taxAmt)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right font-bold">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals + Amount in words */}
          <div className="flex justify-between gap-6 mb-4">
            <div className="flex-1">
              <div className="p-3 bg-[#f8fafc] rounded-lg border-l-4 border-[#4f46e5]">
                <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-1">Amount in Words</p>
                <p className="font-semibold italic">Rupees {data.grandTotal.toLocaleString('en-IN')} Only</p>
              </div>
              <div className="mt-3 p-3 bg-[#f8fafc] rounded-lg text-[10px]">
                <p className="text-[#94a3b8] uppercase tracking-wide mb-1 font-semibold">Bank Details</p>
                <p><strong>Bank:</strong> HDFC Bank Ltd &nbsp;|&nbsp; <strong>A/C:</strong> 12345678901234</p>
                <p><strong>IFSC:</strong> HDFC0001234 &nbsp;|&nbsp; <strong>Branch:</strong> Baner, Pune</p>
              </div>
            </div>
            <div className="w-60">
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                {[
                  { label: 'Subtotal', value: formatINR(data.subtotal) },
                  { label: 'Discount', value: data.totalDiscount > 0 ? `- ${formatINR(data.totalDiscount)}` : '—' },
                  { label: 'Taxable Amount', value: formatINR(data.taxableAmount) },
                  ...(data.isSameState
                    ? [{ label: 'CGST', value: formatINR(data.cgst) }, { label: 'SGST', value: formatINR(data.sgst) }]
                    : [{ label: 'IGST', value: formatINR(data.igst) }]),
                  { label: 'Round Off', value: data.roundOff !== 0 ? formatINR(Math.abs(data.roundOff)) : '—' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between px-3 py-1.5 border-b border-[#f1f5f9] text-[10px]">
                    <span className="text-[#64748b]">{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-[#4f46e5] text-white font-bold text-sm">
                  <span>Grand Total</span>
                  <span>{formatINR(data.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="flex justify-end mt-8 pt-4 border-t border-[#e2e8f0]">
            <div className="text-center text-[10px] text-[#64748b] w-44">
              <p className="font-semibold text-[#1e293b]">{c.name}</p>
              <p className="mt-4 border-t border-[#e2e8f0] pt-1">Authorised Signatory</p>
            </div>
          </div>

          <p className="text-center text-[9px] text-[#94a3b8] italic mt-4">
            This is a computer generated invoice. No signature required if digitally signed.
          </p>
        </div>
      </div>
    </div>
  );
}
