import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import BillingTabBar from '@/pages/billing/components/BillingTabBar';
import PrintSalesInvoice from '@/components/print/PrintSalesInvoice';
import ItemForm, { type ItemFormData } from '@/pages/masters/items/components/ItemForm';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useWarehouseStore } from '@/stores/warehouseStore';
import {
  createEmptySalesInvoiceDraft,
  useBillingTabStore,
  type SalesCustomerDraft,
  type SalesInvoiceDraft,
  type SalesPaymentBreakdown,
} from '@/stores/billingTabStore';

import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/contexts/ToastContext';
import { isSameStateCheck, calcGST, round2 } from '@/utils/gst';
import { formatINR } from '@/utils/format';
import { calcTotals, emptyLineItem, type InvoiceLineItem } from '@/types/billing';
import { isBackendAvailable } from '@/api/client';
import { salesService } from '@/services/salesService';
import type { SalesInvoiceDetail } from '@/services/salesService';
import { printSalesInvoice } from '@/utils/printDocument';
import { createItem, filterItems, mapApiToItem, type ItemResponse } from '@/api/item.api';
import { getPartyById, fromDBType, type PartyResponse } from '@/api/party.api';
import { getAllWarehouses, type WarehouseResponse } from '@/api/warehouse.api';
import { categoryService } from '@/services/categoryService';
import { mockCustomerCredits } from '@/mocks/payments';
import InvoiceItemsTable from './components/InvoiceItemsTable';
import PaymentSection, { type PaymentBreakdown } from './components/PaymentSection';
import CustomerSection, { type CustomerInfo } from './components/CustomerSection';
import InvoiceInfoSummary from './components/InvoiceInfoSummary';
import { useCompanyState } from '@/hooks/useCompanyState';
type EditInvoiceState = SalesInvoiceDetail;

let invoiceCounter = 8;


const nextTempInvoiceNo = () => `INV-${new Date().getFullYear()}-${String(invoiceCounter++).padStart(4, '0')}`;

const emptyPayment = (): PaymentBreakdown => ({
  cash: 0, upi: 0, card: 0, cheque: 0,
  chequeBankName: '', chequeNo: '', chequeDate: '', chequeBranch: '',
});

interface OverstockItem {
  rowIdx: number;
  itemName: string;
  entered: number;
  available: number;
}

interface ItemLookup {
  id: string;
  name: string;
  code: string;
  hsnCode: string;
  taxRate: number;
  purchaseRate: number;
  saleRate: number;
  unit: string;
  unitId: string;
  categoryId?: string;
}

interface CategoryLookup {
  id: string;
  name: string;
  requiresNarration: boolean;
}

interface WarehouseLookup {
  id: string;
  name: string;
}

export default function SalesInvoiceNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
    const companyStateCode = useCompanyState();
  const user = useAuthStore((s) => s.user);
  const { tabs, activeTabId, addTab, setActiveTab, closeTab, setTabDraft, markSaved } = useBillingTabStore();
  const hydratingRef = useRef(false);
  const initTabRef = useRef(false);
  const location = useLocation()
  const editInvoice = (location?.state?.data as EditInvoiceState | undefined) ?? null;
  const duplicateCustomerHydratedRef = useRef(false);
  const editCustomerHydratedRef = useRef(false);
  const editInvoiceItemsHydratedRef = useRef(false);
  useEffect(() => {
    if (initTabRef.current) return; // Guard against double initialization in strict mode
    initTabRef.current = true;
    if (tabs.length === 0) {
      addTab('SALE');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeTab = tabs.find((t) => t.id === activeTabId && t.voucherType === 'SALE');
  const challanPrefill = activeTab?.fromChallan ?? null;
  const duplicatePrefill = activeTab?.fromDuplicate ?? null;
  const activeDraft = activeTab?.salesInvoiceDraft ?? createEmptySalesInvoiceDraft();

  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [salesman, setSalesman] = useState('');
  const { selectedWarehouseId: warehouseId } = useWarehouseStore();
  const [warehouseLookup, setWarehouseLookup] = useState<WarehouseLookup[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [payment, setPayment] = useState<PaymentBreakdown>(emptyPayment());
  const [narration, setNarration] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);
  const [saving, setSaving] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [quickAddIdx, setQuickAddIdx] = useState<number | null>(null);
  const [creditSkipped, setCreditSkipped] = useState(false);
  const [creditApplied, setCreditApplied] = useState(false);

  // Validation state
  const [overstockRows, setOverstockRows] = useState<Set<number>>(new Set());
  const [missingNarrationRows, setMissingNarrationRows] = useState<Set<number>>(new Set());
  const [showOverstockConfirm, setShowOverstockConfirm] = useState(false);
  const [overstockItems, setOverstockItems] = useState<OverstockItem[]>([]);
  const [pendingSaveAndNew, setPendingSaveAndNew] = useState(false);
  const [itemLookup, setItemLookup] = useState<ItemLookup[]>([]);
  const [categoryLookup, setCategoryLookup] = useState<CategoryLookup[]>([]);

  // const isSameState = isSameStateCheck(selectedCustomer?.stateCode ?? '', COMPANY_STATE);

  
    const isSameState = isSameStateCheck(selectedCustomer?.stateCode ?? '', companyStateCode);
   
   
// ✅ Recalculate all items when isSameState changes (e.g. after companyStateCode loads)
useEffect(() => {
  if (!companyStateCode) return; // wait until company state is loaded
  setItems((prev) =>
    prev.map((item) => {
      if (!item.itemId && !item.itemName) return item; // skip empty rows
      const taxable = round2(item.qty * item.rate * (1 - item.discount / 100));
      const gst = calcGST(item.taxRate, taxable, isSameState);
      return {
        ...item,
        taxableAmount: taxable,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        total: round2(taxable + gst.cgst + gst.sgst + gst.igst),
      };
    })
  );
}, [isSameState, companyStateCode]);

  const totals = useMemo(() => calcTotals(items), [items]);
  const unusedCustomerCredits = selectedCustomer
    ? mockCustomerCredits.filter((c) => c.customerId === selectedCustomer.id && !c.isUsed)
    : [];
  const totalCustomerCreditAvailable = unusedCustomerCredits.reduce((sum, credit) => sum + (Number(credit.amount) || 0), 0);
  const customerBalance = Number(selectedCustomer?.balance ?? selectedCustomer?.openingBalance ?? 0) || 0;
  const customerCreditLimit = Number(selectedCustomer?.creditLimit ?? 0) || 0;
  const availableCreditAdjustment = Math.max(0, customerCreditLimit + customerBalance + totalCustomerCreditAvailable);
  const appliedCustomerCredit = creditApplied ? Math.min(availableCreditAdjustment, totals.grandTotal) : 0;
  const netPayable = Math.max(0, totals.grandTotal - appliedCustomerCredit);

  const buildCurrentDraft = useCallback((): SalesInvoiceDraft => ({
    invoiceNo,
    date,
    dueDate,
    salesman,
    warehouseId,
    selectedCustomer: selectedCustomer
      ? {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        gstin: selectedCustomer.gstin,
        phone: selectedCustomer.phone,
        stateCode: selectedCustomer.stateCode,
        billingAddress: selectedCustomer.billingAddress,
        shippingAddress: selectedCustomer.shippingAddress,
        creditLimit: selectedCustomer.creditLimit,
        openingBalance: selectedCustomer.openingBalance,
        balance: selectedCustomer.balance,
      }
      : null,
    billingAddress,
    shippingAddress,
    payment: {
      cash: payment.cash,
      upi: payment.upi,
      card: payment.card,
      cheque: payment.cheque,
      chequeBankName: payment.chequeBankName,
      chequeNo: payment.chequeNo,
      chequeDate: payment.chequeDate,
      chequeBranch: payment.chequeBranch,
    },
    narration,
    items,
    creditSkipped,
    creditApplied,
  }), [
    invoiceNo,
    date,
    dueDate,
    salesman,
    warehouseId,
    selectedCustomer,
    billingAddress,
    shippingAddress,
    payment,
    narration,
    items,
    creditSkipped,
    creditApplied,
  ]);

  const buildItemsFromDuplicatePrefill = useCallback((prefill: NonNullable<typeof duplicatePrefill>): InvoiceLineItem[] => (
    prefill.items.map((di) => {
      const taxable = round2(di.qty * di.rate * (1 - (di.discount ?? 0) / 100));
      const gst = calcGST(di.taxRate ?? 18, taxable, isSameState);

      return {
        ...emptyLineItem(),
        id: crypto.randomUUID(),
        itemId: di.itemId ?? '',
        itemCode: '',
        itemName: di.itemName,
        hsnCode: di.hsnCode ?? '',
        qty: di.qty,
        unit: di.unit || 'Pcs',
        unitId: '',
        rate: di.rate,
        discount: di.discount ?? 0,
        taxRate: di.taxRate ?? 18,
        taxableAmount: taxable,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        total: round2(taxable + gst.cgst + gst.sgst + gst.igst),
        categoryId: '',
      };
    })
  ), []);

  const buildItemsFromChallanPrefill = useCallback((prefill: NonNullable<typeof challanPrefill>): InvoiceLineItem[] => (
    prefill.items.map((ci) => {
      const qty = ci.qty > 0 ? ci.qty : 1;
      const rate = ci.rate || 0;
      const taxable = round2(qty * rate);
      const gst = calcGST(18, taxable, isSameState);

      return {
        ...emptyLineItem(),
        id: crypto.randomUUID(),
        itemId: '',
        itemCode: '',
        itemName: ci.itemName,
        hsnCode: '',
        qty,
        unit: ci.unit || 'Pcs',
        unitId: '',
        rate,
        discount: 0,
        taxRate: 18,
        taxableAmount: taxable,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        total: round2(taxable + gst.cgst + gst.sgst + gst.igst),
        categoryId: '',
      };
    })
  ), []);

  const buildItemsFromEditInvoice = useCallback((invoice: EditInvoiceState): InvoiceLineItem[] => (
    (invoice.items ?? []).map((item) => ({
      ...emptyLineItem(),
      id: item.id || crypto.randomUUID(),
      itemId: item.itemId || '',
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      hsnCode: item.hsnCode || '',
      qty: item.qty > 0 ? item.qty : 1,
      unit: item.unit || 'Pcs',
      unitId: item.unitId || '',
      rate: item.rate || 0,
      discount: item.discount || 0,
      taxRate: item.taxRate || 18,
      taxableAmount: item.taxableAmount || 0,
      cgst: item.cgst || 0,
      sgst: item.sgst || 0,
      igst: item.igst || 0,
      total: item.total || 0,
      categoryId: item.categoryId || '',
      narration: item.narration,
      currentStock: item.currentStock,
    }))
  ), []);

  const applyDraftToState = useCallback((draft: SalesInvoiceDraft) => {
    setInvoiceNo(draft?.invoiceNo || nextTempInvoiceNo());
    setDate(draft?.date || new Date().toISOString().split('T')[0]);
    setDueDate(draft?.dueDate || '');
    setSalesman(draft.salesman || '');
    setSelectedCustomer(draft.selectedCustomer ? {
      id: draft.selectedCustomer.id,
      name: draft.selectedCustomer.name,
      gstin: draft.selectedCustomer.gstin,
      phone: draft.selectedCustomer.phone,
      stateCode: draft.selectedCustomer.stateCode,
      billingAddress: draft.selectedCustomer.billingAddress,
      shippingAddress: draft.selectedCustomer.shippingAddress,
      creditLimit: draft.selectedCustomer.creditLimit,
      openingBalance: draft.selectedCustomer.openingBalance,
      balance: draft.selectedCustomer.balance,
    } : null);
    setBillingAddress(draft.billingAddress || '');
    setShippingAddress(draft.shippingAddress || '');
    setPayment(draft.payment);
    setNarration(draft.narration || '');
    setItems(draft.items.length > 0 ? draft.items : [emptyLineItem()]);
    setCreditSkipped(Boolean(draft.creditSkipped));
    setCreditApplied(Boolean(draft.creditApplied));
    setQuickAddIdx(null);
    setPrintOpen(false);
    setSaving(false);
    setOverstockRows(new Set());
    setMissingNarrationRows(new Set());
    setShowOverstockConfirm(false);
    setOverstockItems([]);
    setPendingSaveAndNew(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [itemsResult, categoriesResult] = await Promise.allSettled([
        filterItems({}),
        categoryService.list(),
      ]);

      if (!mounted) return;

      if (itemsResult.status === 'fulfilled') {
        setItemLookup((itemsResult.value.data ?? []).map((row: ItemResponse) => {
          const item = mapApiToItem(row);
          return {
            id: item.id,
            name: item.name,
            code: item.code,
            hsnCode: item.hsnCode,
            taxRate: item.taxRate,
            purchaseRate: item.purchaseRate,
            saleRate: item.saleRate,
            unit: item.unitName || 'Pcs',
            unitId: item.unitId,
            categoryId: item.categoryId || '',
          };
        }));
      } else {
        setItemLookup([]);
      }

      if (categoriesResult.status === 'fulfilled') {
        setCategoryLookup((categoriesResult.value as Array<{ id: string; name: string; requires_narration?: boolean }>).map((row) => ({
          id: row.id,
          name: row.name,
          requiresNarration: Boolean(row.requires_narration),
        })));
      } else {
        setCategoryLookup([]);
      }

     
     
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!activeTab) return;
    hydratingRef.current = true;
    const nextDraft =
      editInvoice
        ? {
          ...activeDraft,
          invoiceNo: editInvoice.invoiceNo,
          date: editInvoice.date,
          dueDate: editInvoice.date,
          selectedCustomer: {
            id: editInvoice.customerId || '',
            name: editInvoice.partyName || '',
            gstin: editInvoice.customerGstin || '',
            phone: '',
            stateCode: companyStateCode,
            billingAddress: editInvoice.billingAddress || '',
            shippingAddress: editInvoice.shippingAddress || editInvoice.billingAddress || '',
          },
          billingAddress: editInvoice.billingAddress || '',
          shippingAddress: editInvoice.shippingAddress || editInvoice.billingAddress || '',
          items: buildItemsFromEditInvoice(editInvoice),
        }
        : activeDraft.items.length > 0
        ? activeDraft
        : duplicatePrefill
          ? {
            ...activeDraft,
            selectedCustomer: {
              id: duplicatePrefill.partyId,
              name: duplicatePrefill.partyName,
              gstin: '',
              phone: '',
              stateCode: companyStateCode,
              billingAddress: '',
              shippingAddress: '',
            },
            items: buildItemsFromDuplicatePrefill(duplicatePrefill),
          }
          : challanPrefill
            ? {
              ...activeDraft,
              selectedCustomer: {
                id: '',
                name: challanPrefill.customerName,
                gstin: '',
                phone: '',
                stateCode: companyStateCode,
                billingAddress: '',
                shippingAddress: '',
              },
              items: buildItemsFromChallanPrefill(challanPrefill),
            }
            : activeDraft;
    applyDraftToState(nextDraft);
  }, [activeTabId, editInvoice, buildItemsFromEditInvoice, buildItemsFromDuplicatePrefill, buildItemsFromChallanPrefill]);

  useEffect(() => {
    if (!activeTabId) return;
    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }
    setTabDraft(activeTabId, buildCurrentDraft(), true);
  }, [
    activeTabId,
    invoiceNo,
    date,
    dueDate,
    salesman,
    warehouseId,
    selectedCustomer,
    billingAddress,
    shippingAddress,
    payment,
    narration,
    items,
    creditSkipped,
    creditApplied,
    setTabDraft,
    buildCurrentDraft,
  ]);

  useEffect(() => {
    if (!duplicatePrefill?.partyId) {
      duplicateCustomerHydratedRef.current = false;
      return;
    }
    if (duplicateCustomerHydratedRef.current) return;

    const hydrateDuplicateCustomer = async () => {
      try {
        const response = await getPartyById(duplicatePrefill.partyId);
        const matched = response.data;
        if (!matched) return;

        const enrichedCustomer = {
          id: matched.id,
          name: matched.name,
          gstin: matched.gstin ?? '',
          phone: matched.phone ?? '',
          stateCode: matched.state_code ?? selectedCustomer.stateCode ?? companyStateCode,
          billingAddress: matched.billing_address ?? selectedCustomer.billingAddress ?? '',
          shippingAddress: matched.shipping_address ?? matched.billing_address ?? selectedCustomer.shippingAddress ?? '',
          creditLimit: Number(matched.credit_limit ?? 0),
          openingBalance: Number(matched.opening_balance ?? 0),
          balance: Number((matched as unknown as { balance?: number }).balance ?? matched.opening_balance ?? 0),
        };

        duplicateCustomerHydratedRef.current = true;
        setSelectedCustomer(enrichedCustomer);
        setBillingAddress(enrichedCustomer.billingAddress);
        setShippingAddress(enrichedCustomer.shippingAddress);
      } catch {
        duplicateCustomerHydratedRef.current = true;
      }
    };

    void hydrateDuplicateCustomer();
  }, [duplicatePrefill?.partyId, duplicatePrefill?.partyName]);

  useEffect(() => {
    if (!editInvoice?.customerId) {
      editCustomerHydratedRef.current = false;
      return;
    }
    if (editCustomerHydratedRef.current) return;

    const hydrateEditCustomer = async () => {
      try {
        const response = await getPartyById(editInvoice.customerId);
        const matched = response.data;
        if (!matched) return;

        const enrichedCustomer = {
          id: matched.id,
          name: matched.name,
          gstin: matched.gstin ?? editInvoice.customerGstin ?? '',
          phone: matched.phone ?? '',
          stateCode: matched.state_code ?? selectedCustomer?.stateCode ?? companyStateCode,
          billingAddress: matched.billing_address ?? editInvoice.billingAddress ?? '',
          shippingAddress: matched.shipping_address ?? editInvoice.shippingAddress ?? editInvoice.billingAddress ?? '',
          creditLimit: Number(matched.credit_limit ?? 0),
          openingBalance: Number(matched.opening_balance ?? 0),
          balance: Number((matched as unknown as { balance?: number }).balance ?? matched.opening_balance ?? 0),
        };

        editCustomerHydratedRef.current = true;
        setSelectedCustomer(enrichedCustomer);
        setBillingAddress(enrichedCustomer.billingAddress);
        setShippingAddress(enrichedCustomer.shippingAddress);
      } catch {
        editCustomerHydratedRef.current = true;
      }
    };

    void hydrateEditCustomer();
  }, [companyStateCode, editInvoice?.billingAddress, editInvoice?.customerGstin, editInvoice?.customerId, editInvoice?.shippingAddress, selectedCustomer?.stateCode]);

  const resolveItemIdentity = useCallback((row: InvoiceLineItem): InvoiceLineItem => {
    if (row.itemId) return row;
    const qName = row.itemName.trim().toLowerCase();
    const qCode = row.itemCode.trim().toLowerCase();
    const found = itemLookup.find((s) => {
      const dbName = s.name.trim().toLowerCase();
      const dbCode = s.code.trim().toLowerCase();
      const byName = qName && (dbName === qName || dbName.includes(qName) || qName.includes(dbName));
      const byCode = qCode && s.code.trim().toLowerCase() === qCode;
      // Users often type exact item code in the searchable item field (row.itemName).
      const byTypedCodeInName = qName && dbCode === qName;
      return byName || byCode || byTypedCodeInName;
    });
    if (!found) return row;

    const patched = {
      ...row,
      itemId: found.id,
      itemCode: row.itemCode || found.code,
      itemName: row.itemName || found.name,
      hsnCode: row.hsnCode || found.hsnCode,
      unit: row.unit || found.unit,
      unitId: row.unitId || found.unitId,
      taxRate: row.taxRate || found.taxRate,
      rate: row.rate || found.saleRate,
      categoryId: row.categoryId || found.categoryId || '',
    };
    const taxable = round2(patched.qty * patched.rate * (1 - patched.discount / 100));
    const gst = calcGST(patched.taxRate, taxable, isSameState);
    return { ...patched, taxableAmount: taxable, ...gst, total: round2(taxable + gst.cgst + gst.sgst + gst.igst) };
  }, [isSameState, itemLookup]);

  useEffect(() => {
    if (!editInvoice || editInvoiceItemsHydratedRef.current) return;
    if (itemLookup.length === 0) return;

    setItems((prev) => {
      const hasInvoiceRows = prev.some((row) => row.itemId || row.itemCode || row.itemName);
      if (!hasInvoiceRows) return prev;

      editInvoiceItemsHydratedRef.current = true;
      return prev.map(resolveItemIdentity);
    });
  }, [editInvoice, itemLookup.length, resolveItemIdentity]);

  // Check if user can override stock (SUPER_ADMIN or SUB_ADMIN)
  const canOverrideStock = user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN';

  const handleCustomerSelect = useCallback((c: CustomerInfo) => {
    setSelectedCustomer(c);
    setBillingAddress(c.billingAddress);
    setShippingAddress(c.shippingAddress);
    setCreditSkipped(false);
    setCreditApplied(false);
  }, []);

  const persistCurrentDraft = useCallback(() => {
    if (!activeTabId) return;
    setTabDraft(activeTabId, buildCurrentDraft(), true);
  }, [activeTabId, buildCurrentDraft, setTabDraft]);

  const handleSelectTab = useCallback((tabId: string) => {
    persistCurrentDraft();
    setActiveTab(tabId);
  }, [persistCurrentDraft, setActiveTab]);

  const handleNewTab = useCallback(() => {
    persistCurrentDraft();
    addTab('SALE');
  }, [addTab, persistCurrentDraft]);

  const handleCloseTab = useCallback((tabId: string, isLastVisibleTab: boolean) => {
    if (tabId === activeTabId) {
      persistCurrentDraft();
    }
    closeTab(tabId);
    if (isLastVisibleTab) {
      navigate('/sales/invoices');
    }
  }, [activeTabId, closeTab, navigate, persistCurrentDraft]);

  const doSave = useCallback(async (andNew: boolean) => {
    const normalizedItems = items.map(resolveItemIdentity);
    const validItems = normalizedItems.filter((i) => i.itemId && i.qty > 0);
    if (validItems.length === 0) {
      console.table(normalizedItems.map((i) => ({
        itemName: i.itemName,
        itemCode: i.itemCode,
        itemId: i.itemId,
        qty: i.qty,
        rate: i.rate,
      })));
      toast.error('Add at least one item');
      return;
    }

    if (normalizedItems !== items) {
      setItems(normalizedItems);
    }

    setSaving(true);
    try {
      let savedInvoiceNo = invoiceNo;
      if (isBackendAvailable()) {
        const totalPaid = payment.cash + payment.upi + payment.card + payment.cheque;
        const paymentModesUsed = [
          payment.cash > 0 ? 'CASH' : null,
          payment.upi > 0 ? 'UPI' : null,
          payment.card > 0 ? 'CARD' : null,
          payment.cheque > 0 ? 'CHEQUE' : null,
          appliedCustomerCredit > 0 ? 'CREDIT_AMOUNT' : null,
        ].filter(Boolean) as string[];

        const paymentMode = paymentModesUsed.length === 1
          ? paymentModesUsed[0]
          : paymentModesUsed.length > 1
            ? 'MIXED'
            : 'CREDIT';

        const payload = {
          customerId: selectedCustomer!.id, warehouseId, date, billingAddress, shippingAddress,
          paymentMode,
          isSameState,
          amountReceived: totalPaid > 0 ? totalPaid : undefined,
          useCustomerCredit: Boolean(creditApplied),
          paymentBreakdown: {
            cash: payment.cash,
            upi: payment.upi,
            card: payment.card,
            cheque: payment.cheque,
            chequeBankName: payment.chequeBankName,
            chequeNo: payment.chequeNo,
            chequeDate: payment.chequeDate,
            chequeBranch: payment.chequeBranch,
          },
          notes: narration,
          items: validItems.map((i) => ({ itemId: i.itemId, qty: i.qty, rate: i.rate, discount: i.discount, taxRate: i.taxRate, hsnCode: i.hsnCode })),
        };
       
        (window as unknown as { __lastCreateInvoicePayload?: unknown }).__lastCreateInvoicePayload = payload;
        const created = await salesService.createInvoice(payload);
        if (created?.invoiceNo) {
          setInvoiceNo(created.invoiceNo);
          savedInvoiceNo = created.invoiceNo;
        }
      }
      if (activeTabId) markSaved(activeTabId, savedInvoiceNo);
      toast.success(`Invoice ${savedInvoiceNo} saved!`);
      if (andNew) {
        setItems([emptyLineItem()]); setSelectedCustomer(null); setBillingAddress(''); setShippingAddress(''); setPayment(emptyPayment()); setNarration('');
        setOverstockRows(new Set()); setMissingNarrationRows(new Set());
        setCreditSkipped(false);
        setCreditApplied(false);
        setInvoiceNo(nextTempInvoiceNo());
      } else {
        navigate('/sales/invoices');
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save invoice';
      toast.error(message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  }, [selectedCustomer, items, warehouseId, date, billingAddress, shippingAddress, payment, narration, totals, activeTabId, invoiceNo, navigate, toast, markSaved, resolveItemIdentity, appliedCustomerCredit, creditApplied]);

  const handleSave = useCallback(async (andNew = false) => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (!warehouseId) { toast.error('Please select a warehouse'); return; }
    const normalizedItems = items.map(resolveItemIdentity);
    const validItems = normalizedItems.filter((i) => i.itemId && i.qty > 0);
    if (validItems.length === 0) {
      console.table(normalizedItems.map((i) => ({
        itemName: i.itemName,
        itemCode: i.itemCode,
        itemId: i.itemId,
        qty: i.qty,
        rate: i.rate,
      })));
      toast.error('Add at least one item (select item from dropdown or exact item code)');
      return;
    }

    if (normalizedItems !== items) {
      setItems(normalizedItems);
    }

    const overstock: OverstockItem[] = [];
    const overstockIdxs = new Set<number>();
    normalizedItems.forEach((row, idx) => {
      if (!row.itemId || row.qty <= 0) return;
      const available = row.currentStock ?? 0;
      if (row.qty > available) {
        overstock.push({ rowIdx: idx, itemName: row.itemName, entered: row.qty, available });
        overstockIdxs.add(idx);
      }
    });
    if (overstock.length > 0) {
      setOverstockRows(overstockIdxs);
      setOverstockItems(overstock);
      setPendingSaveAndNew(andNew);
      setShowOverstockConfirm(true);
      return;
    }
    setOverstockRows(new Set());

    // ── Feature 3: Narration validation ──
    const missingNarr = new Set<number>();
    normalizedItems.forEach((row, idx) => {
      if (!row.itemId) return;
      const cat = categoryLookup.find((c) => c.id === row.categoryId);
      if (cat?.requiresNarration && !row.narration?.trim()) {
        missingNarr.add(idx);
      }
    });
    // if (missingNarr.size > 0) {
    //   setMissingNarrationRows(missingNarr);
    //   const firstMissing = items[Array.from(missingNarr)[0]];
    //   toast.error(`Serial/IMEI required for: ${firstMissing.itemName}`);
    //   return;
    // }
    // setMissingNarrationRows(new Set());

    // ── Feature 2: Stock validation ──
    await doSave(andNew);
  }, [selectedCustomer, warehouseId, items, doSave, toast, resolveItemIdentity, categoryLookup]);

  const handleOverstockConfirm = useCallback(async () => {
    setShowOverstockConfirm(false);
    setOverstockRows(new Set());
    setOverstockItems([]);
    await doSave(pendingSaveAndNew);
  }, [doSave, pendingSaveAndNew]);

  const handleOverstockCancel = useCallback(() => {
    setShowOverstockConfirm(false);
    // Keep red highlights so user can fix
  }, []);

  const handleQuickItemSaved = useCallback(async (data: ItemFormData) => {
    const created = await createItem({
      name: data.name,
      code: data.code,
      barcode: data.barcode,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      hsnCode: data.hsnCode,
      taxRate: data.taxRate,
      unitId: data.unitId,
      unitName: data.unitName,
      purchaseRate: data.purchaseRate,
      saleRate: data.saleRate,
      minStockLevel: data.minStockLevel,
      isActive: data.isActive,
    });

    if (!created.data) {
      throw new Error('Failed to create item');
    }

    const mapped = mapApiToItem(created.data);
    setItemLookup((prev) => [
      ...prev.filter((item) => item.id !== mapped.id),
      {
        id: mapped.id,
        name: mapped.name,
        code: mapped.code,
        hsnCode: mapped.hsnCode,
        taxRate: mapped.taxRate,
        purchaseRate: mapped.purchaseRate,
        saleRate: mapped.saleRate,
        unit: mapped.unitName || 'Pcs',
        unitId: mapped.unitId,
        categoryId: mapped.categoryId || '',
      },
    ]);

    if (quickAddIdx !== null) {
      setItems((prev) => prev.map((item, i) => {
        if (i !== quickAddIdx) return item;
        const rate = mapped.saleRate;
        const qty = item.qty > 0 ? item.qty : 1;
        const patched = {
          ...item,
          itemId: mapped.id,
          itemCode: mapped.code,
          itemName: mapped.name,
          hsnCode: mapped.hsnCode,
          taxRate: mapped.taxRate,
          qty,
          rate,
          unit: mapped.unitName,
          unitId: mapped.unitId,
          categoryId: mapped.categoryId || '',
        };
        const taxable = round2(patched.qty * patched.rate * (1 - patched.discount / 100));
        const gst = calcGST(patched.taxRate, taxable, isSameState);
        return { ...patched, taxableAmount: taxable, ...gst, total: round2(taxable + gst.cgst + gst.sgst + gst.igst) };
      }));
    }
    setQuickAddIdx(null);
    toast.success(`Item "${mapped.name}" added and selected`);
  }, [quickAddIdx, isSameState, toast]);

  const buildPrintData = () => ({
    invoiceNo, date, customerName: selectedCustomer?.name ?? '—', customerGstin: selectedCustomer?.gstin,
    billingAddress, shippingAddress, paymentMode: 'CASH' as const,
    items: items.filter((i) => i.itemName).map((i, idx) => ({ sr: idx + 1, name: i.itemName, hsn: i.hsnCode, qty: i.qty, unit: i.unit, rate: i.rate, discount: i.discount, taxable: i.taxableAmount, taxRate: i.taxRate, taxAmt: i.cgst + i.sgst + i.igst, total: i.total })),
    subtotal: totals.subtotal, totalDiscount: totals.totalDiscount, taxableAmount: totals.taxableAmount,
    cgst: totals.totalCGST, sgst: totals.totalSGST, igst: totals.totalIGST, roundOff: totals.roundOff, grandTotal: totals.grandTotal, isSameState, notes: narration,
  });

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <BillingTabBar
          voucherType="SALE"
          onNewTab={handleNewTab}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] pb-16">
          {/* Page header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-bold text-[#1e293b]">{editInvoice?'Edit Sales Invoice':'New Sales Invoice'}</h1>
                <p className="text-xs text-slate-400">{invoiceNo}</p>
              </div>
              {activeTab?.isDirty && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors">
                <i className="ri-save-line text-xs" /> Submit &amp; New <kbd className="text-[10px] bg-[#e2e8f0] px-1 rounded ml-0.5">F8</kbd>
              </button> */}
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors">
                {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-3-line" /> Submit <kbd className="text-[10px] bg-white/20 px-1 rounded ml-0.5">F9</kbd></>}
              </button>
            </div>
          </div>

          {/* ── SECTION 1: ITEMS TABLE ── */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Items</span>
              <span className="text-xs text-slate-400">
                <i className="ri-barcode-line mr-1" />
                Scan barcode or type · Enter / Arrow keys to navigate
              </span>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              <InvoiceItemsTable
                items={items}
                onChange={setItems}
                isSameState={isSameState}
                warehouseId={warehouseId}
                rateType="sale"
                onAddNewItem={setQuickAddIdx}
                overstockRows={overstockRows}
                missingNarrationRows={missingNarrationRows}
              />
            </div>
          </div>

          {/* ── PART E: Customer Credit Banner ── */}
          {selectedCustomer && unusedCustomerCredits.length > 0 && !creditSkipped && !creditApplied && (
            <div className="px-5 pt-3">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-100 shrink-0">
                    <i className="ri-wallet-3-line text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Credit Available: {formatINR(totalCustomerCreditAvailable)}
                    </p>
                    <p className="text-xs text-amber-600">
                      {unusedCustomerCredits.map((credit) => `${formatINR(credit.amount)} from ${credit.sourceReturnNumber}`).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setCreditApplied(true)}
                    className="h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Apply to Invoice
                  </button>
                  <button
                    onClick={() => setCreditSkipped(true)}
                    className="h-8 px-3 rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* {selectedCustomer && creditApplied && (
            <div className="px-5 pt-3">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 shrink-0">
                    <i className="ri-check-double-line text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Credit Applied: -{formatINR(totalCustomerCreditAvailable)} · Net Payable: {formatINR(netPayable)}
                    </p>
                    <p className="text-xs text-emerald-600">Credit will be consumed when this invoice is saved</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreditApplied(false)}
                  className="h-7 px-2.5 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-medium hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                >
                  Remove
                </button>
              </div>
            </div>
          )} */}

          {/* ── SECTION 2: BOTTOM 3-COLUMN ── */}
          <div className="px-5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CustomerSection
              selected={selectedCustomer}
              onSelect={handleCustomerSelect}
              billingAddress={billingAddress}
              shippingAddress={shippingAddress}
              onBillingAddressChange={setBillingAddress}
              onShippingAddressChange={setShippingAddress}
            />
            <PaymentSection
              payment={payment}
              onChange={setPayment}
              invoiceTotal={totals.grandTotal}
              customerCreditLimit={customerCreditLimit}
              customerBalance={customerBalance}
              availableCreditAdjustment={availableCreditAdjustment}
              creditApplied={creditApplied}
              onApplyCreditAdjustment={() => setCreditApplied(true)}
              onRemoveCreditAdjustment={() => setCreditApplied(false)}
            />
            
            <InvoiceInfoSummary
              invoiceNo={invoiceNo} date={date} dueDate={dueDate} salesman={salesman}
               isSameState={isSameState} totals={totals}
              netPayable={netPayable}
              totalPaid={payment.cash + payment.upi + payment.card + payment.cheque}
              onDateChange={setDate} onDueDateChange={setDueDate} onSalesmanChange={setSalesman}
              challanPrefill={challanPrefill}
              
            />
          </div>

          {/* ── SECTION 3: NARRATION BAR ── */}
          <div className="px-5 pt-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">Narration</label>
              <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
                placeholder="Optional invoice note..."
                className="flex-1 h-8 px-2 text-sm bg-transparent focus:outline-none text-[#1e293b] placeholder:text-slate-400" />
            </div>
          </div>
        </div>

        {/* Overstock confirm dialog */}
        <ConfirmDialog
          open={showOverstockConfirm}
          title="Some items exceed available stock"
          message={`${overstockItems.map((o) => `${o.itemName} — Entered: ${o.entered}, Available: ${o.available}`).join('\n')}\n\nThis will reduce stock below zero if you continue.`}
          confirmLabel="Yes, Save Anyway"
          cancelLabel="No, Fix Quantities"
          variant="warning"
          onConfirm={handleOverstockConfirm}
          onCancel={handleOverstockCancel}
        />

        {/* Print preview */}
        {printOpen && (
          <PrintSalesInvoice data={buildPrintData()} onClose={() => setPrintOpen(false)} onPrint={() => printSalesInvoice(buildPrintData())} />
        )}

        {/* Quick Add Item */}
        <ItemForm open={quickAddIdx !== null} initialData={{}} isEditing={false} onClose={() => setQuickAddIdx(null)} onSave={handleQuickItemSaved} />

        <ShortcutBar
          onSave={() => handleSave(false)} onSaveAndNew={() => handleSave(true)}
          onPrint={() => setPrintOpen(true)} onBack={() => navigate('/sales/invoices')}
          saving={saving} isDirty={activeTab?.isDirty}
        />
      </div>
    </AppLayout>
  );
}
