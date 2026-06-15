import { useState } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { mockCostingSettings, type MockCostingSettings } from '@/mocks/costing';

interface WorkCenterRate {
  name: string;
  rate: number;
}

interface CostCenterBudget {
  name: string;
  budget: number;
}

interface MachineRate {
  name: string;
  rate: number;
}

interface FullCostingSettings extends MockCostingSettings {
  workCenterRates: WorkCenterRate[];
  costCenterBudgets: CostCenterBudget[];
  plannedHours: number;
  machineRates: MachineRate[];
  roundCost: boolean;
}

const DEFAULT_WORK_CENTERS: WorkCenterRate[] = [
  { name: 'Cutting Area', rate: 250 },
  { name: 'Assembly Line', rate: 180 },
  { name: 'Packing Zone', rate: 120 },
];

const DEFAULT_COST_CENTERS: CostCenterBudget[] = [
  { name: 'Production Floor', budget: 500000 },
  { name: 'Maintenance', budget: 200000 },
  { name: 'Quality Control', budget: 150000 },
];

const DEFAULT_MACHINES: MachineRate[] = [
  { name: 'CNC Machine 1', rate: 800 },
  { name: 'Hydraulic Press 2', rate: 650 },
  { name: 'Lathe Machine 3', rate: 400 },
  { name: 'Welding Robot 1', rate: 950 },
];

function getInitialSettings(): FullCostingSettings {
  const base = { ...mockCostingSettings };
  return {
    ...base,
    workCenterRates: (base as unknown as FullCostingSettings).workCenterRates ?? [...DEFAULT_WORK_CENTERS],
    costCenterBudgets: (base as unknown as FullCostingSettings).costCenterBudgets ?? [...DEFAULT_COST_CENTERS],
    plannedHours: (base as unknown as FullCostingSettings).plannedHours ?? 720,
    machineRates: (base as unknown as FullCostingSettings).machineRates ?? [...DEFAULT_MACHINES],
    roundCost: (base as unknown as FullCostingSettings).roundCost ?? true,
  };
}

const METHOD_OPTIONS = [
  { key: 'STANDARD' as const, title: 'Standard Cost', subtitle: 'Use BOM rates', desc: 'for planning' },
  { key: 'ACTUAL' as const, title: 'Actual Cost', subtitle: 'Track real', desc: 'expenses' },
  { key: 'BOTH' as const, title: 'Both', subtitle: 'Standard for', desc: 'plan, Actual for tracking' },
];

const LABOUR_OPTIONS = [
  { key: 'OPERATOR' as const, title: 'Operator', subtitle: 'wage rate', desc: 'from master' },
  { key: 'WORK_CENTER' as const, title: 'Work Center', subtitle: 'hourly rate', desc: 'from master' },
  { key: 'BOTH' as const, title: 'Both', subtitle: 'Add both', desc: 'together' },
];

const OVERHEAD_OPTIONS = [
  { key: 'PERCENTAGE' as const, title: '% of Material', subtitle: 'Simple fixed %', desc: 'on material cost' },
  { key: 'COST_CENTER' as const, title: 'Cost Center', subtitle: 'Budget-based', desc: 'allocation' },
  { key: 'MACHINE_HOUR' as const, title: 'Machine Hour', subtitle: 'Rate-based', desc: 'per machine' },
];

export default function CostingSetupPage() {
  const [settings, setSettings] = useState<FullCostingSettings>(getInitialSettings);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = () => {
    mockCostingSettings.overheadMethod = settings.overheadMethod;
    mockCostingSettings.overheadPercentage = settings.overheadPercentage;
    mockCostingSettings.labourBasis = settings.labourBasis;
    mockCostingSettings.includeRejectionCost = settings.includeRejectionCost;
    mockCostingSettings.includeReworkCost = settings.includeReworkCost;
    mockCostingSettings.costingMethod = settings.costingMethod;
    (mockCostingSettings as unknown as FullCostingSettings).workCenterRates = settings.workCenterRates;
    (mockCostingSettings as unknown as FullCostingSettings).costCenterBudgets = settings.costCenterBudgets;
    (mockCostingSettings as unknown as FullCostingSettings).plannedHours = settings.plannedHours;
    (mockCostingSettings as unknown as FullCostingSettings).machineRates = settings.machineRates;
    (mockCostingSettings as unknown as FullCostingSettings).roundCost = settings.roundCost;
    showToast('Costing settings saved');
  };

  const updateWorkCenterRate = (index: number, rate: number) => {
    setSettings((s) => {
      const next = [...s.workCenterRates];
      next[index] = { ...next[index], rate };
      return { ...s, workCenterRates: next };
    });
  };

  const updateMachineRate = (index: number, rate: number) => {
    setSettings((s) => {
      const next = [...s.machineRates];
      next[index] = { ...next[index], rate };
      return { ...s, machineRates: next };
    });
  };

  const updateCostCenterBudget = (index: number, budget: number) => {
    setSettings((s) => {
      const next = [...s.costCenterBudgets];
      next[index] = { ...next[index], budget };
      return { ...s, costCenterBudgets: next };
    });
  };

  const totalBudget = settings.costCenterBudgets.reduce((sum, cc) => sum + cc.budget, 0);
  const costCenterRate = settings.plannedHours > 0 ? totalBudget / settings.plannedHours : 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Costing Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">Configure how production costs are calculated</p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-save-line" />
            Save Settings
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Section 1 — Costing Method */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Costing Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {METHOD_OPTIONS.map((opt) => {
              const active = settings.costingMethod === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSettings((s) => ({ ...s, costingMethod: opt.key }))}
                  className={`text-left p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                    {opt.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {opt.subtitle}
                    <br />
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2 — Labour Cost Basis */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">How to calculate labour cost?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LABOUR_OPTIONS.map((opt) => {
              const active = settings.labourBasis === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSettings((s) => ({ ...s, labourBasis: opt.key }))}
                  className={`text-left p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                    {opt.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {opt.subtitle}
                    <br />
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Work Center Rate Table */}
          {(settings.labourBasis === 'WORK_CENTER' || settings.labourBasis === 'BOTH') && (
            <div className="mt-5">
              <h3 className="text-xs font-medium text-gray-700 mb-3">Work Center Hourly Rates</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Work Center</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Rate (₹ per hour)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settings.workCenterRates.map((wc, i) => (
                      <tr key={wc.name}>
                        <td className="px-4 py-2 text-gray-700">{wc.name}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={wc.rate}
                              onChange={(e) => updateWorkCenterRate(i, Number(e.target.value))}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Section 3 — Overhead Allocation */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Overhead Allocation Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {OVERHEAD_OPTIONS.map((opt) => {
              const active = settings.overheadMethod === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSettings((s) => ({ ...s, overheadMethod: opt.key }))}
                  className={`text-left p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                    {opt.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {opt.subtitle}
                    <br />
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Percentage detail */}
          {settings.overheadMethod === 'PERCENTAGE' && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Overhead %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.overheadPercentage}
                  onChange={(e) => setSettings((s) => ({ ...s, overheadPercentage: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <span className="text-xs text-gray-500">
                {settings.overheadPercentage}% will be added to material cost as overhead
              </span>
            </div>
          )}

          {/* Cost Center detail */}
          {settings.overheadMethod === 'COST_CENTER' && (
            <div className="mt-5 space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Cost Center</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Monthly Budget (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settings.costCenterBudgets.map((cc, i) => (
                      <tr key={cc.name}>
                        <td className="px-4 py-2 text-gray-700">{cc.name}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={cc.budget}
                              onChange={(e) => updateCostCenterBudget(i, Number(e.target.value))}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-xs font-medium text-gray-700">Total Budget</td>
                      <td className="px-4 py-2 text-xs font-medium text-gray-700">
                        ₹ {totalBudget.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm text-gray-700">Total planned hours this month</label>
                <input
                  type="number"
                  min={1}
                  value={settings.plannedHours}
                  onChange={(e) => setSettings((s) => ({ ...s, plannedHours: Number(e.target.value) }))}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <span className="text-sm font-medium text-gray-900">
                  Calculated rate: ₹ {Math.round(costCenterRate).toLocaleString('en-IN')} per hour
                </span>
              </div>
            </div>
          )}

          {/* Machine Hour detail */}
          {settings.overheadMethod === 'MACHINE_HOUR' && (
            <div className="mt-5">
              <h3 className="text-xs font-medium text-gray-700 mb-3">Machine Hourly Rates</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Machine</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Rate (₹ per hour)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settings.machineRates.map((m, i) => (
                      <tr key={m.name}>
                        <td className="px-4 py-2 text-gray-700">{m.name}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              value={m.rate}
                              onChange={(e) => updateMachineRate(i, Number(e.target.value))}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Section 4 — Additional Settings */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Additional Settings</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeRejectionCost}
              onChange={(e) => setSettings((s) => ({ ...s, includeRejectionCost: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <div className="text-sm text-gray-700 font-medium">Include Rejection Cost in Product Cost</div>
              <div className="text-xs text-gray-500">Cost of rejected units added to good unit cost</div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeReworkCost}
              onChange={(e) => setSettings((s) => ({ ...s, includeReworkCost: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <div className="text-sm text-gray-700 font-medium">Include Rework Cost</div>
              <div className="text-xs text-gray-500">Rework labour and material cost included in product cost</div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.roundCost}
              onChange={(e) => setSettings((s) => ({ ...s, roundCost: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <div className="text-sm text-gray-700 font-medium">Round Cost to nearest ₹</div>
              <div className="text-xs text-gray-500">All calculated costs are rounded to the nearest rupee</div>
            </div>
          </label>
        </section>

        {/* Save button at bottom too */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-save-line" />
            Save Settings
          </button>
        </div>
      </div>
    </AppLayout>
  );
}