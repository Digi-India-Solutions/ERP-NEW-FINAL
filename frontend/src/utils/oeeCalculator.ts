import {
  mockShifts,
  mockDowntimeEntries,
  mockProductionEntries,
  mockMachines,
} from '@/mocks/masters';

function getMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export interface OEEResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  plannedMinutes: number;
  downtimeMinutes: number;
  runTime: number;
  producedQty: number;
  rejectedQty: number;
  asPercent: {
    availability: number;
    performance: number;
    quality: number;
    oee: number;
  };
}

export const calculateOEE = (
  machineId: string,
  date: string,
  shiftId: string,
): OEEResult => {
  let plannedMinutes = 0;

  if (shiftId === 'all') {
    for (const shift of mockShifts) {
      if (!shift.isActive) continue;
      const start = getMinutes(shift.startTime);
      const end = getMinutes(shift.endTime);
      let shiftMinutes = end - start;
      if (shiftMinutes < 0) shiftMinutes += 24 * 60;
      plannedMinutes += shiftMinutes - shift.breakMinutes;
    }
  } else {
    const shift = mockShifts.find((s) => s.id === shiftId);
    if (shift) {
      const start = getMinutes(shift.startTime);
      const end = getMinutes(shift.endTime);
      let shiftMinutes = end - start;
      if (shiftMinutes < 0) shiftMinutes += 24 * 60;
      plannedMinutes = shiftMinutes - shift.breakMinutes;
    } else {
      plannedMinutes = 480;
    }
  }

  const downtimes = mockDowntimeEntries.filter(
    (d) =>
      d.machineId === machineId &&
      d.date === date &&
      (shiftId === 'all' || d.shiftId === shiftId) &&
      d.isResolved,
  );
  const downtimeMinutes = downtimes.reduce(
    (sum, d) => sum + (d.durationMinutes || 0),
    0,
  );

  const runTime = plannedMinutes - downtimeMinutes;
  const availability = plannedMinutes > 0 ? runTime / plannedMinutes : 0;

  const entries = mockProductionEntries.filter(
    (e) =>
      e.machineId === machineId &&
      e.date === date &&
      (shiftId === 'all' || e.shiftId === shiftId),
  );
  const producedQty = entries.reduce((sum, e) => sum + e.producedQty, 0);
  const rejectedQty = entries.reduce((sum, e) => sum + e.rejectedQty, 0);
  const totalQty = producedQty + rejectedQty;

  const machine = mockMachines.find((m) => m.id === machineId);
  const idealCycleTime = machine ? 60 / machine.capacityPerHour : 1;
  const performance = runTime > 0 ? (idealCycleTime * totalQty) / runTime : 0;

  const quality = totalQty > 0 ? producedQty / totalQty : 1;

  const oee = availability * performance * quality;

  return {
    availability: Math.min(1, availability),
    performance: Math.min(1, performance),
    quality,
    oee: Math.min(1, oee),
    plannedMinutes,
    downtimeMinutes,
    runTime,
    producedQty,
    rejectedQty,
    asPercent: {
      availability: Math.round(Math.min(1, availability) * 100),
      performance: Math.round(Math.min(1, performance) * 100),
      quality: Math.round(quality * 100),
      oee: Math.round(Math.min(1, oee) * 100),
    },
  };
};
