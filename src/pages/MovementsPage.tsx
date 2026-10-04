import React, { useState, useMemo } from 'react';
import { Lock, RotateCcw, Search, PackagePlus } from 'lucide-react';
import {
  EnrichedStockItem,
  MovementType,
  StockMovement,
} from '../types/stock';
import {
  formatDateTimeShort,
  formatQuantity,
} from '../utils/formatters';

interface MovementsPageProps {
  items: EnrichedStockItem[];
  movements: StockMovement[];
  onSelectItemDetail: (itemId: string) => void;
  onOpenReceiveModal: () => void;
}

export const MovementsPage: React.FC<MovementsPageProps> = ({
  items,
  movements,
  onSelectItemDetail,
  onOpenReceiveModal,
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [itemFilter, setItemFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MovementType>('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [noteQuery, setNoteQuery] = useState('');

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const distinctUsers = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of movements) {
      map.set(m.userId, m.userName);
    }
    return Array.from(map.entries()).map(([uid, name]) => ({ uid, name }));
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const sorted = [...movements].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sorted.filter((mov) => {
      if (itemFilter !== 'ALL' && mov.itemId !== itemFilter) return false;
      if (typeFilter !== 'ALL' && mov.type !== typeFilter) return false;
      if (userFilter !== 'ALL' && mov.userId !== userFilter) return false;

      if (dateFrom) {
        const fromMs = new Date(`${dateFrom}T00:00:00`).getTime();
        if (new Date(mov.timestamp).getTime() < fromMs) return false;
      }
      if (dateTo) {
        const toMs = new Date(`${dateTo}T23:59:59.999`).getTime();
        if (new Date(mov.timestamp).getTime() > toMs) return false;
      }

      if (noteQuery.trim()) {
        const q = noteQuery.toLowerCase();
        const itemName = itemMap.get(mov.itemId)?.name.toLowerCase() || '';
        const matchNote = mov.note.toLowerCase().includes(q);
        const matchBatch = mov.batchId.toLowerCase().includes(q);
        const matchReq = mov.requisitionNumber?.toLowerCase().includes(q) || false;
        const matchItem = itemName.includes(q);
        if (!matchNote && !matchBatch && !matchItem && !matchReq) return false;
      }

      return true;
    });
  }, [movements, itemFilter, typeFilter, userFilter, dateFrom, dateTo, noteQuery, itemMap]);

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setItemFilter('ALL');
    setTypeFilter('ALL');
    setUserFilter('ALL');
    setNoteQuery('');
  };

  const hasActiveFilters =
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    itemFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    userFilter !== 'ALL' ||
    Boolean(noteQuery.trim());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Stock Movements Ledger
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Every stock change writes an immutable audit record in the same Firestore transaction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#E4E0D8] bg-[#F4F1EA] px-3 py-2 text-xs text-[#5C6660] dark:border-[#223028] dark:bg-[#131C17] dark:text-[#9AA89F]">
            <Lock className="h-3.5 w-3.5 text-[#14532D] dark:text-[#22C55E]" />
            <span>Create-Only · Permanent Audit Trail</span>
          </div>

          <button
            type="button"
            onClick={onOpenReceiveModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] whitespace-nowrap dark:bg-[#16A34A]"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Receive Stock</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Stock Item
            </label>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Items ({items.length})</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Movement Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | MovementType)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Types</option>
              <option value="received">Received (+)</option>
              <option value="used">Used in Kitchen (−)</option>
              <option value="wasted">Wasted / Spoiled (−)</option>
              <option value="adjusted">Adjusted (±)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Recorded By User
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Staff</option>
              {distinctUsers.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-[#E4E0D8] pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#223028]">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C9690]" />
            <input
              type="search"
              value={noteQuery}
              onChange={(e) => setNoteQuery(e.target.value)}
              placeholder="Search notes, batch ID, or requisition..."
              className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] py-1.5 pl-8 pr-3 text-xs text-[#181D1A] focus:border-[#14532D] focus:bg-white focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            <span>
              Showing <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{filteredMovements.length}</strong> of{' '}
              <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{movements.length}</strong> records
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredMovements.length === 0 ? (
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
          <p className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            No movements match your filters
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-white dark:border-[#223028] dark:bg-[#131C17]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E0D8] bg-[#F4F1EA]/70 text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Stock Item</th>
                  <th className="px-4 py-3 font-semibold">Batch ID</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Operational Note / Requisition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {filteredMovements.map((mov) => {
                  const item = itemMap.get(mov.itemId);
                  const typeColor =
                    mov.type === 'received'
                      ? 'text-[#14532D] dark:text-[#22C55E]'
                      : mov.type === 'wasted'
                      ? 'text-red-600 dark:text-red-400'
                      : mov.type === 'adjusted'
                      ? 'text-[#D97706] dark:text-amber-400'
                      : 'text-[#181D1A] dark:text-[#ECF2EE]';

                  const sign =
                    mov.type === 'received'
                      ? '+'
                      : mov.type === 'used' || mov.type === 'wasted'
                      ? '−'
                      : '±';

                  return (
                    <tr
                      key={mov.id}
                      className="transition-colors hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]"
                    >
                      <td className="px-4 py-3.5 font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {formatDateTimeShort(mov.timestamp)}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => item && onSelectItemDetail(item.id)}
                          className="font-semibold text-[#181D1A] hover:text-[#14532D] hover:underline text-left dark:text-[#ECF2EE] dark:hover:text-[#22C55E]"
                        >
                          {item ? item.name : mov.itemId}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {mov.batchId}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`capitalize font-semibold ${typeColor}`}>
                          {mov.type}
                        </span>
                      </td>

                      <td
                        className={`px-4 py-3.5 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${typeColor}`}
                      >
                        {sign}
                        {formatQuantity(mov.quantity)}{' '}
                        <span className="text-xs font-normal text-[#5C6660] dark:text-[#9AA89F]">
                          {item?.unit || ''}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                        {mov.userName}
                      </td>

                      <td className="px-4 py-3.5 text-[#5C6660] dark:text-[#9AA89F] max-w-md">
                        {mov.requisitionNumber && (
                          <span className="mr-1.5 font-mono font-bold text-[#14532D] dark:text-[#22C55E]">
                            [{mov.requisitionNumber}]
                          </span>
                        )}
                        {mov.note}
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
