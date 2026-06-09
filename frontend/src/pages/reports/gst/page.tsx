import { useState } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { mockCompany } from '@/mocks/masters';
import GSTR1Tab from './components/GSTR1Tab';
import GSTR2Tab from './components/GSTR2Tab';
import GSTR3BTab from './components/GSTR3BTab';

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const years = [2023, 2024, 2025, 2026];

type TabKey = 'gstr1' | 'gstr2' | 'gstr3b';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'gstr1', label: 'GSTR-1 (Outward)' },
  { key: 'gstr2', label: 'GSTR-2 (Inward)' },
  { key: 'gstr3b', label: 'GSTR-3B (Summary)' },
];

export default function GSTReportsPage() {
  const toast = useToast();
  const [month, setMonth] = useState(3);
  const [year, setYear] = useState(2024);
  const [activeTab, setActiveTab] = useState<TabKey>('gstr1');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleExportJSON = () => {
    // Build GSTR-1 JSON for the selected period
    const fp = `${String(month).padStart(2, '0')}${year}`;
    const jsonData = {
      gstin: mockCompany.gstin,
      fp,
      version: 'GSTN_SCHEMA_2.0',
      generatedAt: new Date().toISOString(),
      note: `GSTR-1 JSON for ${months.find((m) => m.value === month)?.label} ${year} — ready for GSTN portal upload`,
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-1-${fp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GSTR-1 JSON ready for upload to GSTN portal');
  };

  const handleExportExcel = () => {
    // Build a multi-section CSV
    const lines: string[] = [
      `GST Reports - ${months.find((m) => m.value === month)?.label} ${year}`,
      `GSTIN: ${mockCompany.gstin}`,
      '',
      'GSTR-1 OUTWARD SUPPLIES',
      '--------------------------------',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST-Report-${String(month).padStart(2, '0')}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GST report exported as CSV');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">GST Reports</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              GSTR filing, reconciliation, and GST analytics
            </p>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setGenerated(false); }}
              className="h-9 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5] cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setGenerated(false); }}
              className="h-9 px-3 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5] cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <i className="ri-shield-check-line text-slate-500 text-sm" />
            <span className="text-xs font-mono text-slate-600">{mockCompany.gstin}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleGenerate}
            className="h-9 px-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {generated ? 'Regenerate' : 'Generate'}
          </button>
          <button
            onClick={handleExportJSON}
            className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-file-code-line text-sm" />
            Export JSON
          </button>
          <button
            onClick={handleExportExcel}
            className="h-9 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-file-excel-line text-sm" />
            Export Excel
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-white text-[#1e293b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {!generated && (
          <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
            <div className="text-center text-[#64748b]">
              <i className="ri-calculator-line text-5xl text-slate-200 block mb-3" />
              <p className="text-sm font-medium">
                Select period and click <strong>Generate</strong> to view GST reports
              </p>
              <p className="text-xs mt-1">
                {months.find((m) => m.value === month)?.label} {year} — GSTIN {mockCompany.gstin}
              </p>
            </div>
          </div>
        )}

        {generated && (
          <>
            {activeTab === 'gstr1' && <GSTR1Tab month={month} year={year} />}
            {activeTab === 'gstr2' && <GSTR2Tab month={month} year={year} />}
            {activeTab === 'gstr3b' && <GSTR3BTab month={month} year={year} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}