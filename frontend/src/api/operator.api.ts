import { apiClient, type ApiResponse } from './client';

export type OperatorSkill =
  | 'WELDER'
  | 'MACHINIST'
  | 'ASSEMBLER'
  | 'QC_INSPECTOR'
  | 'SUPERVISOR';

export interface OperatorPayload {
  name: string;
  employeeCode: string;
  skill: OperatorSkill;
  wageRatePerHour: number;
  shiftId?: string | null;
  phone?: string | null;
  isActive?: boolean;
  warehouseId?: string | null;
}

export interface OperatorResponse {
  id: string;
  name: string;
  employee_code: string;
  skill: OperatorSkill;
  wage_rate_per_hour: string | number;
  shift_id: string | null;
  shift_name?: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id?: string | null;
}

// ✅ Dropdown ke liye interface
export interface OperatorDropdownResponse {
  id: string;
  name: string;
}

const BASE = '/api/v1/operators';

// ✅ CREATE OPERATOR
export async function createOperator(
  payload: OperatorPayload,
): Promise<ApiResponse<OperatorResponse>> {
  const formattedPayload = {
    name: payload.name,
    employee_code: payload.employeeCode,
    skill: payload.skill,
    wage_rate_per_hour: payload.wageRatePerHour,
    shift_id: payload.shiftId || null,
    phone: payload.phone || null,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId || null,
  };
  const { data } = await apiClient.post<ApiResponse<OperatorResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

// ✅ GET ALL OPERATORS
export async function getAllOperators(): Promise<
  ApiResponse<OperatorResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<OperatorResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

// ✅ GET OPERATORS FOR DROPDOWN (Only id and name - Active operators)
export async function getOperatorsForDropdown(): Promise<
  ApiResponse<OperatorDropdownResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<OperatorDropdownResponse[]>>(
    `${BASE}/dropdown`,
  );
  return data;
}

// ✅ UPDATE OPERATOR
export async function updateOperator(
  id: string,
  payload: Partial<OperatorPayload>,
): Promise<ApiResponse<OperatorResponse>> {
  const formattedPayload = {
    name: payload.name,
    employee_code: payload.employeeCode,
    skill: payload.skill,
    wage_rate_per_hour: payload.wageRatePerHour,
    shift_id:
      payload.shiftId !== undefined ? payload.shiftId || null : undefined,
    phone: payload.phone !== undefined ? payload.phone || null : undefined,
    is_active: payload.isActive,
    warehouse_id:
      payload.warehouseId !== undefined
        ? payload.warehouseId || null
        : undefined,
  };
  const { data } = await apiClient.put<ApiResponse<OperatorResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

// ✅ DELETE OPERATOR
export async function deleteOperator(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
