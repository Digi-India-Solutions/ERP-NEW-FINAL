// ─── Base ────────────────────────────────────────────────────────────────────
const api =
  import.meta.env.VITE_API_URL || 'http://localhost:7000';

const BASE = `${api}/api/v1/purchase-order`;

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface APIPOItem {
  id: string;
  itemId: string | null;
  itemName: string | null;
  hsnCode: string | null;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  unitName: string | null;
  rate: number;
  gstRate: number;
  amount: number;
  size: string | null;
  group: string | null;
  brand: string | null;
  articleNo: string | null;
}

export interface APIPO {
  id: string;
  poNumber: string;

  supplierId: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierStateCode?: string;

  warehouseId?: string;
  warehouseName?: string;

  createdBy?: { id: string; name: string };

  paymentTerms?: string;
  termsConditions?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  notes?: string;

  date: string;
  expectedDelivery: string | null;
  status: string;
  priority: string;

  totalAmount: number;

  itemCount?: number;
  totalOrderedQty?: number;
  totalReceivedQty?: number;

  isOverdue?: boolean;
  overdueDays?: number;

  createdAt: string;

  items?: APIPOItem[];
}

interface APIPORaw {
  id: string;
  poNumber: string;
  supplier?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    stateCode?: string;
  };
  warehouse?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  paymentTerms?: string;
  termsConditions?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  notes?: string;
  date: string;
  expectedDelivery: string | null;
  status: string;
  priority: string;
  totalAmount: number;
  itemCount?: number;
  totalOrderedQty?: number;
  totalReceivedQty?: number;
  isOverdue?: boolean;
  overdueDays?: number;
  createdAt: string;
  items?: APIPOItem[];
}

function normalizePO(po: APIPORaw): APIPO {
  return {
    ...po,
    supplierId: po.supplier?.id ?? '',
    supplierName: po.supplier?.name,
    supplierPhone: po.supplier?.phone,
    supplierEmail: po.supplier?.email,
    supplierStateCode: po.supplier?.stateCode,
    warehouseId: po.warehouse?.id,
    warehouseName: po.warehouse?.name,
  };
}

export interface POStats {
  total: number;
  pending: number;
  partial: number;
  completed: number;
  overdue: number;
}

// ─── Item payload shared by CREATE and UPDATE ─────────────────────────────────
export interface POItemPayload {
  itemId?: string;
  itemName: string;
  hsnCode?: string;
  orderedQty: number;
  receivedQty: number;
  unit?: string;
  rate: number;
  gstRate?: number;
  size?: string;
  group?: string;
  brand?: string;
  articleNo?: string;
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export interface CreatePOPayload {
  supplierId: string;
  warehouseId?: string;
  date: string;
  expectedDelivery?: string;
  priority: string;
  billingAddress?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  termsConditions?: string;
  notes?: string;
  totalAmount?: number;
  items: POItemPayload[];
}

export async function apiCreatePO(
  payload: CreatePOPayload,
): Promise<{ success: boolean; message: string; data?: APIPO }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export interface UpdatePOPayload {
  supplierId: string;
  warehouseId?: string;
  date: string;
  expectedDelivery?: string;
  priority: string;
  billingAddress?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  termsConditions?: string;
  notes?: string;
  items: POItemPayload[];
}

export async function apiUpdatePO(
  id: string,
  payload: UpdatePOPayload,
): Promise<{
  success: boolean;
  message: string;
  data?: { totalAmount: number; items: APIPOItem[] };
}> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function apiDeletePO(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

// ─── GET ALL ─────────────────────────────────────────────────────────────────
export interface GetAllPOParams {
  search?: string;
  status?: string;
  supplier_id?: string;
  warehouse_id?: string;
  from_date?: string;
  to_date?: string;
}

export async function apiGetAllPOs(
  params: GetAllPOParams = {},
): Promise<{ success: boolean; data: APIPO[] }> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status && params.status !== 'ALL') qs.set('status', params.status);
  if (params.supplier_id) qs.set('supplier_id', params.supplier_id);
  if (params.warehouse_id) qs.set('warehouse_id', params.warehouse_id);
  if (params.from_date) qs.set('from_date', params.from_date);
  if (params.to_date) qs.set('to_date', params.to_date);

  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return { ...json, data: json.data.map(normalizePO) };
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export async function apiGetPOById(
  id: string,
): Promise<{ success: boolean; data: APIPO }> {
  const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
  const json = await res.json();
  return { ...json, data: normalizePO(json.data) };
}

// ─── GET STATS ────────────────────────────────────────────────────────────────
export async function apiGetPOStats(): Promise<{
  success: boolean;
  data: POStats;
}> {
  const res = await fetch(`${BASE}/stats`, { headers: authHeaders() });
  return res.json();
}

// ─── CANCEL ───────────────────────────────────────────────────────────────────
export async function apiCancelPO(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE}/cancel/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  return res.json();
}

// ─── Item search ──────────────────────────────────────────────────────────────
export async function getItemsBySupplier(search: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${api}/api/v1/item/filter?search=${encodeURIComponent(search)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}
