export interface InvoiceLineItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  unitId: string;
  rate: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  /** Category-level narration (e.g. Serial/IMEI for Electronics) */
  narration?: string;
  /** categoryId for narration requirement lookup */
  categoryId?: string;
  currentStock?: number;
}
/** Purchase Invoice row — two-tab entry system */
export interface PurchaseRow {
  id: string;
  // ── Purchase Details tab ──
  companyBarcode: string;
  itemId: string;
  itemName: string;
  size: string;
  hsnCode: string;
  taxRate: number;
  group: string;
  brand: string;
  articleNo: string;
  color: string;
  markUpPct: number;
  // ── Item Details tab ──
  unitName: string;
  nol: string;
  qty: number;
  purRate: number;
  purExpPct: number;
  saleDisPct: number;
  mrp: number;
  saleRate: number;
  amount: number;
  // ── Meta ──
  unit: string;
  unitId: string;
  isKnownItem: boolean;
  barcodeGenerated?: string;
  /** Selling barcode typed in Item Details tab (optional — falls back to companyBarcode) */
  itemBarcode: string;
}

export const emptyPurchaseRow = (): PurchaseRow => ({
  id: crypto.randomUUID(),
  companyBarcode: '',
  itemId: '',
  itemName: '',
  size: '',
  hsnCode: '',
  taxRate: 0,
  group: '',
  brand: '',
  articleNo: '',
  color: '',
  markUpPct: 0,
  unitName: 'Pcs',
  nol: '',
  qty: 1,
  purRate: 0,
  purExpPct: 0,
  saleDisPct: 0,
  mrp: 0,
  saleRate: 0,
  amount: 0,
  unit: 'Pcs',
  unitId: '',
  isKnownItem: false,
  itemBarcode: '',
});

export const calcPurchaseRowAmount = (row: PurchaseRow): number => {
  const effectiveRate = row.purRate * (1 + row.purExpPct / 100);
  return Math.round(row.qty * effectiveRate * 100) / 100;
};

export interface InvoiceTotals {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  grandTotal: number;
}

export type PaymentMode = 'CASH' | 'CREDIT' | 'PARTIAL';

export interface SalesInvoiceFormData {
  customerId: string;
  customerName: string;
  customerStateCode: string;
  warehouseId: string;
  date: string;
  invoiceNo: string;
  billingAddress: string;
  shippingAddress: string;
  paymentMode: PaymentMode;
  amountReceived: number;
  notes: string;
}

export interface PurchaseInvoiceFormData {
  supplierId: string;
  supplierName: string;
  supplierStateCode: string;
  warehouseId: string;
  date: string;
  invoiceNo: string;
  supplierInvoiceNo: string;
  linkedPoId: string;
  notes: string;
}

export interface MockBillRecord {
  id: string;
  billNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  status: 'SAVED' | 'DRAFT' | 'CANCELLED';
  paymentMode?: PaymentMode;
}

export const emptyLineItem = (): InvoiceLineItem => ({
  id: crypto.randomUUID(),
  itemId: '',
  itemCode: '',
  itemName: '',
  hsnCode: '',
  qty: 1,
  unit: 'Pcs',
  unitId: '',
  rate: 0,
  discount: 0,
  taxableAmount: 0,
  taxRate: 18,
  cgst: 0,
  sgst: 0,
  igst: 0,
  total: 0,
  currentStock: 0,
});

export const calcTotals = (items: InvoiceLineItem[]): InvoiceTotals => {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxableAmount = items.reduce((s, i) => s + i.taxableAmount, 0);
  const totalDiscount = Math.round((subtotal - taxableAmount) * 100) / 100;
  const totalCGST = items.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = items.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = items.reduce((s, i) => s + i.igst, 0);
  const raw = taxableAmount + totalCGST + totalSGST + totalIGST;
  const grandTotal = Math.round(raw);
  const roundOff = Math.round((grandTotal - raw) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalIGST: Math.round(totalIGST * 100) / 100,
    roundOff,
    grandTotal,
  };
};
