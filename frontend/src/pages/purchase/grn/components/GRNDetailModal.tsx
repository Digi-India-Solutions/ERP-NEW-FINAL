import { useNavigate } from 'react-router-dom';
import { formatINR } from '../utils/grnHelpers';
import { mockPurchaseOrders, type MockGRN } from '@/mocks/billing';
import type { InwardGPPrefill } from '@/pages/inventory/gate-pass/inward/page';
import {MODULES} from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';

interface GRNDetailModalProps {
  grn: MockGRN;
  onClose: () => void;
  onPrint: (grn: MockGRN) => void;
  onCreatePI: (grn: MockGRN) => void;
}

function GRNDetailModal({ grn, onClose, onPrint, onCreatePI }: GRNDetailModalProps) {
  const navigate = useNavigate();

  const totalQty = grn.items.reduce((s, i) => s + i.qty, 0);
  const totalAmt = grn.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const matchedItems = grn.items.filter((i) => i.poRef);
  const unmatchedItems = grn.items.filter((i) => !i.poRef);
  const {hasPermission} = useAuth();
  const canCreatePI = hasPermission(MODULES.PURCHASE_INVOICE, 'create');
  const canCreateGP = hasPermission(MODULES.GATE_PASS_INWARD, 'create');

  const handleGenerateInwardGP = (grn: MockGRN) => {
    const prefill: InwardGPPrefill = {
      partyName: grn.supplierName,
      linkedDocType: 'GRN',
      linkedDocNumber: grn.grnNumber,
      notes: `Auto-generated from GRN ${grn.grnNumber}`,
      items: grn.items.map((item) => ({
        itemName: item.itemName,
        qty: item.qty,
        unit: item.unit || 'Pcs',
        description: item.poRef ? `PO Ref: ${item.poRef}` : undefined,
      })),
    };
    navigate('/inventory/gate-pass/inward', { state: { prefill } });
  };

  // PO status summary
  const linkedPODetails = grn.linkedPOs.map((poNum) => {
    const po = mockPurchaseOrders.find((p) => p.poNumber === poNum);
    if (!po) return null;
    const pending = po.items.filter((pi) => pi.receivedQty < pi.orderedQty);
    return { poNumber: poNum, status: po.status, pendingItems: pending };
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#1e293b]">{grn.grnNumber}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <i className="ri-checkbox-circle-line mr-1" />Received
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {grn.date} &nbsp;·&nbsp; {grn.supplierName} &nbsp;·&nbsp; {grn.warehouseName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Created by {grn.createdBy}</p>
          </div>
          <div className="flex items-center gap-2">
            {canCreateGP &&(<button
              type="button"
              onClick={() => handleGenerateInwardGP(grn)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-shield-2-line" />
              Generate Inward GP
            </button>)}
            <button
              type="button"
              onClick={() => onPrint(grn)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" />Print
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Items', value: grn.totalItems },
              { label: 'Total Qty', value: totalQty },
              { label: 'Total Amount', value: formatINR(totalAmt) },
              { label: 'PO Linked', value: `${matchedItems.length} / ${grn.items.length}` },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{s.label}</p>
                <p className="text-base font-bold text-[#1e293b] mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Items table */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items Received</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  {['#', 'Item Name', 'Barcode', 'Qty', 'Unit', 'Rate', 'Amount', 'PO Ref'].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] ${
                        ['Qty', 'Rate', 'Amount'].includes(h) ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grn.items.map((item, i) => (
                  <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1e293b]">{item.itemName}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 font-mono">{item.hsnCode}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{item.qty}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2.5 text-right">{formatINR(item.rate)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatINR(item.qty * item.rate)}</td>
                    <td className="px-3 py-2.5">
                      {item.poRef ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                          <i className="ri-file-list-3-line mr-1" />{item.poRef}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
                          <i className="ri-alert-line mr-1" />Not in PO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Footer totals */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-[#e2e8f0]">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{grn.items.length} items</span>
                <span>Total Qty: <strong className="text-[#1e293b]">{totalQty}</strong></span>
                {unmatchedItems.length > 0 && (
                  <span className="text-amber-600">
                    <i className="ri-alert-line mr-0.5" />{unmatchedItems.length} not in PO
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[#1e293b]">
                Total: {formatINR(totalAmt)}
              </div>
            </div>
          </div>

          {/* PI Status section */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Purchase Invoice Status</h3>
            </div>
            <div className="p-4">
              {grn.piCreated ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-emerald-600 text-lg" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Invoice Created</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {grn.linkedPINumber}
                        {grn.piCreatedDate && <span className="ml-2 text-emerald-500">· {grn.piCreatedDate}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                    Invoiced
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <i className="ri-time-line text-amber-600 text-lg" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">PI Pending</p>
                      <p className="text-xs text-amber-600 mt-0.5">No purchase invoice created yet for this GRN</p>
                    </div>
                  </div>
                  {canCreatePI && (
                    <button
                      type="button"
                      onClick={() => onCreatePI(grn)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4f46e5] text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <i className="ri-file-add-line" />Create Purchase Invoice
                  </button>)}
                </div>
              )}
            </div>
          </div>

          {/* PO Status section */}
          {linkedPODetails.length > 0 && (
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-[#e2e8f0]">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">PO Status</h3>
              </div>
              <div className="p-4 space-y-2">
                {linkedPODetails.map((pd) => {
                  if (!pd) return null;
                  const isCompleted = pd.status === 'COMPLETED';
                  return (
                    <div
                      key={pd.poNumber}
                      className={`flex items-start justify-between rounded-lg border px-4 py-3 ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1e293b]">{pd.poNumber}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isCompleted ? (
                              <><i className="ri-checkbox-circle-line mr-1" />COMPLETED</>
                            ) : (
                              <><i className="ri-time-line mr-1" />PARTIAL</>
                            )}
                          </span>
                        </div>
                        {pd.pendingItems.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {pd.pendingItems.map((pi, i) => (
                              <p key={i} className="text-[11px] text-amber-700">
                                {pi.itemName}: {pi.receivedQty} received, {pi.orderedQty - pi.receivedQty} pending
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onPrint(grn)}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line mr-1.5" />Print GRN
          </button>
          {!grn.piCreated && canCreatePI && (
            <button
              type="button"
              onClick={() => onCreatePI(grn)}
              className="h-9 px-4 rounded-lg border border-[#4f46e5] text-sm font-medium text-[#4f46e5] hover:bg-indigo-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-add-line mr-1.5" />Create PI
            </button>
          )}
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

export default GRNDetailModal;