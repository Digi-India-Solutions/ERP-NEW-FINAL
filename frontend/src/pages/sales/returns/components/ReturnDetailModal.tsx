import { useState } from 'react';
import { formatINR } from '@/utils/format';
import { mockCompany } from '@/mocks/masters';
import type { MockSaleReturnDetail } from '@/mocks/billing';

interface Props {
  returnRecord: MockSaleReturnDetail;
  onClose: () => void;
  onViewInvoice?: (invoiceId: string) => void;
  onDelete: (returnRecord: string) => void;
}

function printReturn(ret: MockSaleReturnDetail): void {
  const c = mockCompany;
  const totalAmt = ret.items.reduce((s, i) => s + i.amount, 0);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sale Return - ${ret.billNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 10mm; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border: 1px solid #e2e8f0; }
    td { padding: 5px 8px; border: 1px solid #e2e8f0; }
    .right { text-align: right; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .doc-title { font-size: 18px; font-weight: 800; color: #dc2626; text-align: right; }
    .info-box { border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 4px; display: inline-block; text-align: left; margin-top: 10px; }
    .label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 12px; background: #dc2626; color: white; font-weight: 700; font-size: 13px; border-radius: 4px; margin-top: 12px; }
    .footer-text { text-align: center; font-style: italic; color: #94a3b8; font-size: 9px; margin-top: 16px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
    @media print { @page { size: A4; margin: 0; } body { padding: 10mm 12mm; } }
  </style></head><body>
  <div class="header-grid">
    <div>
      <p style="font-size:16px;font-weight:700">${c.name}</p>
      <p style="color:#64748b;margin-top:4px;line-height:1.5">${c.address}</p>
      <p style="margin-top:4px"><strong>GSTIN:</strong> ${c.gstin} | <strong>Ph:</strong> ${c.phone}</p>
    </div>
    <div style="text-align:right">
      <p class="doc-title">SALE RETURN</p>
      <div class="info-box">
        <p class="label">Return No</p><p class="bold">${ret.billNo}</p>
        <p class="label" style="margin-top:6px">Date</p><p>${ret.date}</p>
        <p class="label" style="margin-top:6px">Original Invoice</p><p>${ret.originalInvoiceNo}</p>
      </div>
    </div>
  </div>
  <div style="padding:10px;background:#f8fafc;border-radius:4px;margin-bottom:12px">
    <p class="label">Customer</p>
    <p class="bold" style="font-size:12px;margin-top:3px">${ret.partyName}</p>
    <p style="margin-top:2px;color:#64748b">Warehouse: ${ret.warehouseName}</p>
  </div>
  <table style="margin-bottom:12px">
    <thead><tr>
      <th style="width:30px">Sr</th><th>Item Name</th><th>HSN</th>
      <th class="right">Return Qty</th><th>Unit</th><th class="right">Rate</th>
      <th class="right">Amount</th><th>Reason</th>
    </tr></thead>
    <tbody>
      ${ret.items.map((item, i) => `<tr style="${i % 2 === 1 ? 'background:#fafafa' : ''}">
        <td class="center">${i + 1}</td>
        <td class="bold">${item.itemName}</td>
        <td>${item.hsnCode}</td>
        <td class="right">${item.returnQty}</td>
        <td>${item.unit}</td>
        <td class="right">₹${item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="right bold">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td>${item.reason}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="width:280px">
      <div class="total-row"><span>Total Return Amount</span><span>₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px">
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p>Customer Signature</p><p style="margin-top:4px">Date: ________________</p>
    </div>
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p class="bold" style="font-size:11px">${c.name}</p>
      <p style="margin-top:4px">Authorised Signatory</p>
    </div>
  </div>
  <p class="footer-text">This is a computer generated sale return note.</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export default function ReturnDetailModal({ returnRecord, onClose, onDelete, onViewInvoice }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const totalAmount = returnRecord.items.reduce((s, i) => s + i.amount, 0);


  const handleDelete = () => {
    onDelete?.(returnRecord?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1e293b]">Sale Return</h2>
              <span className="text-lg font-bold text-rose-600">— {returnRecord.billNo}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                SAVED
              </span>
              <span className="text-xs text-slate-500">{returnRecord.date}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{returnRecord.partyName}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-slate-500 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Info row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Original Invoice</p>
              {onViewInvoice ? (
                <button
                  onClick={() => onViewInvoice(returnRecord.originalInvoiceId)}
                  className="text-sm font-semibold text-[#4f46e5] hover:underline cursor-pointer"
                >
                  {returnRecord.originalInvoiceNo}
                </button>
              ) : (
                <p className="text-sm font-semibold text-[#4f46e5]">{returnRecord.originalInvoiceNo}</p>
              )}
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Customer</p>
              <p className="text-sm font-semibold text-[#1e293b]">{returnRecord.partyName}</p>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Warehouse</p>
              <p className="text-sm font-semibold text-[#1e293b]">{returnRecord.warehouseName}</p>
            </div>
          </div>

          {/* Items table */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Returned Items</h3>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['#', 'Item', 'HSN', 'Return Qty', 'Unit', 'Rate', 'Amount', 'Reason'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-left font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${[3, 5, 6].includes(i) ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returnRecord.items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-50 ${idx % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>
                      <td className="px-3 py-2.5 text-slate-400 text-center">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-[#1e293b]">{item.itemName}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.hsnCode}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{item.returnQty}</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.unit}</td>
                      <td className="px-3 py-2.5 text-right">{formatINR(item.rate)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">{formatINR(item.amount)}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium whitespace-nowrap">
                          {item.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 border border-[#e2e8f0] rounded-lg overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 border-b border-[#f1f5f9] text-xs">
                <span className="text-slate-500">Items Returned</span>
                <span className="font-medium">{returnRecord.items.length}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-rose-600 text-white">
                <span className="font-bold text-sm">Total Return Amount</span>
                <span className="font-bold text-sm">{formatINR(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <button
            onClick={() => printReturn(returnRecord)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-[#f1f5f9] cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-printer-line" /> Print
          </button>
          {/* Delete — frontend only */}
          {(
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete invoice (API coming soon)"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <i className="ri-delete-bin-line" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
          >
            Close
          </button>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 shrink-0">
                  <i className="ri-delete-bin-line text-red-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e293b]">Delete Sales Return {returnRecord.billNo}?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Removes it from the list. API integration coming soon.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button onClick={handleDelete} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 cursor-pointer">Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
