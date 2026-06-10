import { mockInspections, mockNCRs, mockCAPAs } from '@/mocks/qms';

function calcPassRate(type: 'INCOMING' | 'IN_PROCESS' | 'FINAL'): number {
  const relevant = mockInspections.filter((i) => i.type === type && i.status !== 'PENDING' && i.status !== 'IN_PROGRESS');
  if (relevant.length === 0) return 100;
  const passed = relevant.filter((i) => i.status === 'PASSED').length;
  return Math.round((passed / relevant.length) * 100);
}

export default function QualityScorecard() {
  const incomingRate = calcPassRate('INCOMING');
  const inProcessRate = calcPassRate('IN_PROCESS');
  const finalRate = calcPassRate('FINAL');
  const openNCRs = mockNCRs.filter((n) => n.status !== 'CLOSED').length;
  const openCAPAs = mockCAPAs.filter((c) => c.status !== 'VERIFIED' && c.status !== 'COMPLETED').length;

  const rows = [
    { label: 'Incoming Pass Rate', value: `${incomingRate}%`, target: 95, pct: incomingRate },
    { label: 'In-Process Pass Rate', value: `${inProcessRate}%`, target: 95, pct: inProcessRate },
    { label: 'Final Pass Rate', value: `${finalRate}%`, target: 95, pct: finalRate },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
        <i className="ri-verified-badge-line text-emerald-500" />
        Quality Scorecard
      </h3>

      <div className="space-y-3 mb-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#475569]">{r.label}</span>
              <span className={`text-xs font-semibold ${r.pct >= r.target ? 'text-emerald-600' : 'text-amber-600'}`}>
                {r.value}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.pct >= r.target ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#f1f5f9]">
        <div className="flex flex-col items-center p-2.5 rounded-lg bg-slate-50">
          <span className={`text-lg font-bold ${openNCRs > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {openNCRs}
          </span>
          <span className="text-xs text-[#64748b] mt-0.5">Open NCRs</span>
        </div>
        <div className="flex flex-col items-center p-2.5 rounded-lg bg-slate-50">
          <span className={`text-lg font-bold ${openCAPAs > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {openCAPAs}
          </span>
          <span className="text-xs text-[#64748b] mt-0.5">Open CAPAs</span>
        </div>
      </div>
    </div>
  );
}