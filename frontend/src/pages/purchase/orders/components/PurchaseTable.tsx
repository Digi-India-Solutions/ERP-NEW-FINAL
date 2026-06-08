import type { APIPO } from '@/api/purchaseOrderApi';
import { formatINR } from '../utils/POHelpers';
import { MODULES } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const PAGE_SIZE = 50;

const STATUS_CONFIG: Record<string, { style: string; icon: string; label: string }> = {
  PENDING:   { style: 'bg-amber-50 text-amber-700 border-amber-200',   icon: 'ri-time-line',             label: 'Pending'   },
  PARTIAL:   { style: 'bg-sky-50 text-sky-700 border-sky-200',         icon: 'ri-loader-4-line',         label: 'Partial'   },
  COMPLETED: { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'ri-checkbox-circle-line', label: 'Completed' },
  CANCELLED: { style: 'bg-red-50 text-red-700 border-red-200',         icon: 'ri-close-circle-line',     label: 'Cancelled' },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  paginated: APIPO[];
  filtered: APIPO[];
  allPOs: APIPO[];
  page: number;
  totalPages: number;
  todayStr: string;
  setPage: (p: number | ((prev: number) => number)) => void;
  setSelectedPO: (po: APIPO) => void;
  handleReceive: (po: APIPO) => void;
  setPrintPO: (po: APIPO) => void;
  receivingId: string | null;
  printingId: string | null;
  onDelete: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (po: APIPO) => void;
}

// ─── Smart pagination: shows ellipsis for large page counts ──────────────────
function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({
  onClick, title, icon, colorClass, disabled = false, spinning = false,
}: {
  onClick: () => void; title: string; icon: string;
  colorClass: string; disabled?: boolean; spinning?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-slate-400
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer
                  ${colorClass}`}
    >
      <i className={`${spinning ? 'ri-loader-4-line animate-spin' : icon} text-sm`} />
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function PurchaseTable({
  paginated, filtered, allPOs, page, totalPages, todayStr,
  setPage, setSelectedPO, handleReceive, setPrintPO,
  receivingId, printingId, onDelete, onCancel, onEdit,
}: Props) {
  const { hasPermission } = useAuth();
  const canReceiveStock = hasPermission(MODULES.STOCK_RECEIVING, 'create');
  const canEditPO = hasPermission(MODULES.PURCHASE_ORDER, 'edit')
   const canDeletePO = hasPermission(MODULES.PURCHASE_ORDER, 'delete') 
  const [deleteTarget, setDeleteTarget] = useState<APIPO | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [cancelTarget, setCancelTarget] = useState<APIPO | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);


  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmCancel = async () => {
  if (!cancelTarget) return;

  setIsCancelling(true);
  try {
    await onCancel(cancelTarget.id);
    setCancelTarget(null);
  } catch (err) {
    console.error("Cancel failed:", err);
  } finally {
    setIsCancelling(false);
  }
};

  const paginationRange = getPaginationRange(page, totalPages);

  // ── Column headers ────────────────────────────────────────────────────────
  const columns: { label: string; align?: 'left' | 'right' | 'center' }[] = [
    { label: 'PO No' },
    { label: 'Date' },
    { label: 'Supplier' },
    { label: 'Items',        align: 'right' },
    { label: 'Ordered Qty',  align: 'right' },
    { label: 'Received Qty', align: 'right' },
    { label: 'Pending Qty',  align: 'right' },
    { label: 'Amount',       align: 'right' },
    { label: 'Created By' },
    { label: 'Exp. Delivery' },
    { label: 'Status' },
    { label: '' },
  ];

  // console.log("paginated=>" ,paginated)
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <p className="text-sm font-semibold text-slate-800">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== allPOs.length && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              (filtered from {allPOs.length} total)
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <i className="ri-sort-desc text-slate-300" />
          Sorted by date (newest first)
        </p>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map(({ label, align = 'left' }) => (
                <th
                  key={label || 'actions'}
                  className={`px-4 py-2.5 text-${align} text-[10px] font-semibold text-slate-400
                              uppercase tracking-wider whitespace-nowrap`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {paginated.map((po) => {
              const isActive   = po.status === 'PENDING' || po.status === 'PARTIAL';

              const isOverdue  = po.isOverdue ?? (isActive && !!po.expectedDelivery && po.expectedDelivery < todayStr);
              const overdueDays = po.overdueDays ?? (
                isOverdue && po.expectedDelivery
                  ? Math.floor((Date.parse(todayStr) - Date.parse(po.expectedDelivery)) / 86_400_000)
                  : 0
              );

              const totalOrderedQty  = po.totalOrderedQty  ?? 0;
              const totalReceivedQty = po.totalReceivedQty ?? 0;
              const pendingQty       = totalOrderedQty - totalReceivedQty;
              const itemCount        = po.itemCount ?? 0;
              const statusCfg        = STATUS_CONFIG[po.status] ?? { style: 'bg-slate-50 text-slate-500 border-slate-200', icon: 'ri-question-line', label: po.status };
             
              const canDelete = po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && canDeletePO;
              const canReceive = isActive && canReceiveStock;
              const canCancel = isActive && canEditPO;

              return (
                <tr
                  key={po.id}
                  onClick={() => setSelectedPO(po)}
                  className={`cursor-pointer transition-colors group
                    ${isOverdue
                      ? 'bg-red-50/70 border-l-[3px] border-l-red-400 hover:bg-red-50'
                      : 'hover:bg-indigo-50/30'
                    }`}
                >
                  {/* PO Number */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-indigo-600 text-xs tracking-wide">
                      {po.poNumber}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {po.date ? new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>

                  {/* Supplier + Warehouse */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-slate-800 text-xs">{po.supplierName ?? '—'}</p>
                    {po.warehouseName && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                        <i className="ri-store-2-line" />{po.warehouseName}
                      </p>
                    )}
                  </td>

                  {/* Items */}
                  <td className="px-4 py-3 text-right text-xs text-slate-500">{itemCount}</td>

                  {/* Ordered Qty */}
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700">{totalOrderedQty}</td>

                  {/* Received Qty */}
                  <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-600">{totalReceivedQty}</td>

                  {/* Pending Qty */}
                  <td className="px-4 py-3 text-right text-xs">
                    {pendingQty > 0
                      ? <span className="font-semibold text-amber-600">{pendingQty}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {formatINR(po.totalAmount ?? 0)}
                  </td>

                  {/* Created By */}
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {po.createdBy?.name ?? <span className="text-slate-300">—</span>}
                  </td>

                  {/* Expected Delivery */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {po.expectedDelivery ? (
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {new Date(po.expectedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full
                                          bg-red-100 text-red-700 font-semibold w-fit">
                            <i className="ri-alarm-warning-line text-[9px]" />
                            {overdueDays}d overdue
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                     whitespace-nowrap inline-flex items-center gap-1
                                     ${statusCfg.style}`}>
                      <i className={statusCfg.icon} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div
                      className="flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionBtn
                        onClick={() => setSelectedPO(po)}
                        title="View details"
                        icon="ri-eye-line"
                        colorClass="hover:text-indigo-600 hover:bg-indigo-50"
                      />

                      {canReceive && (
                        <ActionBtn
                          onClick={() => handleReceive(po)}
                          title="Receive stock"
                          icon="ri-inbox-archive-line"
                          colorClass="hover:text-emerald-600 hover:bg-emerald-50"
                          disabled={receivingId === po.id}
                          spinning={receivingId === po.id}
                        />
                      )}

                      <ActionBtn
                        onClick={() => setPrintPO(po)}
                        title="Print PO"
                        icon="ri-printer-line"
                        colorClass="hover:text-indigo-600 hover:bg-indigo-50"
                        disabled={printingId === po.id}
                        spinning={printingId === po.id}
                      />

                      {canEditPO && (
                        <ActionBtn
                          onClick={() => onEdit(po)}
                          title="Edit PO"
                          icon="ri-edit-line"
                          colorClass="hover:text-blue-600 hover:bg-blue-50"
                        />
                      )}

                      {canCancel && (
                        <ActionBtn
                          onClick={() => setCancelTarget(po)}
                          title="Cancel PO"
                          icon="ri-close-circle-line"
                          colorClass="hover:text-orange-600 hover:bg-orange-50"
                        />
                      )}


                      {canDelete && (
                        <ActionBtn
                          onClick={() => setDeleteTarget(po)}
                          title="Delete PO"
                          icon="ri-delete-bin-line"
                          colorClass="hover:text-red-500 hover:bg-red-50"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <i className="ri-file-list-3-line text-2xl text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No purchase orders found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or date range</p>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
          <p className="text-xs text-slate-400">
            Showing&nbsp;
            <span className="font-medium text-slate-600">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </span>
            &nbsp;of&nbsp;
            <span className="font-medium text-slate-600">{filtered.length}</span>
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-sm" />
            </button>

            {paginationRange.map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium
                              transition-colors cursor-pointer
                              ${p === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                         text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed
                         transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-sm" />
            </button>
          </div>
        </div>
      )}

      {cancelTarget && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={() => !isCancelling && setCancelTarget(null)}
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 flex items-center justify-center rounded-full bg-orange-100">
          <i className="ri-close-circle-line text-orange-600 text-xl" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Cancel {cancelTarget.poNumber}?
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            This will mark the purchase order as cancelled. You cannot receive stock after this.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={() => setCancelTarget(null)}
          disabled={isCancelling}
          className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Back
        </button>

        <button
          onClick={confirmCancel}
          disabled={isCancelling}
          className="flex-1 h-9 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 flex items-center justify-center gap-1.5"
        >
          {isCancelling ? (
            <>
              <i className="ri-loader-4-line animate-spin" /> Cancelling…
            </>
          ) : (
            <>
              <i className="ri-close-circle-line" /> Cancel PO
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}


      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + title */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 flex items-center justify-center rounded-full bg-red-100 shrink-0">
                <i className="ri-delete-bin-line text-red-600 text-xl" />
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-bold text-slate-800">
                  Delete {deleteTarget.poNumber}?
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  This cannot be undone. All associated data will be permanently removed.
                </p>
              </div>
            </div>

            {/* PO summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-5 space-y-2">
              {[
                { label: 'Supplier', value: deleteTarget.supplierName ?? '—' },
                { label: 'Amount',   value: formatINR(deleteTarget.totalAmount ?? 0) },
                {
                  label: 'Status',
                  value: (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                     inline-flex items-center gap-1
                                     ${STATUS_CONFIG[deleteTarget.status]?.style ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      <i className={STATUS_CONFIG[deleteTarget.status]?.icon ?? 'ri-question-line'} />
                      {STATUS_CONFIG[deleteTarget.status]?.label ?? deleteTarget.status}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-700">{value as React.ReactNode}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium
                           text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-9 rounded-xl bg-red-600 text-white text-sm font-semibold
                           hover:bg-red-700 active:bg-red-800 disabled:opacity-60 transition-colors
                           cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <><i className="ri-loader-4-line animate-spin" /> Deleting…</>
                ) : (
                  <><i className="ri-delete-bin-line" /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseTable;