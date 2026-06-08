import { useState, useEffect } from 'react';
import type { Role, ModuleKey, ModuleAction, RolePermissions, AdditionalControls } from '@/types/shared';

/* ─── Module definitions ─────────────────────────────────────────────────── */
interface ModuleDef {
  key: ModuleKey;
  label: string;
  actions: ModuleAction[];
}

interface ModuleGroup {
  group: string;
  modules: ModuleDef[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: 'SALES',
    modules: [
      { key: 'sales_invoice', label: 'Sales Invoice', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'sale_return',   label: 'Sale Return',   actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'challan',       label: 'Delivery Challan', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'sales_payment', label: 'Sales Payments', actions: ['view', 'create'] },
    ],
  },
  {
    group: 'PURCHASE',
    modules: [
      { key: 'purchase_order',   label: 'Purchase Order',   actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'purchase_invoice', label: 'Purchase Invoice', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'purchase_return',  label: 'Purchase Return',  actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'grn_history',      label: 'GRN History',      actions: ['view'] },
      { key: 'purchase_payment', label: 'Purchase Payments', actions: ['view', 'create'] },

    ],
  },
  {
    group: 'INVENTORY',
    modules: [
      { key: 'stock_receiving',  label: 'Stock Receiving',  actions: ['view', 'create'] },
      { key: 'stock_transfer',   label: 'Stock Transfer',   actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'stock_adjustment', label: 'Stock Adjustment', actions: ['view', 'create'] },
      { key: 'stock_entries',    label: 'Stock Entries',    actions: ['view', 'create'] },
      { key: 'gate_pass_outward', label: 'Outward Gate Pass', actions: ['view', 'create', 'edit'] },
      { key: 'gate_pass_inward',  label: 'Inward Gate Pass',  actions: ['view', 'create', 'edit'] },

    ],
  },
  {
    group: 'MASTERS',
    modules: [
      { key: 'parties',    label: 'Parties',    actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'items',      label: 'Items',      actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'warehouses', label: 'Warehouses', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'categories', label: 'Categories & Units', actions: ['view', 'create', 'edit', 'delete'] },
      


    ],
  },
  {
  group: 'REPORTS',
  modules: [
    { key: 'report_stock_summary',  label: 'Stock Summary',   actions: ['view'] },
    { key: 'report_stock_ledger',   label: 'Stock Ledger',    actions: ['view'] },
    { key: 'report_low_stock',      label: 'Low Stock Alert', actions: ['view'] },
    { key: 'report_purchase_reg',   label: 'Purchase Register', actions: ['view'] },
    { key: 'report_gst_purchase',   label: 'GST Purchase',    actions: ['view'] },
    { key: 'report_sales_reg',      label: 'Sales Register',  actions: ['view'] },
    { key: 'report_gst_sales',      label: 'GST Sales (GSTR-1)', actions: ['view'] },
    { key: 'report_outstanding',    label: 'Outstanding',     actions: ['view'] },
    { key: 'report_day_book',       label: 'Day Book',        actions: ['view'] },
    { key: 'report_party_ledger',   label: 'Party Ledger',    actions: ['view'] },
  ],
},

  {
    group: 'SYSTEM',
    modules: [
      { key: 'users',    label: 'Users',    actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
    ],
  },
];

const ADDITIONAL_CONTROLS: Array<{
  key: keyof AdditionalControls;
  label: string;
  description: string;
  icon: string;
}> = [
  { key: 'approveStockTransfer',   label: 'Approve Stock Transfer',  description: 'Can approve pending stock transfer requests',                icon: 'ri-swap-box-line'      },
  { key: 'viewAllWarehouses',      label: 'View All Warehouses',     description: 'Access data from all warehouses regardless of assignment',   icon: 'ri-store-3-line'       },
  { key: 'exportData',             label: 'Export Data',             description: 'Can export reports and data to Excel/PDF',                   icon: 'ri-download-2-line'    },
  { key: 'viewFinancialReports',   label: 'Financial Reports',       description: 'Access to P&L, balance sheet and financial summaries',       icon: 'ri-bar-chart-2-line'   },
  { key: 'approveStockAdjustment', label: 'Approve Stock Adjustment',description: 'Can approve stock adjustment entries',                       icon: 'ri-equalizer-line'     },
  { key: 'editLockedRecords',      label: 'Edit Locked Records',     description: 'Can modify records that are locked after period close',      icon: 'ri-lock-unlock-line'   },
  { key: 'convertChallan',         label: 'Convert Challan',         description: 'Can convert delivery challans to sales invoices',           icon: 'ri-file-transfer-line' },
  { key: 'manageUserPermissions',  label: 'Manage Permissions',      description: 'Can assign and modify user roles and permissions',           icon: 'ri-shield-user-line'   },
];

/* ─── Empty defaults ─────────────────────────────────────────────────────── */
function buildEmptyPermissions(): RolePermissions {
  const perms: Partial<RolePermissions> = {};
  MODULE_GROUPS.forEach((g) =>
    g.modules.forEach((m) => {
      const p: Record<string, boolean> = {};
      m.actions.forEach((a) => { p[a] = false; });
      perms[m.key] = p;
    })
  );
  return perms as RolePermissions;
}

function buildEmptyControls(): AdditionalControls {
  return {
    approveStockTransfer: false, approveStockAdjustment: false,
    viewAllWarehouses: false,    exportData: false,
    viewFinancialReports: false, editLockedRecords: false,
    convertChallan: false,       manageUserPermissions: false,
  };
}

/* ─── Merge incoming permissions safely (backend may have partial data) ─── */
function mergePermissions(incoming: any): RolePermissions {
  const base = buildEmptyPermissions();
  if (!incoming || typeof incoming !== 'object') return base;
  const merged = { ...base };
  Object.keys(incoming).forEach((key) => {
    if (merged[key as ModuleKey] !== undefined) {
      merged[key as ModuleKey] = { ...merged[key as ModuleKey], ...incoming[key] };
    }
  });
  return merged;
}

function mergeControls(incoming: any): AdditionalControls {
  return { ...buildEmptyControls(), ...(incoming || {}) };
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface RoleModalProps {
  open: boolean;
  role: Role | null;
  existingNames: string[];
  saving?: boolean;
  onSave: (data: Omit<Role, 'id' | 'createdAt' | 'usersAssigned'>) => void;
  onClose: () => void;
}

export default function RoleModal({ open, role, existingNames, saving = false, onSave, onClose }: RoleModalProps) {
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive]     = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(buildEmptyPermissions());
  const [controls, setControls]     = useState<AdditionalControls>(buildEmptyControls());
  const [nameError, setNameError]   = useState('');

  useEffect(() => {
    if (!open) return;
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setIsActive(role.isActive);
      setPermissions(mergePermissions(role.permissions));
      setControls(mergeControls(role.additionalControls));
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
      setPermissions(buildEmptyPermissions());
      setControls(buildEmptyControls());
    }
    setNameError('');
  }, [open, role]);

  if (!open) return null;

  /* ─── Permission logic ────────────────────────────────────────────────── */
  const togglePermission = (moduleKey: ModuleKey, action: ModuleAction, value: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev, [moduleKey]: { ...prev[moduleKey] } };
      updated[moduleKey][action] = value;
      if (action === 'view' && !value) {
        (['create', 'edit', 'delete'] as ModuleAction[]).forEach((a) => {
          if (updated[moduleKey][a] !== undefined) updated[moduleKey][a] = false;
        });
      }
      if (action !== 'view' && value) updated[moduleKey].view = true;
      return updated;
    });
  };

  const toggleGroupAll = (group: ModuleGroup, checked: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      group.modules.forEach((m) => {
        const p: Record<string, boolean> = {};
        m.actions.forEach((a) => { p[a] = checked; });
        updated[m.key] = p;
      });
      return updated;
    });
  };

  const isGroupAllChecked = (group: ModuleGroup) =>
    group.modules.every((m) => m.actions.every((a) => permissions[m.key]?.[a] === true));

  /* ─── Save ────────────────────────────────────────────────────────────── */
  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError('Role name is required'); return; }
    const isDuplicate = existingNames
      .filter((n) => !role || n !== role.name)
      .some((n) => n.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) { setNameError('A role with this name already exists'); return; }

    onSave({
      name:               trimmed,
      description:        description.trim(),
      isSystem:           false,
      isActive,
      createdBy:          role?.createdBy ?? 'Admin User',
      permissions,
      additionalControls: controls,
    });
  };

  const fieldCls = 'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]';
  const labelCls = 'block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">
              {role ? 'Edit Role' : 'Create New Role'}
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              {role ? `Editing permissions for "${role.name}"` : 'Define a new role with custom module permissions'}
            </p>
          </div>
          <button
            onClick={saving ? undefined : onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-[#64748b] cursor-pointer disabled:opacity-50"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Role Details */}
          <div className="bg-[#f8fafc] rounded-xl p-5 border border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
              <i className="ri-shield-user-line text-[#4f46e5]" />
              Role Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  placeholder="e.g. Sales Manager"
                  className={`${fieldCls} ${nameError ? 'border-red-400' : ''}`}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className={labelCls}>Status</label>
                  <button
                    type="button"
                    onClick={() => setIsActive((v) => !v)}
                    className={`flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-[#e2e8f0] bg-white text-[#64748b]'
                    }`}
                  >
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    {isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this role's responsibilities"
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Module Permissions */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-2">
              <i className="ri-lock-2-line text-[#4f46e5]" />
              <h3 className="text-sm font-semibold text-[#1e293b]">Module Permissions</h3>
              <span className="text-xs text-[#64748b] ml-1">— Checking Create/Edit/Delete auto-enables View</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide w-56">Module</th>
                  {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((a) => (
                    <th key={a} className="text-center px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide w-24 capitalize">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map((group) => {
                  const allChecked = isGroupAllChecked(group);
                  return (
                    <>
                      <tr key={`grp-${group.group}`} className="bg-slate-50 border-b border-[#e2e8f0]">
                        <td colSpan={5} className="px-5 py-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest">{group.group}</span>
                            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={(e) => toggleGroupAll(group, e.target.checked)}
                                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                              />
                              <span className="text-xs text-[#64748b]">Select All</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                      {group.modules.map((mod, idx) => (
                        <tr key={mod.key} className={`border-b border-[#f1f5f9] ${idx % 2 === 1 ? 'bg-[#fafbff]' : 'bg-white'}`}>
                          <td className="px-5 py-3 text-sm text-[#1e293b] font-medium">{mod.label}</td>
                          {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((action) => {
                            const hasAction = mod.actions.includes(action);
                            const checked   = permissions[mod.key]?.[action] === true;
                            return (
                              <td key={action} className="text-center px-4 py-3">
                                {hasAction ? (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => togglePermission(mod.key, action, e.target.checked)}
                                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-slate-200 text-lg">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 3: Additional Access Controls */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-2">
              <i className="ri-settings-4-line text-[#4f46e5]" />
              <h3 className="text-sm font-semibold text-[#1e293b]">Additional Access Controls</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {ADDITIONAL_CONTROLS.map((ctrl) => {
                const enabled = controls[ctrl.key];
                return (
                  <button
                    key={ctrl.key}
                    type="button"
                    onClick={() => setControls((prev) => ({ ...prev, [ctrl.key]: !prev[ctrl.key] }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      enabled
                        ? 'border-[#4f46e5]/40 bg-indigo-50/60'
                        : 'border-[#e2e8f0] bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enabled ? 'bg-[#4f46e5] text-white' : 'bg-slate-100 text-[#64748b]'}`}>
                      <i className={`${ctrl.icon} text-base`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${enabled ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>{ctrl.label}</p>
                      <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{ctrl.description}</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-[#4f46e5]' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-5 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
          >
            {saving
              ? <><i className="ri-loader-4-line animate-spin" />{role ? 'Updating…' : 'Creating…'}</>
              : <><i className="ri-save-line" />{role ? 'Update Role' : 'Create Role'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}