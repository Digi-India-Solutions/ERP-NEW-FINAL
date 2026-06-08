/**
 * Money: always work with integers (paise) or Decimal strings internally.
 * Never use JS float for arithmetic — pass strings from DB.
 * Display helpers below are for UI only.
 */

/** Format a number as Indian currency string: ₹1,28,500.00 */
export function formatINR(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Format a number as short Indian currency: ₹1.28L, ₹42K */
export function formatINRShort(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(2)}`;
}

/**
 * Safe multiply: qty × rate without float drift.
 * Rounds to 2 decimal places.
 */
export function calcAmount(qty: number, rate: number): number {
  return Math.round(qty * rate * 100) / 100;
}

/**
 * Date: store UTC, display IST (Asia/Kolkata)
 */
const IST_LOCALE = 'en-IN';
const IST_TZ = 'Asia/Kolkata';

export function formatDateIST(date: string | Date): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTimeIST(date: string | Date): string {
  return new Intl.DateTimeFormat(IST_LOCALE, {
    timeZone: IST_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Convert a Date to YYYY-MM-DD string for input[type=date] */
export function toInputDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
