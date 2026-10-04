import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Download,
  Calendar,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  DollarSign,
  Package,
} from 'lucide-react';
import { AppUser, PeriodType, Purchase, TaxSummary } from '../types/stock';
import { formatGhs, formatDateShort, getIsoWeekString } from '../utils/formatters';

interface TaxOverviewPageProps {
  currentUser: AppUser;
  taxSummaries: TaxSummary[];
  purchases: Purchase[];
  onShowToast: (msg: string) => void;
  onNavigateToReturns: () => void;
}

export const TaxOverviewPage: React.FC<TaxOverviewPageProps> = ({
  currentUser,
  taxSummaries,
  purchases,
  onShowToast,
  onNavigateToReturns,
}) => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  // Filter summaries by selected period type
  const availableSummaries = useMemo(() => {
    return taxSummaries
      .filter((s) => s.periodType === periodType)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [taxSummaries, periodType]);

  // Selected period state (default to first/most recent)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    if (availableSummaries.length > 0) return availableSummaries[0].period;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Keep selectedPeriod synced if periodType changes
  const activeSummary = useMemo(() => {
    const found = availableSummaries.find((s) => s.period === selectedPeriod);
    if (found) return found;
    return availableSummaries[0] || null;
  }, [availableSummaries, selectedPeriod]);

  // Purchases matching activeSummary period
  const matchingPurchases = useMemo(() => {
    if (!activeSummary) return [];
    return purchases
      .filter((p) => p.dateSupplied >= activeSummary.startDate && p.dateSupplied <= activeSummary.endDate)
      .sort((a, b) => b.dateSupplied.localeCompare(a.dateSupplied));
  }, [purchases, activeSummary]);

  // Historical data for chart (up to 7 days, 8 weeks, or 12 months)
  const chartData = useMemo(() => {
    const limit = periodType === 'day' ? 7 : periodType === 'week' ? 8 : 12;
    const items = [...availableSummaries].reverse().slice(-limit);
    return items.map((s) => ({
      label:
        periodType === 'day'
          ? s.period.slice(5) // MM-DD
          : periodType === 'week'
          ? s.period.replace(/^\d{4}-/, '') // Wxx
          : s.period, // YYYY-MM
      fullPeriod: s.period,
      vatInput: s.vatInput,
      nhilInput: s.nhilInput,
      getfundInput: s.getfundInput,
      totalTax: s.totalInputTax,
      purchasesGross: s.purchasesGross,
      stockOutValue: s.stockOutValue,
    }));
  }, [availableSummaries, periodType]);

  // Max value for chart scaling
  const maxChartVal = useMemo(() => {
    let max = 0;
    for (const d of chartData) {
      if (d.purchasesGross > max) max = d.purchasesGross;
      if (d.totalTax > max) max = d.totalTax;
    }
    return Math.max(max, 100);
  }, [chartData]);

  // Export CSV handler
  const handleExportCsv = () => {
    if (matchingPurchases.length === 0) {
      onShowToast('No purchases found for the selected period to export.');
      return;
    }

    const headers = [
      'Purchase #',
      'Date Supplied',
      'Supplier',
      'Invoice #',
      'Taxable Standard Net (GH₵)',
      'VAT 15% (GH₵)',
      'NHIL 2.5% (GH₵)',
      'GETFund 2.5% (GH₵)',
      'Total Input Tax (GH₵)',
      'Gross Total (GH₵)',
      'Amount Paid (GH₵)',
      'Arrears (GH₵)',
      'Status',
    ];

    const rows = matchingPurchases.map((p) => [
      `"${p.purchaseNumber}"`,
      `"${p.dateSupplied}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      `"${(p.invoiceNumber || '').replace(/"/g, '""')}"`,
      (p.taxableAmount || 0).toFixed(2),
      (p.vatAmount || 0).toFixed(2),
      (p.nhilAmount || 0).toFixed(2),
      (p.getfundAmount || 0).toFixed(2),
      (p.totalTax || 0).toFixed(2),
      (p.totalWithTax || p.subtotal).toFixed(2),
      p.amountPaid.toFixed(2),
      p.arrears.toFixed(2),
      `"${p.paymentStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `StockLine_Tax_Drilldown_${periodType}_${activeSummary?.period || 'export'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exported ${matchingPurchases.length} purchases to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              Tax Engine & Input VAT Ledger
            </h1>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Act 1151 Compliant
            </span>
          </div>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Real-time input tax summaries on kitchen food purchases, supplies, and stock cost value
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToReturns}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <Receipt className="h-4 w-4" />
            <span>Monthly Return (GRA Portal)</span>
          </button>
        </div>
      </div>

      {/* Tabs & Period Picker Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E4E0D8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#223028] dark:bg-[#131C17]">
        {/* Period Type Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-[#FAF8F5] p-1 border border-[#E4E0D8] dark:bg-[#0D1310] dark:border-[#223028]">
          <button
            type="button"
            onClick={() => {
              setPeriodType('day');
              const first = taxSummaries.find((s) => s.periodType === 'day');
              if (first) setSelectedPeriod(first.period);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              periodType === 'day'
                ? 'bg-[#14532D] text-white shadow-xs dark:bg-[#16A34A]'
                : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-[#ECF2EE]'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodType('week');
              const first = taxSummaries.find((s) => s.periodType === 'week');
              if (first) setSelectedPeriod(first.period);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              periodType === 'week'
                ? 'bg-[#14532D] text-white shadow-xs dark:bg-[#16A34A]'
                : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-[#ECF2EE]'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodType('month');
              const first = taxSummaries.find((s) => s.periodType === 'month');
              if (first) setSelectedPeriod(first.period);
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              periodType === 'month'
                ? 'bg-[#14532D] text-white shadow-xs dark:bg-[#16A34A]'
                : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-[#ECF2EE]'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Period Dropdown Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
          <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Selected Period:
          </span>
          <select
            value={activeSummary?.period || selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 text-xs font-mono font-medium text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
          >
            {availableSummaries.map((s) => (
              <option key={s.id} value={s.period}>
                {s.period} ({formatDateShort(s.startDate)} to {formatDateShort(s.endDate)}) · {s.purchaseCount} purchases
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Input VAT (15%)
          </span>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
            {formatGhs(activeSummary?.vatInput || 0)}
          </div>
          <span className="text-[10px] text-[#8C9690]">Claimable input</span>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Input NHIL (2.5%)
          </span>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.nhilInput || 0)}
          </div>
          <span className="text-[10px] text-[#8C9690]">Health Insurance</span>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Input GETFund (2.5%)
          </span>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.getfundInput || 0)}
          </div>
          <span className="text-[10px] text-[#8C9690]">Education Trust</span>
        </div>

        <div className="rounded-xl border border-[#14532D]/30 bg-[#14532D]/5 p-4 shadow-xs dark:border-[#22C55E]/30 dark:bg-[#16A34A]/10">
          <span className="text-[11px] font-medium text-[#14532D] dark:text-[#22C55E]">
            Total Input Tax (20%)
          </span>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#14532D] dark:text-[#22C55E]">
            {formatGhs(activeSummary?.totalInputTax || 0)}
          </div>
          <span className="text-[10px] text-[#14532D]/80 dark:text-[#22C55E]/80">Combined tax credit</span>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Gross Purchases In
          </span>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.purchasesGross || 0)}
          </div>
          <span className="text-[10px] text-[#8C9690]">
            {activeSummary?.purchaseCount || 0} deliveries received
          </span>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <span className="text-[11px] font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Stock Out at Cost
          </span>
          <div className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
            {formatGhs(activeSummary?.stockOutValue || 0)}
          </div>
          <span className="text-[10px] text-[#8C9690]">Requisitions issued</span>
        </div>
      </div>

      {/* Tax Category Breakdown Box */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Standard-Rated Purchases (Net)
            </span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              Taxable 20%
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.standardPurchasesNet || 0)}
          </div>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Cooking oil, LPG gas, spices, processed food, cleaning chemicals
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Exempt Food Purchases
            </span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              0% Tax
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.exemptPurchases || 0)}
          </div>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Fresh local Roma tomatoes, whole fresh broiler chicken, raw goat meat, plantain
          </p>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Zero-Rated Purchases
            </span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-300">
              0% Relief
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(activeSummary?.zeroRatedPurchases || 0)}
          </div>
          <p className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Statutory zero-rated supplies and relief items under First Schedule
          </p>
        </div>
      </div>

      {/* SVG Bar & Trend Chart */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div>
            <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
              Input Tax Trend ({periodType === 'day' ? 'Last 7 Days' : periodType === 'week' ? 'Last 8 Weeks' : 'Last 12 Months'})
            </h2>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Comparison of Input Tax claimable vs. Gross Food Deliveries
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#14532D] dark:bg-[#22C55E]" />
              <span className="text-[#5C6660] dark:text-[#9AA89F]">Input Tax</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-[#93C5FD] dark:bg-blue-600" />
              <span className="text-[#5C6660] dark:text-[#9AA89F]">Gross Purchases</span>
            </div>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="mt-6 h-64 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#5C6660]">
              No summary history recorded yet.
            </div>
          ) : (
            <div className="flex h-full items-end gap-2 sm:gap-4 pt-6">
              {chartData.map((d, idx) => {
                const taxHeight = Math.max(4, Math.round((d.totalTax / maxChartVal) * 190));
                const grossHeight = Math.max(4, Math.round((d.purchasesGross / maxChartVal) * 190));
                const isSelected = d.fullPeriod === activeSummary?.period;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPeriod(d.fullPeriod)}
                    className={`group relative flex flex-1 flex-col items-center cursor-pointer rounded-lg p-1 transition-all ${
                      isSelected ? 'bg-[#FAF8F5] ring-2 ring-[#14532D] dark:bg-[#17221C] dark:ring-[#22C55E]' : 'hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]'
                    }`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:block rounded bg-[#181D1A] px-2 py-1 text-[10px] text-white shadow-md dark:bg-white dark:text-[#181D1A] whitespace-nowrap">
                      {d.fullPeriod} | Tax: {formatGhs(d.totalTax)} | Gross: {formatGhs(d.purchasesGross)}
                    </div>

                    <div className="flex h-48 w-full items-end justify-center gap-1 sm:gap-1.5">
                      {/* Gross bar */}
                      <div
                        style={{ height: `${grossHeight}px` }}
                        className="w-1/2 max-w-[20px] rounded-t bg-blue-300 dark:bg-blue-800 transition-all group-hover:opacity-80"
                      />
                      {/* Tax bar */}
                      <div
                        style={{ height: `${taxHeight}px` }}
                        className="w-1/2 max-w-[20px] rounded-t bg-[#14532D] dark:bg-[#22C55E] transition-all group-hover:opacity-80"
                      />
                    </div>

                    <div className="mt-2 font-mono text-[10px] text-[#5C6660] dark:text-[#9AA89F] truncate max-w-[48px] text-center">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Drill-down Table: Purchases Behind this Period */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-[#E4E0D8] dark:border-[#223028]">
          <div>
            <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
              Purchases Behind Period {activeSummary?.period || '—'}
            </h2>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Showing {matchingPurchases.length} deliveries between {activeSummary?.startDate} and {activeSummary?.endDate}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={matchingPurchases.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors disabled:opacity-50 dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {matchingPurchases.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
            No purchases found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Purchase #</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold text-right">Standard Net</th>
                  <th className="px-4 py-3 font-semibold text-right">VAT 15%</th>
                  <th className="px-4 py-3 font-semibold text-right">NHIL 2.5%</th>
                  <th className="px-4 py-3 font-semibold text-right">GETFund 2.5%</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Tax</th>
                  <th className="px-4 py-3 font-semibold text-right">Gross Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {matchingPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C]">
                    <td className="px-4 py-3 font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                      {p.purchaseNumber}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                      {p.dateSupplied}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                      {p.supplierName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {formatGhs(p.taxableAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#14532D] dark:text-[#22C55E]">
                      {formatGhs(p.vatAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F]">
                      {formatGhs(p.nhilAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#5C6660] dark:text-[#9AA89F]">
                      {formatGhs(p.getfundAmount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-[#14532D] dark:text-[#22C55E]">
                      {formatGhs(p.totalTax || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                      {formatGhs(p.totalWithTax || p.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          p.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : p.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
