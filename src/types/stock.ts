export type UserRole = 'manager' | 'storekeeper' | 'staff';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type StockUnit = 'kg' | 'litres' | 'pieces' | 'packs' | 'crates';

export type StockCategory =
  | 'Grains & Staples'
  | 'Meat & Poultry'
  | 'Fish & Seafood'
  | 'Fresh Produce'
  | 'Oils & Fats'
  | 'Spices & Condiments'
  | 'Gas & Fuel'
  | 'Packaging & Beverages';

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory | string;
  unit: StockUnit;
  reorderLevel: number;
  defaultSupplierId: string | null;
  taxCategory?: TaxCategory;
  isActive: boolean;
  createdAt: string;
}

export interface StockBatch {
  id: string;
  itemId: string;
  quantityReceived: number;
  quantityRemaining: number;
  costPerUnit: number; // GH₵
  dateReceived: string;
  expiryDate: string | null;
  supplierId: string | null;
  purchaseId: string | null;
  createdAt: string;
}

export type MovementType = 'received' | 'used' | 'wasted' | 'adjusted';

export interface StockMovement {
  id: string;
  itemId: string;
  batchId: string;
  type: MovementType;
  quantity: number;
  userId: string;
  userName: string;
  timestamp: string;
  note: string;
  // Optional linkage to requisitions
  requisitionId?: string;
  requisitionNumber?: string;
}

export type StockAvailabilityStatus = 'In stock' | 'Low' | 'Finished';

export type BatchExpiryStatus = 'expired' | 'expiring-soon' | 'valid' | 'no-expiry';

export interface EnrichedStockItem extends StockItem {
  totalQuantity: number;
  totalValueGhs: number;
  status: StockAvailabilityStatus;
  activeBatchCount: number;
  hasExpiredBatch: boolean;
  hasExpiringSoonBatch: boolean;
  earliestExpiryDate: string | null;
}

// ==========================================
// MODULE 2: REQUISITIONS & ALERTS TYPES
// ==========================================

export type RequisitionDepartment = 'Kitchen' | 'Bar' | 'Service' | 'Other';
export type RequisitionStatus = 'pending' | 'issued' | 'rejected';

export interface RequisitionLine {
  itemId: string;
  itemName: string;
  unit: StockUnit;
  quantityRequested: number;
  quantityIssued: number;
  allocations?: {
    batchId: string;
    quantity: number;
    expiryDate: string | null;
  }[];
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // e.g. REQ-0001
  requestedBy: {
    userId: string;
    userName: string;
  };
  department: RequisitionDepartment;
  status: RequisitionStatus;
  lines: RequisitionLine[];
  note: string;
  createdAt: string;
  issuedBy?: {
    userId: string;
    userName: string;
  } | null;
  issuedAt?: string | null;
  rejectionReason?: string | null;
  isDirectIssue?: boolean;
}

export type AlertType =
  | 'low_stock'
  | 'finished_stock'
  | 'stock_updated'
  | 'payment_due_soon'
  | 'payment_overdue'
  | 'tax_return_due_soon'
  | 'tax_return_overdue'
  | 'expiring_soon'
  | 'expiring_critical'
  | 'expired';
export type AlertSeverity = 'warning' | 'critical' | 'info';

export interface StockAlert {
  id: string;
  type: AlertType;
  itemId?: string;
  itemName?: string;
  batchId?: string;
  purchaseId?: string;
  purchaseNumber?: string;
  supplierId?: string;
  taxReturnPeriod?: string;
  message: string;
  severity: AlertSeverity;
  triggeredBy: {
    userId: string;
    userName: string;
  };
  recipientIds: string[]; // userIds who receive this alert based on routing
  createdAt: string;
  readBy: string[]; // array of userIds
  resolved: boolean;
}

// ==========================================
// MODULE 5: ALERT SETTINGS & ROUTING TYPES
// ==========================================

export interface AlertRouting {
  [categoryOrKey: string]: string; // categoryName -> userId, 'payments' -> userId
}

export interface AlertSettings {
  id: string; // 'current'
  expiryWarningDays: number; // default 7
  expiryCriticalDays: number; // default 2
  paymentDueSoonDays: number; // default 3
  alertRouting: Record<string, string>; // categoryName -> userId, payments -> userId
  lastExpiryCheckAt?: string | null;
  updatedBy: {
    userId: string;
    userName: string;
  };
  updatedAt: string;
}

// ==========================================
// MODULE 3: SUPPLIER LEDGER TYPES
// ==========================================

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string; // Ghana format
  email: string | null;
  address: string;
  tin: string; // Tax Identification Number
  notes: string;
  isActive: boolean;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'cheque' | 'momo';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type TaxCategory = 'standard' | 'exempt' | 'zero_rated';

export interface PurchaseLine {
  itemId: string;
  itemName: string;
  unit: StockUnit;
  quantity: number;
  costPerUnit: number;
  lineTotal: number;
  expiryDate: string | null;
  // Module 4 Tax breakdown per line
  taxCategory?: TaxCategory;
  taxableAmount?: number;
  vatAmount?: number;
  nhilAmount?: number;
  getfundAmount?: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string; // auto: PUR-0001
  supplierId: string;
  supplierName: string;
  dateSupplied: string;
  dueDate: string;
  invoiceNumber: string | null;
  lines: PurchaseLine[];
  subtotal: number;
  amountPaid: number;
  arrears: number; // totalWithTax (or subtotal if no tax) minus amountPaid
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  recordedBy: {
    userId: string;
    userName: string;
  };
  createdAt: string;
  // Module 4 tax calculations (Act 1151)
  taxableAmount?: number | null;
  vatAmount?: number | null;
  nhilAmount?: number | null;
  getfundAmount?: number | null;
  totalTax?: number | null;
  totalWithTax?: number | null;
}

export interface SupplierPayment {
  id: string;
  purchaseId: string;
  purchaseNumber?: string;
  supplierId: string;
  supplierName?: string;
  amount: number;
  method: PaymentMethod;
  reference: string; // Cheque number or MoMo transaction ID
  paidOn: string;
  recordedBy: {
    userId: string;
    userName: string;
  };
  note: string;
  createdAt: string;
}

export interface EnrichedSupplier extends Supplier {
  totalSuppliedGhs: number;
  totalPaidGhs: number;
  totalArrearsGhs: number;
  lastDeliveryDate: string | null;
  deliveryCount: number;
}

// ==========================================
// MODULE 4: TAX ENGINE TYPES (Act 1151)
// ==========================================

export type PricesEnteredAs = 'exclusive' | 'inclusive';

export interface TaxSettings {
  id: string; // 'current'
  vatRate: number; // 15
  nhilRate: number; // 2.5
  getfundRate: number; // 2.5
  pricesEnteredAs: PricesEnteredAs;
  isVatRegistered: boolean; // default true
  businessName: string;
  tin: string;
  updatedBy: {
    userId: string;
    userName: string;
  };
  updatedAt: string;
}

export interface TaxSettingsHistory {
  id: string;
  settings: TaxSettings;
  changedBy: {
    userId: string;
    userName: string;
  };
  changedAt: string;
  note?: string;
}

export type PeriodType = 'day' | 'week' | 'month';

export interface TaxSummary {
  id: string; // 'day_2026-10-04' | 'week_2026-W40' | 'month_2026-10'
  period: string; // '2026-10-04' | '2026-W40' | '2026-10'
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  standardPurchasesNet: number;
  exemptPurchases: number;
  zeroRatedPurchases: number;
  vatInput: number;
  nhilInput: number;
  getfundInput: number;
  totalInputTax: number;
  purchasesGross: number; // totalWithTax
  stockOutValue: number; // cost value of stock leaving (FIFO batch costPerUnit)
  purchaseCount: number;
}

export type TaxReturnStatus = 'Pending' | 'Overdue' | 'Filed';

export interface TaxReturn {
  id: string; // 'ret_2026-10'
  period: string; // '2026-10'
  periodLabel: string; // 'October 2026'
  dueDate: string; // Last working day of the following month
  status: TaxReturnStatus;
  businessName: string;
  tin: string;
  standardPurchasesNet: number;
  exemptPurchases: number;
  zeroRatedPurchases: number;
  totalPurchasesNet: number;
  vatInput: number;
  nhilInput: number;
  getfundInput: number;
  totalInputTax: number;
  stockOutCost: number;
  filedBy?: {
    userId: string;
    userName: string;
  } | null;
  filedAt?: string | null;
  referenceNumber?: string | null; // e.g. RET-2026-10
  isSimulatedFiling: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
