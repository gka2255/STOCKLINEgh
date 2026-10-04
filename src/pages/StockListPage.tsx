import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  PackagePlus,
  Edit3,
  Power,
  ArrowUpDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  StockAvailabilityStatus,
} from '../types/stock';
import {
  STOCK_CATEGORIES,
  updateStockItem,
  loadGhanaDemoData,
} from '../services/stockService';
import { formatGhs, formatQuantity } from '../utils/formatters';

interface StockListPageProps {
  currentUser: AppUser;
  items: EnrichedStockItem[];
  onSelectItemDetail: (itemId: string) => void;
  onOpenAddItemModal: () => void;
  onOpenEditItemModal: (item: EnrichedStockItem) => void;
  onOpenReceiveModal: (itemId?: string) => void;
  onOpenMovementModal: (item: EnrichedStockItem) => void;
  onShowToast: (msg: string) => void;
}

export const StockListPage: React.FC<StockListPageProps> = ({
  currentUser,
  items,
  onSelectItemDetail,
  onOpenAddItemModal,
  onOpenEditItemModal,
  onOpenReceiveModal,
  onOpenMovementModal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockAvailabilityStatus>('ALL');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!showDeactivated && !item.isActive) return false;
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchUnit = item.unit.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchUnit) return false;
      }
      return true;
    });
  }, [items, showDeactivated, selectedCategory, statusFilter, searchQuery]);

  const handleToggleItemActive = async (item: EnrichedStockItem) => {
    try {
      await updateStockItem(currentUser, item.id, {
        name: item.name,
        category: item.category,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        defaultSupplierId: item.defaultSupplierId,
        isActive: !item.isActive,
      });
      onShowToast(
        item.isActive
          ? `Deactivated "${item.name}" (retained in historical audit).`
          : `Reactivated "${item.name}".`
      );
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not update item.');
    }
  };

  const handleSeedDemo = async () => {
    if (currentUser.role !== 'manager') return;
    setSeeding(true);
    try {
      const res = await loadGhanaDemoData(currentUser);
      onShowToast(`Loaded ${res.itemCount} restaurant items & batches in GH₵.`);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Demo data seed failed.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Stock Items Catalog
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Item quantities are calculated dynamically from non-depleted FIFO batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenReceiveModal()}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <PackagePlus className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <span>Receive Stock Batch</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddItemModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-[#8C9690]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name, category, or unit..."
              className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-[#181D1A] focus:border-[#14532D] focus:bg-white focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              <option value="ALL">All Categories ({STOCK_CATEGORIES.length})</option>
              {STOCK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#F4F1EA] p-1 md:col-span-4 dark:bg-[#0D1310]">
            {(['ALL', 'In stock', 'Low', 'Finished'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-[#181D1A] shadow-2xs dark:bg-[#1A2620] dark:text-white'
                    : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E4E0D8] pt-3 text-xs text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F]">
          <span>
            Showing <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{filteredItems.length}</strong> of{' '}
            <strong className="font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">{items.length}</strong> catalog items
          </span>

          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#D5D0C6] accent-[#14532D]"
            />
            <span>Include deactivated items</span>
          </label>
        </div>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
          <p className="font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            No matching stock items found
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
            >
              Reset Filters
            </button>
            {currentUser.role === 'manager' && (
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seeding}
                className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
              >
                <Database className="h-3.5 w-3.5" />
                <span>{seeding ? 'Loading...' : 'Load demo data'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-white dark:border-[#223028] dark:bg-[#131C17]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E0D8] bg-[#F4F1EA]/70 text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
                  <th className="px-4 py-3 font-semibold">Item & Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Reorder Level</th>
                  <th className="px-4 py-3 text-right font-semibold">FIFO Batches</th>
                  <th className="px-4 py-3 text-right font-semibold">Valuation (GH₵)</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {filteredItems.map((item) => {
                  const statusTone =
                    item.status === 'In stock'
                      ? 'text-[#14532D] dark:text-[#22C55E]'
                      : item.status === 'Low'
                      ? 'text-[#D97706] dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-[#FAF8F5] dark:hover:bg-[#17221C] ${
                        !item.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectItemDetail(item.id)}
                          className="font-semibold text-sm text-[#181D1A] hover:text-[#14532D] hover:underline text-left dark:text-[#ECF2EE] dark:hover:text-[#22C55E]"
                        >
                          {item.name}
                        </button>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>Unit: {item.unit}</span>
                          {!item.isActive && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                Deactivated
                              </span>
                            </>
                          )}
                          {item.hasExpiredBatch && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                Expired batch
                              </span>
                            </>
                          )}
                          {!item.hasExpiredBatch && item.hasExpiringSoonBatch && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#D97706] dark:text-amber-400">
                                Expiring ≤ 7d
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`font-semibold ${statusTone}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-[#181D1A] dark:text-[#ECF2EE] whitespace-nowrap">
                        {formatQuantity(item.totalQuantity)}{' '}
                        <span className="text-xs font-normal text-[#5C6660] dark:text-[#9AA89F]">
                          {item.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {formatQuantity(item.reorderLevel)} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F] whitespace-nowrap">
                        {item.activeBatchCount} active
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE] whitespace-nowrap">
                        {formatGhs(item.totalValueGhs)}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenReceiveModal(item.id)}
                            title="Receive batch"
                            className="rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
                          >
                            + Receive
                          </button>

                          {item.totalQuantity > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenMovementModal(item)}
                              title="Record usage, wastage, or adjustment"
                              className="rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
                            >
                              <ArrowUpDown className="inline h-3 w-3 mr-1" />
                              Use / Adjust
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenEditItemModal(item)}
                            title="Edit item"
                            className="rounded-md p-1.5 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleItemActive(item)}
                            title={item.isActive ? 'Deactivate item' : 'Reactivate item'}
                            className="rounded-md p-1.5 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectItemDetail(item.id)}
                            className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[#14532D] hover:underline dark:text-[#22C55E]"
                          >
                            <span>Batches</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
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
