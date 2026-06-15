const api =
  import.meta.env.VITE_API_URL || 'http://localhost:7001';

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
}

/** What the API returns (snake_case, matches DB columns) */
export interface ItemResponse {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  category_id: string | null;
  category: string | null; // categoryName stored as `category`
  brand: string | null;
  hsn_code: string | null;
  gst_rate: string | number | null; // DB returns numeric as string sometimes
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

/**
 * DB returns snake_case + numeric fields as strings (Postgres numeric type).
 * This mapper normalises everything for the frontend.
 */
export function mapApiToItem(r: ItemResponse) {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? '',
    barcode: r.barcode ?? '',
    categoryId: r.category_id ?? '',
    categoryName: r.category ?? '', // DB column is `category`
    brand: r.brand ?? '',
    hsnCode: r.hsn_code ?? '',
    taxRate: parseFloat(String(r.gst_rate ?? 18)), // DB column is `gst_rate`
    unitId: r.primary_unit_id ?? '', // DB column is `primary_unit_id`
    unitName: r.unit_name ?? '',
    purchaseRate: parseFloat(String(r.purchase_rate ?? 0)),
    saleRate: parseFloat(String(r.sale_rate ?? 0)),
    mrp: parseFloat(String(r.mrp ?? 0)),
    minStockLevel: parseFloat(String(r.min_stock_level ?? 0)),
    articleNo: r.article_no ?? '',
    sizeColor: r.size_color ?? '',
    imageUrl: r.image_url ?? '',
    isActive: r.is_active,
    // stock comes from inventory table, not items — default 0
    stock: (r as unknown as { stock?: number }).stock ?? 0,
    warehouseId: r.warehouseid ?? '',
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

/**
 * DELETE /api/v1/item/:id
 * Controller does a SOFT DELETE (sets is_active = false)
 */
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

/**
 * GET /api/v1/item/filter?categoryName=Electronics&search=laptop&categoryId=uuid
 *
 * Matches the backend filterItems controller which reads from req.query.
 * All params are optional — omitting them returns all active items.
 */
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
  const url = `${BASE_URL}/item/filter${qs ? `?${qs}` : ''}`;
  console.log(
    'REQUEST URL:',
    `${BASE_URL}/item/filter${query.toString() ? `?${query.toString()}` : ''}`,
  );
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
