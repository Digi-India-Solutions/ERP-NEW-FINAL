import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import POPrintModal from '@/pages/manifacturing/orders/components/POPrintModal';
import {
  mockItems,
  mockBOMs,
  mockBOMItems,
  mockRoutings,
  mockWarehouses,
  mockShifts,
  mockProductionOrders,
  mockWorkOrders,
  mockWarehouseStock,
  mockMaterialReservations,
  type MockBOM,
  type MockRouting,
  type MockMaterialReservation,
} from '@/mocks/masters';
import { mockInspections } from '@/mocks/qms';
import { toInputDate } from '@/utils/format';
import {
  getItemsWithVariantsForBOM,
  type BOMDropdownGroup,
  type BOMDropdownVariant,
} from '@/api/item.api';

import {
  getRoutingsForDropdown,
  type RoutingDropdownItem,
} from '@/api/routing.api';

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

function generatePONumber(): string {
  const year = new Date().getFullYear();
  const existing = mockProductionOrders.filter((po) =>
    po.poNumber.startsWith(`PRD-${year}-`),
  );
  const maxSeq = existing.reduce((max, po) => {
    const parts = po.poNumber.split('-');
    const seq = parseInt(parts[parts.length - 1], 10);
    return Math.max(max, isNaN(seq) ? 0 : seq);
  }, 0);
  return `PRD-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
}

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

interface MaterialCheckRow {
  itemId: string;
  itemName: string;
  itemCode: string;
  required: number;
  available: number;
  unit: string;
  sufficient: boolean;
}

export default function ProductionOrderForm() {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isEditing = !!editId;

  const existingPO = useMemo(
    () => mockProductionOrders.find((po) => po.id === editId),
    [editId],
  );
  const navType = (location.state as { type?: POType } | null)?.type;

  const [poType, setPoType] = useState<POType>(() => {
    if (isEditing && existingPO) return existingPO.type;
    return navType || 'MTO';
  });
  const [salesOrderRef, setSalesOrderRef] = useState(
    () => existingPO?.salesOrderRef || '',
  );
  const [customerName, setCustomerName] = useState('');
  const [mtsReason, setMtsReason] = useState<MTSReason>('Stock Replenishment');
  const [targetStockLevel, setTargetStockLevel] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    () => existingPO?.productId || null,
  );
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedBOMId, setSelectedBOMId] = useState<string>(
    () => existingPO?.bomId || '',
  );
  const [selectedRoutingId, setSelectedRoutingId] = useState<string>(
    () => existingPO?.routingId || '',
  );
  const [plannedQty, setPlannedQty] = useState(() =>
    (existingPO?.plannedQty ?? '').toString(),
  );
  // Replace existing itemsList state
  const [itemsList, setItemsList] = useState<BOMDropdownGroup[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [routingsList, setRoutingsList] = useState<RoutingDropdownItem[]>([]);
  const [loadingRoutings, setLoadingRoutings] = useState(false);

  const [unit, setUnit] = useState(() => existingPO?.unit || '');
  const [warehouseId, setWarehouseId] = useState(
    () => existingPO?.warehouseId || 'wh-005',
  );
  const [priority, setPriority] = useState<Priority>(
    () => existingPO?.priority || 'NORMAL',
  );
  const [plannedStart, setPlannedStart] = useState(
    () => existingPO?.plannedStartDate || toInputDate(),
  );
  const [plannedEnd, setPlannedEnd] = useState(
    () => existingPO?.plannedEndDate || '',
  );
  const [shiftId, setShiftId] = useState(() => existingPO?.shiftId || '');
  const [notes, setNotes] = useState(() => existingPO?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [statusOverride, setStatusOverride] = useState<POStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'materials'>(
    'details',
  );
  const [reservationVersion, setReservationVersion] = useState(0);
  const [showPrint, setShowPrint] = useState(false);
  const [showMRPBanner, setShowMRPBanner] = useState(false);

  const eligibleItems = useMemo(() => {
    const allItems: any[] = [];
    itemsList.forEach((group) => {
      // Show all items for now (remove category filter)
      allItems.push({
        id: group.id,
        name: group.name,
        code: group.code,
        category: group.category,
        unitName: group.unit_name,
        isParent: group.variants.length > 0,
        isVariant: false,
        parentItemId: null,
        variantName: null,
        variantAttributes: null,
        variants: group.variants,
      });
    });
    return allItems;
  }, [itemsList]);

  const availableBOMs = useMemo(() => {
    if (!selectedProductId) return [] as MockBOM[];
    return mockBOMs.filter(
      (b) => b.productId === selectedProductId && b.status !== 'OBSOLETE',
    );
  }, [selectedProductId]);

const availableRoutings = useMemo(() => {
  // ✅ Show all routings, not just based on product
  return routingsList.filter((r) => r.status === 'ACTIVE');
}, [routingsList]);

 const selectedRouting = useMemo(() => {
   if (!selectedRoutingId) return null;
   // You may need to fetch full routing details if needed
   // For now, just return basic info
   const routing = routingsList.find((r) => r.id === selectedRoutingId);
   return routing || null;
 }, [selectedRoutingId, routingsList]);
  const selectedBOM = useMemo(
    () => mockBOMs.find((b) => b.id === selectedBOMId) || null,
    [selectedBOMId],
  );
  const selectedWarehouse = useMemo(
    () => mockWarehouses.find((w) => w.id === warehouseId) || null,
    [warehouseId],
  );

  // ============================================
  // FETCH ROUTINGS FOR DROPDOWN
  // ============================================
 useEffect(() => {
   const fetchRoutings = async () => {
     try {
       setLoadingRoutings(true);
       const data = await getRoutingsForDropdown();
       console.log('Fetched routings:', data); // ✅ YEH DEKHO
       if (data) setRoutingsList(data);
     } catch (error) {
       console.error('Failed to fetch routings:', error);
     } finally {
       setLoadingRoutings(false);
     }
   };
   fetchRoutings();
 }, []);
  // ============================================
  // FETCH ITEMS + VARIANTS FOR PRODUCT DROPDOWN
  // ============================================
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const data = await getItemsWithVariantsForBOM();
        if (data) setItemsList(data);
      } catch (error) {
        console.error('Failed to fetch items:', error);
        toast.error('Failed to load items');
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [toast]);

  useEffect(() => {
    if (!plannedStart || !selectedRouting) return;
    const days = Math.ceil(selectedRouting.totalTimeMinutes / 60 / 8);
    const calcEnd = addWorkingDays(plannedStart, Math.max(days, 1));
    if (!isEditing || !plannedEnd) setPlannedEnd(calcEnd);
  }, [plannedStart, selectedRouting]);

  useEffect(() => {
    if (selectedProduct) setUnit(selectedProduct.unitName || 'Pcs');
  }, [selectedProduct]);

  const materialCheckRows = useMemo<MaterialCheckRow[]>(() => {
    if (
      !selectedBOMId ||
      !plannedQty ||
      parseFloat(plannedQty) <= 0 ||
      !warehouseId
    )
      return [];
    const qty = parseFloat(plannedQty);
    const bomItems = mockBOMItems.filter(
      (bi) => bi.bomId === selectedBOMId && bi.level > 0,
    );
    const stockMap = mockWarehouseStock[warehouseId] || {};
    return bomItems.map((bi) => {
      const required = bi.qtyPerUnit * qty * (1 + bi.scrapPct / 100);
      const available = stockMap[bi.itemId] || 0;
      return {
        itemId: bi.itemId,
        itemName: bi.itemName,
        itemCode: bi.itemCode,
        required,
        available,
        unit: bi.unit,
        sufficient: available >= required,
      };
    });
  }, [selectedBOMId, plannedQty, warehouseId]);

  const hasShortage = useMemo(
    () => materialCheckRows.some((r) => !r.sufficient),
    [materialCheckRows],
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

    // ✅ Show all items - no category filter
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

  const handleSelectProduct = useCallback(
    (
      productId: string,
      selectedItem?: BOMDropdownGroup | BOMDropdownVariant,
    ) => {
      let product: any =
        selectedItem || itemsList.find((m) => m.id === productId);
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
        parentItemId:
          'parent_item_id' in product ? product.parent_item_id : null,
        variantName: 'variant_name' in product ? product.variant_name : null,
      } as any);

      setShowProductSearch(false);
      setProductSearchQuery('');

      // Reset dependent fields
      setSelectedBOMId('');
      setSelectedRoutingId('');
      setUnit(productUnitName);

      // Auto-select BOM if available
      const boms = mockBOMs.filter(
        (b) => b.productId === productId && b.status !== 'OBSOLETE',
      );
      if (boms.length === 1) setSelectedBOMId(boms[0].id);
      else if (boms.length > 1) {
        const active = boms.find((b) => b.status === 'ACTIVE');
        setSelectedBOMId(active ? active.id : boms[0].id);
      }
    },
    [itemsList],
  );

  const handleSave = useCallback(async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!selectedBOMId) {
      toast.error('Please select a BOM version');
      return;
    }
    if (!plannedQty || parseFloat(plannedQty) <= 0) {
      toast.error('Please enter planned quantity');
      return;
    }
    if (!warehouseId) {
      toast.error('Please select a warehouse');
      return;
    }
    if (!plannedStart) {
      toast.error('Please select planned start date');
      return;
    }
    if (!plannedEnd) {
      toast.error('Please select planned end date');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const product = mockItems.find((m) => m.id === selectedProductId)!;
    const warehouse = mockWarehouses.find((w) => w.id === warehouseId)!;
    const poNumber = isEditing ? existingPO!.poNumber : generatePONumber();
    const finalStatus: POStatus =
      statusOverride || (isEditing ? existingPO!.status : 'DRAFT');
    const newPO = {
      id: isEditing ? existingPO!.id : `prod-${Date.now()}`,
      poNumber,
      type: poType,
      status: finalStatus,
      priority,
      productId: selectedProductId,
      productName: product.name,
      productCode: product.code,
      isVariant: product.isVariant,
      variantName: product.isVariant
        ? product.variantName || product.name
        : null,
      bomId: selectedBOMId,
      bomVersion:
        mockBOMs.find((b) => b.id === selectedBOMId)?.version || '1.0',
      plannedQty: parseFloat(plannedQty),
      completedQty: isEditing ? existingPO!.completedQty : 0,
      rejectedQty: isEditing ? existingPO!.rejectedQty : 0,
      unit: unit || product.unitName || 'Pcs',
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
      actualStartDate: isEditing ? existingPO!.actualStartDate : null,
      actualEndDate: isEditing ? existingPO!.actualEndDate : null,
      salesOrderRef: poType === 'MTO' ? salesOrderRef || null : null,
      salesOrderId:
        poType === 'MTO'
          ? salesOrderRef
            ? `so-${salesOrderRef}`
            : null
          : null,
      warehouseId,
      warehouseName: warehouse.name,
      routingId: selectedRoutingId || null,
      notes: notes || null,
      createdBy: 'Admin User',
      createdAt: isEditing ? existingPO!.createdAt : new Date().toISOString(),
    };
    if (isEditing) {
      const idx = mockProductionOrders.findIndex((po) => po.id === editId);
      if (idx >= 0) mockProductionOrders[idx] = newPO;
    } else {
      mockProductionOrders.push(newPO);
    }
    if (!isEditing && selectedRouting) {
      let currentDate = plannedStart;
      selectedRouting.stages.forEach((stage, i) => {
        const stageDays = Math.max(
          1,
          Math.ceil(
            (stage.standardTimeMinutes + stage.setupTimeMinutes) / 60 / 8,
          ),
        );
        const endDate = addWorkingDays(currentDate, stageDays);
        mockWorkOrders.push({
          id: `wo-${Date.now()}-${i}`,
          woNumber: `${poNumber}-${stage.stageNumber}`,
          productionOrderId: newPO.id,
          productionOrderNumber: poNumber,
          stageNumber: stage.stageNumber,
          stageName: stage.stageName,
          workCenterId: stage.workCenterId || '',
          workCenterName: stage.workCenterName || '',
          machineId: stage.machineId || null,
          machineName: stage.machineName || null,
          operatorId: null,
          operatorName: null,
          shiftId: shiftId || null,
          shiftName: shiftId
            ? mockShifts.find((s) => s.id === shiftId)?.name || null
            : null,
          status: 'PENDING',
          plannedQty: parseFloat(plannedQty),
          completedQty: 0,
          rejectedQty: 0,
          plannedStartDate: currentDate,
          plannedEndDate: endDate,
          actualStartDate: null,
          actualEndDate: null,
          plannedTimeMinutes:
            stage.standardTimeMinutes + stage.setupTimeMinutes,
          actualTimeMinutes: null,
          notes: null,
        });
        currentDate = endDate;
      });
    }
    setSaving(false);
    toast.success(
      `Production Order ${poNumber} ${isEditing ? 'updated' : 'created'}`,
    );
    setShowMRPBanner(true);
  }, [
    selectedProductId,
    selectedBOMId,
    plannedQty,
    warehouseId,
    plannedStart,
    plannedEnd,
    poType,
    priority,
    salesOrderRef,
    unit,
    selectedRoutingId,
    shiftId,
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
      toast.info(
        `Status will change to ${statusConfig[nextStatus].label} on save`,
      );
    },
    [toast],
  );

  const currentStatus: POStatus =
    statusOverride || (isEditing ? existingPO!.status : 'DRAFT');

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

  const getReservations = useCallback(() => {
    if (!isEditing || !existingPO) return [] as MockMaterialReservation[];
    const _ = reservationVersion;
    return mockMaterialReservations.filter(
      (mr) => mr.productionOrderId === existingPO.id,
    );
  }, [isEditing, existingPO, reservationVersion]);

  const handleReserveOne = useCallback(
    (mr: MockMaterialReservation) => {
      const whId = existingPO?.warehouseId || 'wh-001';
      const available = mockWarehouseStock[whId]?.[mr.itemId] || 0;
      const needed = mr.requiredQty - mr.reservedQty;
      const toReserve = Math.min(needed, available);
      if (toReserve <= 0) {
        toast.error(`No stock available for ${mr.itemName}`);
        return;
      }
      const idx = mockMaterialReservations.findIndex((r) => r.id === mr.id);
      if (idx >= 0) {
        mockMaterialReservations[idx].reservedQty += toReserve;
        mockMaterialReservations[idx].status =
          mockMaterialReservations[idx].reservedQty >= mr.requiredQty
            ? 'RESERVED'
            : 'PARTIAL';
      }
      if (!mockWarehouseStock[whId]) mockWarehouseStock[whId] = {};
      mockWarehouseStock[whId][mr.itemId] =
        (mockWarehouseStock[whId][mr.itemId] || 0) - toReserve;
      toast.success(
        `Reserved ${toReserve.toFixed(2)} ${mr.unit} of ${mr.itemName}`,
      );
      setReservationVersion((v) => v + 1);
    },
    [existingPO, toast],
  );

  const handleReleaseOne = useCallback(
    (mr: MockMaterialReservation) => {
      const whId = existingPO?.warehouseId || 'wh-001';
      const toRelease = mr.reservedQty;
      if (toRelease <= 0) return;
      const idx = mockMaterialReservations.findIndex((r) => r.id === mr.id);
      if (idx >= 0) {
        mockMaterialReservations[idx].reservedQty = 0;
        mockMaterialReservations[idx].status = 'PENDING';
      }
      if (!mockWarehouseStock[whId]) mockWarehouseStock[whId] = {};
      mockWarehouseStock[whId][mr.itemId] =
        (mockWarehouseStock[whId][mr.itemId] || 0) + toRelease;
      toast.success(
        `Released ${toRelease.toFixed(2)} ${mr.unit} of ${mr.itemName}`,
      );
      setReservationVersion((v) => v + 1);
    },
    [existingPO, toast],
  );

  const handleReserveAll = useCallback(() => {
    const whId = existingPO?.warehouseId || 'wh-001';
    let reservedCount = 0;
    mockMaterialReservations
      .filter(
        (mr) =>
          mr.productionOrderId === existingPO?.id &&
          (mr.status === 'PENDING' || mr.status === 'PARTIAL'),
      )
      .forEach((mr) => {
        const available = mockWarehouseStock[whId]?.[mr.itemId] || 0;
        const needed = mr.requiredQty - mr.reservedQty;
        const toReserve = Math.min(needed, available);
        if (toReserve > 0) {
          const idx = mockMaterialReservations.findIndex((r) => r.id === mr.id);
          if (idx >= 0) {
            mockMaterialReservations[idx].reservedQty += toReserve;
            mockMaterialReservations[idx].status =
              mockMaterialReservations[idx].reservedQty >= mr.requiredQty
                ? 'RESERVED'
                : 'PARTIAL';
          }
          if (!mockWarehouseStock[whId]) mockWarehouseStock[whId] = {};
          mockWarehouseStock[whId][mr.itemId] =
            (mockWarehouseStock[whId][mr.itemId] || 0) - toReserve;
          reservedCount++;
        }
      });
    if (reservedCount > 0) {
      toast.success('Reserved all available materials');
      setReservationVersion((v) => v + 1);
    } else toast.info('No materials available to reserve');
  }, [existingPO, toast]);

  const showTabs =
    isEditing &&
    existingPO &&
    (existingPO.status === 'PLANNED' || existingPO.status === 'IN_PROGRESS');

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                {isEditing
                  ? `Edit Production Order \u2014 ${existingPO?.poNumber}`
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
                  title="Print Production Order"
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

          {/* Tabs — only for PLANNED / IN_PROGRESS */}
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
                      <i
                        className={
                          t === 'MTO' ? 'ri-building-line' : 'ri-box-3-line'
                        }
                      />
                      {t === 'MTO'
                        ? 'Make to Order (MTO)'
                        : 'Make to Stock (MTS)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* MTO Fields */}
              {poType === 'MTO' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-file-list-3-line text-[#4f46e5]" />
                    Sales Order Link
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Sales Order Ref
                      </label>
                      <input
                        type="text"
                        value={salesOrderRef}
                        onChange={(e) => setSalesOrderRef(e.target.value)}
                        placeholder="e.g. INV-2024-003"
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                      />
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        Link this production to a sales order
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#64748b] mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Auto-fill if SO selected"
                        className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
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
                        onChange={(e) =>
                          setMtsReason(e.target.value as MTSReason)
                        }
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
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        Produce until stock reaches this level
                      </p>
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
                  <div className="md:col-span-2 relative">
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`w-full min-h-[40px] px-3 py-2 text-sm border rounded-lg cursor-pointer flex items-center justify-between ${selectedProduct ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      onClick={() => {
                        if (!isEditing) setShowProductSearch(true);
                      }}
                    >
                      <span className={selectedProduct ? 'text-[#1e293b]' : ''}>
                        {selectedProduct
                          ? selectedProduct.isVariant
                            ? selectedProduct.name // already includes parent name
                            : selectedProduct.name
                          : 'Search and select a product...'}
                      </span>
                      {!isEditing && (
                        <i className="ri-search-line text-slate-400" />
                      )}
                    </div>
                    {showProductSearch && !isEditing && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                        <div className="p-2 border-b border-slate-200">
                          <input
                            autoFocus
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) =>
                              setProductSearchQuery(e.target.value)
                            }
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
                                    onClick={() =>
                                      handleSelectProduct(variant.id, variant)
                                    }
                                    className="w-full px-6 py-2 text-left text-sm text-[#1e293b] hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
                                  >
                                    <span className="text-slate-400">
                                      \u2514
                                    </span>
                                    <span>{variant.name}</span>
                                    <span className="text-xs text-slate-400 ml-auto">
                                      {variant.code}
                                    </span>
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
                              <span className="text-xs text-slate-400 ml-auto">
                                {item.code}
                              </span>
                            </button>
                          ))}
                          {productDropdownData.parents.length === 0 &&
                            productDropdownData.regulars.length === 0 && (
                              <div className="px-3 py-4 text-center text-sm text-slate-400">
                                {loadingItems
                                  ? 'Loading products...'
                                  : 'No products found'}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      BOM Version <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBOMId}
                      onChange={(e) => setSelectedBOMId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">Select BOM...</option>
                      {availableBOMs.map((bom) => (
                        <option key={bom.id} value={bom.id}>
                          v{bom.version} ({bom.status}) \u2014 {bom.code}
                        </option>
                      ))}
                    </select>
                    {availableBOMs.length === 0 && selectedProduct && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active BOMs found for this product
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Routing{' '}
                      <span className="text-[#94a3b8] font-normal">
                        (Optional)
                      </span>
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
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active routings found
                      </p>
                    )}
                    {availableRoutings.length === 0 && selectedProduct && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        No active routings found
                      </p>
                    )}
                    {selectedRouting && (
                      <p className="text-[11px] text-[#94a3b8] mt-1">
                        {selectedRouting.stages.length} stages, total{' '}
                        {selectedRouting.totalTimeMinutes} min
                      </p>
                    )}
                  </div>

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
                        {unit || '\u2014'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      {mockWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
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
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as Priority[]).map(
                        (p) => (
                          <option key={p} value={p}>
                            {priorityConfig[p].label}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${priorityConfig[priority].bg} ${priorityConfig[priority].text} ${priorityConfig[priority].border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${priorityConfig[priority].dot}`}
                        />
                        {priorityConfig[priority].label} Priority
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                      Shift{' '}
                      <span className="text-[#94a3b8] font-normal">
                        (Optional)
                      </span>
                    </label>
                    <select
                      value={shiftId}
                      onChange={(e) => setShiftId(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                    >
                      <option value="">No shift assigned</option>
                      {mockShifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime}\u2013{s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
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
                          {Math.ceil(selectedRouting.totalTimeMinutes / 60 / 8)}{' '}
                          days
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

              {/* Material Check */}
              {materialCheckRows.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-list-check-2 text-[#4f46e5]" />
                    Material Requirements for {plannedQty} {unit}
                  </h3>
                  {hasShortage && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <i className="ri-alert-line text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Some materials are short
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Consider raising Purchase Orders first.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">
                            Material
                          </th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">
                            Required
                          </th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">
                            Available
                          </th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialCheckRows.map((row) => (
                          <tr
                            key={row.itemId}
                            className="border-b border-slate-50"
                          >
                            <td className="px-3 py-2">
                              <div className="text-sm font-medium text-[#1e293b]">
                                {row.itemName}
                              </div>
                              <div className="text-[11px] text-[#94a3b8]">
                                {row.itemCode}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-[#475569]">
                              {row.required.toFixed(2)} {row.unit}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-[#475569]">
                              {row.available} {row.unit}
                            </td>
                            <td className="px-3 py-2">
                              {row.sufficient ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <i className="ri-check-line" />
                                  Sufficient
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                  <i className="ri-close-line" />
                                  Short
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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

              {/* QC Section */}
              {isEditing && existingPO && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <h3 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                    <i className="ri-shield-check-line text-[#4f46e5]" />
                    Quality Control
                  </h3>
                  {(() => {
                    const linkedInspections = mockInspections.filter(
                      (i) =>
                        i.sourceType === 'PRODUCTION_ORDER' &&
                        i.sourceId === existingPO.id,
                    );
                    if (linkedInspections.length === 0) {
                      return (
                        <div className="text-center py-6 text-sm text-slate-400">
                          <i className="ri-shield-check-line text-xl mb-1 block" />
                          No QC inspections linked to this order
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {linkedInspections.map((insp) => (
                          <div
                            key={insp.id}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                              insp.status === 'PASSED'
                                ? 'bg-emerald-50 border-emerald-200'
                                : insp.status === 'FAILED'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-amber-50 border-amber-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                  insp.status === 'PASSED'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : insp.status === 'FAILED'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                <i
                                  className={
                                    insp.status === 'PASSED'
                                      ? 'ri-check-line'
                                      : insp.status === 'FAILED'
                                        ? 'ri-close-line'
                                        : 'ri-time-line'
                                  }
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1e293b]">
                                  {insp.inspectionNumber}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {insp.type.replace(/_/g, ' ')} Inspection ·{' '}
                                  {insp.checklistName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                  insp.status === 'PASSED'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : insp.status === 'FAILED'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}
                              >
                                {insp.status === 'PASSED' && '✅ Passed'}
                                {insp.status === 'FAILED' && '❌ Failed'}
                                {(insp.status === 'PENDING' ||
                                  insp.status === 'IN_PROGRESS') &&
                                  '⏳ Pending'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (insp.type === 'IN_PROCESS') {
                                    // Navigate with state to open the inspection
                                  }
                                }}
                                className="text-xs text-[#4f46e5] hover:text-indigo-700 font-medium underline cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-[#1e293b] mb-3">
                  Order Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Type', value: poType },
                    {
                      label: 'Product',
                      value: selectedProduct?.name || '\u2014',
                    },
                    {
                      label: 'Quantity',
                      value: `${plannedQty || '\u2014'} ${unit}`,
                    },
                    {
                      label: 'Warehouse',
                      value: selectedWarehouse?.name || '\u2014',
                    },
                    {
                      label: 'Priority',
                      value: priorityConfig[priority].label,
                    },
                    {
                      label: 'Start',
                      value: plannedStart
                        ? formatShortDate(plannedStart)
                        : '\u2014',
                    },
                    {
                      label: 'End',
                      value: plannedEnd
                        ? formatShortDate(plannedEnd)
                        : '\u2014',
                    },
                    {
                      label: 'BOM',
                      value: selectedBOM ? `v${selectedBOM.version}` : '\u2014',
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-[#64748b]">{item.label}</p>
                      <p className="text-sm font-medium text-[#1e293b] mt-0.5 truncate">
                        {item.value}
                      </p>
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
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Item Name
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Required Qty
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Reserved Qty
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Unit
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Status
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-[#64748b]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReservations().map((mr) => {
                      const sc =
                        mr.status === 'RESERVED'
                          ? {
                              label: 'Reserved',
                              bg: 'bg-emerald-50',
                              text: 'text-emerald-700',
                              border: 'border-emerald-200',
                              icon: 'ri-check-line',
                            }
                          : mr.status === 'PARTIAL'
                            ? {
                                label: 'Partial',
                                bg: 'bg-amber-50',
                                text: 'text-amber-700',
                                border: 'border-amber-200',
                                icon: 'ri-alert-line',
                              }
                            : mr.status === 'PENDING'
                              ? {
                                  label: 'Pending',
                                  bg: 'bg-rose-50',
                                  text: 'text-rose-700',
                                  border: 'border-rose-200',
                                  icon: 'ri-close-line',
                                }
                              : {
                                  label: 'Released',
                                  bg: 'bg-slate-50',
                                  text: 'text-slate-600',
                                  border: 'border-slate-200',
                                  icon: 'ri-history-line',
                                };
                      return (
                        <tr key={mr.id} className="border-b border-slate-50">
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-[#1e293b]">
                              {mr.itemName}
                            </div>
                            <div className="text-[11px] text-[#94a3b8]">
                              {mr.itemCode}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-[#475569]">
                            {mr.requiredQty.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-[#475569]">
                            {mr.reservedQty.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-left text-sm text-[#475569]">
                            {mr.unit}
                          </td>
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
                              {(mr.status === 'PENDING' ||
                                mr.status === 'PARTIAL') && (
                                <button
                                  onClick={() => handleReserveOne(mr)}
                                  className="h-7 px-2.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                >
                                  <i className="ri-download-line" />
                                  Reserve
                                </button>
                              )}
                              {(mr.status === 'RESERVED' ||
                                mr.status === 'PARTIAL') && (
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
                    {getReservations().length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-sm text-[#94a3b8]"
                        >
                          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                            <i className="ri-inbox-line text-xl text-slate-300" />
                          </div>
                          No material reservations yet.
                          <br />
                          <span className="text-xs">
                            Click Reserve All to reserve materials.
                          </span>
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

      {showProductSearch && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProductSearch(false)}
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
