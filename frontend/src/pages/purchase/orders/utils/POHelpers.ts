//  FIX: guard against null/undefined/NaN from backend
export function formatINR(n: number | null | undefined): string {
  const safe = typeof n === 'number' && isFinite(n) ? n : 0;
  return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sixMonthsAgoRange() {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 6);
  return { from: toDateStr(from), to: toDateStr(now) };
}