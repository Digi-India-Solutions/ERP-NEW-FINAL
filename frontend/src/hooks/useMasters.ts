import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { userService } from '@/services/userService';
import type { CreateCategoryRequest, CreateUnitRequest, CreateUserRequest, UpdateUserPermissionsRequest, ListParams } from '@/api/types';

// ── Categories ────────────────────────────────────────────────────────────
export const CATEGORY_KEYS = { all: ['categories'] as const };

export const useCategoryList = () =>
  useQuery({ queryKey: CATEGORY_KEYS.all, queryFn: () => categoryService.list() });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoryService.update(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORY_KEYS.all }),
  });
};

// ── Units ─────────────────────────────────────────────────────────────────
export const UNIT_KEYS = { all: ['units'] as const };

export const useUnitList = () =>
  useQuery({ queryKey: UNIT_KEYS.all, queryFn: () => unitService.list() });

export const useCreateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitRequest) => unitService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: UNIT_KEYS.all }),
  });
};

export const useUpdateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateUnitRequest }) =>
      unitService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: UNIT_KEYS.all }),
  });
};

// ── Users ─────────────────────────────────────────────────────────────────
export const USER_KEYS = {
  all: ['users'] as const,
  list: (params?: ListParams) => ['users', 'list', params] as const,
};

export const useUserList = (params?: ListParams) =>
  useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => userService.list(params),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => userService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  });
};

export const useUpdateUserPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPermissionsRequest }) =>
      userService.updatePermissions(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  });
};

export const useToggleUserActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  });
};
