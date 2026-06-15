// import { formatINR } from '../utils/POHelpers';
// import { mockCompany } from '@/mocks/masters';
// import type { APIPO } from '@/api/purchaseOrderApi';

// interface PrintPOProps {
//   po: APIPO;
//   onClose: () => void;
// }

// function PrintPOView({ po, onClose }: PrintPOProps) {
//   const c = mockCompany;

//   // ✅ FIX: items only exist when PO was opened via detail fetch first.
//   // Guard with Array.isArray so reduce never crashes on undefined.
//   const items = Array.isArray(po.items) ? po.items : [];
//   const totalOrdered = items.reduce((s, i) => s + (i.orderedQty ?? 0), 0);
//   const totalAmount  = po.totalAmount ?? items.reduce((s, i) => s + (i.amount ?? 0), 0);
//   const noItems = items.length === 0;

//   return (
//     <div
//       className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center overflow-y-auto py-8"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Toolbar */}
//         <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white print:hidden">
//           <div className="flex items-center gap-2">
//             <i className="ri-file-list-3-line text-indigo-300" />
//             <span className="text-sm font-medium">PO Preview — {po.poNumber}</span>
//           </div>
//           <div className="flex items-center gap-2">
//             {!noItems && (
//               <button
//                 onClick={() => window.print()}
//                 className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
//               >
//                 <i className="ri-printer-line" />Print
//               </button>
//             )}
//             <button
//               onClick={onClose}
//               className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300"
//             >
//               <i className="ri-close-line" />
//             </button>
//           </div>
//         </div>

//         {/* A4 Content */}
//         <div className="p-8 text-[11px] print-area">
//           {/* Company header */}
//           <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#e2e8f0]">
//             <div>
//               <h1 className="text-lg font-bold text-[#1e293b]">{c.name}</h1>
//               <p className="text-[#64748b] mt-1">{c.address}</p>
//               <p className="mt-1">
//                 <strong>GSTIN:</strong> {c.gstin} &nbsp;|&nbsp; <strong>Ph:</strong> {c.phone}
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-xl font-extrabold text-[#4f46e5]">PURCHASE ORDER</p>
//               <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
//                 <p className="text-[10px] text-[#94a3b8] uppercase">PO No</p>
//                 <p className="font-bold">{po.poNumber}</p>
//                 <p className="text-[10px] text-[#94a3b8] uppercase mt-2">Date</p>
//                 <p>{po.date ? new Date(po.date).toLocaleDateString('en-IN') : '—'}</p>
//                 <p className="text-[10px] text-[#94a3b8] uppercase mt-2">Status</p>
//                 <p className="font-semibold">{po.status}</p>
//               </div>
//             </div>
//           </div>

//           {/* Supplier info */}
//           <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#f8fafc] rounded-lg">
//             <div>
//               <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Supplier</p>
//               <p className="font-bold text-sm">{po.supplierName ?? '—'}</p>
//             </div>
//             <div>
//               <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Order Summary</p>
//               <p>Total Items: <strong>{po.itemCount ?? items.length}</strong></p>
//               <p>Total Qty: <strong>{po.totalOrderedQty ?? totalOrdered}</strong></p>
//               <p>Total Amount: <strong>{formatINR(totalAmount)}</strong></p>
//             </div>
//           </div>

//           {/* Items table or notice */}
//           {noItems ? (
//             <div className="text-center py-8 text-slate-400 text-xs border border-[#e2e8f0] rounded-lg mb-4 bg-slate-50">
//               <i className="ri-information-line text-lg mb-1 block" />
//               Item details not loaded. Please open the PO detail view first, then print.
//             </div>
//           ) : (
//             <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-4">
//               <thead>
//                 <tr className="bg-[#f8fafc]">
//                   {['Sr', 'Item Description', 'HSN', 'Ordered Qty', 'Received Qty', 'Pending Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'].map((h) => (
//                     <th
//                       key={h}
//                       className={`border border-[#e2e8f0] px-2 py-1.5 font-semibold text-[#64748b] uppercase ${
//                         ['Ordered Qty', 'Received Qty', 'Pending Qty', 'Rate (₹)', 'Amount (₹)'].includes(h)
//                           ? 'text-right' : 'text-left'
//                       }`}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.map((item, i) => {
//                   const pending = (item.orderedQty ?? 0) - (item.receivedQty ?? 0);
//                   return (
//                     <tr key={item.id ?? i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">{i + 1}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">{item.itemName ?? '—'}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5">{item.hsnCode ?? '—'}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.orderedQty ?? 0}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.receivedQty ?? 0}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{pending}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5">{item.unitName ?? 'Pcs'}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.rate)}</td>
//                       <td className="border border-[#e2e8f0] px-2 py-1.5 text-right font-bold">{formatINR(item.amount)}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//               <tfoot>
//                 <tr className="bg-[#f8fafc] font-bold">
//                   <td colSpan={3} className="border border-[#e2e8f0] px-2 py-1.5 text-right">Total</td>
//                   <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{totalOrdered}</td>
//                   <td colSpan={3} className="border border-[#e2e8f0] px-2 py-1.5" />
//                   <td className="border border-[#e2e8f0] px-2 py-1.5" />
//                   <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(totalAmount)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           )}

//           {/* Signatures */}
//           <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-[#e2e8f0]">
//             {['Prepared By', 'Approved By'].map((label) => (
//               <div key={label} className="text-center text-[10px] text-[#64748b]">
//                 <p>{label}</p>
//                 <p className="mt-8 border-t border-[#e2e8f0] pt-1">________________</p>
//               </div>
//             ))}
//             <div className="text-center text-[10px] text-[#64748b]">
//               <p className="font-semibold text-[#1e293b]">{c.name}</p>
//               <p className="mt-8 border-t border-[#e2e8f0] pt-1">Authorised Signatory</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PrintPOView;

import { useEffect, useState } from 'react';
import { formatINR } from '../utils/POHelpers';
import type { APIPO } from '@/api/purchaseOrderApi';

interface PrintPOProps {
  po: APIPO;
  onClose: () => void;
  gstType?: 'CGST_SGST' | 'IGST';
}

// ─── Amount in Words (Indian system) ─────────────────────────────────────────
function amountInWords(amount: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const n = Math.round(Number(amount) || 0);
  if (n === 0) return 'Zero Rupees Only';

  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        ' Hundred' +
        (num % 100 ? ' ' + convert(num % 100) : '')
      );
    if (num < 100000)
      return (
        convert(Math.floor(num / 1000)) +
        ' Thousand' +
        (num % 1000 ? ' ' + convert(num % 1000) : '')
      );
    if (num < 10000000)
      return (
        convert(Math.floor(num / 100000)) +
        ' Lakh' +
        (num % 100000 ? ' ' + convert(num % 100000) : '')
      );
    return convert(Math.floor(num / 10000000)) + ' Crore';
  };

  return convert(n) + ' Rupees Only';
}

// ─── GST helpers ──────────────────────────────────────────────────────────────
interface TaxGroup {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

function buildTaxGroups(
  items: APIPO['items'],
  isSameState: boolean,
): Record<string, TaxGroup> {
  return (items ?? []).reduce<Record<string, TaxGroup>>((acc, item) => {
    const rate = Number(item.gstRate) || 0;
    const taxable = Number(item.orderedQty) * Number(item.rate);
    const totalTax = taxable * (rate / 100);
    const cgst = isSameState ? totalTax / 2 : 0;
    const sgst = isSameState ? totalTax / 2 : 0;
    const igst = isSameState ? 0 : totalTax;

    const key = String(rate);
    if (!acc[key])
      acc[key] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    acc[key].taxable += taxable;
    acc[key].cgst += cgst;
    acc[key].sgst += sgst;
    acc[key].igst += igst;
    acc[key].totalTax += totalTax;
    return acc;
  }, {});
}

// ─── Component ────────────────────────────────────────────────────────────────
function PrintPOView({ po, onClose, gstType = 'CGST_SGST' }: PrintPOProps) {
  const [company, setCompany] = useState<any>(null);

  // Fetch real company data (same pattern as Purchase Invoice print)
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          'http://localhost:7001/api/v1/company/get',
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const json = await res.json();
        setCompany(json?.data || json);
      } catch (err) {
        console.error('Company fetch failed', err);
        // Fallback so print still works
        setCompany({ name: 'Your Company', address: '', gstin: '', phone: '' });
      }
    };
    loadCompany();
  }, []);

  const items = Array.isArray(po.items) ? po.items : [];
  const isSameState = gstType === 'CGST_SGST';
  const noItems = items.length === 0;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalOrdered = items.reduce((s, i) => s + (i.orderedQty ?? 0), 0);
  const subtotal = items.reduce(
    (s, i) => s + Number(i.orderedQty) * Number(i.rate),
    0,
  );

  let totalCGST = 0,
    totalSGST = 0,
    totalIGST = 0;
  items.forEach((i) => {
    const taxable = Number(i.orderedQty) * Number(i.rate);
    const totalTax = taxable * ((Number(i.gstRate) || 0) / 100);
    if (isSameState) {
      totalCGST += totalTax / 2;
      totalSGST += totalTax / 2;
    } else {
      totalIGST += totalTax;
    }
  });

  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = po.totalAmount ?? Math.round(subtotal + totalTax);
  const taxGroups = buildTaxGroups(items, isSameState);

  const poDate = po.date
    ? new Date(po.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const expectedDate = po.expectedDelivery
    ? new Date(po.expectedDelivery).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'text-amber-700',
    PARTIAL: 'text-sky-700',
    COMPLETED: 'text-emerald-700',
    CANCELLED: 'text-red-600',
  };

  // Wait for company before rendering (avoids flash)
  if (!company) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
        <div className="bg-white rounded-xl px-8 py-6 text-slate-500 text-sm flex items-center gap-2">
          <i className="ri-loader-4-line animate-spin text-lg" />
          Preparing PO…
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center overflow-y-auto py-8 print:bg-white print:p-0 print:static"
      onClick={onClose}
    >
      <div
        className="print-area bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white print:hidden">
          <div className="flex items-center gap-2">
            <i className="ri-file-list-3-line text-indigo-300" />
            <span className="text-sm font-medium">
              PO Preview — {po.poNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!noItems && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
              >
                <i className="ri-printer-line" /> Print
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        {/* ── A4 Content ────────────────────────────────────────────────────── */}
        <div className="p-10 text-[11px] text-slate-800">
          {/* HEADER */}
          <div className="flex justify-between border-b-2 border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">
                {company.name || 'Company Name'}
              </h1>
              <p className="max-w-[300px] text-slate-500 leading-relaxed">
                {company.address}
              </p>
              <p className="mt-2 font-semibold">
                GSTIN:{' '}
                <span className="font-normal">{company.gstin || '—'}</span> |
                Phone:{' '}
                <span className="font-normal">{company.phone || '—'}</span>
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black text-indigo-600 tracking-tight mb-2">
                PURCHASE ORDER
              </h2>
              <div className="inline-block border rounded-md p-3 bg-slate-50 text-left min-w-[160px]">
                <p className="text-[9px] uppercase text-slate-400 font-bold">
                  PO Number
                </p>
                <p className="font-bold text-sm">{po.poNumber}</p>
                <p className="text-[9px] uppercase text-slate-400 font-bold mt-2">
                  Date
                </p>
                <p className="font-medium">{poDate}</p>
                {po.expectedDelivery && (
                  <>
                    <p className="text-[9px] uppercase text-slate-400 font-bold mt-2">
                      Expected Delivery
                    </p>
                    <p className="font-medium">{expectedDate}</p>
                  </>
                )}
                <p className="text-[9px] uppercase text-slate-400 font-bold mt-2">
                  Status
                </p>
                <p
                  className={`font-bold ${STATUS_COLOR[po.status] ?? 'text-slate-700'}`}
                >
                  {po.status}
                </p>
              </div>
            </div>
          </div>

          {/* PARTIES */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Supplier */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                Supplier
              </p>
              <p className="font-bold text-sm text-slate-900">
                {(po as any).supplierName ?? po.supplier?.name ?? '—'}
              </p>
              {(po as any).supplier?.phone && (
                <p className="text-slate-500 mt-0.5">
                  Ph: {(po as any).supplier.phone}
                </p>
              )}
              {(po as any).billingAddress && (
                <p className="text-slate-500 mt-1">
                  {(po as any).billingAddress}
                </p>
              )}
            </div>

            {/* Delivery / PO Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                Deliver To
              </p>
              <p className="font-bold text-sm text-slate-900">
                {(po as any).warehouse?.name ??
                  (po as any).warehouseName ??
                  '—'}
              </p>
              {(po as any).deliveryAddress && (
                <p className="text-slate-500 mt-1">
                  {(po as any).deliveryAddress}
                </p>
              )}
              {(po as any).paymentTerms && (
                <p className="text-slate-500 mt-1">
                  <span className="font-semibold">Payment Terms:</span>{' '}
                  {(po as any).paymentTerms}
                </p>
              )}
              {(po as any).priority && (po as any).priority !== 'NORMAL' && (
                <p className="mt-1">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    {(po as any).priority} Priority
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* ITEMS TABLE */}
          {noItems ? (
            <div className="text-center py-8 text-slate-400 text-xs border border-[#e2e8f0] rounded-lg mb-6 bg-slate-50">
              <i className="ri-information-line text-lg mb-1 block" />
              Item details not loaded. Please open the PO detail view first,
              then print.
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-200 mb-6">
              <thead>
                <tr className="bg-slate-100 text-[#64748b] uppercase text-[9px] tracking-wider">
                  <th className="border border-slate-200 p-2 text-center w-8">
                    #
                  </th>
                  <th className="border border-slate-200 p-2 text-left">
                    Item Description
                  </th>
                  <th className="border border-slate-200 p-2 text-left">HSN</th>
                  <th className="border border-slate-200 p-2 text-right">
                    Ordered
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Received
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Pending
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Unit
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Rate
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    GST%
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Taxable
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Tax Amt
                  </th>
                  <th className="border border-slate-200 p-2 text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const taxable = Number(item.orderedQty) * Number(item.rate);
                  const taxAmt = taxable * ((Number(item.gstRate) || 0) / 100);
                  const total = taxable + taxAmt;
                  const pending =
                    (item.orderedQty ?? 0) - (item.receivedQty ?? 0);
                  return (
                    <tr
                      key={item.id ?? i}
                      className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}
                    >
                      <td className="border border-slate-200 p-2 text-center text-slate-400">
                        {i + 1}
                      </td>
                      <td className="border border-slate-200 p-2 font-medium">
                        {item.itemName ?? '—'}
                      </td>
                      <td className="border border-slate-200 p-2 text-slate-500 font-mono">
                        {item.hsnCode ?? '—'}
                      </td>
                      <td className="border border-slate-200 p-2 text-right">
                        {item.orderedQty ?? 0}
                      </td>
                      <td className="border border-slate-200 p-2 text-right text-emerald-700">
                        {item.receivedQty ?? 0}
                      </td>
                      <td
                        className={`border border-slate-200 p-2 text-right font-medium ${pending > 0 ? 'text-amber-700' : 'text-slate-400'}`}
                      >
                        {pending}
                      </td>
                      <td className="border border-slate-200 p-2 text-right text-slate-500">
                        {item.unitName ?? 'Pcs'}
                      </td>
                      <td className="border border-slate-200 p-2 text-right">
                        {Number(item.rate).toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-2 text-right">
                        {item.gstRate ?? 0}%
                      </td>
                      <td className="border border-slate-200 p-2 text-right">
                        {taxable.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-2 text-right">
                        {taxAmt.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-2 text-right font-bold text-slate-900">
                        ₹{total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan={3}
                    className="border border-slate-200 p-2 text-right text-xs text-slate-500 uppercase"
                  >
                    Total
                  </td>
                  <td className="border border-slate-200 p-2 text-right">
                    {totalOrdered}
                  </td>
                  <td className="border border-slate-200 p-2 text-right text-emerald-700">
                    {items.reduce((s, i) => s + (i.receivedQty ?? 0), 0)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right text-amber-700">
                    {items.reduce(
                      (s, i) =>
                        s + ((i.orderedQty ?? 0) - (i.receivedQty ?? 0)),
                      0,
                    )}
                  </td>
                  <td colSpan={3} className="border border-slate-200 p-2" />
                  <td className="border border-slate-200 p-2 text-right">
                    {subtotal.toFixed(2)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right">
                    {totalTax.toFixed(2)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right text-indigo-700">
                    ₹{grandTotal.toFixed ? grandTotal.toFixed(2) : grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* FOOTER: GST Summary + Totals */}
          {!noItems && (
            <div className="grid grid-cols-2 gap-8 mt-2">
              {/* GST Tax Summary */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  GST Tax Summary
                </p>
                <table className="w-full border-collapse border border-slate-200 text-[10px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 p-1.5 text-left">
                        Rate
                      </th>
                      <th className="border border-slate-200 p-1.5 text-right">
                        Taxable Amt
                      </th>
                      {isSameState ? (
                        <>
                          <th className="border border-slate-200 p-1.5 text-right">
                            CGST
                          </th>
                          <th className="border border-slate-200 p-1.5 text-right">
                            SGST
                          </th>
                        </>
                      ) : (
                        <th className="border border-slate-200 p-1.5 text-right">
                          IGST
                        </th>
                      )}
                      <th className="border border-slate-200 p-1.5 text-right">
                        Total Tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(taxGroups).map(([rate, v]) => (
                      <tr key={rate}>
                        <td className="border border-slate-200 p-1.5 font-semibold">
                          {rate}%
                        </td>
                        <td className="border border-slate-200 p-1.5 text-right">
                          {v.taxable.toFixed(2)}
                        </td>
                        {isSameState ? (
                          <>
                            <td className="border border-slate-200 p-1.5 text-right">
                              {v.cgst.toFixed(2)}
                            </td>
                            <td className="border border-slate-200 p-1.5 text-right">
                              {v.sgst.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td className="border border-slate-200 p-1.5 text-right">
                            {v.igst.toFixed(2)}
                          </td>
                        )}
                        <td className="border border-slate-200 p-1.5 text-right font-semibold">
                          {v.totalTax.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-slate-200 p-1.5">Total</td>
                      <td className="border border-slate-200 p-1.5 text-right">
                        {subtotal.toFixed(2)}
                      </td>
                      {isSameState ? (
                        <>
                          <td className="border border-slate-200 p-1.5 text-right">
                            {totalCGST.toFixed(2)}
                          </td>
                          <td className="border border-slate-200 p-1.5 text-right">
                            {totalSGST.toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <td className="border border-slate-200 p-1.5 text-right">
                          {totalIGST.toFixed(2)}
                        </td>
                      )}
                      <td className="border border-slate-200 p-1.5 text-right">
                        {totalTax.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Amount in Words */}
                <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                    Amount in Words
                  </p>
                  <p className="italic font-medium text-indigo-900">
                    {amountInWords(
                      typeof grandTotal === 'number'
                        ? grandTotal
                        : Number(grandTotal),
                    )}
                  </p>
                </div>

                {/* Terms & Conditions */}
                {(po as any).termsConditions && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-100">
                    <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">
                      Terms &amp; Conditions
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {(po as any).termsConditions}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {(po as any).notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                      Notes
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {(po as any).notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Totals Panel */}
              <div className="flex flex-col gap-2 p-4 border-2 border-slate-100 rounded-lg">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal (Taxable)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {isSameState ? (
                  <>
                    {totalCGST > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>(+) CGST</span>
                        <span>₹{totalCGST.toFixed(2)}</span>
                      </div>
                    )}
                    {totalSGST > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>(+) SGST</span>
                        <span>₹{totalSGST.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  totalIGST > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>(+) IGST</span>
                      <span>₹{totalIGST.toFixed(2)}</span>
                    </div>
                  )
                )}

                <div className="h-px bg-slate-200 my-1" />

                <div className="flex justify-between text-lg font-black text-indigo-600">
                  <span>GRAND TOTAL</span>
                  <span>
                    ₹
                    {typeof grandTotal === 'number'
                      ? grandTotal.toFixed(2)
                      : Number(grandTotal).toFixed(2)}
                  </span>
                </div>

                {/* Quick Stats
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-slate-800">{items.length}</p>
                    <p className="text-[10px] text-slate-400">Total Items</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-slate-800">{totalOrdered}</p>
                    <p className="text-[10px] text-slate-400">Total Qty</p>
                  </div> */}
                {/* <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-emerald-700">
                      {items.reduce((s, i) => s + (i.receivedQty ?? 0), 0)}
                    </p>
                    <p className="text-[10px] text-emerald-500">Received</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <p className="text-base font-bold text-amber-700">
                      {items.reduce((s, i) => s + ((i.orderedQty ?? 0) - (i.receivedQty ?? 0)), 0)}
                    </p>
                    <p className="text-[10px] text-amber-500">Pending</p>
                  </div> */}
                {/* </div> */}

                {/* Tax type badge */}
                {/* <div className={`mt-2 px-3 py-1.5 rounded-lg text-center text-[10px] font-bold uppercase tracking-wide ${
                  isSameState
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {isSameState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                </div> */}
              </div>
            </div>
          )}

          {/* SIGNATURES */}
          <div className="mt-12 flex justify-between items-end">
            <div className="text-center border-t border-slate-300 pt-2 w-40">
              <p className="text-[9px] uppercase font-bold text-slate-400">
                Supplier Acknowledgement
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] mb-8 font-bold">For {company.name}</p>
              <div className="border-t border-slate-300 pt-2 w-48">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Authorised Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintPOView;
