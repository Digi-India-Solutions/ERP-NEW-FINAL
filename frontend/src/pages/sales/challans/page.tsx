import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import ItemEntryTable from '@/pages/billing/components/ItemEntryTable';
import PrintChallan from '@/components/print/PrintChallan';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import ChallanDetailModal from '@/pages/sales/challans/components/ChallanDetailModal';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';        // ← added
import { MODULES } from '@/utils/permissions';           // ← added
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useBillingTabStore } from '@/stores/billingTabStore';
import { emptyLineItem, type InvoiceLineItem } from '@/types/billing';
import type { MockChallanDetail } from '@/mocks/billing';
import { printChallan } from '@/utils/printDocument';
import { salesService } from '@/services/salesService';
import { isBackendAvailable } from '@/api/client';
import { filterParties, type PartyResponse , getCustomers} from '@/api/party.api';
import { filterItems, mapApiToItem, type ItemResponse } from '@/api/item.api';
import type { OutwardGPPrefill } from '@/pages/inventory/gate-pass/outward/page';
import { deleteData } from "../../../services/FetchNodeServices.js"
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useCompanyState } from '@/hooks/useCompanyState';
import { isSameStateCheck } from '@/utils/gst';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  DISPATCHED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

interface Customer { id: string; name: string; address: string , stateCode?: string;}
interface ItemLookup { id: string; name: string; code: string; unit: string; saleRate: number }

interface FromInvoiceState {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: Array<{
    itemId?: string;
    itemCode?: string;
    itemName: string;
    hsnCode: string;
    qty: number;
    unit: string;
    unitId?: string;
    rate: number;
    taxRate?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    taxableAmount?: number;
  }>;
}

const buildFrontendChallanNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const stamp = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `DC-${year}-${stamp}`;
};

// ─── Customer search input ────────────────────────────────────────────────────
function CustomerSearch({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (c: Customer) => void;
}) {
  const [options, setOptions] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const { selectedWarehouseId, setSelectedWarehouse } = useWarehouseStore();
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
  if (!q.trim()) {
    setOptions([]);
    setOpen(false);
    return;
  }

  setLoading(true);

  try {
    const res = await getCustomers();

    const mapped = (res.data ?? [])
      .filter((p: PartyResponse) =>
        (p.type === 'Customer' || p.type === 'Both') &&
        p.name.toLowerCase().includes(q.toLowerCase())
      )
      .map((p: PartyResponse) => ({
        id: p.id,
        name: p.name,
        address: p.billing_address ?? '',
        stateCode: p.state_code ?? '',
      }));

    setOptions(mapped);
    setOpen(true);
    setHighlighted(-1);

  } catch {
    setOptions([]);
  } finally {
    setLoading(false);
  }
}, []);


  // const doSearch = useCallback(async (q: string) => {
  //   if (!q.trim()) { setOptions([]); setOpen(false); return; }
  //   setLoading(true);
  //   try {
  //     const res = await filterParties({ type: 'customer', isActive: true, search: q });
  //     const mapped = (res.data ?? [])
  //       .filter((p: PartyResponse) => p.type === 'Customer' || p.type === 'Both')
  //       .map((p: PartyResponse) => ({ id: p.id, name: p.name, address: p.billing_address ?? '' , stateCode: p.state_code ?? ''}));
  //     setOptions(mapped);
  //     setOpen(true);
  //     setHighlighted(-1);
  //   } catch { setOptions([]); }
  //   finally { setLoading(false); }
  // }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !options.length) {
      if (e.key === 'ArrowDown' && value.trim()) doSearch(value);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((p) => Math.min(p + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(options[highlighted]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const select = (c: Customer) => {
    onChange(c.name);
    onSelect(c);
    setOpen(false);
    setOptions([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (options.length) setOpen(true); }}
        placeholder="Search customer..."
        className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]"
      />
      {loading && (
        <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
      )}
      {open && options.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(c); }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${idx === highlighted ? 'bg-indigo-50 text-[#4f46e5]' : 'hover:bg-slate-50 text-[#1e293b]'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {open && !loading && options.length === 0 && value.trim() && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-sm px-3 py-3 text-xs text-slate-400">
          No customers found
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChallansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const headerRef = useRef<HTMLDivElement>(null);
  useKeyboardNav(headerRef as React.RefObject<HTMLElement>);
  const { addTabWithChallan } = useBillingTabStore();

  // ── Permission flags ────────────────────────────────────────────────────
  const { hasPermission , hasControl} = useAuth();
  const canCreate  = hasPermission(MODULES.CHALLAN, 'create');
  const canUpdate  = hasPermission(MODULES.CHALLAN, 'edit');
  const canDelete  = hasPermission(MODULES.CHALLAN, 'delete');
  // "Convert to Invoice" needs create permission on SALES_INVOICE
  const canConvert = hasPermission(MODULES.SALES_INVOICE, 'create') || hasControl('convertChallan');
  // ───────────────────────────────────────────────────────────────────────

  const [mode, setMode]                       = useState<'list' | 'new'>('list');
  const [challans, setChallans]               = useState<MockChallanDetail[]>([]);
  const [detailChallan, setDetailChallan]     = useState<MockChallanDetail | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [fromInvoiceBadge, setFromInvoiceBadge] = useState<string | null>(null);

  // Form state
  const [orderMode, setOrderMode] = useState<'order' | 'manual'>('manual');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const companyStateCode = useCompanyState();
  
const isSameState = isSameStateCheck(
  selectedCustomer?.stateCode ?? '', 
  companyStateCode
);
  /**
   * Challan No is AUTO-GENERATED by the backend.
   * We show '' initially (placeholder "Auto Generated") and populate
   * it either from the backend /next-number endpoint (if available)
   * or keep it empty — the backend returns the real number on save.
   */
  const [challanNo, setChallanNo] = useState('');
  const [loadingChallanNo, setLoadingChallanNo] = useState(false);

  const { selectedWarehouseId: warehouseId } = useWarehouseStore();
  const [itemLookup, setItemLookup] = useState<ItemLookup[]>([]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);
  const [saving, setSaving] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [loadingChallans, setLoadingChallans] = useState(false);

  // ── Fetch next challan number from backend when entering new mode ──────
  const fetchNextChallanNo = useCallback(async () => {
    setLoadingChallanNo(true);
    try {
      setChallanNo(buildFrontendChallanNo());
    } catch (err) {
      console.error('Error initializing challan number:', err);
      setChallanNo(buildFrontendChallanNo());
    } finally {
      setLoadingChallanNo(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'new') void fetchNextChallanNo();
  }, [mode, fetchNextChallanNo]);

  const handleGenerateOutwardGPFromChallan = async (challan: MockChallanDetail) => {
    let challanDetail = challan;

    if (!challan.items || challan.items.length === 0) {
      try {
        if (!isBackendAvailable()) {
          toast.error('Cannot fetch challan details');
          return;
        }

        const detail = await salesService.getChallan(challan.id);
        challanDetail = {
          ...challan,
          id: detail.id,
          billNo: detail.invoiceNo || challan.billNo,
          partyName: detail.partyName || challan.partyName,
          items: (detail.items ?? []).map((item, index) => ({
            id: item.id || `${challan.id}-item-${index}`,
            itemName: String((item as any).itemName || (item as any).item_name || '—'),
            qty: Number((item as any).qty || (item as any).quantity || 0),
            unit: String((item as any).unit || (item as any).unitName || 'Pcs'),
            rate: Number((item as any).rate || 0),
            amount: Number((item as any).amount || 0),
          })),
        };
      } catch {
        toast.error('Failed to load challan details');
        return;
      }
    }

    const prefill: OutwardGPPrefill = {
      partyName: challanDetail.partyName,
      linkedDocType: 'CHALLAN',
      linkedDocNumber: challanDetail.id,
      notes: `Generated from Challan ${challanDetail.billNo}`,
      items: (challanDetail.items || []).map((i) => ({
        itemName: i.itemName,
        qty: i.qty,
        unit: i.unit || 'Pcs',
        description: `${i.itemName} - Qty: ${i.qty}`,
      })),
    };
    navigate('/inventory/gate-pass/outward', { state: { prefill } });
  };

  // ── Frontend-only delete ───────────────────────────────────────────────
  const handleDeleteChallan = async (id: string) => {

    const respons = await deleteData(`api/v1/challans/${id}`)
    if (respons.success === true) {
      setChallans((prev) => prev.filter((c) => c.id !== id));
      toast.success('Challan removed (frontend only)');
      setDeleteConfirmId(null);
    }

  };

  useEffect(() => {
  let mounted = true;
  const loadData = async () => {
    if (mounted) setLoadingChallans(true);
    try {
      const tasks = await Promise.allSettled([
        isBackendAvailable()
          ? salesService.listChallans({
              page: 1,
              limit: 200,
              warehouseId,
            })
          : Promise.resolve(null),
        filterItems({}),
      ]);
      if (!mounted) return;

      const challansResult = tasks[0];
      if (challansResult.status === 'fulfilled' && challansResult.value) {
        const mapped: MockChallanDetail[] = challansResult.value.items.map((row) => ({
          id: row.id,
          billNo: row.invoiceNo,
          date: row.date,
          partyName: row.partyName || '—',
          warehouseName: row.warehouseName || '—',
          itemCount: row.itemCount || 0,
          grandTotal: row.grandTotal || 0,
          status: (row.status as MockChallanDetail['status']) || 'SAVED',
          challanStatus: (row.status as MockChallanDetail['challanStatus']) || 'DISPATCHED',
          vehicleNo: row.vehicleNo || '',
          driverName: row.driverName || '',
          lrNo: row.lrNo || '',
          billingAddress: row.billingAddress || '',
          items: (row.items as MockChallanDetail['items']) || [],
        }));
        setChallans(mapped);
      }

      // tasks[1] is now itemsResult (was tasks[2] before)
      const itemsResult = tasks[1];
      if (itemsResult.status === 'fulfilled') {
        setItemLookup((itemsResult.value.data ?? []).map((row: ItemResponse) => {
          const item = mapApiToItem(row);
          return { id: item.id, name: item.name, code: item.code, unit: item.unitName || 'Pcs', saleRate: item.saleRate };
        }));
      }
    } finally {
      if (mounted) setLoadingChallans(false);
    }
  };
  void loadData();
  return () => { mounted = false; };
}, [warehouseId]);

  // useEffect(() => {
  //   const state = location.state as { fromInvoice?: FromInvoiceState } | null;
  //   if (!state?.fromInvoice) return;
  //   const inv = state.fromInvoice;
  //   setMode('new');
  //   setOrderMode('order');
  //   setFromInvoiceBadge(inv.invoiceNumber);
  //   setCustomerQuery(inv.customerName);
  //   setSelectedCustomer({ id: inv.customerId, name: inv.customerName, address: '' });
  //   setItems(inv.items.map((i) => ({
  //     ...emptyLineItem(),
  //     itemId: i.itemId ?? '',
  //     itemCode: i.itemCode ?? '',
  //     itemName: i.itemName,
  //     hsnCode: i.hsnCode ?? '',
  //     qty: i.qty > 0 ? i.qty : 1,
  //     unit: i.unit,
  //     unitId: i.unitId ?? '',
  //     rate: i.rate,
  //     taxRate: i.taxRate ?? 0,
  //   cgst: i.cgst ?? 0,
  //   sgst: i.sgst ?? 0,
  //   igst: i.igst ?? 0,
  //   taxableAmount: i.taxableAmount ?? (i.qty * i.rate),
  //   })));
  //   navigate(location.pathname, { replace: true, state: null });
  // }, [location, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  const state = location.state as { fromInvoice?: FromInvoiceState } | null;
  if (!state?.fromInvoice) return;
  const inv = state.fromInvoice;

  setMode('new');
  setOrderMode('manual'); // ← change 'order' to 'manual' — 'order' mode shows "no pending orders" which hides items
  setFromInvoiceBadge(inv.invoiceNumber);
  setCustomerQuery(inv.customerName);
  setSelectedCustomer({ id: inv.customerId, name: inv.customerName, address: '' });
  setItems(inv.items.map((i) => ({
    ...emptyLineItem(),
    itemId: i.itemId ?? '',
    itemCode: i.itemCode ?? '',
    itemName: i.itemName,
    hsnCode: i.hsnCode ?? '',
    qty: i.qty > 0 ? i.qty : 1,
    unit: i.unit,
    unitId: i.unitId ?? '',
    rate: i.rate,
    taxRate: i.taxRate ?? 0,
    cgst: i.cgst ?? 0,
    sgst: i.sgst ?? 0,
    igst: i.igst ?? 0,
    taxableAmount: i.taxableAmount ?? (i.qty * i.rate),
  })));

  // Clear state AFTER a tick so items are set first
  setTimeout(() => {
    navigate(location.pathname, { replace: true, state: null });
  }, 100);
}, [location.state]); // ← only depend on location.STATE not entire location object

  const pendingOrders: Array<{ id: string; orderNo: string; date: string; items: InvoiceLineItem[] }> = [];
  const selectedOrder  = pendingOrders.find((o) => o.id === selectedOrderId);

  const resolveItemIdentity = useCallback((row: InvoiceLineItem): InvoiceLineItem => {
    if (row.itemId) return row;
    const qName = row.itemName.trim().toLowerCase();
    const qCode = row.itemCode.trim().toLowerCase();
    const found = itemLookup.find((item) => {
      const byName = qName && item.name.trim().toLowerCase() === qName;
      const byCode = qCode && item.code.trim().toLowerCase() === qCode;
      return byName || byCode;
    });
    if (!found) return row;
    return { ...row, itemId: found.id, itemCode: row.itemCode || found.code, itemName: row.itemName || found.name, unit: row.unit || found.unit, rate: row.rate || found.saleRate };
  }, [itemLookup]);

  const loadChallanDetail = useCallback(async (challanId: string): Promise<MockChallanDetail | null> => {
    try {
      const detail = await salesService.getChallan(challanId);
      return {
        id: detail.id, billNo: detail.invoiceNo, date: detail.date,
        partyName: detail.partyName || '—', warehouseName: detail.warehouseName || '—',
        itemCount: detail.itemCount || 0, grandTotal: detail.grandTotal || 0,
        status: (detail.status as MockChallanDetail['status']) || 'SAVED',
        challanStatus: (detail.status as MockChallanDetail['challanStatus']) || 'DISPATCHED',
        vehicleNo: detail.vehicleNo || '', driverName: detail.driverName || '',
        lrNo: detail.lrNo || '', billingAddress: detail.billingAddress || '',
        items: ((detail.items as unknown as Array<{
  id: string; itemName: string; qty: number; unit: string;
  rate?: number; amount?: number; hsnCode?: string;
  taxRate?: number; cgst?: number; sgst?: number; igst?: number; taxableAmount?: number;
}>) ?? []).map((item, idx) => ({
  id: item.id || `dci-${idx}`,
  itemName: item.itemName,
  qty: Number(item.qty || 0),
  unit: item.unit || 'Pcs',
  rate: item.rate,
  amount: item.amount,
  hsnCode: item.hsnCode,
  taxRate: item.taxRate,
  cgst: item.cgst,
  sgst: item.sgst,
  igst: item.igst,
  taxableAmount: item.taxableAmount,
})),
      };
    } catch { toast.error('Failed to load challan details'); return null; }
  }, [toast]);

  const handleFetchOrderItems = () => {
    if (!selectedOrder) { toast.error('Select an order first'); return; }
    setItems(selectedOrder.items.map((i) => ({ ...i, id: crypto.randomUUID() })));
    toast.success(`Fetched ${selectedOrder.items.length} items from ${selectedOrder.orderNo}`);
  };

  const handleSave = useCallback(async (andNew = false) => {
    if (!selectedCustomer) { toast.error('Select a customer'); return; }
    if (!warehouseId) { toast.error('Select a warehouse'); return; }
    if (!selectedCustomer.id) { toast.error('Customer selection is invalid. Please re-select.'); return; }
    const validItems = items.filter((i) => i.itemName && i.qty > 0);
    if (!validItems.length) { toast.error('Add at least one item'); return; }
    const normalizedItems = validItems.map(resolveItemIdentity);
    const unresolved = normalizedItems.filter((i) => !i.itemId);
    if (unresolved.length) { toast.error(`Select valid item from dropdown for: ${unresolved[0].itemName}`); return; }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const selectedWarehouseName = '—';
    let newChallan: MockChallanDetail = {
      id: `dc-new-${Date.now()}`,
      billNo: challanNo || 'Auto Generated',
      date,
      partyName: selectedCustomer.name,
      warehouseName: selectedWarehouseName,
      itemCount: normalizedItems.length,
      grandTotal: Number(normalizedItems.reduce((sum, item) => sum + (item.qty * item.rate), 0).toFixed(2)),
      status: 'SAVED',
      challanStatus: 'DISPATCHED',
      vehicleNo, driverName, lrNo,
      billingAddress: selectedCustomer.address,
        items: normalizedItems.map((i, idx) => ({
          id: `dci-new-${idx}`,
          itemId: i.itemId,
          itemCode: i.itemCode,
          itemName: i.itemName,
          hsnCode: i.hsnCode,
          qty: i.qty,
          unit: i.unit,
          unitId: i.unitId,
          rate: i.rate,
          amount: i.qty * i.rate,
          taxRate: i.taxRate,
  cgst: i.cgst,
  sgst: i.sgst,
  igst: i.igst,
  taxableAmount: i.taxableAmount,
        })),
    };

    if (isBackendAvailable()) {
      try {
        const created = await salesService.createChallan({
          customerId: selectedCustomer.id,
          warehouseId,
          date,
          vehicleNo,
          driverName,
          lrNo,
          items: normalizedItems.map((i) => ({
            itemId: i.itemId,
            qty: Number(i.qty || 0),
            unit: i.unit || 'Pcs',
            rate: Number(i.rate || 0),

            taxRate: Number(i.taxRate || 0),
            taxableAmount: Number(i.taxableAmount || i.qty * i.rate),

            cgst: Number(i.cgst || 0),
            sgst: Number(i.sgst || 0),
            igst: Number(i.igst || 0),
          })),
        });
        newChallan = {
          ...newChallan,
          id: created.id,
          billNo: created.invoiceNo,
          date: created.date,
          partyName: created.partyName || newChallan.partyName,
          warehouseName: created.warehouseName || newChallan.warehouseName,
          itemCount: created.itemCount || newChallan.itemCount,
          grandTotal: created.grandTotal || newChallan.grandTotal,
          status: (created.status as MockChallanDetail['status']) || newChallan.status,
          challanStatus: (created.status as MockChallanDetail['challanStatus']) || newChallan.challanStatus,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save challan';
        toast.error(message);
        setSaving(false);
        return;
      }
    }

    setChallans((prev) => [newChallan, ...prev]);
    setSaving(false);
    toast.success(`Challan ${newChallan.billNo} saved!`);
    if (andNew) {
      setItems([emptyLineItem()]); setSelectedCustomer(null); setCustomerQuery('');
      setVehicleNo(''); setDriverName(''); setLrNo(''); setSelectedOrderId('');
      void fetchNextChallanNo();
    } else {
      setMode('list');
    }
  }, [selectedCustomer, warehouseId, items, challanNo, date, vehicleNo, driverName, lrNo, toast, resolveItemIdentity, fetchNextChallanNo]);

  useShortcuts('challan-new', {
    F8: () => handleSave(true),
    F9: () => handleSave(false),
    F10: () => setPrintOpen(true),
    Escape: () => setMode('list'),
  });

  const buildPrintData = () => ({
    challanNo: challanNo || 'Auto Generated',
    date,
    customerName: selectedCustomer?.name ?? '—',
    billingAddress: selectedCustomer?.address ?? '',
    vehicleNo, driverName, lrNo,
    items: items.filter((i) => i.itemName).map((i, idx) => ({ sr: idx + 1, name: i.itemName, qty: i.qty, unit: i.unit })),
  });

  const fl = 'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]';
  const lb = 'block text-xs font-semibold text-slate-500 mb-1';

  // ─── NEW CHALLAN VIEW ─────────────────────────────────────────────────────
  if (mode === 'new') return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 pb-16 bg-[#f8fafc]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-[#1e293b]">New Delivery Challan</h1>
                {fromInvoiceBadge && (
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    <i className="ri-file-list-3-line" />
                    Pre-filled from Invoice: {fromInvoiceBadge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {loadingChallanNo
                  ? 'Fetching challan number...'
                  : challanNo
                    ? `${challanNo} — No stock movement on save`
                    : 'Challan No. will be auto-generated on save'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 cursor-pointer whitespace-nowrap">
                <i className="ri-save-line text-xs" /> Save &amp; New <kbd className="text-[10px] bg-[#e2e8f0] px-1 rounded ml-0.5">F8</kbd>
              </button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap">
                {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-3-line" /> Save <kbd className="text-[10px] bg-white/20 px-1 rounded ml-0.5">F9</kbd></>}
              </button>
            </div>
          </div>

          {/* Order mode toggle */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-6">
              {(['manual', 'order'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="orderMode" value={m} checked={orderMode === m}
                    onChange={() => { setOrderMode(m); setSelectedOrderId(''); setItems([emptyLineItem()]); }}
                    className="w-4 h-4 text-[#4f46e5] border-slate-300 focus:ring-[#4f46e5] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[#1e293b]">
                    {m === 'manual' ? 'Without Order' : 'Against Sales Order'}
                  </span>
                  {m === 'order' && <span className="text-xs text-[#94a3b8]">(fetch items from order)</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Challan details */}
          <div ref={headerRef} className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Challan Details</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className={lb}>Customer <span className="text-red-500">*</span></label>
                <CustomerSearch
                  value={customerQuery}
                  onChange={setCustomerQuery}
                  onSelect={(c) => { setSelectedCustomer(c); setCustomerQuery(c.name); setSelectedOrderId(''); }}
                />
              </div>
              <div>
                <label className={lb}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fl} />
              </div>
              <div>
                <label className={lb}>
                  Challan No
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(auto generated)</span>
                </label>
                <div className="relative">
                  <input
                    readOnly value={challanNo} placeholder="Auto Generated"
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg text-slate-400 cursor-not-allowed italic placeholder:not-italic placeholder:text-slate-400"
                  />
                  {loadingChallanNo && (
                    <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  )}
                </div>
              </div>
              <div>
                <label className={lb}>Vehicle No</label>
                <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className={fl} placeholder="MH-12-AB-1234" />
              </div>
              <div>
                <label className={lb}>Driver Name</label>
                <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className={fl} placeholder="Driver name" />
              </div>
              <div>
                <label className={lb}>LR No</label>
                <input value={lrNo} onChange={(e) => setLrNo(e.target.value)} className={fl} placeholder="Lorry receipt no" />
              </div>
            </div>

            {orderMode === 'order' && selectedCustomer && (
              <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                <label className={lb}>Pending Sales Orders for {selectedCustomer.name}</label>
                {!pendingOrders.length ? (
                  <p className="text-sm text-[#94a3b8]">No pending orders for this customer</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className={`${fl} max-w-xs`}>
                      <option value="">— Select Order —</option>
                      {pendingOrders.map((o) => <option key={o.id} value={o.id}>{o.orderNo} — {o.date} ({o.items.length} items)</option>)}
                    </select>
                    <button onClick={handleFetchOrderItems} disabled={!selectedOrderId}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors">
                      <i className="ri-download-line" /> Fetch Items
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Items</h2>
              <span className="text-xs text-slate-400">No stock movement — challan is for dispatch only</span>
            </div>
            <ItemEntryTable items={items} onChange={setItems} isSameState={isSameState}  warehouseId={warehouseId} rateType="sale" />
          </div>
        </div>

        {printOpen && <PrintChallan data={buildPrintData()} onClose={() => setPrintOpen(false)} onPrint={() => printChallan(buildPrintData())} />}
        <ShortcutBar onSave={() => handleSave(false)} onSaveAndNew={() => handleSave(true)} onPrint={() => setPrintOpen(true)} onBack={() => setMode('list')} saving={saving} />
      </div>
    </AppLayout>
  );

  // ─── CHALLAN LIST ──────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Delivery Challans</h1>
            <p className="text-sm text-slate-500">{challans.length} challans</p>
          </div>

          {/* New Challan — only with create permission */}
          {canCreate && (
            <button
              onClick={() => setMode('new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> New Challan
            </button>
          )}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          {loadingChallans ? (
            <div className="flex min-h-[260px] items-center justify-center text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin text-[#4f46e5]" />
                Loading challans...
              </div>
            </div>
          ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Challan No', 'Date', 'Customer', 'Items', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {challans.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={async () => { const d = await loadChallanDetail(c.id); if (d) setDetailChallan(d); }}
                    className={`border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-[#4f46e5]">{c.billNo}</td>
                    {/* <td className="px-4 py-3 text-slate-600">{c.date}</td> */}
                    <td className="px-4 py-3 text-slate-600 ">
                      {new Date(c.date).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.partyName}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{c.itemCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[c.challanStatus] ?? STATUS_STYLES.DRAFT}`}>
                        {c.challanStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 flex-nowrap">

                        {/* View — always visible */}
                        <button
                          onClick={async () => { const d = await loadChallanDetail(c.id); if (d) setDetailChallan(d); }}
                          className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                        >
                          View
                        </button>

                        {c.challanStatus === 'DISPATCHED' && (
                          <>
                            {/* Convert to Invoice — needs SALES_INVOICE create */}
                            {canConvert && (
                              <button
                                onClick={async () => {
                                  const detail = await loadChallanDetail(c.id);
                                  if (!detail) return;
                                  if (isBackendAvailable()) {
                                    try { await salesService.convertChallanToInvoice(c.id); }
                                    catch { toast.error('Failed to convert challan'); return; }
                                  }
                                  addTabWithChallan({
                                    challanId: detail.id, challanNo: detail.billNo, customerName: detail.partyName,
                                    items: detail.items.map((i) => ({ itemName: i.itemName, qty: i.qty, unit: i.unit, rate: i.rate ?? 0 })),
                                  });
                                  setChallans((prev) => prev.map((ch) => ch.id === c.id ? { ...ch, challanStatus: 'CONVERTED' as const } : ch));
                                  navigate('/sales/invoices/new');
                                }}
                                className="text-xs px-3 py-1.5 bg-indigo-50 text-[#4f46e5] border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer whitespace-nowrap font-medium"
                              >
                                Convert to Invoice
                              </button>
                            )}

                            {/* Generate Gate Pass — needs GATE_PASS_OUTWARD create */}
                            {hasPermission(MODULES.GATE_PASS_OUTWARD, 'create') && (
                              <button
                                onClick={() => handleGenerateOutwardGPFromChallan(c)}
                                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-file-shield-2-line" />Generate GP
                              </button>
                            )}
                          </>
                        )}

                        {/* Edit — only with update permission */}
                        {canUpdate && (
                          <button
                            onClick={() => toast.error('Edit challan API coming soon')}
                            title="Edit challan"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                        )}

                        {/* Delete — only with delete permission */}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmId(c.id)}
                            title="Delete challan"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
                {!challans.length && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No challans yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {detailChallan && (
        <ChallanDetailModal
          challan={detailChallan}
          onClose={() => setDetailChallan(null)}
          onConverted={(challanId) => setChallans((prev) => prev.map((ch) => ch.id === challanId ? { ...ch, challanStatus: 'CONVERTED' as const } : ch))}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete Challan?"
        message="Remove this challan from the list? (Frontend only — API coming soon)"
        variant="danger"
        confirmLabel="Yes, Delete"
        onConfirm={() => deleteConfirmId && handleDeleteChallan(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </AppLayout>
  );
}