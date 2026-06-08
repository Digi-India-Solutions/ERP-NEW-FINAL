

import type { AppUser, ModuleKey, ModuleAction, RolePermissions } from '@/types/shared';
import type { Role } from '@/types/shared';
import type { AdditionalControls } from '@/types/shared';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

/**
 * Helper to determine if a specific additional control is active.
 * SuperAdmins get everything; otherwise, check overrides, then role defaults.
 */
const getEffectiveControl = (
  user: AppUser,
  role: Role | null,
  key: string,
): boolean => {
  if (user.isSuperAdmin) return true;
  const userOverride = user.additionalControls?.[key];
  if (userOverride !== undefined) return userOverride;
  return !!(role?.additionalControls?.[key]);
};

const ADDITIONAL_CONTROLS: Array<{
  key: keyof AdditionalControls;
  label: string;
  description: string;
  icon: string;
}> = [
  { key: 'approveStockTransfer',   label: 'Approve Stock Transfer',   description: 'Can approve pending stock transfer requests',               icon: 'ri-swap-box-line'      },
  { key: 'viewAllWarehouses',      label: 'View All Warehouses',      description: 'Access data from all warehouses regardless of assignment', icon: 'ri-store-3-line'       },
  { key: 'exportData',             label: 'Export Data',              description: 'Can export reports and data to Excel/PDF',                 icon: 'ri-download-2-line'    },
  { key: 'viewFinancialReports',   label: 'Financial Reports',        description: 'Access to P&L, balance sheet and financial summaries',     icon: 'ri-bar-chart-2-line'   },
  { key: 'approveStockAdjustment', label: 'Approve Stock Adjustment', description: 'Can approve stock adjustment entries',                     icon: 'ri-equalizer-line'     },
  { key: 'editLockedRecords',      label: 'Edit Locked Records',      description: 'Can modify records that are locked after period close',    icon: 'ri-lock-unlock-line'   },
  { key: 'convertChallan',         label: 'Convert Challan',          description: 'Can convert delivery challans to sales invoices',          icon: 'ri-file-transfer-line' },
  { key: 'manageUserPermissions',  label: 'Manage Permissions',       description: 'Can assign and modify user roles and permissions',         icon: 'ri-shield-user-line'   },
];

const MODULE_GROUPS: { group: string; modules: { key: ModuleKey; label: string; actions: ModuleAction[] }[] }[] = [
  {
    group: 'SALES',
    modules: [
      { key: 'sales_invoice', label: 'Sales Invoice', actions: ['view','create','edit','delete'] },
      { key: 'sale_return', label: 'Sale Return', actions: ['view','create','edit','delete'] },
      { key: 'challan', label: 'Delivery Challan', actions: ['view','create','edit','delete'] },
      { key: 'sales_payment', label: 'Sales Payments', actions: ['view','create'] },
    ],
  },
  {
    group: 'PURCHASE',
    modules: [
      { key: 'purchase_order', label: 'Purchase Order', actions: ['view','create','edit','delete'] },
      { key: 'purchase_invoice', label: 'Purchase Invoice', actions: ['view','create','edit','delete'] },
      { key: 'purchase_return', label: 'Purchase Return', actions: ['view','create','edit','delete'] },
      { key: 'purchase_payment', label: 'Purchase Payments', actions: ['view','create'] },
    ],
  },
  {
    group: 'INVENTORY',
    modules: [
      { key: 'stock_receiving', label: 'Stock Receiving', actions: ['view','create'] },
      { key: 'stock_transfer', label: 'Stock Transfer', actions: ['view','create','edit','delete'] },
      { key: 'stock_adjustment', label: 'Stock Adjustment', actions: ['view','create'] },
      { key: 'stock_entries', label: 'Stock Entries', actions: ['view','create'] },
      { key: 'grn_history', label: 'GRN History', actions: ['view'] },
      { key: 'gate_pass_outward', label: 'Outward Gate Pass', actions: ['view','create','edit'] },
      { key: 'gate_pass_inward', label: 'Inward Gate Pass', actions: ['view','create','edit'] },
    ],
  },
  {
    group: 'MASTERS',
    modules: [
      { key: 'parties', label: 'Parties', actions: ['view','create','edit','delete'] },
      { key: 'items', label: 'Items', actions: ['view','create','edit','delete'] },
      { key: 'warehouses', label: 'Warehouses', actions: ['view','create','edit','delete'] },
      { key: 'categories', label: 'Categories', actions: ['view','create','edit','delete'] },
      { key: 'units', label: 'Units', actions: ['view','create','edit','delete'] },
    ],
  },
  {
    group: 'REPORTS',
    modules: [
      { key: 'report_stock_summary', label: 'Stock Summary', actions: ['view'] },
      { key: 'report_stock_ledger', label: 'Stock Ledger', actions: ['view'] },
      { key: 'report_low_stock', label: 'Low Stock Alert', actions: ['view'] },
      { key: 'report_purchase_reg', label: 'Purchase Register', actions: ['view'] },
      { key: 'report_gst_purchase', label: 'GST Purchase', actions: ['view'] },
      { key: 'report_sales_reg', label: 'Sales Register', actions: ['view'] },
      { key: 'report_gst_sales', label: 'GST Sales', actions: ['view'] },
      { key: 'report_outstanding', label: 'Outstanding', actions: ['view'] },
      { key: 'report_day_book', label: 'Day Book', actions: ['view'] },
      { key: 'report_party_ledger', label: 'Party Ledger', actions: ['view'] },
    ],
  },
  {
    group: 'SYSTEM',
    modules: [
      { key: 'users', label: 'Users', actions: ['view','create','edit','delete'] },
      { key: 'settings', label: 'Settings', actions: ['view','edit'] },
    ],
  },
];

const TYPE_BADGE: Record<string, string> = {
  OFFICE:  'bg-sky-50 text-sky-700',
  FACTORY: 'bg-amber-50 text-amber-700',
  STORE:   'bg-green-50 text-green-700',
  GODOWN:  'bg-violet-50 text-violet-700',
  BRANCH:  'bg-indigo-50 text-indigo-700',
  TRANSIT: 'bg-slate-100 text-slate-600',
};

interface Props {
  user: AppUser;
  role: Role | null;
  onClose: () => void;
  onEditPermissions: () => void;
}

export default function PermissionOverviewModal({ user, role, onClose, onEditPermissions }: Props) {
  const rolePermissions = role?.permissions ?? user.rolePermissions ?? null;
  const {hasPermission, hasControl } = useAuth();
  const canEditUser = hasPermission(MODULES.USERS, 'edit') || hasControl("manageUserPermissions");

  // Determines if a permission action is manually overridden for this user
  const isOverridden = (module: ModuleKey, action: ModuleAction): boolean => {
    return user.permissionOverrides?.[module]?.[action] !== undefined;
  };

  // Determines the final permission state: SuperAdmin (always true) > Overrides > Role Defaults
  const getEffective = (module: ModuleKey, action: ModuleAction): boolean => {
    if (user.isSuperAdmin) return true;
    const override = user.permissionOverrides?.[module]?.[action];
    if (override !== undefined) return override;
    return !!(rolePermissions?.[module]?.[action]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4f46e5] flex items-center justify-center text-sm font-bold text-white uppercase">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">{user.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#64748b]">{user.email}</span>
                {user.isSuperAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-[#4f46e5]">Super Admin</span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{user.roleName}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Assigned Warehouses */}
          <div>
            <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Assigned Warehouses</h4>
            {user.isSuperAdmin ? (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <i className="ri-shield-star-line text-[#4f46e5]" />
                <span className="text-sm text-[#4f46e5] font-medium">Super Admin — access to all warehouses</span>
              </div>
            ) : user.assignedWarehouses.length === 0 ? (
              <p className="text-sm text-[#94a3b8] italic">No warehouses assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.assignedWarehouses.map((wh) => (
                  <div key={wh.warehouseId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE[wh.warehouseType] ?? 'bg-slate-100 text-slate-600'}`}>
                      {wh.warehouseType}
                    </span>
                    <span className="text-sm text-[#1e293b] font-medium">{wh.warehouseName}</span>
                    {wh.isPrimary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module Permissions Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Module Permissions</h4>
              {!user.isSuperAdmin && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#4f46e5]/70" />
                    <span className="text-[10px] text-[#64748b]">Role default</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#4f46e5]" />
                    <span className="text-[10px] text-[#64748b]">Custom override</span>
                  </div>
                </div>
              )}
            </div>
            
            {user.isSuperAdmin ? (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <i className="ri-shield-star-line text-[#4f46e5]" />
                <span className="text-sm text-[#4f46e5] font-medium">Super Admin — full access to all modules</span>
              </div>
            ) : (
              <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748b] uppercase tracking-wide">Module</th>
                      {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((a) => (
                        <th key={a} className="text-center px-3 py-2.5 font-semibold text-[#64748b] uppercase tracking-wide w-16">{a}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_GROUPS.map((group) => (
                      <React.Fragment key={group.group}>
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="px-4 py-1.5 text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-y border-[#f1f5f9]">
                            {group.group}
                          </td>
                        </tr>
                        {group.modules.map((mod) => (
                          <tr key={mod.key} className="border-b border-[#f1f5f9] hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-[#1e293b] font-medium">{mod.label}</td>
                            {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((action) => {
                              const hasAction = mod.actions.includes(action);
                              const checked = hasAction ? getEffective(mod.key, action) : false;
                              const overridden = hasAction ? isOverridden(mod.key, action) : false;
                              
                              return (
                                <td key={action} className="text-center px-3 py-2.5">
                                  {hasAction ? (
                                    <div className="flex justify-center">
                                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                        checked
                                          ? overridden
                                            ? 'bg-[#4f46e5] shadow-sm' // Solid color for override
                                            : 'bg-[#4f46e5]/60'        // Faded color for role default
                                          : 'bg-slate-100 border border-slate-200'
                                      }`}>
                                        {checked && <i className="ri-check-line text-white text-[10px] font-bold" />}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[#e2e8f0]">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Additional Access Controls Section */}
          {!user.isSuperAdmin && (
            <div>
              <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Additional Access Controls</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADDITIONAL_CONTROLS.map((ctrl) => {
                  const enabled = getEffectiveControl(user, role, ctrl.key);
                  const isOverridden = user.additionalControls?.[ctrl.key] !== undefined;
                  
                  return (
                    <div
                      key={ctrl.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        enabled
                          ? 'border-[#4f46e5]/40 bg-indigo-50/50'
                          : 'border-[#e2e8f0] bg-white grayscale opacity-60'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        enabled ? 'bg-[#4f46e5] text-white shadow-sm' : 'bg-slate-100 text-[#94a3b8]'
                      }`}>
                        <i className={`${ctrl.icon} text-lg`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${enabled ? 'text-[#4f46e5]' : 'text-[#64748b]'}`}>
                            {ctrl.label}
                          </p>
                          {isOverridden && (
                            <span className="text-[8px] font-black bg-[#4f46e5] text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#64748b] leading-tight mt-0.5">{ctrl.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        enabled ? 'bg-[#4f46e5] border-[#4f46e5]' : 'border-slate-200'
                      }`}>
                        {enabled && <i className="ri-check-line text-white text-[10px] font-bold" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-slate-50/50 shrink-0">
          <button 
            onClick={onClose} 
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-white hover:text-[#1e293b] hover:border-[#cbd5e1] transition-all cursor-pointer whitespace-nowrap bg-white shadow-sm"
          >
            Close
          </button>
          {!user.isSuperAdmin && canEditUser && (
            <button
              onClick={onEditPermissions}
              className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] hover:shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <i className="ri-edit-line text-sm" />
              Edit Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
