import { useEffect, useState } from 'react';
import { purchaseService } from '@/services/purchaseService';

interface PrintViewProps {
  invoiceId: string;
  onClose: () => void;
}

function amountInWords(amount: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const n = Math.round(Number(amount) || 0);
  if (n === 0) return 'Zero Rupees Only';

  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        ' Hundred' +
        (num % 100 ? ' ' + convert(num % 100) : '')
      );
    if (num < 100000)
      return (
        convert(Math.floor(num / 1000)) +
        ' Thousand' +
        (num % 1000 ? ' ' + convert(num % 1000) : '')
      );
    if (num < 10000000)
      return (
        convert(Math.floor(num / 100000)) +
        ' Lakh' +
        (num % 100000 ? ' ' + convert(num % 100000) : '')
      );
    return convert(Math.floor(num / 10000000)) + ' Crore';
  };

  return convert(n) + ' Rupees Only';
}

export default function PrintPurchaseInvoiceView({
  invoiceId,
  onClose,
}: PrintViewProps) {
  const [company, setCompany] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);

  const safe = (v: any) => Number(v) || 0;

  // ── Load invoice via purchaseService ──────────────────────────────────────
  useEffect(() => {
    if (!invoiceId) return;
    const loadInvoice = async () => {
      try {
        const data = await purchaseService.getInvoice(invoiceId);
        // data is already the unwrapped invoice object from your service
        setInvoice(data);
      } catch (err) {
        console.error('Failed to load invoice', err);
      }
    };
    loadInvoice();
  }, [invoiceId]);

  // ── Load company WITH auth token ──────────────────────────────────────────
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const token = localStorage.getItem('token'); // adjust key to match your auth storage
        const res = await fetch(
          'http://localhost:7001/api/v1/company/get',
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        const json = await res.json();
        setCompany(json?.data || json);
      } catch (err) {
        console.error('Company fetch failed', err);
      }
    };
    loadCompany();
  }, []);

  if (!company || !invoice) return null;

  // ── Field aliases matching the actual API response ────────────────────────
  const billNo = invoice.invoiceNumber;
  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const supplierName = invoice.supplierName;
  const supplierBillingAddress = invoice.supplierBillingAddress;
  const supplierShippingAddress = invoice.supplierShippingAddress;
  const warehouseName = invoice.warehouseName;
  const subtotal = safe(invoice.subtotal);
  const totalDiscount = safe(invoice.discountAmount);
  const totalCGST = safe(invoice.cgst);
  const totalSGST = safe(invoice.sgst);
  const totalIGST = safe(invoice.igst);
  const grandTotal = safe(invoice.totalAmount);

  // ── Build tax groups from items ───────────────────────────────────────────
  const taxGroups = (invoice.items || []).reduce((acc: any, item: any) => {
    const rate = safe(item.taxRate);
    if (!acc[rate]) acc[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    acc[rate].taxable += safe(item.taxableAmount);
    acc[rate].cgst += safe(item.cgstAmt); // ← correct field name
    acc[rate].sgst += safe(item.sgstAmt); // ← correct field name
    acc[rate].igst += safe(item.igstAmt); // ← correct field name
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[70] flex items-start justify-center overflow-y-auto py-8 print:bg-white print:p-0 print:static"
      onClick={onClose}
    >
      <div
        className="print-area bg-white w-[210mm] shadow-2xl rounded-lg overflow-hidden print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOOLBAR */}
        <div className="flex justify-between items-center px-6 py-3 bg-[#1e293b] text-white print:hidden">
          <span className="text-sm font-medium">
            Purchase Invoice — {billNo}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 rounded font-medium transition-colors"
            >
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="text-xl opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-10 text-[11px] text-slate-800">
          {/* HEADER */}
          <div className="flex justify-between border-b-2 border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">
                {company.name || 'Company Name'}
              </h1>
              <p className="max-w-[300px] text-slate-500 leading-relaxed">
                {company.address}
              </p>
              <p className="mt-2 font-semibold">
                GSTIN: <span className="font-normal">{company.gstin}</span> |
                Phone: <span className="font-normal">{company.phone}</span>
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black text-indigo-600 tracking-tight mb-2">
                PURCHASE INVOICE
              </h2>
              <div className="inline-block border rounded-md p-3 bg-slate-50 text-left min-w-[150px]">
                <p className="text-[9px] uppercase text-slate-400 font-bold">
                  Invoice No
                </p>
                <p className="font-bold text-sm">{billNo}</p>
                <p className="text-[9px] uppercase text-slate-400 font-bold mt-2">
                  Date
                </p>
                <p className="font-medium">{invoiceDate}</p>
              </div>
            </div>
          </div>

          {/* PARTIES */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                Supplier Details
              </p>
              <p className="font-bold text-sm text-slate-900">{supplierName}</p>
              <p className="text-slate-500 mt-1">
                {invoice.supplierBillingAddress || ''}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                Shipping To (Warehouse)
              </p>
              <p className="font-bold text-sm text-slate-900">
                {warehouseName}
              </p>
              <p className="font-bold text-sm text-slate-900">
                {invoice.supplierShippingAddress}
              </p>
              <p className="text-slate-500 mt-1">
                Please deliver all items to the primary docking area.
              </p>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <table className="w-full border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-[#64748b] uppercase text-[9px] tracking-wider">
                <th className="border border-slate-200 p-2 text-center w-8">
                  #
                </th>
                <th className="border border-slate-200 p-2 text-left">
                  Item Description
                </th>
                <th className="border border-slate-200 p-2 text-left">HSN</th>
                <th className="border border-slate-200 p-2 text-right">Qty</th>
                <th className="border border-slate-200 p-2 text-right">Rate</th>
                <th className="border border-slate-200 p-2 text-right">
                  Tax %
                </th>
                <th className="border border-slate-200 p-2 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-2 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-slate-200 p-2 font-medium">
                    {item.itemName}
                  </td>
                  <td className="border border-slate-200 p-2 text-slate-500">
                    {item.hsnCode || '—'}
                  </td>
                  <td className="border border-slate-200 p-2 text-right">
                    {safe(item.qty)} {item.unitName || ''}
                  </td>
                  <td className="border border-slate-200 p-2 text-right">
                    {safe(item.rate).toFixed(2)}
                  </td>
                  <td className="border border-slate-200 p-2 text-right">
                    {item.taxRate}%
                  </td>
                  <td className="border border-slate-200 p-2 text-right font-bold text-slate-900">
                    ₹{safe(item.totalAmount).toFixed(2)}{' '}
                    {/* ← totalAmount not total */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* FOOTER: GST summary + totals */}
          <div className="mt-6 grid grid-cols-2 gap-8">
            {/* GST Summary */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                GST Tax Summary
              </p>
              <table className="w-full border-collapse border border-slate-200 text-[10px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 p-1 text-left">
                      Rate
                    </th>
                    <th className="border border-slate-200 p-1 text-right">
                      Taxable
                    </th>
                    <th className="border border-slate-200 p-1 text-right">
                      CGST
                    </th>
                    <th className="border border-slate-200 p-1 text-right">
                      SGST
                    </th>
                    <th className="border border-slate-200 p-1 text-right">
                      IGST
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taxGroups).map(([rate, v]: any) => (
                    <tr key={rate}>
                      <td className="border border-slate-200 p-1">{rate}%</td>
                      <td className="border border-slate-200 p-1 text-right">
                        {v.taxable.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-1 text-right">
                        {v.cgst.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-1 text-right">
                        {v.sgst.toFixed(2)}
                      </td>
                      <td className="border border-slate-200 p-1 text-right">
                        {v.igst.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Amount in Words
                </p>
                <p className="italic font-medium text-indigo-900">
                  {amountInWords(grandTotal)}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 p-4 border-2 border-slate-100 rounded-lg">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Total Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Taxable Amount</span>
                <span>₹{safe(invoice.taxableAmount).toFixed(2)}</span>
              </div>
              {totalCGST > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>CGST</span>
                  <span>₹{totalCGST.toFixed(2)}</span>
                </div>
              )}
              {totalSGST > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>SGST</span>
                  <span>₹{totalSGST.toFixed(2)}</span>
                </div>
              )}
              {totalIGST > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>IGST</span>
                  <span>₹{totalIGST.toFixed(2)}</span>
                </div>
              )}
              {safe(invoice.roundOff) !== 0 && (
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>Round Off</span>
                  <span>₹{safe(invoice.roundOff).toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-slate-200 my-1" />
              <div className="flex justify-between text-lg font-black text-indigo-600">
                <span>GRAND TOTAL</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Payment Status</span>
                <span
                  className={
                    invoice.paymentStatus === 'UNPAID'
                      ? 'text-red-500 font-bold'
                      : 'text-green-600 font-bold'
                  }
                >
                  {invoice.paymentStatus}
                </span>
              </div>
              {safe(invoice.balanceDue) > 0 && (
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Balance Due</span>
                  <span>₹{safe(invoice.balanceDue).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* SIGNATURE */}
          <div className="mt-12 flex justify-between items-end">
            <div className="text-center border-t border-slate-300 pt-2 w-40">
              <p className="text-[9px] uppercase font-bold text-slate-400">
                Receiver's Signature
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] mb-8 font-bold">For {company.name}</p>
              <div className="border-t border-slate-300 pt-2 w-48">
                <p className="text-[9px] uppercase font-bold text-slate-400">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
