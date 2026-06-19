import { apiClient, type ApiResponse } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductionEntryPayload {
  productionOrderId?: string | null;
  productionOrderNumber?: string | null;
  workOrderId?: string | null;
  workOrderNumber?: string | null;
  stageName?: string | null;
  stageNumber?: number | null;
  workCenterId?: string | null;
  workCenterName?: string | null;
  machineId?: string | null;
  machineName?: string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  date: string;
  producedQty: number;
  rejectedQty?: number;
  unit?: string;
  startTime: string;
  endTime: string;
  actualTimeMinutes?: number;
  rejectionCodeId?: string | null;
  notes?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  enteredBy?: string | null;
  warehouseId?: string | null;
}

export interface ProductionEntryResponse {
  id: string;
  entry_number: string;
  production_order_id: string | null;
  production_order_number: string | null;
  work_order_id: string | null;
  work_order_number: string | null;
  stage_name: string | null;
  stage_number: number | null;
  work_center_id: string | null;
  work_center_name: string | null;
  machine_id: string | null;
  machine_name: string | null;
  operator_id: string | null;
  operator_name: string | null;
  shift_id: string | null;
  shift_name: string | null;
  date: string;
  produced_qty: number;
  rejected_qty: number;
  unit: string;
  start_time: string;
  end_time: string;
  actual_time_minutes: number;
  rejection_code_id: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisor_id: string | null;
  approved_at: string | null;
  entered_by: string | null;
  warehouse_id: string | null;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/manufacturing/shop-floor';

function toSnake(p: ProductionEntryPayload) {
  return {
    production_order_id: p.productionOrderId || null,
    production_order_number: p.productionOrderNumber || null,
    work_order_id: p.workOrderId || null,
    work_order_number: p.workOrderNumber || null,
    stage_name: p.stageName || null,
    stage_number: p.stageNumber ?? null,
    work_center_id: p.workCenterId || null,
    work_center_name: p.workCenterName || null,
    machine_id: p.machineId || null,
    machine_name: p.machineName || null,
    operator_id: p.operatorId || null,
    operator_name: p.operatorName || null,
    shift_id: p.shiftId || null,
    shift_name: p.shiftName || null,
    date: p.date,
    produced_qty: p.producedQty,
    rejected_qty: p.rejectedQty ?? 0,
    unit: p.unit ?? 'Pcs',
    start_time: p.startTime,
    end_time: p.endTime,
    actual_time_minutes: p.actualTimeMinutes ?? 0,
    rejection_code_id: p.rejectionCodeId || null,
    notes: p.notes || null,
    status: p.status ?? 'PENDING',
    entered_by: p.enteredBy || null,
    warehouse_id: p.warehouseId || null,
  };
}

export async function createProductionEntry(
  payload: ProductionEntryPayload,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.post<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/create`,
    toSnake(payload),
  );
  return data;
}

export async function getAllProductionEntries(): Promise<ApiResponse<ProductionEntryResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<ProductionEntryResponse[]>>(`${BASE}/`);
  return data;
}

export async function getProductionEntryById(
  id: string,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.get<ApiResponse<ProductionEntryResponse>>(`${BASE}/${id}`);
  return data;
}

export async function updateProductionEntry(
  id: string,
  payload: Partial<ProductionEntryPayload>,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.put<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/${id}`,
    toSnake(payload as ProductionEntryPayload),
  );
  return data;
}

export async function deleteProductionEntry(
  id: string,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}

export async function approveProductionEntry(
  id: string,
  supervisorId?: string,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.patch<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/${id}/approve`,
    { supervisor_id: supervisorId || null },
  );
  return data;
}
