import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import POPrintModal from '@/pages/manifacturing/orders/components/POPrintModal';
import { toInputDate } from '@/utils/format';
import {
  getItemsWithVariantsForBOM,
  type BOMDropdownGroup,
  type BOMDropdownVariant,
} from '@/api/item.api';
import bomAPI, { type BOM } from '@/api/bom.api';
import { getRoutingsForDropdown, type RoutingDropdownItem } from '@/api/routing.api';
import { getAllWarehouses, type WarehouseResponse } from '@/api/warehouse.api';
import { getAllShifts, type ShiftResponse } from '@/api/shift.api';
import { searchSalesInvoices, type SalesInvoiceOption } from '@/api/Salesinvoice.api';
import {
  createProductionOrder,
  updateProductionOrder,
  getProductionOrderById,
  updateProductionOrderStatus,
  getMaterialReservations,
  reserveMaterial,
  releaseMaterial,
  reserveAllMaterials,
  type ProductionOrderPayload,
  type ProductionOrderResponse,
  type MaterialReservation,
  mapApiToProductionOrder,
} from '@/api/productionOrder.api';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type POType = 'MTO' | 'MTS';
type POStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type MTSReason = 'Stock Replenishment' | 'Forecast' | 'Safety Stock';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const statusConfig: Record<
  POStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: 'ri-draft-line',
  },
  PLANNED: {
    label: 'Planned',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'ri-calendar-line',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'ri-loader-4-line',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'ri-check-line',
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'ri-pause-circle-line',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'ri-close-circle-line',
  },
};

const priorityConfig: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
  NORMAL: {
    label: 'Normal',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    border: 'border-sky-200',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function addWorkingDays(start: string, days: number): string {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString().split('T')[0];
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function generatePONumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-5); // last 5 digits of timestamp
  return `PRD-${year}-${seq}`;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function ProductionOrderForm() {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isEditing = !!editId;

  const navType = (location.state as { type?: POType } | null)?.type;

  // ── Existing PO (edit mode) ──
  const [existingPO, setExistingPO] = useState<ReturnType<typeof mapApiToProductionOrder> | null>(null);
  const [loadingPO, setLoadingPO] = useState(isEditing);

  // ── Remote data ──
  const [itemsList, setItemsList] = useState<BOMDropdownGroup[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [bomsList, setBomsList] = useState<BOM[]>([]);
  const [routingsList, setRoutingsList] = useState<RoutingDropdownItem[]>([]);
  const [loadingRoutings, setLoadingRoutings] = useState(false);
  const [warehousesList, setWarehousesList] = useState<WarehouseResponse[]>([]);
  const [shiftsList, setShiftsList] = useState<ShiftResponse[]>([]);
  const [reservations, setReservations] = useState<MaterialReservation[]>([]);

  // ── Form state ──
  const [poType, setPoType] = useState<POType>(navType || 'MTO');
  const [salesInvoiceId, setSalesInvoiceId] = useState('');
  const [salesInvoiceDisplay, setSalesInvoiceDisplay] = useState(''); // human-readable: invoice_number - customer
  const [customerName, setCustomerName] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceOptions, setInvoiceOptions] = useState<SalesInvoiceOption[]>([]);
  const [showInvoiceSearch, setShowInvoiceSearch] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [mtsReason, setMtsReason] = useState<MTSReason>('Stock Replenishment');
  const [targetStockLevel, setTargetStockLevel] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [selectedRoutingId, setSelectedRoutingId] = useState('');
  const [plannedQty, setPlannedQty] = useState('');
  const [unit, setUnit] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [plannedStart, setPlannedStart] = useState(toInputDate());
  const [plannedEnd, setPlannedEnd] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [statusOverride, setStatusOverride] = useState<POStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'materials'>('details');
  const [showPrint, setShowPrint] = useState(false);
  const [showMRPBanner, setShowMRPBanner] = useState(false);

  // ─────────────────────────────────────────────
  // FETCH: Existing PO in edit mode
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!isEditing || !editId) return;
    const fetchPO = async () => {
      try {
        setLoadingPO(true);
        const res = await getProductionOrderById(editId);
        if (res.data) {
          const po = mapApiToProductionOrder(res.data);
          setExistingPO(po);
          // Populate form from fetched PO
          setPoType(po.type as POType);
          setSalesInvoiceId(po.salesInvoiceId || '');
          // salesInvoiceDisplay will be fetched if needed; for now show the id
          setSelectedProductId(po.itemId);
          setSelectedProduct({ id: po.itemId, name: po.itemName, code: po.itemCode, unitName: '' });
          setSelectedBOMId(po.bomId);
          setSelectedRoutingId(po.routingId || '');
          setPlannedQty(po.plannedQty.toString());
          setWarehouseId(po.warehouseId);
          setPriority(po.priority as Priority);
          setPlannedStart(po.plannedStartDate?.split('T')[0] || toInputDate());
          setPlannedEnd(po.plannedEndDate?.split('T')[0] || '');
          setNotes(po.notes || '');
        }
      } catch (err) {
        toast.error('Failed to load production order');
      } finally {
        setLoadingPO(false);
      }
    };
    fetchPO();
  }, [editId, isEditing]);

  // ─────────────────────────────────────────────
  // FETCH: Items, BOMs, Routings, Warehouses, Shifts
  // ─────────────────────────────────────────────

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const data = await getItemsWithVariantsForBOM();
        if (data) setItemsList(data);
      } catch {
        toast.error('Failed to load items');
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchBOMs = async () => {
      try {
        const res = await bomAPI.getAll({ status: 'ALL', limit: 1000 });
        console.log('BOM API Response:', res);
        console.log('BOM API Response Data:', res.data);
        if (res.data) setBomsList(res.data);
      } catch {
        console.error('Failed to fetch BOMs');
      }
    };
    fetchBOMs();
  }, []);

  useEffect(() => {
    const fetchRoutings = async () => {
      try {
        setLoadingRoutings(true);
        const data = await getRoutingsForDropdown();
        if (data) setRoutingsList(data);
      } catch {
        console.error('Failed to fetch routings');
      } finally {
        setLoadingRoutings(false);
      }
    };
    fetchRoutings();
  }, []);


  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getAllWarehouses();
        if (res.data) {
          setWarehousesList(res.data);
          if (!warehouseId && res.data.length > 0) setWarehouseId(res.data[0].id);
        }
      } catch {
        console.error('Failed to fetch warehouses');
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await getAllShifts();
        if (res.data) setShiftsList(res.data);
      } catch {
        console.error('Failed to fetch shifts');
      }
    };
    fetchShifts();
  }, []);

  // ─────────────────────────────────────────────
  // FETCH: Material Reservations (edit mode)
  // ─────────────────────────────────────────────

  const fetchReservations = useCallback(async () => {
    if (!isEditing || !editId) return;
    try {
      const res = await getMaterialReservations(editId);
      if (res.data) setReservations(res.data);
    } catch {
      console.error('Failed to fetch reservations');
    }
  }, [editId, isEditing]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // ─────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────

  const availableBOMs = useMemo(() => {
    if (!selectedProductId) return [];
    return bomsList.filter(
      (b) => b.product_id === selectedProductId && b.status !== 'OBSOLETE',
    );
  }, [selectedProductId, bomsList]);

  const availableRoutings = useMemo(
    () => routingsList.filter((r) => r.status === 'ACTIVE'),
    [routingsList],
  );

  const selectedRouting = useMemo(
    () => routingsList.find((r) => r.id === selectedRoutingId) || null,
    [selectedRoutingId, routingsList],
  );

  const selectedBOM = useMemo(
    () => bomsList.find((b) => b.id === selectedBOMId) || null,
    [selectedBOMId, bomsList],
  );

  const selectedWarehouse = useMemo(
    () => warehousesList.find((w) => w.id === warehouseId) || null,
    [warehouseId, warehousesList],
  );

  const productDropdownData = useMemo(() => {
    const q = productSearchQuery.toLowerCase();
    let filtered = itemsList;
    if (q) {
      filtered = filtered.filter((group) => {
        const matchesItem =
          group.name.toLowerCase().includes(q) ||
          (group.code && group.code.toLowerCase().includes(q));
        const matchesVariant = group.variants.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.code && v.code.toLowerCase().includes(q)),
        );
        return matchesItem || matchesVariant;
      });
    }
    const parents: BOMDropdownGroup[] = [];
    const variants: BOMDropdownVariant[] = [];
    const regulars: BOMDropdownGroup[] = [];
    filtered.forEach((group) => {
      if (group.variants.length > 0) {
        parents.push(group);
        variants.push(...group.variants);
      } else {
        regulars.push(group);
      }
    });
    return { parents, variants, regulars };
  }, [itemsList, productSearchQuery]);

  // ─────────────────────────────────────────────
  // SIDE EFFECTS
  // ─────────────────────────────────────────────

  // Auto-calc end date from routing
  useEffect(() => {
    if (!plannedStart || !selectedRouting) return;
    const totalMinutes = selectedRouting.total_time_minutes || 0;
    const days = Math.ceil(totalMinutes / 60 / 8);
    const calcEnd = addWorkingDays(plannedStart, Math.max(days, 1));
    if (!isEditing || !plannedEnd) setPlannedEnd(calcEnd);
  }, [plannedStart, selectedRouting]);

  // Sync unit from selected product
  useEffect(() => {
    if (selectedProduct?.unitName) setUnit(selectedProduct.unitName);
  }, [selectedProduct]);

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  const handleSelectProduct = useCallback(
    (productId: string, selectedItem?: BOMDropdownGroup | BOMDropdownVariant) => {
      let product: any = selectedItem || itemsList.find((m) => m.id === productId);
      if (!product) return;

      let productName = product.name;
      let productCode = product.code;
      let productUnitName = product.unit_name || 'Pcs';

      if ('variant_name' in product && product.variant_name) {
        productName = `${product.parent_item_name} - ${product.variant_name}`;
        productCode = product.code;
        productUnitName = product.unit_name || 'Pcs';
      }

      setSelectedProductId(productId);
      setSelectedProduct({
        id: product.id,
        name: productName,
        code: productCode,
        unitName: productUnitName,
        isVariant: 'variant_name' in product,
        parentItemId: 'parent_item_id' in product ? product.parent_item_id : null,
        variantName: 'variant_name' in product ? product.variant_name : null,
      });

      setShowProductSearch(false);
      setProductSearchQuery('');
      setSelectedBOMId('');
      setSelectedRoutingId('');
      setUnit(productUnitName);

      // Auto-select BOM
      const boms = bomsList.filter(
        (b) => b.product_id === productId && b.status !== 'OBSOLETE',
      );
      if (boms.length === 1) setSelectedBOMId(boms[0].id);
      else if (boms.length > 1) {
        const active = boms.find((b) => b.status === 'ACTIVE');
        setSelectedBOMId(active ? active.id : boms[0].id);
      }
    },
    [itemsList, bomsList],
  );

  const handleInvoiceSearch = useCallback(async (query: string) => {
    setInvoiceSearch(query);
    if (!query || query.length < 2) {
      setInvoiceOptions([]);
      return;
    }
    try {
      setLoadingInvoices(true);
      const res = await searchSalesInvoices(query);
      if (res.data) setInvoiceOptions(res.data);
    } catch {
      console.error('Failed to search invoices');
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const handleSelectInvoice = useCallback((invoice: SalesInvoiceOption) => {
    setSalesInvoiceId(invoice.id);
    setSalesInvoiceDisplay(`${invoice.invoice_number} — ${invoice.customer_name}`);
    setCustomerName(invoice.customer_name);
    setInvoiceSearch('');
    setInvoiceOptions([]);
    setShowInvoiceSearch(false);
  }, []);

  const handleClearInvoice = useCallback(() => {
    setSalesInvoiceId('');
    setSalesInvoiceDisplay('');
    setCustomerName('');
    setInvoiceSearch('');
    setInvoiceOptions([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedProductId) return toast.error('Please select a product');
    if (!plannedQty || parseFloat(plannedQty) <= 0) return toast.error('Please enter planned quantity');
    if (!warehouseId) return toast.error('Please select a warehouse');
    if (!plannedStart) return toast.error('Please select planned start date');
    if (!plannedEnd) return toast.error('Please select planned end date');

    setSaving(true);
    try {
      const payload: ProductionOrderPayload = {
        poNumber: isEditing ? existingPO!.poNumber : generatePONumber(),
        type: poType,
        priority,
        itemId: selectedProductId,
        bomId: selectedBOMId || undefined,
        plannedQty: parseFloat(plannedQty),
        plannedStartDate: plannedStart,
        plannedEndDate: plannedEnd,
        warehouseId,
        routingId: selectedRoutingId || undefined,
        salesInvoiceId: poType === 'MTO' ? salesInvoiceId || undefined : undefined,
        notes: notes || undefined,
      };

      if (isEditing && editId) {
        await updateProductionOrder(editId, payload);

        // Apply status override if set
        if (statusOverride) {
          await updateProductionOrderStatus(editId, statusOverride);
        }

        toast.success(`Production Order ${existingPO?.poNumber} updated`);
        navigate('/manufacturing/production-orders');
      } else {
        const res = await createProductionOrder(payload);
        const poNumber = res.data?.po_number || '';
        toast.success(`Production Order ${poNumber} created`);
        navigate('/manufacturing/production-orders');
      }

      setShowMRPBanner(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save production order');
    } finally {
      setSaving(false);
    }
  }, [
    selectedProductId,
    selectedBOMId,
    plannedQty,
    warehouseId,
    plannedStart,
    plannedEnd,
    poType,
    priority,
    salesInvoiceId,
    selectedRoutingId,
    notes,
    isEditing,
    existingPO,
    editId,
    statusOverride,
    toast,
    navigate,
  ]);

  const handleStatusAction = useCallback(
    (nextStatus: POStatus) => {
      setStatusOverride(nextStatus);
      toast.info(`Status will change to ${statusConfig[nextStatus].label} on save`);
    },
    [toast],
  );

  const handleReserveOne = useCallback(
    async (mr: MaterialReservation) => {
      if (!editId) return;
      try {
        await reserveMaterial(editId, mr.id);
        toast.success(`Reserved ${mr.itemName}`);
        fetchReservations();
      } catch (err: any) {
        toast.error(err?.message || `Failed to reserve ${mr.itemName}`);
      }
    },
    [editId, fetchReservations, toast],
  );

  const handleReleaseOne = useCallback(
    async (mr: MaterialReservation) => {
      if (!editId) return;
      try {
        await releaseMaterial(editId, mr.id);
        toast.success(`Released ${mr.itemName}`);
        fetchReservations();
      } catch (err: any) {
        toast.error(err?.message || `Failed to release ${mr.itemName}`);
      }
    },
    [editId, fetchReservations, toast],
  );

  const handleReserveAll = useCallback(async () => {
    if (!editId) return;
    try {
      await reserveAllMaterials(editId);
      toast.success('Reserved all available materials');
      fetchReservations();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reserve materials');
    }
  }, [editId, fetchReservations, toast]);

  // ─────────────────────────────────────────────
  // DERIVED UI STATE
  // ─────────────────────────────────────────────

  const currentStatus: POStatus =
    statusOverride || (isEditing && existingPO ? (existingPO.status as POStatus) : 'DRAFT');

  const statusActions = useMemo(() => {
    const actions: Array<{
      label: string;
      icon: string;
      next: POStatus;
      variant: string;
    }> = [];
    if (currentStatus === 'DRAFT')
      actions.push({
        label: 'Submit for Planning',
        icon: 'ri-send-plane-line',
        next: 'PLANNED',
        variant: 'bg-sky-600 hover:bg-sky-700 text-white',
      });
    if (currentStatus === 'PLANNED')
      actions.push({
        label: 'Start Production',
        icon: 'ri-play-line',
        next: 'IN_PROGRESS',
        variant: 'bg-amber-600 hover:bg-amber-700 text-white',
      });
    if (currentStatus === 'IN_PROGRESS') {
      actions.push({
        label: 'Complete',
        icon: 'ri-check-line',
        next: 'COMPLETED',
        variant: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      });
      actions.push({
        label: 'Put on Hold',
        icon: 'ri-pause-line',
        next: 'ON_HOLD',
        variant: 'bg-rose-600 hover:bg-rose-700 text-white',
      });
    }
    if (currentStatus === 'ON_HOLD') {
      actions.push({
        label: 'Resume',
        icon: 'ri-play-line',
        next: 'IN_PROGRESS',
        variant: 'bg-amber-600 hover:bg-amber-700 text-white',
      });
      actions.push({
        label: 'Cancel',
        icon: 'ri-close-line',
        next: 'CANCELLED',
        variant: 'bg-slate-600 hover:bg-slate-700 text-white',
      });
    }
    return actions;
  }, [currentStatus]);

  const showTabs =
    isEditing &&
    existingPO &&
    (existingPO.status === 'PLANNED' || existingPO.status === 'IN_PROGRESS');

     
      console.log('selectedRoutingId:', selectedRoutingId);
console.log('selectedRouting:', selectedRouting);
  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────

  if (loadingPO) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <i className="ri-loader-4-line animate-spin text-[#4f46e5]" />
            Loading production order...
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                {isEditing
                  ? `Edit Production Order — ${existingPO?.poNumber}`
                  : 'New Production Order'}
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                {isEditing
                  ? 'Update production order details and status'
                  : 'Create a new Make-to-Order or Make-to-Stock production order'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing && existingPO && (
                <button
                  onClick={() => setShowPrint(true)}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap flex items-center gap-2"
                >
                  <i className="ri-printer-line" />
                  Print
                </button>
              )}
              <button
                onClick={() => navigate('/manufacturing/orders')}
                className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-medium text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] disabled:opacity-60 cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" /> Save Order
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          {showTabs && (
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap ${activeTab === 'details' ? 'bg-[#4f46e5] text-white' : 'text-[#64748b] hover:bg-slate-50'}`}
              >
                <i className="ri-file-list-3-line mr-1.5" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap ${activeTab === 'materials' ? 'bg-[#4f46e5] text-white' : 'text-[#64748b] hover:bg-slate-50'}`}
              >
                <i className="ri-box-3-line mr-1.5" />
                Materials
              </button>
            </div>
          )}

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <>
              {/* Type Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                  Order Type
                </label>
                <div className="flex gap-2">
                  {(['MTO', 'MTS'] as POType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPoType(t)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${poType === t ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-[#475569] border-slate-200 hover:border-slate-300'}`}
                    >
                      <i className={t === 'MTO' ? 'ri-building-line' : 'ri-box-3-line'} />
                      {t === 'MTO' ? 'Make to Order (MTO)' : 'Make to Stock (MTS)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* MTO Fields */}
              {poType === 'MTO' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-file-list-3-line text-[#4f46e5]" />
                    Sales Invoice Link
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice search */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Sales Invoice
                      </label>
                      {salesInvoiceId ? (
                        <div className="flex items-center gap-2 h-10 px-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <i className="ri-file-text-line text-indigo-500 shrink-0" />
                          <span className="text-sm text-[#1e293b] flex-1 truncate">{salesInvoiceDisplay}</span>
                          <button
                            type="button"
                            onClick={handleClearInvoice}
                            className="text-slate-400 hover:text-slate-600 shrink-0"
                          >
                            <i className="ri-close-line" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={invoiceSearch}
                            onChange={(e) => {
                              handleInvoiceSearch(e.target.value);
                              setShowInvoiceSearch(true);
                            }}
                            onFocus={() => setShowInvoiceSearch(true)}
                            placeholder="Search invoice number or customer..."
                            className="w-full h-10 px-3 pr-8 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                          />
                          <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                          {showInvoiceSearch && (invoiceOptions.length > 0 || loadingInvoices) && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                              {loadingInvoices ? (
                                <div className="px-3 py-3 text-sm text-slate-400 flex items-center gap-2">
                                  <i className="ri-loader-4-line animate-spin" /> Searching...
                                </div>
                              ) : (
                                invoiceOptions.map((inv) => (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    onClick={() => handleSelectInvoice(inv)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-indigo-50 flex items-center justify-between gap-3"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-[#1e293b]">{inv.invoice_number}</p>
                                      <p className="text-xs text-slate-500">{inv.customer_name}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 shrink-0">{inv.date}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        Link this production to a sales invoice
                      </p>
                    </div>
                    {/* Customer (auto-filled) */}
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        readOnly={!!salesInvoiceId}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Auto-filled from invoice"
                        className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 ${salesInvoiceId ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MTS Fields */}
              {poType === 'MTS' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-box-3-line text-[#059669]" />
                    Stock Trigger
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Reason
                      </label>
                      <select
                        value={mtsReason}
                        onChange={(e) => setMtsReason(e.target.value as MTSReason)}
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        <option>Stock Replenishment</option>
                        <option>Forecast</option>
                        <option>Safety Stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Target Stock Level
                      </label>
                      <input
                        type="number"
                        value={targetStockLevel}
                        onChange={(e) => setTargetStockLevel(e.target.value)}
                        placeholder="Produce until stock reaches this level"
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                  <i className="ri-archive-line text-[#4f46e5]" />
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Selector */}
                  <div className="md:col-span-2 relative">
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`w-full min-h-[40px] px-3 py-2 text-sm border rounded-lg cursor-pointer flex items-center justify-between ${selectedProduct ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      onClick={() => { if (!isEditing) setShowProductSearch(true); }}
                    >
                      <span className={selectedProduct ? 'text-[#1e293b]' : ''}>
                        {selectedProduct ? selectedProduct.name : 'Search and select a product...'}
                      </span>
                      {!isEditing && <i className="ri-search-line text-slate-400" />}
                    </div>
                    {showProductSearch && !isEditing && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                        <div className="p-2 border-b border-slate-200">
                          <input
                            autoFocus
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5]"
                          />
                        </div>
                        <div className="py-1">
                          {productDropdownData.parents.map((group) => (
                            <div key={group.id}>
                              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 uppercase tracking-wide">
                                {group.name}
                              </div>
                              {productDropdownData.variants
                                .filter((v) => v.parent_item_id === group.id)
                                .map((variant) => (
                                  <button
                                    key={variant.id}
                                    onClick={() => handleSelectProduct(variant.id, variant)}
                                    className="w-full px-6 py-2 text-left text-sm text-[#1e293b] hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
                                  >
                                    <span className="text-slate-400">└</span>
                                    <span>{variant.name}</span>
                                    <span className="text-xs text-slate-400 ml-auto">{variant.code}</span>
                                  </button>
                                ))}
                            </div>
                          ))}
                          {productDropdownData.regulars.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSelectProduct(item.id, item)}
                              className="w-full px-3 py-2 text-left text-sm text-[#1e293b] hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
                            >
                              <span>{item.name}</span>
                              <span className="text-xs text-slate-400 ml-auto">{item.code}</span>
                            </button>
                          ))}
                          {productDropdownData.parents.length === 0 &&
                            productDropdownData.regulars.length === 0 && (
                              <div className="px-3 py-4 text-center text-sm text-slate-400">
                                {loadingItems ? 'Loading products...' : 'No products found'}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOM Version */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      BOM Version <span className="text-red-500">*</span>
                    </label>
                    <p>BOM Count: {availableBOMs.length}</p>
                    <select
                      value={selectedBOMId}
                      onChange={(e) => setSelectedBOMId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">Select BOM...</option>
                      {availableBOMs.map((bom) => (
                        <option key={bom.id} value={bom.id}>
                          v{bom.version} ({bom.status}) — {bom.code}
                        </option>
                      ))}
                    </select>
                    {availableBOMs.length === 0 && selectedProduct && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active BOMs found for this product
                      </p>
                    )}
                  </div>

                  {/* Routing */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Routing{' '}
                      <span className="text-[#94a3b8] font-normal">(Optional)</span>
                    </label>
                    <select
                      value={selectedRoutingId}
                      onChange={(e) => setSelectedRoutingId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">No routing</option>
                      {availableRoutings.map((routing) => (
                        <option key={routing.id} value={routing.id}>
                          {routing.name} ({routing.code})
                        </option>
                      ))}
                    </select>
                    {availableRoutings.length === 0 && !loadingRoutings && (
                      <p className="text-[11px] text-amber-600 mt-1">No active routings found</p>
                    )}
                    {selectedRouting && (
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {(() => {
                          let stageCount = 0;
                          if (selectedRouting.stages) {
                            if (Array.isArray(selectedRouting.stages)) {
                              stageCount = selectedRouting.stages.length;
                            } else if (typeof selectedRouting.stages === 'string') {
                              try {
                                stageCount = JSON.parse(selectedRouting.stages).length;
                              } catch (e) {
                                stageCount = 0;
                              }
                            }
                          }
                          return stageCount;
                        })()} stages, total {selectedRouting.total_time_minutes || 0} min
                      </p>
                    )}
                  </div>

                  {/* Qty */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Qty to Produce <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={plannedQty}
                        onChange={(e) => setPlannedQty(e.target.value)}
                        className="flex-1 h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5]"
                      />
                      <div className="h-10 px-3 flex items-center text-sm text-[#64748b] bg-slate-50 border border-slate-200 rounded-lg min-w-[80px] justify-center">
                        {unit || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Warehouse */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">Select warehouse...</option>
                      {warehousesList.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                  <i className="ri-calendar-schedule-line text-[#4f46e5]" />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
                        <option key={p} value={p}>{priorityConfig[p].label}</option>
                      ))}
                    </select>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${priorityConfig[priority].bg} ${priorityConfig[priority].text} ${priorityConfig[priority].border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[priority].dot}`} />
                        {priorityConfig[priority].label} Priority
                      </span>
                    </div>
                  </div>

                  {/* Shift */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Shift <span className="text-[#94a3b8] font-normal">(Optional)</span>
                    </label>
                    <select
                      value={shiftId}
                      onChange={(e) => setShiftId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">No shift assigned</option>
                      {shiftsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.start_time}–{s.end_time})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Planned Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={plannedStart}
                      onChange={(e) => setPlannedStart(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5]"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Planned End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={plannedEnd}
                        onChange={(e) => setPlannedEnd(e.target.value)}
                        className="flex-1 h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5]"
                      />
                      {selectedRouting && (
                        <span className="text-[11px] text-[#94a3b8] whitespace-nowrap">
                          Est: {formatShortDate(plannedStart)} +{' '}
                          {Math.ceil((selectedRouting.total_time_minutes || 0) / 60 / 8)} days
                        </span>
                      )}
                    </div>
                    {selectedRouting && (
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        Estimated based on routing. You can override.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                  <i className="ri-sticky-note-line text-[#4f46e5]" />
                  Notes
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes about this production order..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Status Workflow */}
              {isEditing && existingPO && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-toggle-line text-[#4f46e5]" />
                    Status Workflow
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text} ${statusConfig[currentStatus].border}`}
                    >
                      <i className={statusConfig[currentStatus].icon} />
                      {statusConfig[currentStatus].label}
                    </span>
                    {statusOverride && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Will change on save
                      </span>
                    )}
                  </div>
                  {statusActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {statusActions.map((action) => (
                        <button
                          key={action.next}
                          onClick={() => handleStatusAction(action.next)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${action.variant}`}
                        >
                          <i className={action.icon} />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Type', value: poType },
                    { label: 'Product', value: selectedProduct?.name || '—' },
                    { label: 'Quantity', value: `${plannedQty || '—'} ${unit}` },
                    { label: 'Warehouse', value: selectedWarehouse?.name || '—' },
                    { label: 'Priority', value: priorityConfig[priority].label },
                    { label: 'Start', value: plannedStart ? formatShortDate(plannedStart) : '—' },
                    { label: 'End', value: plannedEnd ? formatShortDate(plannedEnd) : '—' },
                    { label: 'BOM', value: selectedBOM ? `v${selectedBOM.version}` : '—' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-[#64748b]">{item.label}</p>
                      <p className="text-sm font-medium text-[#1e293b] mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── MATERIALS TAB ── */}
          {activeTab === 'materials' && isEditing && existingPO && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
                  <i className="ri-box-3-line text-[#4f46e5]" />
                  Material Reservations
                </h3>
                <button
                  onClick={handleReserveAll}
                  className="h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-medium hover:bg-[#4338ca] cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <i className="ri-download-line" />
                  Reserve All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">Item Name</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">Required Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">Reserved Qty</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">Unit</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">Status</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((mr) => {
                      const sc =
                        mr.status === 'RESERVED'
                          ? { label: 'Reserved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'ri-check-line' }
                          : mr.status === 'PARTIAL'
                            ? { label: 'Partial', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'ri-alert-line' }
                            : mr.status === 'PENDING'
                              ? { label: 'Pending', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'ri-close-line' }
                              : { label: 'Released', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: 'ri-history-line' };
                      return (
                        <tr key={mr.id} className="border-b border-slate-50">
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-[#1e293b]">{mr.itemName}</div>
                            <div className="text-[11px] text-[#94a3b8]">{mr.itemCode}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-[#475569]">
                            {mr.requiredQty.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-[#475569]">
                            {mr.reservedQty.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-left text-sm text-[#475569]">{mr.unit}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${sc.bg} ${sc.text} ${sc.border}`}
                            >
                              <i className={sc.icon} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1.5">
                              {(mr.status === 'PENDING' || mr.status === 'PARTIAL') && (
                                <button
                                  onClick={() => handleReserveOne(mr)}
                                  className="h-7 px-2.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                >
                                  <i className="ri-download-line" />
                                  Reserve
                                </button>
                              )}
                              {(mr.status === 'RESERVED' || mr.status === 'PARTIAL') && (
                                <button
                                  onClick={() => handleReleaseOne(mr)}
                                  className="h-7 px-2.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium hover:bg-slate-100 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                >
                                  <i className="ri-upload-line" />
                                  Release
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-[#94a3b8]">
                          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                            <i className="ri-inbox-line text-xl text-slate-300" />
                          </div>
                          No material reservations yet.
                          <br />
                          <span className="text-xs">Click Reserve All to reserve materials.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MRP Impact Banner */}
      {showMRPBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-100 shrink-0">
                <i className="ri-bar-chart-2-line text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Production Order affects material requirements
                </p>
                <p className="text-xs text-amber-600">
                  Run MRP to recalculate purchase suggestions for this order.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/manufacturing/mrp')}
                className="h-8 px-3 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 cursor-pointer whitespace-nowrap transition-colors"
              >
                Run MRP Now
              </button>
              <button
                onClick={() => {
                  setShowMRPBanner(false);
                  navigate('/manufacturing/orders');
                }}
                className="h-8 px-3 rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {(showProductSearch || showInvoiceSearch) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProductSearch(false);
            setShowInvoiceSearch(false);
          }}
        />
      )}

      {showPrint && isEditing && existingPO && (
        <POPrintModal po={existingPO} onClose={() => setShowPrint(false)} />
      )}

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel Production Order"
        message="Are you sure you want to cancel this production order? This action cannot be undone."
        variant="danger"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onConfirm={() => {
          setStatusOverride('CANCELLED');
          setShowCancelConfirm(false);
          toast.info('Status will change to Cancelled on save');
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </AppLayout>
  );
}