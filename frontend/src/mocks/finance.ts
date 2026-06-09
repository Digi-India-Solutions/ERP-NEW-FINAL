// ─── GL Entries (General Ledger) ──────────────────────────────────────────────

export interface MockGLEntry {
  id: string;
  date: string;
  entryNumber: string;
  type: 'SALES' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'OPENING';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  referenceId: string | null;
  referenceNumber: string | null;
  gstAmount: number;
  createdBy: string;
}

export const mockGLEntries: MockGLEntry[] = [
  {
    id: 'gl-001',
    date: '2024-04-01',
    entryNumber: 'GL-2024-0001',
    type: 'OPENING',
    debitAccount: 'Cash & Bank',
    creditAccount: 'Capital',
    amount: 500000,
    description: 'Opening balance',
    referenceId: null,
    referenceNumber: null,
    gstAmount: 0,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-002',
    date: '2024-04-05',
    entryNumber: 'GL-2024-0002',
    type: 'PURCHASE',
    debitAccount: 'Raw Material Stock',
    creditAccount: 'Accounts Payable',
    amount: 60600,
    description: 'GRN-2024-0003 TechSupply',
    referenceId: null,
    referenceNumber: 'GRN-2024-0003',
    gstAmount: 10908,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-003',
    date: '2024-04-09',
    entryNumber: 'GL-2024-0003',
    type: 'SALES',
    debitAccount: 'Accounts Receivable',
    creditAccount: 'Sales Revenue',
    amount: 71508,
    description: 'INV-2024-001',
    referenceId: null,
    referenceNumber: 'INV-2024-001',
    gstAmount: 10908,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-004',
    date: '2024-04-10',
    entryNumber: 'GL-2024-0004',
    type: 'RECEIPT',
    debitAccount: 'Cash & Bank',
    creditAccount: 'Accounts Receivable',
    amount: 71508,
    description: 'Payment received INV-2024-001',
    referenceId: null,
    referenceNumber: 'INV-2024-001',
    gstAmount: 0,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-005',
    date: '2024-04-15',
    entryNumber: 'GL-2024-0005',
    type: 'PURCHASE',
    debitAccount: 'Raw Material Stock',
    creditAccount: 'Accounts Payable',
    amount: 385500,
    description: 'GRN-2024-0004',
    referenceId: null,
    referenceNumber: 'GRN-2024-0004',
    gstAmount: 69390,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-006',
    date: '2024-04-20',
    entryNumber: 'GL-2024-0006',
    type: 'JOURNAL',
    debitAccount: 'Production WIP',
    creditAccount: 'Raw Material Stock',
    amount: 35000,
    description: 'Materials issued for PRD-2024-001',
    referenceId: 'prod-001',
    referenceNumber: 'PRD-2024-001',
    gstAmount: 0,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-007',
    date: '2024-04-25',
    entryNumber: 'GL-2024-0007',
    type: 'JOURNAL',
    debitAccount: 'Finished Goods Stock',
    creditAccount: 'Production WIP',
    amount: 45425,
    description: 'Production completed PRD-2024-001',
    referenceId: 'prod-001',
    referenceNumber: 'PRD-2024-001',
    gstAmount: 0,
    createdBy: 'Admin User',
  },
  {
    id: 'gl-008',
    date: '2024-04-28',
    entryNumber: 'GL-2024-0008',
    type: 'PAYMENT',
    debitAccount: 'Accounts Payable',
    creditAccount: 'Cash & Bank',
    amount: 71508,
    description: 'Payment to TechSupply',
    referenceId: null,
    referenceNumber: 'PYMT-2024-001',
    gstAmount: 0,
    createdBy: 'Admin User',
  },
];

// ─── Financial Summary ──────────────────────────────────────────────────────

export interface MockFinancialSummary {
  period: string;
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalPurchases: number;
  totalReceipts: number;
  totalPayments: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  gstCollected: number;
  gstPaid: number;
  netGST: number;
}

export const mockFinancialSummary: MockFinancialSummary = {
  period: 'Apr 2024',
  fromDate: '2024-04-01',
  toDate: '2024-04-30',
  totalSales: 456800,
  totalPurchases: 285600,
  totalReceipts: 380000,
  totalPayments: 220000,
  grossProfit: 171200,
  operatingExpenses: 45000,
  netProfit: 126200,
  totalAssets: 850000,
  totalLiabilities: 320000,
  equity: 530000,
  gstCollected: 82224,
  gstPaid: 51408,
  netGST: 30816,
};