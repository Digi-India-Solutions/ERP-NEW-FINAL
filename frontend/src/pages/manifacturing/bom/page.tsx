import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import BOMExplosionModal from './components/BOMExplosionModal';
import BOMPrintModal from './components/BOMPrintModal';
import { useToast } from '@/contexts/ToastContext';
import { formatINR } from '@/utils/format';
import bomAPI, { type BOM } from '@/api/bom.api';

type StatusFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'OBSOLETE';
type TypeFilter = 'ALL' | 'REGULAR' | 'VARIANT';
type DisplayEntryType = 'regular' | 'group-header' | 'variant';

interface DisplayEntry {
  type: DisplayEntryType;
  bom: BOM;
  groupKey?: string;
  groupCount?: number;
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    OBSOLETE: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
};

const getVariantTags = (bom: BOM): string[] => {
  // Variant tags logic - can be enhanced based on your data structure
  if (!bom.is_variant_bom) return [];
  // You can add variant attributes logic here if needed
  return [];
};

const getParentProductName = (bom: BOM): string => {
  return bom.variant_name?.split(' — ')[0] || bom.product_name;
};

export default function BOMListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<BOM | null>(null);
  const [explodeBom, setExplodeBom] = useState<BOM | null>(null);
  const [printBom, setPrintBom] = useState<BOM | null>(null);

  // Real API states
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  // ── Fetch BOMs from API ──
  const fetchBOMs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bomAPI.getAll({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type:
          typeFilter === 'REGULAR'
            ? 'REGULAR'
            : typeFilter === 'VARIANT'
              ? 'VARIANT'
              : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setBoms(response.data);
        setTotalCount(response.pagination?.total || response.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch BOMs:', error);
      toast.error('Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    typeFilter,
    pagination.page,
    pagination.limit,
    toast,
  ]);

  // Fetch on filter/pagination change
  useEffect(() => {
    fetchBOMs();
  }, [fetchBOMs]);

  // ── Filtered BOMs (client-side filtering for groups) ──
  const filteredBOMs = useMemo(() => {
    return boms;
  }, [boms]);

  // ── Display entries (grouped) ──
  const displayEntries = useMemo(() => {
    const regular = filteredBOMs.filter((b) => !b.is_variant_bom);
    const variants = filteredBOMs.filter((b) => b.is_variant_bom);

    const groups: Record<string, BOM[]> = {};
    variants.forEach((bom) => {
      const parentName = getParentProductName(bom);
      if (!groups[parentName]) groups[parentName] = [];
      groups[parentName].push(bom);
    });

    const entries: DisplayEntry[] = [];

    // Regular BOMs first
    regular.forEach((bom) => {
      entries.push({ type: 'regular', bom });
    });

    // Variant groups
    Object.entries(groups).forEach(([parentName, groupBOMs]) => {
      const isExpanded = expandedGroups.has(parentName);
      entries.push({
        type: 'group-header',
        bom: groupBOMs[0],
        groupKey: parentName,
        groupCount: groupBOMs.length,
      });
      if (isExpanded) {
        groupBOMs.forEach((bom) => {
          entries.push({ type: 'variant', bom, groupKey: parentName });
        });
      }
    });

    return entries;
  }, [filteredBOMs, expandedGroups]);

  // ── Counts ──
  const counts = useMemo(() => {
    const all = boms.length;
    const active = boms.filter((b) => b.status === 'ACTIVE').length;
    const draft = boms.filter((b) => b.status === 'DRAFT').length;
    const obsolete = boms.filter((b) => b.status === 'OBSOLETE').length;
    const regular = boms.filter((b) => !b.is_variant_bom).length;
    const variant = boms.filter((b) => b.is_variant_bom).length;
    return { all, active, draft, obsolete, regular, variant };
  }, [boms]);

  // ── Handlers ──
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const handleDuplicate = useCallback(
    async (bom: BOM) => {
      try {
        const response = await bomAPI.duplicate(bom.id);
        if (response.success) {
          toast.success(`BOM duplicated as v${response.data.version}`);
          fetchBOMs(); // Refresh list
        }
      } catch (error) {
        console.error('Duplicate error:', error);
        toast.error('Failed to duplicate BOM');
      }
    },
    [toast, fetchBOMs],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;

    try {
      await bomAPI.delete(pendingDelete.id);
      toast.success('BOM deleted successfully');
      setPendingDelete(null);
      fetchBOMs(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete BOM');
    }
  }, [pendingDelete, toast, fetchBOMs]);

  const dataRowCount = displayEntries.filter(
    (e) => e.type !== 'group-header',
  ).length;
  const totalMaterialCost = boms.reduce(
    (sum, b) => sum + (b.total_material_cost || 0),
    0,
  );

  // Loading state
  if (loading && boms.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-indigo-600 animate-spin" />
            <p className="mt-2 text-slate-500">Loading BOMs...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              Bill of Materials
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalCount} BOM{totalCount !== 1 ? 's' : ''} defined
            </p>
          </div>
          <button
            onClick={() => navigate('/manufacturing/create-bom')}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-add-line" />
            Create BOM
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-5">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
                <i className="ri-search-line text-sm" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, product name, or product code..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <div className="flex gap-1.5 bg-slate-50 rounded-lg p-1">
                {[
                  {
                    key: 'ALL' as StatusFilter,
                    label: 'All',
                    count: counts.all,
                  },
                  {
                    key: 'ACTIVE' as StatusFilter,
                    label: 'Active',
                    count: counts.active,
                  },
                  {
                    key: 'DRAFT' as StatusFilter,
                    label: 'Draft',
                    count: counts.draft,
                  },
                  {
                    key: 'OBSOLETE' as StatusFilter,
                    label: 'Obsolete',
                    count: counts.obsolete,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`h-8 px-3 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.key
                        ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                        : 'text-slate-500 hover:text-[#1e293b]'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs text-slate-400">
                      ({tab.count})
                    </span>
                  </button>
                ))}
              </div>
              {/* Type filter */}
              <div className="flex gap-1.5 bg-slate-50 rounded-lg p-1">
                {[
                  { key: 'ALL' as TypeFilter, label: 'All', count: counts.all },
                  {
                    key: 'REGULAR' as TypeFilter,
                    label: 'Regular',
                    count: counts.regular,
                  },
                  {
                    key: 'VARIANT' as TypeFilter,
                    label: 'Variant BOMs',
                    count: counts.variant,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setTypeFilter(tab.key)}
                    className={`h-8 px-3 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === tab.key
                        ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
                        : 'text-slate-500 hover:text-[#1e293b]'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs text-slate-400">
                      ({tab.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {boms.length === 0 && !loading ? (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
            <i className="ri-git-branch-line text-5xl text-slate-200 mb-4 block" />
            <h3 className="text-lg font-semibold text-slate-600">
              No BOMs defined yet
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Create your first Bill of Materials to get started
            </p>
            <button
              onClick={() => navigate('/manufacturing/bom/new')}
              className="mt-5 h-10 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] cursor-pointer whitespace-nowrap flex items-center gap-2 mx-auto"
            >
              <i className="ri-add-line" />
              Create First BOM
            </button>
          </div>
        ) : (
          /* ── Table ── */
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      BOM Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Version
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Levels
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-400"
                      >
                        <i className="ri-git-branch-line text-3xl mb-2 block" />
                        <p className="text-sm">No BOMs found</p>
                        <p className="text-xs mt-1">
                          Try adjusting your search or filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayEntries.map((entry) => {
                      if (entry.type === 'group-header') {
                        const isExpanded = expandedGroups.has(entry.groupKey!);
                        return (
                          <tr
                            key={`group-${entry.groupKey}`}
                            className="bg-indigo-50 border-b border-indigo-100 cursor-pointer"
                            onClick={() => toggleGroup(entry.groupKey!)}
                          >
                            <td colSpan={8} className="px-4 py-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleGroup(entry.groupKey!);
                                    }}
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-indigo-100 transition-colors cursor-pointer"
                                  >
                                    <i
                                      className={`ri-arrow-down-s-line text-indigo-600 transition-transform ${
                                        isExpanded ? '' : '-rotate-90'
                                      }`}
                                    />
                                  </button>
                                  <i className="ri-git-merge-line text-indigo-600" />
                                  <span className="text-sm font-semibold text-indigo-900">
                                    {entry.groupKey}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                                    {entry.groupCount} Variant BOM
                                    {entry.groupCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/manufacturing/bom/new', {
                                      state: {
                                        parentProductId: entry.bom.product_id,
                                        parentProductName: entry.groupKey || '',
                                        isVariantBOM: true,
                                      },
                                    });
                                  }}
                                  className="h-7 px-2.5 rounded-md bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                >
                                  <i className="ri-add-line" />
                                  Add Variant BOM
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const bom = entry.bom;
                      const tags = getVariantTags(bom);
                      const isVariant = entry.type === 'variant';

                      return (
                        <tr
                          key={bom.id}
                          className={`border-b ${
                            isVariant
                              ? 'border-indigo-50/50 hover:bg-indigo-50/30'
                              : 'border-slate-50 hover:bg-slate-50/50'
                          }`}
                        >
                          <td
                            className={`px-4 py-3 ${isVariant ? 'pl-10' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {!isVariant && (
                                <div className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                                  <i className="ri-git-branch-line text-xs" />
                                </div>
                              )}
                              <span
                                className={`text-sm font-medium text-[#1e293b] ${isVariant ? 'text-slate-700' : ''}`}
                              >
                                {isVariant ? `└ ${bom.code}` : bom.code}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {isVariant ? (
                              <div>
                                <p className="text-sm font-medium text-[#1e293b]">
                                  {bom.variant_name || bom.product_name}
                                </p>
                                {tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-[#1e293b]">
                                  {bom.product_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {bom.product_code}
                                </p>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-sm text-[#1e293b]">
                            v{bom.version}
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600">
                            {bom.levels} levels
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-[#1e293b]">
                            {bom.total_items}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-medium text-[#1e293b]">
                            {formatINR(bom.total_material_cost)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(bom.status)}`}
                            >
                              {bom.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setExplodeBom(bom)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                                title="Explode BOM"
                              >
                                <i className="ri-node-tree text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrintBom(bom)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                                title="Print BOM"
                              >
                                <i className="ri-printer-line text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/manufacturing/bom/${bom.id}/edit`)
                                }
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                                title="Edit BOM"
                              >
                                <i className="ri-pencil-line text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicate(bom)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 cursor-pointer transition-colors"
                                title="Duplicate BOM"
                              >
                                <i className="ri-file-copy-line text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(bom)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                title="Delete BOM"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Summary footer ── */}
        {boms.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <p>
              Showing {dataRowCount} of {totalCount} BOMs
            </p>
            <p>Total material cost: {formatINR(totalMaterialCost)}</p>
          </div>
        )}

        {/* ── Pagination ── */}
        {boms.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.page}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={dataRowCount < pagination.limit}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* ── Modals ── */}
        {explodeBom && (
          <BOMExplosionModal
            isOpen={!!explodeBom}
            onClose={() => setExplodeBom(null)}
            bom={explodeBom}
          />
        )}

        {printBom && (
          <BOMPrintModal
            isOpen={!!printBom}
            onClose={() => setPrintBom(null)}
            bom={printBom}
          />
        )}

        {/* ── Delete confirmation ── */}
        <ConfirmDialog
          open={!!pendingDelete}
          title="Delete BOM"
          message={`Are you sure you want to delete BOM "${pendingDelete?.code}"? This action cannot be undone.`}
          variant="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </AppLayout>
  );
}
