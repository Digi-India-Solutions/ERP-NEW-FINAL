import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrintChallan from '@/components/print/PrintChallan';
import { printChallan } from '@/utils/printDocument';
import { formatINR } from '@/utils/format';
import { useBillingTabStore } from '@/stores/billingTabStore';
import type { MockChallanDetail } from '@/mocks/billing';

interface ChallanDetailModalProps {
  challan: MockChallanDetail;
  onClose: () => void;
  onConverted?: (challanId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  DISPATCHED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

export default function ChallanDetailModal({ challan, onClose, onConverted }: ChallanDetailModalProps) {
  const navigate = useNavigate();
  const { addTabWithChallan } = useBillingTabStore();
  const [printOpen, setPrintOpen] = useState(false);

  const normalizedItems = challan.items.map((item) => ({
    ...item,
    qty: item.qty > 0 ? item.qty : 1,
  }));

  const totalQty = normalizedItems.reduce((s, i) => s + i.qty, 0);
  const totalValue = normalizedItems.reduce((s, i) => s + (i.amount ?? 0), 0);
  const hasRates = normalizedItems.some((i) => i.rate !== undefined && i.rate > 0);

  const printData = {
    challanNo: challan.billNo,
    date: challan.date,
    customerName: challan.partyName,
    billingAddress: challan.billingAddress ?? '',
    vehicleNo: challan.vehicleNo ?? '',
    driverName: challan.driverName ?? '',
    lrNo: challan.lrNo ?? '',
    items: normalizedItems.map((item, idx) => ({
      sr: idx + 1,
      name: item.itemName || 'Unnamed Item',
      qty: item.qty,
      unit: item.unit || 'Pcs',
    })),
  };

  const handleConvertToInvoice = () => {
    if (challan.challanStatus !== 'DISPATCHED') return;

    // Create a new billing tab pre-filled with challan data
    addTabWithChallan({
      challanId: challan.id,
      challanNo: challan.billNo,
      customerName: challan.partyName,
      items: normalizedItems.map((i) => ({
        itemName: i.itemName || 'Unnamed Item',
        qty: i.qty,
        unit: i.unit || 'Pcs',
        rate: i.rate ?? 0,
        taxRate: i.taxRate ?? 0,
        cgst: i.cgst ?? 0,
        sgst: i.sgst ?? 0,
        igst: i.igst ?? 0,
        hsnCode: i.hsnCode ?? '',
        taxableAmount: i.taxableAmount ?? (i.qty * (i.rate ?? 0)),
      })),
    });

    onConverted?.(challan.id);
    onClose();
    navigate('/sales/invoices/new');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-[#1e293b]">Delivery Challan</h2>
                <span className="text-lg font-bold text-[#4f46e5]">{challan.billNo}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[challan.challanStatus] ?? STATUS_STYLES.DRAFT}`}>
                  {challan.challanStatus}
                </span>
              </div>
              <p className="text-sm text-[#64748b]">
                <span className="font-medium text-[#1e293b]">{challan.partyName}</span>
                <span className="mx-2 text-[#cbd5e1]">·</span>
                {challan.date}
                <span className="mx-2 text-[#cbd5e1]">·</span>
                {challan.warehouseName}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] cursor-pointer transition-colors">
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Bill To</p>
                <p className="font-semibold text-[#1e293b]">{challan.partyName}</p>
                {challan.billingAddress && (
                  <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{challan.billingAddress}</p>
                )}
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Transport Details</p>
                <div className="space-y-1.5 text-sm">
                  {challan.vehicleNo ? (
                    <div className="flex items-center gap-2">
                      <i className="ri-truck-line text-[#94a3b8] w-4 h-4 flex items-center justify-center" />
                      <span className="text-[#64748b]">Vehicle:</span>
                      <span className="font-medium text-[#1e293b]">{challan.vehicleNo}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94a3b8] italic">No vehicle details</p>
                  )}
                  {challan.driverName && (
                    <div className="flex items-center gap-2">
                      <i className="ri-user-line text-[#94a3b8] w-4 h-4 flex items-center justify-center" />
                      <span className="text-[#64748b]">Driver:</span>
                      <span className="font-medium text-[#1e293b]">{challan.driverName}</span>
                    </div>
                  )}
                  {challan.lrNo && (
                    <div className="flex items-center gap-2">
                      <i className="ri-file-text-line text-[#94a3b8] w-4 h-4 flex items-center justify-center" />
                      <span className="text-[#64748b]">LR No:</span>
                      <span className="font-medium text-[#1e293b]">{challan.lrNo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div>
              <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Items</h3>
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0] w-8">#</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">Item</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">Qty</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">Unit</th>
                      {hasRates && (
                        <>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">Rate</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b] border-b border-[#e2e8f0]">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedItems.map((item, idx) => (
                      <tr key={item.id} className={`border-b border-[#f1f5f9] ${idx % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>
                        <td className="px-3 py-2.5 text-[#94a3b8] text-xs">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-[#1e293b]">{item.itemName || <span className="text-[#94a3b8]">Unnamed Item</span>}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">{item.qty}</td>
                        <td className="px-3 py-2.5 text-[#64748b]">{item.unit || <span className="text-[#94a3b8]">Pcs</span>}</td>
                        {hasRates && (
                          <>
                            <td className="px-3 py-2.5 text-right text-[#64748b]">
                              {item.rate ? formatINR(item.rate) : <span className="text-[#cbd5e1]">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-[#1e293b]">
                              {item.amount ? formatINR(item.amount) : <span className="text-[#cbd5e1]">—</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#f8fafc]">
                    <tr className="border-t-2 border-[#e2e8f0]">
                      <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">
                        Total — {challan.items.length} item{challan.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">{totalQty}</td>
                      <td className="px-3 py-2.5" />
                      {hasRates && (
                        <>
                          <td className="px-3 py-2.5" />
                          <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">
                            {totalValue > 0 ? formatINR(totalValue) : <span className="text-[#94a3b8]">—</span>}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Tax Summary — shown only when tax data exists */}
{normalizedItems.some((i) => (i.cgst ?? 0) > 0 || (i.sgst ?? 0) > 0 || (i.igst ?? 0) > 0) && (
  <div className="flex justify-end">
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg overflow-hidden min-w-[260px]">
      {[
        { label: 'Taxable Amount', value: normalizedItems.reduce((s, i) => s + (i.taxableAmount ?? 0), 0) },
        ...(normalizedItems.some((i) => (i.cgst ?? 0) > 0)
          ? [{ label: 'CGST', value: normalizedItems.reduce((s, i) => s + (i.cgst ?? 0), 0) }]
          : []),
        ...(normalizedItems.some((i) => (i.sgst ?? 0) > 0)
          ? [{ label: 'SGST', value: normalizedItems.reduce((s, i) => s + (i.sgst ?? 0), 0) }]
          : []),
        ...(normalizedItems.some((i) => (i.igst ?? 0) > 0)
          ? [{ label: 'IGST', value: normalizedItems.reduce((s, i) => s + (i.igst ?? 0), 0) }]
          : []),
      ].map((row) => (
        <div key={row.label} className="flex justify-between px-4 py-2 border-b border-[#f1f5f9] text-xs last:border-0">
          <span className="text-[#64748b]">{row.label}</span>
          <span className="font-medium text-[#1e293b]">{formatINR(row.value)}</span>
        </div>
      ))}
      <div className="flex justify-between px-4 py-2.5 bg-[#4f46e5] text-white">
        <span className="text-xs font-bold">Grand Total</span>
        <span className="text-xs font-bold">{formatINR(totalValue)}</span>
      </div>
    </div>
  </div>
)}

            {challan.challanStatus === 'CONVERTED' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <i className="ri-checkbox-circle-line text-green-500" />
                This challan has already been converted to a sales invoice.
              </div>
            )}
            {challan.challanStatus === 'CANCELLED' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <i className="ri-close-circle-line text-red-400" />
                This challan has been cancelled and cannot be converted.
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] bg-white text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer whitespace-nowrap transition-colors">
                <i className="ri-printer-line" />
                Print Challan
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose}
                className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer whitespace-nowrap transition-colors">
                Close
              </button>
              {challan.challanStatus === 'DISPATCHED' && (
                <button
                  onClick={handleConvertToInvoice}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-arrow-right-circle-line" />
                  Convert to Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {printOpen && (
        <PrintChallan
          data={printData}
          onClose={() => setPrintOpen(false)}
          onPrint={() => printChallan(printData)}
        />
      )}
    </>
  );
}
