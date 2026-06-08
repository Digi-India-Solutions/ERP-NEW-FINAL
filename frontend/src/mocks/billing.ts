import type { MockBillRecord } from '@/types/billing';

// ─── Sales Invoice Detail Item ────────────────────────────────────────────────
export interface MockSalesInvoiceItem {
  id: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

function calcItem(itemName: string, hsnCode: string, qty: number, unit: string, rate: number, discount: number, taxRate: number, isSameState: boolean): MockSalesInvoiceItem {
  const grossAmt = qty * rate;
  const discAmt = Math.round(grossAmt * discount / 100 * 100) / 100;
  const taxable = Math.round((grossAmt - discAmt) * 100) / 100;
  const taxAmt = Math.round(taxable * taxRate / 100 * 100) / 100;
  const halfTax = Math.round(taxAmt / 2 * 100) / 100;
  return {
    id: crypto.randomUUID(),
    itemName, hsnCode, qty, unit, rate, discount, taxRate,
    taxableAmount: taxable,
    cgst: isSameState ? halfTax : 0,
    sgst: isSameState ? halfTax : 0,
    igst: isSameState ? 0 : taxAmt,
    total: Math.round((taxable + taxAmt) * 100) / 100,
  };
}

function buildInvoiceTotals(items: MockSalesInvoiceItem[]) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxableAmount = items.reduce((s, i) => s + i.taxableAmount, 0);
  const totalDiscount = Math.round((subtotal - taxableAmount) * 100) / 100;
  const totalCGST = items.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = items.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = items.reduce((s, i) => s + i.igst, 0);
  const raw = taxableAmount + totalCGST + totalSGST + totalIGST;
  const grandTotal = Math.round(raw);
  const roundOff = Math.round((grandTotal - raw) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, totalDiscount, taxableAmount: Math.round(taxableAmount * 100) / 100, totalCGST: Math.round(totalCGST * 100) / 100, totalSGST: Math.round(totalSGST * 100) / 100, totalIGST: Math.round(totalIGST * 100) / 100, roundOff, grandTotal };
}

const si001Items = [
  calcItem('Tata Salt 1kg', '2501', 10, 'Pcs', 22, 0, 0, true),
  calcItem('Tata Tea Premium 500g', '0902', 5, 'Pcs', 152, 5, 5, true),
  calcItem('Surf Excel 1kg', '3402', 3, 'Pcs', 210, 0, 18, true),
  calcItem('Dove Soap 100g', '3401', 12, 'Pcs', 58, 0, 18, true),
];
const si001T = buildInvoiceTotals(si001Items);

const si002Items = [
  calcItem('Ariel Matic 2kg', '3402', 8, 'Pcs', 390, 5, 18, true),
  calcItem('Colgate Max Fresh 150g', '3306', 20, 'Pcs', 84, 0, 12, true),
];
const si002T = buildInvoiceTotals(si002Items);

const si003Items = [
  calcItem('Maggi 2-Minute Noodles', '1902', 50, 'Pcs', 15, 0, 12, false),
  calcItem('Good Day Butter 200g', '1905', 24, 'Pcs', 36, 0, 5, false),
  calcItem('Fortune Sunflower Oil 1L', '1512', 15, 'Btl', 162, 2, 5, false),
  calcItem('Clinic Plus Shampoo 80ml', '3305', 30, 'Pcs', 54, 0, 18, false),
  calcItem('Tata Salt 1kg', '2501', 100, 'Pcs', 22, 0, 0, false),
  calcItem('Tata Tea Premium 500g', '0902', 40, 'Pcs', 152, 3, 5, false),
  calcItem('Surf Excel 1kg', '3402', 20, 'Pcs', 210, 0, 18, false),
];
const si003T = buildInvoiceTotals(si003Items);

const si004Items = [
  calcItem('Surf Excel 1kg', '3402', 6, 'Pcs', 210, 0, 18, true),
  calcItem('Ariel Matic 2kg', '3402', 4, 'Pcs', 390, 5, 18, true),
  calcItem('Colgate Max Fresh 150g', '3306', 10, 'Pcs', 84, 0, 12, true),
];
const si004T = buildInvoiceTotals(si004Items);

const si005Items = [
  calcItem('Fortune Sunflower Oil 1L', '1512', 24, 'Btl', 162, 0, 5, true),
  calcItem('Clinic Plus Shampoo 80ml', '3305', 48, 'Pcs', 54, 0, 18, true),
  calcItem('Maggi 2-Minute Noodles', '1902', 100, 'Pcs', 15, 0, 12, true),
  calcItem('Good Day Butter 200g', '1905', 36, 'Pcs', 36, 0, 5, true),
  calcItem('Tata Salt 1kg', '2501', 50, 'Pcs', 22, 0, 0, true),
];
const si005T = buildInvoiceTotals(si005Items);

const si006Items = [
  calcItem('Dove Soap 100g', '3401', 20, 'Pcs', 58, 0, 18, true),
];
const si006T = buildInvoiceTotals(si006Items);

const si007Items = [
  calcItem('Tata Tea Premium 500g', '0902', 60, 'Pcs', 152, 0, 5, true),
  calcItem('Dove Soap 100g', '3401', 80, 'Pcs', 58, 0, 18, true),
  calcItem('Colgate Max Fresh 150g', '3306', 40, 'Pcs', 84, 0, 12, true),
  calcItem('Surf Excel 1kg', '3402', 30, 'Pcs', 210, 5, 18, true),
  calcItem('Ariel Matic 2kg', '3402', 20, 'Pcs', 390, 0, 18, true),
  calcItem('Maggi 2-Minute Noodles', '1902', 120, 'Pcs', 15, 0, 12, true),
];
const si007T = buildInvoiceTotals(si007Items);

export interface MockSalesInvoiceDetail extends MockBillRecord {
  customerId: string;
  customerGstin?: string;
  billingAddress: string;
  shippingAddress?: string;
  isSameState: boolean;
  items: MockSalesInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  hasChallan?: boolean;
  /** Payment tracking */
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
  paidAmount?: number;
  balanceDue?: number;
  creditAdjustment?: number;
}

export const mockSalesInvoices: MockSalesInvoiceDetail[] = [
  { id: 'si-001', billNo: 'INV-2024-001', date: '2024-03-18', partyName: 'Ramesh Traders', warehouseName: 'Main Warehouse', itemCount: si001Items.length, grandTotal: si001T.grandTotal, status: 'SAVED', paymentMode: 'CASH', customerId: 'pty-001', customerGstin: '27AABCT1332L1ZT', billingAddress: '45, MG Road, Pune 411001, Maharashtra', shippingAddress: '45, MG Road, Pune 411001, Maharashtra', isSameState: true, items: si001Items, ...si001T, hasChallan: false, paymentStatus: 'PAID', paidAmount: si001T.grandTotal, balanceDue: 0 },
  { id: 'si-002', billNo: 'INV-2024-002', date: '2024-03-17', partyName: 'Sunrise Electronics', warehouseName: 'Main Warehouse', itemCount: si002Items.length, grandTotal: si002T.grandTotal, status: 'SAVED', paymentMode: 'CREDIT', customerId: 'pty-002', customerGstin: '27AABCS5432M1ZP', billingAddress: 'B-24, Sector 18, Noida 201301, UP', shippingAddress: 'B-24, Sector 18, Noida 201301, UP', isSameState: false, items: si002Items, ...si002T, hasChallan: false, paymentStatus: 'UNPAID', paidAmount: 0, balanceDue: si002T.grandTotal },
  { id: 'si-003', billNo: 'INV-2024-003', date: '2024-03-16', partyName: 'Delhi Distributors', warehouseName: 'East Branch', itemCount: si003Items.length, grandTotal: si003T.grandTotal, status: 'SAVED', paymentMode: 'PARTIAL', customerId: 'pty-003', customerGstin: '07AABCD1234E1ZK', billingAddress: '78 Chandni Chowk, Delhi 110006', shippingAddress: 'Warehouse 4, Okhla Industrial Area, Delhi 110020', isSameState: false, items: si003Items, ...si003T, hasChallan: true, paymentStatus: 'PARTIAL', paidAmount: 10000, balanceDue: si003T.grandTotal - 10000 },
  { id: 'si-004', billNo: 'INV-2024-004', date: '2024-03-15', partyName: 'Kumar & Sons', warehouseName: 'Main Warehouse', itemCount: si004Items.length, grandTotal: si004T.grandTotal, status: 'SAVED', paymentMode: 'CASH', customerId: 'pty-004', billingAddress: '7, Laxmi Road, Pune 411030, Maharashtra', isSameState: true, items: si004Items, ...si004T, hasChallan: false, paymentStatus: 'UNPAID', paidAmount: 0, balanceDue: si004T.grandTotal },
  { id: 'si-005', billNo: 'INV-2024-005', date: '2024-03-14', partyName: 'Metro Retailers', warehouseName: 'West Godown', itemCount: si005Items.length, grandTotal: si005T.grandTotal, status: 'SAVED', paymentMode: 'CREDIT', customerId: 'pty-005', customerGstin: '29AABCM9876F1ZR', billingAddress: '23 Brigade Road, Bengaluru 560001, Karnataka', isSameState: false, items: si005Items, ...si005T, hasChallan: false, paymentStatus: 'UNPAID', paidAmount: 0, balanceDue: si005T.grandTotal },
  { id: 'si-006', billNo: 'INV-2024-006', date: '2024-03-13', partyName: 'Patel Stores', warehouseName: 'Main Warehouse', itemCount: si006Items.length, grandTotal: si006T.grandTotal, status: 'CANCELLED', paymentMode: 'CASH', customerId: 'pty-006', billingAddress: '12, FC Road, Pune 411004, Maharashtra', isSameState: true, items: si006Items, ...si006T, hasChallan: false, paymentStatus: 'PAID', paidAmount: si006T.grandTotal, balanceDue: 0 },
  { id: 'si-007', billNo: 'INV-2024-007', date: '2024-03-12', partyName: 'Gupta Wholesale', warehouseName: 'East Branch', itemCount: si007Items.length, grandTotal: si007T.grandTotal, status: 'SAVED', paymentMode: 'CREDIT', customerId: 'pty-007', customerGstin: '27AABCG7654H1ZM', billingAddress: 'Plot 88, MIDC Bhosari, Pune 411026, Maharashtra', isSameState: true, items: si007Items, ...si007T, hasChallan: false, paymentStatus: 'UNPAID', paidAmount: 0, balanceDue: si007T.grandTotal },
];

// ─── Purchase Invoice Item ────────────────────────────────────────────────────
export interface MockPurchaseInvoiceItem {
  id: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface MockPurchaseInvoiceDetail extends MockBillRecord {
  supplierInvoiceNo: string;
  supplierId: string;
  supplierGstin?: string;
  supplierAddress: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  isSameState: boolean;
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  items: MockPurchaseInvoiceItem[];
  paidAmount?: number;
  balanceDue?: number;
  creditAdjustment?: number;
}

function calcPurchaseItem(itemName: string, hsnCode: string, qty: number, unit: string, rate: number, discount: number, taxRate: number, isSameState: boolean): MockPurchaseInvoiceItem {
  const grossAmt = qty * rate;
  const discAmt = Math.round(grossAmt * discount / 100 * 100) / 100;
  const taxable = Math.round((grossAmt - discAmt) * 100) / 100;
  const taxAmt = Math.round(taxable * taxRate / 100 * 100) / 100;
  const halfTax = Math.round(taxAmt / 2 * 100) / 100;
  return {
    id: crypto.randomUUID(),
    itemName, hsnCode, qty, unit, rate, discount, taxRate,
    taxableAmount: taxable,
    cgst: isSameState ? halfTax : 0,
    sgst: isSameState ? halfTax : 0,
    igst: isSameState ? 0 : taxAmt,
    total: Math.round((taxable + taxAmt) * 100) / 100,
  };
}

function buildPurchaseTotals(items: MockPurchaseInvoiceItem[]) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxableAmount = items.reduce((s, i) => s + i.taxableAmount, 0);
  const totalDiscount = Math.round((subtotal - taxableAmount) * 100) / 100;
  const totalCGST = items.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = items.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = items.reduce((s, i) => s + i.igst, 0);
  const raw = taxableAmount + totalCGST + totalSGST + totalIGST;
  const grandTotal = Math.round(raw);
  const roundOff = Math.round((grandTotal - raw) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, totalDiscount, taxableAmount: Math.round(taxableAmount * 100) / 100, totalCGST: Math.round(totalCGST * 100) / 100, totalSGST: Math.round(totalSGST * 100) / 100, totalIGST: Math.round(totalIGST * 100) / 100, roundOff, grandTotal };
}

// ─── Extended purchase item with itemId for price history lookup ──────────────
export interface MockPurchaseInvoiceItemWithId extends MockPurchaseInvoiceItem {
  itemId?: string;
}

function calcPurchaseItemWithId(itemId: string, itemName: string, hsnCode: string, qty: number, unit: string, rate: number, discount: number, taxRate: number, isSameState: boolean): MockPurchaseInvoiceItemWithId {
  const base = calcPurchaseItem(itemName, hsnCode, qty, unit, rate, discount, taxRate, isSameState);
  return { ...base, itemId };
}

const pi001Items = [
  calcPurchaseItemWithId('itm-001', 'Laptop 15" Core i7', '84713010', 10, 'Pcs', 68000, 0, 18, true),
  calcPurchaseItemWithId('itm-002', 'Wireless Mouse Logitech M235', '84716060', 50, 'Pcs', 780, 2, 18, true),
  calcPurchaseItemWithId('itm-004', 'Mechanical Keyboard RGB', '84716060', 20, 'Pcs', 5100, 0, 18, true),
  calcPurchaseItemWithId('itm-009', 'SSD 1TB NVMe Samsung', '84717010', 30, 'Pcs', 6200, 0, 18, true),
];
const pi001T = buildPurchaseTotals(pi001Items);

const pi002Items = [
  calcPurchaseItemWithId('itm-003', 'USB-C 7-in-1 Hub', '85444290', 25, 'Pcs', 1100, 0, 18, true),
  calcPurchaseItemWithId('itm-005', 'Monitor 24" Full HD IPS', '85285200', 15, 'Pcs', 11500, 0, 18, true),
  calcPurchaseItemWithId('itm-010', 'RAM 16GB DDR5 3200MHz', '84717010', 40, 'Pcs', 4600, 0, 18, true),
  calcPurchaseItemWithId('itm-008', 'Network Switch 8-Port', '85176200', 10, 'Pcs', 3000, 0, 18, true),
  calcPurchaseItemWithId('itm-007', 'HDMI Cable 2m v2.0', '85444290', 100, 'Pcs', 140, 0, 18, true),
];
const pi002T = buildPurchaseTotals(pi002Items);

const pi003Items = [
  calcPurchaseItemWithId('itm-006', 'Laptop Bag 15.6" Waterproof', '42021200', 30, 'Pcs', 750, 0, 12, false),
  calcPurchaseItemWithId('itm-011', 'Webcam 1080p with Mic', '85258090', 20, 'Pcs', 1700, 0, 18, false),
  calcPurchaseItemWithId('itm-012', 'Wi-Fi 6 Router AX1800', '85176200', 12, 'Pcs', 4000, 0, 18, false),
  calcPurchaseItemWithId('itm-009', 'SSD 1TB NVMe Samsung', '84717010', 20, 'Pcs', 6400, 0, 18, false),
];
const pi003T = buildPurchaseTotals(pi003Items);

const pi004Items = [
  calcPurchaseItemWithId('itm-001', 'Laptop 15" Core i7', '84713010', 5, 'Pcs', 70010, 0, 18, true),
  calcPurchaseItemWithId('itm-002', 'Wireless Mouse Logitech M235', '84716060', 30, 'Pcs', 820, 0, 18, true),
  calcPurchaseItemWithId('itm-004', 'Mechanical Keyboard RGB', '84716060', 15, 'Pcs', 5300, 0, 18, true),
  calcPurchaseItemWithId('itm-010', 'RAM 16GB DDR5 3200MHz', '84717010', 25, 'Pcs', 4700, 0, 18, true),
];
const pi004T = buildPurchaseTotals(pi004Items);

const pi005Items = [
  calcPurchaseItemWithId('itm-003', 'USB-C 7-in-1 Hub', '85444290', 20, 'Pcs', 1150, 0, 18, true),
  calcPurchaseItemWithId('itm-005', 'Monitor 24" Full HD IPS', '85285200', 10, 'Pcs', 11800, 0, 18, true),
  calcPurchaseItemWithId('itm-007', 'HDMI Cable 2m v2.0', '85444290', 80, 'Pcs', 145, 0, 18, true),
  calcPurchaseItemWithId('itm-008', 'Network Switch 8-Port', '85176200', 8, 'Pcs', 3100, 0, 18, true),
  calcPurchaseItemWithId('itm-011', 'Webcam 1080p with Mic', '85258090', 15, 'Pcs', 1750, 0, 18, true),
  calcPurchaseItemWithId('itm-012', 'Wi-Fi 6 Router AX1800', '85176200', 10, 'Pcs', 4100, 0, 18, true),
];
const pi005T = buildPurchaseTotals(pi005Items);

export const mockPurchaseInvoices: MockPurchaseInvoiceDetail[] = [
  {
    id: 'pi-001', billNo: 'PINV-2024-001', date: '2024-01-18', partyName: 'TechSupply Co.',
    warehouseName: 'Main Warehouse', itemCount: pi001Items.length, grandTotal: pi001T.grandTotal, status: 'SAVED',
    supplierInvoiceNo: 'TSC/2024/0118', supplierId: 'pty-002', supplierGstin: '27AAACT2727Q1ZW',
    supplierAddress: 'TechSupply Co., 45 Industrial Area, Pune 411019, Maharashtra',
    paymentStatus: 'PAID', isSameState: true, items: pi001Items as MockPurchaseInvoiceItem[], ...pi001T,
    paidAmount: pi001T.grandTotal, balanceDue: 0,
  },
  {
    id: 'pi-002', billNo: 'PINV-2024-002', date: '2024-02-10', partyName: 'NexGen Components',
    warehouseName: 'Main Warehouse', itemCount: pi002Items.length, grandTotal: pi002T.grandTotal, status: 'SAVED',
    supplierInvoiceNo: 'NGC/2024/0210', supplierId: 'pty-005', supplierGstin: '19AAACI1234A1Z5',
    supplierAddress: 'NexGen Components, B-12 Tech Park, Bengaluru 560001, Karnataka',
    paymentStatus: 'UNPAID', isSameState: false, items: pi002Items as MockPurchaseInvoiceItem[], ...pi002T,
    paidAmount: 0, balanceDue: pi002T.grandTotal,
  },
  {
    id: 'pi-003', billNo: 'PINV-2024-003', date: '2024-02-20', partyName: 'NexGen Components',
    warehouseName: 'East Branch', itemCount: pi003Items.length, grandTotal: pi003T.grandTotal, status: 'SAVED',
    supplierInvoiceNo: 'NGC/2024/0220', supplierId: 'pty-005', supplierGstin: '19AAACI1234A1Z5',
    supplierAddress: 'NexGen Components, B-12 Tech Park, Bengaluru 560001, Karnataka',
    paymentStatus: 'PARTIAL', isSameState: false, items: pi003Items as MockPurchaseInvoiceItem[], ...pi003T,
    paidAmount: 100000, balanceDue: pi003T.grandTotal - 100000,
  },
  {
    id: 'pi-004', billNo: 'PINV-2024-004', date: '2024-03-05', partyName: 'TechSupply Co.',
    warehouseName: 'West Godown', itemCount: pi004Items.length, grandTotal: pi004T.grandTotal, status: 'SAVED',
    supplierInvoiceNo: 'TSC/2024/0305', supplierId: 'pty-002', supplierGstin: '27AAACT2727Q1ZW',
    supplierAddress: 'TechSupply Co., 45 Industrial Area, Pune 411019, Maharashtra',
    paymentStatus: 'PAID', isSameState: true, items: pi004Items as MockPurchaseInvoiceItem[], ...pi004T,
    paidAmount: pi004T.grandTotal, balanceDue: 0,
  },
  {
    id: 'pi-005', billNo: 'PINV-2024-005', date: '2024-03-20', partyName: 'NexGen Components',
    warehouseName: 'Main Warehouse', itemCount: pi005Items.length, grandTotal: pi005T.grandTotal, status: 'SAVED',
    supplierInvoiceNo: 'NGC/2024/0320', supplierId: 'pty-005', supplierGstin: '19AAACI1234A1Z5',
    supplierAddress: 'NexGen Components, B-12 Tech Park, Bengaluru 560001, Karnataka',
    paymentStatus: 'UNPAID', isSameState: false, items: pi005Items as MockPurchaseInvoiceItem[], ...pi005T,
    paidAmount: 0, balanceDue: pi005T.grandTotal,
  },
];

// ─── Sale Return Detail ───────────────────────────────────────────────────────
export interface MockSaleReturnItem {
  id: string;
  itemName: string;
  hsnCode: string;
  returnQty: number;
  unit: string;
  rate: number;
  amount: number;
  reason: string;
}

export interface MockSaleReturnDetail extends MockBillRecord {
  originalInvoiceId: string;
  originalInvoiceNo: string;
  items: MockSaleReturnItem[];
  paymentHandled?: boolean;
  paymentType?: 'refund' | 'credit' | null;
  refundId?: string | null;
}

export const mockSaleReturns: MockSaleReturnDetail[] = [
  {
    id: 'sr-001', billNo: 'SRTN-2024-001', date: '2024-03-16', partyName: 'Ramesh Traders',
    warehouseName: 'Main Warehouse', itemCount: 2, grandTotal: 8840, status: 'SAVED',
    originalInvoiceId: 'si-001', originalInvoiceNo: 'INV-2024-001',
    paymentHandled: true, paymentType: 'refund', refundId: 'rg-001',
    items: [
      { id: 'sri-001', itemName: 'Surf Excel 1kg', hsnCode: '3402', returnQty: 2, unit: 'Pcs', rate: 210, amount: 420, reason: 'Damaged packaging' },
      { id: 'sri-002', itemName: 'Dove Soap 100g', hsnCode: '3401', returnQty: 5, unit: 'Pcs', rate: 58, amount: 290, reason: 'Wrong item delivered' },
    ],
  },
  {
    id: 'sr-002', billNo: 'SRTN-2024-002', date: '2024-03-14', partyName: 'Kumar & Sons',
    warehouseName: 'Main Warehouse', itemCount: 1, grandTotal: 4200, status: 'SAVED',
    originalInvoiceId: 'si-004', originalInvoiceNo: 'INV-2024-004',
    paymentHandled: true, paymentType: 'credit', refundId: null,
    items: [
      { id: 'sri-003', itemName: 'Ariel Matic 2kg', hsnCode: '3402', returnQty: 4, unit: 'Pcs', rate: 390, amount: 1560, reason: 'Expired product' },
    ],
  },
  {
    id: 'sr-003', billNo: 'SRTN-2024-003', date: '2024-03-19', partyName: 'Metro Retailers',
    warehouseName: 'West Godown', itemCount: 3, grandTotal: 6240, status: 'SAVED',
    originalInvoiceId: 'si-005', originalInvoiceNo: 'INV-2024-005',
    paymentHandled: false, paymentType: null, refundId: null,
    items: [
      { id: 'sri-004', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', returnQty: 6, unit: 'Btl', rate: 162, amount: 972, reason: 'Leaking bottles' },
      { id: 'sri-005', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', returnQty: 10, unit: 'Pcs', rate: 54, amount: 540, reason: 'Damaged packaging' },
      { id: 'sri-006', itemName: 'Tata Salt 1kg', hsnCode: '2501', returnQty: 20, unit: 'Pcs', rate: 22, amount: 440, reason: 'Excess quantity ordered' },
    ],
  },
  {
    id: 'sr-004', billNo: 'SRTN-2024-004', date: '2024-03-20', partyName: 'Gupta Wholesale',
    warehouseName: 'East Branch', itemCount: 2, grandTotal: 9720, status: 'SAVED',
    originalInvoiceId: 'si-007', originalInvoiceNo: 'INV-2024-007',
    paymentHandled: false, paymentType: null, refundId: null,
    items: [
      { id: 'sri-007', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', returnQty: 15, unit: 'Pcs', rate: 152, amount: 2280, reason: 'Quality issue' },
      { id: 'sri-008', itemName: 'Surf Excel 1kg', hsnCode: '3402', returnQty: 10, unit: 'Pcs', rate: 210, amount: 2100, reason: 'Wrong item delivered' },
    ],
  },
];

// ─── Purchase Return Detail ───────────────────────────────────────────────────
export interface MockPurchaseReturnItem {
  id: string;
  itemName: string;
  hsnCode: string;
  returnQty: number;
  unit: string;
  rate: number;
  amount: number;
  reason: string;
}

export interface MockPurchaseReturnDetail extends MockBillRecord {
  originalInvoiceId: string;
  originalInvoiceNo: string;
  supplierId: string;
  items: MockPurchaseReturnItem[];
  paymentHandled?: boolean;
  paymentType?: 'refund' | 'credit' | null;
  refundId?: string | null;
}

export const mockPurchaseReturns: MockPurchaseReturnDetail[] = [];

// export const mockPurchaseReturns: MockPurchaseReturnDetail[] = [
//   {
//     id: 'pr-001', billNo: 'PRTN-2024-001', date: '2024-01-15', partyName: 'NexGen Components',
//     warehouseName: 'Main Warehouse', itemCount: 2, grandTotal: 13680, status: 'SAVED',
//     originalInvoiceId: 'pi-002', originalInvoiceNo: 'PINV-2024-002', supplierId: 'pty-005',
//     paymentHandled: true, paymentType: 'refund', refundId: 'rr-001',
//     items: [
//       { id: 'pri-001', itemName: 'USB-C 7-in-1 Hub', hsnCode: '85444290', returnQty: 5, unit: 'Pcs', rate: 1100, amount: 5500, reason: 'Damaged packaging' },
//       { id: 'pri-002', itemName: 'Monitor 24" Full HD IPS', hsnCode: '85285200', returnQty: 2, unit: 'Pcs', rate: 11500, amount: 23000, reason: 'Dead pixels' },
//     ],
//   },
//   {
//     id: 'pr-002', billNo: 'PRTN-2024-002', date: '2024-02-20', partyName: 'NexGen Components',
//     warehouseName: 'East Branch', itemCount: 3, grandTotal: 28600, status: 'SAVED',
//     originalInvoiceId: 'pi-003', originalInvoiceNo: 'PINV-2024-003', supplierId: 'pty-005',
//     paymentHandled: true, paymentType: 'credit', refundId: null,
//     items: [
//       { id: 'pri-003', itemName: 'Laptop Bag 15.6" Waterproof', hsnCode: '42021200', returnQty: 10, unit: 'Pcs', rate: 750, amount: 7500, reason: 'Wrong item delivered' },
//       { id: 'pri-004', itemName: 'Webcam 1080p with Mic', hsnCode: '85258090', returnQty: 5, unit: 'Pcs', rate: 1700, amount: 8500, reason: 'Quality issue' },
//       { id: 'pri-005', itemName: 'Wi-Fi 6 Router AX1800', hsnCode: '85176200', returnQty: 3, unit: 'Pcs', rate: 4000, amount: 12000, reason: 'Defective units' },
//     ],
//   },
//   {
//     id: 'pr-003', billNo: 'PRTN-2024-003', date: '2024-02-25', partyName: 'TechSupply Co.',
//     warehouseName: 'West Godown', itemCount: 2, grandTotal: 9800, status: 'SAVED',
//     originalInvoiceId: 'pi-004', originalInvoiceNo: 'PINV-2024-004', supplierId: 'pty-002',
//     paymentHandled: false, paymentType: null, refundId: null,
//     items: [
//       { id: 'pri-006', itemName: 'Wireless Mouse Logitech M235', hsnCode: '84716060', returnQty: 5, unit: 'Pcs', rate: 780, amount: 3900, reason: 'Scroll wheel defect' },
//       { id: 'pri-007', itemName: 'Mechanical Keyboard RGB', hsnCode: '84716060', returnQty: 2, unit: 'Pcs', rate: 5100, amount: 10200, reason: 'Key sticking issue' },
//     ],
//   },
//   {
//     id: 'pr-004', billNo: 'PRTN-2024-004', date: '2024-03-10', partyName: 'TechSupply Co.',
//     warehouseName: 'Main Warehouse', itemCount: 2, grandTotal: 7500, status: 'SAVED',
//     originalInvoiceId: 'pi-001', originalInvoiceNo: 'PINV-2024-001', supplierId: 'pty-002',
//     paymentHandled: false, paymentType: null, refundId: null,
//     items: [
//       { id: 'pri-008', itemName: 'SSD 1TB NVMe Samsung', hsnCode: '84717010', returnQty: 1, unit: 'Pcs', rate: 6200, amount: 6200, reason: 'Excess quantity ordered' },
//       { id: 'pri-009', itemName: 'RAM 16GB DDR5 3200MHz', hsnCode: '84717010', returnQty: 1, unit: 'Pcs', rate: 4600, amount: 4600, reason: 'Wrong spec received' },
//     ],
//   },
// ];

// ─── Invoice Items for Returns ────────────────────────────────────────────────
export interface MockInvoiceItem {
  itemId: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
}

export const mockInvoiceItemsMap: Record<string, MockInvoiceItem[]> = {
  'si-001': [
    { itemId: 'itm-001', itemName: 'Tata Salt 1kg', hsnCode: '2501', qty: 10, unit: 'Pcs', rate: 22 },
    { itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 5, unit: 'Pcs', rate: 152 },
    { itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 3, unit: 'Pcs', rate: 210 },
    { itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 12, unit: 'Pcs', rate: 58 },
  ],
  'si-002': [
    { itemId: 'itm-004', itemName: 'Ariel Matic 2kg', hsnCode: '3402', qty: 8, unit: 'Pcs', rate: 390 },
    { itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 20, unit: 'Pcs', rate: 84 },
  ],
  'si-003': [
    { itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 50, unit: 'Pcs', rate: 15 },
    { itemId: 'itm-008', itemName: 'Good Day Butter 200g', hsnCode: '1905', qty: 24, unit: 'Pcs', rate: 36 },
    { itemId: 'itm-009', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', qty: 15, unit: 'Btl', rate: 162 },
    { itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 30, unit: 'Pcs', rate: 54 },
    { itemId: 'itm-001', itemName: 'Tata Salt 1kg', hsnCode: '2501', qty: 100, unit: 'Pcs', rate: 22 },
    { itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 40, unit: 'Pcs', rate: 152 },
    { itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 20, unit: 'Pcs', rate: 210 },
  ],
  'si-004': [
    { itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 6, unit: 'Pcs', rate: 210 },
    { itemId: 'itm-004', itemName: 'Ariel Matic 2kg', hsnCode: '3402', qty: 4, unit: 'Pcs', rate: 390 },
    { itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 10, unit: 'Pcs', rate: 84 },
  ],
  'si-005': [
    { itemId: 'itm-009', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', qty: 24, unit: 'Btl', rate: 162 },
    { itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 48, unit: 'Pcs', rate: 54 },
    { itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 100, unit: 'Pcs', rate: 15 },
    { itemId: 'itm-008', itemName: 'Good Day Butter 200g', hsnCode: '1905', qty: 36, unit: 'Pcs', rate: 36 },
    { itemId: 'itm-001', itemName: 'Tata Salt 1kg', hsnCode: '2501', qty: 50, unit: 'Pcs', rate: 22 },
  ],
  'si-007': [
    { itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 60, unit: 'Pcs', rate: 152 },
    { itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 80, unit: 'Pcs', rate: 58 },
    { itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 40, unit: 'Pcs', rate: 84 },
    { itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 30, unit: 'Pcs', rate: 210 },
    { itemId: 'itm-004', itemName: 'Ariel Matic 2kg', hsnCode: '3402', qty: 20, unit: 'Pcs', rate: 390 },
    { itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 120, unit: 'Pcs', rate: 15 },
  ],
  'pi-001': [
    { itemId: 'itm-001', itemName: 'Tata Salt 1kg', hsnCode: '2501', qty: 500, unit: 'Pcs', rate: 18 },
    { itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 200, unit: 'Pcs', rate: 125 },
    { itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 1000, unit: 'Pcs', rate: 12 },
  ],
  'pi-002': [
    { itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 200, unit: 'Pcs', rate: 165 },
    { itemId: 'itm-004', itemName: 'Ariel Matic 2kg', hsnCode: '3402', qty: 100, unit: 'Pcs', rate: 310 },
    { itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 300, unit: 'Pcs', rate: 42 },
    { itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 250, unit: 'Pcs', rate: 68 },
    { itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 400, unit: 'Pcs', rate: 45 },
  ],
  'pi-003': [
    { itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 500, unit: 'Pcs', rate: 45 },
    { itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 300, unit: 'Pcs', rate: 42 },
    { itemId: 'itm-009', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', qty: 200, unit: 'Btl', rate: 132 },
    { itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 400, unit: 'Pcs', rate: 68 },
  ],
  'pi-004': [
    { itemId: 'itm-008', itemName: 'Good Day Butter 200g', hsnCode: '1905', qty: 300, unit: 'Pcs', rate: 28 },
    { itemId: 'itm-009', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', qty: 150, unit: 'Btl', rate: 132 },
    { itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 500, unit: 'Pcs', rate: 12 },
    { itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 100, unit: 'Pcs', rate: 125 },
  ],
};

// ─── Purchase Orders (for GRN PO matching) ───────────────────────────────────
export interface MockPOItem {
  itemId: string;
  itemName: string;
  hsnCode: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  rate: number;
}

export interface MockPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDelivery?: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  items: MockPOItem[];
}

export let mockPurchaseOrders: MockPurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2024-001',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-01-10',
    expectedDelivery: '2024-01-25',
    status: 'COMPLETED',
    items: [
      { itemId: 'itm-001', itemName: 'Laptop 15" Core i7', hsnCode: '84713010', orderedQty: 10, receivedQty: 10, unit: 'Pcs', rate: 72000 },
      { itemId: 'itm-002', itemName: 'Wireless Mouse Logitech M235', hsnCode: '84716060', orderedQty: 50, receivedQty: 50, unit: 'Pcs', rate: 850 },
      { itemId: 'itm-004', itemName: 'Mechanical Keyboard RGB', hsnCode: '84716060', orderedQty: 20, receivedQty: 20, unit: 'Pcs', rate: 5500 },
    ],
  },
  {
    id: 'po-002',
    poNumber: 'PO-2024-002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-01-18',
    expectedDelivery: '2024-02-05',
    status: 'PARTIAL',
    items: [
      { itemId: 'itm-009', itemName: 'SSD 1TB NVMe Samsung', hsnCode: '84717010', orderedQty: 30, receivedQty: 30, unit: 'Pcs', rate: 6500 },
      { itemId: 'itm-010', itemName: 'RAM 16GB DDR5 3200MHz', hsnCode: '84717010', orderedQty: 40, receivedQty: 20, unit: 'Pcs', rate: 4800 },
      { itemId: 'itm-003', itemName: 'USB-C 7-in-1 Hub', hsnCode: '85444290', orderedQty: 25, receivedQty: 25, unit: 'Pcs', rate: 1200 },
    ],
  },
  {
    id: 'po-003',
    poNumber: 'PO-2024-003',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-02-05',
    expectedDelivery: '2024-02-20',
    status: 'PARTIAL',
    items: [
      { itemId: 'itm-005', itemName: 'Monitor 24" Full HD IPS', hsnCode: '85285200', orderedQty: 15, receivedQty: 15, unit: 'Pcs', rate: 12000 },
      { itemId: 'itm-008', itemName: 'Network Switch 8-Port', hsnCode: '85176200', orderedQty: 10, receivedQty: 10, unit: 'Pcs', rate: 3200 },
      { itemId: 'itm-022', itemName: 'Patch Panel 24-Port', hsnCode: '85176200', orderedQty: 8, receivedQty: 5, unit: 'Pcs', rate: 4500 },
    ],
  },
  {
    id: 'po-004',
    poNumber: 'PO-2024-004',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-02-14',
    expectedDelivery: '2024-03-01',
    status: 'PENDING',
    items: [
      { itemId: 'itm-015', itemName: 'USB 3.0 Flash Drive 64GB', hsnCode: '84717090', orderedQty: 300, receivedQty: 0, unit: 'Pcs', rate: 450 },
      { itemId: 'itm-016', itemName: 'Bluetooth Speaker JBL Go 3', hsnCode: '85182200', orderedQty: 60, receivedQty: 0, unit: 'Pcs', rate: 2800 },
    ],
  },
  {
    id: 'po-005',
    poNumber: 'PO-2024-005',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-02-20',
    status: 'COMPLETED',
    items: [
      { itemId: 'itm-011', itemName: 'Webcam 1080p with Mic', hsnCode: '85258090', orderedQty: 20, receivedQty: 20, unit: 'Pcs', rate: 1800 },
      { itemId: 'itm-012', itemName: 'Wi-Fi 6 Router AX1800', hsnCode: '85176200', orderedQty: 12, receivedQty: 12, unit: 'Pcs', rate: 4200 },
      { itemId: 'itm-007', itemName: 'HDMI Cable 2m v2.0', hsnCode: '85444290', orderedQty: 100, receivedQty: 100, unit: 'Pcs', rate: 150 },
    ],
  },
  {
    id: 'po-006',
    poNumber: 'PO-2024-006',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-01',
    expectedDelivery: '2024-03-15',
    status: 'PARTIAL',
    items: [
      { itemId: 'itm-017', itemName: 'Power Bank 20000mAh', hsnCode: '85076000', orderedQty: 100, receivedQty: 60, unit: 'Pcs', rate: 1600 },
      { itemId: 'itm-013', itemName: 'Thermal Paste Arctic MX-4', hsnCode: '34039900', orderedQty: 80, receivedQty: 50, unit: 'Pcs', rate: 320 },
      { itemId: 'itm-021', itemName: 'CPU Cooler 120mm RGB', hsnCode: '84145990', orderedQty: 30, receivedQty: 20, unit: 'Pcs', rate: 2400 },
    ],
  },
  {
    id: 'po-007',
    poNumber: 'PO-2024-007',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-10',
    expectedDelivery: '2024-03-25',
    status: 'PENDING',
    items: [
      { itemId: 'itm-018', itemName: 'Laptop Stand Adjustable', hsnCode: '94033000', orderedQty: 40, receivedQty: 0, unit: 'Pcs', rate: 1200 },
      { itemId: 'itm-019', itemName: 'Screen Cleaning Kit', hsnCode: '34051000', orderedQty: 150, receivedQty: 0, unit: 'Pcs', rate: 250 },
      { itemId: 'itm-006', itemName: 'Laptop Bag 15.6" Waterproof', hsnCode: '42021200', orderedQty: 50, receivedQty: 0, unit: 'Pcs', rate: 800 },
    ],
  },
  {
    id: 'po-008',
    poNumber: 'PO-2024-008',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-20',
    expectedDelivery: '2024-04-05',
    status: 'PENDING',
    items: [
      { itemId: 'itm-020', itemName: 'PCIe NVMe Adapter Card', hsnCode: '84717010', orderedQty: 25, receivedQty: 0, unit: 'Pcs', rate: 1800 },
      { itemId: 'itm-023', itemName: 'Rack Mount Cabinet 12U', hsnCode: '94033000', orderedQty: 5, receivedQty: 0, unit: 'Pcs', rate: 18000 },
    ],
  },
];

// ─── GRN Records ──────────────────────────────────────────────────────────────
export interface MockGRNItem {
  itemId: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  poRef: string | null;
}

export interface MockGRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  createdBy: string;
  linkedPOs: string[];
  items: MockGRNItem[];
  totalItems: number;
  totalValue: number;
  /** Whether a Purchase Invoice has been created for this GRN */
  piCreated: boolean;
  /** The PI number linked to this GRN, if created */
  linkedPINumber: string | null;
  /** Date when PI was created */
  piCreatedDate: string | null;
  /** Optional notes / remarks entered during receiving */
  notes?: string;
}

export let mockGRNs: MockGRN[] = [
  {
    id: 'grn-001',
    grnNumber: 'GRN-2024-0001',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-05',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Admin User',
    linkedPOs: [],
    items: [
      { itemId: 'itm-007', itemName: 'HDMI Cable 2m v2.0', hsnCode: '85444290', qty: 50, unit: 'Pcs', rate: 150, poRef: null },
      { itemId: 'itm-006', itemName: 'Laptop Bag 15.6" Waterproof', hsnCode: '42021200', qty: 30, unit: 'Pcs', rate: 800, poRef: null },
    ],
    totalItems: 2,
    totalValue: 31500,
    piCreated: true,
    linkedPINumber: 'PINV-2024-001',
    piCreatedDate: '2024-03-07',
  },
  {
    id: 'grn-002',
    grnNumber: 'GRN-2024-0002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-10',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Rahul Sharma',
    linkedPOs: ['PO-2024-002'],
    items: [
      { itemId: 'itm-009', itemName: 'SSD 1TB NVMe Samsung', hsnCode: '84717010', qty: 10, unit: 'Pcs', rate: 6500, poRef: 'PO-2024-002' },
      { itemId: 'itm-010', itemName: 'RAM 16GB DDR5 3200MHz', hsnCode: '84717010', qty: 20, unit: 'Pcs', rate: 4800, poRef: 'PO-2024-002' },
      { itemId: 'itm-003', itemName: 'USB-C 7-in-1 Hub', hsnCode: '85444290', qty: 25, unit: 'Pcs', rate: 1200, poRef: 'PO-2024-002' },
    ],
    totalItems: 3,
    totalValue: 191000,
    piCreated: true,
    linkedPINumber: 'PINV-2024-002',
    piCreatedDate: '2024-03-12',
  },
  {
    id: 'grn-003',
    grnNumber: 'GRN-2024-0003',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-14',
    warehouseId: 'wh-002',
    warehouseName: 'North Branch',
    createdBy: 'Admin User',
    linkedPOs: [],
    items: [
      { itemId: 'itm-011', itemName: 'Webcam 1080p with Mic', hsnCode: '85258090', qty: 15, unit: 'Pcs', rate: 1800, poRef: null },
      { itemId: 'itm-012', itemName: 'Wi-Fi 6 Router AX1800', hsnCode: '85176200', qty: 8, unit: 'Pcs', rate: 4200, poRef: null },
    ],
    totalItems: 2,
    totalValue: 60600,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
    notes: 'Vehicle MH-12-AB-3456. Minor dent on webcam box — accepted after inspection.',
  },
  {
    id: 'grn-004',
    grnNumber: 'GRN-2024-0004',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-18',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Priya Mehta',
    linkedPOs: ['PO-2024-001'],
    items: [
      { itemId: 'itm-001', itemName: 'Laptop 15" Core i7', hsnCode: '84713010', qty: 5, unit: 'Pcs', rate: 72000, poRef: 'PO-2024-001' },
      { itemId: 'itm-002', itemName: 'Wireless Mouse Logitech M235', hsnCode: '84716060', qty: 30, unit: 'Pcs', rate: 850, poRef: 'PO-2024-001' },
    ],
    totalItems: 2,
    totalValue: 385500,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
  {
    id: 'grn-005',
    grnNumber: 'GRN-2024-0005',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-20',
    warehouseId: 'wh-003',
    warehouseName: 'South Depot',
    createdBy: 'Rahul Sharma',
    linkedPOs: ['PO-2024-002'],
    items: [
      { itemId: 'itm-009', itemName: 'SSD 1TB NVMe Samsung', hsnCode: '84717010', qty: 20, unit: 'Pcs', rate: 6500, poRef: 'PO-2024-002' },
      { itemId: 'itm-010', itemName: 'RAM 16GB DDR5 3200MHz', hsnCode: '84717010', qty: 20, unit: 'Pcs', rate: 4800, poRef: 'PO-2024-002' },
      { itemId: 'itm-013', itemName: 'Thermal Paste Arctic MX-4', hsnCode: '34039900', qty: 50, unit: 'Pcs', rate: 320, poRef: null },
    ],
    totalItems: 3,
    totalValue: 242000,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
    notes: 'Driver: Suresh Kumar. 5 SSDs had damaged packaging — accepted with discount note.',
  },
  {
    id: 'grn-006',
    grnNumber: 'GRN-2024-0006',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-22',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Admin User',
    linkedPOs: ['PO-2024-003'],
    items: [
      { itemId: 'itm-005', itemName: 'Monitor 24" Full HD IPS', hsnCode: '85285200', qty: 10, unit: 'Pcs', rate: 12000, poRef: 'PO-2024-003' },
      { itemId: 'itm-008', itemName: 'Network Switch 8-Port', hsnCode: '85176200', qty: 6, unit: 'Pcs', rate: 3200, poRef: 'PO-2024-003' },
      { itemId: 'itm-014', itemName: 'Cat6 Ethernet Cable 10m', hsnCode: '85444290', qty: 100, unit: 'Pcs', rate: 180, poRef: null },
    ],
    totalItems: 3,
    totalValue: 157200,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
  {
    id: 'grn-007',
    grnNumber: 'GRN-2024-0007',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-25',
    warehouseId: 'wh-002',
    warehouseName: 'North Branch',
    createdBy: 'Priya Mehta',
    linkedPOs: [],
    items: [
      { itemId: 'itm-015', itemName: 'USB 3.0 Flash Drive 64GB', hsnCode: '84717090', qty: 200, unit: 'Pcs', rate: 450, poRef: null },
      { itemId: 'itm-016', itemName: 'Bluetooth Speaker JBL Go 3', hsnCode: '85182200', qty: 40, unit: 'Pcs', rate: 2800, poRef: null },
      { itemId: 'itm-017', itemName: 'Power Bank 20000mAh', hsnCode: '85076000', qty: 60, unit: 'Pcs', rate: 1600, poRef: null },
    ],
    totalItems: 3,
    totalValue: 298000,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
  {
    id: 'grn-008',
    grnNumber: 'GRN-2024-0008',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-03-28',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Rahul Sharma',
    linkedPOs: ['PO-2024-001'],
    items: [
      { itemId: 'itm-001', itemName: 'Laptop 15" Core i7', hsnCode: '84713010', qty: 5, unit: 'Pcs', rate: 72000, poRef: 'PO-2024-001' },
      { itemId: 'itm-004', itemName: 'Mechanical Keyboard RGB', hsnCode: '84716060', qty: 20, unit: 'Pcs', rate: 5500, poRef: 'PO-2024-001' },
      { itemId: 'itm-018', itemName: 'Laptop Stand Adjustable', hsnCode: '94033000', qty: 25, unit: 'Pcs', rate: 1200, poRef: null },
      { itemId: 'itm-019', itemName: 'Screen Cleaning Kit', hsnCode: '34051000', qty: 80, unit: 'Pcs', rate: 250, poRef: null },
    ],
    totalItems: 4,
    totalValue: 490000,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
  {
    id: 'grn-009',
    grnNumber: 'GRN-2024-0009',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-30',
    warehouseId: 'wh-003',
    warehouseName: 'South Depot',
    createdBy: 'Admin User',
    linkedPOs: ['PO-2024-002'],
    items: [
      { itemId: 'itm-020', itemName: 'PCIe NVMe Adapter Card', hsnCode: '84717010', qty: 15, unit: 'Pcs', rate: 1800, poRef: 'PO-2024-002' },
      { itemId: 'itm-021', itemName: 'CPU Cooler 120mm RGB', hsnCode: '84145990', qty: 20, unit: 'Pcs', rate: 2400, poRef: null },
    ],
    totalItems: 2,
    totalValue: 76000,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
  {
    id: 'grn-010',
    grnNumber: 'GRN-2024-0010',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-04-01',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    createdBy: 'Priya Mehta',
    linkedPOs: ['PO-2024-003'],
    items: [
      { itemId: 'itm-005', itemName: 'Monitor 24" Full HD IPS', hsnCode: '85285200', qty: 5, unit: 'Pcs', rate: 12000, poRef: 'PO-2024-003' },
      { itemId: 'itm-008', itemName: 'Network Switch 8-Port', hsnCode: '85176200', qty: 4, unit: 'Pcs', rate: 3200, poRef: 'PO-2024-003' },
      { itemId: 'itm-022', itemName: 'Patch Panel 24-Port', hsnCode: '85176200', qty: 5, unit: 'Pcs', rate: 4500, poRef: null },
      { itemId: 'itm-023', itemName: 'Rack Mount Cabinet 12U', hsnCode: '94033000', qty: 2, unit: 'Pcs', rate: 18000, poRef: null },
    ],
    totalItems: 4,
    totalValue: 134800,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
  },
];

// ─── Challan Detail ───────────────────────────────────────────────────────────
export interface MockChallanItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  rate?: number;
  amount?: number;
    hsnCode?: string;       // ← add
  taxRate?: number;       // ← add
  cgst?: number;          // ← add
  sgst?: number;          // ← add
  igst?: number;          // ← add
  taxableAmount?: number;
}

export interface MockChallanDetail extends MockBillRecord {
  challanStatus: 'DRAFT' | 'DISPATCHED' | 'CONVERTED' | 'CANCELLED';
  vehicleNo?: string;
  driverName?: string;
  lrNo?: string;
  billingAddress: string;
  items: Array<{
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  rate?: number;
  amount?: number;
  hsnCode?: string;       // ← add
  taxRate?: number;       // ← add
  cgst?: number;          // ← add
  sgst?: number;          // ← add
  igst?: number;          // ← add
  taxableAmount?: number; // ← add
  itemId?: string;
  itemCode?: string;
  unitId?: string;
}>;
}

export const mockChallans: MockChallanDetail[] = [
  {
    id: 'dc-001', billNo: 'DC-2024-001', date: '2024-03-18', partyName: 'Delhi Distributors',
    warehouseName: 'Main Warehouse', itemCount: 4, grandTotal: 0, status: 'SAVED',
    challanStatus: 'DISPATCHED', vehicleNo: 'DL-01-AB-1234', driverName: 'Ramesh Kumar', lrNo: 'LR-2024-0045',
    billingAddress: '78 Chandni Chowk, Delhi 110006',
    items: [
      { id: 'dci-001', itemName: 'Maggi 2-Minute Noodles', qty: 200, unit: 'Pcs', rate: 15, amount: 3000 },
      { id: 'dci-002', itemName: 'Good Day Butter 200g', qty: 100, unit: 'Pcs', rate: 36, amount: 3600 },
      { id: 'dci-003', itemName: 'Fortune Sunflower Oil 1L', qty: 50, unit: 'Btl', rate: 162, amount: 8100 },
      { id: 'dci-004', itemName: 'Tata Salt 1kg', qty: 150, unit: 'Pcs', rate: 22, amount: 3300 },
    ],
  },
  {
    id: 'dc-002', billNo: 'DC-2024-002', date: '2024-03-17', partyName: 'Metro Retailers',
    warehouseName: 'East Branch', itemCount: 3, grandTotal: 0, status: 'SAVED',
    challanStatus: 'DISPATCHED', vehicleNo: 'MH-12-CD-5678', driverName: 'Suresh Patil', lrNo: 'LR-2024-0046',
    billingAddress: '23 Brigade Road, Bengaluru 560001, Karnataka',
    items: [
      { id: 'dci-005', itemName: 'Clinic Plus Shampoo 80ml', qty: 48, unit: 'Pcs', rate: 54, amount: 2592 },
      { id: 'dci-006', itemName: 'Dove Soap 100g', qty: 60, unit: 'Pcs', rate: 58, amount: 3480 },
      { id: 'dci-007', itemName: 'Colgate Max Fresh 150g', qty: 40, unit: 'Pcs', rate: 84, amount: 3360 },
    ],
  },
  {
    id: 'dc-003', billNo: 'DC-2024-003', date: '2024-03-20', partyName: 'Ramesh Traders',
    warehouseName: 'Main Warehouse', itemCount: 2, grandTotal: 0, status: 'SAVED',
    challanStatus: 'CONVERTED', vehicleNo: 'MH-14-EF-9012', driverName: 'Vijay More',
    billingAddress: '45, MG Road, Pune 411001, Maharashtra',
    items: [
      { id: 'dci-008', itemName: 'Surf Excel 1kg', qty: 30, unit: 'Pcs', rate: 210, amount: 6300 },
      { id: 'dci-009', itemName: 'Ariel Matic 2kg', qty: 20, unit: 'Pcs', rate: 390, amount: 7800 },
    ],
  },
  {
    id: 'dc-004', billNo: 'DC-2024-004', date: '2024-03-22', partyName: 'Kumar & Sons',
    warehouseName: 'Main Warehouse', itemCount: 3, grandTotal: 0, status: 'SAVED',
    challanStatus: 'DRAFT',
    billingAddress: '7, Laxmi Road, Pune 411030, Maharashtra',
    items: [
      { id: 'dci-010', itemName: 'Tata Tea Premium 500g', qty: 25, unit: 'Pcs' },
      { id: 'dci-011', itemName: 'Tata Salt 1kg', qty: 50, unit: 'Pcs' },
      { id: 'dci-012', itemName: 'Good Day Butter 200g', qty: 30, unit: 'Pcs' },
    ],
  },
];

export interface MockItemForSearch {
  id: string;
  name: string;
  code: string;
  barcode: string;
  hsnCode: string;
  taxRate: number;
  purchaseRate: number;
  saleRate: number;
  currentStock: number;
  unit: string;
  unitId: string;
  categoryId?: string;
}

// ─── Direct Stock Entries ─────────────────────────────────────────────────────
export type DSEReason =
  | 'Opening Stock'
  | 'Stock Audit Found'
  | 'Free Sample'
  | 'Goods Returned No Invoice'
  | 'Internal Transfer Found'
  | 'Other';

export interface MockDSEItem {
  id: string;
  itemId: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
}

export interface MockDirectStockEntry {
  id: string;
  entryNumber: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  reason: DSEReason;
  otherReason?: string;
  referenceNo?: string;
  notes?: string;
  createdBy: string;
  items: MockDSEItem[];
  totalItems: number;
  totalQty: number;
  totalValue: number;
}

export let mockDirectStockEntries: MockDirectStockEntry[] = [
  {
    id: 'dse-001',
    entryNumber: 'DSE-2024-0001',
    date: '2024-01-05',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    reason: 'Opening Stock',
    referenceNo: 'OPEN-2024',
    notes: 'Initial stock entry for new financial year',
    createdBy: 'Admin User',
    items: [
      { id: 'dsei-001', itemId: 'itm-001', itemName: 'Tata Salt 1kg', hsnCode: '2501', qty: 500, unit: 'Pcs', rate: 18, total: 9000 },
      { id: 'dsei-002', itemId: 'itm-002', itemName: 'Tata Tea Premium 500g', hsnCode: '0902', qty: 200, unit: 'Pcs', rate: 125, total: 26000 },
      { id: 'dsei-003', itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 150, unit: 'Pcs', rate: 165, total: 24750 },
      { id: 'dsei-004', itemId: 'itm-007', itemName: 'Maggi 2-Minute Noodles', hsnCode: '1902', qty: 800, unit: 'Pcs', rate: 12, total: 9600 },
    ],
    totalItems: 4,
    totalQty: 1650,
    totalValue: 68350,
  },
  {
    id: 'dse-002',
    entryNumber: 'DSE-2024-0002',
    date: '2024-01-20',
    warehouseId: 'wh-002',
    warehouseName: 'North Branch',
    reason: 'Opening Stock',
    referenceNo: 'OPEN-NB-2024',
    notes: 'Opening stock for North Branch',
    createdBy: 'Rahul Sharma',
    items: [
      { id: 'dsei-005', itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 300, unit: 'Pcs', rate: 45, total: 13500 },
      { id: 'dsei-006', itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 250, unit: 'Pcs', rate: 68, total: 17001 },
      { id: 'dsei-007', itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 200, unit: 'Pcs', rate: 42, total: 8400 },
    ],
    totalItems: 3,
    totalQty: 750,
    totalValue: 38900,
  },
  {
    id: 'dse-003',
    entryNumber: 'DSE-2024-0003',
    date: '2024-02-12',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    reason: 'Stock Audit Found',
    referenceNo: 'AUDIT-FEB-2024',
    notes: 'Physical audit found extra stock not in system',
    createdBy: 'Priya Mehta',
    items: [
      { id: 'dsei-008', itemId: 'itm-004', itemName: 'Ariel Matic 2kg', hsnCode: '3402', qty: 25, unit: 'Pcs', rate: 310, total: 7750 },
      { id: 'dsei-009', itemId: 'itm-009', itemName: 'Fortune Sunflower Oil 1L', hsnCode: '1512', qty: 40, unit: 'Btl', rate: 132, total: 5280 },
    ],
    totalItems: 2,
    totalQty: 65,
    totalValue: 13030,
  },
  {
    id: 'dse-004',
    entryNumber: 'DSE-2024-0004',
    date: '2024-02-28',
    warehouseId: 'wh-003',
    warehouseName: 'South Depot',
    reason: 'Free Sample',
    referenceNo: 'SAMPLE-HUL-001',
    notes: 'Free samples received from Hindustan Unilever for promotion',
    createdBy: 'Admin User',
    items: [
      { id: 'dsei-010', itemId: 'itm-005', itemName: 'Dove Soap 100g', hsnCode: '3401', qty: 50, unit: 'Pcs', rate: 0, total: 0 },
      { id: 'dsei-011', itemId: 'itm-010', itemName: 'Clinic Plus Shampoo 80ml', hsnCode: '3305', qty: 30, unit: 'Pcs', rate: 0, total: 0 },
      { id: 'dsei-012', itemId: 'itm-006', itemName: 'Colgate Max Fresh 150g', hsnCode: '3306', qty: 20, unit: 'Pcs', rate: 0, total: 0 },
    ],
    totalItems: 3,
    totalQty: 100,
    totalValue: 0,
  },
  {
    id: 'dse-005',
    entryNumber: 'DSE-2024-0005',
    date: '2024-03-15',
    warehouseId: 'wh-001',
    warehouseName: 'Main Warehouse',
    reason: 'Goods Returned No Invoice',
    referenceNo: 'RTNOINV-2024-001',
    notes: 'Customer returned goods without original invoice — stock added back',
    createdBy: 'Rahul Sharma',
    items: [
      { id: 'dsei-013', itemId: 'itm-003', itemName: 'Surf Excel 1kg', hsnCode: '3402', qty: 15, unit: 'Pcs', rate: 165, total: 2475 },
      { id: 'dsei-014', itemId: 'itm-008', itemName: 'Good Day Butter 200g', hsnCode: '1905', qty: 20, unit: 'Pcs', rate: 28, total: 560 },
    ],
    totalItems: 2,
    totalQty: 35,
    totalValue: 3035,
  },
];

export const mockSearchItems: MockItemForSearch[] = [
  { id: 'itm-001', name: 'Laptop 15" Core i7', code: 'ITM-0001', barcode: '8901234567890', hsnCode: '84713010', taxRate: 18, purchaseRate: 72000, saleRate: 86000, currentStock: 38, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-003' },
  { id: 'itm-002', name: 'Wireless Mouse Logitech M235', code: 'ITM-0002', barcode: '7612345678901', hsnCode: '84716060', taxRate: 18, purchaseRate: 850, saleRate: 1200, currentStock: 124, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-005' },
  { id: 'itm-003', name: 'USB-C 7-in-1 Hub', code: 'ITM-0003', barcode: '7623456789012', hsnCode: '85444290', taxRate: 18, purchaseRate: 1200, saleRate: 1800, currentStock: 89, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-006' },
  { id: 'itm-004', name: 'Mechanical Keyboard RGB', code: 'ITM-0004', barcode: '7634567890123', hsnCode: '84716060', taxRate: 18, purchaseRate: 5500, saleRate: 7500, currentStock: 45, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-005' },
  { id: 'itm-005', name: 'Monitor 24" Full HD IPS', code: 'ITM-0045', barcode: '8645678901234', hsnCode: '85285200', taxRate: 18, purchaseRate: 12000, saleRate: 16000, currentStock: 4, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-004' },
  { id: 'itm-006', name: 'Laptop Bag 15.6" Waterproof', code: 'ITM-0078', barcode: '8656789012345', hsnCode: '42021200', taxRate: 12, purchaseRate: 800, saleRate: 1200, currentStock: 3, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-002' },
  { id: 'itm-007', name: 'HDMI Cable 2m v2.0', code: 'ITM-0112', barcode: '8667890123456', hsnCode: '85444290', taxRate: 18, purchaseRate: 150, saleRate: 250, currentStock: 6, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-006' },
  { id: 'itm-008', name: 'Network Switch 8-Port', code: 'ITM-0150', barcode: '8678901234567', hsnCode: '85176200', taxRate: 18, purchaseRate: 3200, saleRate: 4500, currentStock: 2, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-008' },
  { id: 'itm-009', name: 'SSD 1TB NVMe Samsung', code: 'ITM-0200', barcode: '8689012345678', hsnCode: '84717010', taxRate: 18, purchaseRate: 6500, saleRate: 8500, currentStock: 67, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-007' },
  { id: 'itm-010', name: 'RAM 16GB DDR5 3200MHz', code: 'ITM-0201', barcode: '8690123456789', hsnCode: '84717010', taxRate: 18, purchaseRate: 4800, saleRate: 6200, currentStock: 54, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-007' },
  { id: 'itm-011', name: 'Webcam 1080p with Mic', code: 'ITM-0222', barcode: '8601234567890', hsnCode: '85258090', taxRate: 18, purchaseRate: 1800, saleRate: 2500, currentStock: 29, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-002' },
  { id: 'itm-012', name: 'Wi-Fi 6 Router AX1800', code: 'ITM-0230', barcode: '8612345678901', hsnCode: '85176200', taxRate: 18, purchaseRate: 4200, saleRate: 5800, currentStock: 16, unit: 'Pcs', unitId: 'un-001', categoryId: 'cat-008' },
];
