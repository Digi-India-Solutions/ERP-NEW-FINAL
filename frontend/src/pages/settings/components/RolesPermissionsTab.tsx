import { useState, useEffect, useCallback } from 'react';
import type { Role } from '@/types/shared';
import RoleModal from './RoleModal';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

const API_BASE = 'https://asvapi.digiindiasolutions.com/api/v1';

// ── Map backend row → frontend Role ──────────────────────────────────────────
function mapRole(r: any): Role {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    isSystem: r.is_system ?? false,
    isActive: r.is_active ?? true,
    createdBy: r.created_by_name ?? 'Unknown',
    usersAssigned: Number(r.users_assigned ?? 0),
    permissions: r.permissions ?? {},
    additionalControls: r.additional_controls ?? {},
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export default function RolesPermissionsTab() {
  const toast = useToast();
  const { user } = useAuth();
  const token = user.token || useAuthStore((s: any) => s.accessToken);

  // ── State ──
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoles: 0,
    activeRoles: 0,
    usersAssigned: 0,
  });
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingRole, setDeletingRole] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // ── Auth header ──
  const authHeader = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch roles ──
  const fetchRoles = useCallback(
    async (q = '') => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/role/get-all?search=${encodeURIComponent(q)}`,
          { headers: authHeader() },
        );
        const json = await res.json();
        if (json.success) setRoles(json.data.map(mapRole));
        else toast.error('Failed to load roles');
      } catch {
        toast.error('Network error loading roles');
      } finally {
        setLoading(false);
      }
    },
    [authHeader, toast],
  );

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/role/stats`, {
        headers: authHeader(),
      });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {
      /* silent */
    }
  }, [authHeader]);

  // ── Initial load ──
  useEffect(() => {
    fetchRoles('');
    fetchStats();
  }, [fetchRoles, fetchStats]);

  // ── Refetch on search change ──
  useEffect(() => {
    fetchRoles(searchDebounced);
  }, [searchDebounced, fetchRoles]);

  // ── Create / Update ──
  const handleSave = async (
    data: Omit<Role, 'id' | 'createdAt' | 'usersAssigned'>,
  ) => {
    setSavingRole(true);
    try {
      const isEdit = !!editingRole;
      const url = isEdit
        ? `${API_BASE}/role/update/${editingRole!.id}`
        : `${API_BASE}/role/create`;

      const body = {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: data.permissions,
        additionalControls: data.additionalControls,
      };

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(
          json.message || `Failed to ${isEdit ? 'update' : 'create'} role`,
        );
        return;
      }

      toast.success(
        `Role "${data.name}" ${isEdit ? 'updated' : 'created'} successfully`,
      );
      setModalOpen(false);
      setEditingRole(null);
      await fetchRoles(searchDebounced);
      await fetchStats();
    } catch {
      toast.error('Network error saving role');
    } finally {
      setSavingRole(false);
    }
  };

  // ── Clone ──
  const handleClone = async (role: Role) => {
    setCloningId(role.id);
    try {
      const res = await fetch(`${API_BASE}/role/clone/${role.id}`, {
        method: 'POST',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to clone role');
        return;
      }
      toast.success(`Role "${role.name}" cloned as "${role.name} (Copy)"`);
      await fetchRoles(searchDebounced);
      await fetchStats();
    } catch {
      toast.error('Network error cloning role');
    } finally {
      setCloningId(null);
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingRole(true);
    try {
      const res = await fetch(`${API_BASE}/role/delete/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to delete role');
        return;
      }
      toast.success(`Role "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await fetchRoles(searchDebounced);
      await fetchStats();
    } catch {
      toast.error('Network error deleting role');
    } finally {
      setDeletingRole(false);
    }
  };

  const existingNames = roles.map((r) => r.name);
  const { hasPermission, hasControl } = useAuth();
  const canEditSettings =
    hasPermission(MODULES.SETTINGS, 'edit') ||
    hasControl('manageUserPermissions');

  const statusBadge = (active: boolean) =>
    active ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
        Inactive
      </span>
    );

  // ── Skeleton rows ──
  const SkeletonRows = () => (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-[#f1f5f9] animate-pulse">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-40 bg-slate-100 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-14 bg-slate-100 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-5">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Roles',
            value: stats.totalRoles,
            icon: 'ri-shield-user-line',
            color: 'text-[#4f46e5] bg-indigo-50',
          },
          {
            label: 'Active Roles',
            value: stats.activeRoles,
            icon: 'ri-checkbox-circle-line',
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Users Assigned',
            value: stats.usersAssigned,
            icon: 'ri-team-line',
            color: 'text-amber-600 bg-amber-50',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}
            >
              <i className={`${card.icon} text-lg`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1e293b]">{card.value}</p>
              <p className="text-xs text-[#64748b]">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        {canEditSettings && (
          <button
            onClick={() => {
              setEditingRole(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            Create New Role
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {[
                  'Role Name',
                  'Description',
                  'Users Assigned',
                  'Created By',
                  'Status',
                ]
                  .concat(canEditSettings ? ['Actions'] : [])
                  .map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#94a3b8]">
                    <i className="ri-shield-user-line text-4xl block mb-2 text-slate-200" />
                    <p className="text-sm">
                      {searchDebounced
                        ? 'No roles match your search'
                        : 'No roles yet — create one!'}
                    </p>
                  </td>
                </tr>
              ) : (
                roles.map((role, idx) => (
                  <tr
                    key={role.id}
                    className={`border-b border-[#f1f5f9] hover:bg-[#fafbff] transition-colors ${idx % 2 === 1 ? 'bg-[#fafbff]' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <i className="ri-shield-user-line text-[#4f46e5] text-sm" />
                        </div>
                        <span className="font-semibold text-[#1e293b]">
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#64748b] max-w-xs">
                      <p className="truncate">{role.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#1e293b]">
                        <i className="ri-team-line text-xs" />
                        {role.usersAssigned} user
                        {role.usersAssigned !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748b] text-xs">
                      {role.createdBy}
                    </td>
                    <td className="px-4 py-3">{statusBadge(role.isActive)}</td>
                    {canEditSettings && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setModalOpen(true);
                            }}
                            title="Edit Permissions"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#4f46e5] cursor-pointer transition-colors"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          {/* Clone */}
                          <button
                            onClick={() => handleClone(role)}
                            title="Clone Role"
                            disabled={cloningId === role.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-[#64748b] cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {cloningId === role.id ? (
                              <i className="ri-loader-4-line text-sm animate-spin" />
                            ) : (
                              <i className="ri-file-copy-line text-sm" />
                            )}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (role.usersAssigned > 0) {
                                toast.error(
                                  `Cannot delete "${role.name}" — ${role.usersAssigned} user(s) assigned`,
                                );
                                return;
                              }
                              setDeleteTarget(role);
                            }}
                            title={
                              role.usersAssigned > 0
                                ? 'Cannot delete — users assigned'
                                : 'Delete Role'
                            }
                            className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                              role.usersAssigned > 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                            }`}
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Info note ── */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <i className="ri-information-line text-amber-600 text-sm mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Roles define what actions users can perform. Assign roles to users in
          the <strong>Users</strong> section. Super Admin always has full access
          regardless of role settings.
        </p>
      </div>

      {/* ── Create/Edit Modal ── */}
      <RoleModal
        open={modalOpen}
        role={editingRole}
        existingNames={existingNames}
        saving={savingRole}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditingRole(null);
        }}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deletingRole ? 'Deleting…' : 'Delete (Y)'}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
