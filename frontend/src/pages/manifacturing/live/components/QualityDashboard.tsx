import { useMemo } from 'react';
import { mockInspections, mockNCRs, mockCAPAs } from '@/mocks/qms';

export default function QualityDashboard() {
  const stats = useMemo(() => {
    const allInsp = mockInspections;
    const completedInsp = allInsp.filter(
      (i) => i.status === 'PASSED' || i.status === 'FAILED',
    );
    const passedInsp = completedInsp.filter((i) => i.status === 'PASSED');
    const passRate =
      completedInsp.length > 0
        ? (passedInsp.length / completedInsp.length) * 100
        : 0;

    const openNCRs = mockNCRs.filter((n) => n.status !== 'CLOSED').length;

    const completedCAPAs = mockCAPAs.filter((c) => c.status === 'VERIFIED');
    const avgClosureDays =
      completedCAPAs.length > 0
        ? completedCAPAs.reduce((sum, c) => {
            const created = new Date(c.createdAt);
            const verified = c.verifiedDate
              ? new Date(c.verifiedDate)
              : new Date();
            return (
              sum +
              (verified.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            );
          }, 0) / completedCAPAs.length
        : 0;

    const incomingFailed = mockInspections.filter(
      (i) => i.type === 'INCOMING' && i.status === 'FAILED',
    ).length;
    const inprocessFailed = mockInspections.filter(
      (i) => i.type === 'IN_PROCESS' && i.status === 'FAILED',
    ).length;
    const finalFailed = mockInspections.filter(
      (i) => i.type === 'FINAL' && i.status === 'FAILED',
    ).length;
    const totalFailed = incomingFailed + inprocessFailed + finalFailed;

    return {
      passRate,
      openNCRs,
      avgClosureDays,
      incomingFailed,
      inprocessFailed,
      finalFailed,
      totalFailed,
      totalCompleted: completedInsp.length,
      totalPassed: passedInsp.length,
    };
  }, []);

  const passRateColor =
    stats.passRate > 95
      ? 'text-emerald-600'
      : stats.passRate >= 85
        ? 'text-amber-600'
        : 'text-red-600';
  const passRateBg =
    stats.passRate > 95
      ? 'bg-emerald-50'
      : stats.passRate >= 85
        ? 'bg-amber-50'
        : 'bg-red-50';
  const passRateIcon =
    stats.passRate > 95
      ? 'ri-emotion-happy-line'
      : stats.passRate >= 85
        ? 'ri-emotion-normal-line'
        : 'ri-emotion-unhappy-line';

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pass Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Inspection Pass Rate
              </p>
              <p className={`text-3xl font-bold mt-1 ${passRateColor}`}>
                {stats.totalCompleted > 0
                  ? `${Math.round(stats.passRate)}%`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalPassed} of {stats.totalCompleted} passed
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-xl ${passRateBg} flex items-center justify-center`}
            >
              <i className={`${passRateIcon} text-xl ${passRateColor}`} />
            </div>
          </div>
          {stats.totalCompleted > 0 && (
            <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stats.passRate > 95 ? 'bg-emerald-500' : stats.passRate >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${stats.passRate}%` }}
              />
            </div>
          )}
        </div>

        {/* Card 2: Open NCRs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Open NCRs
              </p>
              <p
                className={`text-3xl font-bold mt-1 ${stats.openNCRs > 0 ? 'text-red-600' : 'text-emerald-600'}`}
              >
                {stats.openNCRs}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.openNCRs === 0
                  ? 'All clear — no open issues'
                  : 'Require attention'}
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-xl ${stats.openNCRs > 0 ? 'bg-red-50' : 'bg-emerald-50'} flex items-center justify-center`}
            >
              <i
                className={`${stats.openNCRs > 0 ? 'ri-error-warning-line text-red-600' : 'ri-shield-check-line text-emerald-600'} text-xl`}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Avg CAPA Closure */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Avg CAPA Closure
              </p>
              <p className="text-3xl font-bold mt-1 text-sky-600">
                {stats.avgClosureDays > 0
                  ? `${Math.round(stats.avgClosureDays)}d`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Target: &lt; 7 days</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
              <i className="ri-time-line text-sky-600 text-xl" />
            </div>
          </div>
          {stats.avgClosureDays > 0 && (
            <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${stats.avgClosureDays <= 7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{
                  width: `${Math.min(100, (stats.avgClosureDays / 14) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Card 4: Rejection Rate by Stage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Rejections by Stage
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Incoming</span>
                  <span className="font-medium text-red-600">
                    {stats.incomingFailed}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">In-Process</span>
                  <span className="font-medium text-red-600">
                    {stats.inprocessFailed}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Final</span>
                  <span className="font-medium text-red-600">
                    {stats.finalFailed}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center ml-3">
              <i className="ri-bar-chart-grouped-line text-rose-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini bar chart for rejection breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Rejection Rate by Stage
        </h3>
        {stats.totalFailed > 0 ? (
          <div className="flex items-end gap-4 h-32">
            {[
              {
                label: 'Incoming',
                value: stats.incomingFailed,
                color: '#ef4444',
              },
              {
                label: 'In-Process',
                value: stats.inprocessFailed,
                color: '#f97316',
              },
              { label: 'Final', value: stats.finalFailed, color: '#eab308' },
            ].map((item) => {
              const maxVal = Math.max(
                stats.incomingFailed,
                stats.inprocessFailed,
                stats.finalFailed,
                1,
              );
              const pct = (item.value / maxVal) * 100;
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-slate-600 font-medium">
                    {item.value}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-12 rounded-t"
                      style={{
                        height: `${Math.max(pct, 5)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            <i className="ri-check-double-line text-2xl mb-1 block" />
            No rejections recorded
          </div>
        )}
      </div>
    </div>
  );
}
