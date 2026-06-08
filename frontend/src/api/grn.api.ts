import { apiClient, type ApiResponse } from './client';
import type { MockGRN, MockGRNItem } from '@/mocks/billing';

const BASE = '/api/v1/grn';

export interface CreateGRNItemPayload {
  itemId?: string;
  itemName: string;
  hsnCode?: string;
  quantity: number;
  unitName?: string;
  rate?: number;
  poId?: string | null;
  poNumber?: string | null;
  barcode?: string | null;
  companyBarcode?: string | null;
}

export interface CreateGRNPayload {
  warehouseId: string;
  supplierId?: string | null;
  date?: string;
  notes?: string;
  items: CreateGRNItemPayload[];
}

export interface GRNApiItem {
  id: string;
  grnId: string;
  itemId: string | null;
  itemName: string | null;
  poId: string | null;
  poNumber: string | null;
  hsnCode: string | null;
  quantity: number;
  unitName: string | null;
  rate: number;
  total: number;
  barcode: string | null;
  companyBarcode: string | null;
}

export interface GRNApiRecord {
  id: string;
  grnNumber: string;
  companyId: string;
  warehouseId: string;
  warehouseName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  date: string;
  status: string;
  totalQty: number;
  totalValue: number;
  createdBy: string;
  createdByName?: string | null;
  createdAt: string;
  itemCount?: number;
  totalItemsQty?: number;
  unmatchedCount?: number;
  poLinkedCount?: number;
  items?: GRNApiItem[];
}

export function mapGRNItemToMock(item: GRNApiItem): MockGRNItem {
  return {
    itemId: item.itemId || '',
    itemName: item.itemName || '',
    hsnCode: item.hsnCode || '',
    qty: item.quantity,
    unit: item.unitName || '',
    rate: item.rate,
    poRef: item.poNumber,
  };
}

export function mapGRNToMockGRN(record: GRNApiRecord, linkedPOs: string[] = [], notes?: string): MockGRN {
  const items = (record.items || []).map(mapGRNItemToMock);
  const totalItems = record.itemCount ?? items.length;
  const totalValue = Number(record.totalValue || 0);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.createdBy || '');
  const createdByDisplay = record.createdByName || (isUuid ? 'Unknown User' : record.createdBy);
  const resolvedLinkedPOs = linkedPOs.length > 0
    ? linkedPOs
    : Array.from(new Set(items.map((item) => item.poRef).filter((po): po is string => Boolean(po))));

  return {
    id: record.id,
    grnNumber: record.grnNumber,
    supplierId: record.supplierId || '',
    supplierName: record.supplierName || '',
    date: record.date,
    warehouseId: record.warehouseId,
    warehouseName: record.warehouseName || '',
    createdBy: createdByDisplay,
    linkedPOs: resolvedLinkedPOs,
    items,
    totalItems,
    totalValue,
    piCreated: false,
    linkedPINumber: null,
    piCreatedDate: null,
    notes,
  };
}

export async function apiCreateGRN(payload: CreateGRNPayload): Promise<ApiResponse<GRNApiRecord>> {
  const { data } = await apiClient.post<ApiResponse<GRNApiRecord>>(BASE, payload);
  return data;
}

export async function apiGetAllGRNs(): Promise<ApiResponse<GRNApiRecord[]>> {
  const { data } = await apiClient.get<ApiResponse<GRNApiRecord[]>>(BASE);
  return data;
}

export async function apiGetGRNById(id: string): Promise<ApiResponse<GRNApiRecord>> {
  const { data } = await apiClient.get<ApiResponse<GRNApiRecord>>(`${BASE}/${id}`);
  return data;
}