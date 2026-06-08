import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse, WarehouseDTO, CreateWarehouseRequest, UpdateWarehouseRequest, ListParams } from '@/api/types';

import WarehousesPage from "@/pages/masters/warehouses/page";

export const warehouseService = {
  // list: async (params?: ListParams): Promise<PaginatedResponse<WarehouseDTO>> => {
  //   const { data } = await apiClient.get<ApiResponse<PaginatedResponse<WarehouseDTO>>>(
  //     '/api/v1/warehouse',
  //     { params: { page: 1, limit: 50, ...params } }
  //   );

  //   const payload = data.data as unknown;

  //   const items = Array.isArray(payload)
  //     ? (payload as WarehouseDTO[])
  //     : Array.isArray((payload as { items?: WarehouseDTO[]; data?: WarehouseDTO[] })?.items)
  //     ? (data.data as unknown as { items: WarehouseDTO[] }).items
  //     : Array.isArray((payload as { data?: WarehouseDTO[] })?.data)
  //       ? (data.data as unknown as { data: WarehouseDTO[] }).data
  //       : [];

  //   const total = typeof (payload as { total?: number; count?: number })?.total === 'number'
  //     ? (payload as { total: number }).total
  //     : typeof (payload as { count?: number })?.count === 'number'
  //       ? (payload as { count: number }).count
  //       : items.length;

  //   return {
  //     items,
  //     total,
  //     page: 1,
  //     limit: params?.limit ?? 50,
  //   };
  // },

  // get: async (id: string): Promise<WarehouseDTO> => {
  //   const { data } = await apiClient.get<ApiResponse<WarehouseDTO>>(`/api/v1/warehouse/${id}`);
  //   return data.data;
  // },

  // create: async (payload: CreateWarehouseRequest): Promise<WarehouseDTO> => {
  //   const { data } = await apiClient.post<ApiResponse<WarehouseDTO>>('/api/v1/warehouse', payload);
  //   return data.data;
  // },

  // update: async (id: string, payload: UpdateWarehouseRequest): Promise<WarehouseDTO> => {
  //   const { data } = await apiClient.patch<ApiResponse<WarehouseDTO>>(
  //     `/api/v1/warehouse/${id}`,
  //     payload
  //   );
  //   return data.data;
  // },

  // toggleActive: async (id: string, isActive: boolean): Promise<WarehouseDTO> => {
  //   const { data } = await apiClient.patch<ApiResponse<WarehouseDTO>>(
  //     `/api/v1/warehouse/${id}`,
  //     { isActive }
  //   );
  //   return data.data;
  // },

  // softDelete: async (id: string): Promise<void> => {
  //   await apiClient.patch(`/api/v1/warehouse/${id}`, { isActive: false });
  // },
};

