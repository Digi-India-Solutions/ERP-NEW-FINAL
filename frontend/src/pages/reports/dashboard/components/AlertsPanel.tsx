import { mockNCRs, mockCAPAs, mockInspections } from '@/mocks/qms';
import { mockMachines, mockMRPResults, mockProductionOrders } from '@/mocks/masters';
import { mockLowStock } from '@/mocks/reports';

interface AlertItem {
  text: string;
  link?: string;
}

export default function AlertsPanel() {
  // Critical alerts
  const criticalNCRs = mockNCRs.filter((n) => n.severity === 'CRITICAL' && n.status !== 'CLOSED');
  const breakdownMachines = mockMachines.filter((m) => m.status === 'BREAKDOWN');
  const criticalShortages = mockMRPResults.filter((r) => r.status === 'CRITICAL');
  const overdueCAPAs = mockCAPAs.filter(
    (c) => c.status !== 'VERIFIED' && c.status !== 'COMPLETED' &&
    new Date(c.targetDate) < new Date()
  );

  // Attention needed
  const onHoldOrders = mockProductionOrders.filter((o) => o.status === 'ON_HOLD');
  const pendingInspections = mockInspections.filter((i) => {
    if (i.status !== 'PENDING') return false;
    const scheduledDate = new Date(i.scheduledDate);
    const diffDays = (Date.now() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  });

  // Recent achievements
  const lastCompletedPO = mockProductionOrders
    .filter((o) => o.status === 'COMPLETED')
    .sort((a, b) => new Date(b.actualEndDate ?? '').getTime() - new Date(a.actualEndDate ?? '').getTime())[0];

  const lastClosedNCR = mockNCRs
    .filter((n) => n.status === 'CLOSED' || n.status === 'CAPA_VERIFIED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const criticalAlerts: AlertItem[] = [
    ...criticalNCRs.map((n) => ({ text: `Critical NCR: ${n.ncrNumber} — ${n.itemName}` })),
    ...breakdownMachines.map((m) => ({ text: `Machine in breakdown: ${m.name}` })),
    ...criticalShortages.map((r) => ({ text: `MRP Critical shortage: ${r.itemName}` })),
    ...overdueCAPAs.map((c) => ({ text: `Overdue CAPA: ${c.capaNumber} (${c.assignedToName})` })),
  ];

  const attentionAlerts: AlertItem[] = [
    ...onHoldOrders.map((o) => ({ text: `Production ${o.poNumber} on hold: ${o.notes ?? 'No reason'}` })),
    ...(mockLowStock.length > 0 ? [{ text: `${mockLowStock.length} items below minimum stock level` }] : []),
    ...pendingInspections.map((i) => ({ text: `Inspection ${i.inspectionNumber} pending for >3 days` })),
  ];

  const achievements: AlertItem[] = [
    ...(lastCompletedPO ? [{
      text: `Completed: ${lastCompletedPO.poNumber} — ${lastCompletedPO.variantName ?? lastCompletedPO.productName} (${lastCompletedPO.completedQty} ${lastCompletedPO.unit})`
    }] : []),
    ...(lastClosedNCR ? [{
      text: `NCR resolved: ${lastClosedNCR.ncrNumber} — ${lastClosedNCR.itemName}`
    }] : []),
    { text: 'Production order PRD-2024-003 completed on schedule' },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 h-full">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
        <i className="ri-notification-3-line text-red-500" />
        Alerts &amp; Action Items
      </h3>

      {/* Critical */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Critical</span>
        </div>
        {criticalAlerts.length === 0 ? (
          <p className="text-xs text-emerald-600 pl-3.5">No critical alerts</p>
        ) : (
          <div className="space-y-1.5 pl-3.5">
            {criticalAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <i className="ri-error-warning-fill text-red-500 text-xs mt-0.5 flex-shrink-0" />
                <span className="text-xs text-red-700">{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attention */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Attention Needed</span>
        </div>
        {attentionAlerts.length === 0 ? (
          <p className="text-xs text-[#64748b] pl-3.5">All good!</p>
        ) : (
          <div className="space-y-1.5 pl-3.5">
            {attentionAlerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                <i className="ri-alert-fill text-amber-500 text-xs mt-0.5 flex-shrink-0" />
                <span className="text-xs text-amber-700">{a.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Recent Achievements</span>
        </div>
        <div className="space-y-1.5 pl-3.5">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
              <i className="ri-checkbox-circle-fill text-emerald-500 text-xs mt-0.5 flex-shrink-0" />
              <span className="text-xs text-emerald-700">{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}