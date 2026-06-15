const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const BASE_URL = `${api}/api/v1`;

import { getData } from '../services/FetchNodeServices.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** What we send to the API (camelCase, matches controller destructuring) */
export interface ItemPayload {
  name: string;
  code?: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  hsnCode?: string;
  taxRate?: number;
  unitId?: string;
  unitName?: string;
  purchaseRate?: number;
  saleRate?: number;
  mrp?: number;
  minStockLevel?: number;
  articleNo?: string;
  sizeColor?: string;
  imageUrl?: string;
  isActive?: boolean;
  warehouseId: string;
  // ✅ Manufacturing
  itemType?: string;
  itemGroup?: string;
  drawingNumber?: string;
  specifications?: string;
  productionUnit?: string;
  standardCost?: number;
  supplierLeadTime?: number;
  reorderPoint?: number;
  reorderQty?: number;
  // ✅ Tracking
  enableVariants?: boolean;
  enableBatchTracking?: boolean;
  enableSerialTracking?: boolean;
  requiresIncomingQC?: boolean;
  requiresFinalQC?: boolean;
  hasExpiryDate?: boolean;
}

/** What the API returns (snake_case, matches DB columns) */
export interface ItemResponse {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  category_id: string | null;
  category: string | null;
  brand: string | null;
  hsn_code: string | null;
  gst_rate: string | number | null;
  primary_unit_id: string | null;
  purchase_rate: string | number | null;
  sale_rate: string | number | null;
  unit_name: string | null;
  mrp: string | number | null;
  min_stock_level: string | number | null;
  article_no: string | null;
  size_color: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  warehouseid: string;
  bom_id?: string | null; // ✅ ADD THIS
  bom_version?: string | null; // ✅ ADD THIS
  is_bom_linked?: boolean; // ✅ ADD THIS
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface FilterItemsParams {
  categoryId?: string;
  categoryName?: string;
  search?: string;
  warehouseId?: string;
  stockStatus?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isActive?: 'ALL' | 'true' | 'false';
  hasExpiryDate?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Auth helper ──────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }
  return data as ApiResponse<T>;
}

// ─── Mapper: API response → local ItemFormData shape ─────────────────────────

export function mapApiToItem(r: any) {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? '',
    barcode: r.barcode ?? '',
    categoryId: r.categoryId ?? r.category_id ?? '',
    categoryName: r.categoryName ?? r.category ?? '',
    brand: r.brand ?? '',
    hsnCode: r.hsnCode ?? r.hsn_code ?? '',
    taxRate: parseFloat(String(r.taxRate ?? r.gst_rate ?? 18)),
    unitId: r.unitId ?? r.primary_unit_id ?? '',
    unitName: r.unitName ?? r.unit_name ?? '',
    purchaseRate: parseFloat(String(r.purchaseRate ?? r.purchase_rate ?? 0)),
    saleRate: parseFloat(String(r.saleRate ?? r.sale_rate ?? 0)),
    mrp: parseFloat(String(r.mrp ?? 0)),
    minStockLevel: parseFloat(
      String(r.minStockLevel ?? r.min_stock_level ?? 0),
    ),
    articleNo: r.articleNo ?? r.article_no ?? '',
    sizeColor: r.sizeColor ?? r.size_color ?? '',
    imageUrl: r.imageUrl ?? r.image_url ?? '',
    isActive: r.isActive ?? r.is_active,
    stock: r.stock ?? 0,
    warehouseId: r.warehouseId ?? r.warehouseid ?? '',
    // ✅ Manufacturing fields
    itemType: r.itemType ?? r.item_type ?? 'Raw Material',
    itemGroup: r.itemGroup ?? r.item_group ?? '',
    drawingNumber: r.drawingNumber ?? r.drawing_number ?? '',
    specifications: r.specifications ?? '',
    productionUnit: r.productionUnit ?? r.production_unit ?? '',
    standardCost: parseFloat(String(r.standardCost ?? r.standard_cost ?? 0)),
    supplierLeadTime: parseInt(
      String(r.supplierLeadTime ?? r.supplier_lead_time ?? 0),
    ),
    reorderPoint: parseInt(String(r.reorderPoint ?? r.reorder_point ?? 0)),
    reorderQty: parseInt(String(r.reorderQty ?? r.reorder_qty ?? 0)),
    // ✅ Tracking fields
    enableVariants: r.enableVariants ?? r.enable_variants ?? false,
    enableBatchTracking:
      r.enableBatchTracking ?? r.enable_batch_tracking ?? false,
    enableSerialTracking:
      r.enableSerialTracking ?? r.enable_serial_tracking ?? false,
    requiresIncomingQC: r.requiresIncomingQC ?? r.requires_incoming_qc ?? false,
    requiresFinalQC: r.requiresFinalQC ?? r.requires_final_qc ?? false,
    hasExpiryDate: r.hasExpiryDate ?? r.has_expiry_date ?? false,
    bomId: r.bom_id ?? r.bomId ?? null,
    bomVersion: r.bom_version ?? r.bomVersion ?? null,
    isBomLinked: !!r.bom_id,
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** POST /api/v1/item */
export async function createItem(
  payload: ItemPayload,
): Promise<ApiResponse<ItemResponse>> {
  const res = await fetch(`${BASE_URL}/item`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ItemResponse>(res);
}

/** PUT /api/v1/item/:id */
export async function updateItem(
  id: string,
  payload: Partial<ItemPayload>,
): Promise<ApiResponse<ItemResponse>> {
  const res = await fetch(`${BASE_URL}/item/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ItemResponse>(res);
}

/** DELETE /api/v1/item/:id (Soft delete) */
export async function deleteItem(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/item/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<null>(res);
}

/** GET /api/v1/item — returns only is_active = true items */
export async function getAllItems(): Promise<ApiResponse<ItemResponse[]>> {
  const res = await fetch(`${BASE_URL}/item`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<ItemResponse[]>(res);
}

/** GET /api/v1/item/filter */
export async function filterItems(
  params: FilterItemsParams,
): Promise<ApiResponse<ItemResponse[]>> {
  console.log('FILTER PARAMS:', params);
  const query = new URLSearchParams();

  if (params.categoryId && params.categoryId !== 'ALL') {
    query.set('categoryId', params.categoryId);
  }
  if (params.categoryName && params.categoryName !== 'ALL') {
    query.set('categoryName', params.categoryName);
  }
  if (params.search) {
    query.set('search', params.search);
  }
  if (params.stockStatus && params.stockStatus !== 'ALL') {
    query.set('stockStatus', params.stockStatus);
  }
  if (params.isActive && params.isActive !== 'ALL') {
    query.set('isActive', params.isActive);
  }
  if (
    params.warehouseId &&
    params.warehouseId !== 'ALL' &&
    UUID_RE.test(params.warehouseId)
  ) {
    query.set('warehouseId', params.warehouseId);
  }

  const qs = query.toString();
  const url = `${BASE_URL}/item${qs ? `?${qs}` : ''}`;
  console.log('REQUEST URL:', url);
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<ItemResponse[]>(res);
}

export async function searchItemByBarcode(barcode: string) {
  const res = await fetch(`${BASE_URL}/item?search=${barcode}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await handleResponse<ItemResponse[]>(res);

  return data.data?.[0] || null;
}

// ============================================
// BOM DROPDOWN - GROUPED ITEMS WITH VARIANTS
// ============================================

export interface BOMDropdownVariant {
  id: string;
  name: string;
  code: string;
  type: 'variant';
  parent_item_id: string;
  parent_item_name: string;
  variant_name: string;
  variant_sku: string | null;
  purchase_rate: number;
  sale_rate: number;
  unit_name: string | null;
  bom_id: string | null; // ✅ ADD THIS
  bom_version: string | null; // ✅ ADD THIS
}

export interface BOMDropdownGroup {
  id: string;
  name: string;
  code: string;
  type: 'item';
  category: string | null;
  unit_name: string | null;
  purchase_rate: number;
  sale_rate: number;
  variants: BOMDropdownVariant[];
  bom_id: string | null; // ✅ ADD THIS
  bom_version: string | null;
}

export async function getItemsWithVariantsForBOM(): Promise<
  BOMDropdownGroup[]
> {
  const res = await fetch(`${BASE_URL}/item/bom-dropdown`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<BOMDropdownGroup[]>(res);
  return data.data || [];
}
