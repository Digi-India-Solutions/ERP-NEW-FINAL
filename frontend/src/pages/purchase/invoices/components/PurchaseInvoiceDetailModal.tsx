
import { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import PrintPurchaseInvoiceView from './printDetails';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(n?: number | string) {
  const val = Number(n);
  if (isNaN(val)) return '₹0.00';
  return `₹${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.round(amount);
  if (n === 0) return 'Zero Rupees Only';
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  return convert(n) + ' Rupees Only';
}

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNPAID: 'bg-red-50 text-red-600 border-red-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

interface Props {
  invoice: any;
  onClose: () => void;
}

export default function PurchaseInvoiceDetailModal({ invoice, onClose }: Props) {
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);


  useEffect(() => {
  const loadDetails = async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getInvoice(invoice.id);
      
      // 'response' is already 'data.data' from your service
      if (response) {
        setInv({
          ...response,
          // ─── Header Mappings ───
          billNo: response.invoiceNumber,
          partyName: response.supplierName,
          supplierAddress:response.supplierBillingAddress,
          date: response.invoiceDate ? new Date(response.invoiceDate).toLocaleDateString('en-IN') : '—',
          isSameState: Number(response.igst) > 0 ? false : true,
          // ─── Totals Mappings (Fixes the ₹0.00 and NaN) ───
          subtotal: Number(response.subtotal) || 0,
          totalDiscount: Number(response.discountAmount) || 0,
          taxableAmount: Number(response.taxableAmount) || 0,
          totalCGST: Number(response.cgst) || 0,
          totalSGST: Number(response.sgst) || 0,
          totalIGST: Number(response.igst) || 0,
          roundOff: Number(response.roundOff) || 0,
          grandTotal: Number(response.totalAmount) || 0,
          
          // ─── Items Mapping ───
          // In the useEffect loadDetails(), replace the items mapping:
items: (response.items || []).map((item: any) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const taxRate = Number(item.taxRate || item.tax_rate || item.gst_rate) || 0;
  const discountPct = Number(item.discountPct || item.discount_pct) || 0;
  
  // Calculate taxable from first available source
  const taxableAmount = Number(item.taxableAmount || item.taxable_amount) 
    || (qty * rate * (1 - discountPct / 100));
  
  const cgst = Number(item.cgstAmt || item.cgst_amount || item.cgst) || 0;
  const sgst = Number(item.sgstAmt || item.sgst_amount || item.sgst) || 0;
  const igst = Number(item.igstAmt || item.igst_amount || item.igst) || 0;
  
  // Calculate tax if all zero but taxRate exists
  const computedTax = (cgst + sgst + igst === 0 && taxRate > 0)
    ? taxableAmount * taxRate / 100
    : 0;
  
  return {
    ...item,
    itemName: item.itemName || item.item_name,
    hsnCode: item.hsnCode || item.hsn_code || '—',
    qty,
    unit: item.unitName || item.unit_name || 'PCS',
    rate,
    taxRate,
    discountPct,
    taxableAmount,
    cgst: cgst || (computedTax / 2 * (Number(response.igst) > 0 ? 0 : 1)),
    sgst: sgst || (computedTax / 2 * (Number(response.igst) > 0 ? 0 : 1)),
    igst: igst || (computedTax * (Number(response.igst) > 0 ? 1 : 0)),
    total: Number(item.totalAmount || item.total_amount || item.total) 
      || (taxableAmount + cgst + sgst + igst || taxableAmount * (1 + taxRate/100)),
  };
}),

// Also fix subtotal — fall back to sum of item totals if backend subtotal is wrong:
subtotal: Number(response.subtotal) 
  || (response.items || []).reduce((s: number, i: any) => 
    s + (Number(i.totalAmount || i.total_amount || i.total) || 0), 0),
          
        }) }} catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (invoice?.id) loadDetails();
}, [invoice?.id]);

//  useEffect(() => {
//   const loadDetails = async () => {
//     try {
//       setLoading(true);
//       // 'response' here is already 'data.data' from your service
//       const response = await purchaseService.getInvoice(invoice.id);
      
//       // Use the response directly
//       if (response) {
//         setInv({
//           ...response,
//           // Map backend names to what your Modal JSX uses
//           billNo: response.invoiceNumber,
//           partyName: response.supplierName, // Use supplierName from backend
//           date: response.invoiceDate ? new Date(response.invoiceDate).toLocaleDateString('en-IN') : '—',
//           grandTotal: response.totalAmount,
//           // Map backend items
//           items: (response.items || []).map((item: any) => ({
//             ...item,
//             itemName: item.itemName,
//             hsnCode: item.hsnCode || '—',
//             qty: item.qty,
//             unit: item.unitName || 'PCS',
//             rate: item.rate,
//             taxableAmount: item.taxableAmount,
//             total: item.totalAmount // backend uses totalAmount
//           }))
//         });
//       }
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (invoice?.id) loadDetails();
// }, [invoice?.id]);

  // Handle Loading state so the app doesn't crash while fetching
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
           <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
           <span className="text-sm font-medium text-slate-600">Loading invoice details...</span>
        </div>
      </div>
    );
  }

  if (!inv) return null
  // ─── Normalization logic ──────────────────────────────────────────────────
  // const inv = {
  //   ...incomingInv,
  //   billNo: incomingInv.invoiceNo || incomingInv.billNo,
  //   subtotal: incomingInv.subtotal ?? incomingInv.grandTotal ?? 0,
  //   totalDiscount: incomingInv.totalDiscount ?? 0,
  //   taxableAmount: incomingInv.taxableAmount ?? incomingInv.grandTotal ?? 0,
  //   totalCGST: incomingInv.totalCGST ?? 0,
  //   totalSGST: incomingInv.totalSGST ?? 0,
  //   totalIGST: incomingInv.totalIGST ?? 0,
  //   roundOff: incomingInv.roundOff ?? 0,
  //   // Fix: mapping items to ensure the table keys match
  //   items: (incomingInv.items || []).map((item: any) => ({
  //     ...item,
  //     hsnCode: item.hsnCode || '—',
  //     unit: item.unit || 'PCS',
  //     taxRate: item.taxRate || 0,
  //     taxableAmount: item.taxableAmount ?? (item.qty * item.rate),
  //     total: item.total ?? (item.qty * item.rate * (1 + (item.taxRate || 0)/100))
  //   }))
  // };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-6xl mx-4 overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Purchase Invoice</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${PAYMENT_STATUS_STYLE[inv.paymentStatus]}`}>
              {inv.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {inv.date} &nbsp;·&nbsp; Supplier Inv: {inv.supplierInvoiceNo || '—'} &nbsp;·&nbsp; {inv.warehouseName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <i className="ri-printer-line" /> Print
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <i className="ri-close-line text-2xl" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Supplier</p>
            <h3 className="text-xl font-bold text-[#1e293b]">{inv.partyName}</h3>
            <p className="text-sm text-slate-500 mt-1">{inv.supplierAddress || 'No Address Provided'}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Invoice Details</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-slate-500">Invoice No</span>
              <span className="font-semibold text-right text-[#1e293b]">{inv.billNo}</span>
              <span className="text-slate-500">Supplier Inv No</span>
              <span className="font-semibold text-right text-[#1e293b]">{inv.supplierInvoiceNo || '—'}</span>
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-right text-[#1e293b]">{inv.date}</span>
              <span className="text-slate-500">Warehouse</span>
              <span className="font-semibold text-right text-[#1e293b]">{inv.warehouseName}</span>
              <span className="text-slate-500">GST Type</span>
              <span className="font-bold text-right text-orange-600">{inv.isSameState ? 'CGST + SGST' : 'IGST'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-50 border-b border-[#e2e8f0]">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">HSN</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">Unit</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Rate</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Disc%</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Taxable</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">GST%</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Tax Amt</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inv.items.map((item, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-[#1e293b]">{item.itemName}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{item.hsnCode}</td>
                    <td className="px-4 py-3.5 text-center font-medium">{item.qty}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{item.unit}</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatINR(item.rate)}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{item.discountPct}%</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatINR(item.taxableAmount)}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{item.taxRate}%</td>
                    <td className="px-4 py-3.5 text-right font-medium">{formatINR(item.cgst + item.sgst + item.igst)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-[#1e293b]">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Summaries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GST Rate-wise Summary */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Rate-wise Summary</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase">GST Rate</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase">Taxable</th>
                  {inv.isSameState ? (
                    <>
                      <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase">CGST</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase">SGST</th>
                    </>
                  ) : (
                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase">IGST</th>
                  )}
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from(new Set(inv.items.map(i => i.taxRate))).map((rate) => {
                  const filtered = inv.items.filter(i => i.taxRate === rate);
                  const taxable = filtered.reduce((s, i) => s + i.taxableAmount, 0);
                  const cgst = filtered.reduce((s, i) => s + i.cgst, 0);
                  const sgst = filtered.reduce((s, i) => s + i.sgst, 0);
                  const igst = filtered.reduce((s, i) => s + i.igst, 0);
                  return (
                    <tr key={rate}>
                      <td className="px-4 py-3 font-bold text-slate-700">{rate}%</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(taxable)}</td>
                      {inv.isSameState ? (
                        <>
                          <td className="px-4 py-3 text-right">{formatINR(cgst)}</td>
                          <td className="px-4 py-3 text-right">{formatINR(sgst)}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-right">{formatINR(igst)}</td>
                      )}
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatINR(cgst + sgst + igst)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals Column */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Invoice Totals</p>
            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Subtotal</span><span className="font-bold text-[#1e293b]">{formatINR(inv.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Discount</span><span className="font-bold text-red-500">-{formatINR(inv.totalDiscount)}</span></div>
            <div className="flex justify-between text-sm border-t border-slate-100 pt-2"><span className="text-slate-500 font-medium">Taxable Amount</span><span className="font-bold text-[#1e293b]">{formatINR(inv.taxableAmount)}</span></div>
            
            {inv.isSameState ? (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">CGST</span><span className="font-bold text-[#1e293b]">{formatINR(inv.totalCGST)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">SGST</span><span className="font-bold text-[#1e293b]">{formatINR(inv.totalSGST)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">IGST</span><span className="font-bold text-[#1e293b]">{formatINR(inv.totalIGST)}</span></div>
            )}

            <div className="flex justify-between text-sm"><span className="text-slate-500 font-medium">Round Off</span><span className="font-bold text-[#1e293b]">{formatINR(inv.roundOff)}</span></div>
            
            <div className="flex justify-between items-center border-t border-[#e2e8f0] pt-4 mt-2">
              <span className="text-base font-bold text-[#1e293b]">Grand Total</span>
              <span className="text-2xl font-black text-[#4f46e5]">{formatINR(inv.grandTotal)}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic text-right">{amountInWords(inv.grandTotal)}</p>
          </div>
        </div>
      </div>

     {showPrint && invoice?.id && (
  <PrintPurchaseInvoiceView
    invoiceId={inv.id}
    onClose={() => setShowPrint(false)}
  />
)}




      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#e2e8f0] bg-slate-50 flex justify-end gap-3">
        <button onClick={() => setShowPrint(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          <i className="ri-printer-line" /> Print Invoice
        </button>
        <button onClick={onClose} className="px-8 py-2.5 rounded-xl bg-[#4f46e5] text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all">
          Close
        </button>
      </div>
    </div>
  </div>
);
}
