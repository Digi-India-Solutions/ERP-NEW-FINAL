// import { useState, useEffect, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { salesService } from '@/services/salesService';
// import { formatINR } from '@/utils/format';
// import AppLayout from '@/components/feature/AppLayout';
// import { purchaseService } from '@/services/purchaseService';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface DueInvoice {
//     id: string;
//     invoiceNo: string;
//     date: string;
//     customerId: string;
//     customerName: string;
//     invoiceAmount: number;
//     balanceDue: number;
//     paymentStatus: 'UNPAID' | 'PARTIAL' | string;
//     invoiceDate?: string;
// }

// type SortKey = 'date' | 'customerName' | 'invoiceAmount' | 'balanceDue';
// type SortOrder = 'asc' | 'desc';

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface PaymentDuesTableProps {
//     /** Override fetched data with pre-loaded rows (optional) */
//     data?: DueInvoice[];
//     /** Called when user clicks "Record Payment" on a row */
//     onPayNow?: (invoice: DueInvoice) => void;
//     /** If false the component fetches its own data; ignored when `data` is passed */
//     autoFetch?: boolean;
//     /** Show only invoices for this customer ID */
//     filterCustomerId?: string;
//     /** Compact mode — hide summary cards and reduce padding */
//     compact?: boolean;
//     className?: string;
// }

// // ─── Status badge config ──────────────────────────────────────────────────────

// const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
//     UNPAID: { label: 'Unpaid', className: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
//     PARTIAL: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
//     PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
// };

// function StatusBadge({ status }: { status: string }) {
//     const cfg = STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.UNPAID;
//     return (
//         <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
//             <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
//             {cfg.label}
//         </span>
//     );
// }

// // ─── Due urgency indicator ────────────────────────────────────────────────────

// function DueUrgency({ invoiceDate }: { invoiceDate?: string }) {
//     if (!invoiceDate) return null;
//     const daysDiff = Math.floor((Date.now() - new Date(invoiceDate).getTime()) / 86_400_000);
//     if (daysDiff < 30) return null;
//     if (daysDiff < 60) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">{daysDiff}d overdue</span>;
//     return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">{daysDiff}d overdue</span>;
// }

// // ─── Skeleton row ─────────────────────────────────────────────────────────────

// function SkeletonRow() {
//     return (
//         <tr className="border-b border-slate-50">
//             {[60, 90, 80, 70, 80, 70, 80].map((w, i) => (
//                 <td key={i} className="px-4 py-3.5">
//                     <div className={`h-3.5 rounded bg-slate-100 animate-pulse`} style={{ width: `${w}%` }} />
//                 </td>
//             ))}
//         </tr>
//     );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function PaymentDuesTable({
//     data,
//     onPayNow,
//     autoFetch = true,
//     filterCustomerId,
//     compact = false,
//     className = '',
// }: PaymentDuesTableProps) {
//     const navigate = useNavigate();

//     // ─── Data state ─────────────────────────────────────────────────────────
//     const [rows, setRows] = useState<DueInvoice[]>(data ?? []);
//     const [loading, setLoading] = useState(!data && autoFetch);
//     const [error, setError] = useState<string | null>(null);

//     // ─── Filter / sort state ────────────────────────────────────────────────
//     const [search, setSearch] = useState('');
//     const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL'>('ALL');
//     const [sortKey, setSortKey] = useState<SortKey>('date');
//     const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
//     const [page, setPage] = useState(1);
//     const PAGE_SIZE = 15;

//     // ─── Fetch ───────────────────────────────────────────────────────────────
//     const fetchDues = useCallback(async () => {
//         if (data) return; // controlled mode
//         setLoading(true);
//         setError(null);
//         try {
//             const resp = await purchaseService.listInvoices({ page: 1, limit: 500 });
//             const rawRows = Array.isArray((resp as unknown as { items?: unknown[] }).items)
//                 ? (resp as unknown as { items: unknown[] }).items
//                 : Array.isArray(resp) ? (resp as unknown[]) : [];
// console.log("rawRows==>" ,rawRows)
//             const mapped: DueInvoice[] = rawRows
//                 .map((row) => {
//                     const r = row as {
//                         id: string;
//                         invoiceNo?: string; invoice_no?: string;
//                         date?: string; invoice_date?: string;
//                         customerId?: string; customer_id?: string;
//                         partyName?: string; party_name?: string; customerName?: string; customer_name?: string;
//                         grandTotal?: number; grand_total?: number;
//                         balanceDue?: number; balance_due?: number;
//                         paymentStatus?: string; payment_status?: string;
//                     };
//                     const paymentStatus = (r.paymentStatus ?? r.payment_status ?? 'UNPAID').toUpperCase();
//                     return {
//                         id: r.id,
//                         invoiceNo: r.invoiceNo ?? r.invoice_no ?? '-',
//                         date: r.date ?? r.invoice_date ?? '',
//                         invoiceDate: r.date ?? r.invoice_date ?? '',
//                         customerId: r.customerId ?? r.customer_id ?? '',
//                         customerName: r.partyName ?? r.party_name ?? r.customerName ?? r.customer_name ?? '-',
//                         invoiceAmount: Number(r.grandTotal ?? r.grand_total ?? 0),
//                         balanceDue: Number(r.balanceDue ?? r.balance_due ?? 0),
//                         paymentStatus,
//                     };
//                 })
//                 .filter((r) =>
//                     r.balanceDue > 0 ||
//                     r.paymentStatus === 'UNPAID' ||
//                     r.paymentStatus === 'PARTIAL'
//                 );

//             setRows(mapped);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to load outstanding invoices');
//         } finally {
//             setLoading(false);
//         }
//     }, [data]);

//     useEffect(() => {
//         if (autoFetch && !data) fetchDues();
//     }, [autoFetch, data, fetchDues]);

//     // Sync external data prop
//     useEffect(() => {
//         if (data) setRows(data);
//     }, [data]);

//     // Reset page on filter change
//     useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortOrder]);

//     // ─── Sort handler ────────────────────────────────────────────────────────
//     const handleSort = useCallback((key: SortKey) => {
//         setSortKey((prev) => {
//             if (prev === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
//             else { setSortOrder('desc'); }
//             return key;
//         });
//     }, []);

//     // ─── Filtered + sorted + paginated rows ──────────────────────────────────
//     const filtered = useMemo(() => {
//         const q = search.toLowerCase();
//         return rows
//             .filter((r) => {
//                 if (filterCustomerId && r.customerId !== filterCustomerId) return false;
//                 const matchStatus =
//                     statusFilter === 'ALL' ||
//                     r.paymentStatus === statusFilter;
//                 const matchSearch =
//                     !q ||
//                     r.invoiceNo.toLowerCase().includes(q) ||
//                     r.customerName.toLowerCase().includes(q);
//                 return matchStatus && matchSearch;
//             })
//             .sort((a, b) => {
//                 let cmp = 0;
//                 if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
//                 if (sortKey === 'customerName') cmp = a.customerName.localeCompare(b.customerName);
//                 if (sortKey === 'invoiceAmount') cmp = a.invoiceAmount - b.invoiceAmount;
//                 if (sortKey === 'balanceDue') cmp = a.balanceDue - b.balanceDue;
//                 return sortOrder === 'asc' ? cmp : -cmp;
//             });
//     }, [rows, search, statusFilter, sortKey, sortOrder, filterCustomerId]);

//     const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
//     const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

//     // ─── Summary stats ────────────────────────────────────────────────────────
//     const totalDue = filtered.reduce((s, r) => s + r.balanceDue, 0);
//     const unpaidCount = filtered.filter((r) => r.paymentStatus === 'UNPAID').length;
//     const partialCount = filtered.filter((r) => r.paymentStatus === 'PARTIAL').length;
//     const highestDue = filtered.length ? Math.max(...filtered.map((r) => r.balanceDue)) : 0;

//     // ─── Pay now handler ─────────────────────────────────────────────────────
//     const handlePayNow = useCallback((invoice: DueInvoice) => {
//         if (onPayNow) {
//             onPayNow(invoice);
//             return;
//         }
//         // Default: navigate to payment page with invoice context as location state
//         navigate('/purchase/payments/new', {
//             state: {
//                 invoiceId: invoice.id,
//                 invoiceNumber: invoice.invoiceNo,
//                 customerId: invoice.customerId,
//                 customerName: invoice.customerName,
//                 invoiceAmount: invoice.invoiceAmount,
//                 balanceDue: invoice.balanceDue,
//                 invoiceDate: invoice.invoiceDate ?? invoice.date,
//             },
//         });
//     }, [navigate, onPayNow]);

//     // ─── Sort indicator ───────────────────────────────────────────────────────
//     const SortIcon = ({ col }: { col: SortKey }) => {
//         if (sortKey !== col) return <i className="ri-expand-up-down-line text-slate-300 text-xs ml-1" />;
//         return sortOrder === 'asc'
//             ? <i className="ri-arrow-up-line text-[#4f46e5] text-xs ml-1" />
//             : <i className="ri-arrow-down-line text-[#4f46e5] text-xs ml-1" />;
//     };

//     // ─── Render ───────────────────────────────────────────────────────────────
//     return (
//         <AppLayout>
//             <div className={`space-y-4 ${className}`}>

//                 {/* ── Summary cards (hidden in compact mode) ── */}
//                 {!compact && (
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//                         <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
//                             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 shrink-0">
//                                 <i className="ri-error-warning-line text-base text-red-500" />
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-lg font-bold text-[#1e293b] truncate">{formatINR(totalDue)}</p>
//                                 <p className="text-xs text-slate-500">Total Outstanding</p>
//                             </div>
//                         </div>

//                         <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
//                             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 shrink-0">
//                                 <i className="ri-file-list-3-line text-base text-slate-600" />
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-lg font-bold text-[#1e293b]">{filtered.length}</p>
//                                 <p className="text-xs text-slate-500">Due Invoices</p>
//                             </div>
//                         </div>

//                         <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
//                             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 shrink-0">
//                                 <i className="ri-close-circle-line text-base text-red-600" />
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-lg font-bold text-red-600">{unpaidCount}</p>
//                                 <p className="text-xs text-slate-500">Fully Unpaid</p>
//                             </div>
//                         </div>

//                         <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
//                             <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 shrink-0">
//                                 <i className="ri-time-line text-base text-amber-600" />
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-lg font-bold text-amber-600">{partialCount}</p>
//                                 <p className="text-xs text-slate-500">Partial Payments</p>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* ── Filters ── */}
//                 <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3 flex-wrap">
//                     {/* Search */}
//                     <div className="relative flex-1 min-w-48">
//                         <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
//                         <input
//                             type="text"
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                             placeholder="Search invoice no or customer..."
//                             className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
//                         />
//                     </div>

//                     {/* Status filter */}
//                     <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1 shrink-0">
//                         {(['ALL', 'UNPAID', 'PARTIAL'] as const).map((s) => (
//                             <button
//                                 key={s}
//                                 onClick={() => setStatusFilter(s)}
//                                 className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${statusFilter === s
//                                         ? 'bg-white text-[#1e293b] shadow-sm'
//                                         : 'text-slate-500 hover:text-[#1e293b]'
//                                     }`}
//                             >
//                                 {s === 'ALL' ? 'All' : s === 'UNPAID' ? `Unpaid (${unpaidCount})` : `Partial (${partialCount})`}
//                             </button>
//                         ))}
//                     </div>

//                     {/* Refresh */}
//                     {!data && (
//                         <button
//                             onClick={fetchDues}
//                             disabled={loading}
//                             title="Refresh"
//                             className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
//                         >
//                             <i className={`ri-refresh-line text-sm ${loading ? 'animate-spin' : ''}`} />
//                         </button>
//                     )}

//                     <p className="text-xs text-slate-400 whitespace-nowrap ml-auto">
//                         <span className="font-semibold text-[#1e293b]">{filtered.length}</span> invoices ·{' '}
//                         <span className="font-semibold text-red-600">{formatINR(totalDue)}</span> due
//                     </p>
//                 </div>

//                 {/* ── Error ── */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
//                         <div className="flex items-center gap-2 text-red-700 text-sm">
//                             <i className="ri-error-warning-line" /> {error}
//                         </div>
//                         <button
//                             onClick={fetchDues}
//                             className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap transition-colors"
//                         >
//                             Retry
//                         </button>
//                     </div>
//                 )}

//                 {/* ── Table ── */}
//                 <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
//                     <div className="w-full overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead className="bg-slate-50">
//                                 <tr>
//                                     {/* Invoice No */}
//                                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
//                                         Invoice No
//                                     </th>

//                                     {/* Date — sortable */}
//                                     <th
//                                         className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
//                                         onClick={() => handleSort('date')}
//                                     >
//                                         Date <SortIcon col="date" />
//                                     </th>

//                                     {/* Customer — sortable */}
//                                     <th
//                                         className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
//                                         onClick={() => handleSort('customerName')}
//                                     >
//                                         Customer <SortIcon col="customerName" />
//                                     </th>

//                                     {/* Invoice Amount — sortable */}
//                                     <th
//                                         className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
//                                         onClick={() => handleSort('invoiceAmount')}
//                                     >
//                                         Invoice Amount <SortIcon col="invoiceAmount" />
//                                     </th>

//                                     {/* Balance Due — sortable */}
//                                     <th
//                                         className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
//                                         onClick={() => handleSort('balanceDue')}
//                                     >
//                                         Balance Due <SortIcon col="balanceDue" />
//                                     </th>

//                                     {/* Status */}
//                                     <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
//                                         Status
//                                     </th>

//                                     {/* Action */}
//                                     <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
//                                         Action
//                                     </th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 {/* Loading skeletons */}
//                                 {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

//                                 {/* Rows */}
//                                 {!loading && paginated.map((inv, idx) => {
//                                     const isHighest = inv.balanceDue === highestDue && highestDue > 0;
//                                     return (
//                                         <tr
//                                             key={inv.id}
//                                             className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/20 ${idx % 2 === 1 ? 'bg-[#f8fafc]' : ''
//                                                 } ${isHighest ? 'ring-1 ring-inset ring-red-100' : ''}`}
//                                         >
//                                             {/* Invoice No */}
//                                             <td className="px-4 py-3.5 whitespace-nowrap">
//                                                 <span className="font-semibold text-[#4f46e5]">{inv.invoiceNo}</span>
//                                             </td>

//                                             {/* Date */}
//                                             <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
//                                                 {inv.date
//                                                     ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//                                                     : '—'}
//                                             </td>

//                                             {/* Customer */}
//                                             <td className="px-4 py-3.5">
//                                                 <p className="font-medium text-[#1e293b] whitespace-nowrap">{inv.customerName}</p>
//                                             </td>

//                                             {/* Invoice Amount */}
//                                             <td className="px-4 py-3.5 text-right text-slate-700 font-medium whitespace-nowrap">
//                                                 {formatINR(inv.invoiceAmount)}
//                                             </td>

//                                             {/* Balance Due */}
//                                             <td className="px-4 py-3.5 text-right whitespace-nowrap">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     <DueUrgency invoiceDate={inv.invoiceDate} />
//                                                     <span className={`font-bold ${inv.balanceDue === highestDue && highestDue > 0 ? 'text-red-600' : 'text-red-500'}`}>
//                                                         {formatINR(inv.balanceDue)}
//                                                     </span>
//                                                 </div>
//                                             </td>

//                                             {/* Status */}
//                                             <td className="px-4 py-3.5 whitespace-nowrap">
//                                                 <StatusBadge status={inv.paymentStatus} />
//                                             </td>

//                                             {/* Action */}
//                                             <td className="px-4 py-3.5 text-right whitespace-nowrap">
//                                                 <button
//                                                     onClick={() => handlePayNow(inv)}
//                                                     className="h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ml-auto"
//                                                 >
//                                                     <i className="ri-money-rupee-circle-line text-xs" />
//                                                     Pay Now
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}

//                                 {/* Empty state */}
//                                 {!loading && !error && filtered.length === 0 && (
//                                     <tr>
//                                         <td colSpan={7} className="px-4 py-14 text-center">
//                                             <div className="flex flex-col items-center gap-2 text-slate-400">
//                                                 <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100">
//                                                     <i className="ri-checkbox-circle-line text-2xl text-slate-300" />
//                                                 </div>
//                                                 <p className="text-sm font-semibold text-slate-500">
//                                                     {search || statusFilter !== 'ALL'
//                                                         ? 'No invoices match your filters'
//                                                         : 'All caught up! No outstanding dues'}
//                                                 </p>
//                                                 {(search || statusFilter !== 'ALL') && (
//                                                     <button
//                                                         onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
//                                                         className="text-xs text-[#4f46e5] hover:underline cursor-pointer"
//                                                     >
//                                                         Clear filters
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* ── Footer: pagination + totals ── */}
//                     {!loading && filtered.length > 0 && (
//                         <div className="px-4 py-3 border-t border-[#e2e8f0] flex items-center justify-between gap-4 flex-wrap">
//                             {/* Totals */}
//                             <p className="text-xs text-slate-500">
//                                 Total outstanding:{' '}
//                                 <span className="font-bold text-red-600">{formatINR(totalDue)}</span>
//                                 <span className="text-slate-300 mx-2">·</span>
//                                 Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
//                             </p>

//                             {/* Pagination */}
//                             {totalPages > 1 && (
//                                 <div className="flex items-center gap-1">
//                                     <button
//                                         onClick={() => setPage((p) => Math.max(1, p - 1))}
//                                         disabled={page === 1}
//                                         className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
//                                     >
//                                         <i className="ri-arrow-left-s-line text-sm" />
//                                     </button>

//                                     {Array.from({ length: totalPages }, (_, i) => i + 1)
//                                         .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
//                                         .reduce<(number | '...')[]>((acc, p, idx, arr) => {
//                                             if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
//                                                 acc.push('...');
//                                             }
//                                             acc.push(p);
//                                             return acc;
//                                         }, [])
//                                         .map((p, i) =>
//                                             p === '...'
//                                                 ? <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
//                                                 : <button
//                                                     key={p}
//                                                     onClick={() => setPage(p as number)}
//                                                     className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors ${page === p
//                                                             ? 'bg-[#4f46e5] text-white'
//                                                             : 'border border-[#e2e8f0] text-slate-600 hover:bg-slate-50'
//                                                         }`}
//                                                 >
//                                                     {p}
//                                                 </button>
//                                         )}

//                                     <button
//                                         onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                                         disabled={page === totalPages}
//                                         className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
//                                     >
//                                         <i className="ri-arrow-right-s-line text-sm" />
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </AppLayout>
//     );
// }

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '@/services/purchaseService';
import { formatINR } from '@/utils/format';
import AppLayout from '@/components/feature/AppLayout';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DueInvoice {
    id: string;
    invoiceNo: string;    // maps from invoiceNumber
    invoiceDate: string;    // maps from invoiceDate (ISO string)
    supplierId: string;    // maps from supplierId
    supplierName: string;    // maps from supplierName
    invoiceAmount: number;    // maps from totalAmount
    paidAmount: number;    // maps from paidAmount
    balanceDue: number;    // maps from balanceDue
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | string;
    warehouseName?: string;
    grnNumber?: string;
}

type SortKey = 'invoiceDate' | 'supplierName' | 'invoiceAmount' | 'balanceDue';
type SortOrder = 'asc' | 'desc';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentDuesTableProps {
    /** Pre-loaded rows — skips internal fetch when provided */
    data?: DueInvoice[];
    /** Called when user clicks "Pay Now"; defaults to navigate to payment page */
    onPayNow?: (invoice: DueInvoice) => void;
    /** Set false to disable auto-fetch (only relevant when data is not provided) */
    autoFetch?: boolean;
    /** Filter to a single supplier */
    filterSupplierId?: string;
    /** Hide summary cards and reduce visual weight */
    compact?: boolean;
    className?: string;
}

// ─── Raw API shape (from purchaseService.listInvoices) ────────────────────────

interface RawPurchaseInvoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentStatus: string;
    warehouseName?: string;
    grnNumber?: string | null;
    // snake_case fallbacks (some endpoints return both)
    invoice_number?: string;
    invoice_date?: string;
    supplier_id?: string;
    supplier_name?: string;
    total_amount?: number;
    paid_amount?: number;
    balance_due?: number;
    payment_status?: string;
    warehouse_name?: string;
    grn_number?: string | null;
}

function mapRawToDueInvoice(r: RawPurchaseInvoice): DueInvoice {
    return {
        id: r.id,
        invoiceNo: r.invoiceNumber ?? r.invoice_number ?? '-',
        invoiceDate: r.invoiceDate ?? r.invoice_date ?? '',
        supplierId: r.supplierId ?? r.supplier_id ?? '',
        supplierName: r.supplierName ?? r.supplier_name ?? '-',
        invoiceAmount: Number(r.totalAmount ?? r.total_amount ?? 0),
        paidAmount: Number(r.paidAmount ?? r.paid_amount ?? 0),
        balanceDue: Number(r.balanceDue ?? r.balance_due ?? 0),
        paymentStatus: (r.paymentStatus ?? r.payment_status ?? 'UNPAID').toUpperCase(),
        warehouseName: r.warehouseName ?? r.warehouse_name ?? undefined,
        grnNumber: r.grnNumber ?? r.grn_number ?? undefined,
    };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
    UNPAID: { label: 'Unpaid', className: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
    PARTIAL: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.UNPAID;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function DueUrgency({ invoiceDate }: { invoiceDate?: string }) {
    if (!invoiceDate) return null;
    const daysDiff = Math.floor((Date.now() - new Date(invoiceDate).getTime()) / 86_400_000);
    if (daysDiff < 30) return null;
    if (daysDiff < 60) return (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {daysDiff}d overdue
        </span>
    );
    return (
        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {daysDiff}d overdue
        </span>
    );
}

function SkeletonRow() {
    return (
        <tr className="border-b border-slate-50">
            {[55, 85, 75, 65, 75, 65, 80].map((w, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${w}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentDuesTable({
    data,
    onPayNow,
    autoFetch = true,
    filterSupplierId,
    compact = false,
    className = '',
}: PaymentDuesTableProps) {
    const navigate = useNavigate();
    const { selectedWarehouseId } = useWarehouseStore();

    // ─── Data state ─────────────────────────────────────────────────────────
    const [rows, setRows] = useState<DueInvoice[]>(data ?? []);
    const [loading, setLoading] = useState(!data && autoFetch);
    const [error, setError] = useState<string | null>(null);

    // ─── Filter / sort / page state ──────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL'>('ALL');
    const [sortKey, setSortKey] = useState<SortKey>('invoiceDate');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;

    // ─── Fetch ───────────────────────────────────────────────────────────────
    const fetchDues = useCallback(async () => {
        if (data) return;
        setLoading(true);
        setError(null);
        try {
            const params: any = { page: 1, limit: 500 };
            if (selectedWarehouseId && selectedWarehouseId !== 'ALL') {
                params.warehouse_id = selectedWarehouseId;
            }
            const resp = await purchaseService.listInvoices(params);

            // Handle both { items: [...] } and direct array responses
            const rawRows: RawPurchaseInvoice[] = Array.isArray(
                (resp as unknown as { items?: unknown[] }).items
            )
                ? ((resp as unknown as { items: RawPurchaseInvoice[] }).items)
                : Array.isArray(resp)
                    ? (resp as RawPurchaseInvoice[])
                    : [];

            const mapped = rawRows
                .map(mapRawToDueInvoice)
                .filter((r) =>
                    r.paymentStatus === 'UNPAID' ||
                    r.paymentStatus === 'PARTIAL' ||
                    r.balanceDue > 0
                );

            setRows(mapped);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load outstanding invoices');
        } finally {
            setLoading(false);
        }
    }, [data, selectedWarehouseId]);

    useEffect(() => {
        if (autoFetch && !data) fetchDues();
    }, [autoFetch, data, fetchDues]);

    useEffect(() => {
        if (data) setRows(data);
    }, [data]);

    // Reset to page 1 whenever filters change
    useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortOrder]);

    // ─── Sort handler ────────────────────────────────────────────────────────
    const handleSort = useCallback((key: SortKey) => {
        setSortKey((prev) => {
            if (prev === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
            else setSortOrder('desc');
            return key;
        });
    }, []);

    // ─── Derived data ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return rows
            .filter((r) => {
                if (filterSupplierId && r.supplierId !== filterSupplierId) return false;
                const matchStatus =
                    statusFilter === 'ALL' || r.paymentStatus === statusFilter;
                const matchSearch =
                    !q ||
                    r.invoiceNo.toLowerCase().includes(q) ||
                    r.supplierName.toLowerCase().includes(q);
                return matchStatus && matchSearch;
            })
            .sort((a, b) => {
                let cmp = 0;
                if (sortKey === 'invoiceDate') cmp = a.invoiceDate.localeCompare(b.invoiceDate);
                if (sortKey === 'supplierName') cmp = a.supplierName.localeCompare(b.supplierName);
                if (sortKey === 'invoiceAmount') cmp = a.invoiceAmount - b.invoiceAmount;
                if (sortKey === 'balanceDue') cmp = a.balanceDue - b.balanceDue;
                return sortOrder === 'asc' ? cmp : -cmp;
            });
    }, [rows, search, statusFilter, sortKey, sortOrder, filterSupplierId]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    // ─── Summary stats ────────────────────────────────────────────────────────
    const totalDue = filtered.reduce((s, r) => s + r.balanceDue, 0);
    const unpaidCount = filtered.filter((r) => r.paymentStatus === 'UNPAID').length;
    const partialCount = filtered.filter((r) => r.paymentStatus === 'PARTIAL').length;
    const highestDue = filtered.length ? Math.max(...filtered.map((r) => r.balanceDue)) : 0;

    // ─── Pay now ──────────────────────────────────────────────────────────────
    const handlePayNow = useCallback((invoice: DueInvoice) => {
        if (onPayNow) { onPayNow(invoice); return; }
        // Navigate to purchase payment page with correct LocationState shape
        navigate('/purchase/payments/new', {
            state: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNo,
                supplierId: invoice.supplierId,
                supplierName: invoice.supplierName,
                invoiceAmount: invoice.invoiceAmount,
                balanceDue: invoice.balanceDue,
                invoiceDate: invoice.invoiceDate,
            },
        });
    }, [navigate, onPayNow]);

    // ─── Sort icon ────────────────────────────────────────────────────────────
    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <i className="ri-expand-up-down-line text-slate-300 text-xs ml-1" />;
        return sortOrder === 'asc'
            ? <i className="ri-arrow-up-line text-[#4f46e5] text-xs ml-1" />
            : <i className="ri-arrow-down-line text-[#4f46e5] text-xs ml-1" />;
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            <div className={`space-y-4 ${className}`}>

                {/* ── Summary cards ── */}
                {!compact && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 shrink-0">
                                <i className="ri-error-warning-line text-base text-red-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-[#1e293b] truncate">{formatINR(totalDue)}</p>
                                <p className="text-xs text-slate-500">Total Outstanding</p>
                            </div>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 shrink-0">
                                <i className="ri-file-list-3-line text-base text-slate-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-[#1e293b]">{filtered.length}</p>
                                <p className="text-xs text-slate-500">Due Invoices</p>
                            </div>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 shrink-0">
                                <i className="ri-close-circle-line text-base text-red-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-red-600">{unpaidCount}</p>
                                <p className="text-xs text-slate-500">Fully Unpaid</p>
                            </div>
                        </div>

                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 shrink-0">
                                <i className="ri-time-line text-base text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-amber-600">{partialCount}</p>
                                <p className="text-xs text-slate-500">Partial Payments</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search invoice no or supplier..."
                            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1 shrink-0">
                        {(['ALL', 'UNPAID', 'PARTIAL'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${statusFilter === s
                                        ? 'bg-white text-[#1e293b] shadow-sm'
                                        : 'text-slate-500 hover:text-[#1e293b]'
                                    }`}
                            >
                                {s === 'ALL' ? 'All' : s === 'UNPAID' ? `Unpaid (${unpaidCount})` : `Partial (${partialCount})`}
                            </button>
                        ))}
                    </div>

                    {!data && (
                        <button
                            onClick={fetchDues}
                            disabled={loading}
                            title="Refresh"
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                        >
                            <i className={`ri-refresh-line text-sm ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    )}

                    <p className="text-xs text-slate-400 whitespace-nowrap ml-auto">
                        <span className="font-semibold text-[#1e293b]">{filtered.length}</span> invoices ·{' '}
                        <span className="font-semibold text-red-600">{formatINR(totalDue)}</span> due
                    </p>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                            <i className="ri-error-warning-line" /> {error}
                        </div>
                        <button
                            onClick={fetchDues}
                            className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Table ── */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
                                        Invoice No
                                    </th>
                                    <th
                                        onClick={() => handleSort('invoiceDate')}
                                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
                                    >
                                        Date <SortIcon col="invoiceDate" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('supplierName')}
                                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
                                    >
                                        Supplier <SortIcon col="supplierName" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('invoiceAmount')}
                                        className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
                                    >
                                        Invoice Amount <SortIcon col="invoiceAmount" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
                                        Paid
                                    </th>
                                    <th
                                        onClick={() => handleSort('balanceDue')}
                                        className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer hover:text-[#4f46e5] select-none"
                                    >
                                        Balance Due <SortIcon col="balanceDue" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                                {!loading && paginated.map((inv, idx) => {
                                    const isHighest = inv.balanceDue === highestDue && highestDue > 0;
                                    return (
                                        <tr
                                            key={inv.id}
                                            className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/20 ${idx % 2 === 1 ? 'bg-[#f8fafc]' : ''
                                                } ${isHighest ? 'ring-1 ring-inset ring-red-100' : ''}`}
                                        >
                                            {/* Invoice No */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-[#4f46e5]">{inv.invoiceNo}</span>
                                                    {inv.grnNumber && (
                                                        <span className="text-[10px] text-slate-400">GRN: {inv.grnNumber}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                                                {inv.invoiceDate
                                                    ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })
                                                    : '—'}
                                            </td>

                                            {/* Supplier */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-[#1e293b] whitespace-nowrap">{inv.supplierName}</span>
                                                    {inv.warehouseName && (
                                                        <span className="text-[10px] text-slate-400">{inv.warehouseName}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Invoice Amount */}
                                            <td className="px-4 py-3.5 text-right text-slate-700 font-medium whitespace-nowrap">
                                                {formatINR(inv.invoiceAmount)}
                                            </td>

                                            {/* Paid */}
                                            <td className="px-4 py-3.5 text-right text-emerald-600 font-medium whitespace-nowrap">
                                                {formatINR(inv.paidAmount)}
                                            </td>

                                            {/* Balance Due */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <DueUrgency invoiceDate={inv.invoiceDate} />
                                                    <span className={`font-bold ${isHighest ? 'text-red-600' : 'text-red-500'}`}>
                                                        {formatINR(inv.balanceDue)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <StatusBadge status={inv.paymentStatus} />
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => handlePayNow(inv)}
                                                    className="h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ml-auto"
                                                >
                                                    <i className="ri-money-rupee-circle-line text-xs" />
                                                    Pay Now
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Empty state */}
                                {!loading && !error && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100">
                                                    <i className="ri-checkbox-circle-line text-2xl text-slate-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-500">
                                                    {search || statusFilter !== 'ALL'
                                                        ? 'No invoices match your filters'
                                                        : 'All caught up! No outstanding dues'}
                                                </p>
                                                {(search || statusFilter !== 'ALL') && (
                                                    <button
                                                        onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                                                        className="text-xs text-[#4f46e5] hover:underline cursor-pointer"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Footer ── */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-4 py-3 border-t border-[#e2e8f0] flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-xs text-slate-500">
                                Total outstanding:{' '}
                                <span className="font-bold text-red-600">{formatINR(totalDue)}</span>
                                <span className="text-slate-300 mx-2">·</span>
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </p>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        <i className="ri-arrow-left-s-line text-sm" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                            if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                                                acc.push('...');
                                            }
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, i) =>
                                            p === '...'
                                                ? <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                                                : <button
                                                    key={p}
                                                    onClick={() => setPage(p as number)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors ${page === p
                                                            ? 'bg-[#4f46e5] text-white'
                                                            : 'border border-[#e2e8f0] text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                        )}

                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        <i className="ri-arrow-right-s-line text-sm" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}