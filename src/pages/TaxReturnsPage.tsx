import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  Receipt,
  HelpCircle,
  X,
  Send,
  Eye,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { AppUser, TaxReturn, TaxSettings } from '../types/stock';
import { fileTaxReturn, getTaxSettings } from '../services/stockService';
import { formatGhs, formatDateShort, formatDateTimeShort } from '../utils/formatters';

interface TaxReturnsPageProps {
  currentUser: AppUser;
  taxReturns: TaxReturn[];
  onShowToast: (msg: string) => void;
  onNavigateToOverview: () => void;
}

export const TaxReturnsPage: React.FC<TaxReturnsPageProps> = ({
  currentUser,
  taxReturns,
  onShowToast,
  onNavigateToOverview,
}) => {
  const isManager = currentUser.role === 'manager';
  const taxSettings: TaxSettings = getTaxSettings();

  const [selectedReturn, setSelectedReturn] = useState<TaxReturn | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine status if pending has passed dueDate
  const getReturnDisplayStatus = (r: TaxReturn) => {
    if (r.status === 'Filed') return 'Filed';
    if (todayStr > r.dueDate) return 'Overdue';
    return 'Pending';
  };

  const handleOpenReturn = (r: TaxReturn) => {
    setSelectedReturn(r);
  };

  const handleCloseReturn = () => {
    setSelectedReturn(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmFiling = async () => {
    if (!selectedReturn) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const filed = await fileTaxReturn(currentUser, selectedReturn.id);
      setSelectedReturn(filed);
      setIsSubmitModalOpen(false);
      onShowToast(`GRA VAT Return for ${filed.periodLabel} successfully filed! Reference: ${filed.referenceNumber}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to file tax return.');
    } finally {
      setSubmitting(false);
    }
  };

  // If a return is selected, show the GRA Taxpayers Portal Style Form
  if (selectedReturn) {
    const isFiled = selectedReturn.status === 'Filed';
    const displayStatus = getReturnDisplayStatus(selectedReturn);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation Bar (Hidden when printing) */}
        <div className="flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={handleCloseReturn}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Returns List</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
            >
              <Printer className="h-4 w-4" />
              <span>Print Return</span>
            </button>

            {!isFiled && isManager && (
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setIsSubmitModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] dark:bg-[#16A34A]"
              >
                <Send className="h-4 w-4" />
                <span>Submit Return to GRA</span>
              </button>
            )}
          </div>
        </div>

        {/* GRA Portal Simulation Banner */}
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 print:hidden dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Simulated GRA Taxpayers Portal Filing</p>
              <p className="mt-0.5">
                This is a simulated filing, not a live Ghana Revenue Authority (GRA) submission. Submitting will lock the period figures, mark the month as Filed, and issue an immutable reference snapshot.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Note about Output Tax */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 print:border-gray-300 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold">Notice regarding Output Tax on Restaurant Sales</p>
              <p className="mt-0.5">
                Output tax from sales is not recorded in StockLine. This return shows input tax claimable on purchases.
              </p>
            </div>
          </div>
        </div>

        {/* Official GRA Form Container (Printable) */}
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-sm sm:p-8 dark:border-[#223028] dark:bg-[#111915]">
          {/* Official Form Header */}
          <div className="border-b-2 border-[#181D1A] pb-6 dark:border-[#ECF2EE]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5C6660] dark:text-[#9AA89F]">
                  GHANA REVENUE AUTHORITY · DOMESTIC TAX REVENUE DIVISION
                </span>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
                  VALUE ADDED TAX (VAT) & LEVIES RETURN
                </h1>
                <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Pursuant to the Value Added Tax Act 2025 (Act 1151)
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-left sm:text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isFiled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : displayStatus === 'Overdue'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {isFiled ? 'Filed & Locked' : displayStatus}
                </span>
                {isFiled && (
                  <div className="mt-1 font-mono text-[11px] font-semibold text-[#14532D] dark:text-[#22C55E]">
                    Ref: {selectedReturn.referenceNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Filing details banner if filed */}
            {isFiled && (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-[#FAF8F5] p-3 text-xs border border-[#E4E0D8] dark:bg-[#0D1310] dark:border-[#223028]">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Officially Filed</span>
                </div>
                <div className="text-[#5C6660] dark:text-[#9AA89F]">
                  Filed By: <span className="font-medium text-[#181D1A] dark:text-[#ECF2EE]">{selectedReturn.filedBy?.userName}</span>
                </div>
                <div className="text-[#5C6660] dark:text-[#9AA89F]">
                  Filed At: <span className="font-mono">{selectedReturn.filedAt ? formatDateTimeShort(selectedReturn.filedAt) : '—'}</span>
                </div>
                <div className="text-[#5C6660] dark:text-[#9AA89F]">
                  Status: <span className="font-medium">Immutable Snapshot</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-6">
            {/* Section 1: Taxpayer Details */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14532D] border-b border-[#E4E0D8] pb-1 dark:text-[#22C55E] dark:border-[#223028]">
                Section A: Taxpayer Information
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                    Business / Entity Name
                  </label>
                  <div className="mt-1 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                    {selectedReturn.businessName}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                    Tax Identification Number (TIN)
                  </label>
                  <div className="mt-1 font-mono font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                    {selectedReturn.tin}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                    Tax Period (Month)
                  </label>
                  <div className="mt-1 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                    {selectedReturn.periodLabel} ({selectedReturn.period})
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
                    Statutory Due Date
                  </label>
                  <div className="mt-1 font-mono font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                    {formatDateShort(selectedReturn.dueDate)} (Last Working Day of Next Month)
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Purchases Section */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14532D] border-b border-[#E4E0D8] pb-1 dark:text-[#22C55E] dark:border-[#223028]">
                Section B: Purchases Summary (Goods & Services In)
              </h2>
              <div className="mt-3 overflow-hidden rounded-lg border border-[#E4E0D8] dark:border-[#223028]">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF8F5] text-[#5C6660] border-b border-[#E4E0D8] dark:bg-[#0D1310] dark:border-[#223028]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Classification</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Description</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Net Amount (GH₵)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 10: Standard-Rated Purchases
                      </td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Taxable inventory (cooking oil, LPG, processed goods, spices, packaging)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.standardPurchasesNet)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 11: Exempt Purchases
                      </td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Raw foodstuffs (fresh produce, fresh meat, unprocessed fish, vegetables)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.exemptPurchases)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 12: Zero-Rated Purchases
                      </td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Supplies qualifying under First Schedule zero rating
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.zeroRatedPurchases)}
                      </td>
                    </tr>
                    <tr className="bg-[#FAF8F5] font-bold dark:bg-[#0D1310]">
                      <td className="px-4 py-3 text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 13: Total Net Purchases
                      </td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Sum of taxable, exempt, and zero-rated purchases
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.totalPurchasesNet)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Input Tax Section */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14532D] border-b border-[#E4E0D8] pb-1 dark:text-[#22C55E] dark:border-[#223028]">
                Section C: Input Tax Claimable (Statutory Levies & VAT)
              </h2>
              <div className="mt-3 overflow-hidden rounded-lg border border-[#E4E0D8] dark:border-[#223028]">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF8F5] text-[#5C6660] border-b border-[#E4E0D8] dark:bg-[#0D1310] dark:border-[#223028]">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Tax / Levy Head</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Statutory Rate</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Taxable Base</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Tax Amount (GH₵)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 20: Value Added Tax (VAT)
                      </td>
                      <td className="px-4 py-3 text-center font-mono">15.0%</td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Box 10 Net Amount ({formatGhs(selectedReturn.standardPurchasesNet)})
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
                        {formatGhs(selectedReturn.vatInput)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 21: National Health Insurance Levy (NHIL)
                      </td>
                      <td className="px-4 py-3 text-center font-mono">2.5%</td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Box 10 Net Amount (Same base, no cascading)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.nhilInput)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        Box 22: Ghana Education Trust Fund (GETFund)
                      </td>
                      <td className="px-4 py-3 text-center font-mono">2.5%</td>
                      <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F]">
                        Box 10 Net Amount (Same base, no cascading)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(selectedReturn.getfundInput)}
                      </td>
                    </tr>
                    <tr className="bg-[#14532D]/5 font-bold dark:bg-[#16A34A]/10">
                      <td className="px-4 py-3 text-[#14532D] dark:text-[#22C55E]" colSpan={2}>
                        Box 23: Total Deductible Input Tax
                      </td>
                      <td className="px-4 py-3 text-xs text-[#14532D] dark:text-[#22C55E]">
                        Total 20% Input Credit Claimable
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-base tabular-nums text-[#14532D] dark:text-[#22C55E]">
                        {formatGhs(selectedReturn.totalInputTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Cost of Stock Issued */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14532D] border-b border-[#E4E0D8] pb-1 dark:text-[#22C55E] dark:border-[#223028]">
                Section D: Stock Issued & Goods Consumed at Cost
              </h2>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-4 text-xs dark:border-[#223028] dark:bg-[#0D1310]">
                <div>
                  <span className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                    Box 30: Total Cost Value of Stock Out
                  </span>
                  <p className="mt-0.5 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                    Cost of food items requisitioned & issued to kitchen/bar stations excluding tax
                  </p>
                </div>
                <div className="font-mono text-base font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatGhs(selectedReturn.stockOutCost)}
                </div>
              </div>
            </div>

            {/* Declaration & Sign-off */}
            <div className="rounded-lg border border-[#E4E0D8] p-4 text-xs dark:border-[#223028]">
              <h3 className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                Taxpayer Declaration
              </h3>
              <p className="mt-1 text-[#5C6660] dark:text-[#9AA89F]">
                I declare that the information given above is true and complete, reflecting the purchase ledger and delivery receipts recorded in StockLine for the specified tax period.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#E4E0D8] pt-3 text-[11px] dark:border-[#223028]">
                <div>
                  <span className="text-[#5C6660]">Designation:</span>{' '}
                  <span className="font-medium">Restaurant General Manager</span>
                </div>
                <div>
                  <span className="text-[#5C6660]">Sign-off Status:</span>{' '}
                  <span className="font-medium">{isFiled ? `Filed by ${selectedReturn.filedBy?.userName}` : 'Pending Confirmation'}</span>
                </div>
                <div>
                  <span className="text-[#5C6660]">Date:</span>{' '}
                  <span className="font-mono">{isFiled && selectedReturn.filedAt ? formatDateShort(selectedReturn.filedAt) : todayStr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-2xl dark:border-[#28382F] dark:bg-[#111915]">
              <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3 dark:border-[#223028]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#16A34A]/20 dark:text-[#22C55E]">
                    <Send className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                    Confirm Simulated GRA Filing
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-lg p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {submitError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="mt-4 space-y-3 text-xs text-[#2E3833] dark:text-[#C8D4CC]">
                <p>
                  You are about to file the simulated GRA VAT Return for period{' '}
                  <strong className="text-[#181D1A] dark:text-[#ECF2EE]">
                    {selectedReturn.periodLabel}
                  </strong>
                  .
                </p>

                <div className="rounded-lg border border-[#E4E0D8] bg-white p-3 space-y-1.5 dark:border-[#223028] dark:bg-[#0D1310]">
                  <div className="flex justify-between">
                    <span className="text-[#5C6660]">Taxable Purchases Net:</span>
                    <span className="font-mono font-medium">{formatGhs(selectedReturn.standardPurchasesNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C6660]">Claimable Input Tax (20%):</span>
                    <span className="font-mono font-bold text-[#14532D] dark:text-[#22C55E]">
                      {formatGhs(selectedReturn.totalInputTax)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#E4E0D8] pt-1 dark:border-[#223028]">
                    <span className="text-[#5C6660]">Generated Reference:</span>
                    <span className="font-mono font-bold">RET-{selectedReturn.period}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                  <strong>Warning:</strong> Once filed, return figures are locked and cannot be edited or deleted.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmFiling}
                  className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
                >
                  {submitting ? 'Locking & Filing...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pending / History Returns List View
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            GRA Monthly VAT Returns Portal
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Monthly statutory input tax filings modeled after the Ghana Revenue Authority Taxpayers Portal
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToOverview}
          className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
        >
          <Receipt className="h-4 w-4" />
          <span>Tax Overview Ledger</span>
        </button>
      </div>

      {/* Statutory Guidelines Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="font-semibold">GRA Filing Calendar & Rules (Act 1151)</p>
            <p className="mt-0.5">
              Monthly returns are due on the last working day (Monday–Friday) of the month following the accounting period. Filed returns are immutable snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* Returns List Table */}
      <div className="overflow-hidden rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="p-4 border-b border-[#E4E0D8] dark:border-[#223028]">
          <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
            Statutory Returns Schedule
          </h2>
          <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Pending, Overdue, and Filed monthly returns
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
              <tr>
                <th className="px-4 py-3 font-semibold">Period (Month)</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold text-right">Standard Purchases Net</th>
                <th className="px-4 py-3 font-semibold text-right">Claimable Input Tax (20%)</th>
                <th className="px-4 py-3 font-semibold text-right">Stock Out Cost</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {taxReturns.map((ret) => {
                const isFiled = ret.status === 'Filed';
                const displayStatus = getReturnDisplayStatus(ret);

                return (
                  <tr
                    key={ret.id}
                    className={`hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C] ${
                      displayStatus === 'Overdue' ? 'border-l-4 border-l-red-600' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        {ret.periodLabel}
                      </div>
                      <div className="font-mono text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                        {ret.period}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div
                        className={`font-mono text-[11px] ${
                          displayStatus === 'Overdue'
                            ? 'font-bold text-red-600 dark:text-red-400'
                            : 'text-[#5C6660] dark:text-[#9AA89F]'
                        }`}
                      >
                        {formatDateShort(ret.dueDate)}
                      </div>
                      {displayStatus === 'Overdue' && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          OVERDUE
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                      {formatGhs(ret.standardPurchasesNet)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
                      {formatGhs(ret.totalInputTax)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {formatGhs(ret.stockOutCost)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          isFiled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : displayStatus === 'Overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {isFiled ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Filed</span>
                          </>
                        ) : displayStatus === 'Overdue' ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Overdue</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                      {isFiled && ret.referenceNumber && (
                        <div className="font-mono text-[9px] text-[#5C6660] dark:text-[#9AA89F] mt-0.5">
                          {ret.referenceNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReturn(ret)}
                        className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          isFiled
                            ? 'border border-[#D5D0C6] bg-white text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]'
                            : 'bg-[#14532D] text-white hover:bg-[#166534] dark:bg-[#16A34A]'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{isFiled ? 'View Return' : 'Review & File'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
