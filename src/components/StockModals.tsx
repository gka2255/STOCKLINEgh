import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  PackagePlus,
  ArrowUpDown,
  ClipboardList,
  AlertTriangle,
  User,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  MovementType,
  Requisition,
  RequisitionDepartment,
  StockBatch,
  StockUnit,
  TaxCategory,
} from '../types/stock';
import {
  STOCK_CATEGORIES,
  STOCK_UNITS,
  REQUISITION_DEPARTMENTS,
  createStockItem,
  updateStockItem,
  receiveStockBatchTransaction,
  recordBatchMovementTransaction,
  createRequisition,
  issueRequisitionTransaction,
  rejectRequisition,
  recordDirectIssueTransaction,
  sortBatchesFifo,
  isBatchExpired,
} from '../services/stockService';
import { formatDateShort, formatGhs, formatQuantity } from '../utils/formatters';

// ==========================================
// 1. ADD / EDIT STOCK ITEM MODAL
// ==========================================

interface StockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  editingItem?: EnrichedStockItem | null;
  onSuccess: (message: string) => void;
}

export const StockItemModal: React.FC<StockItemModalProps> = ({
  isOpen,
  onClose,
  actor,
  editingItem,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(STOCK_CATEGORIES[0]);
  const [unit, setUnit] = useState<StockUnit>('kg');
  const [reorderLevel, setReorderLevel] = useState('15');
  const [defaultSupplierId, setDefaultSupplierId] = useState('');
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('standard');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setUnit(editingItem.unit);
      setReorderLevel(String(editingItem.reorderLevel));
      setDefaultSupplierId(editingItem.defaultSupplierId || '');
      setTaxCategory(editingItem.taxCategory || 'standard');
      setIsActive(editingItem.isActive);
    } else {
      setName('');
      setCategory(STOCK_CATEGORIES[0]);
      setUnit('kg');
      setReorderLevel('15');
      setDefaultSupplierId('');
      setTaxCategory('standard');
      setIsActive(true);
    }
    setError(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedReorder = Number(reorderLevel);
    if (name.trim().length < 2) {
      setError('Please enter a valid stock item name (at least 2 characters).');
      return;
    }
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      setError('Reorder level must be 0 or a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateStockItem(actor, editingItem.id, {
          name,
          category,
          unit,
          reorderLevel: parsedReorder,
          defaultSupplierId: defaultSupplierId.trim() || null,
          taxCategory,
          isActive,
        });
        onSuccess(`Updated stock item "${name.trim()}".`);
      } else {
        await createStockItem(actor, {
          name,
          category,
          unit,
          reorderLevel: parsedReorder,
          defaultSupplierId: defaultSupplierId.trim() || null,
          taxCategory,
        });
        onSuccess(`Added "${name.trim()}" to the stock catalog.`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save stock item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div>
            <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              {editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}
            </h2>
            <p className="mt-0.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Register or modify catalog item specifications and reorder thresholds.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Item Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jasmine Perfumed Rice (Royal Feast)"
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
              >
                {STOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Measurement Unit <span className="text-red-600">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as StockUnit)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
              >
                {STOCK_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Reorder Level ({unit}) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Default Supplier ID (Optional)
              </label>
              <input
                type="text"
                maxLength={128}
                value={defaultSupplierId}
                onChange={(e) => setDefaultSupplierId(e.target.value)}
                placeholder="e.g., sup_tema_grains"
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              GRA Statutory Tax Category <span className="text-red-600">*</span>
            </label>
            <select
              value={taxCategory}
              onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
            >
              <option value="standard">Standard Rated (15% VAT + 2.5% NHIL + 2.5% GETFund = 20%)</option>
              <option value="exempt">Exempt (0% — Raw unprocessed foodstuffs, vegetables, fresh meat & fish)</option>
              <option value="zero_rated">Zero-Rated (0% — Export & special relief supplies)</option>
            </select>
            <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Rates follow Ghana VAT Act 2025 (Act 1151). Unprocessed food items are tax exempt; processed items, oils, cooking gas & packaging attract standard rates.
            </p>
          </div>

          {editingItem && (
            <div className="flex items-center justify-between rounded-lg border border-[#E4E0D8] bg-white px-4 py-3 dark:border-[#223028] dark:bg-[#0D1310]">
              <div>
                <p className="text-sm font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                  Catalog Status: {isActive ? 'Active' : 'Deactivated'}
                </p>
                <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Items are never hard-deleted to preserve historical audit movements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((prev) => !prev)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border border-amber-500/40 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-[#14532D] text-white hover:bg-[#166534] dark:bg-[#16A34A]'
                }`}
              >
                {isActive ? 'Deactivate Item' : 'Reactivate Item'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Stock Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. RECEIVE STOCK BATCH MODAL
// ==========================================

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  items: EnrichedStockItem[];
  preselectedItemId?: string | null;
  onSuccess: (message: string) => void;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  isOpen,
  onClose,
  actor,
  items,
  preselectedItemId,
  onSuccess,
}) => {
  const activeItems = items.filter((i) => i.isActive);
  const todayStr = new Date().toISOString().split('T')[0];

  const [itemId, setItemId] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [dateReceived, setDateReceived] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialId =
        preselectedItemId || (activeItems.length > 0 ? activeItems[0].id : '');
      setItemId(initialId);
      setQuantityReceived('');
      setCostPerUnit('');
      setDateReceived(new Date().toISOString().split('T')[0]);
      setExpiryDate('');
      setSupplierId('');
      setPurchaseId('');
      setNote('');
      setError(null);
    }
  }, [isOpen, preselectedItemId]);

  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.id === itemId);
  const parsedQty = Number(quantityReceived) || 0;
  const parsedCost = Number(costPerUnit) || 0;
  const totalBatchCost = parsedQty * parsedCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError('Please select a stock item to receive.');
      return;
    }
    if (parsedQty <= 0) {
      setError('Quantity received must be greater than 0.');
      return;
    }
    if (parsedCost < 0 || costPerUnit.trim() === '') {
      setError('Please enter a valid unit cost in GH₵.');
      return;
    }

    setSubmitting(true);
    try {
      await receiveStockBatchTransaction(actor, {
        itemId,
        quantityReceived: parsedQty,
        costPerUnit: parsedCost,
        dateReceived,
        expiryDate: expiryDate ? expiryDate : null,
        supplierId: supplierId.trim() || null,
        purchaseId: purchaseId.trim() || null,
        note:
          note.trim() ||
          `Received ${parsedQty} ${selectedItem?.unit || 'units'} of ${
            selectedItem?.name || 'item'
          } at ${formatGhs(parsedCost)}/${selectedItem?.unit || 'unit'}.`,
      });
      onSuccess(
        `Received ${formatQuantity(parsedQty)} ${selectedItem?.unit || ''} of ${
          selectedItem?.name || 'stock'
        }. If previously low or finished, alerts are resolved.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive batch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Receive Stock Batch
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Creates a FIFO batch and logs an atomic <code className="font-mono">received</code> movement in GH₵.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Stock Item <span className="text-red-600">*</span>
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Current: {formatQuantity(item.totalQuantity)} {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Quantity Received ({selectedItem?.unit || 'units'}){' '}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(e.target.value)}
                placeholder="e.g., 50"
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Cost Per Unit (GH₵) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="e.g., 26.50"
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#E4E0D8] bg-white px-4 py-2.5 text-xs dark:border-[#223028] dark:bg-[#0D1310]">
            <span className="text-[#5C6660] dark:text-[#9AA89F]">
              Batch Total Valuation ({formatQuantity(parsedQty)} {selectedItem?.unit || 'units'} ×{' '}
              {formatGhs(parsedCost)})
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-[#14532D] dark:text-[#22C55E]">
              {formatGhs(totalBatchCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Date Received <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Estimated Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Supplier Reference (Optional)
              </label>
              <input
                type="text"
                maxLength={128}
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                placeholder="e.g., sup_tema_grains"
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Purchase Order / Waybill (Optional)
              </label>
              <input
                type="text"
                maxLength={128}
                value={purchaseId}
                onChange={(e) => setPurchaseId(e.target.value)}
                placeholder="e.g., PO-2026-105"
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Delivery & Inspection Note
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Cold-chain delivery verified at 2°C, packaging intact."
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Recording Batch...' : 'Receive Stock Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. RECORD STOCK MOVEMENT MODAL
// ==========================================

interface RecordMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  item: EnrichedStockItem | null;
  batches: StockBatch[];
  preselectedBatchId?: string | null;
  onSuccess: (message: string) => void;
}

export const RecordMovementModal: React.FC<RecordMovementModalProps> = ({
  isOpen,
  onClose,
  actor,
  item,
  batches,
  preselectedBatchId,
  onSuccess,
}) => {
  const [batchId, setBatchId] = useState('');
  const [movementType, setMovementType] = useState<Exclude<MovementType, 'received'>>('used');
  const [adjustmentDirection, setAdjustmentDirection] = useState<'deduct' | 'add'>('deduct');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemBatchesFifo = item
    ? sortBatchesFifo(batches.filter((b) => b.itemId === item.id))
    : [];

  useEffect(() => {
    if (isOpen && item) {
      const fifoAvailable = itemBatchesFifo.filter((b) => b.quantityRemaining > 0);
      const defaultBatch =
        preselectedBatchId ||
        (fifoAvailable.length > 0
          ? fifoAvailable[0].id
          : itemBatchesFifo[0]?.id || '');
      setBatchId(defaultBatch);
      setMovementType('used');
      setAdjustmentDirection('deduct');
      setQuantity('');
      setNote('');
      setError(null);
    }
  }, [isOpen, item, preselectedBatchId]);

  if (!isOpen || !item) return null;

  const selectedBatch = itemBatchesFifo.find((b) => b.id === batchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedQty = Number(quantity);
    if (!batchId) {
      setError('Please select a stock batch.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (!note.trim()) {
      setError('An operational note is required for the immutable movement ledger.');
      return;
    }

    setSubmitting(true);
    try {
      await recordBatchMovementTransaction(actor, {
        itemId: item.id,
        batchId,
        type: movementType,
        quantity: parsedQty,
        adjustmentDirection,
        note,
      });
      onSuccess(
        `Logged "${movementType}" movement (${formatQuantity(parsedQty)} ${item.unit}) for ${item.name}.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Record Stock Movement
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                {item.name} · Available: {formatQuantity(item.totalQuantity)} {item.unit}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Movement Type <span className="text-red-600">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['used', 'wasted', 'adjusted'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMovementType(t)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    movementType === t
                      ? 'border-[#14532D] bg-[#14532D] text-white dark:border-[#22C55E] dark:bg-[#16A34A]'
                      : 'border-[#D5D0C6] bg-white text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]'
                  }`}
                >
                  {t === 'used' ? 'Used' : t === 'wasted' ? 'Wasted' : 'Adjusted'}
                </button>
              ))}
            </div>
          </div>

          {movementType === 'adjusted' && (
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Adjustment Direction
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection('deduct')}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    adjustmentDirection === 'deduct'
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-[#D5D0C6] bg-white text-[#2E3833] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]'
                  }`}
                >
                  Deduct from Batch (−)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentDirection('add')}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    adjustmentDirection === 'add'
                      ? 'border-[#14532D] bg-[#14532D] text-white dark:border-[#22C55E] dark:bg-[#16A34A]'
                      : 'border-[#D5D0C6] bg-white text-[#2E3833] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]'
                  }`}
                >
                  Restore to Batch (+)
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Target Batch (FIFO Order) <span className="text-red-600">*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            >
              {itemBatchesFifo.map((b, idx) => (
                <option key={b.id} value={b.id}>
                  {idx === 0 ? '[FIFO #1] ' : `[Batch #${idx + 1}] `}
                  {b.id} — Rem: {formatQuantity(b.quantityRemaining)}/{formatQuantity(b.quantityReceived)}{' '}
                  {item.unit} · Rec: {formatDateShort(b.dateReceived)}
                  {b.expiryDate ? ` · Exp: ${formatDateShort(b.expiryDate)}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Quantity ({item.unit}) <span className="text-red-600">*</span>
              {selectedBatch && (
                <span className="ml-2 font-normal text-[#5C6660] dark:text-[#9AA89F]">
                  (Batch remaining: {formatQuantity(selectedBatch.quantityRemaining)} {item.unit})
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter ${item.unit} amount`}
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Audit Note <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Prep for dinner service / damaged during morning handling."
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Committing...' : 'Commit Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. CREATE REQUISITION MODAL (STAFF)
// ==========================================

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  items: EnrichedStockItem[];
  onSuccess: (message: string) => void;
}

export const CreateRequisitionModal: React.FC<CreateRequisitionModalProps> = ({
  isOpen,
  onClose,
  actor,
  items,
  onSuccess,
}) => {
  const activeItems = items.filter((i) => i.isActive);
  const [department, setDepartment] = useState<RequisitionDepartment>('Kitchen');
  const [lines, setLines] = useState<
    { itemId: string; quantityRequested: string }[]
  >([{ itemId: activeItems[0]?.id || '', quantityRequested: '1' }]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDepartment('Kitchen');
      setLines([{ itemId: activeItems[0]?.id || '', quantityRequested: '1' }]);
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { itemId: activeItems[0]?.id || '', quantityRequested: '1' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: 'itemId' | 'quantityRequested',
    value: string
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError('Please add at least one stock item line.');
      return;
    }

    const formattedLines: {
      itemId: string;
      itemName: string;
      unit: StockUnit;
      quantityRequested: number;
    }[] = [];

    for (const line of lines) {
      const item = items.find((i) => i.id === line.itemId);
      if (!item) {
        setError('Please select a valid item for every line.');
        return;
      }
      const qty = Number(line.quantityRequested);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please specify a valid quantity greater than 0 for ${item.name}.`);
        return;
      }
      formattedLines.push({
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        quantityRequested: qty,
      });
    }

    setSubmitting(true);
    try {
      const created = await createRequisition(actor, {
        department,
        lines: formattedLines,
        note,
      });
      onSuccess(`Requisition ${created.requisitionNumber} submitted for storekeeper review.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Submit Store Requisition
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Staff request for kitchen ingredients, bar supplies, or packaging.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Target Department <span className="text-red-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as RequisitionDepartment)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              >
                {REQUISITION_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Requested By (Authenticated)
              </label>
              <input
                type="text"
                disabled
                value={`${actor.name} (${actor.role})`}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-[#EFECE6] px-3.5 py-2.5 text-sm text-[#5C6660] dark:border-[#28382F] dark:bg-[#1C2822] dark:text-[#9AA89F]"
              />
            </div>
          </div>

          {/* Requisition Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Requested Items ({lines.length})
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => {
                const item = items.find((i) => i.id === line.itemId);
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-[#E4E0D8] bg-white p-3 sm:flex-row sm:items-center dark:border-[#223028] dark:bg-[#0D1310]"
                  >
                    <div className="flex-1">
                      <select
                        aria-label={`Select item for line ${idx + 1}`}
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      >
                        {activeItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            {itm.name} ({itm.unit}) — Available: {formatQuantity(itm.totalQuantity)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={line.quantityRequested}
                          onChange={(e) =>
                            handleLineChange(idx, 'quantityRequested', e.target.value)
                          }
                          placeholder="Quantity"
                          className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                        />
                      </div>
                      <span className="w-12 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                        {item?.unit || ''}
                      </span>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          title="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Requisition Reason / Operational Purpose
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Saturday evening banquet service prep / grill station restock."
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5. ISSUE REQUISITION MODAL (STOREKEEPER)
// ==========================================

interface IssueRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  requisition: Requisition | null;
  items: EnrichedStockItem[];
  batches: StockBatch[];
  onSuccess: (message: string) => void;
}

export const IssueRequisitionModal: React.FC<IssueRequisitionModalProps> = ({
  isOpen,
  onClose,
  actor,
  requisition,
  items,
  batches,
  onSuccess,
}) => {
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && requisition) {
      const initial: Record<string, string> = {};
      for (const line of requisition.lines) {
        initial[line.itemId] = String(line.quantityRequested);
      }
      setIssuedQuantities(initial);
      setError(null);
    }
  }, [isOpen, requisition]);

  if (!isOpen || !requisition) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lineIssuance = requisition.lines.map((l) => ({
      itemId: l.itemId,
      quantityIssued: Number(issuedQuantities[l.itemId]) || 0,
    }));

    setSubmitting(true);
    try {
      const res = await issueRequisitionTransaction(
        actor,
        requisition.id,
        lineIssuance
      );

      let msg = `Issued requisition ${res.requisition.requisitionNumber} in single Firestore transaction with FIFO batch allocations.`;
      if (res.expiredBatchesSkipped.length > 0) {
        msg += ` Note: ${res.expiredBatchesSkipped.length} expired batch(es) were safely skipped.`;
      }
      onSuccess(msg);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#14532D] dark:text-[#22C55E]">
                {requisition.requisitionNumber}
              </span>
              <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">·</span>
              <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Requested by {requisition.requestedBy.userName} ({requisition.department})
              </span>
            </div>
            <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Issue Stock Requisition
            </h2>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Deducts batches in FIFO order (earliest expiry first), records movements, and updates stock alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {requisition.note && (
            <div className="rounded-lg border border-[#E4E0D8] bg-white p-3 text-xs text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
              <strong className="text-[#181D1A] dark:text-[#ECF2EE]">Staff Note:</strong>{' '}
              {requisition.note}
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Review Line Items & Set Quantity to Issue
            </label>

            <div className="space-y-3">
              {requisition.lines.map((line) => {
                const item = items.find((i) => i.id === line.itemId);
                const itemBatches = batches.filter(
                  (b) => b.itemId === line.itemId && b.quantityRemaining > 0
                );
                const validNonExpiredAvailable = itemBatches
                  .filter((b) => !isBatchExpired(b.expiryDate))
                  .reduce((sum, b) => sum + b.quantityRemaining, 0);

                const hasExpired = itemBatches.some((b) => isBatchExpired(b.expiryDate));

                return (
                  <div
                    key={line.itemId}
                    className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#0D1310]"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                          {line.itemName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                          <span>
                            Requested: <strong className="font-mono tabular-nums">{line.quantityRequested} {line.unit}</strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Non-expired available: <strong className="font-mono tabular-nums">{validNonExpiredAvailable} {line.unit}</strong>
                          </span>
                          {hasExpired && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                (Expired batch will be skipped)
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                          Issue Qty:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={validNonExpiredAvailable}
                          required
                          value={issuedQuantities[line.itemId] || ''}
                          onChange={(e) =>
                            setIssuedQuantities((prev) => ({
                              ...prev,
                              [line.itemId]: e.target.value,
                            }))
                          }
                          className="w-24 rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                        />
                        <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                          {line.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3 text-xs text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]">
            <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              FIFO Transaction Guarantee:
            </p>
            <p className="mt-1">
              StockLine automatically allocates from the oldest non-expired batches first.
              If stock drops below the reorder level, a warning alert is triggered automatically.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Executing Transaction...' : 'Confirm & Issue Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 6. REJECT REQUISITION MODAL (STOREKEEPER)
// ==========================================

interface RejectRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  requisition: Requisition | null;
  onSuccess: (message: string) => void;
}

export const RejectRequisitionModal: React.FC<RejectRequisitionModalProps> = ({
  isOpen,
  onClose,
  actor,
  requisition,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !requisition) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }

    setSubmitting(true);
    try {
      await rejectRequisition(actor, requisition.id, reason);
      onSuccess(`Requisition ${requisition.requisitionNumber} rejected.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3 dark:border-[#223028]">
          <h2 className="text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Reject Requisition {requisition.requisitionNumber}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Rejection Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Stock reserved for banquet dinner service. Please submit a revised requisition."
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-red-600 focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#E4E0D8] pt-3 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Reject Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 7. DIRECT ISSUE MODAL (WALK-IN WITHDRAWAL)
// ==========================================

interface DirectIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  items: EnrichedStockItem[];
  staffUsers: AppUser[];
  onSuccess: (message: string) => void;
}

export const DirectIssueModal: React.FC<DirectIssueModalProps> = ({
  isOpen,
  onClose,
  actor,
  items,
  staffUsers,
  onSuccess,
}) => {
  const activeItems = items.filter((i) => i.isActive);
  const activeStaff = staffUsers.filter((u) => u.isActive);

  const [targetStaffUid, setTargetStaffUid] = useState('');
  const [department, setDepartment] = useState<RequisitionDepartment>('Kitchen');
  const [lines, setLines] = useState<
    { itemId: string; quantityIssued: string }[]
  >([{ itemId: activeItems[0]?.id || '', quantityIssued: '1' }]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetStaffUid(activeStaff[0]?.uid || '');
      setDepartment('Kitchen');
      setLines([{ itemId: activeItems[0]?.id || '', quantityIssued: '1' }]);
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { itemId: activeItems[0]?.id || '', quantityIssued: '1' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: 'itemId' | 'quantityIssued',
    value: string
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetStaff = staffUsers.find((u) => u.uid === targetStaffUid);
    if (!targetStaff) {
      setError('Please select the staff member taking the items.');
      return;
    }

    if (lines.length === 0) {
      setError('Please add at least one item line.');
      return;
    }

    const formattedLines: {
      itemId: string;
      itemName: string;
      unit: StockUnit;
      quantityIssued: number;
    }[] = [];

    for (const l of lines) {
      const itm = items.find((i) => i.id === l.itemId);
      if (!itm) {
        setError('Invalid item selected.');
        return;
      }
      const qty = Number(l.quantityIssued);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please enter a valid quantity for ${itm.name}.`);
        return;
      }
      formattedLines.push({
        itemId: itm.id,
        itemName: itm.name,
        unit: itm.unit,
        quantityIssued: qty,
      });
    }

    setSubmitting(true);
    try {
      const res = await recordDirectIssueTransaction(actor, {
        targetStaffUser: {
          userId: targetStaff.uid,
          userName: targetStaff.name,
        },
        department,
        lines: formattedLines,
        note: note.trim() || 'Direct walk-in store issue.',
      });

      let msg = `Direct issue ${res.requisition.requisitionNumber} processed for ${targetStaff.name}.`;
      if (res.expiredBatchesSkipped.length > 0) {
        msg += ` (${res.expiredBatchesSkipped.length} expired batch(es) skipped).`;
      }
      onSuccess(msg);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process direct issue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Direct Stock Issue (Walk-In Withdrawal)
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Issue items immediately to staff over the counter with full FIFO logging.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Staff Member Taking Items <span className="text-red-600">*</span>
              </label>
              <select
                value={targetStaffUid}
                onChange={(e) => setTargetStaffUid(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              >
                {activeStaff.map((st) => (
                  <option key={st.uid} value={st.uid}>
                    {st.name} ({st.role}) — {st.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Department <span className="text-red-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as RequisitionDepartment)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              >
                {REQUISITION_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                Items to Issue ({lines.length})
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => {
                const itm = items.find((i) => i.id === line.itemId);
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-[#E4E0D8] bg-white p-3 sm:flex-row sm:items-center dark:border-[#223028] dark:bg-[#0D1310]"
                  >
                    <div className="flex-1">
                      <select
                        aria-label={`Select item for direct issue line ${idx + 1}`}
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      >
                        {activeItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit}) — Available: {formatQuantity(item.totalQuantity)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={line.quantityIssued}
                          onChange={(e) =>
                            handleLineChange(idx, 'quantityIssued', e.target.value)
                          }
                          placeholder="Quantity"
                          className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                        />
                      </div>
                      <span className="w-12 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                        {itm?.unit || ''}
                      </span>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
              Issue Note
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Direct kitchen emergency withdrawal for VIP dinner prep."
              className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
            >
              {submitting ? 'Processing...' : 'Complete Direct Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
