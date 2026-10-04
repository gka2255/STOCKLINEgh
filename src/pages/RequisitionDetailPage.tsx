import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldAlert,
  ClipboardList,
  Layers,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  Requisition,
  StockBatch,
  StockMovement,
} from '../types/stock';
import {
  formatDateShort,
  formatDateTimeShort,
  formatQuantity,
} from '../utils/formatters';
import {
  isBatchExpired,
  issueRequisitionTransaction,
  rejectRequisition,
} from '../services/stockService';

interface RequisitionDetailPageProps {
  currentUser: AppUser;
  requisition: Requisition | null;
  items: EnrichedStockItem[];
  batches: StockBatch[];
  movements: StockMovement[];
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const RequisitionDetailPage: React.FC<RequisitionDetailPageProps> = ({
  currentUser,
  requisition,
  items,
  batches,
  movements,
  onBack,
  onShowToast,
}) => {
  if (!requisition) {
    return (
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-10 text-center dark:border-[#223028] dark:bg-[#131C17]">
        <p className="text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
          Requisition not found
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white dark:bg-[#16A34A]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </button>
      </div>
    );
  }

  const isStaff = currentUser.role === 'staff';
  const isStoreManager = currentUser.role === 'manager' || currentUser.role === 'storekeeper';

  // State for storekeeper/manager issuing inline
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const line of requisition.lines) {
      init[line.itemId] = String(line.quantityRequested);
    }
    return init;
  });

  // Rejection modal/state
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Compute available non-expired stock per item (for Storekeeper/Manager)
  const availableStockByItem = React.useMemo(() => {
    const map = new Map<string, { totalAvailable: number; hasExpired: boolean; expiredQty: number }>();

    for (const line of requisition.lines) {
      const itemBatches = batches.filter(
        (b) => b.itemId === line.itemId && b.quantityRemaining > 0
      );

      let totalAvailable = 0;
      let expiredQty = 0;
      let hasExpired = false;

      for (const b of itemBatches) {
        if (isBatchExpired(b.expiryDate)) {
          hasExpired = true;
          expiredQty += b.quantityRemaining;
        } else {
          totalAvailable += b.quantityRemaining;
        }
      }

      map.set(line.itemId, { totalAvailable, hasExpired, expiredQty });
    }
    return map;
  }, [requisition.lines, batches]);

  // Handle single-transaction FIFO issuance
  const handleIssue = async () => {
    setActionError(null);

    // Validate quantities
    const lineIssuance: { itemId: string; quantityIssued: number }[] = [];
    for (const line of requisition.lines) {
      const val = issuedQuantities[line.itemId];
      const num = Number(val);
      const stockInfo = availableStockByItem.get(line.itemId);
      const maxAvailable = stockInfo?.totalAvailable ?? 0;

      if (isNaN(num) || num < 0) {
        setActionError(`Please enter a valid positive quantity to issue for ${line.itemName}.`);
        return;
      }

      if (num > maxAvailable) {
        setActionError(
          `Cannot issue ${num} ${line.unit} of ${line.itemName}. Only ${maxAvailable} ${line.unit} is available in non-expired batches.`
        );
        return;
      }

      lineIssuance.push({
        itemId: line.itemId,
        quantityIssued: num,
      });
    }

    setProcessing(true);
    try {
      const res = await issueRequisitionTransaction(currentUser, requisition.id, lineIssuance);
      let successMsg = `Requisition ${res.requisition.requisitionNumber} successfully issued via FIFO batches.`;
      if (res.expiredBatchesSkipped.length > 0) {
        successMsg += ` (${res.expiredBatchesSkipped.length} expired batch(es) were safely bypassed).`;
      }
      onShowToast(successMsg);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not issue requisition.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle rejection with required reason
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!rejectionReason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }

    setProcessing(true);
    try {
      await rejectRequisition(currentUser, requisition.id, rejectionReason.trim());
      onShowToast(`Requisition ${requisition.requisitionNumber} rejected.`);
      setShowRejectBox(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reject requisition.');
    } finally {
      setProcessing(false);
    }
  };

  // Associated movements logged during this requisition's issuance
  const reqMovements = movements.filter(
    (m) =>
      m.requisitionId === requisition.id ||
      m.requisitionNumber === requisition.requisitionNumber
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-[#ECF2EE]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requisitions</span>
        </button>

        <div className="flex items-center gap-2">
          {requisition.status === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              Pending Review
            </span>
          )}
          {requisition.status === 'issued' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Issued
            </span>
          )}
          {requisition.status === 'rejected' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
              <XCircle className="h-3.5 w-3.5" />
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if Rejected */}
      {requisition.status === 'rejected' && requisition.rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
          <div className="flex items-start gap-2.5">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-xs font-semibold text-red-800 dark:text-red-200">
                Requisition Rejected by Storeroom
              </h3>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                <strong>Reason:</strong> {requisition.rejectionReason}
              </p>
              {requisition.issuedBy && (
                <p className="mt-1 font-mono text-[11px] text-red-600 dark:text-red-400">
                  Reviewed by {requisition.issuedBy.userName} on{' '}
                  {formatDateTimeShort(requisition.issuedAt || '')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Meta Header Card */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E4E0D8] pb-5 sm:flex-row sm:items-center dark:border-[#223028]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-[#14532D] dark:text-[#22C55E]">
                {requisition.requisitionNumber}
              </h1>
              {requisition.isDirectIssue && (
                <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  Direct Counter Issue
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Created on {formatDateTimeShort(requisition.createdAt)}
            </p>
          </div>

          {/* Quick status summary badge */}
          <div className="flex items-center gap-4 text-xs">
            <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] px-3.5 py-2 text-right dark:border-[#223028] dark:bg-[#0D1310]">
              <span className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">Department</span>
              <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                {requisition.department}
              </p>
            </div>
            <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] px-3.5 py-2 text-right dark:border-[#223028] dark:bg-[#0D1310]">
              <span className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">Requester</span>
              <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                {requisition.requestedBy.userName}
              </p>
            </div>
          </div>
        </div>

        {/* Note from staff */}
        {requisition.note && (
          <div className="mt-4 rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3.5 text-xs text-[#2E3833] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#C8D4CC]">
            <strong className="text-[#181D1A] dark:text-[#ECF2EE]">Staff Note / Purpose:</strong>{' '}
            {requisition.note}
          </div>
        )}
      </div>

      {/* Action Error if any */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Line Items Table */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div>
            <h2 className="text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Requested Stock Lines
            </h2>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              {requisition.status === 'pending' && isStoreManager
                ? 'Review quantities, inspect available non-expired stock, and set quantity to issue.'
                : 'Summary of items and fulfillment status.'}
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
            {requisition.lines.length} {requisition.lines.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E0D8] bg-[#FAF8F5] text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
              <tr>
                <th className="py-2.5 pl-3 pr-3 font-semibold">Item Name</th>
                <th className="px-3 py-2.5 font-semibold">Requested Qty</th>
                {/* Available stock is only displayed to Storekeeper / Manager */}
                {isStoreManager && (
                  <th className="px-3 py-2.5 font-semibold">Available Stock (Non-Expired)</th>
                )}
                <th className="py-2.5 pl-3 pr-3 text-right font-semibold">
                  {requisition.status === 'pending' && isStoreManager
                    ? 'Quantity to Issue'
                    : 'Quantity Issued'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {requisition.lines.map((line) => {
                const stockInfo = availableStockByItem.get(line.itemId);
                const available = stockInfo?.totalAvailable ?? 0;
                const hasExpired = stockInfo?.hasExpired ?? false;

                return (
                  <tr key={line.itemId} className="hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]">
                    <td className="py-3 pl-3 pr-3">
                      <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        {line.itemName}
                      </p>
                      <span className="font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                        Unit: {line.unit}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-mono font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                      {formatQuantity(line.quantityRequested)} {line.unit}
                    </td>

                    {/* Available Stock beside each line (Storekeeper/Manager only) */}
                    {isStoreManager && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-semibold ${
                              available === 0
                                ? 'text-red-600 dark:text-red-400'
                                : available < line.quantityRequested
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {formatQuantity(available)} {line.unit}
                          </span>
                          {available < line.quantityRequested && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Short
                            </span>
                          )}
                        </div>
                        {hasExpired && (
                          <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                            (Expired batches bypassed automatically)
                          </p>
                        )}
                      </td>
                    )}

                    <td className="py-3 pl-3 pr-3 text-right">
                      {requisition.status === 'pending' && isStoreManager ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={available}
                            value={issuedQuantities[line.itemId] || '0'}
                            onChange={(e) =>
                              setIssuedQuantities((prev) => ({
                                ...prev,
                                [line.itemId]: e.target.value,
                              }))
                            }
                            className="w-24 rounded-md border border-[#D5D0C6] bg-white px-2 py-1 text-right font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                          />
                          <span className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                            {line.unit}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                          {formatQuantity(line.quantityIssued)} {line.unit}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Storekeeper Action Buttons (Issue / Reject) for Pending Requisition */}
        {requisition.status === 'pending' && isStoreManager && (
          <div className="mt-6 border-t border-[#E4E0D8] pt-5 dark:border-[#223028]">
            {!showRejectBox ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="w-full sm:w-auto rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>Reject Requisition...</span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleIssue}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#14532D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>
                    {processing ? 'Processing FIFO Issuance...' : 'Issue Requisition (FIFO)'}
                  </span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleReject}
                className="rounded-lg border border-red-200 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/30"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-red-800 dark:text-red-200">
                    Reject Requisition {requisition.requisitionNumber}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-2.5">
                  <label className="block text-[11px] font-medium text-red-800 dark:text-red-200">
                    Reason for Rejection <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Stock reserved for banquet dinner service. Please revise quantities."
                    className="mt-1 w-full rounded-md border border-red-300 bg-white p-2 text-xs text-[#181D1A] focus:border-red-600 focus:outline-none dark:border-red-900 dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                  />
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="rounded-md border border-[#D5D0C6] bg-white px-3 py-1.5 text-xs font-medium text-[#181D1A] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Audit Trail: Who Requested, Who Issued, Which Batches Deducted, When */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center gap-2 border-b border-[#E4E0D8] pb-3 dark:border-[#223028]">
          <Layers className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          <h2 className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Audit Trail & Distribution Ledger
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Requested Info */}
          <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3.5 dark:border-[#223028] dark:bg-[#0D1310]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
              Origin Request
            </span>
            <p className="mt-1 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              {requisition.requestedBy.userName}
            </p>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Department: {requisition.department}
            </p>
            <p className="mt-1 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Requested on: {formatDateTimeShort(requisition.createdAt)}
            </p>
          </div>

          {/* Fulfillment Info */}
          <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3.5 dark:border-[#223028] dark:bg-[#0D1310]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
              Storeroom Processing
            </span>
            {requisition.issuedBy ? (
              <>
                <p className="mt-1 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                  {requisition.issuedBy.userName}
                </p>
                <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Outcome: {requisition.status === 'issued' ? 'Issued & Deducted' : 'Rejected'}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                  Processed on: {formatDateTimeShort(requisition.issuedAt || '')}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Pending review by storeroom staff.
              </p>
            )}
          </div>
        </div>

        {/* Detailed FIFO Batch Allocation (Storekeeper / Manager only or issued view) */}
        {requisition.status === 'issued' && reqMovements.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              FIFO Batch Allocations & Movement Records:
            </h3>
            <div className="mt-2 divide-y divide-[#E4E0D8] rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] dark:divide-[#223028] dark:border-[#223028] dark:bg-[#0D1310]">
              {reqMovements.map((m) => (
                <div key={m.id} className="flex flex-col justify-between gap-1 p-3 sm:flex-row sm:items-center text-xs">
                  <div>
                    <span className="font-mono font-semibold text-[#14532D] dark:text-[#22C55E]">
                      Batch {m.batchId}
                    </span>
                    <span className="text-[#5C6660] dark:text-[#9AA89F]"> · </span>
                    <span className="text-[#181D1A] dark:text-[#ECF2EE]">{m.note}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      -{m.quantity}
                    </span>
                    <span className="font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                      {formatDateTimeShort(m.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
