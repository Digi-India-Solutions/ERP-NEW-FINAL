import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import {
  mockProductionEntries,
  mockDowntimeEntries,
  mockRejectionEntries,
  mockMachines,
  mockWorkOrders,
  mockProductionOrders,
  mockOperators,
  mockShifts,
  mockWorkCenters,
} from '@/mocks/masters';
import OEEDashboard from './components/OEEDashboard';
import OverviewDashboard from './components/OverviewDashboard';
import QualityDashboard from './components/QualityDashboard';

export default function LiveDashboardPage() {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'oee' | 'quality'>(
    'overview',
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      setRefreshKey((k) => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshNow = () => {
    setLastUpdated(new Date());
    setRefreshKey((k) => k + 1);
  };

  const liveStats = useMemo(() => {
    const runningMachines = mockMachines.filter(
      (m) => m.status === 'RUNNING',
    ).length;
    const idleMachines = mockMachines.filter((m) => m.status === 'IDLE').length;
    const maintenanceMachines = mockMachines.filter(
      (m) => m.status === 'MAINTENANCE',
    ).length;
    const breakdownMachines = mockMachines.filter(
      (m) => m.status === 'BREAKDOWN',
    ).length;

    const activeWOs = mockWorkOrders.filter(
      (wo) => wo.status === 'IN_PROGRESS',
    ).length;
    const completedToday = mockProductionEntries.filter(
      (e) => e.isApproved,
    ).length;
    const pendingApproval = mockProductionEntries.filter(
      (e) => !e.isApproved,
    ).length;

    const openDowntime = mockDowntimeEntries.filter(
      (d) => !d.isResolved,
    ).length;
    const totalDowntimeMin = mockDowntimeEntries.reduce(
      (s, d) => s + (d.durationMinutes || 0),
      0,
    );

    const totalProduced = mockProductionEntries.reduce(
      (s, e) => s + e.producedQty,
      0,
    );
    const totalRejected = mockProductionEntries.reduce(
      (s, e) => s + e.rejectedQty,
      0,
    );
    const rejectionRate =
      totalProduced > 0
        ? ((totalRejected / (totalProduced + totalRejected)) * 100).toFixed(1)
        : '0.0';

    return {
      runningMachines,
      idleMachines,
      maintenanceMachines,
      breakdownMachines,
      activeWOs,
      completedToday,
      pendingApproval,
      openDowntime,
      totalDowntimeMin,
      totalProduced,
      totalRejected,
      rejectionRate,
    };
  }, [refreshKey]);

  const machineStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-emerald-500';
      case 'IDLE':
        return 'bg-slate-400';
      case 'MAINTENANCE':
        return 'bg-amber-500';
      case 'BREAKDOWN':
        return 'bg-rose-500';
      default:
        return 'bg-slate-300';
    }
  };

  const machineStatusText = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'IDLE':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'MAINTENANCE':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'BREAKDOWN':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                Live Production Dashboard
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                Auto-refreshes every 30 seconds &bull; Last updated:{' '}
                {lastUpdated.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshNow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#475569] text-xs font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <i className="ri-refresh-line" />
                Refresh Now
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('oee')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'oee'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              OEE
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'quality'
                  ? 'bg-[#1e293b] text-white'
                  : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Quality
            </button>
          </div>

          {activeTab === 'overview' && <OverviewDashboard key={refreshKey} />}

          {activeTab === 'oee' && <OEEDashboard key={refreshKey} />}

          {activeTab === 'quality' && <QualityDashboard />}
        </div>
      </div>
    </AppLayout>
  );
}
