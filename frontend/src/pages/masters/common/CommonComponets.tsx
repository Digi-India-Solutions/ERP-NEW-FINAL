import React from 'react';

// ─── Filter Section Interfaces & Component ──────────────────────────────────
export interface FilterConfig {
  value: string;
  onChange: (val: any) => void;
  options: { value: string; label: string }[];
  className?: string;
}

interface MasterFiltersProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  searchWidthClass?: string;
  filters?: FilterConfig[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MasterFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchWidthClass = 'w-56',
  filters = [],
  hasActiveFilters,
  onClearFilters,
}: MasterFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onSearchChange !== undefined && search !== undefined && (
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 ${searchWidthClass}`}
          />
        </div>
      )}
      {filters.map((filter, idx) => (
        <select
          key={idx}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className={`h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer ${
            filter.className || ''
          }`}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer whitespace-nowrap"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── Summary / Breakdown Cards Interfaces & Component ───────────────────────
export interface SummaryCardItem {
  value: string;
  count: number;
  label: string;
  badgeClass?: string;
}

interface MasterSummaryCardsProps {
  items: SummaryCardItem[];
  activeFilterValue: string;
  onFilterChange: (val: any) => void;
  gridClassName?: string;
}

export function MasterSummaryCards({
  items,
  activeFilterValue,
  onFilterChange,
  gridClassName,
}: MasterSummaryCardsProps) {
  const defaultGridClass = `grid grid-cols-${Math.min(3, items.length)} lg:grid-cols-${items.length} gap-3`;
  const finalGridClass = gridClassName || defaultGridClass;

  return (
    <div className={finalGridClass}>
      {items.map((item) => {
        const isActive = activeFilterValue === item.value;
        const badgeClass = item.badgeClass || 'bg-slate-50 text-slate-700 border-slate-200';
        return (
          <button
            key={item.value}
            onClick={() => onFilterChange(activeFilterValue === item.value ? 'ALL' : item.value)}
            className={`bg-white border rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
              isActive
                ? `${badgeClass} border-current ring-2 ring-current/20`
                : 'border-[#e2e8f0] hover:border-[#4f46e5]/30'
            }`}
          >
            <p className="text-xl font-bold text-[#1e293b]">{item.count}</p>
            <p className="text-[11px] text-[#64748b] font-medium">{item.label}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Stats Row Interfaces & Component ────────────────────────────────────────
export interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  bg: string;
  color: string;
}

interface MasterStatsRowProps {
  stats: StatItem[];
  gridClassName?: string;
  valueClassName?: string;
}

export function MasterStatsRow({
  stats,
  gridClassName = 'grid grid-cols-3 gap-4',
  valueClassName = 'text-2xl',
}: MasterStatsRowProps) {
  return (
    <div className={gridClassName}>
      {stats.map((c) => (
        <div key={c.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg} shrink-0`}>
            <i className={`${c.icon} ${c.color} text-lg`} />
          </div>
          <div>
            <p className={`font-bold text-[#1e293b] ${valueClassName}`}>{c.value}</p>
            <p className="text-xs text-[#64748b]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
