import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partyService } from '@/services/partyService';
import type { CreatePartyRequest, UpdatePartyRequest, ListParams } from '@/api/types';

export const PARTY_KEYS = {
  all: ['parties'] as const,
  list: (params?: ListParams) => ['parties', 'list', params] as const,
  search: (q: string) => ['parties', 'search', q] as const,
  detail: (id: string) => ['parties', id] as const,
};

export const usePartyList = (params?: ListParams) =>
  useQuery({
    queryKey: PARTY_KEYS.list(params),
    queryFn: () => partyService.list(params),
  });

export const usePartySearch = (q: string) =>
  useQuery({
    queryKey: PARTY_KEYS.search(q),
    queryFn: () => partyService.search(q),
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  });

export const useParty = (id: string) =>
  useQuery({
    queryKey: PARTY_KEYS.detail(id),
    queryFn: () => partyService.get(id),
    enabled: !!id,
  });

export const useCreateParty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePartyRequest) => partyService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTY_KEYS.all }),
  });
};

export const useUpdateParty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePartyRequest }) =>
      partyService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTY_KEYS.all }),
  });
};

export const useDeleteParty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partyService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTY_KEYS.all }),
  });
};
