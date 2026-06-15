// import { useState } from 'react';
// import ReportLayout from '@/pages/reports/components/ReportLayout';
// import SummaryCards from '@/pages/reports/components/SummaryCards';
// import { useDayBook } from '@/hooks/useReports';

// function formatINR(n: number) {
//   return n > 0 ? `₹${n.toLocaleString('en-IN')}` : '—';
// }

// type DayGroup = 'Sales' | 'Purchase' | 'Purchase Return' | 'Sale Return' | 'Adjustment' | 'Transfer';

// const GROUP_META: Record<DayGroup, { icon: string; color: string; headerCls: string }> = {
//   'Sales': { icon: 'ri-shopping-cart-2-line', color: 'text-green-600', headerCls: 'bg-green-50 border-green-100 text-green-800' },
//   'Purchase': { icon: 'ri-store-2-line', color: 'text-blue-600', headerCls: 'bg-blue-50 border-blue-100 text-blue-800' },
//   'Purchase Return': { icon: 'ri-arrow-go-forward-line', color: 'text-orange-600', headerCls: 'bg-orange-50 border-orange-100 text-orange-800' },
//   'Sale Return': { icon: 'ri-arrow-go-back-line', color: 'text-violet-600', headerCls: 'bg-violet-50 border-violet-100 text-violet-800' },
//   'Adjustment': { icon: 'ri-equalizer-line', color: 'text-amber-600', headerCls: 'bg-amber-50 border-amber-100 text-amber-800' },
//   'Transfer': { icon: 'ri-swap-box-line', color: 'text-teal-600', headerCls: 'bg-teal-50 border-teal-100 text-teal-800' },
// };

// export default function DayBookReport() {
//   const today = new Date().toISOString().split('T')[0];
//   const [date, setDate] = useState(today);
//   const [generated, setGenerated] = useState(false);
//   const { data = [], isFetching, refetch } = useDayBook(date, generated);

//   const handleGenerate = () => {
//     setGenerated(true);
//     if (generated) refetch();
//   };

//   const groups = [...new Set(data.map((r) => r.group))] as DayGroup[];
//   const totalDebit = data.reduce((s, r) => s + r.debit, 0);
//   const totalCredit = data.reduce((s, r) => s + r.credit, 0);
//   const totalSales = data.filter((r) => r.group === 'Sales').reduce((s, r) => s + r.credit, 0);
//   const totalPurchase = data.filter((r) => r.group === 'Purchase').reduce((s, r) => s + r.debit, 0);

//   const exportColumns = [
//     { header: 'Time', key: 'time', width: 10 },
//     { header: 'Voucher Type', key: 'voucherType', width: 18 },
//     { header: 'Voucher No', key: 'voucherNo', width: 18 },
//     { header: 'Party', key: 'party', width: 22 },
//     { header: 'Narration', key: 'narration', width: 28 },
//     { header: 'Debit', key: 'debit', width: 14 },
//     { header: 'Credit', key: 'credit', width: 14 },
//   ];

//   const filterBar = (
//     <div className="flex flex-wrap items-end gap-3">
//       <div>
//         <label className="block text-xs font-medium text-[#64748b] mb-1">Date</label>
//         <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
//           className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]" />
//       </div>
//       <div className="text-xs text-[#64748b] mt-4 flex items-center gap-1">
//         <i className="ri-information-line" />
//         Shows all transactions (sales, purchases, returns, adjustments, transfers) on the selected date
//       </div>
//     </div>
//   );

//   return (
//     <ReportLayout
//       title="Day Book"
//       subtitle={generated ? `All transactions on ${date}` : 'Select date to view all transactions'}
//       filterBar={filterBar}
//       onGenerate={handleGenerate}
//       generating={isFetching}
//       generated={generated}
//       exportData={data as unknown as Record<string, unknown>[]}
//       exportColumns={exportColumns}
//       exportFilename={`day-book-${date}`}
//     >
//       {generated && (
//         <>
//           <SummaryCards cards={[
//             { label: 'Total Transactions', value: data.length, icon: 'ri-file-list-3-line', color: 'bg-indigo-50 text-[#4f46e5]' },
//             { label: 'Total Sales', value: formatINR(totalSales), icon: 'ri-shopping-cart-2-line', color: 'bg-green-50 text-green-600' },
//             { label: 'Total Purchases', value: formatINR(totalPurchase), icon: 'ri-store-2-line', color: 'bg-blue-50 text-blue-600' },
//             { label: 'Net (Credit - Debit)', value: formatINR(totalCredit - totalDebit), icon: 'ri-scales-line', color: (totalCredit - totalDebit) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500' },
//           ]} />

//           {groups.map((group) => {
//             const groupData = data.filter((r) => r.group === group);
//             const meta = GROUP_META[group] ?? { icon: 'ri-file-line', color: 'text-slate-600', headerCls: 'bg-slate-50 border-slate-200 text-slate-700' };
//             const groupDebit = groupData.reduce((s, r) => s + r.debit, 0);
//             const groupCredit = groupData.reduce((s, r) => s + r.credit, 0);

//             return (
//               <div key={group} className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-3">
//                 <div className={`px-4 py-2.5 border-b flex items-center justify-between ${meta.headerCls}`}>
//                   <div className="flex items-center gap-2">
//                     <i className={`${meta.icon} text-sm ${meta.color}`} />
//                     <span className="text-sm font-semibold">{group}</span>
//                     <span className="text-xs opacity-70">({groupData.length} transaction{groupData.length !== 1 ? 's' : ''})</span>
//                   </div>
//                   <div className="flex items-center gap-4 text-xs font-medium">
//                     {groupDebit > 0 && <span>Debit: {formatINR(groupDebit)}</span>}
//                     {groupCredit > 0 && <span>Credit: {formatINR(groupCredit)}</span>}
//                   </div>
//                 </div>
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="border-b border-[#f1f5f9]">
//                       {['Time', 'Voucher Type', 'Voucher No', 'Party', 'Narration', 'Debit', 'Credit'].map((h, i) => (
//                         <th key={i} className={`text-left px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide whitespace-nowrap ${i >= 5 ? 'text-right' : ''}`}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {groupData.map((row, ri) => (
//                       <tr key={row.id} className={`border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors ${ri % 2 === 0 ? '' : 'bg-[#fafbff]'}`}>
//                         <td className="px-3 py-2.5 text-xs text-[#64748b] tabular-nums">{row.time}</td>
//                         <td className="px-3 py-2.5 text-xs">{row.voucherType}</td>
//                         <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">{row.voucherNo}</td>
//                         <td className="px-3 py-2.5 text-sm font-medium text-[#1e293b]">{row.party}</td>
//                         <td className="px-3 py-2.5 text-xs text-[#64748b]">{row.narration}</td>
//                         <td className="px-3 py-2.5 text-right text-red-500">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
//                         <td className="px-3 py-2.5 text-right text-green-600">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             );
//           })}

//           <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-6 py-3 flex justify-end gap-8 text-sm font-medium">
//             <div className="text-[#64748b]">Total Debit: <strong className="text-red-500">{formatINR(totalDebit)}</strong></div>
//             <div className="text-[#64748b]">Total Credit: <strong className="text-green-600">{formatINR(totalCredit)}</strong></div>
//             <div className="text-[#64748b]">Net: <strong className={totalCredit - totalDebit >= 0 ? 'text-green-600' : 'text-red-500'}>{formatINR(Math.abs(totalCredit - totalDebit))}</strong></div>
//           </div>
//         </>
//       )}
//       {!generated && (
//         <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
//           <div className="text-center text-[#64748b]">
//             <i className="ri-calendar-check-line text-5xl text-slate-200 block mb-3" />
//             <p className="text-sm font-medium">Select a date to view all transactions for that day</p>
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
const getDayBookApi = async (date: string, warehouseId: string) => {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:7000/api/v1/reports/day-book', {
    params: { date, warehouseId: warehouseId || undefined },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (res.data?.data ?? []).map((r: any) => ({
    ...r,
    debit: Number(r.debit || 0),
    credit: Number(r.credit || 0),
  }));
};

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
const useDayBook = (date: string, warehouseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['day-book', date, warehouseId],
    queryFn: () => getDayBookApi(date, warehouseId),
    enabled,
    staleTime: 0,
  });
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return n > 0 ? `₹${n.toLocaleString('en-IN')}` : '—';
}

type DayGroup =
  | 'Sales'
  | 'Purchase'
  | 'Purchase Return'
  | 'Sale Return'
  | 'Adjustment'
  | 'Transfer';

const GROUP_META: Record<
  DayGroup,
  { icon: string; color: string; headerCls: string }
> = {
  Sales: {
    icon: 'ri-shopping-cart-2-line',
    color: 'text-green-600',
    headerCls: 'bg-green-50 border-green-100 text-green-800',
  },
  Purchase: {
    icon: 'ri-store-2-line',
    color: 'text-blue-600',
    headerCls: 'bg-blue-50 border-blue-100 text-blue-800',
  },
  'Purchase Return': {
    icon: 'ri-arrow-go-forward-line',
    color: 'text-orange-600',
    headerCls: 'bg-orange-50 border-orange-100 text-orange-800',
  },
  'Sale Return': {
    icon: 'ri-arrow-go-back-line',
    color: 'text-violet-600',
    headerCls: 'bg-violet-50 border-violet-100 text-violet-800',
  },
  Adjustment: {
    icon: 'ri-equalizer-line',
    color: 'text-amber-600',
    headerCls: 'bg-amber-50 border-amber-100 text-amber-800',
  },
  Transfer: {
    icon: 'ri-swap-box-line',
    color: 'text-teal-600',
    headerCls: 'bg-teal-50 border-teal-100 text-teal-800',
  },
};

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function DayBookReport() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId =
    selectedWarehouseId && selectedWarehouseId !== 'ALL'
      ? selectedWarehouseId
      : '';
  const [generated, setGenerated] = useState(false);

  const {
    data = [],
    isFetching,
    refetch,
  } = useDayBook(date, warehouseId, generated);

  const handleGenerate = () => {
    setGenerated(true);
    if (generated) refetch();
  };

  const groups = [...new Set(data.map((r) => r.group))] as DayGroup[];
  const totalDebit = data.reduce((s, r) => s + r.debit, 0);
  const totalCredit = data.reduce((s, r) => s + r.credit, 0);
  const totalSales = data
    .filter((r) => r.group === 'Sales')
    .reduce((s, r) => s + r.credit, 0);
  const totalPurchase = data
    .filter((r) => r.group === 'Purchase')
    .reduce((s, r) => s + r.debit, 0);

  const exportColumns = [
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Voucher Type', key: 'voucherType', width: 18 },
    { header: 'Voucher No', key: 'voucherNo', width: 18 },
    { header: 'Party', key: 'party', width: 22 },
    { header: 'Narration', key: 'narration', width: 28 },
    { header: 'Debit', key: 'debit', width: 14 },
    { header: 'Credit', key: 'credit', width: 14 },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setGenerated(false);
          }}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
      <div className="text-xs text-[#64748b] mt-4 flex items-center gap-1">
        <i className="ri-information-line" />
        Shows all transactions (sales, purchases, returns, adjustments,
        transfers) on the selected date
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Day Book"
      subtitle={
        generated
          ? `All transactions on ${date}`
          : 'Select date to view all transactions'
      }
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={data as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename={`day-book-${date}`}
    >
      {generated && !isFetching && data.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-16">
          <div className="text-center text-[#64748b]">
            <i className="ri-calendar-check-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              No transactions found for {date}
            </p>
          </div>
        </div>
      )}

      {generated && data.length > 0 && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Transactions',
                value: data.length,
                icon: 'ri-file-list-3-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
              {
                label: 'Total Sales',
                value: formatINR(totalSales),
                icon: 'ri-shopping-cart-2-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Total Purchases',
                value: formatINR(totalPurchase),
                icon: 'ri-store-2-line',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Net (Credit - Debit)',
                value: formatINR(totalCredit - totalDebit),
                icon: 'ri-scales-line',
                color:
                  totalCredit - totalDebit >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-500',
              },
            ]}
          />

          {groups.map((group) => {
            const groupData = data.filter((r) => r.group === group);
            const meta = GROUP_META[group] ?? {
              icon: 'ri-file-line',
              color: 'text-slate-600',
              headerCls: 'bg-slate-50 border-slate-200 text-slate-700',
            };
            const groupDebit = groupData.reduce((s, r) => s + r.debit, 0);
            const groupCredit = groupData.reduce((s, r) => s + r.credit, 0);

            return (
              <div
                key={group}
                className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-3"
              >
                {/* group header */}
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between ${meta.headerCls}`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`${meta.icon} text-sm ${meta.color}`} />
                    <span className="text-sm font-semibold">{group}</span>
                    <span className="text-xs opacity-70">
                      ({groupData.length} transaction
                      {groupData.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    {groupDebit > 0 && (
                      <span>Debit: {formatINR(groupDebit)}</span>
                    )}
                    {groupCredit > 0 && (
                      <span>Credit: {formatINR(groupCredit)}</span>
                    )}
                  </div>
                </div>

                {/* group table */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f1f5f9]">
                      {[
                        'Time',
                        'Voucher Type',
                        'Voucher No',
                        'Party',
                        'Narration',
                        'Debit',
                        'Credit',
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`text-left px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wide whitespace-nowrap ${i >= 5 ? 'text-right' : ''}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupData.map((row, ri) => (
                      <tr
                        key={row.id}
                        className={`border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-colors ${ri % 2 === 0 ? '' : 'bg-[#fafbff]'}`}
                      >
                        <td className="px-3 py-2.5 text-xs text-[#64748b] tabular-nums">
                          {row.time}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {row.voucherType}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">
                          {row.voucherNo}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#1e293b]">
                          {row.party}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#64748b]">
                          {row.narration}
                        </td>
                        <td className="px-3 py-2.5 text-right text-red-500">
                          {row.debit > 0 ? formatINR(row.debit) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right text-green-600">
                          {row.credit > 0 ? formatINR(row.credit) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* footer totals */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-6 py-3 flex justify-end gap-8 text-sm font-medium">
            <div className="text-[#64748b]">
              Total Debit:{' '}
              <strong className="text-red-500">{formatINR(totalDebit)}</strong>
            </div>
            <div className="text-[#64748b]">
              Total Credit:{' '}
              <strong className="text-green-600">
                {formatINR(totalCredit)}
              </strong>
            </div>
            <div className="text-[#64748b]">
              Net:{' '}
              <strong
                className={
                  totalCredit - totalDebit >= 0
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {formatINR(Math.abs(totalCredit - totalDebit))}
              </strong>
            </div>
          </div>
        </>
      )}

      {!generated && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-calendar-check-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select a date to view all transactions for that day
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
