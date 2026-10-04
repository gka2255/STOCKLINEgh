import React, { useState, useMemo } from 'react';
import {
  FilePlus,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Package,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  Requisition,
  RequisitionDepartment,
  StockUnit,
} from '../types/stock';
import {
  createRequisition,
  REQUISITION_DEPARTMENTS,
} from '../services/stockService';

interface NewRequisitionPageProps {
  currentUser: AppUser;
  items: EnrichedStockItem[];
  onNavigateToMyRequisitions: () => void;
  onShowToast: (msg: string) => void;
}

interface RequisitionDraftLine {
  id: string; // client temporary key
  itemId: string;
  quantityRequested: string;
}

export const NewRequisitionPage: React.FC<NewRequisitionPageProps> = ({
  currentUser,
  items,
  onNavigateToMyRequisitions,
  onShowToast,
}) => {
  // Only active items are selectable by staff. Strictly omit cost and batches.
  const activeItems = useMemo(() => items.filter((i) => i.isActive), [items]);

  const [department, setDepartment] = useState<RequisitionDepartment>('Kitchen');
  const [lines, setLines] = useState<RequisitionDraftLine[]>([
    {
      id: `line_${Date.now()}_1`,
      itemId: activeItems[0]?.id || '',
      quantityRequested: '1',
    },
  ]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequisition, setSubmittedRequisition] = useState<Requisition | null>(null);

  // Search filter for item picker selector
  const [searchPerLine, setSearchPerLine] = useState<Record<string, string>>({});

  const handleAddLine = () => {
    const newLineId = `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    // Find first item not already in lines, or fallback to first
    const usedIds = new Set(lines.map((l) => l.itemId));
    const available = activeItems.find((i) => !usedIds.has(i.id)) || activeItems[0];

    setLines((prev) => [
      ...prev,
      {
        id: newLineId,
        itemId: available?.id || '',
        quantityRequested: '1',
      },
    ]);
  };

  const handleRemoveLine = (lineId: string) => {
    if (lines.length <= 1) {
      setError('A requisition must contain at least one line item.');
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setError(null);
  };

  const handleLineChange = (
    lineId: string,
    field: 'itemId' | 'quantityRequested',
    value: string
  ) => {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
    setError(null);
  };

  const handleResetForm = () => {
    setSubmittedRequisition(null);
    setDepartment('Kitchen');
    setLines([
      {
        id: `line_${Date.now()}_1`,
        itemId: activeItems[0]?.id || '',
        quantityRequested: '1',
      },
    ]);
    setNote('');
    setError(null);
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

    const selectedItemIds = new Set<string>();

    for (const line of lines) {
      if (!line.itemId) {
        setError('Please select an item for every line.');
        return;
      }
      if (selectedItemIds.has(line.itemId)) {
        const dupItem = activeItems.find((i) => i.id === line.itemId);
        setError(
          `"${dupItem?.name || 'Item'}" is listed multiple times. Please combine into a single line.`
        );
        return;
      }
      selectedItemIds.add(line.itemId);

      const item = activeItems.find((i) => i.id === line.itemId);
      if (!item) {
        setError('An invalid or inactive item was selected.');
        return;
      }

      const qty = Number(line.quantityRequested);
      if (isNaN(qty) || qty <= 0) {
        setError(`Please enter a valid positive quantity for "${item.name}".`);
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
      const created = await createRequisition(currentUser, {
        department,
        lines: formattedLines,
        note,
      });

      setSubmittedRequisition(created);
      onShowToast(`Requisition ${created.requisitionNumber} submitted successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  // If successfully submitted, display the confirmation screen with auto REQ number
  if (submittedRequisition) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-xs dark:border-emerald-900/60 dark:bg-[#131C17]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <span className="mt-4 inline-block font-mono text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Requisition Submitted
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            {submittedRequisition.requisitionNumber}
          </h1>

          <p className="mt-2 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Your requisition for the <strong>{submittedRequisition.department}</strong> department has been logged with status{' '}
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              Pending Storekeeper Review
            </span>.
          </p>

          <div className="mt-6 rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-4 text-left dark:border-[#223028] dark:bg-[#0D1310]">
            <h3 className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Summary of Items Requested:
            </h3>
            <ul className="mt-2 divide-y divide-[#E4E0D8] text-xs text-[#2E3833] dark:divide-[#223028] dark:text-[#C8D4CC]">
              {submittedRequisition.lines.map((l, idx) => (
                <li key={idx} className="flex items-center justify-between py-1.5">
                  <span>{l.itemName}</span>
                  <span className="font-mono font-medium">
                    {l.quantityRequested} {l.unit}
                  </span>
                </li>
              ))}
            </ul>
            {submittedRequisition.note && (
              <p className="mt-3 border-t border-[#E4E0D8] pt-2 text-[11px] text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F]">
                <strong>Staff Note:</strong> {submittedRequisition.note}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D5D0C6] bg-white px-4 py-2.5 text-xs font-medium text-[#181D1A] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE] dark:hover:bg-[#1C2822]"
            >
              <FilePlus className="h-4 w-4" />
              <span>Submit Another Requisition</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToMyRequisitions}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#14532D] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
            >
              <ClipboardList className="h-4 w-4" />
              <span>View My Requisitions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#14532D]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
            Kitchen & Bar Logistics
          </span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
          Create Stock Requisition
        </h1>
        <p className="mt-0.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
          Request ingredients and operating supplies from the central storeroom. Storekeepers will review and issue items via FIFO.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Department & Staff Details */}
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
            1. Department Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Department <span className="text-red-600">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as RequisitionDepartment)}
                className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
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
                Requested By (Logged In Staff)
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.role})`}
                className="mt-1.5 w-full rounded-lg border border-[#E4E0D8] bg-[#F4F1EA] px-3 py-2 text-xs font-medium text-[#5C6660] dark:border-[#223028] dark:bg-[#0D1310] dark:text-[#9AA89F]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Line Items */}
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
              2. Requested Items & Quantities
            </h2>
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3 py-1.5 text-xs font-medium text-[#14532D] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#22C55E] dark:hover:bg-[#1C2822]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {lines.map((line, index) => {
              const selectedItem = activeItems.find((i) => i.id === line.itemId);
              const filterQuery = (searchPerLine[line.id] || '').toLowerCase().trim();

              const filteredOptions = filterQuery
                ? activeItems.filter(
                    (i) =>
                      i.name.toLowerCase().includes(filterQuery) ||
                      i.category.toLowerCase().includes(filterQuery)
                  )
                : activeItems;

              return (
                <div
                  key={line.id}
                  className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3.5 dark:border-[#223028] dark:bg-[#0D1310]"
                >
                  <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-2 dark:border-[#223028]">
                    <span className="font-mono text-xs font-semibold text-[#14532D] dark:text-[#22C55E]">
                      Line #{index + 1}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                    {/* Item Picker (No cost or batch info exposed) */}
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                        Select Stock Item <span className="text-red-600">*</span>
                      </label>

                      {/* Quick Search filter for staff */}
                      <div className="relative mt-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5C6660] dark:text-[#9AA89F]" />
                        <input
                          type="text"
                          placeholder="Filter catalog items..."
                          value={searchPerLine[line.id] || ''}
                          onChange={(e) =>
                            setSearchPerLine((prev) => ({
                              ...prev,
                              [line.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-[#D5D0C6] bg-white py-1.5 pl-8 pr-2.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                        />
                      </div>

                      <select
                        required
                        value={line.itemId}
                        onChange={(e) => handleLineChange(line.id, 'itemId', e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      >
                        {filteredOptions.length === 0 ? (
                          <option disabled value="">
                            No active items match "{filterQuery}"
                          </option>
                        ) : (
                          filteredOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.unit}) — {item.category}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Quantity Input */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                        Quantity Requested ({selectedItem?.unit || 'unit'}) <span className="text-red-600">*</span>
                      </label>
                      <div className="relative mt-1 sm:mt-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          required
                          value={line.quantityRequested}
                          onChange={(e) =>
                            handleLineChange(line.id, 'quantityRequested', e.target.value)
                          }
                          placeholder="e.g. 5"
                          className="w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                          {selectedItem?.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Notes & Purpose */}
        <div className="rounded-lg border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
            3. Operational Purpose & Notes
          </h2>
          <div className="mt-3">
            <textarea
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Ingredients required for lunch prep and weekend banquet service."
              className="w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
            <p className="mt-1 text-right text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              {note.length} / 500 characters
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
          <button
            type="button"
            onClick={onNavigateToMyRequisitions}
            className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2.5 text-xs font-medium text-[#2E3833] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-6 py-2.5 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <FilePlus className="h-4 w-4" />
            <span>{submitting ? 'Submitting Requisition...' : 'Submit Requisition'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
