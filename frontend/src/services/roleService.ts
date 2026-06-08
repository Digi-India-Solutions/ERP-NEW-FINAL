import { apiClient } from '@/api/client';
import type { Role, RolePermissions, AdditionalControls, ModuleKey } from '@/types/shared';

interface RoleApiRow {
  id: string;
  name: string;
  description: string;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
  created_by_name?: string;
  permissions?: Partial<RolePermissions>;
  additional_permissions?: Partial<AdditionalControls>;
  additional_controls?: Partial<AdditionalControls>;
  users_assigned?: number | string;
}

interface RolesApiResponse {
  success?: boolean;
  message?: string;
  data?: RoleApiRow[];
  roles?: RoleApiRow[];
}

const emptyPermissions = (): RolePermissions => ({
  dashboard: {},
  sales_invoice: {},
  sale_return: {},
  challan: {},
  purchase_order: {},
  purchase_invoice: {},
  purchase_return: {},
  stock_receiving: {},
  stock_transfer: {},
  stock_adjustment: {},
  stock_entries: {},
  grn_history: {},
  parties: {},
  items: {},
  warehouses: {},
  reports: {},
  users: {},
  settings: {},
});

const normalizePermissions = (input?: Partial<RolePermissions>): RolePermissions => {
  const base = emptyPermissions();
  if (!input || typeof input !== 'object') return base;

  const allowedKeys = Object.keys(base) as ModuleKey[];
  for (const key of allowedKeys) {
    const modulePerms = input[key];
    if (!modulePerms || typeof modulePerms !== 'object') continue;
    base[key] = {
      view: modulePerms.view === true,
      create: modulePerms.create === true,
      edit: modulePerms.edit === true,
      delete: modulePerms.delete === true,
    };
  }

  return base;
};

const normalizeAdditional = (
  input?: Partial<AdditionalControls>,
): AdditionalControls => ({
  approveStockTransfer: input?.approveStockTransfer === true,
  approveStockAdjustment: input?.approveStockAdjustment === true,
  viewAllWarehouses: input?.viewAllWarehouses === true,
  exportData: input?.exportData === true,
  viewFinancialReports: input?.viewFinancialReports === true,
  editLockedRecords: input?.editLockedRecords === true,
  convertChallan: input?.convertChallan === true,
  manageUserPermissions: input?.manageUserPermissions === true,
});

const mapRole = (row: RoleApiRow): Role => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  isSystem: false,
  isActive: typeof row.is_active === 'boolean'
    ? row.is_active
    : String(row.status || '').toLowerCase() === 'active',
  createdAt: row.created_at || new Date().toISOString(),
  createdBy: row.created_by_name || row.created_by || 'system',
  usersAssigned: Number(row.users_assigned || 0),
  permissions: normalizePermissions(row.permissions),
  additionalControls: normalizeAdditional(row.additional_controls || row.additional_permissions),
});

export const roleService = {
  getActiveRoles: async (): Promise<Role[]> => {
    const { data } = await apiClient.get<RolesApiResponse>('/api/v1/role/get-all');
    const rows = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.roles)
        ? data.roles
        : [];

    return rows.map(mapRole).filter((role) => role.isActive);
  },
};
