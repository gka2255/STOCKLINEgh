import React, { useState, useEffect } from 'react';
import {
  Database,
  ArrowRight,
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  ClipboardList,
  Bell,
  ArrowUpRight,
  CreditCard,
  Building2,
  Receipt,
  Truck,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  Purchase,
  Requisition,
  StockAlert,
  StockBatch,
  StockMovement,
  Supplier,
} from '../types/stock';
import {
  checkDueDateAlerts,
  getBatchExpiryStatus,
  loadGhanaDemoData,
} from '../services/stockService';
import {
  AppRouteId,
  formatDateShort,
  formatDateTimeShort,
  formatGhs,
  formatQuantity,
} from '../utils/formatters';

interface DashboardPageProps {
  currentUser: AppUser;
  items: EnrichedStockItem[];
  batches: StockBatch[];
  movements: StockMovement[];
  requisitions: Requisition[];
  alerts: StockAlert[];
  purchases?: Purchase[];
  suppliers?: Supplier[];
  onNavigate: (route: AppRouteId) => void;
  onSelectItemDetail: (itemId: string) => void;
  onSelectRequisitionDetail: (reqId: string) => void;
  onOpenReceiveModal: (itemId?: string) => void;
  onOpenDirectIssueModal?: () => void;
  onShowToast: (msg: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  items,
  batches,
  movements,
  requisitions,
  alerts,
  purchases = [],
  suppliers = [],
  onNavigate,
  onSelectItemDetail,
  onSelectRequisitionDetail,
  onOpenReceiveModal,
  onOpenDirectIssueModal,
  onShowToast,
}) => {
  const [seeding, setSeeding] = useState(false);

  // Scan due date alerts on dashboard load for Manager and Storekeeper
  useEffect(() => {
    if (currentUser.role === 'manager' || currentUser.role === 'storekeeper') {
      if (purchases.length > 0) {
        checkDueDateAlerts(currentUser, purchases, alerts);
      }
    }
  }, [currentUser, purchases, alerts]);

  // Compute metrics
  const activeItems = items.filter((i) => i.isActive);
  const totalActiveCount = activeItems.length;
  const lowStockCount = activeItems.filter((i) => i.status === 'Low').length;
  const finishedCount = activeItems.filter((i) => i.status === 'Finished').length;

  const itemsExpiringWithin7Days = activeItems.filter((item) => {
    const itemBatches = batches.filter(
      (b) => b.itemId === item.id && b.quantityRemaining > 0 && b.expiryDate
    );
    return itemBatches.some((b) => {
      const exp = getBatchExpiryStatus(b.expiryDate, b.quantityRemaining);
      return exp.status === 'expiring-soon';
    });
  }).length;

  // Module 2 metrics
  const openAlertsCount = alerts.filter((a) => !a.resolved).length;
  const pendingRequisitionsCount = requisitions.filter((r) => r.status === 'pending').length;

  // Module 3 metrics: Supplier Ledger
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const oneWeekAheadMs = todayMs + 7 * 24 * 3600 * 1000;

  const totalArrearsGhs = purchases.reduce((sum, p) => sum + (Number(p.arrears) || 0), 0);
  const overduePaymentsCount = purchases.filter(
    (p) => p.arrears > 0 && new Date(p.dueDate).getTime() < todayMs
  ).length;

  const dueThisWeekCount = purchases.filter((p) => {
    if (p.arrears <= 0) return false;
    const dueTime = new Date(p.dueDate).getTime();
    return dueTime >= todayMs && dueTime <= oneWeekAheadMs;
  }).length;

  const totalInventoryValueGhs = activeItems.reduce(
    (sum, i) => sum + i.totalValueGhs,
    0
  );

  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const itemMap = new Map(items.map((i) => [i.id, i]));

  const pendingRequisitionsList = requisitions
    .filter((r) => r.status === 'pending')
    .slice(0, 4);

  const handleSeedDemoData = async () => {
    if (currentUser.role !== 'manager') return;
    setSeeding(true);
    try {
      const res = await loadGhanaDemoData(currentUser);
      onShowToast(
        `Seeded ${res.itemCount} items, ${res.batchCount} batches, ${res.requisitionCount} requisitions, ${res.supplierCount || 5} suppliers, and ${res.purchaseCount || 10} deliveries in GH₵.`
      );
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to seed demo data.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Kitchen Operations & Store Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            FIFO inventory monitoring, supplier ledger arrears, stock alerts, and staff requisitions ·
            Total Stock Value:{' '}
            <span className="font-mono font-semibold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
              {formatGhs(totalInventoryValueGhs)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser.role === 'manager' && (
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="flex items-center gap-2 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] disabled:opacity-50 transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
            >
              <Database className="h-3.5 w-3.5 text-[#14532D] dark:text-[#22C55E]" />
              <span>{seeding ? 'Seeding Demo Data...' : 'Load demo data'}</span>
            </button>
          )}

          {onOpenDirectIssueModal && (
            <button
              type="button"
              onClick={onOpenDirectIssueModal}
              className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
            >
              <span>Direct Walk-In Issue</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('requisitions')}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A]"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Requisitions Queue</span>
          </button>
        </div>
      </div>

      {/* Module 3: Supplier Ledger KPI Cards (Total Arrears, Overdue Count, Due This Week) */}
      <section aria-label="Supplier Ledger Metrics" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
            Supplier Accounts & Creditor Ledger (Module 3)
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('purchases')}
            className="text-xs font-medium text-[#14532D] hover:underline dark:text-[#22C55E]"
          >
            View Purchases Ledger →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 1. Total Arrears Owed */}
          <div
            onClick={() => onNavigate('purchases')}
            className="cursor-pointer rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs transition-colors hover:border-amber-600 dark:border-[#223028] dark:bg-[#131C17]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Total Arrears Owed
              </span>
              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {formatGhs(totalArrearsGhs)}
            </p>
            <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Outstanding across {purchases.filter((p) => p.arrears > 0).length} food deliveries
            </p>
          </div>

          {/* 2. Overdue Payments Count */}
          <div
            onClick={() => onNavigate('purchases')}
            className={`cursor-pointer rounded-xl border p-5 shadow-xs transition-colors ${
              overduePaymentsCount > 0
                ? 'border-red-300 bg-red-50/30 hover:border-red-600 dark:border-red-900/60 dark:bg-red-950/20'
                : 'border-[#E4E0D8] bg-white hover:border-[#14532D] dark:border-[#223028] dark:bg-[#131C17]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Overdue Payments
              </span>
              <AlertTriangle
                className={`h-4 w-4 ${
                  overduePaymentsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#5C6660]'
                }`}
              />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  overduePaymentsCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#181D1A] dark:text-[#ECF2EE]'
                }`}
              >
                {overduePaymentsCount}
              </span>
              {overduePaymentsCount > 0 && (
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  Critical Alert
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Deliveries with unpaid balance past due date
            </p>
          </div>

          {/* 3. Due This Week */}
          <div
            onClick={() => onNavigate('purchases')}
            className="cursor-pointer rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs transition-colors hover:border-[#14532D] dark:border-[#223028] dark:bg-[#131C17]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Due This Week
              </span>
              <Clock className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
              {dueThisWeekCount}
            </p>
            <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Deliveries maturing within next 7 days
            </p>
          </div>
        </div>
      </section>

      {/* Summary Cards Grid (Including Open Alerts and Pending Requisitions) */}
      <section
        aria-label="Stock & Requisitions Summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {/* 1. Open Alerts (Module 2) */}
        <div
          onClick={() => onNavigate('alerts')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-[#D97706] dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Open Alerts
            </span>
            <Bell className="h-4 w-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#D97706] dark:text-amber-400">
            {openAlertsCount}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Unresolved stock triggers
          </p>
        </div>

        {/* 2. Pending Requisitions (Module 2) */}
        <div
          onClick={() => onNavigate('requisitions')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-[#14532D] dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Pending Reqs
            </span>
            <ClipboardList className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
            {pendingRequisitionsCount}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Awaiting storekeeper issue
          </p>
        </div>

        {/* 3. Total Active Items */}
        <div
          onClick={() => onNavigate('stock')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-[#14532D] dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Active Items
            </span>
            <Package className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {totalActiveCount}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Catalog inventory
          </p>
        </div>

        {/* 4. Low-Stock Count */}
        <div
          onClick={() => onNavigate('stock')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-amber-500 dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Low-Stock Items
            </span>
            <AlertTriangle className="h-4 w-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#D97706] dark:text-amber-400">
            {lowStockCount}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            ≤ reorder threshold
          </p>
        </div>

        {/* 5. Finished Count */}
        <div
          onClick={() => onNavigate('stock')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-red-500 dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Finished Items
            </span>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
            {finishedCount}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            0 remaining stock
          </p>
        </div>

        {/* 6. Items Expiring ≤ 7 Days */}
        <div
          onClick={() => onNavigate('stock')}
          className="cursor-pointer rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors hover:border-amber-500 dark:border-[#223028] dark:bg-[#131C17]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Expiring ≤ 7d
            </span>
            <Clock className="h-4 w-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <p className="mt-2.5 font-mono text-2xl font-bold tabular-nums text-[#D97706] dark:text-amber-400">
            {itemsExpiringWithin7Days}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Perishable FIFO check
          </p>
        </div>
      </section>

      {/* Main Two-Column Grid: Pending Requisitions & Recent Movements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Pending Requisitions Queue Card */}
        <section className="rounded-lg border border-[#E4E0D8] bg-white lg:col-span-6 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between border-b border-[#E4E0D8] px-5 py-4 dark:border-[#223028]">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
              <h2 className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Pending Requisitions Queue
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('requisitions')}
              className="text-xs font-medium text-[#14532D] hover:underline dark:text-[#22C55E]"
            >
              All Requisitions →
            </button>
          </div>

          {pendingRequisitionsList.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[#14532D] dark:text-[#22C55E]" />
              <p className="mt-2 text-sm font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                No pending requisitions
              </p>
              <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                All department staff requests have been processed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {pendingRequisitionsList.map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequisitionDetail(req.id)}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[#FAF8F5] cursor-pointer transition-colors dark:hover:bg-[#17221C]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#14532D] dark:text-[#22C55E]">
                        {req.requisitionNumber}
                      </span>
                      <span className="text-[#8C9690]">·</span>
                      <span className="font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                        {req.requestedBy.userName}
                      </span>
                      <span className="text-[#8C9690]">·</span>
                      <span className="rounded-md bg-[#F4F1EA] px-2 py-0.5 text-[10px] font-medium text-[#5C6660] dark:bg-[#0D1310] dark:text-[#9AA89F]">
                        {req.department}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F] line-clamp-1">
                      {req.lines.map((l) => `${l.itemName} (${l.quantityRequested} ${l.unit})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      Pending Issue
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#8C9690]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Movements List */}
        <section className="rounded-lg border border-[#E4E0D8] bg-white lg:col-span-6 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between border-b border-[#E4E0D8] px-5 py-4 dark:border-[#223028]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Recent Stock Movements
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Immutable transactions from requisitions and receipts
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('movements')}
              className="text-xs font-medium text-[#14532D] hover:underline dark:text-[#22C55E]"
            >
              Full Ledger →
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                No movements recorded yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {recentMovements.map((mov) => {
                const item = itemMap.get(mov.itemId);
                const sign =
                  mov.type === 'received'
                    ? '+'
                    : mov.type === 'used' || mov.type === 'wasted'
                    ? '−'
                    : '±';
                const qtyColor =
                  mov.type === 'received'
                    ? 'text-[#14532D] dark:text-[#22C55E]'
                    : mov.type === 'wasted'
                    ? 'text-red-600 dark:text-red-400'
                    : mov.type === 'adjusted'
                    ? 'text-[#D97706] dark:text-amber-400'
                    : 'text-[#181D1A] dark:text-[#ECF2EE]';

                return (
                  <div
                    key={mov.id}
                    className="flex items-start justify-between gap-4 px-5 py-3 hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => item && onSelectItemDetail(item.id)}
                          className="font-semibold text-[#181D1A] hover:underline dark:text-[#ECF2EE]"
                        >
                          {item ? item.name : mov.itemId}
                        </button>
                        <span className="text-[#8C9690]" aria-hidden="true">
                          ·
                        </span>
                        <span className="capitalize font-medium text-[#5C6660] dark:text-[#9AA89F]">
                          {mov.type}
                        </span>
                        {mov.requisitionNumber && (
                          <>
                            <span className="text-[#8C9690]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-[#14532D] dark:text-[#22C55E]">
                              {mov.requisitionNumber}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#5C6660] dark:text-[#9AA89F] line-clamp-1">
                        {mov.note}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7A857E] dark:text-[#84948B]">
                        <span>{mov.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDateTimeShort(mov.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${qtyColor}`}
                      >
                        {sign}
                        {formatQuantity(mov.quantity)} {item?.unit || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
