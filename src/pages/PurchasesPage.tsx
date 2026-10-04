import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  CreditCard,
  AlertTriangle,
  Calendar,
  Building2,
  FileText,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  AppUser,
  PaymentStatus,
  Purchase,
  Supplier,
} from '../types/stock';
import { formatDateShort, formatGhs } from '../utils/formatters';

interface PurchasesPageProps {
  currentUser: AppUser;
  purchases: Purchase[];
  suppliers: Supplier[];
  onSelectSupplierDetail: (supplierId: string) => void;
  onSelectSupplierStatement: (supplierId: string) => void;
  onOpenRecordDeliveryModal: (supplierId?: string) => void;
  onOpenRecordPaymentModal: (supplierId: string, purchase?: Purchase) => void;
}

export const PurchasesPage: React.FC<PurchasesPageProps> = ({
  currentUser,
  purchases,
  suppliers,
  onSelectSupplierDetail,
  onSelectSupplierStatement,
  onOpenRecordDeliveryModal,
  onOpenRecordPaymentModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    'ALL' | PaymentStatus | 'overdue'
  >('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | '30d' | '90d'>('ALL');

  const todayMs = new Date().setHours(0, 0, 0, 0);

  // Compute metrics
  const totalPurchasesValue = purchases.reduce((sum, p) => sum + (Number(p.totalWithTax ?? p.subtotal) || 0), 0);
  const totalArrears = purchases.reduce((sum, p) => sum + (Number(p.arrears) || 0), 0);
  const overduePurchases = purchases.filter(
    (p) => p.arrears > 0 && new Date(p.dueDate).getTime() < todayMs
  );
  const overdueCount = overduePurchases.length;

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Supplier filter
      if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;

      // Status filter
      const isOverdue = p.arrears > 0 && new Date(p.dueDate).getTime() < todayMs;
      if (paymentStatusFilter === 'overdue' && !isOverdue) return false;
      if (
        paymentStatusFilter !== 'ALL' &&
        paymentStatusFilter !== 'overdue' &&
        p.paymentStatus !== paymentStatusFilter
      ) {
        return false;
      }

      // Date range filter
      if (dateFilter === '30d') {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
        if (new Date(p.dateSupplied).getTime() < thirtyDaysAgo) return false;
      } else if (dateFilter === '90d') {
        const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
        if (new Date(p.dateSupplied).getTime() < ninetyDaysAgo) return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.purchaseNumber.toLowerCase().includes(term) ||
        p.supplierName.toLowerCase().includes(term) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
        p.lines.some((l) => l.itemName.toLowerCase().includes(term))
      );
    });
  }, [purchases, selectedSupplierId, paymentStatusFilter, dateFilter, searchTerm, todayMs]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Purchases & Deliveries Ledger
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Track all incoming stock deliveries, due dates, payments, and creditor arrears
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenRecordDeliveryModal()}
          className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
        >
          <Plus className="h-4 w-4" />
          <span>Record New Delivery</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Purchases Value
            </span>
            <Receipt className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              {formatGhs(totalPurchasesValue)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Across {purchases.length} total deliveries recorded
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Outstanding Arrears
            </span>
            <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {formatGhs(totalArrears)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Pending settlement to suppliers
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Overdue Deliveries
            </span>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-bold tracking-tight ${
                overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#181D1A] dark:text-[#ECF2EE]'
              }`}
            >
              {overdueCount}
            </span>
            {overdueCount > 0 && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Action required
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Deliveries with unpaid balance past due date
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Search Purchases
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5C6660] dark:text-[#9AA89F]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by purchase # (e.g. PUR-0001), supplier, invoice, or item..."
                className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] py-1.5 pl-8 pr-3 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Suppliers ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                setPaymentStatusFilter(e.target.value as 'ALL' | PaymentStatus | 'overdue')
              }
              className="mt-1 w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Statuses</option>
              <option value="overdue">⚠️ Overdue Past Due Date ({overdueCount})</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E4E0D8] pt-3 text-xs text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F]">
          <div className="flex items-center gap-2">
            <span>Date Range:</span>
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              className={`rounded px-2 py-0.5 text-xs ${
                dateFilter === 'ALL'
                  ? 'bg-[#14532D] text-white dark:bg-[#16A34A]'
                  : 'hover:bg-[#EFECE6] dark:hover:bg-[#1C2822]'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('30d')}
              className={`rounded px-2 py-0.5 text-xs ${
                dateFilter === '30d'
                  ? 'bg-[#14532D] text-white dark:bg-[#16A34A]'
                  : 'hover:bg-[#EFECE6] dark:hover:bg-[#1C2822]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('90d')}
              className={`rounded px-2 py-0.5 text-xs ${
                dateFilter === '90d'
                  ? 'bg-[#14532D] text-white dark:bg-[#16A34A]'
                  : 'hover:bg-[#EFECE6] dark:hover:bg-[#1C2822]'
              }`}
            >
              Last 90 Days
            </button>
          </div>

          {(searchTerm ||
            selectedSupplierId !== 'ALL' ||
            paymentStatusFilter !== 'ALL' ||
            dateFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSupplierId('ALL');
                setPaymentStatusFilter('ALL');
                setDateFilter('ALL');
              }}
              className="inline-flex items-center gap-1 text-xs text-[#14532D] hover:underline dark:text-[#22C55E]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Purchases Ledger Table */}
      {filteredPurchases.length === 0 ? (
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
          <Receipt className="mx-auto h-8 w-8 text-[#5C6660] dark:text-[#9AA89F]" />
          <p className="mt-3 font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            No purchases match your criteria
          </p>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Adjust your filters or record a new delivery receipt.
          </p>
          <button
            type="button"
            onClick={() => onOpenRecordDeliveryModal()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
          >
            <Plus className="h-4 w-4" />
            <span>Record Delivery</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Purchase #</th>
                  <th className="px-4 py-3.5 font-semibold">Supplier</th>
                  <th className="px-4 py-3.5 font-semibold">Date Supplied</th>
                  <th className="px-4 py-3.5 font-semibold">Due Date</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Net Subtotal</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Tax (20%)</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Total Payable</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Amount Paid</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Arrears (Owed)</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Method</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {filteredPurchases.map((pur) => {
                  const isOverdue =
                    pur.arrears > 0 && new Date(pur.dueDate).getTime() < todayMs;

                  return (
                    <tr
                      key={pur.id}
                      className={`hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C] ${
                        isOverdue
                          ? 'border-l-4 border-l-red-600 bg-red-50/40 dark:bg-red-950/20'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                          {pur.purchaseNumber}
                        </div>
                        {pur.invoiceNumber && (
                          <div className="font-mono text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                            Inv: {pur.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectSupplierDetail(pur.supplierId)}
                          className="text-left font-medium text-[#181D1A] hover:text-[#14532D] hover:underline dark:text-[#ECF2EE] dark:hover:text-[#22C55E]"
                        >
                          {pur.supplierName}
                        </button>
                        <div className="text-[10px] text-[#8C9690]">
                          {pur.lines.length} {pur.lines.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                        {formatDateShort(pur.dateSupplied)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div
                          className={`font-mono text-[11px] ${
                            isOverdue
                              ? 'font-bold text-red-600 dark:text-red-400'
                              : 'text-[#5C6660] dark:text-[#9AA89F]'
                          }`}
                        >
                          {formatDateShort(pur.dueDate)}
                        </div>
                        {isOverdue && (
                          <span className="inline-block rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-red-800 dark:bg-red-900/60 dark:text-red-200">
                            Overdue
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums text-[#5C6660] dark:text-[#9AA89F]">
                        {formatGhs(pur.subtotal)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums text-[#14532D] dark:text-[#22C55E]">
                        {formatGhs(pur.totalTax || 0)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(pur.totalWithTax || pur.subtotal)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatGhs(pur.amountPaid)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums">
                        {pur.arrears > 0 ? (
                          <span
                            className={
                              isOverdue
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }
                          >
                            {formatGhs(pur.arrears)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-normal">
                            GH₵ 0.00
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            pur.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : pur.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {pur.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[10px] uppercase text-[#5C6660] dark:text-[#9AA89F]">
                        {pur.paymentMethod || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pur.arrears > 0 ? (
                            <button
                              type="button"
                              onClick={() => onOpenRecordPaymentModal(pur.supplierId, pur)}
                              className="rounded-md border border-[#14532D] bg-[#14532D] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#166534] dark:border-[#16A34A] dark:bg-[#16A34A]"
                              title="Record payment"
                            >
                              Settle
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectSupplierStatement(pur.supplierId)}
                              className="rounded-md border border-[#D5D0C6] bg-white px-2 py-1 text-[11px] font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
                              title="View Supplier Statement"
                            >
                              Statement
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
