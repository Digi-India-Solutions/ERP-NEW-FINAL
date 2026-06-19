import { useState, useMemo, useCallback, useEffect } from 'react';

interface WorkOrderEditModalProps {
  open: boolean;
  workOrder: any | null;
  onClose: () => void;
  onSave: (updated: any) => void;
  machines: any[];
  operators: any[];
  shifts: any[];
  workCenters: any[];
}

function getRelevantSkill(stageName: string): string | null {
  const map: Record<string, string> = {
    'Incoming Inspection': 'QC_INSPECTOR',
    'Casting & Cutting': 'MACHINIST',
    Machining: 'MACHINIST',
    Assembly: 'ASSEMBLER',
    'Final Inspection': 'QC_INSPECTOR',
    Packing: 'ASSEMBLER',
  };
  return map[stageName] || null;
}

export default function WorkOrderEditModal({
  open,
  workOrder,
  onClose,
  onSave,
  machines,
  operators,
  shifts,
  workCenters,
}: WorkOrderEditModalProps) {
  const [machineId, setMachineId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when workOrder changes or modal is opened
  useEffect(() => {
    if (workOrder && open) {
      setMachineId(workOrder.machineId || '');
      setOperatorId(workOrder.operatorId || '');
      setShiftId(workOrder.shiftId || '');
      setActualStart(workOrder.actualStartDate || '');
      setActualEnd(workOrder.actualEndDate || '');
      setNotes(workOrder.notes || '');
    }
  }, [workOrder, open]);

  const filteredMachines = useMemo(() => {
    if (!workOrder) return [];
    return machines.filter((m) => {
      const wcId = m.workCenterId ?? m.work_center_id ?? m.workcenterid;
      const act = m.isActive ?? m.is_active ?? m.isactive ?? true;
      const matchWc = String(wcId) === String(workOrder.workCenterId);
      return matchWc && act;
    });
  }, [workOrder, machines]);

  const relevantSkill = useMemo(() => {
    if (!workOrder) return null;
    return getRelevantSkill(workOrder.stageName);
  }, [workOrder?.stageName]);

  const filteredOperators = useMemo(() => {
    if (!workOrder) return [];
    return operators.filter((o) => {
      const act = o.isActive ?? o.is_active ?? o.isactive ?? true;
      if (!act) return false;
      if (relevantSkill) {
        return o.skill === relevantSkill;
      }
      return true;
    });
  }, [workOrder, operators, relevantSkill]);

  const handleSave = useCallback(() => {
    if (!workOrder) return;
    const machine = machines.find((m) => String(m.id) === String(machineId));
    const operator = operators.find((o) => String(o.id) === String(operatorId));
    const shift = shifts.find((s) => String(s.id) === String(shiftId));
    const updated = {
      ...workOrder,
      machineId: machineId || null,
      machineName: machine?.name || null,
      operatorId: operatorId || null,
      operatorName: operator?.name || null,
      shiftId: shiftId || null,
      shiftName: shift?.name || null,
      actualStartDate: actualStart || null,
      actualEndDate: actualEnd || null,
      notes: notes || null,
    };
    onSave(updated);
  }, [
    workOrder,
    machineId,
    operatorId,
    shiftId,
    actualStart,
    actualEnd,
    notes,
    machines,
    operators,
    shifts,
    onSave,
  ]);

  if (!open || !workOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-[480px] sm:rounded-xl shadow-2xl sm:max-h-[90vh] overflow-y-auto rounded-t-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              Edit Work Order
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {workOrder.woNumber} — {workOrder.stageName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Machine */}
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
              Machine
            </label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              <option value="">— Not assigned —</option>
              {filteredMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.model ? `(${m.model})` : ''}
                </option>
              ))}
            </select>
            {filteredMachines.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No active machines found for{' '}
                {workCenters.find((wc) => String(wc.id) === String(workOrder.workCenterId))
                  ?.name || 'this work center'}
              </p>
            )}
          </div>

          {/* Operator */}
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
              Operator
              {relevantSkill && (
                <span className="text-[#94a3b8] font-normal normal-case ml-1">
                  (Skill: {relevantSkill.replace('_', ' ')})
                </span>
              )}
            </label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              <option value="">— Not assigned —</option>
              {filteredOperators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.employeeCode || o.employee_code ? `(${o.employeeCode || o.employee_code})` : ''}
                </option>
              ))}
            </select>
            {filteredOperators.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No active operators with matching skill
              </p>
            )}
          </div>

          {/* Shift */}
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
              Shift
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
            >
              <option value="">— Not assigned —</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime || s.start_time}–{s.endTime || s.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Actual Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Actual Start
              </label>
              <input
                type="date"
                value={actualStart ? actualStart.split('T')[0] : ''}
                onChange={(e) => setActualStart(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Actual End
              </label>
              <input
                type="date"
                value={actualEnd ? actualEnd.split('T')[0] : ''}
                onChange={(e) => setActualEnd(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-medium text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] cursor-pointer whitespace-nowrap"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
