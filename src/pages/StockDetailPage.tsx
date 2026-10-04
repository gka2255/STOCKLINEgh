import React from 'react';
import {
  ArrowLeft,
  PackagePlus,
  ArrowUpDown,
  Edit3,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  StockBatch,
  StockMovement,
} from '../types/stock';
import {
  getBatchExpiryStatus,
  sortBatchesFifo,
} from '../services/stockService';
import {
  formatDateShort,
  formatDateTimeShort,
  formatGhs,
  formatQuantity,
} from '../utils/formatters';

interface StockDetailPageProps {
  currentUser: AppUser;
  item: EnrichedStockItem | null;
  batches: StockBatch[];
  movements: StockMovement[];
  onBack: () => void;
  onOpenEditItemModal: (item: EnrichedStockItem) => void;
  onOpenReceiveModal: (itemId: string) => void;
  onOpenMovementModal: (item: EnrichedStockItem, batchId?: string) => void;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({
  item,
  batches,
  movements,
  onBack,
  onOpenEditItemModal,
  onOpenReceiveModal,
  onOpenMovementModal,
}) => {
  if (!item) {
    return (
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-10 text-center dark:border-[#223028] dark:bg-[#131C17]">
        <p className="text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
          Stock item not found
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white dark:bg-[#16A34A]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Stock Catalog</span>
        </button>
      </div>
    );
  }

  // Batches sorted OLDEST FIRST (FIFO order: earliest expiry date first, then dateReceived)
  const itemBatchesFifo = sortBatchesFifo(
    batches.filter((b) => b.itemId === item.id)
  );

  const firstActiveBatchId = itemBatchesFifo.find(
    (b) => b.quantityRemaining > 0
  )?.id;

  const itemMovements = [...movements]
    .filter((m) => m.itemId === item.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const statusTone =
    item.status === 'In stock'
      ? 'text-[#14532D] dark:text-[#22C55E]'
      : item.status === 'Low'
      ? 'text-[#D97706] dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Stock Catalog</span>
          </button>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            {item.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            <span>Category: {item.category}</span>
            <span aria-hidden="true">·</span>
            <span>Unit: {item.unit}</span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${statusTone}`}>
              Status: {item.status}
            </span>
            {!item.isActive && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  Deactivated
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenEditItemModal(item)}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Item</span>
          </button>

          {item.totalQuantity > 0 && (
            <button
              type="button"
              onClick={() => onOpenMovementModal(item)}
              className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Issue / Adjust Stock</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenReceiveModal(item.id)}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Receive New Batch</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Total Quantity Remaining
          </span>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatQuantity(item.totalQuantity)}{' '}
            <span className="text-sm font-normal text-[#5C6660] dark:text-[#9AA89F]">
              {item.unit}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Sum of {itemBatchesFifo.length} recorded batches
          </p>
        </div>

        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Reorder Threshold
          </span>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatQuantity(item.reorderLevel)}{' '}
            <span className="text-sm font-normal text-[#5C6660] dark:text-[#9AA89F]">
              {item.unit}
            </span>
          </p>
          <p className={`mt-1 text-[11px] font-medium ${statusTone}`}>
            Current: {item.status}
          </p>
        </div>

        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Active FIFO Batches
          </span>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {item.activeBatchCount}{' '}
            <span className="text-sm font-normal text-[#5C6660] dark:text-[#9AA89F]">
              / {itemBatchesFifo.length} total
            </span>
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Ordered oldest/earliest expiry first
          </p>
        </div>

        <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Remaining Inventory Value
          </span>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
            {formatGhs(item.totalValueGhs)}
          </p>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Valued in Ghanaian Cedis (GH₵)
          </p>
        </div>
      </div>

      {/* FIFO Batches Section */}
      <section className="rounded-lg border border-[#E4E0D8] bg-white dark:border-[#223028] dark:bg-[#131C17]">
        <div className="border-b border-[#E4E0D8] px-5 py-4 dark:border-[#223028]">
          <h2 className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Stock Batches — Oldest First (FIFO Order)
          </h2>
          <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Batches are dispatched in FIFO order. Red indicates expired batch (skipped during requisition issue);
            Amber indicates expiring within 7 days.
          </p>
        </div>

        {itemBatchesFifo.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              No batches received for {item.name} yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E0D8] bg-[#F4F1EA]/70 text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
                  <th className="px-4 py-3 font-semibold">FIFO Rank & Batch</th>
                  <th className="px-4 py-3 font-semibold">Date Received</th>
                  <th className="px-4 py-3 font-semibold">Estimated Expiry</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty Received</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty Remaining</th>
                  <th className="px-4 py-3 text-right font-semibold">Cost / Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Batch Value</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {itemBatchesFifo.map((batch, index) => {
                  const expInfo = getBatchExpiryStatus(
                    batch.expiryDate,
                    batch.quantityRemaining
                  );
                  const isFirstActive = batch.id === firstActiveBatchId;

                  const rowHighlight =
                    expInfo.status === 'expired'
                      ? 'bg-red-50/70 dark:bg-red-950/30'
                      : expInfo.status === 'expiring-soon'
                      ? 'bg-amber-50/70 dark:bg-amber-950/25'
                      : '';

                  const expiryTextStyle =
                    expInfo.status === 'expired'
                      ? 'font-semibold text-red-700 dark:text-red-400'
                      : expInfo.status === 'expiring-soon'
                      ? 'font-semibold text-[#D97706] dark:text-amber-400'
                      : 'text-[#5C6660] dark:text-[#9AA89F]';

                  return (
                    <tr key={batch.id} className={`${rowHighlight} transition-colors`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                            #{index + 1} · {batch.id}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                          {isFirstActive ? (
                            <span className="font-semibold text-[#14532D] dark:text-[#22C55E]">
                              FIFO Priority · Issue First
                            </span>
                          ) : batch.quantityRemaining === 0 ? (
                            <span>Depleted (0 remaining)</span>
                          ) : (
                            <span>Queued behind older batch</span>
                          )}
                          {batch.purchaseId && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{batch.purchaseId}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE] whitespace-nowrap">
                        {formatDateShort(batch.dateReceived)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className={`flex items-center gap-1.5 ${expiryTextStyle}`}>
                          {expInfo.status === 'expired' && (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                          )}
                          {expInfo.status === 'expiring-soon' && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#D97706] dark:text-amber-400" />
                          )}
                          {expInfo.status === 'valid' && batch.expiryDate && (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#14532D] dark:text-[#22C55E]" />
                          )}
                          {expInfo.status === 'no-expiry' && (
                            <Clock className="h-3.5 w-3.5 shrink-0 text-[#8C9690]" />
                          )}
                          <span className="font-mono tabular-nums">
                            {batch.expiryDate
                              ? formatDateShort(batch.expiryDate)
                              : 'No expiry'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{expInfo.label}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {formatQuantity(batch.quantityReceived)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE] whitespace-nowrap">
                        {formatQuantity(batch.quantityRemaining)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {formatGhs(batch.costPerUnit)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE] whitespace-nowrap">
                        {formatGhs(batch.quantityRemaining * batch.costPerUnit)}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenMovementModal(item, batch.id)}
                          className="rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
                        >
                          Record Movement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Movement History for Item */}
      <section className="rounded-lg border border-[#E4E0D8] bg-white dark:border-[#223028] dark:bg-[#131C17]">
        <div className="border-b border-[#E4E0D8] px-5 py-4 dark:border-[#223028]">
          <h2 className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Audit Movement History for {item.name}
          </h2>
        </div>

        {itemMovements.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
            No movements recorded for this item yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E0D8] bg-[#F4F1EA]/70 text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
                  <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Batch ID</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Quantity</th>
                  <th className="px-4 py-2.5 font-semibold">User</th>
                  <th className="px-4 py-2.5 font-semibold">Note / Requisition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {itemMovements.map((mov) => (
                  <tr
                    key={mov.id}
                    className="hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]"
                  >
                    <td className="px-4 py-3 font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                      {formatDateTimeShort(mov.timestamp)}
                    </td>
                    <td className="px-4 py-3 capitalize font-semibold whitespace-nowrap">
                      {mov.type}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                      {mov.batchId}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                      {formatQuantity(mov.quantity)} {item.unit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{mov.userName}</td>
                    <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                      {mov.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
