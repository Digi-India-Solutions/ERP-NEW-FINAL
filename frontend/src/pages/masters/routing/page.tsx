import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { mockRoutings, mockItems, type MockRouting, type MockRoutingStage } from '@/mocks/masters';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';

function formatMinutes(total: number) {
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hrs`;
  return `${hrs} hrs ${mins} min`;
}

const STATUS_BADGE: Record<string, { cls: string; dot: string }> = {
  ACTIVE: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  OBSOLETE: { cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const activeItems = mockItems.filter((i) => i.isActive);

export default function RoutingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [routings, setRoutings] = useState<MockRouting[]>([...mockRoutings]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'OBSOLETE'>('ALL');
  const [itemFilter, setItemFilter] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<MockRouting | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return routings.filter((r) => {
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.itemName && r.itemName.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchItem = itemFilter === 'ALL' || r.itemId === itemFilter || (itemFilter === 'NONE' && !r.itemId);
      return matchSearch && matchStatus && matchItem;
    });
  }, [routings, search, statusFilter, itemFilter]);

  const stats = useMemo(() => {
    const total = routings.length;
    const active = routings.filter((r) => r.status === 'ACTIVE').length;
    const draft = routings.filter((r) => r.status === 'DRAFT').length;
    const obsolete = routings.filter((r) => r.status === 'OBSOLETE').length;
    const totalTime = routings.reduce((sum, r) => sum + r.totalTimeMinutes, 0);
    return { total, active, draft, obsolete, totalTime };
  }, [routings]);

  const handleDuplicate = (routing: MockRouting) => {
    const newStages: MockRoutingStage[] = routing.stages.map((s, idx) => ({
      ...s,
      id: `rs-${Date.now()}-${idx}`,
      stageNumber: idx + 1,
    }));
    const newRouting: MockRouting = {
      ...routing,
      id: `rt-${Date.now()}`,
      code: `${routing.code}-COPY`,
      name: `${routing.name} (Copy)`,
      status: 'DRAFT',
      version: routing.version,
      stages: newStages,
      totalTimeMinutes: routing.totalTimeMinutes,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setRoutings((prev) => [newRouting, ...prev]);
    toast.success(`"${routing.name}" duplicated successfully`);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    setRoutings((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
    toast.success(`"${deleteConfirm.name}" deleted`);
    setDeleteConfirm(null);
  };

  const hasFilters = search || statusFilter !== 'ALL' || itemFilter !== 'ALL';

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Routing Master</h2>
              <p className="text-sm text-[#64748b] mt-0.5">Define production stage sequences for items</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/masters/routing/new')}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" /> New Routing
          </button>
        </div>

        {/* Stats */}
        <MasterStatsRow
          gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          valueClassName="text-lg"
          stats={[
            { label: 'Total Routings', value: stats.total, icon: 'ri-git-branch-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
            { label: 'Active', value: stats.active, icon: 'ri-checkbox-circle-line', bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Draft', value: stats.draft, icon: 'ri-draft-line', bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Obsolete', value: stats.obsolete, icon: 'ri-archive-line', bg: 'bg-slate-100', color: 'text-slate-500' },
            { label: 'Total Time', value: formatMinutes(stats.totalTime), icon: 'ri-time-line', bg: 'bg-blue-50', color: 'text-blue-600' },
          ]}
        />

        {/* Filters */}
        <MasterFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or code..."
          filters={[
            {
              value: statusFilter,
              onChange: (val) => setStatusFilter(val),
              options: [
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'OBSOLETE', label: 'Obsolete' },
              ],
            },
            {
              value: itemFilter,
              onChange: (val) => setItemFilter(val),
              options: [
                { value: 'ALL', label: 'All Items' },
                { value: 'NONE', label: '— Generic —' },
                ...activeItems.map((i) => ({ value: i.id, label: i.name })),
              ],
            },
          ]}
          hasActiveFilters={hasFilters}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('ALL');
            setItemFilter('ALL');
          }}
        />

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Code', 'Routing Name', 'Linked Item', 'Stages', 'Total Time', 'Version', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const badge = STATUS_BADGE[r.status] || STATUS_BADGE.DRAFT;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#64748b]">{r.code}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-[#1e293b]">{r.name}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.itemName ? (
                        <span className="text-sm text-[#1e293b]">{r.itemName}</span>
                      ) : (
                        <span className="text-sm text-[#94a3b8] italic">— Generic —</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#64748b]">
                        <i className="ri-file-list-line text-xs" />
                        {r.stages.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#1e293b]">{formatMinutes(r.totalTimeMinutes)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#64748b]">{r.version}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/masters/routing/${r.id}/edit`)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#4f46e5] hover:bg-[#4f46e5]/10 transition-colors cursor-pointer whitespace-nowrap"
                          title="View / Edit"
                        >
                          <i className="ri-edit-line" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(r)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <i className="ri-file-copy-line text-sm" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(r)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <i className="ri-git-branch-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">No routings found</p>
                    {hasFilters && <p className="text-xs text-[#94a3b8] mt-1">Try adjusting your filters</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">Showing {filtered.length} of {routings.length} routings</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Routing"
        message={`Delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Yes, Delete (Y)"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}