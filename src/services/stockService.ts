import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured, handleFirestoreError } from './firebase';
import {
  AppUser,
  BatchExpiryStatus,
  EnrichedStockItem,
  EnrichedSupplier,
  MovementType,
  OperationType,
  PaymentMethod,
  PaymentStatus,
  PricesEnteredAs,
  Purchase,
  PurchaseLine,
  Requisition,
  RequisitionDepartment,
  StockAlert,
  StockAvailabilityStatus,
  StockBatch,
  StockItem,
  StockMovement,
  StockUnit,
  Supplier,
  SupplierPayment,
  TaxCategory,
  TaxReturn,
  TaxReturnStatus,
  TaxSettings,
  TaxSettingsHistory,
  TaxSummary,
} from '../types/stock';
import { buildGhanaRestaurantDemoSeed } from './demoSeed';
import {
  validateGhanaPhone,
  validateGhanaTin,
  getTaxPeriodIds,
  calculateGraReturnDueDate,
} from '../utils/formatters';

const LOCAL_ITEMS_KEY = 'stockline_gh_items_v2';
const LOCAL_BATCHES_KEY = 'stockline_gh_batches_v2';
const LOCAL_MOVEMENTS_KEY = 'stockline_gh_movements_v2';
const LOCAL_REQUISITIONS_KEY = 'stockline_gh_requisitions_v2';
const LOCAL_ALERTS_KEY = 'stockline_gh_alerts_v2';
const LOCAL_SUPPLIERS_KEY = 'stockline_gh_suppliers_v2';
const LOCAL_PURCHASES_KEY = 'stockline_gh_purchases_v2';
const LOCAL_PAYMENTS_KEY = 'stockline_gh_payments_v2';
const LOCAL_TAX_SETTINGS_KEY = 'stockline_gh_tax_settings_v2';
const LOCAL_TAX_SUMMARIES_KEY = 'stockline_gh_tax_summaries_v2';
const LOCAL_TAX_RETURNS_KEY = 'stockline_gh_tax_returns_v2';
const LOCAL_TAX_HISTORY_KEY = 'stockline_gh_tax_history_v2';
const LOCAL_SEEDED_FLAG = 'stockline_gh_seeded_v3';

export const STOCK_CATEGORIES: string[] = [
  'Grains & Staples',
  'Meat & Poultry',
  'Fish & Seafood',
  'Fresh Produce',
  'Oils & Fats',
  'Spices & Condiments',
  'Gas & Fuel',
  'Packaging & Beverages',
];

export const STOCK_UNITS: { value: StockUnit; label: string }[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'litres', label: 'Litres (L)' },
  { value: 'pieces', label: 'Pieces (pcs)' },
  { value: 'packs', label: 'Packs (pk)' },
  { value: 'crates', label: 'Crates (crt)' },
];

export const REQUISITION_DEPARTMENTS: RequisitionDepartment[] = [
  'Kitchen',
  'Bar',
  'Service',
  'Other',
];

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  id: 'current',
  vatRate: 15,
  nhilRate: 2.5,
  getfundRate: 2.5,
  pricesEnteredAs: 'exclusive',
  isVatRegistered: true,
  businessName: 'StockLine Restaurant Ltd',
  tin: 'C002847192X',
  updatedBy: {
    userId: 'usr_kwame_manager',
    userName: 'Kwame Mensah',
  },
  updatedAt: new Date().toISOString(),
};

export interface StockSnapshot {
  items: StockItem[];
  batches: StockBatch[];
  movements: StockMovement[];
  requisitions: Requisition[];
  alerts: StockAlert[];
  suppliers: Supplier[];
  purchases: Purchase[];
  supplierPayments: SupplierPayment[];
  taxSettings?: TaxSettings;
  taxSummaries?: TaxSummary[];
  taxReturns?: TaxReturn[];
}

type StockListener = (snapshot: StockSnapshot) => void;
const stockListeners = new Set<StockListener>();

export function ensureLocalStoreInitialized(): StockSnapshot {
  const hasSeeded = localStorage.getItem(LOCAL_SEEDED_FLAG);
  const rawItems = localStorage.getItem(LOCAL_ITEMS_KEY);
  const rawBatches = localStorage.getItem(LOCAL_BATCHES_KEY);
  const rawMovements = localStorage.getItem(LOCAL_MOVEMENTS_KEY);
  const rawReqs = localStorage.getItem(LOCAL_REQUISITIONS_KEY);
  const rawAlerts = localStorage.getItem(LOCAL_ALERTS_KEY);
  const rawSuppliers = localStorage.getItem(LOCAL_SUPPLIERS_KEY);
  const rawPurchases = localStorage.getItem(LOCAL_PURCHASES_KEY);
  const rawPayments = localStorage.getItem(LOCAL_PAYMENTS_KEY);
  const rawTaxSettings = localStorage.getItem(LOCAL_TAX_SETTINGS_KEY);
  const rawTaxSummaries = localStorage.getItem(LOCAL_TAX_SUMMARIES_KEY);
  const rawTaxReturns = localStorage.getItem(LOCAL_TAX_RETURNS_KEY);

  if (
    hasSeeded &&
    rawItems &&
    rawBatches &&
    rawMovements &&
    rawReqs &&
    rawAlerts &&
    rawSuppliers &&
    rawPurchases &&
    rawPayments
  ) {
    try {
      return {
        items: JSON.parse(rawItems) as StockItem[],
        batches: JSON.parse(rawBatches) as StockBatch[],
        movements: JSON.parse(rawMovements) as StockMovement[],
        requisitions: JSON.parse(rawReqs) as Requisition[],
        alerts: JSON.parse(rawAlerts) as StockAlert[],
        suppliers: JSON.parse(rawSuppliers) as Supplier[],
        purchases: JSON.parse(rawPurchases) as Purchase[],
        supplierPayments: JSON.parse(rawPayments) as SupplierPayment[],
        taxSettings: rawTaxSettings ? (JSON.parse(rawTaxSettings) as TaxSettings) : DEFAULT_TAX_SETTINGS,
        taxSummaries: rawTaxSummaries ? (JSON.parse(rawTaxSummaries) as TaxSummary[]) : [],
        taxReturns: rawTaxReturns ? (JSON.parse(rawTaxReturns) as TaxReturn[]) : [],
      };
    } catch {
      // Re-initialize below
    }
  }

  const seeded = buildGhanaRestaurantDemoSeed();
  localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(seeded.items));
  localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(seeded.batches));
  localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(seeded.movements));
  localStorage.setItem(LOCAL_REQUISITIONS_KEY, JSON.stringify(seeded.requisitions));
  localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(seeded.alerts));
  localStorage.setItem(LOCAL_SUPPLIERS_KEY, JSON.stringify(seeded.suppliers));
  localStorage.setItem(LOCAL_PURCHASES_KEY, JSON.stringify(seeded.purchases));
  localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(seeded.supplierPayments));
  localStorage.setItem(LOCAL_TAX_SETTINGS_KEY, JSON.stringify(seeded.taxSettings || DEFAULT_TAX_SETTINGS));
  localStorage.setItem(LOCAL_TAX_SUMMARIES_KEY, JSON.stringify(seeded.taxSummaries || []));
  localStorage.setItem(LOCAL_TAX_RETURNS_KEY, JSON.stringify(seeded.taxReturns || []));
  localStorage.setItem(LOCAL_SEEDED_FLAG, 'true');
  return seeded;
}

function saveLocalStore(snapshot: StockSnapshot) {
  localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(snapshot.items));
  localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(snapshot.batches));
  localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(snapshot.movements));
  localStorage.setItem(LOCAL_REQUISITIONS_KEY, JSON.stringify(snapshot.requisitions));
  localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(snapshot.alerts));
  localStorage.setItem(LOCAL_SUPPLIERS_KEY, JSON.stringify(snapshot.suppliers));
  localStorage.setItem(LOCAL_PURCHASES_KEY, JSON.stringify(snapshot.purchases));
  localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(snapshot.supplierPayments));
  if (snapshot.taxSettings) {
    localStorage.setItem(LOCAL_TAX_SETTINGS_KEY, JSON.stringify(snapshot.taxSettings));
  }
  if (snapshot.taxSummaries) {
    localStorage.setItem(LOCAL_TAX_SUMMARIES_KEY, JSON.stringify(snapshot.taxSummaries));
  }
  if (snapshot.taxReturns) {
    localStorage.setItem(LOCAL_TAX_RETURNS_KEY, JSON.stringify(snapshot.taxReturns));
  }
  stockListeners.forEach((cb) => cb(snapshot));
}

function assertWriteRole(actor: AppUser) {
  if (!actor || !actor.isActive) {
    throw new Error('Permission denied: Only authenticated, active users can modify stock.');
  }
  if (actor.role !== 'manager' && actor.role !== 'storekeeper') {
    throw new Error(
      'Permission denied: Only Managers and Storekeepers have write access to stock records.'
    );
  }
}

/**
 * Real-time listener for Stock items, batches, movements, requisitions, and alerts.
 */
export function subscribeToStockData(
  actor: AppUser | null,
  onData: (snapshot: StockSnapshot) => void
): () => void {
  if (!actor || !actor.isActive) {
    return () => {};
  }

  if (isLiveFirebaseConfigured && db) {
    let items: StockItem[] = [];
    let batches: StockBatch[] = [];
    let movements: StockMovement[] = [];
    let requisitions: Requisition[] = [];
    let alerts: StockAlert[] = [];
    let suppliers: Supplier[] = [];
    let purchases: Purchase[] = [];
    let supplierPayments: SupplierPayment[] = [];

    const emit = () => {
      // Staff can only see their own requisitions, and neither alerts, suppliers, nor purchases
      const filteredReqs =
        actor.role === 'staff'
          ? requisitions.filter((r) => r.requestedBy.userId === actor.uid)
          : requisitions;
      const filteredAlerts = actor.role === 'staff' ? [] : alerts;
      const filteredSuppliers = actor.role === 'staff' ? [] : suppliers;
      const filteredPurchases = actor.role === 'staff' ? [] : purchases;
      const filteredPayments = actor.role === 'staff' ? [] : supplierPayments;

      onData({
        items,
        batches,
        movements,
        requisitions: filteredReqs,
        alerts: filteredAlerts,
        suppliers: filteredSuppliers,
        purchases: filteredPurchases,
        supplierPayments: filteredPayments,
      });
    };

    const unsubItems = onSnapshot(
      collection(db, 'stockItems'),
      (snap) => {
        items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            category: data.category,
            unit: data.unit as StockUnit,
            reorderLevel: Number(data.reorderLevel),
            defaultSupplierId: data.defaultSupplierId ?? null,
            isActive: Boolean(data.isActive),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt),
          };
        });
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stockItems')
    );

    const unsubBatches = onSnapshot(
      collection(db, 'stockBatches'),
      (snap) => {
        batches = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            itemId: data.itemId,
            quantityReceived: Number(data.quantityReceived),
            quantityRemaining: Number(data.quantityRemaining),
            costPerUnit: Number(data.costPerUnit),
            dateReceived:
              data.dateReceived instanceof Timestamp
                ? data.dateReceived.toDate().toISOString()
                : String(data.dateReceived),
            expiryDate:
              data.expiryDate instanceof Timestamp
                ? data.expiryDate.toDate().toISOString()
                : data.expiryDate
                ? String(data.expiryDate)
                : null,
            supplierId: data.supplierId ?? null,
            purchaseId: data.purchaseId ?? null,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt),
          };
        });
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stockBatches')
    );

    const unsubMovements = onSnapshot(
      collection(db, 'stockMovements'),
      (snap) => {
        movements = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            itemId: data.itemId,
            batchId: data.batchId,
            type: data.type as MovementType,
            quantity: Number(data.quantity),
            userId: data.userId,
            userName: data.userName,
            timestamp:
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate().toISOString()
                : String(data.timestamp),
            note: data.note || '',
            requisitionId: data.requisitionId,
            requisitionNumber: data.requisitionNumber,
          };
        });
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stockMovements')
    );

    const unsubReqs = onSnapshot(
      collection(db, 'requisitions'),
      (snap) => {
        requisitions = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            requisitionNumber: data.requisitionNumber,
            requestedBy: data.requestedBy,
            department: data.department as RequisitionDepartment,
            status: data.status,
            lines: data.lines || [],
            note: data.note || '',
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt),
            issuedBy: data.issuedBy ?? null,
            issuedAt:
              data.issuedAt instanceof Timestamp
                ? data.issuedAt.toDate().toISOString()
                : data.issuedAt ?? null,
            rejectionReason: data.rejectionReason ?? null,
            isDirectIssue: Boolean(data.isDirectIssue),
          };
        });
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'requisitions')
    );

    const unsubAlerts = onSnapshot(
      collection(db, 'alerts'),
      (snap) => {
        alerts = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type,
            itemId: data.itemId,
            itemName: data.itemName,
            message: data.message,
            severity: data.severity,
            triggeredBy: data.triggeredBy,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt),
            readBy: data.readBy || [],
            resolved: Boolean(data.resolved),
          };
        });
        emit();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'alerts')
    );

    return () => {
      unsubItems();
      unsubBatches();
      unsubMovements();
      unsubReqs();
      unsubAlerts();
    };
  }

  const initial = ensureLocalStoreInitialized();
  const filteredEmitter = (snapshot: StockSnapshot) => {
    const filteredReqs =
      actor.role === 'staff'
        ? snapshot.requisitions.filter((r) => r.requestedBy.userId === actor.uid)
        : snapshot.requisitions;
    const filteredAlerts = actor.role === 'staff' ? [] : snapshot.alerts;
    const filteredSuppliers = actor.role === 'staff' ? [] : snapshot.suppliers;
    const filteredPurchases = actor.role === 'staff' ? [] : snapshot.purchases;
    const filteredPayments = actor.role === 'staff' ? [] : snapshot.supplierPayments;

    onData({
      ...snapshot,
      requisitions: filteredReqs,
      alerts: filteredAlerts,
      suppliers: filteredSuppliers,
      purchases: filteredPurchases,
      supplierPayments: filteredPayments,
    });
  };

  stockListeners.add(filteredEmitter);
  filteredEmitter(initial);
  return () => {
    stockListeners.delete(filteredEmitter);
  };
}

/**
 * Checks whether an expiry date has already passed.
 */
export function isBatchExpired(expiryDateIso: string | null): boolean {
  if (!expiryDateIso) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const exp = new Date(expiryDateIso);
  const startOfExpiry = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  return startOfExpiry < startOfToday;
}

export function getBatchExpiryStatus(
  expiryDateIso: string | null,
  quantityRemaining = 1
): {
  status: BatchExpiryStatus;
  daysDelta: number | null;
  label: string;
} {
  if (!expiryDateIso) {
    return { status: 'no-expiry', daysDelta: null, label: 'Non-perishable' };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const exp = new Date(expiryDateIso);
  const startOfExpiry = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  const diffDays = Math.round((startOfExpiry - startOfToday) / (1000 * 60 * 60 * 24));

  if (quantityRemaining <= 0) {
    return {
      status: 'valid',
      daysDelta: diffDays,
      label: 'Depleted batch',
    };
  }

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      status: 'expired',
      daysDelta: diffDays,
      label: daysAgo === 1 ? 'Expired · 1 day ago' : `Expired · ${daysAgo} days ago`,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'expiring-soon',
      daysDelta: 0,
      label: 'Expires today',
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'expiring-soon',
      daysDelta: diffDays,
      label: diffDays === 1 ? 'Expiring in 1 day' : `Expiring in ${diffDays} days`,
    };
  }

  return {
    status: 'valid',
    daysDelta: diffDays,
    label: `In ${diffDays} days`,
  };
}

/**
 * Sorts batches for an item in FIFO order:
 * Earliest expiryDate first (skipping null expiry to the end), then dateReceived.
 */
export function sortBatchesFifo(batches: StockBatch[]): StockBatch[] {
  return [...batches].sort((a, b) => {
    // If both have expiry date, sort by earliest expiry date first
    if (a.expiryDate && b.expiryDate) {
      const expA = new Date(a.expiryDate).getTime();
      const expB = new Date(b.expiryDate).getTime();
      if (expA !== expB) return expA - expB;
    } else if (a.expiryDate && !b.expiryDate) {
      return -1; // perishable batches first
    } else if (!a.expiryDate && b.expiryDate) {
      return 1;
    }

    // Secondary order by dateReceived
    const timeA = new Date(a.dateReceived).getTime() || new Date(a.createdAt).getTime();
    const timeB = new Date(b.dateReceived).getTime() || new Date(b.createdAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function enrichStockItems(
  items: StockItem[],
  batches: StockBatch[]
): EnrichedStockItem[] {
  return items
    .map((item) => {
      const itemBatches = batches.filter((b) => b.itemId === item.id);
      const totalQuantityRaw = itemBatches.reduce(
        (sum, b) => sum + Math.max(0, Number(b.quantityRemaining) || 0),
        0
      );
      const totalQuantity = Math.round(totalQuantityRaw * 100) / 100;

      const totalValueGhs = itemBatches.reduce(
        (sum, b) =>
          sum + Math.max(0, Number(b.quantityRemaining) || 0) * (Number(b.costPerUnit) || 0),
        0
      );

      let status: StockAvailabilityStatus = 'In stock';
      if (totalQuantity <= 0) {
        status = 'Finished';
      } else if (totalQuantity <= item.reorderLevel) {
        status = 'Low';
      }

      const activeBatches = itemBatches.filter((b) => b.quantityRemaining > 0);
      let hasExpiredBatch = false;
      let hasExpiringSoonBatch = false;
      let earliestExpiryDate: string | null = null;

      for (const batch of activeBatches) {
        const expInfo = getBatchExpiryStatus(batch.expiryDate, batch.quantityRemaining);
        if (expInfo.status === 'expired') hasExpiredBatch = true;
        if (expInfo.status === 'expiring-soon') hasExpiringSoonBatch = true;
        if (batch.expiryDate) {
          if (
            !earliestExpiryDate ||
            new Date(batch.expiryDate).getTime() < new Date(earliestExpiryDate).getTime()
          ) {
            earliestExpiryDate = batch.expiryDate;
          }
        }
      }

      return {
        ...item,
        totalQuantity,
        totalValueGhs,
        status,
        activeBatchCount: activeBatches.length,
        hasExpiredBatch,
        hasExpiringSoonBatch,
        earliestExpiryDate,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ==========================================
// ALERT CHECK LOGIC (SECTION 2)
// ==========================================

function evaluateStockAlertsOnReduction(
  item: StockItem,
  previousTotal: number,
  newTotal: number,
  actor: AppUser,
  existingAlerts: StockAlert[]
): StockAlert[] {
  const newAlerts: StockAlert[] = [];
  const nowIso = new Date().toISOString();

  if (newTotal === 0) {
    const hasUnresolvedFinished = existingAlerts.some(
      (a) => a.itemId === item.id && a.type === 'finished_stock' && !a.resolved
    );
    if (!hasUnresolvedFinished) {
      newAlerts.push({
        id: `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'finished_stock',
        itemId: item.id,
        itemName: item.name,
        message: `Finished stock: ${item.name} is completely depleted (0 ${item.unit} remaining). Reorder required immediately.`,
        severity: 'critical',
        triggeredBy: {
          userId: actor.uid,
          userName: actor.name,
        },
        createdAt: nowIso,
        readBy: [],
        resolved: false,
      });
    }
  } else if (newTotal <= item.reorderLevel && previousTotal > item.reorderLevel) {
    const hasUnresolvedLow = existingAlerts.some(
      (a) => a.itemId === item.id && a.type === 'low_stock' && !a.resolved
    );
    if (!hasUnresolvedLow) {
      newAlerts.push({
        id: `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'low_stock',
        itemId: item.id,
        itemName: item.name,
        message: `Low stock warning: ${item.name} dropped to ${newTotal} ${item.unit}, at or below reorder threshold (${item.reorderLevel} ${item.unit}).`,
        severity: 'warning',
        triggeredBy: {
          userId: actor.uid,
          userName: actor.name,
        },
        createdAt: nowIso,
        readBy: [],
        resolved: false,
      });
    }
  }

  return newAlerts;
}

// ==========================================
// STOCK ITEMS & BATCH MUTATIONS
// ==========================================

export async function createStockItem(
  actor: AppUser,
  input: {
    name: string;
    category: string;
    unit: StockUnit;
    reorderLevel: number;
    defaultSupplierId?: string | null;
    taxCategory?: TaxCategory;
  }
): Promise<StockItem> {
  assertWriteRole(actor);

  const cleanName = input.name.trim();
  const cleanCategory = input.category.trim();
  const reorderLevel = Number(input.reorderLevel);
  const taxCategory = input.taxCategory || 'standard';

  if (cleanName.length < 2 || cleanName.length > 120) {
    throw new Error('Item name must be between 2 and 120 characters.');
  }
  if (cleanCategory.length < 2 || cleanCategory.length > 60) {
    throw new Error('Category must be between 2 and 60 characters.');
  }
  if (isNaN(reorderLevel) || reorderLevel < 0) {
    throw new Error('Reorder level must be 0 or greater.');
  }

  const itemId = `itm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  if (isLiveFirebaseConfigured && db) {
    const nowTs = Timestamp.now();
    try {
      await setDoc(doc(db, 'stockItems', itemId), {
        name: cleanName,
        category: cleanCategory,
        unit: input.unit,
        reorderLevel,
        defaultSupplierId: input.defaultSupplierId?.trim() || null,
        taxCategory,
        isActive: true,
        createdAt: nowTs,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `stockItems/${itemId}`);
    }
  } else {
    const snapshot = ensureLocalStoreInitialized();
    const newItem: StockItem = {
      id: itemId,
      name: cleanName,
      category: cleanCategory,
      unit: input.unit,
      reorderLevel,
      defaultSupplierId: input.defaultSupplierId?.trim() || null,
      taxCategory,
      isActive: true,
      createdAt: nowIso,
    };
    snapshot.items.push(newItem);
    saveLocalStore(snapshot);
  }

  return {
    id: itemId,
    name: cleanName,
    category: cleanCategory,
    unit: input.unit,
    reorderLevel,
    defaultSupplierId: input.defaultSupplierId?.trim() || null,
    taxCategory,
    isActive: true,
    createdAt: nowIso,
  };
}

export async function updateStockItem(
  actor: AppUser,
  itemId: string,
  updates: {
    name: string;
    category: string;
    unit: StockUnit;
    reorderLevel: number;
    defaultSupplierId: string | null;
    taxCategory?: TaxCategory;
    isActive: boolean;
  }
): Promise<void> {
  assertWriteRole(actor);

  const cleanName = updates.name.trim();
  const cleanCategory = updates.category.trim();
  const reorderLevel = Number(updates.reorderLevel);
  const taxCategory = updates.taxCategory || 'standard';

  if (cleanName.length < 2 || cleanName.length > 120) {
    throw new Error('Item name must be between 2 and 120 characters.');
  }
  if (isNaN(reorderLevel) || reorderLevel < 0) {
    throw new Error('Reorder level must be 0 or greater.');
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'stockItems', itemId), {
        name: cleanName,
        category: cleanCategory,
        unit: updates.unit,
        reorderLevel,
        defaultSupplierId: updates.defaultSupplierId?.trim() || null,
        taxCategory,
        isActive: Boolean(updates.isActive),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stockItems/${itemId}`);
    }
  } else {
    const snapshot = ensureLocalStoreInitialized();
    const idx = snapshot.items.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      snapshot.items[idx] = {
        ...snapshot.items[idx],
        name: cleanName,
        category: cleanCategory,
        unit: updates.unit,
        reorderLevel,
        defaultSupplierId: updates.defaultSupplierId?.trim() || null,
        taxCategory,
        isActive: Boolean(updates.isActive),
      };
      saveLocalStore(snapshot);
    }
  }
}

/**
 * Receive stock batch (Module 1 + Module 2 alert resolution & info alert).
 * When stock is received and the total goes back above reorderLevel:
 * - Mark open low/finished alerts for that item as resolved
 * - Create a "stock_updated" info alert.
 */
export async function receiveStockBatchTransaction(
  actor: AppUser,
  input: {
    itemId: string;
    quantityReceived: number;
    costPerUnit: number;
    dateReceived: string;
    expiryDate: string | null;
    supplierId?: string | null;
    purchaseId?: string | null;
    note: string;
  }
): Promise<{ batch: StockBatch; movement: StockMovement }> {
  assertWriteRole(actor);

  const qty = Math.round(Number(input.quantityReceived) * 100) / 100;
  const cost = Math.round(Number(input.costPerUnit) * 100) / 100;
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Quantity received must be greater than 0.');
  }
  if (isNaN(cost) || cost < 0) {
    throw new Error('Cost per unit (GH₵) must be 0 or greater.');
  }

  const batchId = `bat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const movementId = `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const dateReceivedIso = input.dateReceived
    ? new Date(input.dateReceived).toISOString()
    : nowIso;
  const expiryDateIso = input.expiryDate ? new Date(input.expiryDate).toISOString() : null;
  const cleanNote =
    input.note.trim() || `Received batch of ${qty} units at GH₵ ${cost.toFixed(2)}/unit.`;

  if (isLiveFirebaseConfigured && db) {
    const itemRef = doc(db, 'stockItems', input.itemId);
    const batchRef = doc(db, 'stockBatches', batchId);
    const movementRef = doc(db, 'stockMovements', movementId);

    try {
      await runTransaction(db, async (transaction) => {
        const itemSnap = await transaction.get(itemRef);
        if (!itemSnap.exists()) {
          throw new Error('Referenced stock item does not exist.');
        }

        const nowTs = Timestamp.now();
        transaction.set(batchRef, {
          itemId: input.itemId,
          quantityReceived: qty,
          quantityRemaining: qty,
          costPerUnit: cost,
          dateReceived: Timestamp.fromDate(new Date(dateReceivedIso)),
          expiryDate: expiryDateIso ? Timestamp.fromDate(new Date(expiryDateIso)) : null,
          supplierId: input.supplierId?.trim() || null,
          purchaseId: input.purchaseId?.trim() || null,
          createdAt: nowTs,
        });

        transaction.set(movementRef, {
          itemId: input.itemId,
          batchId,
          type: 'received',
          quantity: qty,
          userId: actor.uid,
          userName: actor.name,
          timestamp: nowTs,
          note: cleanNote.slice(0, 500),
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stockBatches/${batchId}`);
    }
  } else {
    const snapshot = ensureLocalStoreInitialized();
    const item = snapshot.items.find((i) => i.id === input.itemId);
    if (!item) {
      throw new Error('Referenced stock item does not exist.');
    }

    const previousTotal = snapshot.batches
      .filter((b) => b.itemId === input.itemId)
      .reduce((sum, b) => sum + (Number(b.quantityRemaining) || 0), 0);

    const newTotal = previousTotal + qty;

    const newBatch: StockBatch = {
      id: batchId,
      itemId: input.itemId,
      quantityReceived: qty,
      quantityRemaining: qty,
      costPerUnit: cost,
      dateReceived: dateReceivedIso,
      expiryDate: expiryDateIso,
      supplierId: input.supplierId?.trim() || null,
      purchaseId: input.purchaseId?.trim() || null,
      createdAt: nowIso,
    };

    const newMovement: StockMovement = {
      id: movementId,
      itemId: input.itemId,
      batchId,
      type: 'received',
      quantity: qty,
      userId: actor.uid,
      userName: actor.name,
      timestamp: nowIso,
      note: cleanNote.slice(0, 500),
    };

    snapshot.batches.push(newBatch);
    snapshot.movements.unshift(newMovement);

    // Alert check on stock reception:
    if (newTotal > item.reorderLevel) {
      let resolvedCount = 0;
      for (const alt of snapshot.alerts) {
        if (alt.itemId === item.id && !alt.resolved && (alt.type === 'low_stock' || alt.type === 'finished_stock')) {
          alt.resolved = true;
          resolvedCount++;
        }
      }

      if (resolvedCount > 0 || previousTotal <= item.reorderLevel) {
        snapshot.alerts.unshift({
          id: `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'stock_updated',
          itemId: item.id,
          itemName: item.name,
          message: `Stock updated: ${item.name} received batch of ${qty} ${item.unit}. Total is now healthy at ${newTotal} ${item.unit}.`,
          severity: 'info',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: nowIso,
          readBy: [],
          resolved: true,
        });
      }
    }

    saveLocalStore(snapshot);
  }

  return {
    batch: {
      id: batchId,
      itemId: input.itemId,
      quantityReceived: qty,
      quantityRemaining: qty,
      costPerUnit: cost,
      dateReceived: dateReceivedIso,
      expiryDate: expiryDateIso,
      supplierId: input.supplierId?.trim() || null,
      purchaseId: input.purchaseId?.trim() || null,
      createdAt: nowIso,
    },
    movement: {
      id: movementId,
      itemId: input.itemId,
      batchId,
      type: 'received',
      quantity: qty,
      userId: actor.uid,
      userName: actor.name,
      timestamp: nowIso,
      note: cleanNote.slice(0, 500),
    },
  };
}

export async function recordBatchMovementTransaction(
  actor: AppUser,
  input: {
    itemId: string;
    batchId: string;
    type: Exclude<MovementType, 'received'>;
    quantity: number;
    adjustmentDirection?: 'deduct' | 'add';
    note: string;
  }
): Promise<StockMovement> {
  assertWriteRole(actor);

  const qty = Math.round(Number(input.quantity) * 100) / 100;
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Movement quantity must be greater than 0.');
  }
  if (!input.note.trim()) {
    throw new Error('Please provide an operational note for the audit log.');
  }

  const movementId = `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const isAddition = input.type === 'adjusted' && input.adjustmentDirection === 'add';

  const snapshot = ensureLocalStoreInitialized();
  const batchIdx = snapshot.batches.findIndex(
    (b) => b.id === input.batchId && b.itemId === input.itemId
  );
  if (batchIdx === -1) {
    throw new Error('Selected stock batch not found.');
  }

  const batch = snapshot.batches[batchIdx];
  const item = snapshot.items.find((i) => i.id === input.itemId);
  if (!item) throw new Error('Item not found.');

  const previousTotal = snapshot.batches
    .filter((b) => b.itemId === input.itemId)
    .reduce((sum, b) => sum + (Number(b.quantityRemaining) || 0), 0);

  const nextRemaining = isAddition
    ? Math.round((batch.quantityRemaining + qty) * 100) / 100
    : Math.round((batch.quantityRemaining - qty) * 100) / 100;

  if (nextRemaining < 0) {
    throw new Error(
      `Insufficient quantity in batch. Remaining: ${batch.quantityRemaining}, requested: ${qty}.`
    );
  }
  if (nextRemaining > batch.quantityReceived) {
    throw new Error(
      `Adjusted quantity (${nextRemaining}) cannot exceed batch quantity received (${batch.quantityReceived}).`
    );
  }

  snapshot.batches[batchIdx] = {
    ...batch,
    quantityRemaining: nextRemaining,
  };

  const newMovement: StockMovement = {
    id: movementId,
    itemId: input.itemId,
    batchId: input.batchId,
    type: input.type,
    quantity: qty,
    userId: actor.uid,
    userName: actor.name,
    timestamp: nowIso,
    note: input.note.trim().slice(0, 500),
  };

  snapshot.movements.unshift(newMovement);

  if (!isAddition) {
    const newTotal = previousTotal - qty;
    const generatedAlerts = evaluateStockAlertsOnReduction(
      item,
      previousTotal,
      newTotal,
      actor,
      snapshot.alerts
    );
    snapshot.alerts.unshift(...generatedAlerts);

    // Apply wastage/reduction cost to tax summaries stockOutValue
    const outCost = Math.round(qty * (Number(batch.costPerUnit) || 0) * 100) / 100;
    applyStockOutToTaxSummaries(nowIso, outCost, snapshot);
  }

  saveLocalStore(snapshot);
  return newMovement;
}

// ==========================================
// MODULE 2: REQUISITIONS MANAGEMENT
// ==========================================

function generateNextRequisitionNumber(existingReqs: Requisition[]): string {
  let highest = 0;
  for (const r of existingReqs) {
    const match = r.requisitionNumber.match(/REQ-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  }
  const nextNum = highest + 1;
  return `REQ-${String(nextNum).padStart(4, '0')}`;
}

/**
 * STAFF creates a requisition:
 * Pick items, enter quantities, add a note, submit.
 */
export async function createRequisition(
  actor: AppUser,
  input: {
    department: RequisitionDepartment;
    lines: {
      itemId: string;
      itemName: string;
      unit: StockUnit;
      quantityRequested: number;
    }[];
    note: string;
  }
): Promise<Requisition> {
  if (!actor || !actor.isActive) {
    throw new Error('You must be an active signed-in employee to submit a requisition.');
  }

  if (!input.lines || input.lines.length === 0) {
    throw new Error('Please include at least one stock item in your requisition.');
  }

  for (const line of input.lines) {
    const qty = Number(line.quantityRequested);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Quantity for "${line.itemName}" must be greater than 0.`);
    }
  }

  const snapshot = ensureLocalStoreInitialized();
  const reqNumber = generateNextRequisitionNumber(snapshot.requisitions);
  const reqId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newRequisition: Requisition = {
    id: reqId,
    requisitionNumber: reqNumber,
    requestedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    department: input.department,
    status: 'pending',
    lines: input.lines.map((l) => ({
      itemId: l.itemId,
      itemName: l.itemName,
      unit: l.unit,
      quantityRequested: Math.round(Number(l.quantityRequested) * 100) / 100,
      quantityIssued: Math.round(Number(l.quantityRequested) * 100) / 100,
    })),
    note: input.note.trim(),
    createdAt: nowIso,
    issuedBy: null,
    issuedAt: null,
    rejectionReason: null,
    isDirectIssue: false,
  };

  snapshot.requisitions.unshift(newRequisition);
  saveLocalStore(snapshot);
  return newRequisition;
}

/**
 * ISSUING A REQUISITION: ONE FIRESTORE TRANSACTION
 * 1. Deducts stock from batches in FIFO order (earliest expiryDate first, then dateReceived),
 *    spilling into next batch when one runs out. Batches with expiryDate in the past are skipped and flagged.
 * 2. Writes a stockMovement of type "used" for each batch touched, recording requisition number, staff, and storekeeper.
 * 3. Updates requisition status to "issued" with line allocations.
 * 4. Runs alert check for each item affected (finished_stock or low_stock).
 */
export async function issueRequisitionTransaction(
  actor: AppUser,
  requisitionId: string,
  lineIssuance: { itemId: string; quantityIssued: number }[]
): Promise<{
  requisition: Requisition;
  expiredBatchesSkipped: string[];
}> {
  assertWriteRole(actor);

  const snapshot = ensureLocalStoreInitialized();
  const reqIdx = snapshot.requisitions.findIndex((r) => r.id === requisitionId);
  if (reqIdx === -1) throw new Error('Requisition record not found.');

  const requisition = snapshot.requisitions[reqIdx];
  if (requisition.status !== 'pending') {
    throw new Error(`This requisition is already ${requisition.status} and cannot be issued.`);
  }

  const expiredBatchesSkipped: string[] = [];
  const generatedMovements: StockMovement[] = [];
  const generatedAlerts: StockAlert[] = [];
  const nowIso = new Date().toISOString();

  // Create a working clone of batches to mutate atomically
  const updatedBatches = [...snapshot.batches];
  const updatedLines = [...requisition.lines];

  let totalStockOutCost = 0;

  // Process each line
  for (const line of updatedLines) {
    const issueSpec = lineIssuance.find((l) => l.itemId === line.itemId);
    const qtyToIssue = issueSpec !== undefined ? Number(issueSpec.quantityIssued) : line.quantityRequested;

    if (isNaN(qtyToIssue) || qtyToIssue < 0) {
      throw new Error(`Invalid issuance quantity for ${line.itemName}.`);
    }

    if (qtyToIssue === 0) {
      line.quantityIssued = 0;
      line.allocations = [];
      continue;
    }

    // Get item batches in FIFO order
    const itemBatches = sortBatchesFifo(
      updatedBatches.filter((b) => b.itemId === line.itemId && b.quantityRemaining > 0)
    );

    // Calculate non-expired available stock
    let totalNonExpiredAvailable = 0;
    for (const b of itemBatches) {
      if (isBatchExpired(b.expiryDate)) {
        if (!expiredBatchesSkipped.includes(b.id)) {
          expiredBatchesSkipped.push(b.id);
        }
      } else {
        totalNonExpiredAvailable += b.quantityRemaining;
      }
    }

    if (qtyToIssue > totalNonExpiredAvailable) {
      throw new Error(
        `Cannot issue ${qtyToIssue} ${line.unit} of ${line.itemName}. Only ${totalNonExpiredAvailable} ${line.unit} is available in non-expired batches.`
      );
    }

    // Previous total across all batches of this item before deduction
    const itemObj = snapshot.items.find((i) => i.id === line.itemId);
    const previousItemTotal = updatedBatches
      .filter((b) => b.itemId === line.itemId)
      .reduce((sum, b) => sum + (Number(b.quantityRemaining) || 0), 0);

    let remainingNeeded = qtyToIssue;
    const lineAllocations: { batchId: string; quantity: number; expiryDate: string | null }[] = [];

    for (const b of itemBatches) {
      if (remainingNeeded <= 0) break;

      // Skip expired batches
      if (isBatchExpired(b.expiryDate)) {
        continue;
      }

      const take = Math.min(b.quantityRemaining, remainingNeeded);
      totalStockOutCost += Math.round(take * (Number(b.costPerUnit) || 0) * 100) / 100;
      const batchRefIdx = updatedBatches.findIndex((ub) => ub.id === b.id);
      if (batchRefIdx !== -1) {
        updatedBatches[batchRefIdx] = {
          ...updatedBatches[batchRefIdx],
          quantityRemaining: Math.round((updatedBatches[batchRefIdx].quantityRemaining - take) * 100) / 100,
        };
      }

      lineAllocations.push({
        batchId: b.id,
        quantity: take,
        expiryDate: b.expiryDate,
      });

      // Write movement of type "used" for each batch touched
      const movId = `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      generatedMovements.push({
        id: movId,
        itemId: line.itemId,
        batchId: b.id,
        type: 'used',
        quantity: take,
        userId: actor.uid,
        userName: `${actor.name} (Issued for ${requisition.requestedBy.userName})`,
        timestamp: nowIso,
        note: `Issued for ${requisition.requisitionNumber} (${line.quantityRequested} requested, ${take} from batch ${b.id}). Staff: ${requisition.requestedBy.userName}, Storekeeper: ${actor.name}.`,
        requisitionId: requisition.id,
        requisitionNumber: requisition.requisitionNumber,
      });

      remainingNeeded = Math.round((remainingNeeded - take) * 100) / 100;
    }

    line.quantityIssued = qtyToIssue;
    line.allocations = lineAllocations;

    // Run alert check for this item
    if (itemObj) {
      const newItemTotal = previousItemTotal - qtyToIssue;
      const alertsForLine = evaluateStockAlertsOnReduction(
        itemObj,
        previousItemTotal,
        newItemTotal,
        actor,
        snapshot.alerts
      );
      generatedAlerts.push(...alertsForLine);
    }
  }

  // Update requisition status
  const updatedRequisition: Requisition = {
    ...requisition,
    status: 'issued',
    lines: updatedLines,
    issuedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    issuedAt: nowIso,
  };

  snapshot.requisitions[reqIdx] = updatedRequisition;
  snapshot.batches = updatedBatches;
  snapshot.movements.unshift(...generatedMovements);
  snapshot.alerts.unshift(...generatedAlerts);

  if (totalStockOutCost > 0) {
    applyStockOutToTaxSummaries(nowIso, totalStockOutCost, snapshot);
  }

  saveLocalStore(snapshot);

  return {
    requisition: updatedRequisition,
    expiredBatchesSkipped,
  };
}

/**
 * REJECTING A REQUISITION:
 * Requires a reason. Updates status to "rejected".
 */
export async function rejectRequisition(
  actor: AppUser,
  requisitionId: string,
  rejectionReason: string
): Promise<Requisition> {
  assertWriteRole(actor);

  const cleanReason = rejectionReason.trim();
  if (!cleanReason) {
    throw new Error('A rejection reason is required to reject a requisition.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const reqIdx = snapshot.requisitions.findIndex((r) => r.id === requisitionId);
  if (reqIdx === -1) throw new Error('Requisition not found.');

  const req = snapshot.requisitions[reqIdx];
  if (req.status !== 'pending') {
    throw new Error(`Cannot reject a requisition that is already ${req.status}.`);
  }

  const updated: Requisition = {
    ...req,
    status: 'rejected',
    rejectionReason: cleanReason,
    issuedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    issuedAt: new Date().toISOString(),
  };

  snapshot.requisitions[reqIdx] = updated;
  saveLocalStore(snapshot);
  return updated;
}

/**
 * DIRECT ISSUE (Walk-in Withdrawal):
 * Storekeeper selects the staff member who took the items.
 * Follows the same FIFO deduction, movement logging, and alert check.
 */
export async function recordDirectIssueTransaction(
  actor: AppUser,
  input: {
    targetStaffUser: { userId: string; userName: string };
    department: RequisitionDepartment;
    lines: {
      itemId: string;
      itemName: string;
      unit: StockUnit;
      quantityIssued: number;
    }[];
    note: string;
  }
): Promise<{
  requisition: Requisition;
  expiredBatchesSkipped: string[];
}> {
  assertWriteRole(actor);

  if (!input.lines || input.lines.length === 0) {
    throw new Error('Please select at least one item for the direct issue.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const reqNumber = generateNextRequisitionNumber(snapshot.requisitions);
  const reqId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  // Create pre-issued direct requisition
  const directReq: Requisition = {
    id: reqId,
    requisitionNumber: reqNumber,
    requestedBy: input.targetStaffUser,
    department: input.department,
    status: 'pending', // temporarily pending so we can reuse issueRequisitionTransaction logic
    lines: input.lines.map((l) => ({
      itemId: l.itemId,
      itemName: l.itemName,
      unit: l.unit,
      quantityRequested: Number(l.quantityIssued),
      quantityIssued: Number(l.quantityIssued),
    })),
    note: input.note.trim() || 'Direct walk-in store issue.',
    createdAt: nowIso,
    issuedBy: null,
    issuedAt: null,
    rejectionReason: null,
    isDirectIssue: true,
  };

  snapshot.requisitions.unshift(directReq);
  saveLocalStore(snapshot);

  // Now execute the transactional issuance
  const lineIssuance = input.lines.map((l) => ({
    itemId: l.itemId,
    quantityIssued: l.quantityIssued,
  }));

  return await issueRequisitionTransaction(actor, reqId, lineIssuance);
}

// ==========================================
// MODULE 2: ALERTS API
// ==========================================

export async function markAlertAsRead(actor: AppUser, alertId: string): Promise<void> {
  if (actor.role === 'staff') return;

  const snapshot = ensureLocalStoreInitialized();
  const alert = snapshot.alerts.find((a) => a.id === alertId);
  if (alert) {
    if (!alert.readBy.includes(actor.uid)) {
      alert.readBy.push(actor.uid);
      saveLocalStore(snapshot);
    }
  }
}

export async function markAllAlertsAsRead(actor: AppUser): Promise<void> {
  if (actor.role === 'staff') return;

  const snapshot = ensureLocalStoreInitialized();
  let changed = false;
  for (const alt of snapshot.alerts) {
    if (!alt.readBy.includes(actor.uid)) {
      alt.readBy.push(actor.uid);
      changed = true;
    }
  }
  if (changed) {
    saveLocalStore(snapshot);
  }
}

export async function resolveStockAlert(actor: AppUser, alertId: string): Promise<void> {
  assertWriteRole(actor);

  const snapshot = ensureLocalStoreInitialized();
  const alert = snapshot.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    saveLocalStore(snapshot);
  }
}

// ==========================================
// EXTENDED DEMO DATA LOADER (SECTION 6)
// ==========================================

export async function loadGhanaDemoData(actor: AppUser): Promise<{
  itemCount: number;
  batchCount: number;
  movementCount: number;
  requisitionCount: number;
  alertCount: number;
  supplierCount: number;
  purchaseCount: number;
}> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only a Restaurant Manager can seed demo data.');
  }

  const seeded = buildGhanaRestaurantDemoSeed();

  if (isLiveFirebaseConfigured && db) {
    try {
      const batch = writeBatch(db);
      for (const item of seeded.items) {
        batch.set(doc(db, 'stockItems', item.id), {
          ...item,
          createdAt: Timestamp.fromDate(new Date(item.createdAt)),
        });
      }
      for (const b of seeded.batches) {
        batch.set(doc(db, 'stockBatches', b.id), {
          ...b,
          dateReceived: Timestamp.fromDate(new Date(b.dateReceived)),
          expiryDate: b.expiryDate ? Timestamp.fromDate(new Date(b.expiryDate)) : null,
          createdAt: Timestamp.fromDate(new Date(b.createdAt)),
        });
      }
      for (const m of seeded.movements) {
        batch.set(doc(db, 'stockMovements', m.id), {
          ...m,
          timestamp: Timestamp.fromDate(new Date(m.timestamp)),
        });
      }
      for (const r of seeded.requisitions) {
        batch.set(doc(db, 'requisitions', r.id), {
          ...r,
          createdAt: Timestamp.fromDate(new Date(r.createdAt)),
          issuedAt: r.issuedAt ? Timestamp.fromDate(new Date(r.issuedAt)) : null,
        });
      }
      for (const a of seeded.alerts) {
        batch.set(doc(db, 'alerts', a.id), {
          ...a,
          createdAt: Timestamp.fromDate(new Date(a.createdAt)),
        });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'demoSeedBatch');
    }
  } else {
    saveLocalStore(seeded);
  }

  return {
    itemCount: seeded.items.length,
    batchCount: seeded.batches.length,
    movementCount: seeded.movements.length,
    requisitionCount: seeded.requisitions.length,
    alertCount: seeded.alerts.length,
    supplierCount: seeded.suppliers.length,
    purchaseCount: seeded.purchases.length,
  };
}

// ==========================================
// MODULE 3: SUPPLIER LEDGER FUNCTIONS
// ==========================================

export function generateNextPurchaseNumber(existingPurchases: Purchase[]): string {
  let highest = 0;
  for (const p of existingPurchases) {
    const match = p.purchaseNumber.match(/PUR-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  }
  return `PUR-${String(highest + 1).padStart(4, '0')}`;
}

export async function createSupplier(
  actor: AppUser,
  input: {
    name: string;
    contactPerson: string;
    phone: string;
    email?: string | null;
    address: string;
    tin: string;
    notes?: string;
  }
): Promise<Supplier> {
  assertWriteRole(actor);
  const cleanName = input.name.trim();
  const cleanContact = input.contactPerson.trim();
  const cleanPhone = input.phone.trim();
  const cleanAddress = input.address.trim();
  const cleanTin = input.tin.trim().toUpperCase();

  if (cleanName.length < 2) throw new Error('Supplier name must be at least 2 characters.');
  if (cleanContact.length < 2) throw new Error('Contact person name must be at least 2 characters.');
  if (!validateGhanaPhone(cleanPhone)) {
    throw new Error('Please enter a valid Ghanaian phone number (e.g. 024 XXX XXXX or +233...).');
  }
  if (!validateGhanaTin(cleanTin)) {
    throw new Error('Please enter a valid Tax Identification Number (TIN).');
  }

  const supplierId = `sup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newSupplier: Supplier = {
    id: supplierId,
    name: cleanName,
    contactPerson: cleanContact,
    phone: cleanPhone,
    email: input.email?.trim() || null,
    address: cleanAddress,
    tin: cleanTin,
    notes: input.notes?.trim() || '',
    isActive: true,
    createdAt: nowIso,
  };

  if (isLiveFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'suppliers', supplierId), {
        ...newSupplier,
        createdAt: Timestamp.fromDate(new Date(nowIso)),
      });
      return newSupplier;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `suppliers/${supplierId}`);
    }
  }

  const snapshot = ensureLocalStoreInitialized();
  snapshot.suppliers.unshift(newSupplier);
  saveLocalStore(snapshot);
  return newSupplier;
}

export async function updateSupplier(
  actor: AppUser,
  supplierId: string,
  updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>
): Promise<Supplier> {
  assertWriteRole(actor);

  if (updates.phone && !validateGhanaPhone(updates.phone)) {
    throw new Error('Please enter a valid Ghanaian phone number (e.g. 024 XXX XXXX or +233...).');
  }
  if (updates.tin && !validateGhanaTin(updates.tin)) {
    throw new Error('Please enter a valid Tax Identification Number (TIN).');
  }

  if (isLiveFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'suppliers', supplierId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suppliers/${supplierId}`);
    }
  }

  const snapshot = ensureLocalStoreInitialized();
  const idx = snapshot.suppliers.findIndex((s) => s.id === supplierId);
  if (idx === -1) throw new Error('Supplier record not found.');

  snapshot.suppliers[idx] = {
    ...snapshot.suppliers[idx],
    ...updates,
  };
  saveLocalStore(snapshot);
  return snapshot.suppliers[idx];
}

export async function recordPurchaseDeliveryTransaction(
  actor: AppUser,
  input: {
    supplierId: string;
    supplierName: string;
    dateSupplied: string;
    dueDate: string;
    invoiceNumber?: string | null;
    lines: {
      itemId: string;
      itemName: string;
      unit: StockUnit;
      quantity: number;
      costPerUnit: number;
      taxCategory?: TaxCategory;
      expiryDate?: string | null;
    }[];
    amountPaid: number;
    paymentMethod: PaymentMethod | null;
    paymentReference?: string;
  }
): Promise<{
  purchase: Purchase;
  batches: StockBatch[];
  movements: StockMovement[];
  payment: SupplierPayment | null;
}> {
  assertWriteRole(actor);

  if (!input.lines || input.lines.length === 0) {
    throw new Error('Please add at least one line item to the purchase delivery.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const taxSettings = snapshot.taxSettings || DEFAULT_TAX_SETTINGS;

  let subtotal = 0;
  let standardNet = 0;
  let vatAmount = 0;
  let nhilAmount = 0;
  let getfundAmount = 0;

  const calculatedLines: PurchaseLine[] = input.lines.map((l) => {
    const itm = snapshot.items.find((i) => i.id === l.itemId);
    const taxCat = l.taxCategory || itm?.taxCategory || 'standard';
    const qty = Math.round(Number(l.quantity) * 100) / 100;
    const cost = Math.round(Number(l.costPerUnit) * 100) / 100;
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Quantity for ${l.itemName} must be greater than 0.`);
    }
    if (isNaN(cost) || cost < 0) {
      throw new Error(`Cost per unit for ${l.itemName} must be 0 or greater.`);
    }

    const lineGrossOrNet = Math.round(qty * cost * 100) / 100;
    subtotal += lineGrossOrNet;

    let lineTaxable = lineGrossOrNet;
    let lineVat = 0;
    let lineNhil = 0;
    let lineGetfund = 0;

    if (taxSettings.isVatRegistered && taxCat === 'standard') {
      if (taxSettings.pricesEnteredAs === 'inclusive') {
        lineTaxable = Math.round((lineGrossOrNet / 1.20) * 100) / 100;
      }
      lineVat = Math.round(lineTaxable * (taxSettings.vatRate / 100) * 100) / 100;
      lineNhil = Math.round(lineTaxable * (taxSettings.nhilRate / 100) * 100) / 100;
      lineGetfund = Math.round(lineTaxable * (taxSettings.getfundRate / 100) * 100) / 100;
      standardNet += lineTaxable;
      vatAmount += lineVat;
      nhilAmount += lineNhil;
      getfundAmount += lineGetfund;
    } else {
      lineTaxable = lineGrossOrNet;
    }

    return {
      itemId: l.itemId,
      itemName: l.itemName,
      unit: l.unit,
      quantity: qty,
      costPerUnit: cost,
      lineTotal: lineGrossOrNet,
      expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString().split('T')[0] : null,
      taxCategory: taxCat,
      taxableAmount: lineTaxable,
      vatAmount: lineVat,
      nhilAmount: lineNhil,
      getfundAmount: lineGetfund,
    };
  });

  const totalTax = Math.round((vatAmount + nhilAmount + getfundAmount) * 100) / 100;
  const totalWithTax =
    taxSettings.pricesEnteredAs === 'inclusive'
      ? Math.round(subtotal * 100) / 100
      : Math.round((subtotal + totalTax) * 100) / 100;

  const paidNow = Math.round(Number(input.amountPaid) * 100) / 100;

  if (isNaN(paidNow) || paidNow < 0) {
    throw new Error('Amount paid must be 0 or a positive number.');
  }
  if (paidNow > totalWithTax) {
    throw new Error(
      `Amount paid (GH₵ ${paidNow.toFixed(2)}) cannot exceed total payable with tax (GH₵ ${totalWithTax.toFixed(2)}).`
    );
  }

  if (paidNow > 0 && !input.paymentMethod) {
    throw new Error('Please select a payment method for the initial payment.');
  }

  if (paidNow > 0 && input.paymentMethod === 'cheque' && !input.paymentReference?.trim()) {
    throw new Error('Cheque number is required when payment method is Cheque.');
  }
  if (paidNow > 0 && input.paymentMethod === 'momo' && !input.paymentReference?.trim()) {
    throw new Error('Mobile Money transaction reference is required for MoMo payments.');
  }

  const arrears = Math.max(0, Math.round((totalWithTax - paidNow) * 100) / 100);
  const paymentStatus: PaymentStatus = arrears === 0 ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid';

  const nextNumber = generateNextPurchaseNumber(snapshot.purchases);
  const purchaseId = `pur_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newPurchase: Purchase = {
    id: purchaseId,
    purchaseNumber: nextNumber,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    dateSupplied: input.dateSupplied,
    dueDate: input.dueDate,
    invoiceNumber: input.invoiceNumber?.trim() || null,
    lines: calculatedLines,
    subtotal: Math.round(subtotal * 100) / 100,
    amountPaid: paidNow,
    arrears,
    paymentStatus,
    paymentMethod: input.paymentMethod,
    recordedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    createdAt: nowIso,
    taxableAmount: Math.round(standardNet * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    nhilAmount: Math.round(nhilAmount * 100) / 100,
    getfundAmount: Math.round(getfundAmount * 100) / 100,
    totalTax,
    totalWithTax,
  };

  const createdBatches: StockBatch[] = [];
  const createdMovements: StockMovement[] = [];
  const generatedAlerts: StockAlert[] = [];

  for (const line of calculatedLines) {
    const batchId = `bat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const movementId = `mov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const newBatch: StockBatch = {
      id: batchId,
      itemId: line.itemId,
      quantityReceived: line.quantity,
      quantityRemaining: line.quantity,
      costPerUnit: line.costPerUnit,
      dateReceived: input.dateSupplied,
      expiryDate: line.expiryDate,
      supplierId: input.supplierId,
      purchaseId: purchaseId,
      createdAt: nowIso,
    };
    createdBatches.push(newBatch);

    const newMovement: StockMovement = {
      id: movementId,
      itemId: line.itemId,
      batchId,
      type: 'received',
      quantity: line.quantity,
      userId: actor.uid,
      userName: actor.name,
      timestamp: nowIso,
      note: `Received from ${input.supplierName} via ${nextNumber}${
        input.invoiceNumber ? ` (Inv: ${input.invoiceNumber})` : ''
      }.`,
    };
    createdMovements.push(newMovement);

    // Resolve open low/finished alerts if item is now back above reorder level
    const targetItem = snapshot.items.find((i) => i.id === line.itemId);
    if (targetItem) {
      const currentRemaining = snapshot.batches
        .filter((b) => b.itemId === line.itemId)
        .reduce((sum, b) => sum + (Number(b.quantityRemaining) || 0), 0);
      const newTotal = currentRemaining + line.quantity;

      if (newTotal > targetItem.reorderLevel) {
        for (const a of snapshot.alerts) {
          if (
            a.itemId === line.itemId &&
            !a.resolved &&
            (a.type === 'low_stock' || a.type === 'finished_stock')
          ) {
            a.resolved = true;
          }
        }
        const updatedAlert: StockAlert = {
          id: `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'stock_updated',
          itemId: targetItem.id,
          itemName: targetItem.name,
          message: `Stock Replenished: ${targetItem.name} received ${line.quantity} ${targetItem.unit}. Total is now ${newTotal} ${targetItem.unit} (Above reorder level of ${targetItem.reorderLevel}).`,
          severity: 'info',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: nowIso,
          readBy: [],
          resolved: false,
        };
        generatedAlerts.push(updatedAlert);
      }
    }
  }

  let paymentRecord: SupplierPayment | null = null;
  if (paidNow > 0 && input.paymentMethod) {
    paymentRecord = {
      id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      purchaseId,
      purchaseNumber: nextNumber,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      amount: paidNow,
      method: input.paymentMethod,
      reference: input.paymentReference?.trim() || 'INITIAL-DELIVERY-PAYMENT',
      paidOn: input.dateSupplied,
      recordedBy: {
        userId: actor.uid,
        userName: actor.name,
      },
      note: 'Initial payment recorded during delivery receipt.',
      createdAt: nowIso,
    };
  }

  snapshot.purchases.unshift(newPurchase);
  snapshot.batches.unshift(...createdBatches);
  snapshot.movements.unshift(...createdMovements);
  if (paymentRecord) {
    snapshot.supplierPayments.unshift(paymentRecord);
  }
  snapshot.alerts.unshift(...generatedAlerts);

  applyPurchaseToTaxSummaries(newPurchase, snapshot);

  saveLocalStore(snapshot);

  return {
    purchase: newPurchase,
    batches: createdBatches,
    movements: createdMovements,
    payment: paymentRecord,
  };
}

export async function recordSupplierPaymentTransaction(
  actor: AppUser,
  input: {
    purchaseId: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
    paidOn: string;
    note?: string;
  }
): Promise<{ payment: SupplierPayment; updatedPurchase: Purchase }> {
  assertWriteRole(actor);

  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  if (input.method === 'cheque' && !input.reference.trim()) {
    throw new Error('Cheque number is required for Cheque payments.');
  }
  if (input.method === 'momo' && !input.reference.trim()) {
    throw new Error('Transaction ID / MoMo Reference is required for Mobile Money payments.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const pIdx = snapshot.purchases.findIndex((p) => p.id === input.purchaseId);
  if (pIdx === -1) throw new Error('Purchase record not found.');

  const purchase = snapshot.purchases[pIdx];

  if (purchase.arrears <= 0) {
    throw new Error(
      `Purchase ${purchase.purchaseNumber} is already fully paid. No outstanding balance remains.`
    );
  }

  // Block overpayment: amount cannot exceed arrears
  if (amount > purchase.arrears) {
    throw new Error(
      `Overpayment blocked: Payment of GH₵ ${amount.toFixed(
        2
      )} exceeds outstanding arrears of GH₵ ${purchase.arrears.toFixed(2)}.`
    );
  }

  const nowIso = new Date().toISOString();
  const newAmountPaid = Math.round((purchase.amountPaid + amount) * 100) / 100;
  const grossPayable = purchase.totalWithTax ?? purchase.subtotal;
  const newArrears = Math.max(0, Math.round((grossPayable - newAmountPaid) * 100) / 100);
  const newStatus: PaymentStatus = newArrears === 0 ? 'paid' : 'partial';

  const newPayment: SupplierPayment = {
    id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    purchaseId: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    supplierId: purchase.supplierId,
    supplierName: purchase.supplierName,
    amount,
    method: input.method,
    reference: input.reference.trim(),
    paidOn: input.paidOn,
    recordedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    note: input.note?.trim() || `Settlement towards ${purchase.purchaseNumber}`,
    createdAt: nowIso,
  };

  const updatedPurchase: Purchase = {
    ...purchase,
    amountPaid: newAmountPaid,
    arrears: newArrears,
    paymentStatus: newStatus,
    paymentMethod: input.method,
  };

  // If fully paid, automatically resolve any due-date alerts for this purchase
  if (newArrears === 0) {
    for (const a of snapshot.alerts) {
      if (a.purchaseId === purchase.id && !a.resolved) {
        a.resolved = true;
      }
    }
  }

  snapshot.purchases[pIdx] = updatedPurchase;
  snapshot.supplierPayments.unshift(newPayment);
  saveLocalStore(snapshot);

  return { payment: newPayment, updatedPurchase };
}

export function checkDueDateAlerts(
  actor: AppUser,
  purchases: Purchase[],
  alerts: StockAlert[]
): StockAlert[] {
  if (actor.role === 'staff') return alerts;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr).getTime();
  const generated: StockAlert[] = [];

  for (const pur of purchases) {
    if (pur.arrears <= 0) {
      // If purchase has 0 arrears, mark open due alerts resolved
      for (const a of alerts) {
        if (a.purchaseId === pur.id && !a.resolved) {
          a.resolved = true;
        }
      }
      continue;
    }

    const dueMs = new Date(pur.dueDate).getTime();
    const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Overdue!
      const existingUnresolved = alerts.find(
        (a) => a.purchaseId === pur.id && a.type === 'payment_overdue' && !a.resolved
      );
      if (!existingUnresolved) {
        const daysPast = Math.abs(diffDays);
        generated.push({
          id: `alt_due_${Date.now()}_${pur.id}`,
          type: 'payment_overdue',
          purchaseId: pur.id,
          purchaseNumber: pur.purchaseNumber,
          supplierId: pur.supplierId,
          message: `Critical: Payment of GH₵ ${pur.arrears.toFixed(2)} to ${
            pur.supplierName
          } for ${pur.purchaseNumber} is OVERDUE (${daysPast} ${
            daysPast === 1 ? 'day' : 'days'
          } past due).`,
          severity: 'critical',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: new Date().toISOString(),
          readBy: [],
          resolved: false,
        });
      }
    } else if (diffDays <= 3) {
      // Due within 3 days
      const existingUnresolved = alerts.find(
        (a) =>
          a.purchaseId === pur.id &&
          (a.type === 'payment_due_soon' || a.type === 'payment_overdue') &&
          !a.resolved
      );
      if (!existingUnresolved) {
        generated.push({
          id: `alt_due_${Date.now()}_${pur.id}`,
          type: 'payment_due_soon',
          purchaseId: pur.id,
          purchaseNumber: pur.purchaseNumber,
          supplierId: pur.supplierId,
          message: `Warning: Payment of GH₵ ${pur.arrears.toFixed(2)} to ${
            pur.supplierName
          } for ${pur.purchaseNumber} is due ${
            diffDays === 0 ? 'today' : `in ${diffDays} days`
          } (${pur.dueDate}).`,
          severity: 'warning',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: new Date().toISOString(),
          readBy: [],
          resolved: false,
        });
      }
    }
  }

  if (generated.length > 0) {
    const snapshot = ensureLocalStoreInitialized();
    snapshot.alerts.unshift(...generated);
    saveLocalStore(snapshot);
    return snapshot.alerts;
  }

  return alerts;
}

export function enrichSuppliers(
  suppliers: Supplier[],
  purchases: Purchase[],
  payments: SupplierPayment[]
): EnrichedSupplier[] {
  return suppliers.map((sup) => {
    const supPurchases = purchases.filter((p) => p.supplierId === sup.id);
    const totalSuppliedGhs = supPurchases.reduce((sum, p) => sum + (Number(p.totalWithTax ?? p.subtotal) || 0), 0);
    const totalArrearsGhs = supPurchases.reduce((sum, p) => sum + (Number(p.arrears) || 0), 0);
    const totalPaidGhs = supPurchases.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

    let lastDeliveryDate: string | null = null;
    for (const p of supPurchases) {
      if (!lastDeliveryDate || new Date(p.dateSupplied) > new Date(lastDeliveryDate)) {
        lastDeliveryDate = p.dateSupplied;
      }
    }

    return {
      ...sup,
      totalSuppliedGhs,
      totalPaidGhs,
      totalArrearsGhs,
      lastDeliveryDate,
      deliveryCount: supPurchases.length,
    };
  });
}

// ==========================================
// MODULE 4: TAX ENGINE & STATUTORY VAT (ACT 1151)
// ==========================================

export function getTaxSettings(): TaxSettings {
  const snapshot = ensureLocalStoreInitialized();
  return snapshot.taxSettings || DEFAULT_TAX_SETTINGS;
}

export async function updateTaxSettings(
  actor: AppUser,
  updates: Partial<TaxSettings>,
  note?: string
): Promise<TaxSettings> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only Restaurant Managers can modify tax settings.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const current = snapshot.taxSettings || DEFAULT_TAX_SETTINGS;

  const newSettings: TaxSettings = {
    ...current,
    ...updates,
    updatedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    updatedAt: new Date().toISOString(),
  };

  const historyEntry: TaxSettingsHistory = {
    id: `txh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    settings: newSettings,
    changedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    changedAt: new Date().toISOString(),
    note: note?.trim() || 'Updated tax parameters following GRA regulations.',
  };

  const rawHistory = localStorage.getItem(LOCAL_TAX_HISTORY_KEY);
  const history: TaxSettingsHistory[] = rawHistory ? JSON.parse(rawHistory) : [];
  history.unshift(historyEntry);
  localStorage.setItem(LOCAL_TAX_HISTORY_KEY, JSON.stringify(history));

  snapshot.taxSettings = newSettings;
  saveLocalStore(snapshot);

  return newSettings;
}

export function getTaxSettingsHistory(): TaxSettingsHistory[] {
  const rawHistory = localStorage.getItem(LOCAL_TAX_HISTORY_KEY);
  if (!rawHistory) return [];
  try {
    return JSON.parse(rawHistory) as TaxSettingsHistory[];
  } catch {
    return [];
  }
}

export function calculateTaxForPurchaseLines(
  lines: Array<{
    itemId: string;
    quantity: number;
    costPerUnit: number;
    taxCategory?: TaxCategory;
  }>,
  settings: TaxSettings,
  stockItems: StockItem[]
): {
  calculatedLines: PurchaseLine[];
  subtotal: number;
  taxableAmount: number;
  vatAmount: number;
  nhilAmount: number;
  getfundAmount: number;
  totalTax: number;
  totalWithTax: number;
} {
  let subtotal = 0;
  let standardNet = 0;
  let vatAmount = 0;
  let nhilAmount = 0;
  let getfundAmount = 0;

  const calculatedLines: PurchaseLine[] = lines.map((l) => {
    const itm = stockItems.find((i) => i.id === l.itemId);
    const taxCat = l.taxCategory || itm?.taxCategory || 'standard';
    const qty = Math.round(Number(l.quantity) * 100) / 100;
    const cost = Math.round(Number(l.costPerUnit) * 100) / 100;
    const lineGrossOrNet = Math.round(qty * cost * 100) / 100;
    subtotal += lineGrossOrNet;

    let lineTaxable = lineGrossOrNet;
    let lineVat = 0;
    let lineNhil = 0;
    let lineGetfund = 0;

    if (settings.isVatRegistered && taxCat === 'standard') {
      if (settings.pricesEnteredAs === 'inclusive') {
        // lineGrossOrNet is inclusive of 20% (15% VAT + 2.5% NHIL + 2.5% GETFund)
        lineTaxable = Math.round((lineGrossOrNet / 1.20) * 100) / 100;
      }
      lineVat = Math.round(lineTaxable * (settings.vatRate / 100) * 100) / 100;
      lineNhil = Math.round(lineTaxable * (settings.nhilRate / 100) * 100) / 100;
      lineGetfund = Math.round(lineTaxable * (settings.getfundRate / 100) * 100) / 100;
      standardNet += lineTaxable;
      vatAmount += lineVat;
      nhilAmount += lineNhil;
      getfundAmount += lineGetfund;
    } else {
      lineTaxable = lineGrossOrNet;
    }

    return {
      itemId: l.itemId,
      itemName: itm?.name || 'Item',
      unit: itm?.unit || 'kg',
      quantity: qty,
      costPerUnit: cost,
      lineTotal: lineGrossOrNet,
      expiryDate: null,
      taxCategory: taxCat,
      taxableAmount: lineTaxable,
      vatAmount: lineVat,
      nhilAmount: lineNhil,
      getfundAmount: lineGetfund,
    };
  });

  const totalTax = Math.round((vatAmount + nhilAmount + getfundAmount) * 100) / 100;
  const totalWithTax =
    settings.pricesEnteredAs === 'inclusive'
      ? Math.round(subtotal * 100) / 100
      : Math.round((subtotal + totalTax) * 100) / 100;

  return {
    calculatedLines,
    subtotal: Math.round(subtotal * 100) / 100,
    taxableAmount: Math.round(standardNet * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    nhilAmount: Math.round(nhilAmount * 100) / 100,
    getfundAmount: Math.round(getfundAmount * 100) / 100,
    totalTax,
    totalWithTax,
  };
}

export function applyPurchaseToTaxSummaries(purchase: Purchase, snapshot: StockSnapshot) {
  if (!snapshot.taxSummaries) snapshot.taxSummaries = [];
  const pIds = getTaxPeriodIds(purchase.dateSupplied);

  const getOrCreate = (
    id: string,
    period: string,
    periodType: 'day' | 'week' | 'month',
    startDate: string,
    endDate: string
  ): TaxSummary => {
    let s = snapshot.taxSummaries!.find((item) => item.id === id);
    if (!s) {
      s = {
        id,
        period,
        periodType,
        startDate,
        endDate,
        standardPurchasesNet: 0,
        exemptPurchases: 0,
        zeroRatedPurchases: 0,
        vatInput: 0,
        nhilInput: 0,
        getfundInput: 0,
        totalInputTax: 0,
        purchasesGross: 0,
        stockOutValue: 0,
        purchaseCount: 0,
      };
      snapshot.taxSummaries!.push(s);
    }
    return s;
  };

  const targets = [
    getOrCreate(pIds.dayId, pIds.dayPeriod, 'day', purchase.dateSupplied, purchase.dateSupplied),
    getOrCreate(pIds.weekId, pIds.weekPeriod, 'week', pIds.weekStart, pIds.weekEnd),
    getOrCreate(pIds.monthId, pIds.monthPeriod, 'month', pIds.monthStart, pIds.monthEnd),
  ];

  let stdNet = 0;
  let exemptNet = 0;
  let zeroNet = 0;

  for (const l of purchase.lines) {
    if (l.taxCategory === 'standard') {
      stdNet += l.taxableAmount ?? l.lineTotal;
    } else if (l.taxCategory === 'exempt') {
      exemptNet += l.lineTotal;
    } else {
      zeroNet += l.lineTotal;
    }
  }

  for (const s of targets) {
    s.standardPurchasesNet = Math.round((s.standardPurchasesNet + stdNet) * 100) / 100;
    s.exemptPurchases = Math.round((s.exemptPurchases + exemptNet) * 100) / 100;
    s.zeroRatedPurchases = Math.round((s.zeroRatedPurchases + zeroNet) * 100) / 100;
    s.vatInput = Math.round((s.vatInput + (purchase.vatAmount || 0)) * 100) / 100;
    s.nhilInput = Math.round((s.nhilInput + (purchase.nhilAmount || 0)) * 100) / 100;
    s.getfundInput = Math.round((s.getfundInput + (purchase.getfundAmount || 0)) * 100) / 100;
    s.totalInputTax = Math.round((s.totalInputTax + (purchase.totalTax || 0)) * 100) / 100;
    s.purchasesGross = Math.round((s.purchasesGross + (purchase.totalWithTax || purchase.subtotal)) * 100) / 100;
    s.purchaseCount += 1;
  }
}

export function applyStockOutToTaxSummaries(
  timestamp: string,
  costValue: number,
  snapshot: StockSnapshot
) {
  if (costValue <= 0) return;
  if (!snapshot.taxSummaries) snapshot.taxSummaries = [];
  const pIds = getTaxPeriodIds(timestamp.slice(0, 10));

  const getOrCreate = (
    id: string,
    period: string,
    periodType: 'day' | 'week' | 'month',
    startDate: string,
    endDate: string
  ): TaxSummary => {
    let s = snapshot.taxSummaries!.find((item) => item.id === id);
    if (!s) {
      s = {
        id,
        period,
        periodType,
        startDate,
        endDate,
        standardPurchasesNet: 0,
        exemptPurchases: 0,
        zeroRatedPurchases: 0,
        vatInput: 0,
        nhilInput: 0,
        getfundInput: 0,
        totalInputTax: 0,
        purchasesGross: 0,
        stockOutValue: 0,
        purchaseCount: 0,
      };
      snapshot.taxSummaries!.push(s);
    }
    return s;
  };

  const targets = [
    getOrCreate(pIds.dayId, pIds.dayPeriod, 'day', timestamp.slice(0, 10), timestamp.slice(0, 10)),
    getOrCreate(pIds.weekId, pIds.weekPeriod, 'week', pIds.weekStart, pIds.weekEnd),
    getOrCreate(pIds.monthId, pIds.monthPeriod, 'month', pIds.monthStart, pIds.monthEnd),
  ];

  for (const s of targets) {
    s.stockOutValue = Math.round((s.stockOutValue + costValue) * 100) / 100;
  }
}

export function rebuildTaxSummariesFromPurchases(snapshot: StockSnapshot) {
  snapshot.taxSummaries = [];
  for (const p of snapshot.purchases) {
    applyPurchaseToTaxSummaries(p, snapshot);
  }
  for (const req of snapshot.requisitions) {
    if (req.status === 'issued' && req.issuedAt) {
      let costValue = 0;
      for (const line of req.lines) {
        costValue += (line.quantityIssued || 0) * 35;
      }
      if (costValue > 0) {
        applyStockOutToTaxSummaries(req.issuedAt, costValue, snapshot);
      }
    }
  }
}

export async function recalculateAllPurchasesTax(actor: AppUser): Promise<{ updatedCount: number }> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only Restaurant Managers can recalculate tax for all purchases.');
  }

  const snapshot = ensureLocalStoreInitialized();
  const settings = snapshot.taxSettings || DEFAULT_TAX_SETTINGS;
  let updatedCount = 0;

  for (let i = 0; i < snapshot.purchases.length; i++) {
    const p = snapshot.purchases[i];
    const calc = calculateTaxForPurchaseLines(
      p.lines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        costPerUnit: l.costPerUnit,
        taxCategory: l.taxCategory,
      })),
      settings,
      snapshot.items
    );

    const arrears = Math.max(0, Math.round((calc.totalWithTax - p.amountPaid) * 100) / 100);
    const paymentStatus: PaymentStatus =
      arrears === 0 ? 'paid' : p.amountPaid > 0 ? 'partial' : 'unpaid';

    snapshot.purchases[i] = {
      ...p,
      lines: p.lines.map((l, idx) => ({
        ...l,
        taxCategory: calc.calculatedLines[idx]?.taxCategory || 'standard',
        taxableAmount: calc.calculatedLines[idx]?.taxableAmount || l.lineTotal,
        vatAmount: calc.calculatedLines[idx]?.vatAmount || 0,
        nhilAmount: calc.calculatedLines[idx]?.nhilAmount || 0,
        getfundAmount: calc.calculatedLines[idx]?.getfundAmount || 0,
      })),
      subtotal: calc.subtotal,
      taxableAmount: calc.taxableAmount,
      vatAmount: calc.vatAmount,
      nhilAmount: calc.nhilAmount,
      getfundAmount: calc.getfundAmount,
      totalTax: calc.totalTax,
      totalWithTax: calc.totalWithTax,
      arrears,
      paymentStatus,
    };
    updatedCount++;
  }

  rebuildTaxSummariesFromPurchases(snapshot);
  saveLocalStore(snapshot);

  return { updatedCount };
}

export function getTaxSummaries(): TaxSummary[] {
  const snapshot = ensureLocalStoreInitialized();
  return snapshot.taxSummaries || [];
}

export function getTaxReturns(): TaxReturn[] {
  const snapshot = ensureLocalStoreInitialized();
  return snapshot.taxReturns || [];
}

export async function fileTaxReturn(actor: AppUser, returnId: string): Promise<TaxReturn> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only Restaurant Managers can file tax returns.');
  }

  const snapshot = ensureLocalStoreInitialized();
  if (!snapshot.taxReturns) snapshot.taxReturns = [];
  const retIdx = snapshot.taxReturns.findIndex((r) => r.id === returnId);
  if (retIdx === -1) {
    throw new Error('Tax return record not found.');
  }

  const target = snapshot.taxReturns[retIdx];
  if (target.status === 'Filed') {
    throw new Error(`Return for period ${target.periodLabel} is already filed (Ref: ${target.referenceNumber}). Filed returns are immutable.`);
  }

  const nowIso = new Date().toISOString();
  const ref = `RET-${target.period}`;

  const updated: TaxReturn = {
    ...target,
    status: 'Filed',
    filedBy: {
      userId: actor.uid,
      userName: actor.name,
    },
    filedAt: nowIso,
    referenceNumber: ref,
    isSimulatedFiling: true,
  };

  snapshot.taxReturns[retIdx] = updated;

  // Resolve any tax_return alerts for this period
  for (const a of snapshot.alerts) {
    if (a.taxReturnPeriod === target.period && !a.resolved) {
      a.resolved = true;
    }
  }

  saveLocalStore(snapshot);
  return updated;
}

export function checkTaxReturnAlerts(
  actor: AppUser,
  returns: TaxReturn[],
  alerts: StockAlert[]
): StockAlert[] {
  if (actor.role === 'staff') return alerts;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr).getTime();
  const generated: StockAlert[] = [];

  for (const ret of returns) {
    if (ret.status === 'Filed') {
      // Resolve any open alert for this period
      for (const a of alerts) {
        if (a.taxReturnPeriod === ret.period && !a.resolved) {
          a.resolved = true;
        }
      }
      continue;
    }

    const dueMs = new Date(ret.dueDate).getTime();
    const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Overdue
      const existing = alerts.find(
        (a) => a.taxReturnPeriod === ret.period && a.type === 'tax_return_overdue' && !a.resolved
      );
      if (!existing) {
        const daysPast = Math.abs(diffDays);
        generated.push({
          id: `alt_ret_${Date.now()}_${ret.period}`,
          type: 'tax_return_overdue',
          taxReturnPeriod: ret.period,
          message: `Critical: GRA Monthly VAT Return for ${ret.periodLabel} is OVERDUE (${daysPast} ${
            daysPast === 1 ? 'day' : 'days'
          } past due date ${ret.dueDate}). Immediate simulated submission required.`,
          severity: 'critical',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: new Date().toISOString(),
          readBy: [],
          resolved: false,
        });
      }
    } else if (diffDays <= 5) {
      // Due within 5 days
      const existing = alerts.find(
        (a) =>
          a.taxReturnPeriod === ret.period &&
          (a.type === 'tax_return_due_soon' || a.type === 'tax_return_overdue') &&
          !a.resolved
      );
      if (!existing) {
        generated.push({
          id: `alt_ret_${Date.now()}_${ret.period}`,
          type: 'tax_return_due_soon',
          taxReturnPeriod: ret.period,
          message: `Warning: GRA Monthly VAT Return for ${ret.periodLabel} is due ${
            diffDays === 0 ? 'today' : `in ${diffDays} days`
          } (${ret.dueDate}).`,
          severity: 'warning',
          triggeredBy: {
            userId: actor.uid,
            userName: actor.name,
          },
          createdAt: new Date().toISOString(),
          readBy: [],
          resolved: false,
        });
      }
    }
  }

  if (generated.length > 0) {
    const snapshot = ensureLocalStoreInitialized();
    snapshot.alerts.unshift(...generated);
    saveLocalStore(snapshot);
    return snapshot.alerts;
  }

  return alerts;
}

