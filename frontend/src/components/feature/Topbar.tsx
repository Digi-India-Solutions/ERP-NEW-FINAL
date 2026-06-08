import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllWarehouses, getAssignedWarehouses, getWarehousesForUser, type WarehouseResponse } from '@/api/warehouse.api';
import type { WarehouseType } from '@/types/shared';
import SignOutConfirmModal from './SignOutCOnfirmModal';
import { useWarehouseStore } from '@/stores/warehouseStore';

const breadcrumbMap: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/inventory': ['Inventory', 'All Items'],
  '/inventory/new': ['Inventory', 'Add Item'],
  '/inventory/receiving': ['Inventory', 'Stock Receiving'],
  '/inventory/stock': ['Inventory', 'Stock Summary'],
  '/inventory/transfer': ['Inventory', 'Stock Transfer'],
  '/inventory/adjustment': ['Inventory', 'Stock Adjustment'],
  '/inventory/stock-entries': ['Inventory', 'Stock Entries'],
  '/billing': ['Billing', 'All Bills'],
  '/billing/new': ['Billing', 'New Bill'],
  '/sales/invoices': ['Sales', 'Invoices'],
  '/sales/invoices/new': ['Sales', 'New Invoice'],
  '/sales/challans': ['Sales', 'Challans'],
  '/sales/returns': ['Sales', 'Returns'],
  '/purchase/orders': ['Purchase', 'Orders'],
  '/purchase/invoices': ['Purchase', 'Invoices'],
  '/purchase/invoices/new': ['Purchase', 'New Invoice'],
  '/purchase/returns': ['Purchase', 'Returns'],
  '/purchase/grn': ['Purchase', 'GRN History'],
  '/reports': ['Reports'],
  '/masters/items': ['Masters', 'Items'],
  '/masters/parties': ['Masters', 'Parties'],
  '/masters/warehouses': ['Masters', 'Warehouses'],
  '/masters/categories': ['Masters', 'Categories'],
  '/masters/company': ['Masters', 'Company'],
  '/settings': ['Settings'],
  '/users': ['Users'],
};

const TYPE_BADGE: Record<WarehouseType, { label: string; cls: string; icon: string }> = {
  OFFICE: { label: 'Office', cls: 'bg-sky-100 text-sky-700', icon: 'ri-building-line' },
  FACTORY: { label: 'Factory', cls: 'bg-amber-100 text-amber-700', icon: 'ri-building-4-line' },
  STORE: { label: 'Store', cls: 'bg-green-100 text-green-700', icon: 'ri-store-2-line' },
  GODOWN: { label: 'Godown', cls: 'bg-violet-100 text-violet-700', icon: 'ri-store-3-line' },
  BRANCH: { label: 'Branch', cls: 'bg-indigo-100 text-indigo-700', icon: 'ri-map-pin-line' },
  TRANSIT: { label: 'Transit', cls: 'bg-slate-100 text-slate-600', icon: 'ri-truck-line' },
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();
  // const [selectedWarehouseId, setSelectedWarehouseId]     = useState<string>('');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; type: WarehouseType; isPrimary?: boolean; isActive: boolean }>>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const whDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { hasControl } = useAuth();
  const canViewAll = hasControl("viewAllWarehouses");

  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await getWarehousesForUser(canViewAll);
        if (!mounted) return;
        const rows = (res.data ?? []).map((w: WarehouseResponse) => ({
          id: w.id,
          name: w.name,
          type: w.type,
          isPrimary: (w as any).is_primary ?? false,
          isActive: w.is_active,
        }));
        setWarehouses(rows);
      } catch {
        if (mounted) setWarehouses([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Determine accessible warehouses
  const accessibleWarehouses = (() => {
    if (isSuperAdmin) return warehouses.filter((w) => w.isActive);
    return warehouses.filter((w) => w.isActive);
  })();

  // Initialize selected warehouse
  useEffect(() => {
    if (accessibleWarehouses.length === 0) return;

    // ✅ Check if current selection is still valid
    const isValid = accessibleWarehouses.some(
      w => w.id === selectedWarehouseId
    );

    if (isValid) return; // keep existing

    let selected;

    // Case 1: only one
    if (accessibleWarehouses.length === 1) {
      selected = accessibleWarehouses[0];
    } else {
      // Case 2: primary
      selected = accessibleWarehouses.find(w => w.isPrimary);

      // Case 3: fallback
      if (!selected) selected = accessibleWarehouses[0];
    }

    if (selected) {
      setSelectedWarehouse(selected.id, selected.name);
    }

  }, [accessibleWarehouses, selectedWarehouseId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!whDropdownRef.current?.contains(e.target as Node)) setShowWarehouseDropdown(false);
      if (!userMenuRef.current?.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedWarehouse = accessibleWarehouses.find((w) => w.id === selectedWarehouseId);
  const selectedType = selectedWarehouse?.type as WarehouseType | undefined;
  const selectedBadge = selectedType ? TYPE_BADGE[selectedType] : null;

  const crumbs = breadcrumbMap[location.pathname] ?? ['Page'];

  // ── Real logout: call context logout then redirect ───────────────────────
  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  const userInitials = authUser?.name
    ? authUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <header className="h-[60px] bg-white border-b border-[#e2e8f0] flex items-center px-6 gap-4 shrink-0 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1">
          {crumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <div className="w-3 h-3 flex items-center justify-center">
                  <i className="ri-arrow-right-s-line text-[#64748b] text-sm" />
                </div>
              )}
              <span
                className={`text-sm font-medium whitespace-nowrap ${idx === crumbs.length - 1 ? 'text-[#1e293b]' : 'text-[#64748b]'
                  }`}
              >
                {crumb}
              </span>
            </div>
          ))}
        </div>

        {/* Warehouse selector */}
        <div className="relative" ref={whDropdownRef}>
          <button
            onClick={() => {
              setShowWarehouseDropdown((p) => !p);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] font-medium hover:border-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {selectedBadge ? (
              <div className="w-4 h-4 flex items-center justify-center">
                <i className={`${selectedBadge.icon} text-[#4f46e5] text-sm`} />
              </div>
            ) : (
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-store-3-line text-[#4f46e5] text-sm" />
              </div>
            )}
            <span className="max-w-[140px] truncate">{selectedWarehouse?.name ?? 'Select Warehouse'}</span>
            {selectedBadge && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${selectedBadge.cls}`}>
                {selectedBadge.label}
              </span>
            )}
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-down-s-line text-[#64748b] text-sm" />
            </div>
          </button>

          {showWarehouseDropdown && (
            <div className="absolute right-0 top-11 w-64 bg-white border border-[#e2e8f0] rounded-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-[#f1f5f9]">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">
                  {isSuperAdmin ? 'All Warehouses' : 'Your Assigned Warehouses'}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {accessibleWarehouses.map((wh) => {
                  const badge = TYPE_BADGE[wh.type as WarehouseType];
                  const isSelected = wh.id === selectedWarehouseId;
                  return (
                    <button
                      key={wh.id}
                      onClick={() => {
                        setSelectedWarehouse(wh.id, wh.name); // ← write to store
                        setShowWarehouseDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-[#f8fafc] transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50' : ''
                        }`}
                    >
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${badge?.cls ?? 'bg-slate-100'}`}>
                        <i className={`${badge?.icon ?? 'ri-store-3-line'} text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>
                          {wh.name}
                        </p>
                        <p className="text-[10px] text-[#94a3b8]">{badge?.label ?? wh.type}</p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          <i className="ri-check-line text-[#4f46e5] text-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {/* <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2e8f0] hover:border-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer">
          <i className="ri-notification-3-line text-[#64748b] text-base" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button> */}

        {/* User avatar */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu((p) => !p);
              setShowWarehouseDropdown(false);
            }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-[#1e293b] leading-tight">{authUser?.name ?? 'User'}</p>
              <p className="text-[10px] text-[#94a3b8] leading-tight">
                {authUser?.role === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : authUser?.role === 'SUB_ADMIN'
                    ? 'Manager'
                    : 'Staff'}
              </p>
            </div>
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-down-s-line text-[#64748b] text-sm" />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-[#e2e8f0] rounded-xl py-1 z-50">
              <div className="px-4 py-2.5 border-b border-[#e2e8f0]">
                <p className="text-sm font-semibold text-[#1e293b]">{authUser?.name ?? 'User'}</p>
                <p className="text-xs text-[#64748b]">{authUser?.email ?? ''}</p>
              </div>
              {[
                { icon: 'ri-user-3-line', label: 'My Profile', path: '/users' },
                { icon: 'ri-settings-3-line', label: 'Settings', path: '/settings' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1e293b] flex items-center gap-2 hover:bg-[#f8fafc] transition-colors cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${item.icon} text-[#64748b] text-sm`} />
                  </div>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-[#e2e8f0] mt-1">
                <button
                  onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 flex items-center gap-2 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-logout-box-r-line text-sm" />
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sign-out confirmation modal */}
      <SignOutConfirmModal
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}