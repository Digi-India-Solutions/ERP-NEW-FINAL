import { create } from 'zustand';

import type { InvoiceLineItem } from '@/types/billing';

export type VoucherType = 'SALE' | 'PURCHASE' | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'PURCHASEINVOICE';

export interface SalesPaymentBreakdown {
  cash: number;
  upi: number;
  card: number;
  cheque: number;
  chequeBankName: string;
  chequeNo: string;
  chequeDate: string;
  chequeBranch: string;
}

export interface SalesCustomerDraft {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  stateCode: string;
  billingAddress: string;
  shippingAddress: string;
  creditLimit?: number;
  openingBalance?: number;
  balance?: number;
}

export interface SalesInvoiceDraft {
  invoiceNo: string;
  date: string;
  dueDate: string;
  salesman: string;
  warehouseId: string;
  selectedCustomer: SalesCustomerDraft | null;
  billingAddress: string;
  shippingAddress: string;
  payment: SalesPaymentBreakdown;
  narration: string;
  items: InvoiceLineItem[];
  creditSkipped: boolean;
  creditApplied: boolean;
}

export interface BillItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  netAmount: number;
}

export interface BillTotals {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
}

export interface ChallanPrefill {
  challanId: string;
  challanNo: string;
  customerName: string;
  items: Array<{ itemName: string; qty: number; unit: string; rate: number }>;
}

export interface DuplicatePrefill {
  /** Original invoice number being duplicated */
  originalBillNo: string;
  /** Party id */
  partyId: string;
  /** Party name */
  partyName: string;
  /** Items from original invoice */
  items: Array<{
    itemId?: string;
    itemName: string;
    hsnCode?: string;
    qty: number;
    unit: string;
    rate: number;
    discount?: number;
    taxRate?: number;
  }>;
}

export interface BillingTab {
  id: string;
  voucherType: VoucherType;
  partyId: string | null;
  partyName: string | null;
  warehouseId: string | null;
  date: string;
  dueDate: string | null;
  items: BillItem[];
  totals: BillTotals;
  notes: string;
  isDirty: boolean;
  savedBillNo: string | null;
  /** Set when this tab was pre-filled from a challan */
  fromChallan?: ChallanPrefill;
  /** Set when this tab was created by duplicating an invoice */
  fromDuplicate?: DuplicatePrefill;
  salesInvoiceDraft?: SalesInvoiceDraft;
}

interface BillingTabState {
  tabs: BillingTab[];
  activeTabId: string | null;
  addTab: (voucherType: VoucherType) => void;
  addTabWithChallan: (prefill: ChallanPrefill) => string;
  addTabWithDuplicate: (voucherType: VoucherType, prefill: DuplicatePrefill) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<BillingTab>) => void;
  setTabDraft: (tabId: string, draft: SalesInvoiceDraft, markDirty?: boolean) => void;
  markSaved: (tabId: string, billNo: string) => void;
  canAddTab: () => boolean;
}

const MAX_TABS = 8;

const createEmptyTotals = (): BillTotals => ({
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  grandTotal: 0,
});

export const createEmptySalesInvoiceDraft = (): SalesInvoiceDraft => ({
  invoiceNo: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  salesman: '',
  warehouseId: '',
  selectedCustomer: null,
  billingAddress: '',
  shippingAddress: '',
  payment: {
    cash: 0,
    upi: 0,
    card: 0,
    cheque: 0,
    chequeBankName: '',
    chequeNo: '',
    chequeDate: '',
    chequeBranch: '',
  },
  narration: '',
  items: [],
  creditSkipped: false,
  creditApplied: false,
});

let tabCounter = 1;

export const useBillingTabStore = create<BillingTabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  canAddTab: () => get().tabs.length < MAX_TABS,

  addTab: (voucherType: VoucherType) => {
    const { tabs } = get();
    if (tabs.length >= MAX_TABS) return;

    const id = `tab-${Date.now()}-${tabCounter++}`;
    const today = new Date().toISOString().split('T')[0];

    const newTab: BillingTab = {
      id,
      voucherType,
      partyId: null,
      partyName: null,
      warehouseId: null,
      date: today,
      dueDate: null,
      items: [],
      totals: createEmptyTotals(),
      notes: '',
      isDirty: false,
      savedBillNo: null,
      salesInvoiceDraft: createEmptySalesInvoiceDraft(),
    };

    set({ tabs: [...tabs, newTab], activeTabId: id });
  },

  addTabWithChallan: (prefill: ChallanPrefill): string => {
    const { tabs } = get();
    const id = `tab-${Date.now()}-${tabCounter++}`;
    const today = new Date().toISOString().split('T')[0];

    const newTab: BillingTab = {
      id,
      voucherType: 'SALE',
      partyId: null,
      partyName: prefill.customerName,
      warehouseId: null,
      date: today,
      dueDate: null,
      items: [],
      totals: createEmptyTotals(),
      notes: '',
      isDirty: true,
      savedBillNo: null,
      fromChallan: prefill,
      salesInvoiceDraft: {
        ...createEmptySalesInvoiceDraft(),
        invoiceNo: '',
        selectedCustomer: {
          id: '',
          name: prefill.customerName,
          gstin: '',
          phone: '',
          stateCode: '27',
          billingAddress: '',
          shippingAddress: '',
        },
      },
    };

    const newTabs = tabs.length >= MAX_TABS
      ? [...tabs.slice(0, MAX_TABS - 1), newTab]
      : [...tabs, newTab];

    set({ tabs: newTabs, activeTabId: id });
    return id;
  },

  addTabWithDuplicate: (voucherType: VoucherType, prefill: DuplicatePrefill): string => {
    const { tabs } = get();
    const id = `tab-${Date.now()}-${tabCounter++}`;
    const today = new Date().toISOString().split('T')[0];

    const newTab: BillingTab = {
      id,
      voucherType,
      partyId: prefill.partyId,
      partyName: prefill.partyName,
      warehouseId: null,
      date: today,
      dueDate: null,
      items: [],
      totals: createEmptyTotals(),
      notes: '',
      isDirty: true,
      savedBillNo: null,
      fromDuplicate: prefill,
      salesInvoiceDraft: {
        ...createEmptySalesInvoiceDraft(),
        selectedCustomer: {
          id: prefill.partyId,
          name: prefill.partyName,
          gstin: '',
          phone: '',
          stateCode: '27',
          billingAddress: '',
          shippingAddress: '',
        },
      },
    };

    const newTabs = tabs.length >= MAX_TABS
      ? [...tabs.slice(0, MAX_TABS - 1), newTab]
      : [...tabs, newTab];

    set({ tabs: newTabs, activeTabId: id });
    return id;
  },

  closeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const filtered = tabs.filter((t) => t.id !== tabId);
    let newActiveId = activeTabId;

    if (activeTabId === tabId) {
      const idx = tabs.findIndex((t) => t.id === tabId);
      newActiveId = filtered[Math.max(0, idx - 1)]?.id ?? null;
    }

    set({ tabs: filtered, activeTabId: newActiveId });
  },

  setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

  updateTab: (tabId: string, updates: Partial<BillingTab>) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates, isDirty: true } : t
      ),
    });
  },

  setTabDraft: (tabId: string, draft: SalesInvoiceDraft, markDirty = true) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, salesInvoiceDraft: draft, isDirty: markDirty ? true : tab.isDirty }
          : tab,
      ),
    });
  },

  markSaved: (tabId: string, billNo: string) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: false, savedBillNo: billNo } : t
      ),
    });
  },
}));
