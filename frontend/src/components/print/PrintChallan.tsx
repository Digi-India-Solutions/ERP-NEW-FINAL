import { mockCompany } from '@/mocks/masters';
import type { PrintChallanData } from '@/utils/printDocument';

interface PrintChallanProps {
  data: PrintChallanData;
  onClose: () => void;
  onPrint: () => void;
}

export default function PrintChallan({ data, onClose, onPrint }: PrintChallanProps) {
  const c = mockCompany;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e293b] text-white">
          <div className="flex items-center gap-2">
            <i className="ri-truck-line text-indigo-300" />
            <span className="text-sm font-medium">Delivery Challan Preview — {data.challanNo}</span>
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
              <p className="text-xl font-extrabold text-[#4f46e5]">DELIVERY CHALLAN</p>
              <div className="mt-2 border border-[#e2e8f0] rounded-lg p-3 text-left inline-block">
                <p className="text-[10px] text-[#94a3b8] uppercase">Challan No</p>
                <p className="font-bold">{data.challanNo}</p>
                <p className="text-[10px] text-[#94a3b8] uppercase mt-2">Date</p>
                <p>{data.date}</p>
                {data.vehicleNo && <><p className="text-[10px] text-[#94a3b8] uppercase mt-2">Vehicle No</p><p>{data.vehicleNo}</p></>}
                {data.lrNo && <><p className="text-[10px] text-[#94a3b8] uppercase mt-2">LR No</p><p>{data.lrNo}</p></>}
              </div>
            </div>
          </div>
          <div className="p-3 bg-[#f8fafc] rounded-lg mb-4">
            <p className="text-[10px] text-[#94a3b8] uppercase font-semibold mb-1">Consignee</p>
            <p className="font-bold text-sm">{data.customerName}</p>
            <p className="text-[#64748b]">{data.billingAddress}</p>
            {data.driverName && <p className="mt-1"><strong>Driver:</strong> {data.driverName}</p>}
          </div>
          <table className="w-full border-collapse border border-[#e2e8f0] text-[10px] mb-8">
            <thead><tr className="bg-[#f8fafc]">
              {['Sr', 'Description', 'Qty', 'Unit'].map((h, i) => (
                <th key={h} className={`border border-[#e2e8f0] px-2 py-1.5 font-semibold text-[#64748b] uppercase ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className={i % 2 === 1 ? 'bg-[#fafafa]' : ''}>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-center">{item.sr}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 font-medium">{item.name}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5 text-right">{item.qty}</td>
                  <td className="border border-[#e2e8f0] px-2 py-1.5">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-[#e2e8f0]">
            <div className="text-center text-[10px] text-[#64748b]">
              <p>Receiver's Signature & Stamp</p>
              <p className="mt-8 border-t border-[#e2e8f0] pt-1">Date: ________________</p>
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
