import React, { useState, useEffect } from 'react';
import {
  Settings2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Calculator,
  Building2,
  FileText,
  Clock,
  Info,
  DollarSign,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import {
  AppUser,
  PricesEnteredAs,
  TaxSettings,
  TaxSettingsHistory,
} from '../types/stock';
import {
  getTaxSettings,
  updateTaxSettings,
  getTaxSettingsHistory,
  recalculateAllPurchasesTax,
} from '../services/stockService';
import { formatDateTimeShort } from '../utils/formatters';

interface TaxSettingsPageProps {
  currentUser: AppUser;
  onShowToast: (msg: string) => void;
}

export const TaxSettingsPage: React.FC<TaxSettingsPageProps> = ({
  currentUser,
  onShowToast,
}) => {
  const isManager = currentUser.role === 'manager';

  const [settings, setSettings] = useState<TaxSettings>(() => getTaxSettings());
  const [history, setHistory] = useState<TaxSettingsHistory[]>(() => getTaxSettingsHistory());

  // Form states
  const [vatRate, setVatRate] = useState(String(settings.vatRate));
  const [nhilRate, setNhilRate] = useState(String(settings.nhilRate));
  const [getfundRate, setGetfundRate] = useState(String(settings.getfundRate));
  const [pricesEnteredAs, setPricesEnteredAs] = useState<PricesEnteredAs>(settings.pricesEnteredAs);
  const [isVatRegistered, setIsVatRegistered] = useState(settings.isVatRegistered);
  const [businessName, setBusinessName] = useState(settings.businessName || 'StockLine Restaurant Ltd');
  const [tin, setTin] = useState(settings.tin || 'C002847192X');
  const [changeNote, setChangeNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cur = getTaxSettings();
    setSettings(cur);
    setVatRate(String(cur.vatRate));
    setNhilRate(String(cur.nhilRate));
    setGetfundRate(String(cur.getfundRate));
    setPricesEnteredAs(cur.pricesEnteredAs);
    setIsVatRegistered(cur.isVatRegistered);
    setBusinessName(cur.businessName || 'StockLine Restaurant Ltd');
    setTin(cur.tin || 'C002847192X');
    setHistory(getTaxSettingsHistory());
  }, []);

  if (!isManager) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
        <h2 className="mt-3 font-display text-lg font-bold text-red-900 dark:text-red-200">
          Access Restricted: Manager Only
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          Statutory VAT configuration, GRA taxpayer registration details, and calculation formulas can only be modified by the Restaurant General Manager.
        </p>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedVat = Number(vatRate);
    const parsedNhil = Number(nhilRate);
    const parsedGetfund = Number(getfundRate);

    if (isNaN(parsedVat) || parsedVat < 0 || parsedVat > 100) {
      setError('VAT Rate must be a valid percentage between 0 and 100.');
      return;
    }
    if (isNaN(parsedNhil) || parsedNhil < 0 || parsedNhil > 100) {
      setError('NHIL Rate must be a valid percentage between 0 and 100.');
      return;
    }
    if (isNaN(parsedGetfund) || parsedGetfund < 0 || parsedGetfund > 100) {
      setError('GETFund Rate must be a valid percentage between 0 and 100.');
      return;
    }
    if (!businessName.trim()) {
      setError('Registered Taxpayer Business Name is required for GRA returns.');
      return;
    }
    if (!tin.trim()) {
      setError('Tax Identification Number (TIN) is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateTaxSettings(currentUser, {
        vatRate: parsedVat,
        nhilRate: parsedNhil,
        getfundRate: parsedGetfund,
        pricesEnteredAs,
        isVatRegistered,
        businessName: businessName.trim(),
        tin: tin.trim().toUpperCase(),
        note: changeNote.trim() || undefined,
      });

      setSettings(updated);
      setHistory(getTaxSettingsHistory());
      setChangeNote('');
      onShowToast('Statutory tax settings and Act 1151 rates updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tax settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateTax = async () => {
    if (!window.confirm('Recalculate tax for all purchases? This will compute VAT, NHIL, GETFund, and updated arrears using current item tax categories and settings.')) {
      return;
    }

    setRecalculating(true);
    try {
      const count = await recalculateAllPurchasesTax(currentUser);
      onShowToast(`Successfully recalculated statutory tax for ${count} purchases!`);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#16A34A]/20 dark:text-[#22C55E]">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
                Statutory Tax Engine Settings
              </h1>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Ghana Revenue Authority (GRA) VAT Act 2025 (Act 1151) configuration & rates
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRecalculateTax}
          disabled={recalculating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-semibold text-[#181D1A] hover:bg-[#EFECE6] disabled:opacity-50 transition-colors shadow-xs dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE] dark:hover:bg-[#1C2822]"
        >
          <Calculator className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          <span>{recalculating ? 'Recalculating Tax...' : 'Recalculate Tax for Existing Purchases'}</span>
        </button>
      </div>

      {/* Statutory Act 1151 Notice */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong className="font-semibold block text-sm mb-0.5">
              Statutory Basis: VAT Act 2025 (Act 1151), Effective 1 January 2026
            </strong>
            Rates follow VAT Act 2025 (Act 1151), effective 1 Jan 2026. <strong>VAT (15%)</strong>,{' '}
            <strong>NHIL (2.5%)</strong>, and <strong>GETFund (2.5%)</strong> apply to the{' '}
            <span className="underline decoration-emerald-500 font-semibold">same taxable amount</span>{' '}
            (no cascading or tax-on-tax). Unprocessed foodstuffs and fresh agricultural produce are exempt under the First Schedule.
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Tax Rates & Pricing Mode */}
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE] flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <span>Statutory Tax Rates & Calculation Model</span>
          </h2>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Configure the statutory percentages applicable to standard-rated procurements.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                Value Added Tax (VAT) % *
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 font-mono text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-[#5C6660]">%</span>
              </div>
              <span className="mt-1 block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                Standard Ghana VAT rate: 15.0%
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                National Health Insurance Levy (NHIL) % *
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={nhilRate}
                  onChange={(e) => setNhilRate(e.target.value)}
                  className="w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 font-mono text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-[#5C6660]">%</span>
              </div>
              <span className="mt-1 block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                Statutory NHIL levy: 2.5%
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                GETFund Levy % *
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={getfundRate}
                  onChange={(e) => setGetfundRate(e.target.value)}
                  className="w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 font-mono text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-[#5C6660]">%</span>
              </div>
              <span className="mt-1 block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                Statutory GETFund levy: 2.5%
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#E4E0D8] pt-5 dark:border-[#223028]">
            {/* Price Entry Basis */}
            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                Purchase Line Prices Entered As *
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPricesEnteredAs('exclusive')}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    pricesEnteredAs === 'exclusive'
                      ? 'border-[#14532D] bg-[#14532D]/5 font-semibold text-[#14532D] dark:border-[#22C55E] dark:bg-[#22C55E]/10 dark:text-[#22C55E]'
                      : 'border-[#D5D0C6] bg-white text-[#5C6660] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#9AA89F]'
                  }`}
                >
                  <div className="text-xs font-bold">Tax Exclusive</div>
                  <div className="mt-0.5 text-[11px] opacity-80">
                    Net cost entered. Tax is added on top (+20%).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPricesEnteredAs('inclusive')}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    pricesEnteredAs === 'inclusive'
                      ? 'border-[#14532D] bg-[#14532D]/5 font-semibold text-[#14532D] dark:border-[#22C55E] dark:bg-[#22C55E]/10 dark:text-[#22C55E]'
                      : 'border-[#D5D0C6] bg-white text-[#5C6660] hover:bg-[#FAF8F5] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#9AA89F]'
                  }`}
                >
                  <div className="text-xs font-bold">Tax Inclusive</div>
                  <div className="mt-0.5 text-[11px] opacity-80">
                    Gross cost entered. Tax extracted by 1.20 factor.
                  </div>
                </button>
              </div>
            </div>

            {/* VAT Registration Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                    Business VAT Registration Status
                  </span>
                  <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F] mt-0.5">
                    If unchecked, the restaurant is not registered and all purchase tax will be treated as 0.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVatRegistered(!isVatRegistered)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isVatRegistered ? 'bg-[#14532D] dark:bg-[#16A34A]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      isVatRegistered ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {!isVatRegistered && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  ⚠️ Notice: Non-VAT registered status active. Input tax will not be claimed or calculated on delivery entries.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Taxpayer Information for GRA Returns */}
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <span>GRA Taxpayer Profile & Registration</span>
          </h2>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            These details populate the official monthly GRA VAT, NHIL and GETFund returns.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                Registered Taxpayer Business Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. StockLine Restaurant Ltd"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                GRA Tax Identification Number (TIN) *
              </label>
              <input
                type="text"
                required
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="e.g. C002847192X"
                className="mt-1 w-full font-mono uppercase rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2E3833] dark:text-[#C8D4CC]">
                Reason for Change / Audit Note (Logged in History)
              </label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Updating statutory rates pursuant to GRA Act 1151 compliance directive."
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-[#E4E0D8] pt-4 dark:border-[#223028]">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#14532D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-50 transition-colors shadow-sm dark:bg-[#16A34A]"
            >
              {saving ? 'Saving Statutory Settings...' : 'Save & Apply Tax Configuration'}
            </button>
          </div>
        </div>
      </form>

      {/* Tax Settings Change History Log */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] p-5 dark:border-[#223028]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <h2 className="font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
              Tax Configuration Audit Log (`taxSettingsHistory`)
            </h2>
          </div>
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
            {history.length} {history.length === 1 ? 'change logged' : 'changes logged'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Changed By</th>
                <th className="px-4 py-3 font-semibold">VAT / NHIL / GETFund</th>
                <th className="px-4 py-3 font-semibold">Pricing Mode</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Audit Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C]">
                  <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-[#5C6660] dark:text-[#9AA89F]">
                    {formatDateTimeShort(h.changedAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                    {h.changedBy.userName}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-[#14532D] dark:text-[#22C55E]">
                    {h.settings.vatRate}% + {h.settings.nhilRate}% + {h.settings.getfundRate}%
                  </td>
                  <td className="px-4 py-3 capitalize text-[#5C6660] dark:text-[#9AA89F]">
                    {h.settings.pricesEnteredAs}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        h.settings.isVatRegistered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {h.settings.isVatRegistered ? 'Registered' : 'Exempt/No-VAT'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#5C6660] dark:text-[#9AA89F] max-w-xs truncate">
                    {h.note || 'Regular tax settings update'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
