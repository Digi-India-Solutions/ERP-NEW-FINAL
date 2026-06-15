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
import { formatINR } from '@/utils/format';
import AddComponentModal from './components/AddComponentModal';
import BOMExplosionModal from './components/BOMExplosionModal';
import BOMPrintModal from './components/BOMPrintModal';
import axios from 'axios';
import { useWarehouseStore } from '@/stores/warehouseStore';
import {
  getItemsWithVariantsForBOM,
  type ItemResponse,
  type BOMDropdownGroup,
  BOMDropdownVariant,
} from '../../../api/item.api';

// ============================================
// TYPES
// ============================================
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

// ============================================
// API SERVICE
// ============================================
const API_BASE = 'http://localhost:7000/api';
const BOM_API_BASE = `${API_BASE}/v1/manufacturing/bom`;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

const bomAPI = {
  create: async (data: any) => {
    const response = await axios.post(BOM_API_BASE, data, getAuthHeaders());
    return response.data;
  },
  getById: async (id: string) => {
    const response = await axios.get(`${BOM_API_BASE}/${id}`, getAuthHeaders());
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await axios.put(
      `${BOM_API_BASE}/${id}`,
      data,
      getAuthHeaders(),
    );
    return response.data;
  },
  duplicate: async (id: string) => {
    const response = await axios.post(
      `${BOM_API_BASE}/${id}/duplicate`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  },
  linkToItemMaster: async (id: string) => {
    const response = await axios.post(
      `${BOM_API_BASE}/${id}/link`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function getDescendantIds(items: FormBOMItem[], parentId: string): string[] {
  const result: string[] = [];
  const direct = items.filter((i) => i.parentId === parentId);
  direct.forEach((child) => {
    result.push(child.id);
    result.push(...getDescendantIds(items, child.id));
  });
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

// ============================================
// MAIN COMPONENT
// ============================================
export default function BOMForm() {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = !!editId;

  // ✅ Global warehouse store
  const { selectedWarehouseId, selectedWarehouseName } = useWarehouseStore();

  // ✅ Dynamic data states
  const [itemsList, setItemsList] = useState<BOMDropdownGroup[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [linkToItemMaster, setLinkToItemMaster] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedProduct, setSelectedProduct] = useState<ItemResponse | null>(
    null,
  );
  const [bomCode, setBomCode] = useState('');
  const [version, setVersion] = useState('1.0');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'OBSOLUTE'>(
    'DRAFT',
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormBOMItem[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rolledUpCosts, setRolledUpCosts] = useState<Record<string, number>>();
  const [rolledUpTotal, setRolledUpTotal] = useState(0);

  // UI state
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalParentId, setAddModalParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCostConfirm, setShowCostConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showExplodeModal, setShowExplodeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ============================================
  // FETCH ITEMS + VARIANTS FOR BOM DROPDOWN
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

  // ============================================
  // FETCH EXISTING BOM (if editing)
  // ============================================
  // ============================================
  // FETCH EXISTING BOM (if editing)
  // ============================================
  useEffect(() => {
    if (isEditing && editId) {
      const loadBom = async () => {
        try {
          setInitialLoading(true);
          const response = await bomAPI.getById(editId);
          if (response.success && response.data) {
            const bom = response.data;

            // ✅ Set product details
            setSelectedProductId(bom.product_id);
            const product = itemsList.find((i) => i.id === bom.product_id);
            setSelectedProduct(product || null);
            setBomCode(bom.code);
            setVersion(bom.version);
            setLinkToItemMaster(bom.link_to_item_master || false);
            setEffectiveFrom(
              new Date(bom.effective_from).toISOString().split('T')[0],
            );
            setStatus(bom.status);
            setNotes(bom.notes || '');

            // ✅ CREATE ROOT ITEM (product itself)
            const rootId = crypto.randomUUID();
            const rootItem: FormBOMItem = {
              id: rootId,
              parentId: null,
              itemId: bom.product_id,
              itemName: bom.product_name,
              itemCode: bom.product_code || '',
              itemType: 'FINISHED_GOOD',
              qtyPerUnit: 1,
              unit: product?.unit_name || 'Pcs',
              scrapPct: 0,
              standardCost: parseFloat(String(bom.total_material_cost || 0)),
              level: 0,
              hasSubBOM: false,
              subBOMId: null,
              qcRequired: false,
              notes: null,
            };

            // ✅ FORMAT COMPONENTS (level > 0)
            let formattedComponents: FormBOMItem[] = [];
            if (bom.items && bom.items.length > 0) {
              formattedComponents = bom.items.map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                parentId: item.parent_id || rootId,
                itemId: item.item_id,
                itemName: item.item_name,
                itemCode: item.item_code || '',
                itemType: item.item_type || 'RAW_MATERIAL',
                qtyPerUnit: parseFloat(item.quantity) || 1,
                unit: item.unit_of_measure || item.unit_name || 'Pcs',
                scrapPct: parseFloat(item.scrap_percentage) || 0,
                standardCost: parseFloat(item.unit_price) || 0,
                level: item.level || 1,
                hasSubBOM: item.has_sub_bom || false,
                subBOMId: item.sub_bom_id || null,
                qcRequired: item.qc_required || false,
                notes: item.notes || null,
              }));
            }

            // ✅ SET ITEMS = ROOT + COMPONENTS
            setItems([rootItem, ...formattedComponents]);
            setExpandedRows(
              new Set([rootId, ...formattedComponents.map((i) => i.id)]),
            );
          }
        } catch (error) {
          console.error('Failed to load BOM:', error);
          toast.error('Failed to load BOM data');
        } finally {
          setInitialLoading(false);
        }
      };
      loadBom();
    }
  }, [isEditing, editId, itemsList, toast]);

  // ============================================
  // DERIVED VALUES
  // ============================================
  const displayItems = useMemo(
    () => items.filter((item) => item.level > 0),
    [items],
  );

  const maxLevel = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.level)) : 0),
    [items],
  );

  const costSummary = useMemo(() => {
    const components = items.filter((i) => i.level > 0);
    let raw = 0,
      semi = 0,
      consumable = 0,
      packaging = 0,
      scrapCost = 0;

    components.forEach((i) => {
      const baseCost = i.qtyPerUnit * i.standardCost;
      const scrapAmount = baseCost * (i.scrapPct / 100);
      const totalWithScrap = baseCost + scrapAmount;
      scrapCost += scrapAmount;

      if (i.itemType === 'RAW_MATERIAL') raw += totalWithScrap;
      else if (i.itemType === 'SEMI_FINISHED') semi += totalWithScrap;
      else if (i.itemType === 'CONSUMABLE') consumable += totalWithScrap;
      else if (i.itemType === 'PACKAGING') packaging += totalWithScrap;
    });

    const baseTotal = raw + semi + consumable + packaging;
    const total = rolledUpTotal > 0 ? rolledUpTotal : baseTotal;
    return { raw, semi, consumable, packaging, total, scrapCost };
  }, [items, rolledUpTotal]);

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
    return filtered;
  }, [itemsList, productSearchQuery]);

  const availableComponents = useMemo(() => {
    const allComponents: BOMDropdownGroup[] = [];
    itemsList.forEach((group) => {
      if (group.category !== 'FINISHED_GOOD') allComponents.push(group);
    });
    return allComponents;
  }, [itemsList]);

  // ============================================
  // HANDLERS
  // ============================================

const handleSelectProduct = useCallback(
  (productId: string, selectedItem?: BOMDropdownGroup | BOMDropdownVariant) => {
    let product = selectedItem || itemsList.find((m) => m.id === productId);
    if (!product) return;

    setSelectedProductId(productId);

    let productName = product.name;
    let productCode = product.code;
    let productCategory = 'FINISHED_GOOD';
    let productPurchaseRate = product.purchase_rate;
    let productUnitName = product.unit_name;

    if ('variant_name' in product && product.variant_name) {
      productName = `${product.parent_item_name} - ${product.variant_name}`;
      productCategory = 'FINISHED_GOOD';
    } else if ('category' in product) {
      productCategory = product.category || 'FINISHED_GOOD';
    }

    setSelectedProduct({
      id: product.id,
      name: productName,
      code: productCode,
      category: productCategory,
      purchase_rate: productPurchaseRate,
      unit_name: productUnitName,
    } as ItemResponse);

    setShowProductSearch(false);
    setProductSearchQuery('');

    const rootId = crypto.randomUUID();
    const rootItem: FormBOMItem = {
      id: rootId,
      parentId: null,
      itemId: product.id,
      itemName: productName,
      itemCode: productCode || '',
      itemType: productCategory,
      qtyPerUnit: 1,
      unit: productUnitName || 'Pcs',
      scrapPct: 0,
      standardCost: parseFloat(String(productPurchaseRate || 0)),
      level: 0,
      hasSubBOM: false,
      subBOMId: null,
      qcRequired: false,
      notes: null,
    };
    setItems([rootItem]);
    setExpandedRows(new Set([rootId]));

    // ✅ Generate BOM Code with product code
    const cleanCode = productCode
      ? productCode.replace(/[^A-Za-z0-9]/g, '')
      : 'ITEM';
    setBomCode(`BOM-${cleanCode}-001`);
    setVersion('1.0');
  },
  [itemsList],
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
    (selectedItem: BOMDropdownGroup | BOMDropdownVariant) => {
      const parentId = addModalParentId;
      const parent = items.find((i) => i.id === parentId);
      const level = parent ? parent.level + 1 : 0;

      let itemType = 'RAW_MATERIAL';
      let itemName = selectedItem.name;

      if ('variant_name' in selectedItem && selectedItem.variant_name) {
        itemType = 'RAW_MATERIAL';
        itemName = `${selectedItem.parent_item_name} - ${selectedItem.variant_name}`;
      } else if ('category' in selectedItem) {
        itemType =
          selectedItem.category === 'SEMI_FINISHED'
            ? 'SEMI_FINISHED'
            : 'RAW_MATERIAL';
      }

      const newItem: FormBOMItem = {
        id: crypto.randomUUID(),
        parentId: parentId || null,
        itemId: selectedItem.id,
        itemName: itemName,
        itemCode: selectedItem.code || '',
        itemType: itemType,
        qtyPerUnit: 1,
        unit: selectedItem.unit_name || 'Pcs',
        scrapPct: 0,
        standardCost: parseFloat(String(selectedItem.purchase_rate || 0)),
        level,
        hasSubBOM: false,
        subBOMId: null,
        qcRequired: false,
        notes: null,
      };
      setItems((prev) => [...prev, newItem]);
      if (parentId) setExpandedRows((prev) => new Set([...prev, parentId]));
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
    toast.success(`Cost rollup complete: ${formatINR(newTotal)}`);
    setShowCostConfirm(true);
  }, [items, toast]);

  const handleSave = useCallback(async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!selectedWarehouseId) {
      toast.error('Please select a warehouse from the top bar');
      return;
    }
    if (items.filter((i) => i.level > 0).length === 0) {
      toast.error('Add at least one component');
      return;
    }

    setSaving(true);
    try {
      const apiItems = items
        .filter((it) => it.level > 0)
        .map((it, index) => ({
          itemId: it.itemId,
          quantity: it.qtyPerUnit,
          scrapPercentage: it.scrapPct,
          sequenceNo: index + 1,
        }));

      const bomData = {
        code: bomCode,
        productId: selectedProductId,
        version: version,
        effectiveFrom: effectiveFrom,
        effectiveTo: null,
        isVariantBom: false,
        variantName: undefined,
        warehouseId: selectedWarehouseId,
        linkToItemMaster: linkToItemMaster,
        items: apiItems,
      };

      let response;
      if (isEditing && editId) {
        response = await bomAPI.update(editId, {
          version,
          status,
          effectiveFrom,
          effectiveTo: null,
          items: apiItems,
          warehouseId: selectedWarehouseId,
          linkToItemMaster: linkToItemMaster,
        });
      } else {
        response = await bomAPI.create(bomData);
      }

      if (response.success) {
        toast.success(
          isEditing ? 'BOM updated successfully' : 'BOM created successfully',
        );
        navigate('/manufacturing/bom-list');
      } else {
        toast.error(response.message || 'Failed to save BOM');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save BOM');
    } finally {
      setSaving(false);
    }
  }, [
    selectedProductId,
    selectedWarehouseId,
    items,
    isEditing,
    editId,
    bomCode,
    version,
    effectiveFrom,
    status,
    linkToItemMaster,
    toast,
    navigate,
  ]);

  // ============================================
  // RENDER
  // ============================================

  if (initialLoading || loadingItems) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-indigo-600 animate-spin" />
            <p className="mt-2 text-slate-500">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
              {selectedProduct
                ? `for ${selectedProduct.name}`
                : 'Define a new Bill of Materials'}
            </p>
            {selectedWarehouseName && (
              <p className="text-xs text-slate-400 mt-1">
                <i className="ri-building-line mr-1" /> Warehouse:{' '}
                {selectedWarehouseName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setShowExplodeModal(true)}
                  className="h-9 px-3 rounded-lg border border-emerald-200 text-sm font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-node-tree" /> Explode
                </button>
                <button
                  onClick={() => setShowDuplicateConfirm(true)}
                  className="h-9 px-3 rounded-lg border border-amber-200 text-sm font-medium text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-file-copy-line" /> Duplicate
                </button>
              </>
            )}
            <button
              onClick={() => setShowPrintModal(true)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-printer-line" /> Print
            </button>
            <button
              onClick={() => navigate('/manufacturing/bom')}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] disabled:opacity-60 cursor-pointer flex items-center gap-2"
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

        {/* Form Fields */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Selection */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <div
                  className={`w-full min-h-[40px] px-3 py-2 text-sm border rounded-lg cursor-pointer flex items-center justify-between ${selectedProduct ? 'bg-white border-[#e2e8f0]' : 'bg-slate-50 border-[#e2e8f0] text-slate-400'}`}
                  onClick={() => !isEditing && setShowProductSearch(true)}
                >
                  <span>
                    {selectedProduct
                      ? selectedProduct.name
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
                      {productDropdownData.map((group) => (
                        <div key={group.id}>
                          <button
                            onClick={() => handleSelectProduct(group.id, group)}
                            className="w-full px-3 py-2 text-left text-sm font-semibold text-[#1e293b] hover:bg-indigo-50 cursor-pointer flex items-center justify-between"
                          >
                            <span>{group.name}</span>
                            <span className="text-xs text-slate-400">
                              {group.code}
                            </span>
                          </button>
                          {group.variants.length > 0 && (
                            <div className="ml-6 border-l border-slate-200 pl-2">
                              {group.variants.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() =>
                                    handleSelectProduct(variant.id, variant)
                                  }
                                  className="w-full px-3 py-1.5 text-left text-sm text-[#64748b] hover:bg-indigo-50 cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-1">
                                    <i className="ri-subtract-line text-xs text-slate-400" />
                                    <span>{variant.name}</span>
                                  </div>
                                  <span className="text-xs text-slate-400">
                                    {variant.code}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {productDropdownData.length === 0 && (
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
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
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
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
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
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] cursor-pointer"
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
                  className="w-full px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">
                BOM Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Warehouse</span>
                  <span className="text-sm font-medium text-[#1e293b]">
                    {selectedWarehouseName || 'Not selected'}
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

                <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                  <span className="text-sm text-slate-500">Link Status</span>
                  {linkToItemMaster ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <i className="ri-link-m" /> Linked
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowLinkConfirm(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Link to Item Master
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Components Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-5">
          <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b]">Components</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCostRollup}
                className="h-8 px-3 rounded-lg border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-calculator-line" /> Recalculate Cost
              </button>
              <button
                onClick={() =>
                  openAddModal(
                    items.find((i) => i.parentId === null)?.id || null,
                  )
                }
                disabled={!selectedProduct}
                className="h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-[#4338ca] disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-add-line" /> Add Component
              </button>
            </div>
          </div>

          {items.length <= 1 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="ri-list-check-2 text-3xl mb-2 block" />
              <p className="text-sm">No components yet</p>
              <p className="text-xs mt-1">Add components to create this BOM</p>
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
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${typeBadgeClass(item.itemType)}`}
                          >
                            {typeLabel(item.itemType)}
                          </span>
                        </td>
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
                        <td className="px-4 py-2.5 text-sm text-slate-600">
                          {item.unit}
                        </td>
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
                        <td className="px-4 py-2.5 text-right text-sm text-slate-600">
                          {effQty.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-600">
                          {formatINR(item.standardCost)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-[#1e293b]">
                          {formatINR(totalCost)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {item.itemType === 'SEMI_FINISHED' && (
                              <button
                                onClick={() => openAddModal(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-[#4f46e5] cursor-pointer"
                              >
                                <i className="ri-add-line text-sm" />
                              </button>
                            )}
                            {item.level > 0 && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"
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

        {/* COST SUMMARY - SIRF 3 LINES */}
        {displayItems.length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-[#e2e8f0] space-y-2">
            {costSummary.packaging > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Packaging:</span>
                <span className="text-sm font-medium text-[#4f46e5]">
                  {formatINR(costSummary.packaging)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-semibold text-[#1e293b]">
                Total Material Cost:
              </span>
              <span className="text-sm font-bold text-[#1e293b]">
                {formatINR(costSummary.total)}
              </span>
            </div>
            {costSummary.scrapCost > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-600">Scrap Cost:</span>
                <span className="text-sm font-medium text-amber-600">
                  {formatINR(costSummary.scrapCost)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Click outside to close product search */}
        {showProductSearch && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProductSearch(false)}
          />
        )}

        {/* Modals */}
        <AddComponentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddModalParentId(null);
          }}
          onSelect={handleAddComponent}
          excludeItemIds={selectedProductId ? [selectedProductId] : []}
          items={availableComponents}
        />

        {showExplodeModal && editId && (
          <BOMExplosionModal
            isOpen={showExplodeModal}
            onClose={() => setShowExplodeModal(false)}
            bomId={editId}
          />
        )}

        {showPrintModal && editId && (
          <BOMPrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            bomId={editId}
          />
        )}

        {/* Link to Item Master Confirmation Dialog */}
        <ConfirmDialog
          open={showLinkConfirm}
          title="Link to Item Master"
          message={`Link this BOM to ${selectedProduct?.name || 'product'} and update standard cost?`}
          variant="warning"
          confirmLabel="Link"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              if (isEditing && editId) {
                await bomAPI.linkToItemMaster(editId);
                setLinkToItemMaster(true);
                toast.success(`BOM linked to ${selectedProduct?.name}`);
              } else {
                setLinkToItemMaster(true);
                toast.info(`Will be linked when BOM is saved`);
              }
            } catch (error) {
              toast.error('Failed to link BOM');
            }
            setShowLinkConfirm(false);
          }}
          onCancel={() => setShowLinkConfirm(false)}
        />

        {/* Cost Confirm Dialog */}
        <ConfirmDialog
          open={showCostConfirm}
          title="Cost Rollup"
          message={`Total calculated cost: ${formatINR(rolledUpTotal)}`}
          variant="info"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() => setShowCostConfirm(false)}
          onCancel={() => setShowCostConfirm(false)}
        />

        {/* Duplicate Confirm Dialog */}
        <ConfirmDialog
          open={showDuplicateConfirm}
          title="Duplicate BOM"
          message="Create a new draft version from this BOM?"
          variant="warning"
          confirmLabel="Duplicate"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              if (editId) {
                const response = await bomAPI.duplicate(editId);
                if (response.success) {
                  toast.success('BOM duplicated successfully');
                  navigate(`/manufacturing/bom/${response.data.id}/edit`);
                }
              }
            } catch (error) {
              toast.error('Failed to duplicate BOM');
            }
            setShowDuplicateConfirm(false);
          }}
          onCancel={() => setShowDuplicateConfirm(false)}
        />
      </div>
    </AppLayout>
  );
}
