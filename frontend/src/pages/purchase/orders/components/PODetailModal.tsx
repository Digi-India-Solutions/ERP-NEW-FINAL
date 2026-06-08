// import { useNavigate } from 'react-router-dom';
// import type { APIPO } from '@/api/purchaseOrderApi';
// import { formatINR } from '../utils/POHelpers';
// import { useAuth } from '@/contexts/AuthContext';
// import { MODULES } from '@/utils/permissions';

// const STATUS_STYLES: Record<string, string> = {
//   PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
//   PARTIAL:   'bg-sky-50 text-sky-700 border-sky-200',
//   COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//   CANCELLED: 'bg-red-50 text-red-700 border-red-200',
// };

// const STATUS_ICONS: Record<string, string> = {
//   PENDING:   'ri-time-line',
//   PARTIAL:   'ri-loader-4-line',
//   COMPLETED: 'ri-checkbox-circle-line',
//   CANCELLED: 'ri-close-circle-line',
// };

// interface PODetailModalProps {
//   po: APIPO;
//   loading: boolean;
//   onClose: () => void;
//   onPrint: (po: APIPO) => void;
//   onReceive: (po: APIPO) => void;
// }

// function PODetailModal({ po, loading, onClose, onPrint, onReceive }: PODetailModalProps) {
//   const navigate = useNavigate();
//   const {hasPermission} = useAuth();
//   const canReveiveStock = hasPermission(MODULES.STOCK_RECEIVING, 'create');
//   const items = po.items ?? [];

//   const totalOrdered  = items.reduce((s, i) => s + i.orderedQty, 0);
//   const totalReceived = items.reduce((s, i) => s + i.receivedQty, 0);
//   const totalPending  = totalOrdered - totalReceived;
//   const totalAmount   = po.totalAmount ?? items.reduce((s, i) => s + i.amount, 0);

//   const canReceive = po.status !== 'COMPLETED' && po.status !== 'CANCELLED';

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
//       <div
//         className="bg-white rounded-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[92vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-slate-50">
//           <div>
//             <div className="flex items-center gap-3">
//               <span className="text-lg font-bold text-[#1e293b]">{po.poNumber}</span>
//               <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[po.status] ?? ''}`}>
//                 <i className={`${STATUS_ICONS[po.status] ?? 'ri-question-line'} mr-1`} />
//                 {po.status}
//               </span>
//             </div>
//             <p className="text-xs text-slate-500 mt-0.5">
//               {po.date} &nbsp;·&nbsp; {po.supplierName ?? '—'}
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             {canReceive && canReveiveStock && (
//               <button
//                 type="button"
//                 onClick={() => onReceive(po)}
//                 className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
//               >
//                 <i className="ri-inbox-archive-line" />Receive Stock
//               </button>
//             )}
//             <button
//               type="button"
//               onClick={() => onPrint(po)}
//               className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
//             >
//               <i className="ri-printer-line" />Print
//             </button>
//             <button
//               type="button"
//               onClick={onClose}
//               className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100"
//             >
//               <i className="ri-close-line text-lg" />
//             </button>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-5">
//           {/* Loading skeleton for items */}
//           {loading && (
//             <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
//               <i className="ri-loader-4-line animate-spin text-xl" />
//               <span className="text-sm">Loading order details...</span>
//             </div>
//           )}

//           {!loading && (
//             <>
//               {/* Stats row */}
//               <div className="grid grid-cols-4 gap-3">
//                 {[
//                   { label: 'Total Items',   value: items.length },
//                   { label: 'Ordered Qty',   value: totalOrdered },
//                   { label: 'Received Qty',  value: totalReceived },
//                   { label: 'Pending Qty',   value: totalPending },
//                 ].map((s) => (
//                   <div
//                     key={s.label}
//                     className={`rounded-xl p-3 text-center ${s.label === 'Pending Qty' && totalPending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}
//                   >
//                     <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{s.label}</p>
//                     <p className={`text-base font-bold mt-0.5 ${s.label === 'Pending Qty' && totalPending > 0 ? 'text-amber-700' : 'text-[#1e293b]'}`}>
//                       {s.value}
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               {/* Items table */}
//               {items.length > 0 ? (
//                 <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
//                   <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
//                     <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Items</h3>
//                   </div>
//                   <table className="w-full text-sm">
//                     <thead className="bg-slate-50/50">
//                       <tr>
//                         {['#', 'Item Name', 'HSN', 'Ordered', 'Received', 'Pending', 'Unit', 'Rate', 'Amount', 'Status'].map((h) => (
//                           <th
//                             key={h}
//                             className={`px-3 py-2.5 text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] ${
//                               ['Ordered', 'Received', 'Pending', 'Rate', 'Amount'].includes(h) ? 'text-right' : 'text-left'
//                             }`}
//                           >
//                             {h}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {items.map((item, i) => {
//                         const pending    = item.orderedQty - item.receivedQty;
//                         const isComplete = pending === 0;
//                         const isPartial  = item.receivedQty > 0 && pending > 0;
//                         return (
//                           <tr key={item.id ?? i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}>
//                             <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
//                             <td className="px-3 py-2.5 font-medium text-[#1e293b]">{item.itemName ?? '—'}</td>
//                             <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{item.hsnCode ?? '—'}</td>
//                             <td className="px-3 py-2.5 text-right">{item.orderedQty}</td>
//                             <td className="px-3 py-2.5 text-right text-emerald-700 font-medium">{item.receivedQty}</td>
//                             <td className={`px-3 py-2.5 text-right font-medium ${pending > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{pending}</td>
//                             <td className="px-3 py-2.5 text-slate-500">{item.unitName ?? 'Pcs'}</td>
//                             <td className="px-3 py-2.5 text-right">{formatINR(item.rate)}</td>
//                             <td className="px-3 py-2.5 text-right font-semibold">{formatINR(item.amount)}</td>
//                             <td className="px-3 py-2.5">
//                               {po.status === 'CANCELLED' ? (
//   <span className="text-xs text-red-600 font-medium">
//     <i className="ri-close-circle-line mr-0.5" />
//     Cancelled
//   </span>
// ) : isComplete ? (
//   <span className="text-xs text-emerald-600 font-medium">
//     <i className="ri-checkbox-circle-line mr-0.5" />
//     Done
//   </span>
// ) : isPartial ? (
//   <span className="text-xs text-amber-600 font-medium">
//     <i className="ri-loader-4-line mr-0.5" />
//     Partial
//   </span>
// ) : (
//   <span className="text-xs text-red-500 font-medium">
//     <i className="ri-close-circle-line mr-0.5" />
//     Pending
//   </span>
// )}

//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                     <tfoot>
//                       <tr className="bg-slate-50 border-t border-[#e2e8f0]">
//                         <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-slate-500 text-right">Total</td>
//                         <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">{totalOrdered}</td>
//                         <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{totalReceived}</td>
//                         <td className="px-3 py-2.5 text-right font-bold text-amber-700">{totalPending}</td>
//                         <td colSpan={2} className="px-3 py-2.5" />
//                         <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">{formatINR(totalAmount)}</td>
//                         <td className="px-3 py-2.5" />
//                       </tr>
//                     </tfoot>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-slate-400 text-sm">
//                   <i className="ri-inbox-line text-2xl mb-1 block" />
//                   No items found for this order
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end gap-2">
//           {canReceive && canReveiveStock && (
//             <button
//               type="button"
//               onClick={() => onReceive(po)}
//               className="h-9 px-4 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
//             >
//               <i className="ri-inbox-archive-line mr-1.5" />Receive Stock
//             </button>
//           )}
//           <button
//             type="button"
//             onClick={() => onPrint(po)}
//             className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
//           >
//             <i className="ri-printer-line mr-1.5" />Print PO
//           </button>
//           <button
//             type="button"
//             onClick={onClose}
//             className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PODetailModal;

import { useNavigate } from 'react-router-dom';
import type { APIPO } from '@/api/purchaseOrderApi';
import { formatINR } from '../utils/POHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  PARTIAL:   'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, string> = {
  PENDING:   'ri-time-line',
  PARTIAL:   'ri-loader-4-line',
  COMPLETED: 'ri-checkbox-circle-line',
  CANCELLED: 'ri-close-circle-line',
};

interface PODetailModalProps {
  po: APIPO;
  loading: boolean;
  onClose: () => void;
  onPrint: (po: APIPO) => void;
  onReceive: (po: APIPO) => void;
  gstType?: 'CGST_SGST' | 'IGST';
}

// ─── GST helpers ──────────────────────────────────────────────────────────────
function calcItemGST(item: any, isSameState: boolean) {
  const taxable  = Number(item.orderedQty) * Number(item.rate);
  const totalTax = taxable * ((Number(item.gstRate) || 0) / 100);
  return {
    taxable,
    cgst:  isSameState ? totalTax / 2 : 0,
    sgst:  isSameState ? totalTax / 2 : 0,
    igst:  isSameState ? 0 : totalTax,
    total: taxable + totalTax,
  };
}

interface TaxGroup {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

function buildTaxGroups(items: any[], isSameState: boolean): Record<string, TaxGroup> {
  return items.reduce<Record<string, TaxGroup>>((acc, item) => {
    const rate = String(Number(item.gstRate) || 0);
    const g    = calcItemGST(item, isSameState);
    if (!acc[rate]) acc[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    acc[rate].taxable  += g.taxable;
    acc[rate].cgst     += g.cgst;
    acc[rate].sgst     += g.sgst;
    acc[rate].igst     += g.igst;
    acc[rate].totalTax += g.cgst + g.sgst + g.igst;
    return acc;
  }, {});
}

// ─── Component ────────────────────────────────────────────────────────────────
function PODetailModal({ po, loading, onClose, onPrint, onReceive, gstType = 'CGST_SGST' }: PODetailModalProps) {
  const { hasPermission } = useAuth();
  const canReceiveStock   = hasPermission(MODULES.STOCK_RECEIVING, 'create');
  const items             = po.items ?? [];
  const isSameState       = gstType === 'CGST_SGST';

  const totalOrdered  = items.reduce((s, i) => s + i.orderedQty, 0);
  const totalReceived = items.reduce((s, i) => s + i.receivedQty, 0);
  const totalPending  = totalOrdered - totalReceived;

 
 // ── GST aggregates ────────────────────────────────────────────────────────
  let subtotal   = 0;
  let totalCGST  = 0;
  let totalSGST  = 0;
  let totalIGST  = 0;

  items.forEach((item) => {
    const g = calcItemGST(item, isSameState);
    subtotal  += g.taxable;
    totalCGST += g.cgst;
    totalSGST += g.sgst;
    totalIGST += g.igst;
  });

  const totalTax   = totalCGST + totalSGST + totalIGST;
  
  // FIX: Force recalculation from live item fields so stale DB inputs don't override layouts
  const grandTotal = parseFloat((subtotal + totalTax).toFixed(2));
  const taxGroups  = buildTaxGroups(items, isSameState);

  const canReceive = po.status !== 'COMPLETED' && po.status !== 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-5xl mx-4 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#1e293b]">{po.poNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[po.status] ?? ''}`}>
                <i className={`${STATUS_ICONS[po.status] ?? 'ri-question-line'} mr-1`} />
                {po.status}
              </span>
              {/* GST type badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                isSameState
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {isSameState ? 'CGST+SGST' : 'IGST'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {po.date} &nbsp;·&nbsp; {po.supplierName ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canReceive && canReceiveStock && (
              <button
                type="button"
                onClick={() => onReceive(po)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-inbox-archive-line" /> Receive Stock
              </button>
            )}
            <button
              type="button"
              onClick={() => onPrint(po)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" /> Print
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

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <i className="ri-loader-4-line animate-spin text-xl" />
              <span className="text-sm">Loading order details...</span>
            </div>
          )}

          {!loading && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Items',  value: items.length,   accent: false },
                  { label: 'Ordered Qty',  value: totalOrdered,   accent: false },
                  { label: 'Received Qty', value: totalReceived,  accent: false },
                  { label: 'Pending Qty',  value: totalPending,   accent: totalPending > 0 },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl p-3 text-center ${s.accent ? 'bg-amber-50' : 'bg-slate-50'}`}
                  >
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{s.label}</p>
                    <p className={`text-base font-bold mt-0.5 ${s.accent ? 'text-amber-700' : 'text-[#1e293b]'}`}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Items table */}
              {items.length > 0 ? (
                <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0] flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Items</h3>
                    <span className="text-[10px] text-slate-400">{isSameState ? 'Intra-State — CGST + SGST' : 'Inter-State — IGST'}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/50">
                        <tr>
                          {[
                            { label: '#',        align: 'left'  },
                            { label: 'Item',     align: 'left'  },
                            { label: 'HSN',      align: 'left'  },
                            { label: 'Ordered',  align: 'right' },
                            { label: 'Received', align: 'right' },
                            { label: 'Pending',  align: 'right' },
                            { label: 'Unit',     align: 'left'  },
                            { label: 'Rate',     align: 'right' },
                            { label: 'GST%',     align: 'right' },
                            { label: 'Taxable',  align: 'right' },
                            ...(isSameState
                              ? [{ label: 'CGST', align: 'right' }, { label: 'SGST', align: 'right' }]
                              : [{ label: 'IGST', align: 'right' }]
                            ),
                            { label: 'Total',  align: 'right' },
                            { label: 'Status', align: 'left'  },
                          ].map((h) => (
                            <th
                              key={h.label}
                              className={`px-3 py-2.5 text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] text-${h.align} whitespace-nowrap`}
                            >
                              {h.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, i) => {
                          const pending     = item.orderedQty - item.receivedQty;
                          const isComplete  = pending === 0;
                          const isPartial   = item.receivedQty > 0 && pending > 0;
                          const g           = calcItemGST(item, isSameState);

                          return (
                            <tr key={item.id ?? i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}>
                              <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2.5 font-medium text-[#1e293b] whitespace-nowrap">{item.itemName ?? '—'}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{item.hsnCode ?? '—'}</td>
                              <td className="px-3 py-2.5 text-right">{item.orderedQty}</td>
                              <td className="px-3 py-2.5 text-right text-emerald-700 font-medium">{item.receivedQty}</td>
                              <td className={`px-3 py-2.5 text-right font-medium ${pending > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                {pending}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-xs">{item.unitName ?? 'Pcs'}</td>
                              <td className="px-3 py-2.5 text-right">{formatINR(item.rate)}</td>
                              <td className="px-3 py-2.5 text-right text-slate-500">{item.gstRate ?? 0}%</td>
                              <td className="px-3 py-2.5 text-right text-slate-600">{formatINR(g.taxable)}</td>

                              {isSameState ? (
                                <>
                                  <td className="px-3 py-2.5 text-right text-indigo-600">{formatINR(g.cgst)}</td>
                                  <td className="px-3 py-2.5 text-right text-indigo-600">{formatINR(g.sgst)}</td>
                                </>
                              ) : (
                                <td className="px-3 py-2.5 text-right text-orange-600">{formatINR(g.igst)}</td>
                              )}

                              <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">{formatINR(g.total)}</td>

                              <td className="px-3 py-2.5">
                                {po.status === 'CANCELLED' ? (
                                  <span className="text-xs text-red-600 font-medium">
                                    <i className="ri-close-circle-line mr-0.5" />Cancelled
                                  </span>
                                ) : isComplete ? (
                                  <span className="text-xs text-emerald-600 font-medium">
                                    <i className="ri-checkbox-circle-line mr-0.5" />Done
                                  </span>
                                ) : isPartial ? (
                                  <span className="text-xs text-amber-600 font-medium">
                                    <i className="ri-loader-4-line mr-0.5" />Partial
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-500 font-medium">
                                    <i className="ri-close-circle-line mr-0.5" />Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot>
                        <tr className="bg-slate-50 border-t border-[#e2e8f0] font-semibold">
                          <td colSpan={3} className="px-3 py-2.5 text-xs text-slate-500 text-right">Total</td>
                          <td className="px-3 py-2.5 text-right text-[#1e293b]">{totalOrdered}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-700">{totalReceived}</td>
                          <td className="px-3 py-2.5 text-right text-amber-700">{totalPending}</td>
                          <td colSpan={2} className="px-3 py-2.5" />
                          {/* GST% blank */}
                          <td className="px-3 py-2.5" />
                          {/* Taxable */}
                          <td className="px-3 py-2.5 text-right text-slate-600">{formatINR(subtotal)}</td>

                          {isSameState ? (
                            <>
                              <td className="px-3 py-2.5 text-right text-indigo-600">{formatINR(totalCGST)}</td>
                              <td className="px-3 py-2.5 text-right text-indigo-600">{formatINR(totalSGST)}</td>
                            </>
                          ) : (
                            <td className="px-3 py-2.5 text-right text-orange-600">{formatINR(totalIGST)}</td>
                          )}

                          <td className="px-3 py-2.5 text-right text-[#4f46e5] font-bold">
                            {formatINR(grandTotal)}
                          </td>
                          <td className="px-3 py-2.5" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <i className="ri-inbox-line text-2xl mb-1 block" />
                  No items found for this order
                </div>
              )}

              {/* ── GST Summary + Totals ──────────────────────────────────── */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 gap-4">

                  {/* GST Tax Summary */}
                  <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">GST Tax Summary</h3>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-500 border-b border-[#e2e8f0]">Rate</th>
                          <th className="px-3 py-2 text-right text-slate-500 border-b border-[#e2e8f0]">Taxable Amt</th>
                          {isSameState ? (
                            <>
                              <th className="px-3 py-2 text-right text-indigo-500 border-b border-[#e2e8f0]">CGST</th>
                              <th className="px-3 py-2 text-right text-indigo-500 border-b border-[#e2e8f0]">SGST</th>
                            </>
                          ) : (
                            <th className="px-3 py-2 text-right text-orange-500 border-b border-[#e2e8f0]">IGST</th>
                          )}
                          <th className="px-3 py-2 text-right text-slate-500 border-b border-[#e2e8f0]">Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(taxGroups).map(([rate, v]) => (
                          <tr key={rate} className="border-b border-slate-50">
                            <td className="px-3 py-2 font-semibold">{rate}%</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatINR(v.taxable)}</td>
                            {isSameState ? (
                              <>
                                <td className="px-3 py-2 text-right text-indigo-600">{formatINR(v.cgst)}</td>
                                <td className="px-3 py-2 text-right text-indigo-600">{formatINR(v.sgst)}</td>
                              </>
                            ) : (
                              <td className="px-3 py-2 text-right text-orange-600">{formatINR(v.igst)}</td>
                            )}
                            <td className="px-3 py-2 text-right font-semibold">{formatINR(v.totalTax)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-[#e2e8f0]">
                          <td className="px-3 py-2 text-slate-600">Total</td>
                          <td className="px-3 py-2 text-right text-slate-700">{formatINR(subtotal)}</td>
                          {isSameState ? (
                            <>
                              <td className="px-3 py-2 text-right text-indigo-700">{formatINR(totalCGST)}</td>
                              <td className="px-3 py-2 text-right text-indigo-700">{formatINR(totalSGST)}</td>
                            </>
                          ) : (
                            <td className="px-3 py-2 text-right text-orange-700">{formatINR(totalIGST)}</td>
                          )}
                          <td className="px-3 py-2 text-right text-[#1e293b]">{formatINR(totalTax)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Totals panel */}
                  <div className="border border-[#e2e8f0] rounded-xl p-4 flex flex-col gap-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Order Totals</h3>

                    <div className="flex justify-between items-center text-sm text-slate-500">
                      <span>Subtotal (Taxable)</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>

                    {isSameState ? (
                      <>
                        {totalCGST > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">(+) CGST</span>
                            <span className="text-indigo-600 font-medium">{formatINR(totalCGST)}</span>
                          </div>
                        )}
                        {totalSGST > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">(+) SGST</span>
                            <span className="text-indigo-600 font-medium">{formatINR(totalSGST)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      totalIGST > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">(+) IGST</span>
                          <span className="text-orange-600 font-medium">{formatINR(totalIGST)}</span>
                        </div>
                      )
                    )}

                    {totalTax > 0 && (
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Total Tax</span>
                        <span>{formatINR(totalTax)}</span>
                      </div>
                    )}

                    <div className="h-px bg-[#e2e8f0] my-1" />

                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-[#1e293b]">Grand Total</span>
                      <span className="text-xl font-extrabold text-[#4f46e5]">{formatINR(grandTotal)}</span>
                    </div>

                    {/* Mini stats */}
                    <div className="mt-2 pt-2 border-t border-[#e2e8f0] grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-sm font-bold text-[#1e293b]">{items.length}</p>
                        <p className="text-[10px] text-slate-400">Items</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-sm font-bold text-emerald-700">{totalReceived}</p>
                        <p className="text-[10px] text-emerald-500">Received</p>
                      </div>
                      <div className={`rounded-lg p-2 ${totalPending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                        <p className={`text-sm font-bold ${totalPending > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{totalPending}</p>
                        <p className={`text-[10px] ${totalPending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>Pending</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end gap-2">
          {canReceive && canReceiveStock && (
            <button
              type="button"
              onClick={() => onReceive(po)}
              className="h-9 px-4 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-inbox-archive-line mr-1.5" />Receive Stock
            </button>
          )}
          <button
            type="button"
            onClick={() => onPrint(po)}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line mr-1.5" />Print PO
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
  );
}

export default PODetailModal;