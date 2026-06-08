import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import PartyForm, { type PartyFormData } from './components/PartyForm';
import { formatINR } from '@/utils/format';
import { useToast } from '@/contexts/ToastContext';
import { useDebounce } from '@/utils/debounce';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouseStore } from '@/stores/warehouseStore';
import {
  createParty,
  updateParty,
  deleteParty,
  filterParties,
  fromDBType,
  type PartyResponse,
  type PartyPayload,
  type FilterPartiesParams,
} from '@/api/party.api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PartyType = 'customer' | 'supplier' | 'both';

interface Party extends PartyFormData {
  id: string;
  balance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapApiToParty(p: PartyResponse): Party {
  return {
    id: p.id,
    name: p.name,
    type: fromDBType(p.type),
    gstin: p.gstin ?? '',
    pan: p.pan ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    city: p.city ?? '',
    billingAddress: p.billing_address ?? '',
    shippingAddress: p.shipping_address ?? '',
    stateCode: p.state_code ?? '',
    stateName: p.state_name ?? '',
    creditLimit: p.credit_limit ?? 0,
    creditDays: p.credit_days ?? 0,
    openingBalance: p.opening_balance ?? 0,
    isActive: p.is_active,
    warehouseId: p.warehouse_id ?? '',
    warehouseName: p.warehouse_name ?? '',
    balance:
      (p as unknown as { balance?: number }).balance ?? p.opening_balance ?? 0,
  };
}

function mapFormToPayload(form: PartyFormData): PartyPayload {
  return {
    name: form.name,
    type: form.type,
    isRegistered: !!form.gstin,
    gstin: form.gstin || undefined,
    pan: form.pan || undefined,
    billingAddress: form.billingAddress || undefined,
    shippingAddress: form.shippingAddress || undefined,
    stateCode: form.stateCode || undefined,
    stateName: form.stateName || undefined,
    city: form.city || undefined,
    creditLimit: form.creditLimit,
    creditDays: form.creditDays,
    openingBalance: form.openingBalance,
    mobile: form.phone || undefined,
    email: form.email || undefined,
    isActive: form.isActive,
    warehouseId: form.warehouseId || undefined,
    warehouseName: form.warehouseName || undefined,
  };
}

// ─── Badge / label helpers ────────────────────────────────────────────────────

const TYPE_BADGE_CLS: Record<PartyType, string> = {
  customer: 'bg-green-100  text-green-700',
  supplier: 'bg-amber-100  text-amber-700',
  both: 'bg-indigo-100 text-[#4f46e5]',
};

const TYPE_LABEL: Record<PartyType, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  both: 'Both',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartiesPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { hasPermission } = useAuth();

  // FIX: subscribe to global warehouse store so fetch auto-reruns when
  // Topbar warehouse changes (same pattern as ItemsPage)
  const { selectedWarehouseId } = useWarehouseStore();

  const canCreateParty = hasPermission(MODULES.PARTIES, 'create');
  const canEditParty = hasPermission(MODULES.PARTIES, 'edit');
  const canDeleteParty = hasPermission(MODULES.PARTIES, 'delete');

  // ── Data & loading ─────────────────────────────────────────────────────────
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Search & filters ───────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [filterType, setFilterType] = useState<'ALL' | PartyType>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // ── Drawer / modal state ───────────────────────────────────────────────────
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Party | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  // FIX: toastError added to deps (was missing, causing stale closure).
  // FIX: lastFetchKey dedup ref removed — it was preventing refetch after
  //      save/delete when params hadn't changed. React batching handles dedup.
  const fetchParties = useCallback(async (params: FilterPartiesParams = {}) => {
    setIsLoading(true);
    try {
      const res = await filterParties(params);
      if (res.success && res.data) {
        setParties(res.data.map(mapApiToParty));
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to load parties');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  // FIX: selectedWarehouseId added as dep so switching warehouse in Topbar
  // automatically refetches parties scoped to that warehouse.
  useEffect(() => {
    const params: FilterPartiesParams = {};
    if (search.trim()) params.search = search.trim();
    if (filterType !== 'ALL') params.type = filterType;
    if (filterActive === 'ACTIVE') params.isActive = true;
    if (filterActive === 'INACTIVE') params.isActive = false;
    if (selectedWarehouseId) params.warehouse_id = selectedWarehouseId;
    void fetchParties(params);
  }, [search, filterType, filterActive, selectedWarehouseId, fetchParties]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  // FIX: wrapped in useMemo — was recomputed on every render
  const stats = useMemo(() => ({
    total: parties.length,
    customers: parties.filter((p) => p.type === 'customer').length,
    suppliers: parties.filter((p) => p.type === 'supplier').length,
  }), [parties]);

  // ── Drawer helpers ─────────────────────────────────────────────────────────
  const openAdd = () => { setEditingParty(null); setSlideOpen(true); };
  const openEdit = (p: Party) => { setEditingParty(p); setSlideOpen(true); };

  // FIX: closeDrawer is stable — used in handleSave below
  const closeDrawer = useCallback(() => setSlideOpen(false), []);

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = useCallback(async (data: PartyFormData) => {
    const payload = mapFormToPayload(data);

    if (editingParty) {
      const res = await updateParty(editingParty.id, payload);
      if (res.success && res.data) {
        const updated = mapApiToParty(res.data);
        setParties((prev) => prev.map((p) => (p.id === editingParty.id ? updated : p)));
        success('Party updated successfully');
        closeDrawer();
      }
    } else {
      const res = await createParty(payload);
      if (res.success && res.data) {
        setParties((prev) => [mapApiToParty(res.data), ...prev]);
        success('Party added successfully');
        closeDrawer();
      }
    }
    // Throws bubble up to PartyForm.handleSave → shows red error banner
  }, [editingParty, success, closeDrawer]);

  // ── Toggle active (optimistic) ─────────────────────────────────────────────
  const toggleActive = useCallback(async (p: Party) => {
    setParties((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await updateParty(p.id, { isActive: !p.isActive });
      success(`${p.name} ${p.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      // Roll back
      setParties((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: p.isActive } : x)),
      );
      toastError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, [success, toastError]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteParty(deleteConfirm.id);
      setParties((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
      success('Party removed');
      setDeleteConfirm(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete party');
    } finally {
      setIsDeleting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Parties</h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Manage customers, suppliers and contacts
              </p>
            </div>
          </div>
          {canCreateParty && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> Add Party
            </button>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: 'Total Parties', value: stats.total, icon: 'ri-group-2-line', color: 'indigo' },
            { label: 'Customers', value: stats.customers, icon: 'ri-user-heart-line', color: 'green' },
            { label: 'Suppliers', value: stats.suppliers, icon: 'ri-truck-line', color: 'amber' },
          ] as const).map((c) => (
            <div key={c.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.color === 'indigo' ? 'bg-indigo-50'
                : c.color === 'green' ? 'bg-green-50'
                  : 'bg-amber-50'
                }`}>
                <i className={`${c.icon} text-lg ${c.color === 'indigo' ? 'text-[#4f46e5]'
                  : c.color === 'green' ? 'text-green-600'
                    : 'text-amber-600'
                  }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{c.value}</p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Warehouse indicator ── */}
        {selectedWarehouseId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium">
            <i className="ri-store-3-line text-indigo-500" />
            Showing parties for the warehouse selected in the top bar.
            Switch the selection above to view other warehouses.
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, GSTIN or phone..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
            />
          </div>

          {/* Type pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {(['ALL', 'customer', 'supplier', 'both'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${filterType === t
                  ? 'bg-white text-[#1e293b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
              >
                {t === 'ALL' ? 'All Types' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {/* Active pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterActive(s)}
                className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${filterActive === s
                  ? 'bg-white text-[#1e293b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  {['Party Name', 'Type', 'GSTIN', 'Phone', 'State', 'Credit Limit', 'Balance', 'Status', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>

                {/* Loading skeleton */}
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f1f5f9]">
                      {/* FIX: 9 cells to match 9 columns */}
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Data rows */}
                {!isLoading &&
                  parties.map((party, idx) => (
                    <tr
                      key={party.id}
                      className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''
                        }`}
                    >
                      {/* Name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 shrink-0">
                            <span className="text-[10px] font-bold text-[#4f46e5]">
                              {party.name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1e293b] whitespace-nowrap">{party.name}</p>
                            {party.email && (
                              <p className="text-xs text-[#94a3b8]">{party.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE_CLS[party.type]}`}>
                          {TYPE_LABEL[party.type]}
                        </span>
                      </td>

                      {/* GSTIN */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#64748b]">
                          {party.gstin || '—'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                        {party.phone || '—'}
                      </td>

                      {/* State */}
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
                        {party.stateName || (party.stateCode ? `Code: ${party.stateCode}` : '—')}
                      </td>

                      {/* Credit Limit */}
                      <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">
                        {formatINR(party.creditLimit)}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold text-sm ${party.balance > 0 ? 'text-green-600'
                          : party.balance < 0 ? 'text-red-500'
                            : 'text-[#94a3b8]'
                          }`}>
                          {party.balance >= 0 ? '+' : ''}
                          {formatINR(Math.abs(party.balance))}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEditParty ? (
                          <button
                            type="button"
                            onClick={() => void toggleActive(party)}
                            title={party.isActive ? 'Click to deactivate' : 'Click to activate'}
                            aria-label={party.isActive ? `Deactivate ${party.name}` : `Activate ${party.name}`}
                            // FIX: removed stray data-nav-index={3} that had no meaning here
                            className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40 ${party.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                              }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${party.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}>
                              <i className={`text-[8px] ${party.isActive ? 'ri-check-line text-[#4f46e5]' : 'ri-close-line text-[#94a3b8]'
                                }`} />
                            </span>
                          </button>
                        ) : (
                          // Read-only badge when user can't edit
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${party.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${party.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                            {party.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>

                      {/* Edit / Delete */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {canEditParty && (
                            <button
                              onClick={() => openEdit(party)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <i className="ri-edit-line text-sm" />
                            </button>
                          )}
                          {canDeleteParty && (
                            <button
                              onClick={() => setDeleteConfirm(party)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Empty state */}
                {!isLoading && parties.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <i className="ri-group-2-line text-4xl text-[#e2e8f0] block mb-2" />
                      <p className="text-[#94a3b8] text-sm">No parties found</p>
                      {searchInput && (
                        <p className="text-xs text-[#94a3b8] mt-1">
                          Try a different search term
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Row count — hidden during loading to avoid showing stale count */}
          {!isLoading && (
            <div className="px-4 py-3 border-t border-[#e2e8f0]">
              <p className="text-xs text-[#94a3b8]">
                Showing {parties.length} {parties.length === 1 ? 'party' : 'parties'}
                {selectedWarehouseId ? ' for selected warehouse' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over form */}
      <PartyForm
        open={slideOpen}
        isEditing={!!editingParty}
        initialData={editingParty ?? undefined}
        onClose={closeDrawer}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Party"
        message={`Remove "${deleteConfirm?.name}"? This cannot be undone.`}
        variant="danger"
        confirmLabel={isDeleting ? 'Removing...' : 'Yes, Remove (Y)'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}