import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Receipt,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  PaymentMethod,
  Purchase,
  StockUnit,
  Supplier,
  TaxCategory,
} from '../types/stock';
import {
  createSupplier,
  updateSupplier,
  recordPurchaseDeliveryTransaction,
  recordSupplierPaymentTransaction,
  getTaxSettings,
} from '../services/stockService';
import { formatGhs, validateGhanaPhone, validateGhanaTin } from '../utils/formatters';

// ==========================================
// 1. ADD / EDIT SUPPLIER MODAL
// ==========================================

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  editingSupplier?: Supplier | null;
  onSuccess: (message: string) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  actor,
  editingSupplier,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tin, setTin] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name);
      setContactPerson(editingSupplier.contactPerson);
      setPhone(editingSupplier.phone);
      setEmail(editingSupplier.email || '');
      setAddress(editingSupplier.address);
      setTin(editingSupplier.tin);
      setNotes(editingSupplier.notes || '');
      setIsActive(editingSupplier.isActive);
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTin('');
      setNotes('');
      setIsActive(true);
    }
    setError(null);
  }, [editingSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanContact = contactPerson.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanTin = tin.trim().toUpperCase();

    if (cleanName.length < 2) {
      setError('Supplier name must be at least 2 characters.');
      return;
    }
    if (cleanContact.length < 2) {
      setError('Contact person name must be at least 2 characters.');
      return;
    }
    if (!validateGhanaPhone(cleanPhone)) {
      setError('Please enter a valid Ghana phone number (e.g. 024 XXX XXXX or +233 24 XXX XXXX).');
      return;
    }
    if (!validateGhanaTin(cleanTin)) {
      setError('Please enter a valid Tax Identification Number (TIN) (8-15 characters).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier(actor, editingSupplier.id, {
          name: cleanName,
          contactPerson: cleanContact,
          phone: cleanPhone,
          email: email.trim() || null,
          address: cleanAddress,
          tin: cleanTin,
          notes: notes.trim(),
          isActive,
        });
        onSuccess(`Supplier "${cleanName}" updated successfully.`);
      } else {
        await createSupplier(actor, {
          name: cleanName,
          contactPerson: cleanContact,
          phone: cleanPhone,
          email: email.trim() || null,
          address: cleanAddress,
          tin: cleanTin,
          notes: notes.trim(),
        });
        onSuccess(`Supplier "${cleanName}" registered successfully.`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-2xl transition-all my-8 dark:border-[#28382F] dark:bg-[#111915]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#16A34A]/20 dark:text-[#22C55E]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                {editingSupplier ? 'Edit Supplier Profile' : 'Register New Food Supplier'}
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Ghana supplier ledger profile & tax identification details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Supplier Business Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tema Food Distributors Ltd"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Samuel Annan"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Phone Number (Ghana format) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="024 123 4567 or +233..."
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Tax ID Number (TIN) *
              </label>
              <input
                type="text"
                required
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="e.g. C002948192X"
                className="mt-1 w-full uppercase font-mono rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@supplier.gh"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Physical Address / Delivery Depot
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Warehouse Block 4, Heavy Industrial Area, Tema"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Notes / Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard 14-day credit terms, accepts MTN MoMo and GCB Bank cheques."
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            {editingSupplier && (
              <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-[#E4E0D8] bg-white p-3 dark:border-[#223028] dark:bg-[#0D1310]">
                <div>
                  <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                    Supplier Account Status
                  </span>
                  <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                    Deactivated suppliers cannot be chosen for new deliveries. Never hard deleted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-[#14532D] dark:bg-[#16A34A]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
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
              {submitting
                ? 'Saving...'
                : editingSupplier
                ? 'Update Supplier'
                : 'Save Supplier Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. RECORD DELIVERY / PURCHASE MODAL
// ==========================================

interface RecordDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  suppliers: Supplier[];
  items: EnrichedStockItem[];
  preselectedSupplierId?: string | null;
  onSuccess: (message: string) => void;
}

interface DeliveryLineState {
  itemId: string;
  quantity: string;
  costPerUnit: string;
  expiryDate: string;
  taxCategory?: TaxCategory;
}

export const RecordDeliveryModal: React.FC<RecordDeliveryModalProps> = ({
  isOpen,
  onClose,
  actor,
  suppliers,
  items,
  preselectedSupplierId,
  onSuccess,
}) => {
  const activeSuppliers = suppliers.filter((s) => s.isActive);
  const activeItems = items.filter((i) => i.isActive);
  const taxSettings = getTaxSettings();

  const [supplierId, setSupplierId] = useState(preselectedSupplierId || activeSuppliers[0]?.id || '');
  const [dateSupplied, setDateSupplied] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 14-day credit term
    return d.toISOString().split('T')[0];
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [lines, setLines] = useState<DeliveryLineState[]>(() => [
    {
      itemId: activeItems[0]?.id || '',
      quantity: '10',
      costPerUnit: '25',
      expiryDate: '',
      taxCategory: activeItems[0]?.taxCategory || 'standard',
    },
  ]);

  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentReference, setPaymentReference] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedSupplierId) {
      setSupplierId(preselectedSupplierId);
    } else if (activeSuppliers.length > 0 && !supplierId) {
      setSupplierId(activeSuppliers[0].id);
    }
  }, [preselectedSupplierId, activeSuppliers]);

  if (!isOpen) return null;

  // Running calculations with Ghana VAT Act 2025 (Act 1151) rules
  let runningSubtotal = 0;
  let runningTaxable = 0;
  let runningVat = 0;
  let runningNhil = 0;
  let runningGetfund = 0;

  const isVatRegistered = taxSettings.isVatRegistered;
  const isExclusive = taxSettings.pricesEnteredAs === 'exclusive';

  const calculatedLines = lines.map((l) => {
    const q = Number(l.quantity) || 0;
    const c = Number(l.costPerUnit) || 0;
    const itm = items.find((i) => i.id === l.itemId);
    const cat: TaxCategory = l.taxCategory || itm?.taxCategory || 'standard';
    const lineTotal = Math.round(q * c * 100) / 100;
    runningSubtotal += lineTotal;

    let lineTaxable = 0;
    let lineVat = 0;
    let lineNhil = 0;
    let lineGetfund = 0;

    if (cat === 'standard' && isVatRegistered) {
      if (isExclusive) {
        lineTaxable = lineTotal;
      } else {
        lineTaxable = Math.round((lineTotal / 1.20) * 100) / 100;
      }
      lineVat = Math.round(lineTaxable * (taxSettings.vatRate / 100) * 100) / 100;
      lineNhil = Math.round(lineTaxable * (taxSettings.nhilRate / 100) * 100) / 100;
      lineGetfund = Math.round(lineTaxable * (taxSettings.getfundRate / 100) * 100) / 100;

      runningTaxable += lineTaxable;
      runningVat += lineVat;
      runningNhil += lineNhil;
      runningGetfund += lineGetfund;
    } else {
      lineTaxable = lineTotal;
    }

    return {
      ...l,
      itemName: itm?.name || 'Item',
      unit: itm?.unit || 'kg',
      taxCategory: cat,
      lineTotal,
      taxableAmount: lineTaxable,
      vatAmount: lineVat,
      nhilAmount: lineNhil,
      getfundAmount: lineGetfund,
    };
  });

  const subtotal = Math.round(runningSubtotal * 100) / 100;
  const totalTax = Math.round((runningVat + runningNhil + runningGetfund) * 100) / 100;
  const totalWithTax = isExclusive ? Math.round((subtotal + totalTax) * 100) / 100 : subtotal;
  const parsedPaid = Number(amountPaid) || 0;
  const arrears = Math.max(0, Math.round((totalWithTax - parsedPaid) * 100) / 100);

  const handleAddLine = () => {
    const firstItm = activeItems[0];
    setLines((prev) => [
      ...prev,
      {
        itemId: firstItm?.id || '',
        quantity: '5',
        costPerUnit: '20',
        expiryDate: '',
        taxCategory: firstItm?.taxCategory || 'standard',
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (
    index: number,
    field: keyof DeliveryLineState,
    val: string
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      if (field === 'itemId') {
        const matchingItm = items.find((i) => i.id === val);
        copy[index] = {
          ...copy[index],
          itemId: val,
          taxCategory: matchingItm?.taxCategory || 'standard',
        };
      } else {
        copy[index] = { ...copy[index], [field]: val };
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) {
      setError('Please select a valid registered supplier.');
      return;
    }

    if (lines.length === 0) {
      setError('At least one item line is required.');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const q = Number(l.quantity);
      const c = Number(l.costPerUnit);
      if (isNaN(q) || q <= 0) {
        setError(`Line ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
      if (isNaN(c) || c < 0) {
        setError(`Line ${i + 1}: Cost per unit must be 0 or positive.`);
        return;
      }
    }

    if (parsedPaid > totalWithTax) {
      setError(`Amount paid (${formatGhs(parsedPaid)}) cannot exceed total with tax (${formatGhs(totalWithTax)}).`);
      return;
    }

    if (parsedPaid > 0 && !paymentMethod) {
      setError('Please select a payment method for the initial payment amount.');
      return;
    }

    if (parsedPaid > 0 && paymentMethod === 'cheque' && !paymentReference.trim()) {
      setError('Cheque number is required when payment method is Cheque.');
      return;
    }

    if (parsedPaid > 0 && paymentMethod === 'momo' && !paymentReference.trim()) {
      setError('Mobile Money transaction ID / reference is required for MoMo payments.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordPurchaseDeliveryTransaction(actor, {
        supplierId: sup.id,
        supplierName: sup.name,
        dateSupplied,
        dueDate,
        invoiceNumber: invoiceNumber.trim() || null,
        lines: calculatedLines.map((l) => ({
          itemId: l.itemId,
          itemName: l.itemName,
          unit: l.unit as StockUnit,
          quantity: Number(l.quantity),
          costPerUnit: Number(l.costPerUnit),
          expiryDate: l.expiryDate ? l.expiryDate : null,
          taxCategory: l.taxCategory,
        })),
        amountPaid: parsedPaid,
        paymentMethod: parsedPaid > 0 ? (paymentMethod as PaymentMethod) : null,
        paymentReference: paymentReference.trim(),
      });

      onSuccess(
        `Delivery ${res.purchase.purchaseNumber} recorded! Total with tax: ${formatGhs(
          res.purchase.totalWithTax
        )}. Arrears: ${formatGhs(res.purchase.arrears)}.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record purchase delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-2xl transition-all my-8 dark:border-[#28382F] dark:bg-[#111915]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#16A34A]/20 dark:text-[#22C55E]">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                Record Supplier Delivery & Receive Stock
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Creates purchase record, initialises FIFO stock batches, and updates supplier ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Header Info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              >
                {activeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Date Supplied *
              </label>
              <input
                type="date"
                required
                value={dateSupplied}
                onChange={(e) => setDateSupplied(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Payment Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Supplier Invoice Number (Optional)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-TMA-9120"
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              />
            </div>
          </div>

          {/* Delivery Lines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#181D1A] uppercase tracking-wider dark:text-[#ECF2EE]">
                Stock Delivery Line Items ({lines.length})
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const item = items.find((i) => i.id === line.itemId);
                const lineTotal = (Number(line.quantity) || 0) * (Number(line.costPerUnit) || 0);

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2.5 rounded-lg border border-[#E4E0D8] bg-white p-3 sm:grid-cols-12 sm:items-center dark:border-[#223028] dark:bg-[#0D1310]"
                  >
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-medium text-[#5C6660] dark:text-[#9AA89F] sm:hidden">
                        Item
                      </label>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      >
                        {activeItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            {itm.name} ({itm.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#5C6660] dark:text-[#9AA89F] sm:hidden">
                        Tax Category
                      </label>
                      <select
                        value={line.taxCategory || item?.taxCategory || 'standard'}
                        onChange={(e) => handleLineChange(idx, 'taxCategory', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      >
                        <option value="standard">Standard (20%)</option>
                        <option value="exempt">Exempt (0%)</option>
                        <option value="zero_rated">Zero-Rated (0%)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#5C6660] dark:text-[#9AA89F] sm:hidden">
                        Quantity ({item?.unit || ''})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-[#5C6660] dark:text-[#9AA89F] sm:hidden">
                        Cost/Unit (GH₵)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="GH₵/unit"
                        value={line.costPerUnit}
                        onChange={(e) => handleLineChange(idx, 'costPerUnit', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-medium text-[#5C6660] dark:text-[#9AA89F] sm:hidden">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) => handleLineChange(idx, 'expiryDate', e.target.value)}
                        className="w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-1 py-1.5 text-[11px] text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:col-span-2 sm:justify-end sm:gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[#14532D] dark:text-[#22C55E]">
                        {formatGhs(lineTotal)}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400"
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

          {/* Real-time VAT / Levies Breakdown Box (Act 1151) */}
          <div className="rounded-lg border border-[#14532D]/30 bg-[#14532D]/5 p-4 text-xs dark:border-[#22C55E]/30 dark:bg-[#16A34A]/10">
            <div className="flex items-center justify-between font-semibold text-[#14532D] dark:text-[#22C55E] pb-2 border-b border-[#14532D]/20 dark:border-[#22C55E]/20">
              <span>GRA VAT & Levies Breakdown (Act 1151)</span>
              <span className="font-mono text-[11px] uppercase">
                Prices: {taxSettings.pricesEnteredAs} · {taxSettings.isVatRegistered ? 'VAT Registered' : 'Not Registered'}
              </span>
            </div>

            {!taxSettings.isVatRegistered ? (
              <div className="mt-2 text-amber-700 dark:text-amber-300">
                Notice: Business is marked as not VAT registered in Tax Settings. All taxes are calculated at 0.00.
              </div>
            ) : (
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-6 font-mono text-[11px]">
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">Taxable Net</span>
                  <span className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">{formatGhs(runningTaxable)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">VAT (15%)</span>
                  <span className="font-bold text-[#14532D] dark:text-[#22C55E]">{formatGhs(runningVat)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">NHIL (2.5%)</span>
                  <span className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">{formatGhs(runningNhil)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">GETFund (2.5%)</span>
                  <span className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">{formatGhs(runningGetfund)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">Total Tax (20%)</span>
                  <span className="font-bold text-[#14532D] dark:text-[#22C55E]">{formatGhs(totalTax)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">Total Payable</span>
                  <span className="font-bold text-[#181D1A] dark:text-[#ECF2EE]">{formatGhs(totalWithTax)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subtotal & Initial Payment Box */}
          <div className="rounded-lg border border-[#E4E0D8] bg-white p-4 dark:border-[#223028] dark:bg-[#0D1310]">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3 dark:border-[#223028]">
              <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Total Payable (Including Statutory Tax)
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-[#181D1A] dark:text-[#ECF2EE]">
                {formatGhs(totalWithTax)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Initial Amount Paid (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalWithTax}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 font-mono text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                />
              </div>

              {parsedPaid > 0 && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                      Payment Method *
                    </label>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1 w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                    >
                      <option value="">Select Method</option>
                      <option value="cash">Cash (Immediate Receipt)</option>
                      <option value="cheque">Bank Cheque</option>
                      <option value="momo">Mobile Money (MTN / Telecel / AT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                      {paymentMethod === 'cheque'
                        ? 'Cheque Number *'
                        : paymentMethod === 'momo'
                        ? 'MoMo Transaction ID *'
                        : 'Receipt Reference'}
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === 'cheque' || paymentMethod === 'momo'}
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={
                        paymentMethod === 'cheque'
                          ? 'e.g. GCB-004812'
                          : paymentMethod === 'momo'
                          ? 'e.g. MTN-MM-84729103'
                          : 'Receipt number'
                      }
                      className="mt-1 w-full rounded-md border border-[#D5D0C6] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#ECF2EE]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#E4E0D8] pt-3 text-xs dark:border-[#223028]">
              <span className="font-medium text-[#5C6660] dark:text-[#9AA89F]">
                Resulting Arrears (Balance Owed):
              </span>
              <span
                className={`font-mono text-sm font-bold tabular-nums ${
                  arrears > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {formatGhs(arrears)} {arrears === 0 ? '(Fully Paid)' : '(Outstanding)'}
              </span>
            </div>
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
              {submitting ? 'Recording Delivery & Creating Batches...' : 'Confirm Delivery Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. RECORD PAYMENT MODAL (Settlement)
// ==========================================

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  actor: AppUser;
  purchases: Purchase[];
  suppliers: Supplier[];
  targetPurchase?: Purchase | null;
  targetSupplierId?: string | null;
  onSuccess: (message: string) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  actor,
  purchases,
  suppliers,
  targetPurchase,
  targetSupplierId,
  onSuccess,
}) => {
  // Purchases with outstanding arrears
  const unpaidPurchases = purchases.filter((p) => p.arrears > 0);

  const [selectedPurchaseId, setSelectedPurchaseId] = useState(
    targetPurchase?.id || unpaidPurchases[0]?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('momo');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetPurchase) {
      setSelectedPurchaseId(targetPurchase.id);
      setAmount(String(targetPurchase.arrears));
    } else if (targetSupplierId) {
      const supPurchase = unpaidPurchases.find((p) => p.supplierId === targetSupplierId);
      if (supPurchase) {
        setSelectedPurchaseId(supPurchase.id);
        setAmount(String(supPurchase.arrears));
      }
    } else if (unpaidPurchases.length > 0) {
      setSelectedPurchaseId(unpaidPurchases[0].id);
      setAmount(String(unpaidPurchases[0].arrears));
    }
    setError(null);
  }, [targetPurchase, targetSupplierId, isOpen]);

  if (!isOpen) return null;

  const currentPurchase = purchases.find((p) => p.id === selectedPurchaseId);

  const handlePurchaseChange = (purId: string) => {
    setSelectedPurchaseId(purId);
    const found = purchases.find((p) => p.id === purId);
    if (found) {
      setAmount(String(found.arrears));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPurchase) {
      setError('Please select an active purchase with outstanding arrears.');
      return;
    }

    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (parsedAmount > currentPurchase.arrears) {
      setError(
        `Overpayment blocked: Payment of ${formatGhs(parsedAmount)} exceeds outstanding arrears of ${formatGhs(
          currentPurchase.arrears
        )}.`
      );
      return;
    }

    if (method === 'cheque' && !reference.trim()) {
      setError('Cheque number is required for Cheque payments.');
      return;
    }
    if (method === 'momo' && !reference.trim()) {
      setError('Mobile Money transaction ID / reference is required for MoMo payments.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordSupplierPaymentTransaction(actor, {
        purchaseId: currentPurchase.id,
        amount: parsedAmount,
        method,
        reference: reference.trim(),
        paidOn,
        note: note.trim() || undefined,
      });

      onSuccess(
        `Payment of ${formatGhs(parsedAmount)} recorded towards ${res.payment.purchaseNumber}. Remaining balance: ${formatGhs(
          res.updatedPurchase.arrears
        )}.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record supplier payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-2xl transition-all my-8 dark:border-[#28382F] dark:bg-[#111915]">
        <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-4 dark:border-[#223028]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#14532D]/10 text-[#14532D] dark:bg-[#16A34A]/20 dark:text-[#22C55E]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#181D1A] dark:text-[#ECF2EE]">
                Record Supplier Payment
              </h2>
              <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                Settle arrears towards delivery invoices via Cash, Cheque, or MoMo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {unpaidPurchases.length === 0 ? (
          <div className="mt-6 text-center py-6">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[#14532D] dark:text-[#22C55E]" />
            <p className="mt-2 text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              All Supplier Deliveries Are Fully Paid
            </p>
            <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
              There are no outstanding arrears on record across any deliveries.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#D5D0C6] bg-white px-4 py-2 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                Select Purchase / Invoice to Pay *
              </label>
              <select
                required
                value={selectedPurchaseId}
                onChange={(e) => handlePurchaseChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
              >
                {unpaidPurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.purchaseNumber} — {p.supplierName} (Owed: {formatGhs(p.arrears)} · Due: {p.dueDate})
                  </option>
                ))}
              </select>
            </div>

            {currentPurchase && (
              <div className="rounded-lg border border-[#E4E0D8] bg-white p-3 text-xs dark:border-[#223028] dark:bg-[#0D1310]">
                <div className="flex items-center justify-between">
                  <span className="text-[#5C6660] dark:text-[#9AA89F]">Subtotal:</span>
                  <span className="font-mono">{formatGhs(currentPurchase.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#5C6660] dark:text-[#9AA89F]">Previously Paid:</span>
                  <span className="font-mono">{formatGhs(currentPurchase.amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 border-t border-[#E4E0D8] pt-1 font-semibold dark:border-[#223028]">
                  <span className="text-amber-700 dark:text-amber-400">Current Arrears:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400">
                    {formatGhs(currentPurchase.arrears)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Payment Amount (GH₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={currentPurchase?.arrears || 1000000}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 font-mono text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
                <span className="mt-1 block text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                  Maximum: {currentPurchase ? formatGhs(currentPurchase.arrears) : '0.00'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Date Paid *
                </label>
                <input
                  type="date"
                  required
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Payment Method *
                </label>
                <select
                  required
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                >
                  <option value="momo">Mobile Money (MTN / Telecel / AT)</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Cash (Petty Cash / Counter)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  {method === 'cheque'
                    ? 'Cheque Number *'
                    : method === 'momo'
                    ? 'MoMo Transaction Reference *'
                    : 'Receipt Number'}
                </label>
                <input
                  type="text"
                  required={method === 'cheque' || method === 'momo'}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    method === 'cheque'
                      ? 'e.g. GCB-004812'
                      : method === 'momo'
                      ? 'e.g. MTN-MM-91024819'
                      : 'Receipt number'
                  }
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Payment Note / Narration
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Part settlement of fresh produce invoice via MTN MoMo merchant code."
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-2 text-sm text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>
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
                {submitting ? 'Recording Payment...' : 'Confirm & Save Payment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
