import { formatINR } from '../utils/grnHelpers';
import { type MockGRN } from '@/mocks/billing';
import { mockCompany } from '@/mocks/masters';

interface PrintGRNProps {
  grn: MockGRN;
  onClose: () => void;
}

function PrintGRNView({ grn, onClose }: PrintGRNProps) {
  const c = mockCompany;
  const totalQty = grn.items.reduce((s, i) => s + i.qty, 0);
  const totalAmt = grn.items.reduce((s, i) => s + i.qty * i.rate, 0);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white print:hidden">
          <div className="flex items-center gap-2">
            <i className="ri-inbox-archive-line text-indigo-300" />
            <span className="text-sm font-medium">GRN Preview — {grn.grnNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" />Print
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer text-slate-300"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        {/* A4 Content */}
        <div className="p-8 print-area text-[11px]">
          {/* Company header */}
          <div className="flex justify-between items-start mb-5 pb-4 border-b-2 border-[#e2e8f0]">
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">{c.name}</h1>
              <p className="text-[#64748b] mt-1">{c.address}</p>
              <p className="mt-1">
                <strong>GSTIN:</strong> {c.gstin} &nbsp;|&nbsp; <strong>Ph:</strong> {c.phone}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-[#4f46e5]">GOODS RECEIPT NOTE</p>
              <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
                <p className="text-[10px] text-[#94a3b8] uppercase">GRN No</p>
                <p className="font-bold">{grn.grnNumber}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-2">Date</p>
                <p>{grn.date}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-2">Warehouse</p>
                <p>{grn.warehouseName}</p>
              </div>
            </div>
          </div>

          {/* Supplier info */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#f8fafc] rounded-lg">
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Received From (Supplier)</p>
              <p className="font-bold text-sm">{grn.supplierName}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Received At</p>
              <p className="font-bold text-sm">{grn.warehouseName}</p>
              <p className="text-[#64748b] mt-0.5">Created by: {grn.createdBy}</p>
            </div>
          </div>

          {/* Linked POs */}
          {grn.linkedPOs.length > 0 && (
            <div className="mb-4 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px]">
              <strong className="text-emerald-700">Linked POs: </strong>
              <span className="text-emerald-800">{grn.linkedPOs.join(', ')}</span>
            </div>
          )}

          {/* Items table */}
          <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-4">
            <thead>
              <tr className="bg-[#f8fafc]">
                {['Sr', 'Item Description', 'HSN', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)', 'PO Ref'].map((h, i) => (
                  <th
                    key={h}
                    className={`border border-[#e2e8f0] px-2 py-1.5 font-semibold text-[#64748b] uppercase ${
                      ['Qty', 'Rate (₹)', 'Amount (₹)'].includes(h) ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grn.items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">{item.itemName}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.hsnCode}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.qty}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.unit}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(item.rate)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right font-bold">{formatINR(item.qty * item.rate)}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-[9px]">
                    {item.poRef ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f8fafc] font-bold">
                <td colSpan={3} className="border border-[#e2e8f0] px-2 py-1.5 text-right">Total</td>
                <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{totalQty}</td>
                <td className="border border-[#e2e8f0] px-2 py-1.5"></td>
                <td className="border border-[#e2e8f0] px-2 py-1.5"></td>
                <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{formatINR(totalAmt)}</td>
                <td className="border border-[#e2e8f0] px-2 py-1.5"></td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-[#e2e8f0]">
            <div className="text-center text-[10px] text-[#64748b]">
              <p>Received By</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">{grn.createdBy}</p>
            </div>
            <div className="text-center text-[10px] text-[#64748b]">
              <p>Checked By</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">________________</p>
            </div>
            <div className="text-center text-[10px] text-[#64748b]">
              <p className="font-semibold text-[#1e293b]">{c.name}</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintGRNView;