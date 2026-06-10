import { useState, useMemo } from 'react';
import { mockItems, type MockItem } from '@/mocks/masters';

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MockItem) => void;
  excludeItemIds?: string[];
}

export default function AddComponentModal({
  isOpen,
  onClose,
  onSelect,
  excludeItemIds = [],
}: AddComponentModalProps) {
  const [search, setSearch] = useState('');

  const eligibleItems = useMemo(
    () =>
      mockItems.filter((m) => !m.isParent && !excludeItemIds.includes(m.id)),
    [excludeItemIds],
  );

  const parents = useMemo(() => mockItems.filter((m) => m.isParent), []);

  const variants = useMemo(
    () => eligibleItems.filter((m) => m.isVariant),
    [eligibleItems],
  );

  const regulars = useMemo(
    () => eligibleItems.filter((m) => !m.isVariant),
    [eligibleItems],
  );

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    const fp = parents.filter((p) => {
      const matches =
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const hasChild = variants.some(
        (v) =>
          v.parentItemId === p.id &&
          (v.name.toLowerCase().includes(q) ||
            v.code.toLowerCase().includes(q)),
      );
      return matches || hasChild;
    });
    const fv = variants.filter(
      (v) =>
        v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q),
    );
    const fr = regulars.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
    return { parents: fp, variants: fv, regulars: fr };
  }, [parents, variants, regulars, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">
            Add Component
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#e2e8f0]">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
              <i className="ri-search-line text-sm" />
            </div>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Parents with variants */}
          {filteredData.parents.map((parent) => {
            const childVariants = filteredData.variants.filter(
              (v) => v.parentItemId === parent.id,
            );
            if (childVariants.length === 0) return null;
            return (
              <div key={parent.id} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 rounded-md uppercase tracking-wide">
                  {parent.name}
                </div>
                {childVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      onSelect(variant);
                      setSearch('');
                    }}
                    className="w-full px-6 py-2.5 text-left hover:bg-indigo-50 rounded-md cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <span className="text-slate-400 text-sm">\u2514</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1e293b] truncate">
                        {variant.variantName || variant.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {variant.code}
                        </span>
                        {variant.variantAttributes &&
                          Object.values(variant.variantAttributes).map(
                            (attr, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                {attr}
                              </span>
                            ),
                          )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatCost(variant)}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}

          {/* Regular items */}
          {filteredData.regulars.length > 0 && (
            <div className="mb-2">
              {filteredData.parents.length > 0 &&
                filteredData.regulars.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-50 rounded-md uppercase tracking-wide">
                    Items
                  </div>
                )}
              {filteredData.regulars.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    setSearch('');
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-indigo-50 rounded-md cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1e293b] truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">
                        {item.code}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeBadge(item.itemType)}`}
                      >
                        {typeLabel(item.itemType)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {formatCost(item)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {filteredData.parents.length === 0 &&
            filteredData.regulars.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <i className="ri-search-line text-2xl mb-2 block" />
                <p className="text-sm">No items found</p>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e2e8f0] flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCost(item: MockItem): string {
  const cost = item.standardCost || item.purchaseRate || 0;
  return `\u20B9${cost.toLocaleString('en-IN')}`;
}

function typeBadge(type: string): string {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'bg-amber-100 text-amber-700 border-amber-200',
    SEMI_FINISHED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONSUMABLE: 'bg-sky-100 text-sky-700 border-sky-200',
    PACKAGING: 'bg-slate-100 text-slate-600 border-slate-200',
    FINISHED_GOOD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[type] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'Raw',
    SEMI_FINISHED: 'Semi',
    CONSUMABLE: 'Consumable',
    PACKAGING: 'Packaging',
    FINISHED_GOOD: 'Finished',
  };
  return map[type] || type;
}
