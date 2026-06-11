import { apiClient, type ApiResponse } from './client';

export type CostCenterType = 'PRODUCTION' | 'ADMIN' | 'SALES' | 'PURCHASE' | 'QUALITY' | 'MAINTENANCE';

export interface CostCenterPayload {
  name: string;
  code: string;
  type: CostCenterType;
  managerId?: string | null;
  managerName?: string | null;
  budgetMonthly: number;
  isActive?: boolean;
}

export interface CostCenterResponse {
  id: string;
  name: string;
  code: string;
  type: CostCenterType;
  manager_id: string | null;
  manager_name: string | null;
  budget_monthly: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/cost-control';

export async function createCostCenter(
  payload: CostCenterPayload,
): Promise<ApiResponse<CostCenterResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    type: payload.type,
    manager_id: payload.managerId || null,
    manager_name: payload.managerName || null,
    budget_monthly: payload.budgetMonthly,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.post<ApiResponse<CostCenterResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllCostCenters(): Promise<
  ApiResponse<CostCenterResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<CostCenterResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateCostCenter(
  id: string,
  payload: Partial<CostCenterPayload>,
): Promise<ApiResponse<CostCenterResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    type: payload.type,
    manager_id: payload.managerId !== undefined ? (payload.managerId || null) : undefined,
    manager_name: payload.managerName !== undefined ? (payload.managerName || null) : undefined,
    budget_monthly: payload.budgetMonthly,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.put<ApiResponse<CostCenterResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteCostCenter(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
