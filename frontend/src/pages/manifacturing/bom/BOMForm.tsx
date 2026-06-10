import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  mockItems,
  mockBOMs,
  mockBOMItems,
  type MockItem,
} from '@/mocks/masters';
import { formatINR } from '@/utils/format';
import AddComponentModal from './components/AddComponentModal';
import BOMExplosionModal from './components/BOMExplosionModal';
import BOMPrintModal from './components/BOMPrintModal';

interface FormBOMItem {
  id: string;
  parentId: string | null;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType: string;
  qtyPerUnit: number;
  unit: string;
  scrapPct: number;
  standardCost: number;
  level: number;
  hasSubBOM: boolean;
  subBOMId: string | null;
  qcRequired: boolean;
  notes: string | null;
  rolledUpCost?: number;
}

function getDescendantIds(items: FormBOMItem[], parentId: string): string[] {
  const result: string[] = [];
  const direct = items.filter((i) => i.parentId === parentId);
  direct.forEach((child) => {
    result.push(child.id);
    result.push(...getDescendantIds(items, child.id));
  });
  return result;
}

function getDisplayOrder(
  items: FormBOMItem[],
  expanded: Set<string>,
): FormBOMItem[] {
  const result: FormBOMItem[] = [];
  const roots = items
    .filter((i) => i.parentId === null)
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
  function walk(item: FormBOMItem) {
    result.push(item);
    if (expanded.has(item.id)) {
      const children = items
        .filter((i) => i.parentId === item.id)
        .sort((a, b) => a.itemName.localeCompare(b.itemName));
      children.forEach(walk);
    }
  }
  roots.forEach(walk);
  return result;
}

const typeBadgeClass = (type: string) => {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'bg-amber-100 text-amber-700 border-amber-200',
    SEMI_FINISHED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONSUMABLE: 'bg-sky-100 text-sky-700 border-sky-200',
    PACKAGING: 'bg-slate-100 text-slate-600 border-slate-200',
    FINISHED_GOOD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[type] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'Raw',
    SEMI_FINISHED: 'Semi',
    CONSUMABLE: 'Consumable',
    PACKAGING: 'Packaging',
    FINISHED_GOOD: 'Finished',
  };
  return map[type] || type;
};

function generateBOMCode(product: MockItem): string {
  const prefix =
    product.isVariant && product.variantSku
      ? `BOM-${product.variantSku}`
      : `BOM-${product.code}`;
  let suffix = 1;
  let code = `${prefix}-${String(suffix).padStart(3, '0')}`;
  while (mockBOMs.some((b) => b.code === code)) {
    suffix++;
    code = `${prefix}-${String(suffix).padStart(3, '0')}`;
  }
  return code;
}

export default function BOMForm() {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isEditing = !!editId;

  // ── Handle variant BOM navigation state ──
  useEffect(() => {
    const navState = location.state as {
      parentProductId?: string;
      parentProductName?: string;
      isVariantBOM?: boolean;
    } | null;
    if (navState?.isVariantBOM && navState?.parentProductId && !isEditing) {
      setVariantParentFilter(navState.parentProductId);
      setProductSearchQuery('');
      setShowProductSearch(true);
      toast.info(
        `Select a variant of ${navState.parentProductName || 'the parent product'} to create a BOM`,
      );
    }
  }, [location.state, isEditing, toast]);

  // ── Load existing data ──
  const existingBOM = useMemo(
    () => mockBOMs.find((b) => b.id === editId),
    [editId],
  );

  const existingItems = useMemo(() => {
    if (!editId) return [] as FormBOMItem[];
    return mockBOMItems
      .filter((bi) => bi.bomId === editId)
      .map(
        (bi) =>
          ({
            id: bi.id,
            parentId: bi.parentId,
            itemId: bi.itemId,
            itemName: bi.itemName,
            itemCode: bi.itemCode,
            itemType: bi.itemType,
            qtyPerUnit: bi.qtyPerUnit,
            unit: bi.unit,
            scrapPct: bi.scrapPct,
            standardCost: bi.standardCost,
            level: bi.level,
            hasSubBOM: bi.hasSubBOM,
            subBOMId: bi.subBOMId,
            qcRequired: false,
            notes: bi.notes,
          }) as FormBOMItem,
      );
  }, [editId]);

  const variantIdFromQuery = searchParams.get('variantId');

  // ── Form state ──
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    () => {
      if (isEditing && existingBOM) return existingBOM.productId;
      return variantIdFromQuery || null;
    },
  );

  const [bomCode, setBomCode] = useState(() => {
    if (isEditing && existingBOM) return existingBOM.code;
    if (variantIdFromQuery) {
      const p = mockItems.find((m) => m.id === variantIdFromQuery);
      return p ? generateBOMCode(p) : '';
    }
    return '';
  });

  const [version, setVersion] = useState(() => {
    if (isEditing && existingBOM) return existingBOM.version;
    return '1.0';
  });

  const [effectiveFrom, setEffectiveFrom] = useState(() => {
    if (isEditing && existingBOM?.effectiveFrom)
      return existingBOM.effectiveFrom;
    return new Date().toISOString().split('T')[0];
  });

  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'OBSOLETE'>(() => {
    if (isEditing && existingBOM) return existingBOM.status;
    return 'DRAFT';
  });

  const [notes, setNotes] = useState(() => {
    if (isEditing && existingBOM?.notes) return existingBOM.notes || '';
    return '';
  });

  const [items, setItems] = useState<FormBOMItem[]>(() => {
    if (isEditing && existingItems.length) return existingItems;
    if (variantIdFromQuery) {
      const product = mockItems.find((m) => m.id === variantIdFromQuery);
      if (product) {
        return [
          {
            id: crypto.randomUUID(),
            parentId: null,
            itemId: product.id,
            itemName: product.name,
            itemCode: product.code,
            itemType: product.itemType,
            qtyPerUnit: 1,
            unit: product.unitName || 'Pcs',
            scrapPct: 0,
            standardCost: product.standardCost || product.purchaseRate || 0,
            level: 0,
            hasSubBOM: false,
            subBOMId: null,
            qcRequired: false,
            notes: null,
          },
        ];
      }
    }
    return [];
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => {
    if (items.length) return new Set(items.map((i) => i.id));
    return new Set();
  });

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [variantParentFilter, setVariantParentFilter] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [inheritanceUsed, setInheritanceUsed] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Feature 3+5 state ──
  const [rolledUpCosts, setRolledUpCosts] = useState<Record<string, number>>();
  const [showCostConfirm, setShowCostConfirm] = useState(false);
  const [rolledUpTotal, setRolledUpTotal] = useState(0);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showExplodeModal, setShowExplodeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);

  // ── Derived ──
  const selectedProduct = useMemo(
    () =>
      selectedProductId
        ? mockItems.find((m) => m.id === selectedProductId)
        : null,
    [selectedProductId],
  );

  const isVariantBOM = !!selectedProduct?.isVariant;

  const displayItems = useMemo(
    () => getDisplayOrder(items, expandedRows),
    [items, expandedRows],
  );

  const maxLevel = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.level)) : 0),
    [items],
  );

  const costSummary = useMemo(() => {
    const raw = items
      .filter((i) => i.itemType === 'RAW_MATERIAL')
      .reduce(
        (s, i) => s + i.qtyPerUnit * (1 + i.scrapPct / 100) * i.standardCost,
        0,
      );
    const semi = items
      .filter((i) => i.itemType === 'SEMI_FINISHED')
      .reduce(
        (s, i) => s + i.qtyPerUnit * (1 + i.scrapPct / 100) * i.standardCost,
        0,
      );
    const consumable = items
      .filter((i) => i.itemType === 'CONSUMABLE')
      .reduce(
        (s, i) => s + i.qtyPerUnit * (1 + i.scrapPct / 100) * i.standardCost,
        0,
      );
    const packaging = items
      .filter((i) => i.itemType === 'PACKAGING')
      .reduce(
        (s, i) => s + i.qtyPerUnit * (1 + i.scrapPct / 100) * i.standardCost,
        0,
      );
    const baseTotal = raw + semi + consumable + packaging;
    const total = rolledUpTotal > 0 ? rolledUpTotal : baseTotal;
    const scrapCost = items.reduce(
      (s, i) => s + i.qtyPerUnit * (i.scrapPct / 100) * i.standardCost,
      0,
    );
    return { raw, semi, consumable, packaging, total, scrapCost };
  }, [items, rolledUpTotal]);

  // ── Link status ──
  const isLinkedToItemMaster = useMemo(() => {
    if (!selectedProductId || !isEditing || !editId) return false;
    const item = mockItems.find((m) => m.id === selectedProductId);
    return item?.bomId === editId;
  }, [selectedProductId, isEditing, editId]);

  // ── Other versions ──
  const otherVersions = useMemo(() => {
    if (!selectedProductId || !isEditing || !editId)
      return [] as typeof mockBOMs;
    return mockBOMs.filter(
      (b) => b.productId === selectedProductId && b.id !== editId,
    );
  }, [selectedProductId, isEditing, editId]);

  // ── Inheritance options ──
  const inheritanceOptions = useMemo(() => {
    if (!selectedProduct?.isVariant || !selectedProduct.parentItemId)
      return [] as Array<{
        name: string;
        code: string;
        bomId: string;
        itemId: string;
      }>;
    const parent = mockItems.find((m) => m.id === selectedProduct.parentItemId);
    const siblings = mockItems.filter(
      (m) =>
        m.parentItemId === selectedProduct.parentItemId &&
        m.id !== selectedProduct.id &&
        m.bomId,
    );
    const opts: Array<{
      name: string;
      code: string;
      bomId: string;
      itemId: string;
    }> = [];
    if (parent?.bomId) {
      const pb = mockBOMs.find((b) => b.id === parent.bomId);
      if (pb)
        opts.push({
          name: parent.name,
          code: pb.code,
          bomId: parent.bomId,
          itemId: parent.id,
        });
    }
    siblings.forEach((sib) => {
      const sb = mockBOMs.find((b) => b.id === sib.bomId);
      if (sb)
        opts.push({
          name: sib.variantName || sib.name,
          code: sb.code,
          bomId: sib.bomId!,
          itemId: sib.id,
        });
    });
    return opts;
  }, [selectedProduct]);

  const showInheritanceBanner =
    !!selectedProduct?.isVariant &&
    !inheritanceUsed &&
    !isEditing &&
    inheritanceOptions.length > 0 &&
    items.length <= 1;

  // ── Product dropdown data ──
  const eligibleItems = useMemo(
    () =>
      mockItems.filter(
        (m) => m.itemType === 'FINISHED_GOOD' || m.itemType === 'SEMI_FINISHED',
      ),
    [],
  );

  const productDropdownData = useMemo(() => {
    const q = productSearchQuery.toLowerCase();
    const parents = eligibleItems.filter((m) => m.isParent);
    const variants = eligibleItems.filter((m) => m.isVariant);
    const regulars = eligibleItems.filter((m) => !m.isParent && !m.isVariant);

    if (variantParentFilter) {
      const targetParent = parents.find((p) => p.id === variantParentFilter);
      const targetVariants = variants.filter(
        (v) =>
          v.parentItemId === variantParentFilter &&
          (v.name.toLowerCase().includes(q) ||
            v.code.toLowerCase().includes(q)),
      );
      return {
        parents: targetParent ? [targetParent] : [],
        variants: targetVariants,
        regulars: [],
      };
    }

    const filteredParents = parents.filter((p) => {
      const matches =
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const hasMatchingVariant = variants.some(
        (v) =>
          v.parentItemId === p.id &&
          (v.name.toLowerCase().includes(q) ||
            v.code.toLowerCase().includes(q)),
      );
      return matches || hasMatchingVariant;
    });

    const filteredVariants = variants.filter(
      (v) =>
        v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q),
    );

    const filteredRegulars = regulars.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );

    return {
      parents: filteredParents,
      variants: filteredVariants,
      regulars: filteredRegulars,
    };
  }, [eligibleItems, productSearchQuery, variantParentFilter]);

  // ── Handlers ──
  const handleSelectProduct = useCallback((productId: string) => {
    const product = mockItems.find((m) => m.id === productId);
    if (!product) return;
    setSelectedProductId(productId);
    setShowProductSearch(false);
    setProductSearchQuery('');
    setVariantParentFilter(null);
    setInheritanceUsed(false);

    const rootId = crypto.randomUUID();
    const rootItem: FormBOMItem = {
      id: rootId,
      parentId: null,
      itemId: product.id,
      itemName: product.name,
      itemCode: product.code,
      itemType: product.itemType,
      qtyPerUnit: 1,
      unit: product.unitName || 'Pcs',
      scrapPct: 0,
      standardCost: product.standardCost || product.purchaseRate || 0,
      level: 0,
      hasSubBOM: false,
      subBOMId: null,
      qcRequired: false,
      notes: null,
    };
    setItems([rootItem]);
    setExpandedRows(new Set([rootId]));
    setBomCode(generateBOMCode(product));
    setVersion('1.0');
  }, []);

  const handleCopyFromSource = useCallback(
    (sourceBOMId: string) => {
      const sourceItems = mockBOMItems.filter((bi) => bi.bomId === sourceBOMId);
      if (!sourceItems.length) return;

      const idMap = new Map<string, string>();
      sourceItems.forEach((bi) => idMap.set(bi.id, crypto.randomUUID()));

      const copied: FormBOMItem[] = sourceItems.map((bi) => ({
        id: idMap.get(bi.id) || crypto.randomUUID(),
        parentId: bi.parentId ? idMap.get(bi.parentId) || null : null,
        itemId: bi.itemId,
        itemName: bi.itemName,
        itemCode: bi.itemCode,
        itemType: bi.itemType,
        qtyPerUnit: bi.qtyPerUnit,
        unit: bi.unit,
        scrapPct: bi.scrapPct,
        standardCost: bi.standardCost,
        level: bi.level,
        hasSubBOM: bi.hasSubBOM,
        subBOMId: bi.subBOMId,
        qcRequired: false,
        notes: bi.notes,
      }));

      // Replace root with current product
      const rootIdx = copied.findIndex((i) => i.parentId === null);
      if (rootIdx >= 0 && selectedProduct) {
        copied[rootIdx] = {
          ...copied[rootIdx],
          itemId: selectedProduct.id,
          itemName: selectedProduct.name,
          itemCode: selectedProduct.code,
          itemType: selectedProduct.itemType,
          unit: selectedProduct.unitName || 'Pcs',
          standardCost:
            selectedProduct.standardCost || selectedProduct.purchaseRate || 0,
        };
      }

      setItems(copied);
      setExpandedRows(new Set(copied.map((i) => i.id)));
      setInheritanceUsed(true);
      toast.success('BOM copied. Modify as needed.');
    },
    [selectedProduct, toast],
  );

  const updateItemField = useCallback(
    (id: string, patch: Partial<FormBOMItem>) => {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      );
    },
    [],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const toDelete = new Set([id, ...getDescendantIds(prev, id)]);
      return prev.filter((it) => !toDelete.has(it.id));
    });
  }, []);

  const handleAddComponent = useCallback(
    (selectedItem: MockItem) => {
      const parentId = addModalParentId;
      const parent = items.find((i) => i.id === parentId);
      const level = parent ? parent.level + 1 : 0;

      const newItem: FormBOMItem = {
        id: crypto.randomUUID(),
        parentId: parentId || null,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemCode: selectedItem.code,
        itemType: selectedItem.itemType,
        qtyPerUnit: 1,
        unit: selectedItem.unitName || 'Pcs',
        scrapPct: 0,
        standardCost:
          selectedItem.standardCost || selectedItem.purchaseRate || 0,
        level,
        hasSubBOM: false,
        subBOMId: null,
        qcRequired: false,
        notes: null,
      };

      setItems((prev) => [...prev, newItem]);
      if (parentId) {
        setExpandedRows((prev) => new Set([...prev, parentId]));
      }
      setShowAddModal(false);
      setAddModalParentId(null);
    },
    [addModalParentId, items],
  );

  const openAddModal = useCallback((parentId: string | null = null) => {
    setAddModalParentId(parentId);
    setShowAddModal(true);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Cost Rollup ──
  const handleCostRollup = useCallback(() => {
    const childrenMap = new Map<string, string[]>();
    items.forEach((it) => {
      if (it.parentId) {
        if (!childrenMap.has(it.parentId)) childrenMap.set(it.parentId, []);
        childrenMap.get(it.parentId)!.push(it.id);
      }
    });

    const costs = new Map<string, number>();
    function computeCost(itemId: string): number {
      if (costs.has(itemId)) return costs.get(itemId)!;
      const item = items.find((i) => i.id === itemId);
      if (!item) return 0;
      const children = childrenMap.get(itemId) || [];
      if (children.length === 0) {
        const cost =
          item.qtyPerUnit * (1 + item.scrapPct / 100) * item.standardCost;
        costs.set(itemId, cost);
        return cost;
      }
      const cost = children.reduce((sum, cid) => sum + computeCost(cid), 0);
      costs.set(itemId, cost);
      return cost;
    }

    items.forEach((it) => computeCost(it.id));

    const newMap: Record<string, number> = {};
    costs.forEach((cost, id) => {
      newMap[id] = cost;
    });
    setRolledUpCosts(newMap);

    const newTotal = items
      .filter((i) => i.level > 0)
      .reduce((sum, it) => sum + (costs.get(it.id) || 0), 0);
    setRolledUpTotal(newTotal);

    toast.success(
      `Cost rollup complete. Standard Cost: ${formatINR(newTotal)}`,
    );
    setShowCostConfirm(true);
  }, [items, toast]);

  // ── Duplicate BOM ──
  const handleDuplicateFromForm = useCallback(() => {
    if (!selectedProductId || items.length <= 1) {
      toast.error('Cannot duplicate empty BOM');
      return;
    }

    const [major, minor] = version.split('.').map(Number);
    const newVersion = `${major}.${(minor || 0) + 1}`;
    const newId = `bom-${Date.now()}`;

    const product = mockItems.find((m) => m.id === selectedProductId);
    const newCode = generateBOMCode(
      product || { ...mockItems[0], id: selectedProductId },
    );

    const idMap = new Map<string, string>();
    items.forEach((it) => idMap.set(it.id, crypto.randomUUID()));

    const duplicatedItems: FormBOMItem[] = items.map((it) => ({
      ...it,
      id: idMap.get(it.id) || crypto.randomUUID(),
      parentId: it.parentId ? idMap.get(it.parentId) || null : null,
      rolledUpCost: undefined,
    }));

    const totalMaterialCost = duplicatedItems
      .filter((i) => i.level > 0)
      .reduce(
        (sum, it) =>
          sum + it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
        0,
      );

    mockBOMs.push({
      id: newId,
      code: newCode,
      productId: selectedProductId,
      productName: product?.name || '',
      productCode: product?.code || '',
      version: newVersion,
      status: 'DRAFT',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: null,
      totalMaterialCost,
      totalItems: duplicatedItems.length,
      levels: maxLevel + 1,
      isVariantBOM: !!product?.isVariant,
      parentBOMId:
        product?.isVariant && product.parentItemId
          ? mockItems.find((m) => m.id === product.parentItemId)?.bomId || null
          : null,
      variantName: product?.isVariant
        ? product.variantName || product.name
        : null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    duplicatedItems.forEach((it) => {
      mockBOMItems.push({
        id: it.id,
        parentId: it.parentId,
        bomId: newId,
        itemId: it.itemId,
        itemName: it.itemName,
        itemType: it.itemType,
        itemCode: it.itemCode,
        qtyPerUnit: it.qtyPerUnit,
        unit: it.unit,
        scrapPct: it.scrapPct,
        effectiveQty: it.qtyPerUnit * (1 + it.scrapPct / 100),
        standardCost: it.standardCost,
        totalCost:
          rolledUpCosts?.[it.id] ||
          it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
        level: it.level,
        hasSubBOM: it.hasSubBOM,
        subBOMId: it.subBOMId,
        isAlternate: false,
        alternateForId: null,
        notes: it.notes,
      });
    });

    toast.success(`BOM duplicated as v${newVersion} (Draft)`);
    navigate(`/manufacturing/bom/${newId}/edit`);
  }, [selectedProductId, items, version, notes, maxLevel, toast, navigate]);

  // ── Link to Item Master ──
  const handleLinkToItemMaster = useCallback(() => {
    if (!selectedProductId) return;
    const itemIdx = mockItems.findIndex((m) => m.id === selectedProductId);
    if (itemIdx < 0) return;

    const currentTotal =
      rolledUpTotal > 0
        ? rolledUpTotal
        : items
            .filter((i) => i.level > 0)
            .reduce(
              (s, it) =>
                s + it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
              0,
            );

    mockItems[itemIdx] = {
      ...mockItems[itemIdx],
      bomId: isEditing && editId ? editId : mockItems[itemIdx].bomId,
      bomVersion: version,
      standardCost: currentTotal,
    };

    toast.success('Linked to Item Master and updated standard cost');
    setShowLinkConfirm(false);
  }, [
    selectedProductId,
    items,
    version,
    isEditing,
    editId,
    rolledUpTotal,
    toast,
  ]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    const childCount = items.filter((i) => i.level > 0).length;
    if (childCount === 0) {
      toast.error('Add at least one component');
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const totalMaterialCost =
      rolledUpTotal > 0
        ? rolledUpTotal
        : items.reduce(
            (sum, it) =>
              sum + it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
            0,
          );

    if (isEditing && existingBOM) {
      // Update existing
      const idx = mockBOMs.findIndex((b) => b.id === editId);
      if (idx >= 0) {
        mockBOMs[idx] = {
          ...mockBOMs[idx],
          code: bomCode,
          version,
          status,
          effectiveFrom: effectiveFrom || null,
          notes: notes || null,
          totalMaterialCost,
          totalItems: items.length,
          levels: maxLevel + 1,
          isVariantBOM: !!selectedProduct?.isVariant,
          productId: selectedProductId,
          productName: selectedProduct?.name || '',
          productCode: selectedProduct?.code || '',
          variantName: selectedProduct?.isVariant
            ? selectedProduct.variantName || selectedProduct.name
            : null,
        };
      }

      // Remove old items, add new
      const keep = mockBOMItems.filter((bi) => bi.bomId !== editId);
      mockBOMItems.length = 0;
      mockBOMItems.push(...keep);

      items.forEach((it) => {
        mockBOMItems.push({
          id: it.id,
          parentId: it.parentId,
          bomId: editId!,
          itemId: it.itemId,
          itemName: it.itemName,
          itemType: it.itemType,
          itemCode: it.itemCode,
          qtyPerUnit: it.qtyPerUnit,
          unit: it.unit,
          scrapPct: it.scrapPct,
          effectiveQty: it.qtyPerUnit * (1 + it.scrapPct / 100),
          standardCost: it.standardCost,
          totalCost:
            rolledUpCosts?.[it.id] ||
            it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
          level: it.level,
          hasSubBOM: it.hasSubBOM,
          subBOMId: it.subBOMId,
          isAlternate: false,
          alternateForId: null,
          notes: it.notes,
        });
      });

      // Update item bomId
      const itemIdx = mockItems.findIndex((m) => m.id === selectedProductId);
      if (itemIdx >= 0) {
        const savedTotal =
          rolledUpTotal > 0
            ? rolledUpTotal
            : items
                .filter((i) => i.level > 0)
                .reduce(
                  (s, it) =>
                    s +
                    it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
                  0,
                );
        mockItems[itemIdx] = {
          ...mockItems[itemIdx],
          bomId: editId!,
          bomVersion: version,
          standardCost: savedTotal,
        };
      }

      setSaving(false);
      toast.success('BOM updated successfully');
      navigate('/manufacturing/bom');
      return;
    }

    // Create new
    const newId = `bom-${Date.now()}`;
    mockBOMs.push({
      id: newId,
      code: bomCode,
      productId: selectedProductId,
      productName: selectedProduct?.name || '',
      productCode: selectedProduct?.code || '',
      version,
      status,
      effectiveFrom: effectiveFrom || null,
      effectiveTo: null,
      totalMaterialCost,
      totalItems: items.length,
      levels: maxLevel + 1,
      isVariantBOM: !!selectedProduct?.isVariant,
      parentBOMId:
        selectedProduct?.isVariant && selectedProduct.parentItemId
          ? mockItems.find((m) => m.id === selectedProduct.parentItemId)
              ?.bomId || null
          : null,
      variantName: selectedProduct?.isVariant
        ? selectedProduct.variantName || selectedProduct.name
        : null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    items.forEach((it) => {
      mockBOMItems.push({
        id: it.id,
        parentId: it.parentId,
        bomId: newId,
        itemId: it.itemId,
        itemName: it.itemName,
        itemType: it.itemType,
        itemCode: it.itemCode,
        qtyPerUnit: it.qtyPerUnit,
        unit: it.unit,
        scrapPct: it.scrapPct,
        effectiveQty: it.qtyPerUnit * (1 + it.scrapPct / 100),
        standardCost: it.standardCost,
        totalCost:
          rolledUpCosts?.[it.id] ||
          it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
        level: it.level,
        hasSubBOM: it.hasSubBOM,
        subBOMId: it.subBOMId,
        isAlternate: false,
        alternateForId: null,
        notes: it.notes,
      });
    });

    // Update item bomId
    const itemIdx = mockItems.findIndex((m) => m.id === selectedProductId);
    if (itemIdx >= 0) {
      const savedTotal =
        rolledUpTotal > 0
          ? rolledUpTotal
          : items
              .filter((i) => i.level > 0)
              .reduce(
                (s, it) =>
                  s + it.qtyPerUnit * (1 + it.scrapPct / 100) * it.standardCost,
                0,
              );
      mockItems[itemIdx] = {
        ...mockItems[itemIdx],
        bomId: newId,
        bomVersion: version,
        standardCost: savedTotal,
      };
    }

    setSaving(false);
    toast.success('BOM saved successfully');
    navigate('/manufacturing/bom');
  }, [
    selectedProductId,
    items,
    isEditing,
    editId,
    existingBOM,
    selectedProduct,
    bomCode,
    version,
    status,
    effectiveFrom,
    notes,
    maxLevel,
    toast,
    navigate,
  ]);

  // ── Render helpers ──
  const hasChildren = (itemId: string) =>
    items.some((i) => i.parentId === itemId);

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              {isEditing ? 'Edit BOM' : 'Create BOM'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEditing
                ? `Editing ${existingBOM?.code}`
                : selectedProduct
                  ? `for ${selectedProduct.isVariant && selectedProduct.variantName ? `${selectedProduct.variantName}` : selectedProduct.name}`
                  : 'Define a new Bill of Materials'}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setShowExplodeModal(true)}
                  className="h-9 px-3 rounded-lg border border-emerald-200 text-sm font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  title="Explode BOM"
                >
                  <i className="ri-node-tree" />
                  Explode
                </button>
                <button
                  onClick={() => setShowDuplicateConfirm(true)}
                  className="h-9 px-3 rounded-lg border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-50 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  title="Duplicate BOM"
                >
                  <i className="ri-file-copy-line" />
                  Duplicate
                </button>
              </>
            )}
            <button
              onClick={() => setShowPrintModal(true)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              title="Print BOM"
            >
              <i className="ri-printer-line" />
              Print
            </button>
            <button
              onClick={() => navigate('/manufacturing/bom')}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
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
                  <i className="ri-save-line" /> Save BOM
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inheritance Banner */}
        {showInheritanceBanner && (
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 shrink-0">
                <i className="ri-information-line text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800">
                  Inheritance Available
                </h3>
                <p className="text-xs text-blue-600 mt-0.5">
                  {selectedProduct?.variantName || selectedProduct?.name} can
                  inherit from:
                </p>
                <div className="mt-2 space-y-1">
                  {inheritanceOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-blue-700"
                    >
                      <i className="ri-arrow-right-line" />
                      <span>
                        {opt.name} BOM ({opt.code}) —{' '}
                        {
                          mockBOMItems.filter((bi) => bi.bomId === opt.bomId)
                            .length
                        }{' '}
                        components
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  {inheritanceOptions.slice(0, 1).map((opt) => (
                    <button
                      key={opt.bomId}
                      onClick={() => handleCopyFromSource(opt.bomId)}
                      className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-file-copy-line mr-1" />
                      Copy from {opt.name} BOM
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setInheritanceUsed(true);
                    }}
                    className="h-8 px-3 rounded-lg border border-blue-300 text-blue-700 text-xs font-medium hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                  >
                    Start from Scratch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {inheritanceUsed && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
            <i className="ri-check-line text-emerald-600" />
            <span className="text-sm text-emerald-700">
              BOM copied. Modify items as needed for this variant.
            </span>
          </div>
        )}

        {/* Header Fields */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Product + fields */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <div
                  className={`w-full min-h-[40px] px-3 py-2 text-sm border rounded-lg cursor-pointer flex items-center justify-between ${selectedProduct ? 'bg-white border-[#e2e8f0]' : 'bg-slate-50 border-[#e2e8f0] text-slate-400'}`}
                  onClick={() => {
                    if (!isEditing) setShowProductSearch(true);
                  }}
                >
                  <span className={selectedProduct ? 'text-[#1e293b]' : ''}>
                    {selectedProduct
                      ? selectedProduct.isVariant &&
                        selectedProduct.parentItemId
                        ? `${mockItems.find((m) => m.id === selectedProduct.parentItemId)?.name || ''} \u2192 ${selectedProduct.variantName || selectedProduct.name}`
                        : selectedProduct.name
                      : 'Search and select a product...'}
                  </span>
                  {!isEditing && (
                    <i className="ri-search-line text-slate-400" />
                  )}
                </div>
                {showProductSearch && !isEditing && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-[#e2e8f0]">
                      <input
                        autoFocus
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full h-9 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                    <div className="py-1">
                      {/* Parents with variants */}
                      {productDropdownData.parents.map((parent) => (
                        <div key={parent.id}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 uppercase tracking-wide">
                            {parent.name}
                          </div>
                          {productDropdownData.variants
                            .filter((v) => v.parentItemId === parent.id)
                            .map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => handleSelectProduct(variant.id)}
                                className="w-full px-6 py-2 text-left text-sm text-[#1e293b] hover:bg-indigo-50 cursor-pointer flex items-center gap-2"
                              >
                                <span className="text-slate-400">\u2514</span>
                                <span>
                                  {variant.variantName || variant.name}
                                </span>
                                <span className="text-xs text-slate-400 ml-auto">
                                  {variant.code}
                                </span>
                              </button>
                            ))}
                        </div>
                      ))}
                      {/* Regular items */}
                      {productDropdownData.regulars.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectProduct(item.id)}
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
                            No products found
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* BOM Code */}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  BOM Code
                </label>
                <input
                  type="text"
                  value={bomCode}
                  onChange={(e) => setBomCode(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Version */}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                />
                {otherVersions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-slate-400">
                      Other versions:
                    </span>
                    {otherVersions.map((ov) => (
                      <button
                        key={ov.id}
                        onClick={() =>
                          navigate(`/manufacturing/bom/${ov.id}/edit`)
                        }
                        className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        v{ov.version} ({ov.status})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Effective From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'ACTIVE' | 'DRAFT' | 'OBSOLETE')
                  }
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="OBSOLETE">Obsolete</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 resize-none"
                  placeholder="Optional notes about this BOM..."
                />
              </div>
            </div>

            {/* Right: Summary Card */}
            <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">
                BOM Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Product Type</span>
                  <span className="text-sm font-medium text-[#1e293b]">
                    {isVariantBOM ? 'Variant BOM' : 'Regular BOM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Components</span>
                  <span className="text-sm font-medium text-[#1e293b]">
                    {items.filter((i) => i.level > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Levels</span>
                  <span className="text-sm font-medium text-[#1e293b]">
                    {maxLevel + 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Material Cost</span>
                  <span className="text-sm font-semibold text-[#1e293b]">
                    {formatINR(costSummary.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-500">Link Status</span>
                  {isLinkedToItemMaster ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <i className="ri-check-line" />
                      Linked to Item Master
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowLinkConfirm(true)}
                      className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 cursor-pointer whitespace-nowrap"
                    >
                      Link to Item Master
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tree Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-5">
          <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b]">Components</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCostRollup}
                className="h-8 px-3 rounded-lg border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                title="Recalculate costs bottom-up"
              >
                <i className="ri-calculator-line" />
                Recalculate Cost
              </button>
              <button
                onClick={() => {
                  const root = items.find((i) => i.parentId === null);
                  openAddModal(root?.id || null);
                }}
                disabled={!selectedProduct}
                className="h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-[#4338ca] disabled:opacity-40 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <i className="ri-add-line" />
                Add Component
              </button>
            </div>
          </div>

          {items.length <= 1 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="ri-list-check-2 text-3xl mb-2 block" />
              <p className="text-sm">No components yet</p>
              <p className="text-xs mt-1">
                Add items or inherit from an existing BOM
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-80">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-24">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-16">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-20">
                      Scrap%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-24">
                      Eff.Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-28">
                      Cost/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-28">
                      Total Cost
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-12">
                      QC
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const effQty = item.qtyPerUnit * (1 + item.scrapPct / 100);
                    const childrenCount = items.filter(
                      (i) => i.parentId === item.id,
                    ).length;
                    const isExpanded = expandedRows.has(item.id);
                    const rolledUpCost = rolledUpCosts?.[item.id];
                    const totalCost =
                      rolledUpCost !== undefined && childrenCount > 0
                        ? rolledUpCost
                        : effQty * item.standardCost;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50"
                      >
                        {/* Item name with indent */}
                        <td className="px-4 py-2.5">
                          <div
                            className="flex items-center gap-1"
                            style={{ paddingLeft: item.level * 16 }}
                          >
                            {childrenCount > 0 && (
                              <button
                                onClick={() => toggleExpand(item.id)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer"
                              >
                                <i
                                  className={`ri-arrow-down-s-line text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                                />
                              </button>
                            )}
                            {childrenCount === 0 && <span className="w-5" />}
                            <span
                              className={`text-sm ${item.level === 0 ? 'font-semibold text-[#1e293b]' : 'text-[#1e293b]'}`}
                            >
                              {item.itemName}
                            </span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {item.itemCode}
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${typeBadgeClass(item.itemType)}`}
                          >
                            {typeLabel(item.itemType)}
                          </span>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.qtyPerUnit}
                            onChange={(e) =>
                              updateItemField(item.id, {
                                qtyPerUnit: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20 h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-md focus:outline-none focus:border-[#4f46e5] text-right"
                          />
                        </td>

                        {/* Unit */}
                        <td className="px-4 py-2.5 text-sm text-slate-600">
                          {item.unit}
                        </td>

                        {/* Scrap% */}
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.scrapPct}
                            onChange={(e) =>
                              updateItemField(item.id, {
                                scrapPct: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-md focus:outline-none focus:border-[#4f46e5] text-right"
                          />
                        </td>

                        {/* Eff.Qty */}
                        <td className="px-4 py-2.5 text-right text-sm text-slate-600">
                          {effQty.toFixed(3)}
                        </td>

                        {/* Cost/Unit */}
                        <td className="px-4 py-2.5 text-right text-sm text-slate-600">
                          {formatINR(item.standardCost)}
                        </td>

                        {/* Total Cost */}
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-[#1e293b]">
                          {formatINR(totalCost)}
                        </td>

                        {/* QC */}
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.qcRequired}
                            onChange={(e) =>
                              updateItemField(item.id, {
                                qcRequired: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {item.itemType === 'SEMI_FINISHED' && (
                              <button
                                onClick={() => openAddModal(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-[#4f46e5] cursor-pointer transition-colors"
                                title="Add sub-component"
                              >
                                <i className="ri-add-line text-sm" />
                              </button>
                            )}
                            {item.level > 0 && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                title="Delete row and children"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cost Summary Footer */}
        {items.length > 1 && (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {costSummary.raw > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Raw Materials</p>
                    <p className="text-sm font-semibold text-amber-700">
                      {formatINR(costSummary.raw)}
                    </p>
                  </div>
                )}
                {costSummary.semi > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Semi-Finished</p>
                    <p className="text-sm font-semibold text-yellow-700">
                      {formatINR(costSummary.semi)}
                    </p>
                  </div>
                )}
                {costSummary.consumable > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Consumables</p>
                    <p className="text-sm font-semibold text-sky-700">
                      {formatINR(costSummary.consumable)}
                    </p>
                  </div>
                )}
                {costSummary.packaging > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Packaging</p>
                    <p className="text-sm font-semibold text-slate-600">
                      {formatINR(costSummary.packaging)}
                    </p>
                  </div>
                )}
                <div className="w-px h-10 bg-[#e2e8f0]" />
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total Material Cost</p>
                  <p className="text-sm font-bold text-[#1e293b]">
                    {formatINR(costSummary.total)}
                  </p>
                </div>
                {costSummary.scrapCost > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Scrap Cost</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {formatINR(costSummary.scrapCost)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Click outside to close product search */}
        {showProductSearch && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProductSearch(false)}
          />
        )}

        {/* Add Component Modal */}
        <AddComponentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddModalParentId(null);
          }}
          onSelect={handleAddComponent}
          excludeItemIds={selectedProductId ? [selectedProductId] : []}
        />

        {/* Explosion Modal */}
        {existingBOM && (
          <BOMExplosionModal
            isOpen={showExplodeModal}
            onClose={() => setShowExplodeModal(false)}
            bom={existingBOM}
          />
        )}

        {/* Print Modal */}
        {existingBOM && (
          <BOMPrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            bom={existingBOM}
          />
        )}

        {/* Cost Confirm Dialog */}
        <ConfirmDialog
          open={showCostConfirm}
          title="Update Item Master"
          message={`Update standard cost on Item Master to ${formatINR(rolledUpTotal)}?`}
          variant="info"
          confirmLabel="Yes, Update"
          cancelLabel="No, BOM Only"
          onConfirm={handleLinkToItemMaster}
          onCancel={() => setShowCostConfirm(false)}
        />

        {/* Duplicate Confirm Dialog */}
        <ConfirmDialog
          open={showDuplicateConfirm}
          title="Duplicate BOM"
          message={`Create a new Draft version from this BOM? Version will be bumped to v${(() => {
            const [major, minor] = version.split('.').map(Number);
            return `${major}.${(minor || 0) + 1}`;
          })()}.`}
          variant="warning"
          confirmLabel="Duplicate"
          cancelLabel="Cancel"
          onConfirm={() => {
            setShowDuplicateConfirm(false);
            handleDuplicateFromForm();
          }}
          onCancel={() => setShowDuplicateConfirm(false)}
        />

        {/* Link Confirm Dialog */}
        <ConfirmDialog
          open={showLinkConfirm}
          title="Link to Item Master"
          message={`Link this BOM to ${selectedProduct?.name || 'the selected product'} and update standard cost?`}
          variant="info"
          confirmLabel="Link"
          cancelLabel="Cancel"
          onConfirm={handleLinkToItemMaster}
          onCancel={() => setShowLinkConfirm(false)}
        />
      </div>
    </AppLayout>
  );
}
