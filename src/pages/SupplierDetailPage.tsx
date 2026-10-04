import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Edit2,
} from 'lucide-react';
import {
  AppUser,
  Purchase,
  Supplier,
  SupplierPayment,
} from '../types/stock';
import { formatDateShort, formatDateTimeShort, formatGhs } from '../utils/formatters';

interface SupplierDetailPageProps {
  currentUser: AppUser;
  supplier: Supplier | null;
  purchases: Purchase[];
  payments: SupplierPayment[];
  onBack: () => void;
  onOpenEditModal: (supplier: Supplier) => void;
  onOpenRecordDeliveryModal: (supplierId: string) => void;
  onOpenRecordPaymentModal: (supplierId: string, purchase?: Purchase) => void;
  onNavigateToStatement: (supplierId: string) => void;
  onShowToast: (msg: string) => void;
}

export const SupplierDetailPage: React.FC<SupplierDetailPageProps> = ({
  currentUser,
  supplier,
  purchases,
  payments,
  onBack,
  onOpenEditModal,
  onOpenRecordDeliveryModal,
  onOpenRecordPaymentModal,
  onNavigateToStatement,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'payments'>('deliveries');

  if (!supplier) {
    return (
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
        <Building2 className="mx-auto h-8 w-8 text-[#5C6660] dark:text-[#9AA89F]" />
        <p className="mt-3 font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
          Supplier Record Not Found
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Suppliers Directory</span>
        </button>
      </div>
    );
  }

  // Filter deliveries and payments for this specific supplier
  const supplierPurchases = purchases
    .filter((p) => p.supplierId === supplier.id)
    .sort((a, b) => new Date(b.dateSupplied).getTime() - new Date(a.dateSupplied).getTime());

  const supplierPayments = payments
    .filter((p) => p.supplierId === supplier.id)
    .sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());

  // Aggregate stats
  const totalSupplied = supplierPurchases.reduce((sum, p) => sum + (Number(p.totalWithTax ?? p.subtotal) || 0), 0);
  const totalPaid = supplierPurchases.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const totalArrears = supplierPurchases.reduce((sum, p) => sum + (Number(p.arrears) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Suppliers Directory</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateToStatement(supplier.id)}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Printer className="h-4 w-4" />
            <span>Print Statement</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEditModal(supplier)}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>

          {totalArrears > 0 && (
            <button
              type="button"
              onClick={() => onOpenRecordPaymentModal(supplier.id)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <CreditCard className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenRecordDeliveryModal(supplier.id)}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <Plus className="h-4 w-4" />
            <span>Receive Delivery</span>
          </button>
        </div>
      </div>

      {/* Supplier Profile Card */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white p-6 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
                {supplier.name}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  supplier.isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {supplier.isActive ? 'Active Vendor' : 'Deactivated'}
              </span>
            </div>
            <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              Primary Contact:{' '}
              <strong className="text-[#181D1A] dark:text-[#ECF2EE]">
                {supplier.contactPerson}
              </strong>
            </p>
          </div>

          <div className="font-mono text-xs text-[#5C6660] dark:text-[#9AA89F] rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-2.5 dark:border-[#28382F] dark:bg-[#0D1310]">
            <div>Tax ID (TIN): <span className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">{supplier.tin}</span></div>
            <div className="mt-0.5 text-[11px]">Vendor Code: {supplier.id}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E4E0D8] pt-4 sm:grid-cols-3 dark:border-[#223028]">
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
            <a
              href={`tel:${supplier.phone}`}
              className="font-mono text-[#14532D] hover:underline dark:text-[#22C55E]"
            >
              {supplier.phone}
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
            {supplier.email ? (
              <a
                href={`mailto:${supplier.email}`}
                className="text-[#14532D] hover:underline dark:text-[#22C55E]"
              >
                {supplier.email}
              </a>
            ) : (
              <span className="text-[#8C9690]">No email recorded</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
            <span className="text-[#181D1A] dark:text-[#ECF2EE] truncate">
              {supplier.address || 'Address unlisted'}
            </span>
          </div>
        </div>

        {supplier.notes && (
          <div className="mt-3 rounded-lg bg-[#FAF8F5] p-3 text-xs text-[#5C6660] dark:bg-[#0D1310] dark:text-[#9AA89F]">
            <strong className="text-[#181D1A] dark:text-[#ECF2EE]">Vendor Notes: </strong>
            {supplier.notes}
          </div>
        )}
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Value Supplied
            </span>
            <Truck className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            {formatGhs(totalSupplied)}
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Across {supplierPurchases.length} recorded delivery receipts
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Amount Paid
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {formatGhs(totalPaid)}
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            Settled via Cash, Cheque & MoMo
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Current Outstanding Arrears
            </span>
            <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
            {formatGhs(totalArrears)}
          </div>
          <div className="mt-1 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
            {totalArrears > 0 ? 'Pending payment settlement' : 'Account is fully settled'}
          </div>
        </div>
      </div>

      {/* Tabs: Delivery History vs Payment History */}
      <div className="rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="flex border-b border-[#E4E0D8] px-4 pt-3 dark:border-[#223028]">
          <button
            type="button"
            onClick={() => setActiveTab('deliveries')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'deliveries'
                ? 'border-[#14532D] text-[#14532D] dark:border-[#22C55E] dark:text-[#22C55E]'
                : 'border-transparent text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F]'
            }`}
          >
            Delivery Invoices ({supplierPurchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'payments'
                ? 'border-[#14532D] text-[#14532D] dark:border-[#22C55E] dark:text-[#22C55E]'
                : 'border-transparent text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F]'
            }`}
          >
            Payment Receipts ({supplierPayments.length})
          </button>
        </div>

        {/* Tab 1: Deliveries */}
        {activeTab === 'deliveries' && (
          <div className="p-4">
            {supplierPurchases.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                No delivery receipts logged for this supplier yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
                    <tr>
                      <th className="px-3.5 py-3 font-semibold">Purchase #</th>
                      <th className="px-3.5 py-3 font-semibold">Date Supplied</th>
                      <th className="px-3.5 py-3 font-semibold">Due Date</th>
                      <th className="px-3.5 py-3 font-semibold">Invoice Ref</th>
                      <th className="px-3.5 py-3 font-semibold">Items</th>
                      <th className="px-3.5 py-3 font-semibold text-right">Subtotal</th>
                      <th className="px-3.5 py-3 font-semibold text-right">Paid</th>
                      <th className="px-3.5 py-3 font-semibold text-right">Arrears</th>
                      <th className="px-3.5 py-3 font-semibold">Status</th>
                      <th className="px-3.5 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                    {supplierPurchases.map((pur) => {
                      const isOverdue =
                        pur.arrears > 0 &&
                        new Date(pur.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                      return (
                        <tr
                          key={pur.id}
                          className={`hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C] ${
                            isOverdue ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                          }`}
                        >
                          <td className="px-3.5 py-3 font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                            {pur.purchaseNumber}
                          </td>
                          <td className="px-3.5 py-3">{formatDateShort(pur.dateSupplied)}</td>
                          <td className="px-3.5 py-3 font-mono">
                            <span className={isOverdue ? 'text-red-700 font-bold dark:text-red-400' : ''}>
                              {formatDateShort(pur.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="block text-[10px] text-red-600 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[11px]">
                            {pur.invoiceNumber || '—'}
                          </td>
                          <td className="px-3.5 py-3">
                            {pur.lines.length} {pur.lines.length === 1 ? 'item' : 'items'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono font-medium tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                            {formatGhs(pur.subtotal)}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                            {formatGhs(pur.amountPaid)}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono font-bold tabular-nums">
                            {pur.arrears > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400">
                                {formatGhs(pur.arrears)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 font-normal">
                                GH₵ 0.00
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                pur.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : pur.paymentStatus === 'partial'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              }`}
                            >
                              {pur.paymentStatus}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            {pur.arrears > 0 ? (
                              <button
                                type="button"
                                onClick={() => onOpenRecordPaymentModal(supplier.id, pur)}
                                className="rounded-md border border-[#14532D] bg-[#14532D] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#166534] dark:border-[#16A34A] dark:bg-[#16A34A]"
                              >
                                Settle
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium dark:text-emerald-400">
                                Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="p-4">
            {supplierPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                No payment receipts logged for this supplier yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
                    <tr>
                      <th className="px-3.5 py-3 font-semibold">Date Paid</th>
                      <th className="px-3.5 py-3 font-semibold">Towards Purchase</th>
                      <th className="px-3.5 py-3 font-semibold">Method</th>
                      <th className="px-3.5 py-3 font-semibold">Reference</th>
                      <th className="px-3.5 py-3 font-semibold">Recorded By</th>
                      <th className="px-3.5 py-3 font-semibold">Notes</th>
                      <th className="px-3.5 py-3 font-semibold text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                    {supplierPayments.map((pay) => (
                      <tr
                        key={pay.id}
                        className="hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C]"
                      >
                        <td className="px-3.5 py-3">{formatDateShort(pay.paidOn)}</td>
                        <td className="px-3.5 py-3 font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                          {pay.purchaseNumber || 'PUR-Ledger'}
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              pay.method === 'momo'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : pay.method === 'cheque'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {pay.method}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px] text-[#181D1A] dark:text-[#ECF2EE]">
                          {pay.reference}
                        </td>
                        <td className="px-3.5 py-3 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                          {pay.recordedBy.userName}
                        </td>
                        <td className="px-3.5 py-3 text-[11px] text-[#5C6660] dark:text-[#9AA89F] max-w-xs truncate">
                          {pay.note || '—'}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {formatGhs(pay.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
