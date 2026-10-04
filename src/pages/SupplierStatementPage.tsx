import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Printer,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Purchase, Supplier, SupplierPayment } from '../types/stock';
import { formatDateShort, formatGhs } from '../utils/formatters';

interface SupplierStatementPageProps {
  supplier: Supplier | null;
  purchases: Purchase[];
  payments: SupplierPayment[];
  onBack: () => void;
}

interface StatementEntry {
  id: string;
  date: string;
  type: 'delivery' | 'payment';
  reference: string;
  description: string;
  debit: number; // Delivery adds to what restaurant owes
  credit: number; // Payment reduces what restaurant owes
  runningBalance: number;
}

export const SupplierStatementPage: React.FC<SupplierStatementPageProps> = ({
  supplier,
  purchases,
  payments,
  onBack,
}) => {
  const statementEntries: StatementEntry[] = useMemo(() => {
    if (!supplier) return [];

    const supPurchases = purchases.filter((p) => p.supplierId === supplier.id);
    const supPayments = payments.filter((p) => p.supplierId === supplier.id);

    // Merge transactions into chronological order
    const rawEvents: {
      id: string;
      date: string;
      type: 'delivery' | 'payment';
      reference: string;
      description: string;
      amount: number;
    }[] = [];

    for (const p of supPurchases) {
      rawEvents.push({
        id: p.id,
        date: p.dateSupplied,
        type: 'delivery',
        reference: p.purchaseNumber,
        description: `Food Delivery Receipt${
          p.invoiceNumber ? ` (Inv: ${p.invoiceNumber})` : ''
        } · ${p.lines.length} items`,
        amount: Number(p.totalWithTax ?? p.subtotal) || 0,
      });
    }

    for (const pay of supPayments) {
      rawEvents.push({
        id: pay.id,
        date: pay.paidOn,
        type: 'payment',
        reference: pay.reference,
        description: `Payment via ${pay.method.toUpperCase()} for ${
          pay.purchaseNumber || 'Order'
        }${pay.note ? ` (${pay.note})` : ''}`,
        amount: Number(pay.amount) || 0,
      });
    }

    // Sort chronologically ascending
    rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = 0;
    const computed: StatementEntry[] = [];

    for (const ev of rawEvents) {
      if (ev.type === 'delivery') {
        currentBalance += ev.amount;
        computed.push({
          id: ev.id,
          date: ev.date,
          type: 'delivery',
          reference: ev.reference,
          description: ev.description,
          debit: ev.amount,
          credit: 0,
          runningBalance: Math.round(currentBalance * 100) / 100,
        });
      } else {
        currentBalance -= ev.amount;
        computed.push({
          id: ev.id,
          date: ev.date,
          type: 'payment',
          reference: ev.reference,
          description: ev.description,
          debit: 0,
          credit: ev.amount,
          runningBalance: Math.round(currentBalance * 100) / 100,
        });
      }
    }

    return computed;
  }, [supplier, purchases, payments]);

  if (!supplier) {
    return (
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
        <p className="font-semibold text-sm text-[#181D1A] dark:text-[#ECF2EE]">
          Supplier not found.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white"
        >
          Return
        </button>
      </div>
    );
  }

  const totalDebits = statementEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = statementEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance = Math.round((totalDebits - totalCredits) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Non-printable Screen Controls */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Supplier Ledger</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] shadow-xs dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
        >
          <Printer className="h-4 w-4" />
          <span>Print Statement of Account</span>
        </button>
      </div>

      {/* Printable Document Container */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0 dark:border-[#223028] dark:bg-[#131C17]">
        {/* Statement Header */}
        <div className="border-b border-[#E4E0D8] pb-6 dark:border-[#223028]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14532D] text-white font-bold text-sm">
                  SL
                </span>
                <span className="font-display text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
                  StockLine Ghana Ltd
                </span>
              </div>
              <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Restaurant Kitchen & Bar Stock Operations
              </p>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Airport Residential Area, Accra, Ghana
              </p>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Phone: +233 30 200 1234 · accounts@stockline.gh
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block rounded-md bg-[#FAF8F5] px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[#14532D] border border-[#E4E0D8] dark:bg-[#0D1310] dark:border-[#28382F] dark:text-[#22C55E]">
                Statement of Account
              </span>
              <p className="mt-2 text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Date Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Currency: <strong className="text-[#181D1A] dark:text-[#ECF2EE]">Ghana Cedi (GH₵)</strong>
              </p>
            </div>
          </div>

          {/* Supplier Info Block */}
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-[#FAF8F5] p-4 sm:grid-cols-2 dark:bg-[#0D1310]">
            <div>
              <span className="text-[10px] font-semibold uppercase text-[#5C6660] tracking-wider dark:text-[#9AA89F]">
                Vendor / Supplier
              </span>
              <h2 className="mt-1 font-display text-base font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                {supplier.name}
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Attn: {supplier.contactPerson}
              </p>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                {supplier.address}
              </p>
              <p className="font-mono text-xs text-[#181D1A] dark:text-[#ECF2EE]">
                Tel: {supplier.phone}
              </p>
            </div>

            <div className="sm:text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#5C6660] tracking-wider dark:text-[#9AA89F]">
                  Tax Profile
                </span>
                <p className="mt-1 font-mono text-xs font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                  TIN: {supplier.tin}
                </p>
                <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Vendor Ref: {supplier.id}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-[#E4E0D8] dark:border-[#223028]">
                <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Current Outstanding Balance:
                </span>
                <div className="font-mono text-lg font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                  {formatGhs(closingBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Summary Stats */}
        <div className="my-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-[#E4E0D8] p-3 dark:border-[#223028]">
            <span className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Total Deliveries (Debits)
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-[#181D1A] dark:text-[#ECF2EE]">
              {formatGhs(totalDebits)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E4E0D8] p-3 dark:border-[#223028]">
            <span className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
              Total Paid (Credits)
            </span>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {formatGhs(totalCredits)}
            </div>
          </div>
          <div className="rounded-lg border border-[#E4E0D8] p-3 bg-[#FAF8F5] dark:border-[#223028] dark:bg-[#0D1310]">
            <span className="text-[11px] font-semibold text-[#5C6660] dark:text-[#9AA89F]">
              Net Balance Due
            </span>
            <div
              className={`mt-1 font-mono text-sm font-bold ${
                closingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatGhs(closingBalance)}
            </div>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#E4E0D8] dark:border-[#223028]">
            <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#2E3833] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#C8D4CC]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Reference</th>
                <th className="px-3 py-2.5 font-semibold">Transaction Details</th>
                <th className="px-3 py-2.5 font-semibold text-right">Debit (+GH₵)</th>
                <th className="px-3 py-2.5 font-semibold text-right">Credit (-GH₵)</th>
                <th className="px-3 py-2.5 font-semibold text-right">Balance (GH₵)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {statementEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#5C6660]">
                    No deliveries or payment transactions recorded for this supplier.
                  </td>
                </tr>
              ) : (
                statementEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C]"
                  >
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                      {formatDateShort(entry.date)}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium whitespace-nowrap text-[#181D1A] dark:text-[#ECF2EE]">
                      {entry.reference}
                    </td>
                    <td className="px-3 py-2.5 text-[#2E3833] dark:text-[#C8D4CC]">
                      {entry.description}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {entry.debit > 0 ? (
                        <span className="text-[#181D1A] dark:text-[#ECF2EE] font-medium">
                          {formatGhs(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-[#8C9690]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {entry.credit > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {formatGhs(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-[#8C9690]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          entry.runningBalance > 0
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }
                      >
                        {formatGhs(entry.runningBalance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t-2 border-[#181D1A] bg-[#FAF8F5] font-semibold dark:border-[#ECF2EE] dark:bg-[#0D1310]">
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right text-xs uppercase tracking-wider">
                  Closing Ledger Balance:
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-xs">
                  {formatGhs(totalDebits)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-xs text-emerald-700 dark:text-emerald-400">
                  {formatGhs(totalCredits)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm font-bold tabular-nums">
                  {formatGhs(closingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statement Footer */}
        <div className="mt-8 border-t border-[#E4E0D8] pt-6 text-xs text-[#5C6660] dark:border-[#223028] dark:text-[#9AA89F] flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Payment Instructions
            </p>
            <p className="mt-0.5">Mobile Money: MTN Merchant ID 847291 (StockLine Ops)</p>
            <p>Bank: GCB Bank Ghana, High Street Branch · Account No. 1029384721</p>
          </div>

          <div className="sm:text-right">
            <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              Authorized Storekeeper & Accounts
            </p>
            <p className="mt-4 border-t border-dashed border-[#5C6660] pt-1">
              Signature & Official Stamp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
