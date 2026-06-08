import { useState, useMemo } from 'react';
import { toDateStr } from '../utils/POHelpers';
import SummaryCard from "./SummaryCard";

export default function SummarySection({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-5 text-center text-slate-400 text-sm py-6">
          <i className="ri-loader-4-line animate-spin mr-2" />
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <SummaryCard
        icon="ri-file-list-3-line"
        label="Total POs"
        value={stats.total}
        color="bg-indigo-50 text-[#4f46e5]"
      />

      <SummaryCard
        icon="ri-time-line"
        label="Pending"
        value={stats.pending}
        color="bg-amber-50 text-amber-600"
      />

      <SummaryCard
        icon="ri-loader-4-line"
        label="Partial"
        value={stats.partial}   // ✅ FROM API
        color="bg-sky-50 text-sky-600"
      />

      <SummaryCard
        icon="ri-checkbox-circle-line"
        label="Completed"
        value={stats.completed}
        color="bg-emerald-50 text-emerald-600"
      />

      <SummaryCard
        icon="ri-alarm-warning-line"
        label="Overdue"
        value={stats.overdue}
        color="bg-red-50 text-red-600"
      />
    </div>
  );
}

