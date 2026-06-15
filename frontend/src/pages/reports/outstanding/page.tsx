// import { useState } from 'react';
// import ReportLayout from '@/pages/reports/components/ReportLayout';
// import SummaryCards from '@/pages/reports/components/SummaryCards';
// import { useOutstanding } from '@/hooks/useReports';

// function formatINR(n: number) {
//   return `₹${n.toLocaleString('en-IN')}`;
// }

// type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

// const AGING_META: Record<AgingBucket, { label: string; rowCls: string; badgeCls: string }> = {
//   '0-30': { label: '0–30 days', rowCls: 'bg-green-50/40 hover:bg-green-50', badgeCls: 'bg-green-100 text-green-700' },
//   '31-60': { label: '31–60 days', rowCls: 'bg-amber-50/40 hover:bg-amber-50', badgeCls: 'bg-amber-100 text-amber-700' },
//   '61-90': { label: '61–90 days', rowCls: 'bg-orange-50/40 hover:bg-orange-50', badgeCls: 'bg-orange-100 text-orange-700' },
//   '90+': { label: '90+ days', rowCls: 'bg-red-50/40 hover:bg-red-50', badgeCls: 'bg-red-100 text-red-700' },
// };

// export default function OutstandingReport() {
//   const today = new Date().toISOString().split('T')[0];
//   const [asOfDate, setAsOfDate] = useState(today);
//   const [generated, setGenerated] = useState(false);
//   const { data = [], isFetching, refetch } = useOutstanding(asOfDate, generated);

//   const handleGenerate = () => {
//     setGenerated(true);
//     if (generated) refetch();
//   };

//   const totalOutstanding = data.reduce((s, r) => s + r.balance, 0);
//   const bucket30 = data.filter((r) => r.agingBucket === '0-30').reduce((s, r) => s + r.balance, 0);
//   const bucket60 = data.filter((r) => r.agingBucket === '31-60').reduce((s, r) => s + r.balance, 0);
//   const bucketOld = data.filter((r) => r.agingBucket === '61-90' || r.agingBucket === '90+').reduce((s, r) => s + r.balance, 0);

//   // Group by customer
//   const customers = [...new Set(data.map((r) => r.customer))];

//   const exportColumns = [
//     { header: 'Customer', key: 'customer', width: 24 },
//     { header: 'Invoice No', key: 'invoiceNo', width: 18 },
//     { header: 'Invoice Date', key: 'invoiceDate', width: 14 },
//     { header: 'Due Date', key: 'dueDate', width: 14 },
//     { header: 'Invoice Amount', key: 'invoiceAmount', width: 16 },
//     { header: 'Paid', key: 'paid', width: 14 },
//     { header: 'Balance', key: 'balance', width: 14 },
//     { header: 'Aging Days', key: 'agingDays', width: 12 },
//     { header: 'Bucket', key: 'agingBucket', width: 12 },
//   ];

//   const filterBar = (
//     <div className="flex flex-wrap items-end gap-3">
//       <div>
//         <label className="block text-xs font-medium text-[#64748b] mb-1">Outstanding as of</label>
//         <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
//           className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]" />
//       </div>
//       <div className="flex gap-2 mt-4">
//         {Object.entries(AGING_META).map(([bucket, meta]) => (
//           <div key={bucket} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${meta.badgeCls}`}>
//             <span className="font-medium">{meta.label}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <ReportLayout
//       title="Outstanding Invoices"
//       subtitle="Unpaid and partially paid invoices grouped by aging period"
//       filterBar={filterBar}
//       onGenerate={handleGenerate}
//       generating={isFetching}
//       generated={generated}
//       exportData={data as unknown as Record<string, unknown>[]}
//       exportColumns={exportColumns}
//       exportFilename={`outstanding-${asOfDate}`}
//     >
//       {generated && (
//         <>
//           <SummaryCards cards={[
//             { label: 'Total Outstanding', value: formatINR(totalOutstanding), icon: 'ri-money-rupee-circle-line', color: 'bg-red-50 text-red-500' },
//             { label: 'Current (0–30 days)', value: formatINR(bucket30), icon: 'ri-time-line', color: 'bg-green-50 text-green-600' },
//             { label: 'Overdue (31–60 days)', value: formatINR(bucket60), icon: 'ri-alarm-warning-line', color: 'bg-amber-50 text-amber-600' },
//             { label: 'Critical (61+ days)', value: formatINR(bucketOld), icon: 'ri-error-warning-line', color: 'bg-red-100 text-red-600' },
//           ]} />

//           {customers.map((customer) => {
//             const rows = data.filter((r) => r.customer === customer);
//             const customerTotal = rows.reduce((s, r) => s + r.balance, 0);

//             return (
//               <div key={customer} className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-3">
//                 <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <i className="ri-user-3-line text-[#4f46e5] text-sm" />
//                     <span className="text-sm font-semibold text-[#1e293b]">{customer}</span>
//                     <span className="text-xs text-[#64748b]">({rows.length} invoice{rows.length > 1 ? 's' : ''})</span>
//                   </div>
//                   <span className="text-sm font-bold text-red-600">{formatINR(customerTotal)}</span>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-[#e2e8f0]">
//                         {['Invoice No', 'Invoice Date', 'Due Date', 'Invoice Amt', 'Paid', 'Balance', 'Aging', 'Status'].map((h, i) => (
//                           <th key={i} className={`text-left px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide whitespace-nowrap ${i >= 3 ? 'text-right' : ''}`}>{h}</th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {rows.map((row) => {
//                         const meta = AGING_META[row.agingBucket as AgingBucket];
//                         return (
//                           <tr key={row.id} className={`border-b border-[#f1f5f9] transition-colors ${meta.rowCls}`}>
//                             <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">{row.invoiceNo}</td>
//                             <td className="px-3 py-2.5 text-xs text-[#64748b]">{row.invoiceDate}</td>
//                             <td className="px-3 py-2.5 text-xs text-[#64748b]">{row.dueDate}</td>
//                             <td className="px-3 py-2.5 text-right">{formatINR(row.invoiceAmount)}</td>
//                             <td className="px-3 py-2.5 text-right text-green-600">{row.paid > 0 ? formatINR(row.paid) : '—'}</td>
//                             <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">{formatINR(row.balance)}</td>
//                             <td className="px-3 py-2.5 text-right">
//                               <span className="text-xs text-[#64748b]">{row.agingDays} days</span>
//                             </td>
//                             <td className="px-3 py-2.5">
//                               <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.badgeCls}`}>{meta.label}</span>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             );
//           })}

//           <div className="bg-[#fef2f2] border border-red-200 rounded-xl px-6 py-4 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <i className="ri-money-dollar-circle-line text-red-500 text-lg" />
//               <span className="font-semibold text-red-700 text-sm">Total Outstanding as of {asOfDate}</span>
//             </div>
//             <span className="text-xl font-bold text-red-600">{formatINR(totalOutstanding)}</span>
//           </div>
//         </>
//       )}
//       {!generated && (
//         <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
//           <div className="text-center text-[#64748b]">
//             <i className="ri-file-warning-line text-5xl text-slate-200 block mb-3" />
//             <p className="text-sm font-medium">Select date and click Generate to see outstanding invoices</p>
//           </div>
//         </div>
//       )}
//     </ReportLayout>
//   );
// }

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { useWarehouseStore } from '@/stores/warehouseStore';
 
// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────
const getOutstandingApi = async (asOfDate: string, warehouseId: string) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(
    'http://localhost:7000/api/v1/reports/outstanding',
    {
      params: { asOfDate, warehouseId: warehouseId || undefined },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return (res.data?.data ?? []).map((r: any) => ({
    ...r,
    invoiceAmount: Number(r.invoiceAmount || 0),
    paid: Number(r.paid || 0),
    balance: Number(r.balance || 0),
    agingDays: Number(r.agingDays || 0),
  }));
};
 
// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
const useOutstanding = (asOfDate: string, warehouseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['outstanding', asOfDate, warehouseId],
    queryFn: () => getOutstandingApi(asOfDate, warehouseId),
    enabled,
    staleTime: 0,
  });
};

// ─────────────────────────────────────────────────────────────
// TYPES & META
// ─────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

const AGING_META: Record<
  AgingBucket,
  { label: string; rowCls: string; badgeCls: string }
> = {
  '0-30': {
    label: '0–30 days',
    rowCls: 'bg-green-50/40 hover:bg-green-50',
    badgeCls: 'bg-green-100 text-green-700',
  },
  '31-60': {
    label: '31–60 days',
    rowCls: 'bg-amber-50/40 hover:bg-amber-50',
    badgeCls: 'bg-amber-100 text-amber-700',
  },
  '61-90': {
    label: '61–90 days',
    rowCls: 'bg-orange-50/40 hover:bg-orange-50',
    badgeCls: 'bg-orange-100 text-orange-700',
  },
  '90+': {
    label: '90+ days',
    rowCls: 'bg-red-50/40 hover:bg-red-50',
    badgeCls: 'bg-red-100 text-red-700',
  },
};

const exportColumns = [
  { header: 'Customer', key: 'customer', width: 24 },
  { header: 'Invoice No', key: 'invoiceNo', width: 18 },
  { header: 'Invoice Date', key: 'invoiceDate', width: 14 },
  { header: 'Due Date', key: 'dueDate', width: 14 },
  { header: 'Invoice Amount', key: 'invoiceAmount', width: 16 },
  { header: 'Paid', key: 'paid', width: 14 },
  { header: 'Balance', key: 'balance', width: 14 },
  { header: 'Aging Days', key: 'agingDays', width: 12 },
  { header: 'Bucket', key: 'agingBucket', width: 12 },
];

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function OutstandingReport() {
  const today = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(today);
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
 
  const {
    data = [],
    isFetching,
    refetch,
  } = useOutstanding(asOfDate, warehouseId, generated);
 
  const handleGenerate = () => {
    setGenerated(true);
    if (generated) refetch();
  };

  // ── derived totals ─────────────────────────────────────────
  const totalOutstanding = data.reduce((s, r) => s + r.balance, 0);
  const bucket30 = data
    .filter((r) => r.agingBucket === '0-30')
    .reduce((s, r) => s + r.balance, 0);
  const bucket60 = data
    .filter((r) => r.agingBucket === '31-60')
    .reduce((s, r) => s + r.balance, 0);
  const bucketOld = data
    .filter((r) => r.agingBucket === '61-90' || r.agingBucket === '90+')
    .reduce((s, r) => s + r.balance, 0);

  const customers = [...new Set(data.map((r) => r.customer))];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Outstanding as of
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => {
            setAsOfDate(e.target.value);
            setGenerated(false);
          }}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
      <div className="flex gap-2 mt-4">
        {Object.entries(AGING_META).map(([bucket, meta]) => (
          <div
            key={bucket}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${meta.badgeCls}`}
          >
            <span className="font-medium">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Outstanding Invoices"
      subtitle="Unpaid and partially paid invoices grouped by aging period"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={data as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename={`outstanding-${asOfDate}`}
    >
      {/* ── no data ── */}
      {generated && !isFetching && data.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-checkbox-circle-line text-5xl text-green-200 block mb-3" />
            <p className="text-sm font-medium text-green-600">
              No outstanding invoices as of {asOfDate}
            </p>
            <p className="text-xs mt-1">All invoices are fully paid 🎉</p>
          </div>
        </div>
      )}

      {/* ── data ── */}
      {generated && data.length > 0 && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Outstanding',
                value: formatINR(totalOutstanding),
                icon: 'ri-money-rupee-circle-line',
                color: 'bg-red-50 text-red-500',
              },
              {
                label: 'Current (0–30 days)',
                value: formatINR(bucket30),
                icon: 'ri-time-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Overdue (31–60 days)',
                value: formatINR(bucket60),
                icon: 'ri-alarm-warning-line',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Critical (61+ days)',
                value: formatINR(bucketOld),
                icon: 'ri-error-warning-line',
                color: 'bg-red-100 text-red-600',
              },
            ]}
          />

          {customers.map((customer) => {
            const rows = data.filter((r) => r.customer === customer);
            const customerTotal = rows.reduce((s, r) => s + r.balance, 0);

            return (
              <div
                key={customer}
                className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-3"
              >
                {/* customer header */}
                <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-user-3-line text-[#4f46e5] text-sm" />
                    <span className="text-sm font-semibold text-[#1e293b]">
                      {customer}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      ({rows.length} invoice{rows.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatINR(customerTotal)}
                  </span>
                </div>

                {/* invoice rows */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e2e8f0]">
                        {[
                          'Invoice No',
                          'Invoice Date',
                          'Due Date',
                          'Invoice Amt',
                          'Paid',
                          'Balance',
                          'Aging',
                          'Status',
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={`text-left px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide whitespace-nowrap ${i >= 3 ? 'text-right' : ''}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const meta =
                          AGING_META[row.agingBucket as AgingBucket] ??
                          AGING_META['90+'];
                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-[#f1f5f9] transition-colors ${meta.rowCls}`}
                          >
                            <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">
                              {row.invoiceNo}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#64748b]">
                              {row.invoiceDate}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#64748b]">
                              {row.dueDate}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {formatINR(row.invoiceAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-green-600">
                              {row.paid > 0 ? formatINR(row.paid) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">
                              {formatINR(row.balance)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className="text-xs text-[#64748b]">
                                {row.agingDays} days
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.badgeCls}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* grand total footer */}
          <div className="bg-[#fef2f2] border border-red-200 rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="ri-money-dollar-circle-line text-red-500 text-lg" />
              <span className="font-semibold text-red-700 text-sm">
                Total Outstanding as of {asOfDate}
              </span>
            </div>
            <span className="text-xl font-bold text-red-600">
              {formatINR(totalOutstanding)}
            </span>
          </div>
        </>
      )}

      {/* ── not generated ── */}
      {!generated && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-file-warning-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select date and click Generate to see outstanding invoices
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
