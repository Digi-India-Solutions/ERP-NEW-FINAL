import { useState, useMemo } from 'react';
import { BOMDropdownGroup, BOMDropdownVariant } from '../../../../api/item.api';
import { formatINR } from '@/utils/format';

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: BOMDropdownGroup | BOMDropdownVariant) => void;
  excludeItemIds?: string[];
  items: BOMDropdownGroup[];
}

export default function AddComponentModal({
  isOpen,
  onClose,
  onSelect,
  excludeItemIds = [],
  items,
}: AddComponentModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();

    if (!q) return items;

    return items.filter((group) => {
      const matchesItem =
        group.name.toLowerCase().includes(q) ||
        (group.code && group.code.toLowerCase().includes(q));

      const matchesVariant = group.variants.some(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.code && v.code.toLowerCase().includes(q)),
      );

      return matchesItem || matchesVariant;
    });
  }, [items, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0]">
          <h3 className="text-lg font-semibold text-[#1e293b]">
            Add Component
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Select an item or variant to add as component
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#e2e8f0]">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items or variants..."
            className="w-full h-10 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
          />
        </div>

        {/* Items List - Grouped */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="ri-inbox-line text-3xl mb-2 block" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            filteredItems.map((group) => (
              <div key={group.id} className="mb-2">
                {/* Parent Item */}
                <button
                  onClick={() => onSelect(group)}
                  disabled={excludeItemIds.includes(group.id)}
                  className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center justify-between ${
                    excludeItemIds.includes(group.id)
                      ? 'opacity-50 cursor-not-allowed bg-slate-50'
                      : 'hover:bg-indigo-50 cursor-pointer'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {group.name}
                    </p>
                    <p className="text-xs text-slate-400">{group.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1e293b]">
                      {formatINR(group.purchase_rate)}
                    </p>
                    <p className="text-xs text-slate-400">{group.unit_name}</p>
                  </div>
                </button>

                {/* Variants (indented) */}
                {group.variants.length > 0 && (
                  <div className="ml-6 border-l border-slate-200 pl-2 mt-1">
                    {group.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => onSelect(variant)}
                        disabled={excludeItemIds.includes(variant.id)}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center justify-between ${
                          excludeItemIds.includes(variant.id)
                            ? 'opacity-50 cursor-not-allowed bg-slate-50'
                            : 'hover:bg-indigo-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i className="ri-subtract-line text-xs text-slate-400" />
                          <div>
                            <p className="text-sm text-[#64748b]">
                              {variant.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {variant.code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#1e293b]">
                            {formatINR(variant.purchase_rate)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {variant.unit_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
