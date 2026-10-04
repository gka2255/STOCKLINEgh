import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit2,
  FileText,
  CreditCard,
  Truck,
  RotateCcw,
  Power,
} from 'lucide-react';
import {
  AppUser,
  EnrichedSupplier,
  Purchase,
  Supplier,
  SupplierPayment,
} from '../types/stock';
import { enrichSuppliers, updateSupplier } from '../services/stockService';
import { formatDateShort, formatGhs } from '../utils/formatters';

interface SuppliersPageProps {
  currentUser: AppUser;
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: SupplierPayment[];
  onSelectSupplierDetail: (supplierId: string) => void;
  onSelectSupplierStatement: (supplierId: string) => void;
  onOpenAddSupplierModal: () => void;
  onOpenEditSupplierModal: (supplier: Supplier) => void;
  onOpenRecordDeliveryModal: (supplierId?: string) => void;
  onOpenRecordPaymentModal: (supplierId?: string) => void;
  onShowToast: (msg: string) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({
  currentUser,
  suppliers,
  purchases,
  payments,
  onSelectSupplierDetail,
  onSelectSupplierStatement,
  onOpenAddSupplierModal,
  onOpenEditSupplierModal,
  onOpenRecordDeliveryModal,
  onOpenRecordPaymentModal,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [arrearsOnly, setArrearsOnly] = useState(false);

  // Compute enriched supplier metrics
  const enrichedList: EnrichedSupplier[] = useMemo(() => {
    return enrichSuppliers(suppliers, purchases, payments);
  }, [suppliers, purchases, payments]);

  // Total summary metrics
  const totalArrearsAll = enrichedList.reduce((sum, s) => sum + s.totalArrearsGhs, 0);
  const activeCount = enrichedList.filter((s) => s.isActive).length;
  const suppliersWithArrearsCount = enrichedList.filter((s) => s.totalArrearsGhs > 0).length;

  const filteredSuppliers = useMemo(() => {
    return enrichedList.filter((s) => {
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      if (arrearsOnly && s.totalArrearsGhs <= 0) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(term) ||
        s.contactPerson.toLowerCase().includes(term) ||
        s.phone.toLowerCase().includes(term) ||
        s.tin.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term)
      );
    });
  }, [enrichedList, searchTerm, statusFilter, arrearsOnly]);

  const handleToggleActive = async (sup: EnrichedSupplier) => {
    const nextState = !sup.isActive;
    try {
      await updateSupplier(currentUser, sup.id, { isActive: nextState });
      onShowToast(
        `Supplier "${sup.name}" ${nextState ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not change supplier status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Suppliers & Vendor Accounts
          </h1>
          <p className="mt-1 text-sm text-[#5C6660] dark:text-[#9AA89F]">
            Manage food vendors, delivery accounts, Ghana TIN tax profiles, and outstanding arrears
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenRecordDeliveryModal()}
            className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] transition-colors whitespace-nowrap dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
          >
            <Truck className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
            <span>Record Delivery</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddSupplierModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Suppliers Registered
            </span>
            <Building2 className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              {suppliers.length}
            </span>
            <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              ({activeCount} Active)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Total Outstanding Arrears Owed
            </span>
            <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {formatGhs(totalArrearsAll)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E0D8] bg-white p-5 shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
              Suppliers with Open Balance
            </span>
            <FileText className="h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
              {suppliersWithArrearsCount}
            </span>
            <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
              vendors with arrears
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E4E0D8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#223028] dark:bg-[#131C17]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5C6660] dark:text-[#9AA89F]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers by business name, contact, phone, or TIN..."
            className="w-full rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-[#181D1A] placeholder-[#5C6660] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:placeholder-[#9AA89F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-lg border border-[#D5D0C6] bg-[#FAF8F5] p-0.5 dark:border-[#28382F] dark:bg-[#0D1310]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#181D1A] shadow-xs dark:bg-[#1C2822] dark:text-[#ECF2EE]'
                  : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F]'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-[#181D1A] shadow-xs dark:bg-[#1C2822] dark:text-[#ECF2EE]'
                  : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F]'
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-white text-[#181D1A] shadow-xs dark:bg-[#1C2822] dark:text-[#ECF2EE]'
                  : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F]'
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            type="button"
            onClick={() => setArrearsOnly(!arrearsOnly)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              arrearsOnly
                ? 'border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 font-semibold'
                : 'border-[#D5D0C6] bg-white text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]'
            }`}
          >
            {arrearsOnly ? '✓ Arrears Only' : 'Filter: Has Arrears'}
          </button>

          {(searchTerm || statusFilter !== 'ALL' || arrearsOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setArrearsOnly(false);
              }}
              className="inline-flex items-center gap-1 text-xs text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="rounded-xl border border-[#E4E0D8] bg-white p-12 text-center dark:border-[#223028] dark:bg-[#131C17]">
          <Building2 className="mx-auto h-8 w-8 text-[#5C6660] dark:text-[#9AA89F]" />
          <p className="mt-3 font-display text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            No suppliers found
          </p>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Try adjusting your search criteria or register a new supplier.
          </p>
          <button
            type="button"
            onClick={onOpenAddSupplierModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier Profile</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] uppercase tracking-wider dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Supplier & Contact</th>
                  <th className="px-4 py-3.5 font-semibold">Phone / TIN</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Total Supplied</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Total Owed (Arrears)</th>
                  <th className="px-4 py-3.5 font-semibold">Last Delivery</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                {filteredSuppliers.map((sup) => {
                  const hasArrears = sup.totalArrearsGhs > 0;
                  return (
                    <tr
                      key={sup.id}
                      className="hover:bg-[#FAF8F5] transition-colors dark:hover:bg-[#17221C]"
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectSupplierDetail(sup.id)}
                          className="text-left group focus:outline-none"
                        >
                          <div className="font-semibold text-[#181D1A] group-hover:text-[#14532D] dark:text-[#ECF2EE] dark:group-hover:text-[#22C55E]">
                            {sup.name}
                          </div>
                          <div className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                            Contact: {sup.contactPerson}
                          </div>
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#181D1A] dark:text-[#ECF2EE]">
                          <Phone className="h-3 w-3 text-[#5C6660] dark:text-[#9AA89F]" />
                          <span>{sup.phone}</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                          TIN: {sup.tin}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                        {formatGhs(sup.totalSuppliedGhs)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold tabular-nums">
                        {hasArrears ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            {formatGhs(sup.totalArrearsGhs)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-normal">
                            GH₵ 0.00
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateShort(sup.lastDeliveryDate)}</span>
                        </div>
                        <div className="text-[10px] text-[#8C9690]">
                          {sup.deliveryCount} {sup.deliveryCount === 1 ? 'delivery' : 'deliveries'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            sup.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sup.isActive ? 'bg-emerald-600' : 'bg-gray-400'
                            }`}
                          />
                          {sup.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasArrears && (
                            <button
                              type="button"
                              onClick={() => onOpenRecordPaymentModal(sup.id)}
                              className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                              title="Record payment towards arrears"
                            >
                              Pay
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectSupplierDetail(sup.id)}
                            className="rounded-md border border-[#D5D0C6] bg-white px-2 py-1 text-[11px] font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
                            title="View Supplier Profile & Ledger"
                          >
                            Ledger
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectSupplierStatement(sup.id)}
                            className="rounded-md p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
                            title="Printable Statement of Account"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditSupplierModal(sup)}
                            className="rounded-md p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
                            title="Edit Supplier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(sup)}
                            className={`rounded-md p-1 ${
                              sup.isActive
                                ? 'text-gray-400 hover:text-red-600'
                                : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                            title={sup.isActive ? 'Deactivate Supplier' : 'Activate Supplier'}
                          >
                            <Power className="h-4 w-4" />
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
