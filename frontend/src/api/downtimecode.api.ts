import { apiClient, type ApiResponse } from './client';

export type DowntimeCategory =
  | 'BREAKDOWN'
  | 'PLANNED'
  | 'MATERIAL'
  | 'POWER'
  | 'OPERATOR'
  | 'SETUP'
  | 'OTHER';

export interface DowntimeCodePayload {
  code: string;
  description: string;
  category: DowntimeCategory;
  affectsMachine?: boolean;
  isActive?: boolean;
  warehouseId?: string | null;
}

export interface DowntimeCodeResponse {
  id: string;
  code: string;
  description: string;
  category: DowntimeCategory;
  affects_machine: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id?: string | null;
}

// ✅ Dropdown ke liye interface
export interface DowntimeCodeDropdownResponse {
  id: string;
  code: string;
  description: string;
}

const BASE = '/api/v1/downtime-codes';

// ✅ CREATE DOWNTIME CODE
export async function createDowntimeCode(
  payload: DowntimeCodePayload,
): Promise<ApiResponse<DowntimeCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    affects_machine: payload.affectsMachine,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId || null,
  };
  const { data } = await apiClient.post<ApiResponse<DowntimeCodeResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

// ✅ GET ALL DOWNTIME CODES
export async function getAllDowntimeCodes(): Promise<
  ApiResponse<DowntimeCodeResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<DowntimeCodeResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

// ✅ GET DOWNTIME CODES FOR DROPDOWN (Only id, code and description - Active codes)
export async function getDowntimeCodesForDropdown(): Promise<
  ApiResponse<DowntimeCodeDropdownResponse[]>
> {
  const { data } = await apiClient.get<
    ApiResponse<DowntimeCodeDropdownResponse[]>
  >(`${BASE}/dropdown`);
  return data;
}

// ✅ UPDATE DOWNTIME CODE
export async function updateDowntimeCode(
  id: string,
  payload: Partial<DowntimeCodePayload>,
): Promise<ApiResponse<DowntimeCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    affects_machine: payload.affectsMachine,
    is_active: payload.isActive,
    warehouse_id:
      payload.warehouseId !== undefined
        ? payload.warehouseId || null
        : undefined,
  };
  const { data } = await apiClient.put<ApiResponse<DowntimeCodeResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

// ✅ DELETE DOWNTIME CODE
export async function deleteDowntimeCode(
  id: string,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
