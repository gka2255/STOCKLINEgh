import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Check,
  RotateCcw,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  AppUser,
  AlertType,
  AlertSeverity,
  StockAlert,
} from '../types/stock';
import {
  markAlertAsRead,
  markAllAlertsAsRead,
  resolveStockAlert,
} from '../services/stockService';
import { formatDateTimeShort } from '../utils/formatters';

interface AlertsPageProps {
  currentUser: AppUser;
  alerts: StockAlert[];
  onSelectItemDetail: (itemId: string) => void;
  onNavigateToPurchases?: () => void;
  onNavigateToTaxReturns?: () => void;
  onShowToast: (msg: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  currentUser,
  alerts,
  onSelectItemDetail,
  onNavigateToPurchases,
  onNavigateToTaxReturns,
  onShowToast,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | AlertType>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'open' | 'resolved'>('ALL');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (statusFilter === 'open' && a.resolved) return false;
      if (statusFilter === 'resolved' && !a.resolved) return false;
      return true;
    });
  }, [alerts, typeFilter, severityFilter, statusFilter]);

  const unreadCount = alerts.filter((a) => !a.readBy.includes(currentUser.uid)).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsAsRead(currentUser);
      onShowToast('All stock alerts marked as read.');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not mark alerts as read.');
    }
  };

  const handleMarkSingleRead = async (alertId: string) => {
    try {
      await markAlertAsRead(currentUser, alertId);
    } catch {
      // quiet
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveStockAlert(currentUser, alertId);
      onShowToast('Alert marked as resolved.');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not resolve alert.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              Stock Alerts & Reorder Triggers
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Automated alerts triggered during stock reductions and resolved upon receiving new inventory.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Check className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Alert Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | AlertType)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Types</option>
              <option value="finished_stock">Finished Stock (0 remaining)</option>
              <option value="low_stock">Low Stock (≤ reorder level)</option>
              <option value="stock_updated">Stock Updated (Received)</option>
              <option value="payment_overdue">Payment Overdue (Critical)</option>
              <option value="payment_due_soon">Payment Due Soon (Warning)</option>
              <option value="tax_return_overdue">Tax Return Overdue (GRA Return)</option>
              <option value="tax_return_due_soon">Tax Return Due Soon (GRA Return)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | AlertSeverity)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Resolution Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'open' | 'resolved')}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Alerts</option>
              <option value="open">Open / Unresolved Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#E4E0D8] pt-3 text-xs text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F]">
          <span>
            Showing <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{filteredAlerts.length}</strong> of{' '}
            <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{alerts.length}</strong> alerts
          </span>

          {(typeFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter('ALL');
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#14532D] hover:underline dark:text-[#22C55E]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[#14532D] dark:text-[#22C55E]" />
          <p className="mt-3 font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            No alerts match your filter criteria
          </p>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            All inventory thresholds are nominal or matching alerts are cleared.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isUnread = !alert.readBy.includes(currentUser.uid);

            const icon =
              alert.severity === 'critical' ? (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              ) : alert.severity === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-[#D97706] dark:text-amber-400 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-[#14532D] dark:text-[#22C55E] shrink-0" />
              );

            const borderTone =
              alert.severity === 'critical'
                ? 'border-l-4 border-l-red-600'
                : alert.severity === 'warning'
                ? 'border-l-4 border-l-[#D97706]'
                : 'border-l-4 border-l-[#14532D] dark:border-l-[#22C55E]';

            return (
              <div
                key={alert.id}
                className={`rounded-lg border border-[#E4E0D8] bg-white p-4 transition-colors dark:border-[#223028] dark:bg-[#131C17] ${borderTone} ${
                  isUnread ? 'bg-[#FAF8F5] dark:bg-[#17221C]' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{icon}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-[#181D1A] dark:text-[#ECF2EE]">
                          {alert.itemName || (alert.purchaseNumber ? `Purchase ${alert.purchaseNumber}` : 'Stock Notice')}
                        </span>
                        <span className="text-[#8C9690]" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : alert.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.resolved ? (
                          <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-[#14532D] dark:bg-green-950/40 dark:text-[#22C55E]">
                            Resolved
                          </span>
                        ) : (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                            Action Needed
                          </span>
                        )}
                        {isUnread && (
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#2E3833] dark:text-[#C8D4CC]">
                        {alert.message}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                        <span>Triggered by {alert.triggeredBy.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDateTimeShort(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkSingleRead(alert.id)}
                        className="rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
                      >
                        Mark as read
                      </button>
                    )}

                    {!alert.resolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="rounded-md border border-[#14532D] bg-[#14532D]/5 px-2.5 py-1 text-xs font-medium text-[#14532D] hover:bg-[#14532D]/15 dark:border-[#22C55E] dark:text-[#22C55E]"
                      >
                        Resolve
                      </button>
                    )}

                    {alert.taxReturnPeriod && onNavigateToTaxReturns ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkSingleRead(alert.id);
                          onNavigateToTaxReturns();
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
                      >
                        <span>File Return</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : alert.purchaseId && onNavigateToPurchases ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkSingleRead(alert.id);
                          onNavigateToPurchases();
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
                      >
                        <span>View Purchase</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : alert.itemId ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkSingleRead(alert.id);
                          onSelectItemDetail(alert.itemId!);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
                      >
                        <span>Open Item</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
