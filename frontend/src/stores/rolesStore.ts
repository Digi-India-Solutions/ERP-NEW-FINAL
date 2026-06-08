import { create } from 'zustand';
import type { Role, RolePermissions, AdditionalControls } from '@/types/shared';
import { roleService } from '@/services/roleService';

interface RolesState {
  roles: Role[];
  isLoading: boolean;
  fetchActiveRoles: () => Promise<void>;
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'usersAssigned'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  cloneRole: (id: string) => void;
}

export const useRolesStore = create<RolesState>((set, get) => ({
  roles: [],
  isLoading: false,

  fetchActiveRoles: async () => {
    set({ isLoading: true });
    try {
      const roles = await roleService.getActiveRoles();
      if (roles.length > 0) {
        set({ roles, isLoading: false });
        return;
      }
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addRole: (role) => {
    const newRole: Role = {
      ...role,
      id: `role-${Date.now()}`,
      createdAt: new Date().toISOString(),
      usersAssigned: 0,
    };
    set((s) => ({ roles: [...s.roles, newRole] }));
  },

  updateRole: (id, updates) => {
    set((s) => ({
      roles: s.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteRole: (id) => {
    set((s) => ({ roles: s.roles.filter((r) => r.id !== id) }));
  },

  cloneRole: (id) => {
    const original = get().roles.find((r) => r.id === id);
    if (!original) return;
    const cloned: Role = {
      ...original,
      id: `role-${Date.now()}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      usersAssigned: 0,
      permissions: JSON.parse(JSON.stringify(original.permissions)) as RolePermissions,
      additionalControls: { ...original.additionalControls } as AdditionalControls,
    };
    set((s) => ({ roles: [...s.roles, cloned] }));
  },
}));
