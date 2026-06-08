import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import BillingTabBar from '@/pages/billing/components/BillingTabBar';
import ShortcutBar from '@/components/feature/ShortcutBar';
import { useToast } from '@/contexts/ToastContext';
//import { mockCompany } from '@/mocks/masters';
import POHeaderBar from './components/POHeaderBar';
import POItemsTable from './components/POItemsTable';
import POSummaryPanel from './components/POSummaryPanel';
import POSupplierPanel from './components/POSupplierPanel';
import POInfoPanel from './components/POInfoPanel';
import { apiCreatePO } from '@/api/purchaseOrderApi';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useCompanyState } from '@/hooks/useCompanyState';
import { useBillingTabStore } from '@/stores/billingTabStore';

import {
  createItem,
  filterItems,
  mapApiToItem,
  type ItemResponse,
} from '@/api/item.api';
import { ItemFormData } from '@/pages/masters/items/components/ItemForm';

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
}

export interface POSupplier {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  stateCode: string;
  address: string;
  city: string;
}

export interface POItem {
  id: string;
  itemId: string;
  itemName: string;
  barcode: string;
  size: string;
  hsnCode: string;
  gstRate: number;
  group: string;
  brand: string;
  articleNo: string;
  qty: number;
  purRate: number;
  lastPrice: number | null;
  lastSupplier: string;
  lastDate: string;
  amount: number;
  unitId?: string;
  stock?: number;
}

export type POPriority = 'Normal' | 'High' | 'Urgent' | 'Critical';

interface POFormDraft {
  supplier: POSupplier | null;
  poDate: string;
  expectedDelivery: string;
  items: POItem[];
  priority: POPriority;
  billingAddress: string;
  termsConditions: string;
  deliveryAddress: string;
  paymentTerms: string;
  narration: string;
}

interface PersistedPODrafts {
  drafts: POFormDraft[];
  activeIndex: number;
}

const PO_DRAFTS_STORAGE_KEY = 'po_drafts_v1';

const emptyPOItem = (): POItem => ({
  id: crypto.randomUUID(),
  itemId: '',
  itemName: '',
  barcode: '',
  size: '',
  hsnCode: '',
  gstRate: 0,
  group: '',
  brand: '',
  articleNo: '',
  qty: 1,
  purRate: 0,
  lastPrice: null,
  lastSupplier: '',
  lastDate: '',
  amount: 0,
});

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mapPriority(p: POPriority): string {
  const map: Record<POPriority, string> = {
    Normal: 'NORMAL', High: 'HIGH', Urgent: 'URGENT', Critical: 'URGENT',
  };
  return map[p];
}

const createEmptyPOFormDraft = (): POFormDraft => ({
  supplier: null,
  poDate: todayStr(),
  expectedDelivery: '',
  items: [emptyPOItem()],
  priority: 'Normal',
  billingAddress: '',
  termsConditions: '',
  deliveryAddress: '',
  paymentTerms: '30 Days',
  narration: '',
});

const normalizeDraft = (draft?: Partial<POFormDraft> | null): POFormDraft => {
  const base = createEmptyPOFormDraft();
  if (!draft) return base;
  return {
    ...base,
    ...draft,
    items: draft.items && draft.items.length > 0 ? draft.items : base.items,
  };
};

const resetForm = (
  setSupplier: (v: null) => void,
  setPoDate: (v: string) => void,
  setExpectedDelivery: (v: string) => void,
  setItems: (v: POItem[]) => void,
  setPriority: (v: POPriority) => void,
  setBillingAddress: (v: string) => void,
  setTermsConditions: (v: string) => void,
  setDeliveryAddress: (v: string) => void,
  setPaymentTerms: (v: string) => void,
  setNarration: (v: string) => void,
) => {
  setSupplier(null);
  setPoDate(todayStr());
  setExpectedDelivery('');
  setItems([emptyPOItem()]);
  setPriority('Normal');
  setBillingAddress('');
  setTermsConditions('');
  setDeliveryAddress('');
  setPaymentTerms('30 Days');
  setNarration('');
};

export default function PurchaseOrderNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { tabs, activeTabId, addTab, setActiveTab, closeTab } = useBillingTabStore();
  const draftsRef = useRef<Record<string, POFormDraft>>({});
  const hydratingTabRef = useRef(false);
  const initTabRef = useRef(false);
  const pendingHydrationRef = useRef<POFormDraft[] | null>(null);
  const pendingActiveIndexRef = useRef<number | null>(null);
  const skipPersistRef = useRef(false);

  const [supplier, setSupplier] = useState<POSupplier | null>(null);
  const [poDate, setPoDate] = useState(todayStr());
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [poNumber] = useState('Auto-generated');

  const [items, setItems] = useState<POItem[]>([emptyPOItem()]);
  const tableRef = useRef<HTMLDivElement>(null);

  const [priority, setPriority] = useState<POPriority>('Normal');
  const [billingAddress, setBillingAddress] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 Days');
  const [narration, setNarration] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
  const [quickAddRowId, setQuickAddRowId] = useState<string | null>(null);

  useEffect(() => {
    if (initTabRef.current) return;
    initTabRef.current = true;
    const stored = localStorage.getItem(PO_DRAFTS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PersistedPODrafts;
        if (Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
          pendingHydrationRef.current = parsed.drafts.map((draft) => normalizeDraft(draft));
          pendingActiveIndexRef.current = Math.max(0, parsed.activeIndex ?? 0);
          skipPersistRef.current = true;
          parsed.drafts.forEach(() => addTab('PURCHASE'));
          return;
        }
      } catch {
        // Ignore invalid storage
      }
    }
    if (!tabs.some((t) => t.voucherType === 'PURCHASE')) addTab('PURCHASE');
  }, [tabs, addTab]);

  useEffect(() => {
    const pendingDrafts = pendingHydrationRef.current;
    if (!pendingDrafts) return;
    const purchaseTabs = tabs.filter((t) => t.voucherType === 'PURCHASE');
    if (purchaseTabs.length < pendingDrafts.length) return;

    purchaseTabs.slice(0, pendingDrafts.length).forEach((tab, idx) => {
      draftsRef.current[tab.id] = normalizeDraft(pendingDrafts[idx]);
    });

    const targetIndex = pendingActiveIndexRef.current ?? 0;
    const targetTab = purchaseTabs[Math.min(targetIndex, pendingDrafts.length - 1)];
    if (targetTab) {
      setActiveTab(targetTab.id);
    }

    pendingHydrationRef.current = null;
    pendingActiveIndexRef.current = null;
  }, [tabs, setActiveTab]);

  useEffect(() => {
    const purchaseTabs = tabs.filter((t) => t.voucherType === 'PURCHASE');
    if (purchaseTabs.length === 0) return;
    if (!activeTabId || !purchaseTabs.some((t) => t.id === activeTabId)) {
      setActiveTab(purchaseTabs[0].id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  const activePurchaseTabId = tabs.some((t) => t.id === activeTabId && t.voucherType === 'PURCHASE')
    ? activeTabId
    : tabs.find((t) => t.voucherType === 'PURCHASE')?.id ?? null;

  const [itemLookup, setItemLookup] = useState<ItemLookup[]>([]);

  useEffect(() => {
    if (!activePurchaseTabId) return;
    hydratingTabRef.current = true;
    const draft = draftsRef.current[activePurchaseTabId] ?? createEmptyPOFormDraft();
    draftsRef.current[activePurchaseTabId] = draft;
    setSupplier(draft.supplier);
    setPoDate(draft.poDate);
    setExpectedDelivery(draft.expectedDelivery);
    setItems(draft.items.length > 0 ? draft.items : [emptyPOItem()]);
    setPriority(draft.priority);
    setBillingAddress(draft.billingAddress);
    setTermsConditions(draft.termsConditions);
    setDeliveryAddress(draft.deliveryAddress);
    setPaymentTerms(draft.paymentTerms);
    setNarration(draft.narration);
    setQuickAddRowId(null);
  }, [activePurchaseTabId]);

  useEffect(() => {
    if (!activePurchaseTabId) return;
    if (hydratingTabRef.current) {
      hydratingTabRef.current = false;
      return;
    }
    draftsRef.current[activePurchaseTabId] = {
      supplier,
      poDate,
      expectedDelivery,
      items,
      priority,
      billingAddress,
      termsConditions,
      deliveryAddress,
      paymentTerms,
      narration,
    };
  }, [
    activePurchaseTabId,
    supplier,
    poDate,
    expectedDelivery,
    items,
    priority,
    billingAddress,
    termsConditions,
    deliveryAddress,
    paymentTerms,
    narration,
  ]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    const purchaseTabs = tabs.filter((t) => t.voucherType === 'PURCHASE');
    if (purchaseTabs.length === 0) return;
    const drafts = purchaseTabs.map((tab) => normalizeDraft(draftsRef.current[tab.id]));
    const activeIndex = Math.max(0, purchaseTabs.findIndex((t) => t.id === activePurchaseTabId));
    const payload: PersistedPODrafts = { drafts, activeIndex };
    localStorage.setItem(PO_DRAFTS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    tabs,
    activePurchaseTabId,
    supplier,
    poDate,
    expectedDelivery,
    items,
    priority,
    billingAddress,
    termsConditions,
    deliveryAddress,
    paymentTerms,
    narration,
  ]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const result = await filterItems({});

        if (!mounted) return;

        setItemLookup(
          (result.data ?? []).map((row: ItemResponse) => {
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
            };
          }),
        );
      } catch {
        setItemLookup([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const companyStateCode = useCompanyState();
  const gstType: 'CGST_SGST' | 'IGST' =
    supplier?.stateCode && companyStateCode && supplier.stateCode === companyStateCode
      ? 'CGST_SGST'
      : 'IGST';

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);
  const totalItems = items.filter((i) => i.itemName).length;


  const gstBreakdown = items
    .filter((i) => i.itemName && i.amount > 0)
    .reduce(
      (acc, i) => {
        const taxable = i.amount / (1 + i.gstRate / 100);
        const gstAmt = i.amount - taxable;
        if (gstType === 'CGST_SGST') { acc.cgst += gstAmt / 2; acc.sgst += gstAmt / 2; }
        else { acc.igst += gstAmt; }
        return acc;
      },
      { cgst: 0, sgst: 0, igst: 0 },
    );

  const totalGST = gstBreakdown.cgst + gstBreakdown.sgst + gstBreakdown.igst;

  const grandTotal = subtotal + totalGST;



  const handleSupplierSelect = useCallback((s: POSupplier | null) => {
    setSupplier(s);
    if (s) {
      setBillingAddress(s.address);
      setDeliveryAddress(s.address);
    }
  }, []);

  const addRow = useCallback(() => setItems((prev) => [...prev, emptyPOItem()]), []);

  const updateItem = useCallback((id: string, patch: Partial<POItem>) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...patch };
        updated.amount = Math.round(updated.qty * updated.purRate * 100) / 100;
        return updated;
      }),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }, []);

  const persistCurrentDraft = useCallback(() => {
    if (!activePurchaseTabId) return;
    draftsRef.current[activePurchaseTabId] = {
      supplier,
      poDate,
      expectedDelivery,
      items,
      priority,
      billingAddress,
      termsConditions,
      deliveryAddress,
      paymentTerms,
      narration,
    };
  }, [
    activePurchaseTabId,
    supplier,
    poDate,
    expectedDelivery,
    items,
    priority,
    billingAddress,
    termsConditions,
    deliveryAddress,
    paymentTerms,
    narration,
  ]);

  const handleSelectTab = useCallback((tabId: string) => {
    persistCurrentDraft();
    setActiveTab(tabId);
  }, [persistCurrentDraft, setActiveTab]);

  const handleNewTab = useCallback(() => {
    persistCurrentDraft();
    addTab('PURCHASE');
  }, [addTab, persistCurrentDraft]);

  const handleCloseTab = useCallback((tabId: string, isLastVisibleTab: boolean) => {
    if (tabId === activePurchaseTabId) {
      persistCurrentDraft();
    }
    closeTab(tabId);
    if (isLastVisibleTab) {
      navigate('/purchase/orders');
    }
  }, [activePurchaseTabId, closeTab, navigate, persistCurrentDraft]);

  const handleAddNewItem = useCallback((_query: string, rowId: string) => {
    setQuickAddRowId(rowId);
  }, []);

  const handleQuickItemSaved = useCallback(
    async (data: ItemFormData) => {
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
        },
      ]);

      if (quickAddRowId) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== quickAddRowId) return item;

            const qty = item.qty || 1;
            const purRate = mapped.purchaseRate || 0;

            return {
              ...item,
              itemId: mapped.id,
              itemName: mapped.name,
              hsnCode: mapped.hsnCode,
              gstRate: mapped.taxRate,
              purRate,
              qty,
              amount: Math.round(qty * purRate * 100) / 100,
              unitId: mapped.unitId,
            };
          }),
        );
      }

      setQuickAddRowId(null);

      toast.success(`Item "${mapped.name}" added and selected`);
    },
    [quickAddRowId, toast],
  );

  // ✅ FIX: buildPayload is a plain object builder — NOT invoked as buildPayload()()
  // ✅ FIX: removed unitId filter — PO backend doesn't require unitId
  const buildPayload = useCallback(() => {
    const validItems = items.filter((i) => i.itemName && i.qty > 0 && i.purRate > 0);
    return {
      supplierId: supplier!.id,
      date: poDate,
      expectedDelivery: expectedDelivery || undefined,
      warehouseId: selectedWarehouseId,
      priority: mapPriority(priority),
      billingAddress: billingAddress || undefined,
      deliveryAddress: deliveryAddress || undefined,
      paymentTerms: paymentTerms || undefined,
      termsConditions: termsConditions || undefined,
      notes: narration || undefined,
      totalAmount: grandTotal || 0,
      items: validItems.map((i) => ({
        itemId: i.itemId || undefined,
        itemName: i.itemName,
        hsnCode: i.hsnCode || undefined,
        orderedQty: i.qty,
        receivedQty: 0,
        unit: 'Pcs',
        rate: i.purRate,
        gstRate: i.gstRate,
        size: i.size || undefined,
        group: i.group || undefined,
        brand: i.brand || undefined,
        articleNo: i.articleNo || undefined,
      })),
    };
  }, [
    supplier,
    items,
    poDate,
    expectedDelivery,
    priority,
    billingAddress,
    deliveryAddress,
    paymentTerms,
    termsConditions,
    narration,
    selectedWarehouseId,
    grandTotal,
  ]);

  const handleSave = useCallback(async () => {
    if (!supplier) { toast.error('Please select a supplier'); return; }
    const validItems = items.filter((i) => i.itemName && i.qty > 0 && i.purRate > 0);
    if (validItems.length === 0) { toast.error('Add at least one item with quantity and rate'); return; }

    setSaving(true);
    try {
      // ✅ FIX: call buildPayload() once and pass result — was erroneously called as apiCreatePO(buildPayload()())
      const payload = buildPayload();
      console.log('PO PAYLOAD:', payload);
      const res = await apiCreatePO(payload);
      if (!res.success) { toast.error(res.message ?? 'Failed to create purchase order'); return; }
      toast.success(res.message);
      navigate('/purchase/orders');
    } catch (err) {
      console.error('Save PO error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [supplier, items, buildPayload, toast, navigate]);

  const handleSaveNew = useCallback(async () => {
    if (!supplier) { toast.error('Please select a supplier'); return; }
    const validItems = items.filter((i) => i.itemName && i.qty > 0 && i.purRate > 0);
    if (validItems.length === 0) { toast.error('Add at least one item with quantity and rate'); return; }

    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await apiCreatePO(payload);
      if (!res.success) { toast.error(res.message ?? 'Failed to create purchase order'); return; }
      toast.success(res.message);
      resetForm(setSupplier, setPoDate, setExpectedDelivery, setItems, setPriority, setBillingAddress, setTermsConditions, setDeliveryAddress, setPaymentTerms, setNarration);
      if (activePurchaseTabId) {
        draftsRef.current[activePurchaseTabId] = createEmptyPOFormDraft();
      }
    } catch (err) {
      console.error('Save PO error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [supplier, items, buildPayload, toast, activePurchaseTabId]);

  const handlePrint = useCallback(() => {
    toast.info('Print feature coming soon');
  }, [toast]);

  return (
    <AppLayout>
      <div className="flex flex-col h-screen overflow-hidden relative z-0">
        <BillingTabBar
          voucherType="PURCHASE"
          onNewTab={handleNewTab}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />

        <POHeaderBar
          supplier={supplier}
          onSupplierSelect={handleSupplierSelect}
          poDate={poDate}
          onPoDateChange={setPoDate}
          expectedDelivery={expectedDelivery}
          onExpectedDeliveryChange={setExpectedDelivery}
          poNumber={poNumber}
          gstType={gstType}
        />

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] pb-16">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
                  <span>Purchase</span>
                  <i className="ri-arrow-right-s-line" />
                  <span className="text-[#4f46e5] font-semibold">New Purchase Order</span>
                </div>
                <p className="text-xs text-slate-400">{poNumber}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <i className="ri-time-line text-xs" />
                PENDING
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSaveNew} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">
                <i className="ri-save-line text-xs" /> Save &amp; New <kbd className="text-[10px] bg-[#e2e8f0] px-1 rounded ml-0.5">F8</kbd>
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50">
                {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-3-line" /> Save PO <kbd className="text-[10px] bg-white/20 px-1 rounded ml-0.5">F9</kbd></>}
              </button>
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Item Details</span>
              <span className="text-xs text-slate-400"><i className="ri-barcode-line mr-1" />Scan barcode or type · Enter / Arrow keys to navigate</span>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-visible" >
              <POItemsTable
                items={items}
                tableRef={tableRef}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
                onAddRow={addRow}
                onAddNewItem={handleAddNewItem}
              />
            </div>
          </div>

          <div className="px-5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <POSummaryPanel totalItems={totalItems} totalQty={totalQty} subtotal={subtotal}
              cgst={gstBreakdown.cgst} sgst={gstBreakdown.sgst} igst={gstBreakdown.igst}
              grandTotal={grandTotal} gstType={gstType} priority={priority} onPriorityChange={setPriority} />
            <POSupplierPanel supplier={supplier} billingAddress={billingAddress}
              onBillingAddressChange={setBillingAddress} termsConditions={termsConditions} onTermsChange={setTermsConditions} />
            <POInfoPanel poNumber={poNumber} poDate={poDate} deliveryAddress={deliveryAddress}
              billingAddress={billingAddress} onDeliveryAddressChange={setDeliveryAddress}
              paymentTerms={paymentTerms} onPaymentTermsChange={setPaymentTerms} />
          </div>

          <div className="px-5 pt-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">Narration</label>
              <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
                placeholder="Add a note for this purchase order..."
                className="flex-1 h-8 px-2 text-sm bg-transparent focus:outline-none text-[#1e293b] placeholder:text-slate-400" />
            </div>
          </div>

          
        </div>

        {/* <PONewItemOverlay
          open={quickAddRowId !== null}
          initialData={{}}
          onClose={() => setQuickAddRowId(null)}
          onSave={handleQuickItemSaved}
        /> */}

        <ShortcutBar onSave={handleSave} onSaveNew={handleSaveNew} onPrint={handlePrint}
          onBack={() => navigate('/purchase/orders')} isDirty={items.some((i) => i.itemName) || !!supplier} />
      </div>
    </AppLayout>
  );
}