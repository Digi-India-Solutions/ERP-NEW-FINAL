const api =
  import.meta.env.VITE_API_URL || 'https://asvapi.digiindiasolutions.com';
const BASE_URL = `${api}/api/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartyResponse {
  id: string;
  name: string;
  type: 'Customer' | 'Supplier' | 'Both';
  gstin?: string;
  pan?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  city?: string;
  billing_address?: string;
  shipping_address?: string;
  warehouse_id?: string; // ← YE ADD KARO
  warehouse_name?: string;
  state_code?: string;
  state_name?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
  is_active?: boolean;
  billingAddress?: string;
  shippingAddress?: string;
  stateCode?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
  balance?: number;
  isActive?: boolean;
}

export interface PartyPayload {
  name: string;
  type: 'Customer' | 'Supplier' | 'Both';
  isRegistered?: boolean;
  gstin?: string;
  pan?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  city?: string;
  billingAddress?: string;
  // ✅ ADD THESE LINES
  warehouseId?: string;
  warehouseName?: string;
  shippingAddress?: string;
  stateCode?: string;
  stateName?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface FilterPartiesParams {
  type?: 'Customer' | 'Supplier' | 'Both' | 'customer' | 'supplier' | 'both';
  search?: string;
  isActive?: boolean;
  warehouse_id?: string;
}

// ─── Database mapping ────────────────────────────────────────────────────────

export function fromDBType(dbType: string): 'customer' | 'supplier' | 'both' {
  const typeMap: Record<string, 'customer' | 'supplier' | 'both'> = {
    Customer: 'customer',
    Supplier: 'supplier',
    Both: 'both',
    customer: 'customer',
    supplier: 'supplier',
    both: 'both',
  };
  return typeMap[dbType] || 'both';
}

function toDBType(type: string): 'Customer' | 'Supplier' | 'Both' {
  const value = String(type || '')
    .trim()
    .toLowerCase();
  if (value === 'customer') return 'Customer';
  if (value === 'supplier') return 'Supplier';
  return 'Both';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Add to PartyPayload interface

// Update mapPartyPayload to handle warehouse fields properly
function mapPartyPayload(
  payload: Partial<PartyPayload>,
): Record<string, unknown> {
  console.log('🔍 Input Payload:', payload);
  console.log('🔍 Has warehouseId?', 'warehouseId' in payload);
  console.log('🔍 warehouseId value:', payload.warehouseId);
  const mapped: Record<string, unknown> = {};

  if (payload.name !== undefined) mapped.name = payload.name;
  if (payload.type !== undefined) mapped.type = toDBType(payload.type);
  if (payload.isRegistered !== undefined)
    mapped.isRegistered = payload.isRegistered;
  if (payload.gstin !== undefined) mapped.gstin = payload.gstin;
  if (payload.pan !== undefined) mapped.pan = payload.pan;
  if (payload.mobile !== undefined) mapped.mobile = payload.mobile;
  if (payload.phone !== undefined) mapped.phone = payload.phone;
  if (payload.email !== undefined) mapped.email = payload.email;
  if (payload.city !== undefined) mapped.city = payload.city;
  if (payload.billingAddress !== undefined)
    mapped.billingAddress = payload.billingAddress;
  if (payload.shippingAddress !== undefined)
    mapped.shippingAddress = payload.shippingAddress;
  if (payload.stateCode !== undefined) mapped.stateCode = payload.stateCode;
  if (payload.stateName !== undefined) mapped.stateName = payload.stateName;

  // ✅ EXPLICITLY ADD WAREHOUSE FIELDS
  if (payload.warehouseId !== undefined)
    mapped.warehouseId = payload.warehouseId;
  if (payload.warehouseName !== undefined)
    mapped.warehouseName = payload.warehouseName;

  if (payload.creditLimit !== undefined)
    mapped.creditLimit = payload.creditLimit;
  if (payload.creditDays !== undefined) mapped.creditDays = payload.creditDays;
  if (payload.openingBalance !== undefined)
    mapped.openingBalance = payload.openingBalance;
  if (payload.isActive !== undefined) mapped.isActive = payload.isActive;

  console.log('📦 Mapped Payload:', mapped);
  return mapped;
}

function extractData<T>(raw: unknown): T {
  if (
    raw &&
    typeof raw === 'object' &&
    'data' in (raw as Record<string, unknown>)
  ) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json();
  if (!res.ok) {
    // Log detailed error info for debugging
    console.error('API Error Response:', {
      status: res.status,
      statusText: res.statusText,
      data,
    });
    throw new Error(data?.message || data?.error || 'Server error');
  }
  if (typeof data?.success === 'boolean') {
    return data as ApiResponse<T>;
  }
  return { success: true, data: extractData<T>(data) };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getAllParties(): Promise<ApiResponse<PartyResponse[]>> {
  const res = await fetch(`${BASE_URL}/party`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<PartyResponse[]>(res);
}

export async function filterParties(filters?: {
  type?: 'Customer' | 'Supplier' | 'Both' | 'customer' | 'supplier' | 'both';
  search?: string;
  isActive?: boolean;
  warehouse_id?: string;
}): Promise<ApiResponse<PartyResponse[]>> {
  const query = new URLSearchParams();
  if (filters?.type) query.append('type', toDBType(filters.type));
  if (filters?.search) query.append('search', filters.search);
  if (filters?.isActive !== undefined)
    query.append('isActive', String(filters.isActive));
  if (filters.warehouse_id) query.append('warehouse_id', filters?.warehouse_id);

  const url = `${BASE_URL}/party/search${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const response = await handleResponse<PartyResponse[]>(res);
  return {
    success: response.success,
    message: response.message,
    data: Array.isArray(response.data) ? response.data : [],
  };
}

export async function getPartyById(
  id: string,
): Promise<ApiResponse<PartyResponse>> {
  const res = await fetch(`${BASE_URL}/party/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<PartyResponse>(res);
}

export async function createParty(
  payload: PartyPayload,
): Promise<ApiResponse<PartyResponse>> {
  const res = await fetch(`${BASE_URL}/party`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(mapPartyPayload(payload)),
  });
  return handleResponse<PartyResponse>(res);
}

export async function updateParty(
  id: string,
  payload: Partial<PartyPayload>,
): Promise<ApiResponse<PartyResponse>> {
  console.log(payload);
  const res = await fetch(`${BASE_URL}/party/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(mapPartyPayload(payload)),
  });
  return handleResponse<PartyResponse>(res);
}

export async function deleteParty(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/party/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<null>(res);
}

export async function getSuppliers(
  warehouseId?: string,
): Promise<ApiResponse<PartyResponse[]>> {
  const url = warehouseId
    ? `${BASE_URL}/party/suppliers?warehouse_id=${warehouseId}`
    : `${BASE_URL}/party/suppliers`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<PartyResponse[]>(res);
}

export async function getCustomers(): Promise<ApiResponse<PartyResponse[]>> {
  const res = await fetch(`${BASE_URL}/party/customers`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<PartyResponse[]>(res);
}
