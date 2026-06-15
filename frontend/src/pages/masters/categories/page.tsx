import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  itemCount: number;
  isActive: boolean;
}

interface Unit {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  itemCount: number;
}

type Tab = 'categories' | 'units';

// ─── API base ─────────────────────────────────────────────────
const API = 'http://localhost:7001/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function CategoriesUnitsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // ─── Categories state ─────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [catEditing, setCatEditing] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', parentId: '' });
  const [catErrors, setCatErrors] = useState<Record<string, string>>({});
  const [catDelete, setCatDelete] = useState<Category | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { hasPermission } = useAuth();
  const canCreateCategory = hasPermission(MODULES.CATEGORIES, 'create');
  const canEditCategory = hasPermission(MODULES.CATEGORIES, 'edit');
  const canDeleteCategory = hasPermission(MODULES.CATEGORIES, 'delete');
  const normalizedCatSearch = catSearch.trim().toLowerCase();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(catSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [catSearch]);

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);

    try {
      const data = await apiFetch(
        `/categories/all?search=${encodeURIComponent(debouncedSearch)}`,
      );

      setCategories(data.data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to fetch categories';

      error(message);
    } finally {
      setCatLoading(false);
    }
  }, [debouncedSearch, error]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddCat = () => {
    setCatForm({ name: '', parentId: '' });
    setCatErrors({});
    setCatEditing(null);
    setCatModal(true);
  };

  const openEditCat = (c: Category) => {
    setCatForm({ name: c.name, parentId: c.parentId ?? '' });
    setCatErrors({});
    setCatEditing(c);
    setCatModal(true);
  };

  const saveCat = async () => {
    const e: Record<string, string> = {};
    if (!catForm.name.trim()) e.name = 'Category name is required';
    const normalizedName = catForm.name.trim().toLowerCase();
    const normalizedParentId = catForm.parentId || null;

    const duplicateCategory = categories.find((c) => {
      const sameName = c.name.trim().toLowerCase() === normalizedName;
      const sameParent = (c.parentId || null) === normalizedParentId;

      // Ignore current category while editing
      const notCurrent = c.id !== catEditing?.id;

      return sameName && sameParent && notCurrent;
    });

    if (duplicateCategory) {
      e.name = 'Category with this name already exists';
    }

    if (Object.keys(e).length > 0) {
      setCatErrors(e);
      return;
    }
    try {
      if (catEditing) {
        await apiFetch(`/categories/update/${catEditing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: catForm.name,
            parentId: catForm.parentId || null,
          }),
        });
        success('Category updated');
      } else {
        await apiFetch('/categories/create', {
          method: 'POST',
          body: JSON.stringify({
            name: catForm.name,
            parentId: catForm.parentId || null,
          }),
        });
        success('Category added');
      }
      setCatModal(false);
      fetchCategories();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to save category';
      error(message);
    }
  };

  const deleteCat = async () => {
    if (!catDelete) return;
    try {
      await apiFetch(`/categories/delete/${catDelete.id}`, {
        method: 'DELETE',
      });
      success('Category removed');
      setCatDelete(null);
      fetchCategories();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to delete category';
      error(message);
      setCatDelete(null);
    }
  };

  const rootCats = categories.filter((c) => !c.parentId);
  const childCats = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);
  const visibleRootCats = rootCats;

  const visibleChildCats = (parentId: string) => childCats(parentId);

  const toggleCategoryChildren = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // ─── Units state ──────────────────────────────────────────────
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitModal, setUnitModal] = useState(false);
  const [unitEditing, setUnitEditing] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({ name: '', shortName: '' });
  const [unitErrors, setUnitErrors] = useState<Record<string, string>>({});
  const [unitDelete, setUnitDelete] = useState<Unit | null>(null);

  const fetchUnits = useCallback(async () => {
    setUnitLoading(true);
    try {
      const data = await apiFetch('/unit/all');
      setUnits(data.data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch units';
      error(message);
    } finally {
      setUnitLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const openAddUnit = () => {
    setUnitForm({ name: '', shortName: '' });
    setUnitErrors({});
    setUnitEditing(null);
    setUnitModal(true);
  };

  const openEditUnit = (u: Unit) => {
    setUnitForm({ name: u.name, shortName: u.shortName });
    setUnitErrors({});
    setUnitEditing(u);
    setUnitModal(true);
  };

  const saveUnit = async () => {
    const e: Record<string, string> = {};
    if (!unitForm.name.trim()) e.name = 'Unit name is required';
    if (!unitForm.shortName.trim()) e.shortName = 'Short name is required';
    if (Object.keys(e).length > 0) {
      setUnitErrors(e);
      return;
    }

    try {
      if (unitEditing) {
        await apiFetch(`/unit/update/${unitEditing.id}`, {
          method: 'PUT',
          body: JSON.stringify(unitForm),
        });
        success('Unit updated');
      } else {
        await apiFetch('/unit/create', {
          method: 'POST',
          body: JSON.stringify(unitForm),
        });
        success('Unit added');
      }
      setUnitModal(false);
      fetchUnits();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save unit';
      error(message);
    }
  };

  const toggleUnit = async (u: Unit) => {
    try {
      await apiFetch(`/unit/${u.id}/toggle`, { method: 'PATCH' });
      fetchUnits();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to toggle unit status';
      error(message);
    }
  };

  const deleteUnit = async () => {
    if (!unitDelete) return;
    try {
      await apiFetch(`/unit/delete/${unitDelete.id}`, { method: 'DELETE' });
      success('Unit removed');
      setUnitDelete(null);
      fetchUnits();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete unit';
      error(message);
      setUnitDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5 w-full ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">
                Categories &amp; Units
              </h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Organize items with hierarchical categories and measurement
                units
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1 w-fit">
          {(['categories', 'units'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`h-8 px-5 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap capitalize ${
                activeTab === t
                  ? 'bg-white text-[#1e293b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              {t === 'categories'
                ? `Categories (${categories.length})`
                : `Units (${units.length})`}
            </button>
          ))}
        </div>

        {/* ── Categories Tab ──────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
              </div>
              {canCreateCategory && (
                <button
                  onClick={openAddCat}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line" /> Add Category
                </button>
              )}
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              {catLoading ? (
                <div className="px-4 py-10 text-center text-[#94a3b8] text-sm">
                  <i className="ri-loader-4-line animate-spin text-xl block mb-2" />
                  Loading categories...
                </div>
              ) : visibleRootCats.length === 0 ? (
                <div className="px-4 py-10 text-center text-[#94a3b8] text-sm">
                  No categories found
                </div>
              ) : (
                visibleRootCats.map((cat) => {
                  const filteredChildren = visibleChildCats(cat.id);
                  const shouldExpand =
                    expandedCategories[cat.id] ||
                    normalizedCatSearch.length > 0;

                  return (
                    <div key={cat.id}>
                      {/* Root category */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f1f5f9] hover:bg-[#f8fafc] group">
                        <button
                          type="button"
                          onClick={() => toggleCategoryChildren(cat.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer shrink-0"
                          aria-label={
                            shouldExpand
                              ? 'Hide subcategories'
                              : 'Show subcategories'
                          }
                          title={
                            shouldExpand
                              ? 'Hide subcategories'
                              : 'Show subcategories'
                          }
                        >
                          <i
                            className={`ri-arrow-down-s-line text-base transition-transform duration-200 ${
                              shouldExpand ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                          <i className="ri-folder-line text-[#4f46e5] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e293b] text-sm">
                            {cat.name}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {cat.itemCount} items · {filteredChildren.length}{' '}
                            sub-categories
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            cat.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEditCategory && (
                            <button
                              onClick={() => openEditCat(cat)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                            >
                              <i className="ri-edit-line text-sm" />
                            </button>
                          )}
                          {canDeleteCategory && (
                            <button
                              onClick={() => setCatDelete(cat)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Sub-categories */}
                      {shouldExpand &&
                        filteredChildren.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f1f5f9] hover:bg-[#f8fafc] group pl-16 bg-[#fcfcfd]"
                          >
                            <div className="w-1 h-1 rounded-full bg-[#cbd5e1] shrink-0 mr-1" />
                            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 shrink-0">
                              <i className="ri-folder-2-line text-[#94a3b8] text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1e293b] text-sm">
                                {child.name}
                              </p>
                              <p className="text-xs text-[#94a3b8]">
                                {child.itemCount} items
                              </p>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                child.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {child.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEditCategory && (
                                <button
                                  onClick={() => openEditCat(child)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                                >
                                  <i className="ri-edit-line text-sm" />
                                </button>
                              )}
                              {canDeleteCategory && (
                                <button
                                  onClick={() => setCatDelete(child)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <i className="ri-delete-bin-line text-sm" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Units Tab ────────────────────────────────────────── */}
        {activeTab === 'units' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              {canCreateCategory && (
                <button
                  onClick={openAddUnit}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-add-line" /> Add Unit
                </button>
              )}
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              {unitLoading ? (
                <div className="px-4 py-10 text-center text-[#94a3b8] text-sm">
                  <i className="ri-loader-4-line animate-spin text-xl block mb-2" />
                  Loading units...
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      {[
                        'Unit Name',
                        'Short Name',
                        'Items Using',
                        'Status',
                        '',
                      ].map((h) => (
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
                    {units.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-[#94a3b8] text-sm"
                        >
                          No units found
                        </td>
                      </tr>
                    ) : (
                      units.map((unit, idx) => (
                        <tr
                          key={unit.id}
                          className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${
                            idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">
                            {unit.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs bg-[#f1f5f9] px-2 py-1 rounded font-semibold text-[#1e293b]">
                              {unit.shortName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                            {unit.itemCount} items
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleUnit(unit)}
                              className="cursor-pointer"
                            >
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  unit.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {unit.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {canEditCategory && (
                                <button
                                  onClick={() => openEditUnit(unit)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                                >
                                  <i className="ri-edit-line text-sm" />
                                </button>
                              )}
                              {canDeleteCategory && (
                                <button
                                  onClick={() => setUnitDelete(unit)}
                                  disabled={unit.itemCount > 0}
                                  title={
                                    unit.itemCount > 0
                                      ? 'Cannot delete — items are using this unit'
                                      : ''
                                  }
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <i className="ri-delete-bin-line text-sm" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCatModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1e293b]">
              {catEditing ? 'Edit Category' : 'Add Category'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, name: e.target.value }))
                }
                className={`w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  catErrors.name
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
                placeholder="Electronics"
                autoFocus
              />
              {catErrors.name && (
                <p className="text-xs text-red-500">{catErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Parent Category (optional)
              </label>
              <select
                value={catForm.parentId}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, parentId: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] cursor-pointer"
              >
                <option value="">None (Root Category)</option>
                {categories
                  .filter((c) => !c.parentId && c.id !== catEditing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCatModal(false)}
                className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={saveCat}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-save-line" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {unitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setUnitModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#1e293b]">
              {unitEditing ? 'Edit Unit' : 'Add Unit'}
            </h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Unit Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitForm.name}
                onChange={(e) =>
                  setUnitForm((p) => ({ ...p, name: e.target.value }))
                }
                className={`w-full h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  unitErrors.name
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
                placeholder="Pieces"
                autoFocus
              />
              {unitErrors.name && (
                <p className="text-xs text-red-500">{unitErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Short Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitForm.shortName}
                onChange={(e) =>
                  setUnitForm((p) => ({ ...p, shortName: e.target.value }))
                }
                maxLength={6}
                className={`w-full h-10 px-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 ${
                  unitErrors.shortName
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
                placeholder="Pcs"
              />
              {unitErrors.shortName && (
                <p className="text-xs text-red-500">{unitErrors.shortName}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUnitModal(false)}
                className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={saveUnit}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-save-line" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!catDelete}
        title="Remove Category"
        message={`Remove "${catDelete?.name}"? Sub-categories will remain.`}
        variant="danger"
        confirmLabel="Yes (Y)"
        onConfirm={deleteCat}
        onCancel={() => setCatDelete(null)}
      />
      <ConfirmDialog
        open={!!unitDelete}
        title="Remove Unit"
        message={`Remove unit "${unitDelete?.name}"?`}
        variant="danger"
        confirmLabel="Yes (Y)"
        onConfirm={deleteUnit}
        onCancel={() => setUnitDelete(null)}
      />
    </AppLayout>
  );
}
