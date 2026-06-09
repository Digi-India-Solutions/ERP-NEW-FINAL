// ─── Payment Receipts (Sales) ─────────────────────────────────────────────────
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NEFT' | 'RTGS';
export type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE';

export interface MockPaymentReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceAmount: number;
  balanceDue: number;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  notes?: string;
  createdAt: string;
}

export let mockPaymentReceipts: MockPaymentReceipt[] = [
  {
    id: 'rct-001',
    receiptNumber: 'RCT-2024-0001',
    date: '2024-01-20',
    invoiceId: 'si-001',
    invoiceNumber: 'INV-2024-001',
    customerId: 'pty-001',
    customerName: 'Ramesh Electronics',
    invoiceAmount: 105650,
    balanceDue: 0,
    paymentAmount: 105650,
    paymentMode: 'CHEQUE',
    bankName: 'HDFC Bank',
    chequeNo: '123456',
    chequeDate: '2024-01-19',
    chequeStatus: 'CLEARED',
    notes: 'Full payment received',
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'rct-002',
    receiptNumber: 'RCT-2024-0002',
    date: '2024-02-05',
    invoiceId: 'si-002',
    invoiceNumber: 'INV-2024-002',
    customerId: 'pty-002',
    customerName: 'Suresh Traders',
    invoiceAmount: 50000,
    balanceDue: 25000,
    paymentAmount: 25000,
    paymentMode: 'UPI',
    referenceNo: 'UPI123456789',
    notes: 'Partial payment',
    createdAt: '2024-02-05T11:30:00Z',
  },
  {
    id: 'rct-003',
    receiptNumber: 'RCT-2024-0003',
    date: '2024-02-15',
    invoiceId: 'si-003',
    invoiceNumber: 'INV-2024-003',
    customerId: 'pty-003',
    customerName: 'Mahesh Distributors',
    invoiceAmount: 75000,
    balanceDue: 75000,
    paymentAmount: 75000,
    paymentMode: 'CHEQUE',
    bankName: 'SBI Bank',
    chequeNo: '789012',
    chequeDate: '2024-02-14',
    chequeStatus: 'PENDING',
    createdAt: '2024-02-15T09:00:00Z',
  },
  {
    id: 'rct-004',
    receiptNumber: 'RCT-2024-0004',
    date: '2024-03-01',
    invoiceId: 'si-004',
    invoiceNumber: 'INV-2024-004',
    customerId: 'pty-001',
    customerName: 'Ramesh Electronics',
    invoiceAmount: 45000,
    balanceDue: 0,
    paymentAmount: 45000,
    paymentMode: 'NEFT',
    referenceNo: 'NEFT20240301001',
    notes: 'Bank transfer received',
    createdAt: '2024-03-01T14:00:00Z',
  },
  {
    id: 'rct-005',
    receiptNumber: 'RCT-2024-0005',
    date: '2024-03-10',
    invoiceId: 'si-005',
    invoiceNumber: 'INV-2024-005',
    customerId: 'pty-004',
    customerName: 'Vijay Wholesale',
    invoiceAmount: 32000,
    balanceDue: 32000,
    paymentAmount: 32000,
    paymentMode: 'CHEQUE',
    bankName: 'Axis Bank',
    chequeNo: '456789',
    chequeDate: '2024-03-09',
    chequeStatus: 'BOUNCED',
    bounceReason: 'Insufficient funds in account',
    createdAt: '2024-03-10T10:00:00Z',
  },
];

let receiptCounter = 6;
export function nextReceiptNumber(): string {
  return `RCT-2024-${String(receiptCounter++).padStart(4, '0')}`;
}

// ─── Payment Vouchers (Purchase) ──────────────────────────────────────────────
export interface MockPaymentVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  balanceDue: number;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  notes?: string;
  createdAt: string;
}

export let mockPaymentsMade: MockPaymentVoucher[] = [
  {
    id: 'pay-001',
    voucherNumber: 'PAY-2024-0001',
    date: '2024-01-25',
    invoiceId: 'pi-001',
    invoiceNumber: 'PINV-2024-001',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    invoiceAmount: 118734,
    balanceDue: 0,
    paymentAmount: 118734,
    paymentMode: 'NEFT',
    referenceNo: 'NEFT20240125001',
    notes: 'Full payment to supplier',
    createdAt: '2024-01-25T11:00:00Z',
  },
  {
    id: 'pay-002',
    voucherNumber: 'PAY-2024-0002',
    date: '2024-02-12',
    invoiceId: 'pi-002',
    invoiceNumber: 'PINV-2024-002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    invoiceAmount: 100000,
    balanceDue: 50000,
    paymentAmount: 50000,
    paymentMode: 'CHEQUE',
    bankName: 'ICICI Bank',
    chequeNo: '234567',
    chequeDate: '2024-02-11',
    chequeStatus: 'CLEARED',
    notes: 'Partial payment',
    createdAt: '2024-02-12T16:30:00Z',
  },
  {
    id: 'pay-003',
    voucherNumber: 'PAY-2024-0003',
    date: '2024-02-25',
    invoiceId: 'pi-003',
    invoiceNumber: 'PINV-2024-003',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    invoiceAmount: 273000,
    balanceDue: 0,
    paymentAmount: 273000,
    paymentMode: 'RTGS',
    referenceNo: 'RTGS20240225001',
    createdAt: '2024-02-25T10:00:00Z',
  },
  {
    id: 'pay-004',
    voucherNumber: 'PAY-2024-0004',
    date: '2024-03-08',
    invoiceId: 'pi-004',
    invoiceNumber: 'PINV-2024-004',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    invoiceAmount: 67448,
    balanceDue: 67448,
    paymentAmount: 67448,
    paymentMode: 'CHEQUE',
    bankName: 'HDFC Bank',
    chequeNo: '345678',
    chequeDate: '2024-03-07',
    chequeStatus: 'PENDING',
    notes: 'Awaiting clearance',
    createdAt: '2024-03-08T14:00:00Z',
  },
  {
    id: 'pay-005',
    voucherNumber: 'PAY-2024-0005',
    date: '2024-03-22',
    invoiceId: 'pi-005',
    invoiceNumber: 'PINV-2024-005',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    invoiceAmount: 28868,
    balanceDue: 0,
    paymentAmount: 28868,
    paymentMode: 'UPI',
    referenceNo: 'UPI987654321',
    createdAt: '2024-03-22T09:00:00Z',
  },
];

let voucherCounter = 6;
export function nextVoucherNumber(): string {
  return `PAY-2024-${String(voucherCounter++).padStart(4, '0')}`;
}

// ─── Customer Credits ─────────────────────────────────────────────────────────
export interface MockCustomerCredit {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  sourceReturnId: string;
  sourceReturnNumber: string;
  date: string;
  isUsed: boolean;
  usedInInvoiceId?: string;
  usedInInvoiceNumber?: string;
}

export let mockCustomerCredits: MockCustomerCredit[] = [
  {
    id: 'cc-001',
    customerId: 'pty-001',
    customerName: 'Ramesh Traders',
    amount: 8840,
    sourceReturnId: 'sr-001',
    sourceReturnNumber: 'SRTN-2024-001',
    date: '2024-03-16',
    isUsed: true,
    usedInInvoiceId: 'si-004',
    usedInInvoiceNumber: 'INV-2024-004',
  },
  {
    id: 'cc-002',
    customerId: 'pty-007',
    customerName: 'Gupta Wholesale',
    amount: 9720,
    sourceReturnId: 'sr-004',
    sourceReturnNumber: 'SRTN-2024-004',
    date: '2024-03-20',
    isUsed: false,
  },
];

let creditCounter = 3;
export function nextCustomerCreditId(): string {
  return `cc-${String(creditCounter++).padStart(3, '0')}`;
}

// ─── Supplier Credits ─────────────────────────────────────────────────────────
export interface MockSupplierCredit {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  sourceReturnId: string;
  sourceReturnNumber: string;
  date: string;
  isUsed: boolean;
  usedInInvoiceId?: string;
  usedInInvoiceNumber?: string;
}

export let mockSupplierCredits: MockSupplierCredit[] = [
  {
    id: 'sc-001',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    amount: 7500,
    sourceReturnId: 'pr-004',
    sourceReturnNumber: 'PRTN-2024-004',
    date: '2024-03-10',
    isUsed: true,
    usedInInvoiceId: 'pi-004',
    usedInInvoiceNumber: 'PINV-2024-004',
  },
  {
    id: 'sc-002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    amount: 13680,
    sourceReturnId: 'pr-001',
    sourceReturnNumber: 'PRTN-2024-001',
    date: '2024-01-15',
    isUsed: false,
  },
];

let supplierCreditCounter = 3;
export function nextSupplierCreditId(): string {
  return `sc-${String(supplierCreditCounter++).padStart(3, '0')}`;
}

// ─── Refund Records ───────────────────────────────────────────────────────────
export interface MockRefund {
  id: string;
  refundNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  sourceReturnId: string;
  sourceReturnNumber: string;
  notes?: string;
}

export let mockRefunds: MockRefund[] = [];

let refundCounter = 1;
export function nextRefundNumber(): string {
  return `REF-2024-${String(refundCounter++).padStart(4, '0')}`;
}

// ─── Sale Return Refunds (given to customers) ─────────────────────────────────
export interface MockRefundGiven {
  id: string;
  refundNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  returnId: string;
  returnNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  createdBy: string;
}

export let mockRefundsGiven: MockRefundGiven[] = [
  {
    id: 'rg-001',
    refundNumber: 'REF-2024-0001',
    date: '2024-03-17',
    customerId: 'pty-001',
    customerName: 'Ramesh Traders',
    returnId: 'sr-001',
    returnNumber: 'SRTN-2024-001',
    amount: 8840,
    paymentMode: 'NEFT',
    referenceNo: 'NEFT20240317007788',
    createdBy: 'Admin User',
  },
  {
    id: 'rg-002',
    refundNumber: 'REF-2024-0002',
    date: '2024-03-15',
    customerId: 'pty-004',
    customerName: 'Kumar & Sons',
    returnId: 'sr-002',
    returnNumber: 'SRTN-2024-002',
    amount: 4200,
    paymentMode: 'CASH',
    createdBy: 'Rahul Sharma',
  },
];

let refundGivenCounter = 3;
export function nextRefundGivenNumber(): string {
  return `REF-2024-${String(refundGivenCounter++).padStart(4, '0')}`;
}

// ─── Purchase Return Refunds (received from suppliers) ────────────────────────
export interface MockRefundReceived {
  id: string;
  refundNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  returnId: string;
  returnNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  createdBy: string;
}

export let mockRefundsReceived: MockRefundReceived[] = [
  {
    id: 'rr-001',
    refundNumber: 'PREF-2024-0001',
    date: '2024-01-18',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    returnId: 'pr-001',
    returnNumber: 'PRTN-2024-001',
    amount: 13680,
    paymentMode: 'NEFT',
    referenceNo: 'NEFT20240118003344',
    createdBy: 'Admin User',
  },
  {
    id: 'rr-002',
    refundNumber: 'PREF-2024-0002',
    date: '2024-02-22',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    returnId: 'pr-002',
    returnNumber: 'PRTN-2024-002',
    amount: 28600,
    paymentMode: 'RTGS',
    referenceNo: 'RTGS20240222009900',
    createdBy: 'Priya Mehta',
  },
];

let refundReceivedCounter = 3;
export function nextRefundReceivedNumber(): string {
  return `PREF-2024-${String(refundReceivedCounter++).padStart(4, '0')}`;
}
