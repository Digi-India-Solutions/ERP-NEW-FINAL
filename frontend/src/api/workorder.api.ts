import { apiClient, type ApiResponse } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkOrderPayload {
  productionOrderId: string;
  productionOrderNumber: string;
  stageNumber: number;
  stageName: string;
  workCenterId: string;
  workCenterName: string;
  machineId?: string | null;
  machineName?: string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  plannedQty: number;
  completedQty?: number;
  rejectedQty?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  plannedTimeMinutes?: number;
  actualTimeMinutes?: number | null;
  notes?: string | null;
  warehouseId?: string | null;
}

export interface WorkOrderResponse {
  id: string;
  wo_number: string;
  production_order_id: string;
  production_order_number: string;
  stage_number: number;
  stage_name: string;
  work_center_id: string;
  work_center_name: string;
  machine_id: string | null;
  machine_name: string | null;
  operator_id: string | null;
  operator_name: string | null;
  shift_id: string | null;
  shift_name: string | null;
  planned_qty: string | number;
  completed_qty: string | number;
  rejected_qty: string | number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  planned_time_minutes: number;
  actual_time_minutes: number | null;
  notes: string | null;
  warehouse_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/manufacturing/work-orders';

function toSnake(p: Partial<WorkOrderPayload>) {
  const result: any = {};
  if (p.productionOrderId !== undefined) result.production_order_id = p.productionOrderId;
  if (p.productionOrderNumber !== undefined) result.production_order_number = p.productionOrderNumber;
  if (p.stageNumber !== undefined) result.stage_number = p.stageNumber;
  if (p.stageName !== undefined) result.stage_name = p.stageName;
  if (p.workCenterId !== undefined) result.work_center_id = p.workCenterId;
  if (p.workCenterName !== undefined) result.work_center_name = p.workCenterName;
  if (p.machineId !== undefined) result.machine_id = p.machineId || null;
  if (p.machineName !== undefined) result.machine_name = p.machineName || null;
  if (p.operatorId !== undefined) result.operator_id = p.operatorId || null;
  if (p.operatorName !== undefined) result.operator_name = p.operatorName || null;
  if (p.shiftId !== undefined) result.shift_id = p.shiftId || null;
  if (p.shiftName !== undefined) result.shift_name = p.shiftName || null;
  if (p.plannedQty !== undefined) result.planned_qty = p.plannedQty;
  if (p.completedQty !== undefined) result.completed_qty = p.completedQty;
  if (p.rejectedQty !== undefined) result.rejected_qty = p.rejectedQty;
  if (p.status !== undefined) result.status = p.status;
  if (p.plannedStartDate !== undefined) result.planned_start_date = p.plannedStartDate;
  if (p.plannedEndDate !== undefined) result.planned_end_date = p.plannedEndDate;
  if (p.actualStartDate !== undefined) result.actual_start_date = p.actualStartDate || null;
  if (p.actualEndDate !== undefined) result.actual_end_date = p.actualEndDate || null;
  if (p.plannedTimeMinutes !== undefined) result.planned_time_minutes = p.plannedTimeMinutes;
  if (p.actualTimeMinutes !== undefined) result.actual_time_minutes = p.actualTimeMinutes ?? null;
  if (p.notes !== undefined) result.notes = p.notes || null;
  if (p.warehouseId !== undefined) result.warehouse_id = p.warehouseId || null;
  return result;
}

export async function createWorkOrder(
  payload: WorkOrderPayload
): Promise<ApiResponse<WorkOrderResponse>> {
  const { data } = await apiClient.post<ApiResponse<WorkOrderResponse>>(
    `${BASE}/create`,
    toSnake(payload)
  );
  return data;
}

export async function getAllWorkOrders(
  warehouseId?: string | null
): Promise<ApiResponse<WorkOrderResponse[]>> {
  const params: Record<string, string> = {};
  if (warehouseId) {
    params.warehouse_id = warehouseId;
  }
  const { data } = await apiClient.get<ApiResponse<WorkOrderResponse[]>>(
    `${BASE}/`,
    { params }
  );
  return data;
}

export async function getWorkOrderById(
  id: string
): Promise<ApiResponse<WorkOrderResponse>> {
  const { data } = await apiClient.get<ApiResponse<WorkOrderResponse>>(`${BASE}/${id}`);
  return data;
}

export async function updateWorkOrder(
  id: string,
  payload: Partial<WorkOrderPayload>
): Promise<ApiResponse<WorkOrderResponse>> {
  const { data } = await apiClient.put<ApiResponse<WorkOrderResponse>>(
    `${BASE}/${id}`,
    toSnake(payload)
  );
  return data;
}

export async function deleteWorkOrder(
  id: string
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
