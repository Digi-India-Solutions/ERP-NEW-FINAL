import type { WarehouseType } from '@/types/shared';

const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const BASE_URL = `${api}/api/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WarehousePayload {
  name: string;
  type: WarehouseType;
  address: string;
  inchargeName?: string;
  inchargePhone?: string;
  inchargeUserId?: string;
  color?: string;
  isActive?: boolean;
}

export interface WarehouseResponse {
  id: string;
  company_id: string;
  name: string;
  type: WarehouseType;
  address: string;
  incharge_name: string;
  incharge_phone: string;
  incharge_user_id: string | null;
  color: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token'); // adjust key if different
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

// ─── API Calls ────────────────────────────────────────────────────────────────

/** POST /api/v1/warehouse/ */
export async function createWarehouse(
  payload: WarehousePayload,
): Promise<ApiResponse<WarehouseResponse>> {
  const res = await fetch(`${BASE_URL}/warehouse/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<WarehouseResponse>(res);
}

/** GET /api/v1/warehouse/ */
export async function getAllWarehouses(): Promise<
  ApiResponse<WarehouseResponse[]>
> {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/warehouse`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ always ensure token
      },
    });

    return await handleResponse<WarehouseResponse[]>(res);
  } catch (error) {
    console.error('Warehouse fetch failed:', error);

    return {
      success: false,
      message: 'Failed to fetch warehouses',
      data: [],
    };
  }
}

export async function getAssignedWarehouses(): Promise<
  ApiResponse<WarehouseResponse[]>
> {
  const res = await fetch(`${BASE_URL}/warehouse/assigned`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<WarehouseResponse[]>(res);
}

/** PUT /api/v1/warehouse/:id */
export async function updateWarehouse(
  id: string,
  payload: Partial<WarehousePayload>,
): Promise<ApiResponse<WarehouseResponse>> {
  const res = await fetch(`${BASE_URL}/warehouse/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<WarehouseResponse>(res);
}

/** DELETE /api/v1/warehouse/:id */
export async function deleteWarehouse(id: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/warehouse/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<null>(res);
}

/** POST /api/v1/warehouse/search */
export async function searchWarehouses(
  name: string,
): Promise<ApiResponse<WarehouseResponse[]>> {
  const trimmedName = name.trim();
  const params = new URLSearchParams({ name: trimmedName });
  const res = await fetch(`${BASE_URL}/warehouse/search?${params.toString()}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: trimmedName }),
  });

  return handleResponse<WarehouseResponse[]>(res);
}

export async function getWarehousesForUser(
  canViewAll: boolean,
): Promise<ApiResponse<WarehouseResponse[]>> {
  return canViewAll ? getAllWarehouses() : getAssignedWarehouses();
}
