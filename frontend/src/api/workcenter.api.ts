import { apiClient, type ApiResponse } from './client';

export interface WorkCenterPayload {
  name: string;
  type: 'MACHINE' | 'LABOR' | 'BOTH';
  capacityPerHour: number;
  warehouseId?: string | null;
  description?: string;
  isActive?: boolean;
}

export interface WorkCenterResponse {
  id: string;
  name: string;
  type: 'MACHINE' | 'LABOR' | 'BOTH';
  capacity_per_hour: number;
  warehouse_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/work-centers';

export async function createWorkCenter(
  payload: WorkCenterPayload,
): Promise<ApiResponse<WorkCenterResponse>> {
  const formattedPayload = {
    name: payload.name,
    type: payload.type,
    capacity_per_hour: payload.capacityPerHour,
    warehouse_id: payload.warehouseId || null,
    description: payload.description || null,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.post<ApiResponse<WorkCenterResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllWorkCenters(): Promise<
  ApiResponse<WorkCenterResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<WorkCenterResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateWorkCenter(
  id: string,
  payload: Partial<WorkCenterPayload>,
): Promise<ApiResponse<WorkCenterResponse>> {
  const formattedPayload = {
    name: payload.name,
    type: payload.type,
    capacity_per_hour: payload.capacityPerHour,
    warehouse_id: payload.warehouseId !== undefined ? (payload.warehouseId || null) : undefined,
    description: payload.description !== undefined ? (payload.description || null) : undefined,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.put<ApiResponse<WorkCenterResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteWorkCenter(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
