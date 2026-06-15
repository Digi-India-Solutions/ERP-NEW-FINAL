// import { useState } from 'react';
// import ReportLayout from '@/pages/reports/components/ReportLayout';
// import ReportTable from '@/pages/reports/components/ReportTable';
// import SummaryCards from '@/pages/reports/components/SummaryCards';
// import { usePartyLedger } from '@/hooks/useReports';
// import { mockParties } from '@/mocks/masters';

// function formatINR(n: number) {
//   return `₹${Math.abs(n).toLocaleString('en-IN')}`;
// }

// function getFirstDayOfMonth() {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
// }

// const VOUCHER_COLORS: Record<string, string> = {
//   'Opening Balance': 'bg-slate-100 text-slate-600',
//   'Sales': 'bg-green-100 text-green-700',
//   'Purchase': 'bg-blue-100 text-blue-700',
//   'Payment': 'bg-teal-100 text-teal-700',
//   'Receipt': 'bg-emerald-100 text-emerald-700',
//   'Sales Return': 'bg-violet-100 text-violet-700',
//   'Purchase Return': 'bg-orange-100 text-orange-700',
// };

// export default function PartyLedgerReport() {
//   const today = new Date().toISOString().split('T')[0];
//   const [partyId, setPartyId] = useState('');
//   const [from, setFrom] = useState(getFirstDayOfMonth());
//   const [to, setTo] = useState(today);
//   const [generated, setGenerated] = useState(false);

//   const canGenerate = !!partyId;
//   const { data = [], isFetching, refetch } = usePartyLedger(partyId, from, to, generated && canGenerate);

//   const handleGenerate = () => {
//     if (!canGenerate) return;
//     setGenerated(true);
//     if (generated) refetch();
//   };

//   const selectedParty = mockParties.find((p) => p.id === partyId);
//   const openingBalance = data.length > 0 ? data[0].balance : 0;
//   const closingBalance = data.length > 0 ? data[data.length - 1].balance : 0;
//   const totalDebit = data.reduce((s, r) => s + r.debit, 0);
//   const totalCredit = data.reduce((s, r) => s + r.credit, 0);

//   const exportColumns = [
//     { header: 'Date', key: 'date', width: 12 },
//     { header: 'Voucher Type', key: 'voucherType', width: 18 },
//     { header: 'Voucher No', key: 'voucherNo', width: 18 },
//     { header: 'Narration', key: 'narration', width: 28 },
//     { header: 'Debit', key: 'debit', width: 14 },
//     { header: 'Credit', key: 'credit', width: 14 },
//     { header: 'Balance', key: 'balance', width: 14 },
//   ];

//   const filterBar = (
//     <div className="flex flex-wrap items-end gap-3">
//       <div>
//         <label className="block text-xs font-medium text-[#64748b] mb-1">Party <span className="text-red-500">*</span></label>
//         <select value={partyId} onChange={(e) => setPartyId(e.target.value)}
//           className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5] min-w-[220px]">
//           <option value="">-- Select Party --</option>
//           <optgroup label="Customers">
//             {mockParties.filter((p) => p.type === 'CUSTOMER' || p.type === 'BOTH').map((p) => (
//               <option key={p.id} value={p.id}>{p.name}</option>
//             ))}
//           </optgroup>
//           <optgroup label="Suppliers">
//             {mockParties.filter((p) => p.type === 'SUPPLIER').map((p) => (
//               <option key={p.id} value={p.id}>{p.name}</option>
//             ))}
//           </optgroup>
//         </select>
//       </div>
//       <div>
//         <label className="block text-xs font-medium text-[#64748b] mb-1">From Date</label>
//         <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
//           className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]" />
//       </div>
//       <div>
//         <label className="block text-xs font-medium text-[#64748b] mb-1">To Date</label>
//         <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
//           className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]" />
//       </div>
//     </div>
//   );

//   return (
//     <ReportLayout
//       title="Party Ledger"
//       subtitle={selectedParty ? `${selectedParty.name} · ${selectedParty.type} · GSTIN: ${selectedParty.gstin}` : 'Select a party to view their complete transaction ledger'}
//       filterBar={filterBar}
//       onGenerate={handleGenerate}
//       generating={isFetching}
//       generated={generated && canGenerate}
//       exportData={data as unknown as Record<string, unknown>[]}
//       exportColumns={exportColumns}
//       exportFilename={`party-ledger-${partyId}-${from}-${to}`}
//     >
//       {generated && canGenerate && (
//         <>
//           <SummaryCards cards={[
//             { label: 'Opening Balance', value: `${formatINR(openingBalance)} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`, icon: 'ri-archive-line', color: 'bg-slate-100 text-slate-600' },
//             { label: 'Total Debit', value: formatINR(totalDebit), icon: 'ri-arrow-right-circle-line', color: 'bg-red-50 text-red-500' },
//             { label: 'Total Credit', value: formatINR(totalCredit), icon: 'ri-arrow-left-circle-line', color: 'bg-green-50 text-green-600' },
//             {
//               label: 'Closing Balance',
//               value: `${formatINR(closingBalance)} ${closingBalance >= 0 ? 'Dr' : 'Cr'}`,
//               icon: 'ri-scales-line',
//               color: closingBalance > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600',
//               sub: closingBalance > 0 ? 'Amount receivable' : closingBalance < 0 ? 'Amount payable' : 'Settled',
//             },
//           ]} />

//           {/* Opening balance row */}
//           <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
//             <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
//               <div className="grid grid-cols-7 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
//                 <span>Date</span>
//                 <span>Voucher Type</span>
//                 <span>Voucher No</span>
//                 <span className="col-span-2">Narration</span>
//                 <span className="text-right">Debit</span>
//                 <span className="text-right">Credit</span>
//               </div>
//             </div>

//             {/* Opening balance row */}
//             <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0] grid grid-cols-7 text-sm items-center">
//               <span className="text-xs text-[#64748b]">{from}</span>
//               <span><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Opening Balance</span></span>
//               <span className="font-mono text-xs">—</span>
//               <span className="col-span-2 text-xs text-[#64748b]">Balance brought forward</span>
//               <span className="text-right">{openingBalance > 0 ? <span className="font-semibold text-red-500">{formatINR(openingBalance)}</span> : '—'}</span>
//               <span className="text-right">{openingBalance < 0 ? <span className="font-semibold text-green-600">{formatINR(openingBalance)}</span> : '—'}</span>
//             </div>

//             <table className="w-full text-sm">
//               <tbody>
//                 {data.slice(1).map((row, ri) => {
//                   const badgeCls = VOUCHER_COLORS[row.voucherType] ?? 'bg-slate-100 text-slate-600';
//                   return (
//                     <tr key={row.id} className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${ri % 2 === 0 ? '' : 'bg-[#fafbff]'}`}>
//                       <td className="px-3 py-2.5 text-xs text-[#64748b] w-[10%]">{row.date}</td>
//                       <td className="px-3 py-2.5 w-[14%]">
//                         <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeCls}`}>{row.voucherType}</span>
//                       </td>
//                       <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5] w-[14%]">{row.voucherNo}</td>
//                       <td className="px-3 py-2.5 text-xs text-[#64748b] w-[28%]" colSpan={2}>{row.narration}</td>
//                       <td className="px-3 py-2.5 text-right w-[14%]">
//                         {row.debit > 0 ? <span className="font-medium text-red-500">{formatINR(row.debit)}</span> : <span className="text-[#d1d5db]">—</span>}
//                       </td>
//                       <td className="px-3 py-2.5 text-right w-[14%]">
//                         {row.credit > 0 ? <span className="font-medium text-green-600">{formatINR(row.credit)}</span> : <span className="text-[#d1d5db]">—</span>}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//               <tfoot>
//                 <tr className="bg-[#f1f5f9] border-t-2 border-[#e2e8f0]">
//                   <td colSpan={5} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">CLOSING BALANCE</td>
//                   <td className="px-3 py-2.5 text-right font-bold text-red-500">{formatINR(totalDebit)}</td>
//                   <td className="px-3 py-2.5 text-right font-bold text-green-600">{formatINR(totalCredit)}</td>
//                 </tr>
//                 <tr className="bg-[#fafbff]">
//                   <td colSpan={5} className="px-3 py-2 text-xs text-[#64748b] italic">
//                     Net balance: {closingBalance > 0 ? 'Amount receivable from party' : closingBalance < 0 ? 'Amount payable to party' : 'Account settled'}
//                   </td>
//                   <td colSpan={2} className="px-3 py-2 text-right">
//                     <span className={`text-base font-bold ${closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
//                       {formatINR(closingBalance)} {closingBalance >= 0 ? 'Dr' : 'Cr'}
//                     </span>
//                   </td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </>
//       )}
//       {(!generated || !canGenerate) && (
//         <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
//           <div className="text-center text-[#64748b]">
//             <i className="ri-group-line text-5xl text-slate-200 block mb-3" />
//             <p className="text-sm font-medium">Select a party to view their complete transaction history with running balance</p>
//           </div>
//         </div>
//       )}
//     </ReportLayout>
//   );
// }
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { filterParties } from '@/api/party.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const getPartyLedgerApi = async (
  partyId: string,
  from: string,
  to: string,
  warehouseId: string,
) => {
  const res = await axios.get(
    'http://localhost:7000/api/v1/reports/party-ledger',
    {
      params: { partyId, from, to, warehouseId: warehouseId || undefined },
      headers: authHeaders(),
    },
  );

  const raw = res.data?.data ?? [];
  return {
    party: res.data?.party ?? null,
    data: raw.map((r: any) => ({
      ...r,
      debit: Number(r.debit || 0),
      credit: Number(r.credit || 0),
      balance: Number(r.balance || 0),
    })),
    summary: res.data?.summary ?? {},
  };
};

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
const usePartyLedger = (
  partyId: string,
  from: string,
  to: string,
  warehouseId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['party-ledger', partyId, from, to, warehouseId],
    queryFn: () => getPartyLedgerApi(partyId, from, to, warehouseId),
    enabled,
    staleTime: 0,
  });
};

// ─────────────────────────────────────────────────────────────
// HELPERS & CONSTANTS
// ─────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return `₹${Math.abs(n).toLocaleString('en-IN')}`;
}

function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

const VOUCHER_COLORS: Record<string, string> = {
  'Opening Balance': 'bg-slate-100 text-slate-600',
  Sales: 'bg-green-100 text-green-700',
  Purchase: 'bg-blue-100 text-blue-700',
  Payment: 'bg-teal-100 text-teal-700',
  Receipt: 'bg-emerald-100 text-emerald-700',
  'Sales Return': 'bg-violet-100 text-violet-700',
  'Purchase Return': 'bg-orange-100 text-orange-700',
};

const exportColumns = [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Voucher Type', key: 'voucherType', width: 18 },
  { header: 'Voucher No', key: 'voucherNo', width: 18 },
  { header: 'Narration', key: 'narration', width: 28 },
  { header: 'Debit', key: 'debit', width: 14 },
  { header: 'Credit', key: 'credit', width: 14 },
  { header: 'Balance', key: 'balance', width: 14 },
];

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function PartyLedgerReport() {
  const today = new Date().toISOString().split('T')[0];
  const [partyId, setPartyId] = useState('');
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId =
    selectedWarehouseId && selectedWarehouseId !== 'ALL'
      ? selectedWarehouseId
      : '';
  const [generated, setGenerated] = useState(false);
  const [parties, setParties] = useState<any[]>([]);

  // ── load parties for dropdown ──────────────────────────────
  useEffect(() => {
    filterParties({
      isActive: true,
      warehouse_id: warehouseId || undefined,
    })
      .then((res) => {
        const mapped = (res.data ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          type: (p.type || '').toUpperCase(), // "Customer" → "CUSTOMER"
          gstin: p.gstin ?? '',
        }));
        setParties(mapped);
        setPartyId((prev) => {
          const exists = mapped.some((p: any) => p.id === prev);
          return exists ? prev : '';
        });
      })
      .catch(() => setParties([]));
  }, [warehouseId]);
  const customers = parties.filter(
    (p) => p.type === 'CUSTOMER' || p.type === 'BOTH',
  );
  const suppliers = parties.filter(
    (p) => p.type === 'SUPPLIER' || p.type === 'BOTH',
  );

  const canGenerate = !!partyId;

  const {
    data: result,
    isFetching,
    refetch,
  } = usePartyLedger(partyId, from, to, warehouseId, generated && canGenerate);

  const ledger = result?.data ?? [];
  const partyInfo = result?.party ?? null;
  const summary = result?.summary ?? {};

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerated(true);
    if (generated) refetch();
  };

  // ── derived values ─────────────────────────────────────────
  // first row is opening balance — skip it for debit/credit totals
  const txnRows = ledger.slice(1);
  const openingBal = Number(summary.openingBalance ?? ledger[0]?.balance ?? 0);
  const closingBal = Number(
    summary.closingBalance ?? ledger[ledger.length - 1]?.balance ?? 0,
  );
  const totalDebit = Number(
    summary.totalDebit ?? txnRows.reduce((s: number, r: any) => s + r.debit, 0),
  );
  const totalCredit = Number(
    summary.totalCredit ??
      txnRows.reduce((s: number, r: any) => s + r.credit, 0),
  );

  // subtitle — use live party info from API response
  const subtitle = partyInfo
    ? `${partyInfo.name} · ${partyInfo.type} · GSTIN: ${partyInfo.gstin ?? 'N/A'}`
    : 'Select a party to view their complete transaction ledger';

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Party <span className="text-red-500">*</span>
        </label>
        <select
          value={partyId}
          onChange={(e) => {
            setPartyId(e.target.value);
            setGenerated(false);
          }}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5] min-w-[220px]"
        >
          <option value="">-- Select Party --</option>
          {customers.length > 0 && (
            <optgroup label="Customers">
              {customers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
          {suppliers.length > 0 && (
            <optgroup label="Suppliers">
              {suppliers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          From Date
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setGenerated(false);
          }}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          To Date
        </label>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setGenerated(false);
          }}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Party Ledger"
      subtitle={subtitle}
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated && canGenerate}
      exportData={ledger as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename={`party-ledger-${partyId}-${from}-${to}`}
    >
      {/* ── no data ── */}
      {generated && canGenerate && !isFetching && ledger.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-file-list-3-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              No transactions found for this party in the selected period
            </p>
          </div>
        </div>
      )}

      {/* ── data ── */}
      {generated && canGenerate && ledger.length > 0 && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Opening Balance',
                value: `${formatINR(openingBal)} ${openingBal >= 0 ? 'Dr' : 'Cr'}`,
                icon: 'ri-archive-line',
                color: 'bg-slate-100 text-slate-600',
              },
              {
                label: 'Total Debit',
                value: formatINR(totalDebit),
                icon: 'ri-arrow-right-circle-line',
                color: 'bg-red-50 text-red-500',
              },
              {
                label: 'Total Credit',
                value: formatINR(totalCredit),
                icon: 'ri-arrow-left-circle-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Closing Balance',
                value: `${formatINR(closingBal)} ${closingBal >= 0 ? 'Dr' : 'Cr'}`,
                icon: 'ri-scales-line',
                color:
                  closingBal > 0
                    ? 'bg-red-50 text-red-500'
                    : 'bg-green-50 text-green-600',
                sub:
                  closingBal > 0
                    ? 'Amount receivable'
                    : closingBal < 0
                      ? 'Amount payable'
                      : 'Settled',
              },
            ]}
          />

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {/* column headers */}
            <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
              <div className="grid grid-cols-7 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                <span>Date</span>
                <span>Voucher Type</span>
                <span>Voucher No</span>
                <span className="col-span-2">Narration</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
              </div>
            </div>

            {/* opening balance row */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0] grid grid-cols-7 text-sm items-center">
              <span className="text-xs text-[#64748b]">{from}</span>
              <span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  Opening Balance
                </span>
              </span>
              <span className="font-mono text-xs">—</span>
              <span className="col-span-2 text-xs text-[#64748b]">
                Balance brought forward
              </span>
              <span className="text-right">
                {openingBal > 0 ? (
                  <span className="font-semibold text-red-500">
                    {formatINR(openingBal)}
                  </span>
                ) : (
                  '—'
                )}
              </span>
              <span className="text-right">
                {openingBal < 0 ? (
                  <span className="font-semibold text-green-600">
                    {formatINR(openingBal)}
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>

            {/* transaction rows */}
            <table className="w-full text-sm">
              <tbody>
                {txnRows.map((row: any, ri: number) => {
                  const badgeCls =
                    VOUCHER_COLORS[row.voucherType] ??
                    'bg-slate-100 text-slate-600';
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc] ${ri % 2 === 0 ? '' : 'bg-[#fafbff]'}`}
                    >
                      <td className="px-3 py-2.5 text-xs text-[#64748b] w-[10%]">
                        {row.date}
                      </td>
                      <td className="px-3 py-2.5 w-[14%]">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeCls}`}
                        >
                          {row.voucherType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5] w-[14%]">
                        {row.voucherNo}
                      </td>
                      <td
                        className="px-3 py-2.5 text-xs text-[#64748b] w-[28%]"
                        colSpan={2}
                      >
                        {row.narration}
                      </td>
                      <td className="px-3 py-2.5 text-right w-[14%]">
                        {row.debit > 0 ? (
                          <span className="font-medium text-red-500">
                            {formatINR(row.debit)}
                          </span>
                        ) : (
                          <span className="text-[#d1d5db]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right w-[14%]">
                        {row.credit > 0 ? (
                          <span className="font-medium text-green-600">
                            {formatINR(row.credit)}
                          </span>
                        ) : (
                          <span className="text-[#d1d5db]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f1f5f9] border-t-2 border-[#e2e8f0]">
                  <td
                    colSpan={5}
                    className="px-3 py-2.5 text-xs font-semibold text-[#64748b]"
                  >
                    CLOSING BALANCE
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-red-500">
                    {formatINR(totalDebit)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-green-600">
                    {formatINR(totalCredit)}
                  </td>
                </tr>
                <tr className="bg-[#fafbff]">
                  <td
                    colSpan={5}
                    className="px-3 py-2 text-xs text-[#64748b] italic"
                  >
                    Net balance:{' '}
                    {closingBal > 0
                      ? 'Amount receivable from party'
                      : closingBal < 0
                        ? 'Amount payable to party'
                        : 'Account settled'}
                  </td>
                  <td colSpan={2} className="px-3 py-2 text-right">
                    <span
                      className={`text-base font-bold ${closingBal > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatINR(closingBal)} {closingBal >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* ── not generated ── */}
      {(!generated || !canGenerate) && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-group-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select a party to view their complete transaction history with
              running balance
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
