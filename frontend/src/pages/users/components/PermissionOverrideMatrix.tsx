import type { ModuleKey, ModuleAction, RolePermissions } from '@/types/shared';

const MODULE_GROUPS: { label: string; modules: { key: ModuleKey; label: string; actions: ModuleAction[] }[] }[] = [
  {
    label: 'Sales',
    modules: [
      { key: 'sales_invoice', label: 'Sales Invoice', actions: ['view','create','edit','delete'] },
      { key: 'sale_return', label: 'Sale Return', actions: ['view','create','edit','delete'] },
      { key: 'challan', label: 'Delivery Challan', actions: ['view','create','edit','delete'] },
      { key: 'sales_payment', label: 'Sales Payments', actions: ['view','create'] },
    ],
  },
  {
    label: 'Purchase',
    modules: [
      { key: 'purchase_order', label: 'Purchase Order', actions: ['view','create','edit','delete'] },
      { key: 'purchase_invoice', label: 'Purchase Invoice', actions: ['view','create','edit','delete'] },
      { key: 'purchase_return', label: 'Purchase Return', actions: ['view','create','edit','delete'] },
      { key: 'purchase_payment', label: 'Purchase Payments', actions: ['view','create'] },
      { key: 'grn_history', label: 'GRN History', actions: ['view'] },
    ],
  },
  {
    label: 'Inventory',
    modules: [
      { key: 'stock_receiving', label: 'Stock Receiving', actions: ['view','create'] },
      { key: 'stock_transfer', label: 'Stock Transfer', actions: ['view','create','edit','delete'] },
      { key: 'stock_adjustment', label: 'Stock Adjustment', actions: ['view','create'] },
      { key: 'stock_entries', label: 'Stock Entries', actions: ['view','create'] },
      { key: 'gate_pass_outward', label: 'Outward Gate Pass', actions: ['view','create','edit'] },
      { key: 'gate_pass_inward', label: 'Inward Gate Pass', actions: ['view','create','edit'] },
    ],
  },
  {
    label: 'Masters',
    modules: [
      { key: 'parties', label: 'Parties', actions: ['view','create','edit','delete'] },
      { key: 'items', label: 'Items', actions: ['view','create','edit','delete'] },
      { key: 'warehouses', label: 'Warehouses', actions: ['view','create','edit','delete'] },
      { key: 'categories', label: 'Categories', actions: ['view','create','edit','delete'] },
      { key: 'units', label: 'Units', actions: ['view','create','edit','delete'] },
    ],
  },
  {
    label: 'Reports',
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
    label: 'System',
    modules: [
      { key: 'users', label: 'Users', actions: ['view','create','edit','delete'] },
      { key: 'settings', label: 'Settings', actions: ['view','edit'] },
    ],
  },
];

// Plain flat permissions — no override concept
type Permissions = Partial<Record<ModuleKey, Partial<Record<ModuleAction, boolean>>>>;

interface Props {
  permissions: Permissions;
  onChange: (permissions: Permissions) => void;
  onClear: () => void;
}

export default function PermissionMatrix({ permissions, onChange, onClear }: Props) {
  const get = (module: ModuleKey, action: ModuleAction): boolean =>
    permissions[module]?.[action] === true;

  const toggle = (module: ModuleKey, action: ModuleAction) => {
    const newVal = !get(module, action);
    const modPerms = { ...permissions[module], [action]: newVal };

    // If turning off view, turn off everything else in that module too
    if (action === 'view' && !newVal) {
      const mod = MODULE_GROUPS.flatMap(g => g.modules).find(m => m.key === module);
      mod?.actions.forEach(a => { modPerms[a] = false; });
    }

    // If turning on any non-view action, ensure view is also on
    if (action !== 'view' && newVal) {
      modPerms.view = true;
    }

    const next = { ...permissions, [module]: modPerms };
    onChange(next);
  };

  const selectAllGroup = (group: typeof MODULE_GROUPS[number]) => {
    const next = { ...permissions };
    group.modules.forEach((mod) => {
      const modPerms: Partial<Record<ModuleAction, boolean>> = {};
      mod.actions.forEach(a => { modPerms[a] = true; });
      next[mod.key] = modPerms;
    });
    onChange(next);
  };

  const clearGroup = (group: typeof MODULE_GROUPS[number]) => {
    const next = { ...permissions };
    group.modules.forEach((mod) => {
      next[mod.key] = {};
    });
    onChange(next);
  };

  const isGroupFullySelected = (group: typeof MODULE_GROUPS[number]): boolean =>
    group.modules.every(mod => mod.actions.every(a => get(mod.key, a)));

  const hasAny = Object.values(permissions).some(
    m => m && Object.values(m).some(Boolean)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748b]">
          Check the permissions this user should have. Changes are saved directly.
        </p>
        {hasAny && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
          >
            <i className="ri-close-circle-line text-xs" />
            Clear All
          </button>
        )}
      </div>

      <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <th className="text-left px-3 py-2 font-semibold text-[#64748b] uppercase tracking-wide">Module</th>
              {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((a) => (
                <th key={a} className="text-center px-3 py-2 font-semibold text-[#64748b] uppercase tracking-wide w-16">{a}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {MODULE_GROUPS.map((group) => {
              const fullySelected = isGroupFullySelected(group);
              return (
                <>
                  <tr key={group.label} className="bg-[#f1f5f9]">
                    <td className="px-3 py-1.5 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                      {group.label}
                    </td>
                    <td colSpan={4} />
                    
                  </tr>
                  {group.modules.map((mod) => (
                    <tr key={mod.key} className="border-b border-[#f1f5f9] hover:bg-[#fafbff]">
                      <td className="px-3 py-2 text-[#1e293b] font-medium">{mod.label}</td>
                      {(['view', 'create', 'edit', 'delete'] as ModuleAction[]).map((action) => {
                        const hasAction = mod.actions.includes(action);
                        const checked = hasAction ? get(mod.key, action) : false;
                        return (
                          <td key={action} className="text-center px-3 py-2">
                            {hasAction ? (
                              <button
                                type="button"
                                onClick={() => toggle(mod.key, action)}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center mx-auto cursor-pointer transition-all ${
                                  checked
                                    ? 'bg-[#4f46e5] border-[#4f46e5]'
                                    : 'border-[#e2e8f0] bg-white hover:border-[#4f46e5]/50'
                                }`}
                              >
                                {checked && <i className="ri-check-line text-white text-[9px]" />}
                              </button>
                            ) : (
                              <span className="text-[#e2e8f0]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td />
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}