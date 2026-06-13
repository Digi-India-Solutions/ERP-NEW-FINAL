import { apiClient, type ApiResponse } from './client';

export interface InspectionChecklistPayload {
  name: string;
  code: string;
  applicableTo: string;
  itemTypeTarget: string;
  parameterIds: string[];
  samplingPlan: string;
  isActive?: boolean;
  warehouseId?: string | null;
}

export interface InspectionChecklistResponse {
  id: string;
  name: string;
  code: string;
  applicable_to: string;
  item_type_target: string;
  parameter_ids: string[];
  sampling_plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id?: string | null;
}

const BASE = '/api/v1/inspection-checklists';

export async function createInspectionChecklist(
  payload: InspectionChecklistPayload,
): Promise<ApiResponse<InspectionChecklistResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    applicable_to: payload.applicableTo,
    item_type_target: payload.itemTypeTarget,
    parameter_ids: payload.parameterIds,
    sampling_plan: payload.samplingPlan,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId || null,
  };
  const { data } = await apiClient.post<ApiResponse<InspectionChecklistResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllInspectionChecklists(): Promise<
  ApiResponse<InspectionChecklistResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<InspectionChecklistResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateInspectionChecklist(
  id: string,
  payload: Partial<InspectionChecklistPayload>,
): Promise<ApiResponse<InspectionChecklistResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    applicable_to: payload.applicableTo,
    item_type_target: payload.itemTypeTarget,
    parameter_ids: payload.parameterIds,
    sampling_plan: payload.samplingPlan,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId !== undefined ? (payload.warehouseId || null) : undefined,
  };
  const { data } = await apiClient.put<ApiResponse<InspectionChecklistResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteInspectionChecklist(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
