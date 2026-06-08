import { mockCompany } from '@/mocks/masters';
import type { PrintPOData } from '@/utils/printDocument';

interface PrintPurchaseOrderProps {
  data: PrintPOData;
  onClose: () => void;
  onPrint: () => void;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function PrintPurchaseOrder({ data, onClose, onPrint }: PrintPurchaseOrderProps) {
  const c = mockCompany;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white">
          <div className="flex items-center gap-2">
            <i className="ri-file-list-3-line text-indigo-300" />
            <span className="text-sm font-medium">Purchase Order Preview — {data.poNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrint} className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap">
              <i className="ri-printer-line" />Print
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300">
              <i className="ri-close-line" />
            </button>
          </div>
        </div>
        <div className="p-8 text-[11px]">
          <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#e2e8f0]">
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">{c.name}</h1>
              <p className="text-[#64748b] mt-1">{c.address}</p>
              <p className="mt-1"><strong>GSTIN:</strong> {c.gstin} | <strong>Ph:</strong> {c.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-[#4f46e5]">PURCHASE ORDER</p>
              <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
                <p className="text-[10px] text-[#94a3b8] uppercase">PO No</p>
                <p className="font-bold">{data.poNo}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-2">PO Date</p>
                <p>{data.date}</p>
                {data.deliveryDate && <><p className="text-[10px] text-[#94a3b8] uppercase mt-2">Delivery By</p><p>{data.deliveryDate}</p></>}
                {data.paymentTerms && <><p className="text-[10px] text-[#94a3b8] uppercase mt-2">Payment Terms</p><p>{data.paymentTerms}</p></>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#f8fafc] rounded-lg">
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Vendor (To)</p>
              <p className="font-bold text-sm">{data.supplierName}</p>
              {data.supplierGstin && <p className="text-[#64748b] mt-0.5">GSTIN: {data.supplierGstin}</p>}
              <p className="text-[#64748b] mt-0.5">{data.supplierAddress}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Ship To</p>
              <p className="font-bold text-sm">{c.name}</p>
              <p className="text-[#64748b] mt-0.5">{c.address}</p>
            </div>
          </div>
          <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-4">
            <thead><tr className="bg-[#f8fafc]">
              {['Sr', 'Item Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} className={`border border-[#e2e8f0] px-2 py-1.5 font-semibold text-[#64748b] uppercase ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">{item.sr}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">{item.name}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.hsn}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.qty}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.unit}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.rate)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right font-bold">{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-[#f8fafc] font-bold">
              <td colSpan={6} className="border border-[#e2e8f0] px-2 py-1.5 text-right">Total Amount</td>
              <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(data.totalAmount)}</td>
            </tr></tfoot>
          </table>
          {data.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-[10px]">
              <p className="font-semibold text-amber-700 mb-1">Terms & Conditions</p>
              <p className="text-amber-800">{data.notes}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-[#e2e8f0]">
            <div className="text-center text-[10px] text-[#64748b]">
              <p>Vendor's Acceptance</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">Date: ________________</p>
            </div>
            <div className="text-center text-[10px] text-[#64748b]">
              <p className="font-semibold text-[#1e293b]">{c.name}</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">Authorised Signatory (Purchase)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
