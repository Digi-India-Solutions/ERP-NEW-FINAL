import { apiClient, type ApiResponse } from './client';

export type RoutingStatus = 'ACTIVE' | 'DRAFT' | 'OBSOLETE';

export interface RoutingStage {
  sequence: number;
  workCenterId: string;
  workCenterName: string;
  machineId: string;
  machineName: string;
  operationName: string;
  setupTimeMinutes: number;
  runTimeMinutes: number;
  description?: string;
}

export interface RoutingPayload {
  id?: string;
  name: string;
  code: string;
  itemId?: string | null;
  itemName?: string | null;
  version?: string;
  status: RoutingStatus;
  stages: RoutingStage[];
  totalTimeMinutes?: number;
  isActive?: boolean;
  warehouseId?: string | null;
}

export interface RoutingResponse {
  id: string;
  name: string;
  code: string;
  item_id: string | null;
  item_name: string | null;
  version: string;
  status: RoutingStatus;
  stages: RoutingStage[] | string;
  total_time_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id?: string | null;
}

export interface RoutingDropdownItem {
  id: string;
  name: string;
  code: string;
  status: string;
}

const BASE = '/api/v1/routings';

export async function createRouting(
  payload: RoutingPayload,
): Promise<ApiResponse<RoutingResponse>> {
  const formattedPayload = {
    id: payload.id,
    name: payload.name,
    code: payload.code,
    item_id: payload.itemId,
    item_name: payload.itemName,
    version: payload.version,
    status: payload.status,
    stages: payload.stages,
    total_time_minutes: payload.totalTimeMinutes,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId || null,
  };
  const { data } = await apiClient.post<ApiResponse<RoutingResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllRoutings(): Promise<
  ApiResponse<RoutingResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<RoutingResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateRouting(
  id: string,
  payload: Partial<RoutingPayload>,
): Promise<ApiResponse<RoutingResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    item_id: payload.itemId,
    item_name: payload.itemName,
    version: payload.version,
    status: payload.status,
    stages: payload.stages,
    total_time_minutes: payload.totalTimeMinutes,
    is_active: payload.isActive,
    warehouse_id:
      payload.warehouseId !== undefined
        ? payload.warehouseId || null
        : undefined,
  };
  const { data } = await apiClient.put<ApiResponse<RoutingResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteRouting(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}

// ✅ NEW: Get routings for dropdown
export async function getRoutingsForDropdown(): Promise<RoutingDropdownItem[]> {
  const { data } = await apiClient.get<ApiResponse<RoutingDropdownItem[]>>(
    `${BASE}/dropdown`,
  );
  return data.data || [];
}
