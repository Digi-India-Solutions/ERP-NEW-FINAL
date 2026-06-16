import { apiClient, type ApiResponse } from './client';

export interface MachinePayload {
  name: string;
  model?: string | null;
  workCenterId?: string | null;
  capacityPerHour?: number | null;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN';
  lastMaintenanceDate?: string | null;
  maintenanceFrequencyDays?: number | null;
  isActive?: boolean;
  warehouseId?: string | null;
}

export interface MachineResponse {
  id: string;
  name: string;
  model: string | null;
  work_center_id: string | null;
  work_center_name?: string | null;
  capacity_per_hour: number | null;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN';
  last_maintenance_date: string | null;
  maintenance_frequency_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id?: string | null;
}

// ✅ Dropdown ke liye interface
export interface MachineDropdownResponse {
  id: string;
  name: string;
}

const BASE = '/api/v1/machines';

// ✅ CREATE MACHINE
export async function createMachine(
  payload: MachinePayload,
): Promise<ApiResponse<MachineResponse>> {
  const formattedPayload = {
    name: payload.name,
    model: payload.model || null,
    work_center_id: payload.workCenterId || null,
    capacity_per_hour:
      payload.capacityPerHour !== undefined ? payload.capacityPerHour : null,
    status: payload.status,
    last_maintenance_date: payload.lastMaintenanceDate || null,
    maintenance_frequency_days:
      payload.maintenanceFrequencyDays !== undefined
        ? payload.maintenanceFrequencyDays
        : null,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId || null,
  };
  const { data } = await apiClient.post<ApiResponse<MachineResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

// ✅ GET ALL MACHINES
export async function getAllMachines(): Promise<
  ApiResponse<MachineResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<MachineResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

// ✅ GET MACHINES FOR DROPDOWN (Only id and name - Active machines)
export async function getMachinesForDropdown(): Promise<
  ApiResponse<MachineDropdownResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<MachineDropdownResponse[]>>(
    `${BASE}/dropdown`,
  );
  return data;
}

// ✅ UPDATE MACHINE
export async function updateMachine(
  id: string,
  payload: Partial<MachinePayload>,
): Promise<ApiResponse<MachineResponse>> {
  const formattedPayload = {
    name: payload.name,
    model: payload.model !== undefined ? payload.model || null : undefined,
    work_center_id:
      payload.workCenterId !== undefined
        ? payload.workCenterId || null
        : undefined,
    capacity_per_hour:
      payload.capacityPerHour !== undefined
        ? payload.capacityPerHour
        : undefined,
    status: payload.status,
    last_maintenance_date:
      payload.lastMaintenanceDate !== undefined
        ? payload.lastMaintenanceDate || null
        : undefined,
    maintenance_frequency_days:
      payload.maintenanceFrequencyDays !== undefined
        ? payload.maintenanceFrequencyDays
        : undefined,
    is_active: payload.isActive,
    warehouse_id:
      payload.warehouseId !== undefined
        ? payload.warehouseId || null
        : undefined,
  };
  const { data } = await apiClient.put<ApiResponse<MachineResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

// ✅ DELETE MACHINE
export async function deleteMachine(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
