
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { formatDateIST } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { useRolesStore } from '@/stores/rolesStore';
import type { AppUser, ModuleKey, ModuleAction, AssignedWarehouse, RolePermissions } from '@/types/shared';
import { userService } from '@/services/userService';
import { getAllWarehouses } from '@/api/warehouse.api';
import type { UserDTO } from '@/api/types';
import UserModal from './components/UserModal';
import PermissionOverviewModal from './components/PermissionOverviewModal';
import { MODULES } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { overridesToJsonb, jsonbToOverrides } from '@/utils/permissionHelpers';

const TYPE_BADGE: Record<string, string> = {
  OFFICE:  'bg-sky-50 text-sky-700',
  FACTORY: 'bg-amber-50 text-amber-700',
  STORE:   'bg-green-50 text-green-700',
  GODOWN:  'bg-violet-50 text-violet-700',
  BRANCH:  'bg-indigo-50 text-indigo-700',
  TRANSIT: 'bg-slate-100 text-slate-600',
};

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  assignedWarehouses: AssignedWarehouse[];
  permissions: Partial<Record<ModuleKey, Partial<Record<ModuleAction, boolean>>>>;
  additionalControlsOverrides: Partial<Record<string, boolean>>;
  isActive: boolean;
}

interface WarehouseOption {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function UsersPage() {
  const toast = useToast();
  const { user: currentUser } = useAuthStore();
  const { roles, fetchActiveRoles } = useRolesStore();

  const [rawUsers, setRawUsers] = useState<UserDTO[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [modal, setModal] = useState<{ 
    open: boolean; 
    editing: AppUser | null; 
    openAtSection?: 'basic' | 'role' | 'warehouses' | 'overrides' 
  }>({ open: false, editing: null });
  
  const [deactivateConfirm, setDeactivateConfirm] = useState<AppUser | null>(null);
  const [permissionsModal, setPermissionsModal] = useState<AppUser | null>(null);
  const { hasPermission, hasControl } = useAuth();

  const canCreateUser = hasPermission(MODULES.USERS, 'create') || hasControl("manageUserPermissions");
  const canEditUser = hasPermission(MODULES.USERS, 'edit') || hasControl("manageUserPermissions");
  const canDeleteUser = hasPermission(MODULES.USERS, 'delete') || hasControl("manageUserPermissions");

  const users = useMemo<AppUser[]>(() => {
    const warehouseById = new Map(warehouseOptions.map((w) => [w.id, w]));

    return rawUsers.map((u) => {
      const normalizedUserRole = String(u.role || '').trim().toUpperCase().replace(/\s+/g, '_');
      const matchedRole = roles.find(
        (r) => r.id === u.roleId || r.name === u.role || r.id === u.role
      );

      const assignedWarehouses: AssignedWarehouse[] = (u.warehouseIds || []).map((warehouseId, idx) => {
        const wh = warehouseById.get(warehouseId);
        return {
          warehouseId,
          warehouseName: wh?.name || warehouseId,
          warehouseType: (wh?.type || 'GODOWN') as AssignedWarehouse['warehouseType'],
          isPrimary: idx === 0,
        };
      });

      // Calculate Effective Permissions and Controls
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        roleId: u.roleId || matchedRole?.id || u.role,
        roleName: normalizedUserRole === 'SUPER_ADMIN' ? 'Super Admin' : u.roleName || matchedRole?.name || u.role,
        rolePermissions: matchedRole?.permissions || (u.rolePermissions as any),
        roleAdditionalControls: matchedRole?.additionalControls,
        isSuperAdmin: normalizedUserRole === 'SUPER_ADMIN',
        assignedWarehouses,
        permissionOverrides: jsonbToOverrides(u.permissions as Record<string, Record<string, boolean>>),
        // Important: Store current state, Modal handles the delta logic
        additionalControls: (u.additionalControls ?? {}) as Record<string, boolean>,
        isActive: u.isActive,
        lastLoginAt: u.lastActiveAt || null,
        createdAt: u.createdAt,
      };
    });
  }, [rawUsers, roles, warehouseOptions]);

  const loadUsers = async () => {
    const response = await userService.list({ page: 1, limit: 200 });
    setRawUsers(response.items || []);
  };

  const loadWarehouses = async () => {
    const response = await getAllWarehouses();
    const rows = response.data || [];
    setWarehouseOptions(rows.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      isActive: w.is_active,
    })));
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await fetchActiveRoles();
        await Promise.all([loadUsers(), loadWarehouses()]);
      } catch (error) {
        toast.error('Failed to load users data');
      } finally {
        setLoading(false);
      }
    };
    void initialize();
  }, [fetchActiveRoles]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchRole = roleFilter === 'ALL' || (roleFilter === 'SUPER_ADMIN' ? u.isSuperAdmin : u.roleId === roleFilter);
    return matchSearch && matchRole;
  });

  const handleSave = async (data: UserFormData) => {
    try {
      const selectedDbRole = roles.find((r) => r.id === data.roleId);
      const role = data.isSuperAdmin ? 'SUPER_ADMIN' : (selectedDbRole?.name || data.roleName.trim());
      const warehouseIds = data.assignedWarehouses.map((w) => w.warehouseId);
      
      // Convert UI matrix back to JSONB for backend
      const permissions = overridesToJsonb(data.permissions);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role,
        roleId: data.roleId,
        warehouseIds,
        permissions, // Overrides
        additionalControls: data.additionalControlsOverrides, // Overrides only
        isActive: data.isActive,
        ...(data.password ? { password: data.password } : {}),
      };

      if (modal.editing) {
        await userService.update(modal.editing.id, payload);
        toast.success(`User updated successfully`);
      } else {
        await userService.create(payload);
        toast.success(`User created successfully`);
      }

      await loadUsers();
      setModal({ open: false, editing: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateConfirm) return;
    try {
      await userService.toggleActive(deactivateConfirm.id, !deactivateConfirm.isActive);
      await loadUsers();
      toast.success(`User status updated`);
      setDeactivateConfirm(null);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    superAdmins: users.filter((u) => u.isSuperAdmin).length,
    withOverrides: users.filter((u) => Object.keys(u.permissionOverrides ?? {}).length > 0).length,
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header and Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Users & Access Control</h2>
            <p className="text-sm text-[#64748b] mt-0.5">Manage team members and permissions</p>
          </div>
          {canCreateUser && (
            <button onClick={() => setModal({ open: true, editing: null })} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700">
              <i className="ri-user-add-line" /> Add User
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total, icon: 'ri-team-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
            { label: 'Active', value: stats.active, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Super Admins', value: stats.superAdmins, icon: 'ri-shield-star-line', bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Custom Overrides', value: stats.withOverrides, icon: 'ri-key-line', bg: 'bg-rose-50', color: 'text-rose-600' },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg}`}>
                <i className={`${c.icon} ${c.color} text-lg`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{c.value}</p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            <button onClick={() => setRoleFilter('ALL')} className={`h-7 px-3 rounded-md text-xs font-semibold ${roleFilter === 'ALL' ? 'bg-white shadow-sm' : 'text-[#64748b]'}`}>All</button>
            <button onClick={() => setRoleFilter('SUPER_ADMIN')} className={`h-7 px-3 rounded-md text-xs font-semibold ${roleFilter === 'SUPER_ADMIN' ? 'bg-white shadow-sm' : 'text-[#64748b]'}`}>Super Admin</button>
            {roles.filter(r => r.name !== 'SUPER_ADMIN').map(r => (
              <button key={r.id} onClick={() => setRoleFilter(r.id)} className={`h-7 px-3 rounded-md text-xs font-semibold ${roleFilter === r.id ? 'bg-white shadow-sm' : 'text-[#64748b]'}`}>{r.name}</button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Warehouses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[#1e293b]">{u.name}</div>
                        <div className="text-xs text-[#64748b]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isSuperAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isSuperAdmin ? 'All Access' : `${u.assignedWarehouses.length} Warehouses`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canEditUser && (<button onClick={() => setModal({ open: true, editing: u })} className="p-1 hover:text-indigo-600"><i className="ri-edit-line" /></button>)}
                      <button onClick={() => setPermissionsModal(u)} className="p-1 hover:text-amber-600"><i className="ri-key-line" /></button>
                      {canDeleteUser && (<button onClick={() => setDeactivateConfirm(u)} className="p-1 hover:text-red-600"><i className="ri-user-forbid-line" /></button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        open={modal.open}
        editing={modal.editing}
        roles={roles}
        warehouses={warehouseOptions}
        existingUsers={users}
        onSave={handleSave}
        onClose={() => setModal({ open: false, editing: null })}
        openAtSection={modal.openAtSection}
      />

      {permissionsModal && (
        <PermissionOverviewModal
          user={permissionsModal}
          role={roles.find((r) => r.id === permissionsModal.roleId) ?? null}
          onClose={() => setPermissionsModal(null)}
          onEditPermissions={() => {
            const u = permissionsModal;
            setPermissionsModal(null);
            setModal({ open: true, editing: u, openAtSection: 'overrides' });
          }}
        />
      )}

      <ConfirmDialog
        open={!!deactivateConfirm}
        title={deactivateConfirm?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to change status for ${deactivateConfirm?.name}?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateConfirm(null)}
      />
    </AppLayout>
  );
}