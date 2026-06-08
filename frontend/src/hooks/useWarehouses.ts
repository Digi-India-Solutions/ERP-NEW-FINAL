import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '@/services/warehouseService';
import type { CreateWarehouseRequest, UpdateWarehouseRequest, ListParams } from '@/api/types';

export const WAREHOUSE_KEYS = {
  all: ['warehouses'] as const,
  list: (params?: ListParams) => ['warehouses', 'list', params] as const,
  detail: (id: string) => ['warehouses', id] as const,
};

export const useWarehouseList = (params?: ListParams) =>
  useQuery({
    queryKey: WAREHOUSE_KEYS.list(params),
    queryFn: () => warehouseService.list(params),
  });

export const useWarehouse = (id: string) =>
  useQuery({
    queryKey: WAREHOUSE_KEYS.detail(id),
    queryFn: () => warehouseService.get(id),
    enabled: !!id,
  });

export const useCreateWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarehouseRequest) => warehouseService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.all }),
  });
};

export const useUpdateWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWarehouseRequest }) =>
      warehouseService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.all }),
  });
};

export const useDeleteWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: WAREHOUSE_KEYS.all }),
  });
};
