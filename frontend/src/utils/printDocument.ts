import { mockCompany } from '@/mocks/masters';

export interface PrintLineItem {
  sr: number;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxable: number;
  taxRate: number;
  taxAmt: number;
  total: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface PrintInvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerGstin?: string;
  billingAddress: string;
  shippingAddress?: string;
  paymentMode: string;
  paymentStatus?: string;
  paidAmount?: number;
  balanceDue?: number;
  showPaymentTable?: boolean;
  paymentModes?: Array<{ mode: string; amount: number; status?: string }>;
  remainingDue?: number;
  items: PrintLineItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  isSameState: boolean;
  notes?: string;
}

export interface PrintChallanData {
  challanNo: string;
  date: string;
  customerName: string;
  billingAddress: string;
  vehicleNo?: string;
  driverName?: string;
  lrNo?: string;
  items: Array<{ sr: number; name: string; qty: number; unit: string; rate?: number; amount?: number }>;
}

export interface PrintPOData {
  poNo: string;
  date: string;
  deliveryDate?: string;
  paymentTerms?: string;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress: string;
  items: Array<{ sr: number; name: string; hsn: string; qty: number; unit: string; rate: number; amount: number }>;
  totalAmount: number;
  notes?: string;
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function amountInWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function toWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + toWords(n % 10000000) : '');
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = 'Rupees ' + (toWords(rupees) || 'Zero');
  if (paise > 0) words += ' and ' + toWords(paise) + ' Paise';
  return words + ' Only';
}

function commonStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 10mm; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
    .border-table th, .border-table td { border: 1px solid #e2e8f0; }
    .right { text-align: right; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .section { margin-bottom: 12px; }
    .label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .company-name { font-size: 16px; font-weight: 700; color: #1e293b; }
    .doc-title { font-size: 18px; font-weight: 800; color: #4f46e5; text-align: right; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 4px; }
    .totals-box { float: right; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 8px; }
    .totals-row.grand { background: #4f46e5; color: white; font-weight: 700; font-size: 13px; border-radius: 4px; padding: 8px; margin-top: 4px; }
    .tax-table { margin-top: 12px; clear: both; }
    .amount-words { margin-top: 12px; padding: 8px 12px; background: #f8fafc; border-left: 3px solid #4f46e5; font-style: italic; }
    .bank-details { margin-top: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 4px; }
    .signature { text-align: right; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #64748b; }
    .footer-text { text-align: center; font-style: italic; color: #94a3b8; font-size: 9px; margin-top: 16px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
    @media print { @page { size: A4; margin: 0; } body { padding: 10mm 12mm; } }
  `;
}

export function printSalesInvoice(data: PrintInvoiceData): void {
  const c = mockCompany;
  const taxSlabs = [5, 12, 18, 28].map((rate) => {
    const slabItems = data.items.filter((i) => i.taxRate === rate);
    const taxable = slabItems.reduce((s, i) => s + i.taxable, 0);
    const cgst = taxable * rate / 200;
    const sgst = taxable * rate / 200;
    const igst = taxable * rate / 100;
    return { rate, taxable, cgst, sgst, igst };
  }).filter((s) => s.taxable > 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tax Invoice - ${data.invoiceNo}</title>
  <style>${commonStyles()}</style></head><body>
  <div class="header-grid">
    <div>
      <p class="company-name">${c.name}</p>
      <p style="color:#64748b;margin-top:4px;line-height:1.5">${c.address}</p>
      <p style="margin-top:4px"><strong>GSTIN:</strong> ${c.gstin} &nbsp;|&nbsp; <strong>PAN:</strong> ${c.pan}</p>
      <p><strong>Ph:</strong> ${c.phone} &nbsp;|&nbsp; <strong>Email:</strong> ${c.email}</p>
    </div>
    <div style="text-align:right">
      <p class="doc-title">TAX INVOICE</p>
      <div style="margin-top:10px;display:inline-block;border:1px solid #e2e8f0;padding:8px 12px;border-radius:4px;text-align:left">
        <p class="label">Invoice No</p><p class="bold">${data.invoiceNo}</p>
        <p class="label" style="margin-top:6px">Date</p><p>${data.date}</p>
        <p class="label" style="margin-top:6px">Payment Mode</p><p>${data.paymentMode}</p>
      </div>
    </div>
  </div>
  <div class="address-grid">
    <div>
      <p class="label">Bill To</p>
      <p class="bold" style="margin-top:3px;font-size:12px">${data.customerName}</p>
      ${data.customerGstin ? `<p style="margin-top:2px">GSTIN: ${data.customerGstin}</p>` : ''}
      <p style="margin-top:2px;color:#64748b;line-height:1.5">${data.billingAddress}</p>
    </div>
    <div>
      <p class="label">Ship To</p>
      <p class="bold" style="margin-top:3px;font-size:12px">${data.customerName}</p>
      <p style="margin-top:2px;color:#64748b;line-height:1.5">${data.shippingAddress || data.billingAddress}</p>
    </div>
  </div>
  ${data.showPaymentTable !== false ? `
  <div style="margin-bottom:12px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden">
    <div style="padding:6px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Payment Details</div>
    ${[
      ['Payment Mode', data.paymentMode || '—'],
      ['Payment Status', data.paymentStatus || '—'],
      ['Amount Paid', formatINR(data.paidAmount ?? 0)],
      ['Balance Due', formatINR(data.balanceDue ?? 0)],
    ].map(([label, value]) => `<div style="display:flex;justify-content:space-between;padding:5px 10px;border-bottom:1px solid #f1f5f9"><span style="color:#64748b">${label}</span><span style="font-weight:600">${value}</span></div>`).join('')}
  </div>` : ''}
  <table class="border-table section">
    <thead><tr>
      <th style="width:30px">Sr</th><th>Description</th><th>HSN</th>
      <th class="right">Qty</th><th>Unit</th><th class="right">Rate</th>
      <th class="right">Disc%</th><th class="right">Taxable</th>
      <th class="right">GST%</th><th class="right">Tax Amt</th><th class="right">Total</th>
    </tr></thead>
    <tbody>
      ${data.items.map((item, i) => `<tr style="${i % 2 === 1 ? 'background:#fafafa' : ''}">
        <td class="center">${item.sr}</td>
        <td class="bold">${item.name}</td>
        <td>${item.hsn}</td>
        <td class="right">${item.qty}</td>
        <td>${item.unit}</td>
        <td class="right">${formatINR(item.rate)}</td>
        <td class="right">${item.discount > 0 ? item.discount + '%' : '—'}</td>
        <td class="right">${formatINR(item.taxable)}</td>
        <td class="right">${item.taxRate}%</td>
        <td class="right">${formatINR(item.taxAmt)}</td>
        <td class="right bold">${formatINR(item.total)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;margin-bottom:12px">
    <div>
      <div class="amount-words"><p class="label">Amount in Words</p><p style="margin-top:4px;font-weight:600">${amountInWords(data.grandTotal)}</p></div>
      <div class="bank-details" style="margin-top:10px">
        <p class="label">Bank Details</p>
        <p style="margin-top:4px"><strong>Bank:</strong> HDFC Bank Ltd &nbsp;|&nbsp; <strong>A/C:</strong> 12345678901234</p>
        <p><strong>IFSC:</strong> HDFC0001234 &nbsp;|&nbsp; <strong>Branch:</strong> Baner, Pune</p>
      </div>
    </div>
    <div>
      <div style="border:1px solid #e2e8f0;border-radius:4px;overflow:hidden">
        ${[
          ['Subtotal', formatINR(data.subtotal)],
          ['Total Discount', data.totalDiscount > 0 ? `- ${formatINR(data.totalDiscount)}` : '—'],
          ['Taxable Amount', formatINR(data.taxableAmount)],
          ...(data.isSameState ? [
            ['CGST', formatINR(data.cgst)],
            ['SGST', formatINR(data.sgst)],
          ] : [
            ['IGST', formatINR(data.igst)],
          ]),
          ['Round Off', data.roundOff !== 0 ? (data.roundOff > 0 ? `+ ${formatINR(data.roundOff)}` : `- ${formatINR(Math.abs(data.roundOff))}`) : '—'],
        ].map(([label, value]) => `<div style="display:flex;justify-content:space-between;padding:5px 10px;border-bottom:1px solid #f1f5f9"><span style="color:#64748b">${label}</span><span>${value}</span></div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:8px 10px;background:#4f46e5;color:white;font-weight:700;font-size:13px">
          <span>Grand Total</span><span>${formatINR(data.grandTotal)}</span>
        </div>
      </div>
    </div>
  </div>
  ${taxSlabs.length > 0 ? `
  <div class="tax-table">
    <p class="label" style="margin-bottom:6px">Tax Summary (Rate-wise Breakup)</p>
    <table class="border-table" style="width:auto">
      <thead><tr><th>GST Rate</th><th class="right">Taxable Amount</th>${data.isSameState ? '<th class="right">CGST</th><th class="right">SGST</th>' : '<th class="right">IGST</th>'}</tr></thead>
      <tbody>${taxSlabs.map((s) => `<tr><td>${s.rate}%</td><td class="right">${formatINR(s.taxable)}</td>${data.isSameState ? `<td class="right">${formatINR(s.cgst)}</td><td class="right">${formatINR(s.sgst)}</td>` : `<td class="right">${formatINR(s.igst)}</td>`}</tr>`).join('')}</tbody>
    </table>
  </div>` : ''}
  ${data.notes ? `<p style="margin-top:10px;font-size:10px;color:#64748b"><strong>Notes:</strong> ${data.notes}</p>` : ''}
  <div class="signature">
    <p style="font-weight:600">${c.name}</p>
    <p style="margin-top:4px">Authorised Signatory</p>
  </div>
  <p class="footer-text">This is a computer generated invoice. No signature required if digitally signed.</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function printChallan(data: PrintChallanData): void {
  const c = mockCompany;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Delivery Challan - ${data.challanNo}</title>
  <style>${commonStyles()}</style></head><body>
  <div class="header-grid">
    <div>
      <p class="company-name">${c.name}</p>
      <p style="color:#64748b;margin-top:4px;line-height:1.5">${c.address}</p>
      <p style="margin-top:4px"><strong>GSTIN:</strong> ${c.gstin} &nbsp;|&nbsp; <strong>Ph:</strong> ${c.phone}</p>
    </div>
    <div style="text-align:right">
      <p class="doc-title">DELIVERY CHALLAN</p>
      <div style="margin-top:10px;display:inline-block;border:1px solid #e2e8f0;padding:8px 12px;border-radius:4px;text-align:left">
        <p class="label">Challan No</p><p class="bold">${data.challanNo}</p>
        <p class="label" style="margin-top:6px">Date</p><p>${data.date}</p>
        ${data.vehicleNo ? `<p class="label" style="margin-top:6px">Vehicle No</p><p>${data.vehicleNo}</p>` : ''}
        ${data.lrNo ? `<p class="label" style="margin-top:6px">LR No</p><p>${data.lrNo}</p>` : ''}
      </div>
    </div>
  </div>
  <div class="address-grid">
    <div>
      <p class="label">Consignee (To)</p>
      <p class="bold" style="margin-top:3px;font-size:12px">${data.customerName}</p>
      <p style="margin-top:2px;color:#64748b;line-height:1.5">${data.billingAddress}</p>
    </div>
    ${data.driverName ? `<div><p class="label">Driver Details</p><p class="bold" style="margin-top:3px">${data.driverName}</p>${data.vehicleNo ? `<p>Vehicle: ${data.vehicleNo}</p>` : ''}</div>` : ''}
  </div>
  <table class="border-table section">
    <thead><tr>
      <th style="width:30px">Sr</th><th>Description</th><th class="right">Qty</th><th>Unit</th>
      ${data.items.some((i) => i.rate) ? '<th class="right">Rate</th><th class="right">Amount</th>' : ''}
    </tr></thead>
    <tbody>
      ${data.items.map((item, i) => `<tr style="${i % 2 === 1 ? 'background:#fafafa' : ''}">
        <td class="center">${item.sr}</td><td class="bold">${item.name}</td>
        <td class="right">${item.qty}</td><td>${item.unit}</td>
        ${data.items.some((i2) => i2.rate) ? `<td class="right">${item.rate ? formatINR(item.rate) : '—'}</td><td class="right">${item.amount ? formatINR(item.amount) : '—'}</td>` : ''}
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px">
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p>Receiver's Signature &amp; Stamp</p>
      <p style="margin-top:4px">Date: ________________</p>
    </div>
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p class="bold" style="font-size:11px">${c.name}</p>
      <p style="margin-top:4px">Authorised Signatory</p>
    </div>
  </div>
  <p class="footer-text">This is a computer generated delivery challan.</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function printPurchaseOrder(data: PrintPOData): void {
  const c = mockCompany;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Order - ${data.poNo}</title>
  <style>${commonStyles()}</style></head><body>
  <div class="header-grid">
    <div>
      <p class="company-name">${c.name}</p>
      <p style="color:#64748b;margin-top:4px;line-height:1.5">${c.address}</p>
      <p style="margin-top:4px"><strong>GSTIN:</strong> ${c.gstin} &nbsp;|&nbsp; <strong>Ph:</strong> ${c.phone}</p>
    </div>
    <div style="text-align:right">
      <p class="doc-title">PURCHASE ORDER</p>
      <div style="margin-top:10px;display:inline-block;border:1px solid #e2e8f0;padding:8px 12px;border-radius:4px;text-align:left">
        <p class="label">PO No</p><p class="bold">${data.poNo}</p>
        <p class="label" style="margin-top:6px">PO Date</p><p>${data.date}</p>
        ${data.deliveryDate ? `<p class="label" style="margin-top:6px">Delivery By</p><p>${data.deliveryDate}</p>` : ''}
        ${data.paymentTerms ? `<p class="label" style="margin-top:6px">Payment Terms</p><p>${data.paymentTerms}</p>` : ''}
      </div>
    </div>
  </div>
  <div class="address-grid">
    <div>
      <p class="label">Vendor (To)</p>
      <p class="bold" style="margin-top:3px;font-size:12px">${data.supplierName}</p>
      ${data.supplierGstin ? `<p style="margin-top:2px">GSTIN: ${data.supplierGstin}</p>` : ''}
      <p style="margin-top:2px;color:#64748b;line-height:1.5">${data.supplierAddress}</p>
    </div>
    <div>
      <p class="label">Ship To (Delivery Address)</p>
      <p class="bold" style="margin-top:3px;font-size:12px">${c.name}</p>
      <p style="margin-top:2px;color:#64748b;line-height:1.5">${c.address}</p>
    </div>
  </div>
  <table class="border-table section">
    <thead><tr>
      <th style="width:30px">Sr</th><th>Item Description</th><th>HSN Code</th>
      <th class="right">Qty</th><th>Unit</th><th class="right">Rate</th><th class="right">Amount</th>
    </tr></thead>
    <tbody>
      ${data.items.map((item, i) => `<tr style="${i % 2 === 1 ? 'background:#fafafa' : ''}">
        <td class="center">${item.sr}</td><td class="bold">${item.name}</td>
        <td>${item.hsn}</td><td class="right">${item.qty}</td><td>${item.unit}</td>
        <td class="right">${formatINR(item.rate)}</td><td class="right bold">${formatINR(item.amount)}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot><tr style="background:#f8fafc;font-weight:700">
      <td colspan="6" class="right">Total Amount</td><td class="right">${formatINR(data.totalAmount)}</td>
    </tr></tfoot>
  </table>
  ${data.notes ? `<div style="margin-top:10px;padding:8px 12px;background:#f8fafc;border-left:3px solid #4f46e5"><p class="label">Terms &amp; Conditions</p><p style="margin-top:4px">${data.notes}</p></div>` : ''}
  <div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:4px">
    <p class="label">Important Notes</p>
    <p style="margin-top:4px">1. Please acknowledge receipt of this PO within 24 hours. 2. Mention PO number on all invoices and delivery documents. 3. Goods must match specifications. 4. No partial delivery without prior approval.</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:40px">
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p>Vendor's Acceptance</p>
      <p style="margin-top:4px">Date: ________________</p>
    </div>
    <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;font-size:10px;color:#64748b">
      <p class="bold" style="font-size:11px">${c.name}</p>
      <p style="margin-top:4px">Authorised Signatory (Purchase)</p>
    </div>
  </div>
  <p class="footer-text">This is a computer generated purchase order.</p>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}
