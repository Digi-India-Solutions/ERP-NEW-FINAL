import { useAuthStore } from '@/stores/authStore';
import { useRolesStore } from '@/stores/rolesStore';
import type { ModuleKey, ModuleAction } from '@/types/shared';

/**
 * usePermissions — central hook for checking user permissions.
 *
 * Priority:
 * 1. Super Admin → always true
 * 2. permissionOverrides on user (if any)
 * 3. Role permissions from rolesStore
 * 4. Fallback → false
 */
export function usePermissions() {
  const { user } = useAuthStore();
  const { roles } = useRolesStore();

  /**
   * Check if the current user has a specific module action permission.
   */
  const hasPermission = (module: ModuleKey, action: ModuleAction): boolean => {
    if (!user) return false;

    // Super Admin always has full access
    if (user.role === 'SUPER_ADMIN') return true;

    // SUB_ADMIN has full access (legacy)
    if (user.role === 'SUB_ADMIN') return true;

    // For END_USER, check role permissions
    // We need to find the user's role from the store
    // The user object in authStore has a roleId if it was set
    const authUserExtended = user as typeof user & { roleId?: string; permissionOverrides?: Record<string, Record<string, boolean>> };

    // Check permission overrides first
    if (authUserExtended.permissionOverrides) {
      const override = authUserExtended.permissionOverrides[module]?.[action];
      if (override !== undefined) return override;
    }

    // Find role by roleId
    if (authUserExtended.roleId) {
      const role = roles.find((r) => r.id === authUserExtended.roleId);
      if (role) {
        return role.permissions[module]?.[action] === true;
      }
    }

    return false;
  };

  /**
   * Check an additional control flag on the user's role.
   */
  const hasControl = (control: keyof import('@/types/shared').AdditionalControls): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'SUB_ADMIN') return true;

    const authUserExtended = user as typeof user & { roleId?: string };
    if (authUserExtended.roleId) {
      const role = roles.find((r) => r.id === authUserExtended.roleId);
      if (role) return role.additionalControls[control] === true;
    }
    return false;
  };

  /**
   * Check if user can access a specific warehouse.
   */
  const canAccessWarehouse = (warehouseId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (hasControl('viewAllWarehouses')) return true;
    return user.warehouseIds.includes(warehouseId);
  };

  /**
   * Get list of accessible warehouse IDs.
   */
  const getAccessibleWarehouseIds = (allIds: string[]): string[] => {
    if (!user) return [];
    if (user.role === 'SUPER_ADMIN') return allIds;
    if (hasControl('viewAllWarehouses')) return allIds;
    return user.warehouseIds;
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'SUB_ADMIN';

  return {
    hasPermission,
    hasControl,
    canAccessWarehouse,
    getAccessibleWarehouseIds,
    isSuperAdmin,
    isManager,
    user,
  };
}
