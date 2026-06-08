import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService } from '@/services/itemService';
import type { CreateItemRequest, UpdateItemRequest, ListParams } from '@/api/types';

export const ITEM_KEYS = {
  all: ['items'] as const,
  list: (params?: ListParams) => ['items', 'list', params] as const,
  search: (q: string, warehouseId?: string) => ['items', 'search', q, warehouseId] as const,
  detail: (id: string) => ['items', id] as const,
  lowStock: (warehouseId?: string) => ['items', 'low-stock', warehouseId] as const,
  ledger: (itemId: string, warehouseId: string) => ['items', 'ledger', itemId, warehouseId] as const,
};

export const useItemList = (params?: ListParams) =>
  useQuery({
    queryKey: ITEM_KEYS.list(params),
    queryFn: () => itemService.list(params),
  });

// Billing item search — enabled after 2+ chars
export const useItemSearch = (q: string, warehouseId?: string) =>
  useQuery({
    queryKey: ITEM_KEYS.search(q, warehouseId),
    queryFn: () => itemService.search(q, warehouseId),
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  });

export const useItem = (id: string) =>
  useQuery({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: () => itemService.get(id),
    enabled: !!id,
  });

export const useLowStockItems = (warehouseId?: string) =>
  useQuery({
    queryKey: ITEM_KEYS.lowStock(warehouseId),
    queryFn: () => itemService.getLowStock(warehouseId),
  });

export const useStockLedger = (
  itemId: string,
  warehouseId: string,
  fromDate?: string,
  toDate?: string
) =>
  useQuery({
    queryKey: ITEM_KEYS.ledger(itemId, warehouseId),
    queryFn: () => itemService.getStockLedger(itemId, warehouseId, fromDate, toDate),
    enabled: !!itemId && !!warehouseId,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateItemRequest) => itemService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemRequest }) =>
      itemService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
};
