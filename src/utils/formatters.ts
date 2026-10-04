import { UserRole } from '../types/stock';

export function formatGhs(amount: number): string {
  const num = Number(amount) || 0;
  return `GH₵ ${num.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuantity(qty: number): string {
  const num = Number(qty) || 0;
  return Number.isInteger(num)
    ? num.toLocaleString('en-GH')
    : num.toLocaleString('en-GH', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function validateGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // 0XX XXX XXXX (10 digits starting with 02, 05, 03) or +233XX... (12 or 13 chars)
  if (/^0[235][0-9]{8}$/.test(cleaned)) return true;
  if (/^\+233[235][0-9]{8}$/.test(cleaned)) return true;
  if (/^233[235][0-9]{8}$/.test(cleaned)) return true;
  return false;
}

export function validateGhanaTin(tin: string): boolean {
  const cleaned = tin.trim().toUpperCase();
  // Valid format: typically C or P or V or Q followed by 8-10 digits, or 10-11 alphanumeric chars
  return /^[A-Z0-9]{8,15}$/.test(cleaned);
}

export type AppRouteId =
  | 'dashboard'
  | 'stock'
  | 'stock-detail'
  | 'movements'
  | 'requisitions'
  | 'new-requisition'
  | 'my-requisitions'
  | 'requisition-detail'
  | 'suppliers'
  | 'supplier-detail'
  | 'supplier-statement'
  | 'purchases'
  | 'tax-overview'
  | 'tax-returns'
  | 'tax-settings'
  | 'expiry'
  | 'alert-settings'
  | 'alerts'
  | 'users'
  | 'security';

export function isRouteAllowedForRole(role: UserRole, route: AppRouteId): boolean {
  if (role === 'manager') {
    return true;
  }
  if (role === 'storekeeper') {
    return (
      route === 'dashboard' ||
      route === 'stock' ||
      route === 'stock-detail' ||
      route === 'movements' ||
      route === 'requisitions' ||
      route === 'requisition-detail' ||
      route === 'suppliers' ||
      route === 'supplier-detail' ||
      route === 'supplier-statement' ||
      route === 'purchases' ||
      route === 'tax-overview' ||
      route === 'tax-returns' ||
      route === 'expiry' ||
      route === 'alerts'
    );
  }
  if (role === 'staff') {
    // Staff can ONLY access New Requisition, My Requisitions, and Requisition Detail
    return (
      route === 'new-requisition' ||
      route === 'my-requisitions' ||
      route === 'requisition-detail'
    );
  }
  return false;
}

export function getDefaultRouteForRole(role: UserRole): AppRouteId {
  if (role === 'staff') return 'new-requisition';
  return 'dashboard';
}

/**
 * Calculates ISO week number (Monday to Sunday)
 */
export function getIsoWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns document IDs and date bounds for day, week, month tax summaries
 */
export function getTaxPeriodIds(dateStr: string): {
  dayId: string;
  dayPeriod: string;
  weekId: string;
  weekPeriod: string;
  weekStart: string;
  weekEnd: string;
  monthId: string;
  monthPeriod: string;
  monthStart: string;
  monthEnd: string;
} {
  const d = new Date(dateStr);
  const dayPeriod = dateStr.slice(0, 10);
  const dayId = `day_${dayPeriod}`;

  // Week bounds (Monday to Sunday)
  const currentDay = d.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);
  const weekPeriod = getIsoWeekString(d);
  const weekId = `week_${weekPeriod}`;

  // Month bounds
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthPeriod = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthId = `month_${monthPeriod}`;
  const monthStart = `${monthPeriod}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${monthPeriod}-${String(lastDay).padStart(2, '0')}`;

  return {
    dayId,
    dayPeriod,
    weekId,
    weekPeriod,
    weekStart,
    weekEnd,
    monthId,
    monthPeriod,
    monthStart,
    monthEnd,
  };
}

/**
 * Calculates GRA VAT return due date: last working day (Mon-Fri) of the month following the period.
 * e.g. for "2026-10", following month is November 2026. Last day is Nov 30 (Monday).
 */
export function calculateGraReturnDueDate(periodYyyyMm: string): string {
  const [yearStr, monthStr] = periodYyyyMm.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Following month
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // Last day of nextMonth
  const lastDay = new Date(nextYear, nextMonth, 0); // day 0 of month after nextMonth gives last day of nextMonth
  // If Saturday (6), move to Friday (-1 day); If Sunday (0), move to Friday (-2 days)
  const dayOfWeek = lastDay.getDay();
  if (dayOfWeek === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  } else if (dayOfWeek === 0) {
    lastDay.setDate(lastDay.getDate() - 2);
  }

  const y = lastDay.getFullYear();
  const m = String(lastDay.getMonth() + 1).padStart(2, '0');
  const d = String(lastDay.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
