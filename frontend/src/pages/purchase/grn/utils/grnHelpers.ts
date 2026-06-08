export function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
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
  return {
    from: toDateStr(from),
    to: toDateStr(now),
  };
}