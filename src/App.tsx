import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';
import {
  AppUser,
  EnrichedStockItem,
  Purchase,
  Requisition,
  StockAlert,
  StockBatch,
  StockItem,
  StockMovement,
  Supplier,
  SupplierPayment,
  TaxSummary,
  TaxReturn,
} from './types/stock';
import {
  subscribeToAuthChanges,
  loginWithEmailPassword,
  logoutCurrentUser,
  fetchAllUsers,
} from './services/authService';
import {
  subscribeToStockData,
  enrichStockItems,
  markAlertAsRead,
  markAllAlertsAsRead,
  checkDueDateAlerts,
  checkTaxReturnAlerts,
  getTaxSummaries,
  getTaxReturns,
} from './services/stockService';
import { validateFirestoreConnection } from './services/firebase';
import {
  AppRouteId,
  getDefaultRouteForRole,
  isRouteAllowedForRole,
} from './utils/formatters';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StockListPage } from './pages/StockListPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { MovementsPage } from './pages/MovementsPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { NewRequisitionPage } from './pages/NewRequisitionPage';
import { MyRequisitionsPage } from './pages/MyRequisitionsPage';
import { RequisitionDetailPage } from './pages/RequisitionDetailPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierDetailPage } from './pages/SupplierDetailPage';
import { SupplierStatementPage } from './pages/SupplierStatementPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { AlertsPage } from './pages/AlertsPage';
import { UsersPage } from './pages/UsersPage';
import { SecurityRulesPage } from './pages/SecurityRulesPage';
import { TaxOverviewPage } from './pages/TaxOverviewPage';
import { TaxReturnsPage } from './pages/TaxReturnsPage';
import { TaxSettingsPage } from './pages/TaxSettingsPage';

// Modals & Layout
import { Layout } from './components/Layout';
import {
  StockItemModal,
  ReceiveStockModal,
  RecordMovementModal,
  CreateRequisitionModal,
  IssueRequisitionModal,
  RejectRequisitionModal,
  DirectIssueModal,
} from './components/StockModals';
import {
  SupplierModal,
  RecordDeliveryModal,
  RecordPaymentModal,
} from './components/SupplierModals';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('stockline_gh_theme');
    if (saved) return saved === 'dark';
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stockline_gh_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stockline_gh_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [staffUsers, setStaffUsers] = useState<AppUser[]>([]);

  // Routing state
  const [activeRoute, setActiveRoute] = useState<AppRouteId>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Real-time stock & ledger data state
  const [rawItems, setRawItems] = useState<StockItem[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [taxSummaries, setTaxSummaries] = useState<TaxSummary[]>([]);
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Modal Visibility State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnrichedStockItem | null>(null);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivePreselectedItemId, setReceivePreselectedItemId] = useState<string | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementTargetItem, setMovementTargetItem] = useState<EnrichedStockItem | null>(null);
  const [movementTargetBatchId, setMovementTargetBatchId] = useState<string | undefined>(undefined);

  const [isCreateReqModalOpen, setIsCreateReqModalOpen] = useState(false);
  const [isIssueReqModalOpen, setIsIssueReqModalOpen] = useState(false);
  const [issueReqTarget, setIssueReqTarget] = useState<Requisition | null>(null);

  const [isRejectReqModalOpen, setIsRejectReqModalOpen] = useState(false);
  const [rejectReqTarget, setRejectReqTarget] = useState<Requisition | null>(null);

  const [isDirectIssueModalOpen, setIsDirectIssueModalOpen] = useState(false);

  // Supplier Ledger Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryPreselectedSupplierId, setDeliveryPreselectedSupplierId] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetSupplierId, setPaymentTargetSupplierId] = useState<string | null>(null);
  const [paymentTargetPurchase, setPaymentTargetPurchase] = useState<Purchase | null>(null);

  // Initialize and subscribe to Auth
  useEffect(() => {
    validateFirestoreConnection();
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setAuthInitialized(true);

      if (user) {
        // Enforce route bounds on login or account switch
        if (!isRouteAllowedForRole(user.role, activeRoute)) {
          setActiveRoute(getDefaultRouteForRole(user.role));
        }
      }
    });
    return unsubscribe;
  }, []);

  // Fetch staff users for direct issue modal
  useEffect(() => {
    if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'storekeeper')) {
      fetchAllUsers()
        .then((users) => setStaffUsers(users))
        .catch(() => {});
    }
  }, [currentUser]);

  // Subscribe to Stock & Ledger Data when authenticated
  useEffect(() => {
    if (!currentUser || !currentUser.isActive) {
      setRawItems([]);
      setBatches([]);
      setMovements([]);
      setRequisitions([]);
      setAlerts([]);
      setSuppliers([]);
      setPurchases([]);
      setSupplierPayments([]);
      return;
    }

    const unsubscribe = subscribeToStockData(currentUser, (snapshot) => {
      setRawItems(snapshot.items);
      setBatches(snapshot.batches);
      setMovements(snapshot.movements);
      setRequisitions(snapshot.requisitions);
      setAlerts(snapshot.alerts);
      setSuppliers(snapshot.suppliers || []);
      setPurchases(snapshot.purchases || []);
      setSupplierPayments(snapshot.supplierPayments || []);
      setTaxSummaries(snapshot.taxSummaries || []);
      setTaxReturns(snapshot.taxReturns || []);

      // Scan and trigger due-date and tax return alerts for storekeeper and manager
      if (currentUser.role === 'manager' || currentUser.role === 'storekeeper') {
        if (snapshot.purchases && snapshot.purchases.length > 0) {
          checkDueDateAlerts(currentUser, snapshot.purchases, snapshot.alerts);
        }
        if (snapshot.taxReturns && snapshot.taxReturns.length > 0) {
          checkTaxReturnAlerts(currentUser, snapshot.taxReturns, snapshot.alerts);
        }
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Derived enriched stock items (FIFO batches aggregated into items)
  const enrichedItems = useMemo(() => {
    return enrichStockItems(rawItems, batches);
  }, [rawItems, batches]);

  // Safe navigation handler enforcing role permissions
  const handleNavigate = useCallback(
    (targetRoute: AppRouteId) => {
      if (!currentUser) return;

      if (!isRouteAllowedForRole(currentUser.role, targetRoute)) {
        showToast(`Access Denied: Your role (${currentUser.role}) does not have permission to view ${targetRoute}.`);
        setActiveRoute(getDefaultRouteForRole(currentUser.role));
        return;
      }

      setActiveRoute(targetRoute);
    },
    [currentUser, showToast]
  );

  // Handlers for detailed views
  const handleSelectItemDetail = (itemId: string) => {
    setSelectedItemId(itemId);
    handleNavigate('stock-detail');
  };

  const handleSelectRequisitionDetail = (reqId: string) => {
    setSelectedRequisitionId(reqId);
    handleNavigate('requisition-detail');
  };

  const handleSelectSupplierDetail = (supId: string) => {
    setSelectedSupplierId(supId);
    handleNavigate('supplier-detail');
  };

  const handleSelectSupplierStatement = (supId: string) => {
    setSelectedSupplierId(supId);
    handleNavigate('supplier-statement');
  };

  // Quick account switch handler
  const handleQuickSwitchAccount = async (email: string, passwordPlain: string) => {
    try {
      const switched = await loginWithEmailPassword(email, passwordPlain);
      showToast(`Switched active session to ${switched.name} (${switched.role}).`);
      setActiveRoute(getDefaultRouteForRole(switched.role));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Switch account failed.');
    }
  };

  // Auth actions
  const handleLogin = async (email: string, passwordPlain: string) => {
    const user = await loginWithEmailPassword(email, passwordPlain);
    showToast(`Welcome back, ${user.name}! Authenticated as ${user.role}.`);
    setActiveRoute(getDefaultRouteForRole(user.role));
  };

  const handleLogout = async () => {
    await logoutCurrentUser();
    showToast('Signed out of StockLine.');
  };

  // Alerts actions
  const handleMarkAlertRead = async (alertId: string) => {
    if (!currentUser) return;
    try {
      await markAlertAsRead(currentUser, alertId);
      showToast('Stock alert marked as read.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update alert.');
    }
  };

  const handleMarkAllAlertsRead = async () => {
    if (!currentUser) return;
    try {
      await markAllAlertsAsRead(currentUser);
      showToast('All stock alerts marked as read.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to mark alerts as read.');
    }
  };

  // Loading splash while checking auth state
  if (!authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] dark:bg-[#0D1310]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#14532D] text-lg font-bold text-white shadow-md dark:bg-[#16A34A]">
            SL
          </div>
          <p className="mt-4 text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
            Initializing StockLine Ghana...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        isDark={isDark}
        onToggleDark={toggleDark}
      />
    );
  }

  // Selected item and requisition instances
  const selectedItem =
    enrichedItems.find((i) => i.id === selectedItemId) || enrichedItems[0] || null;

  const selectedRequisition =
    requisitions.find((r) => r.id === selectedRequisitionId) || requisitions[0] || null;

  const pendingRequisitionsCount = requisitions.filter((r) => r.status === 'pending').length;

  return (
    <>
      <Layout
        currentUser={currentUser}
        activeRoute={activeRoute}
        selectedItemName={activeRoute === 'stock-detail' ? selectedItem?.name : null}
        selectedRequisitionNumber={
          activeRoute === 'requisition-detail' ? selectedRequisition?.requisitionNumber : null
        }
        alerts={alerts}
        pendingRequisitionsCount={pendingRequisitionsCount}
        onNavigate={handleNavigate}
        onSelectItemDetail={handleSelectItemDetail}
        onLogout={handleLogout}
        onQuickSwitchAccount={handleQuickSwitchAccount}
        onOpenReceiveModal={() => {
          setReceivePreselectedItemId(null);
          setIsReceiveModalOpen(true);
        }}
        onOpenCreateReqModal={() => handleNavigate('new-requisition')}
        onMarkAlertAsRead={handleMarkAlertRead}
        onMarkAllAlertsAsRead={handleMarkAllAlertsRead}
        isDark={isDark}
        onToggleDark={toggleDark}
      >
        {/* Route Renderers with Role-Guards */}
        {activeRoute === 'dashboard' && (
          <DashboardPage
            currentUser={currentUser}
            items={enrichedItems}
            batches={batches}
            movements={movements}
            requisitions={requisitions}
            alerts={alerts}
            purchases={purchases}
            suppliers={suppliers}
            onNavigate={handleNavigate}
            onSelectItemDetail={handleSelectItemDetail}
            onSelectRequisitionDetail={handleSelectRequisitionDetail}
            onOpenReceiveModal={(itemId) => {
              setReceivePreselectedItemId(itemId || null);
              setIsReceiveModalOpen(true);
            }}
            onOpenDirectIssueModal={() => setIsDirectIssueModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'stock' && (
          <StockListPage
            currentUser={currentUser}
            items={enrichedItems}
            onSelectItemDetail={handleSelectItemDetail}
            onOpenAddItemModal={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            onOpenEditItemModal={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onOpenReceiveModal={(itemId) => {
              setReceivePreselectedItemId(itemId || null);
              setIsReceiveModalOpen(true);
            }}
            onOpenMovementModal={(item) => {
              setMovementTargetItem(item);
              setMovementTargetBatchId(undefined);
              setIsMovementModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'stock-detail' && (
          <StockDetailPage
            currentUser={currentUser}
            item={selectedItem}
            batches={batches}
            movements={movements}
            onBack={() => handleNavigate('stock')}
            onOpenEditItemModal={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onOpenReceiveModal={(itemId) => {
              setReceivePreselectedItemId(itemId);
              setIsReceiveModalOpen(true);
            }}
            onOpenMovementModal={(item, batchId) => {
              setMovementTargetItem(item);
              setMovementTargetBatchId(batchId);
              setIsMovementModalOpen(true);
            }}
          />
        )}

        {activeRoute === 'movements' && (
          <MovementsPage
            items={enrichedItems}
            movements={movements}
            onSelectItemDetail={handleSelectItemDetail}
            onOpenReceiveModal={() => {
              setReceivePreselectedItemId(null);
              setIsReceiveModalOpen(true);
            }}
          />
        )}

        {activeRoute === 'new-requisition' && (
          <NewRequisitionPage
            currentUser={currentUser}
            items={enrichedItems}
            onNavigateToMyRequisitions={() => handleNavigate('my-requisitions')}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'my-requisitions' && (
          <MyRequisitionsPage
            currentUser={currentUser}
            requisitions={requisitions}
            onSelectRequisitionDetail={handleSelectRequisitionDetail}
            onNavigateToNewRequisition={() => handleNavigate('new-requisition')}
          />
        )}

        {activeRoute === 'requisitions' && (
          <RequisitionsPage
            currentUser={currentUser}
            requisitions={requisitions}
            onSelectRequisitionDetail={handleSelectRequisitionDetail}
            onOpenDirectIssueModal={() => setIsDirectIssueModalOpen(true)}
          />
        )}

        {activeRoute === 'requisition-detail' && (
          <RequisitionDetailPage
            currentUser={currentUser}
            requisition={selectedRequisition}
            items={enrichedItems}
            batches={batches}
            movements={movements}
            onBack={() =>
              handleNavigate(currentUser.role === 'staff' ? 'my-requisitions' : 'requisitions')
            }
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'suppliers' && (
          <SuppliersPage
            currentUser={currentUser}
            suppliers={suppliers}
            purchases={purchases}
            payments={supplierPayments}
            onSelectSupplierDetail={handleSelectSupplierDetail}
            onSelectSupplierStatement={handleSelectSupplierStatement}
            onOpenAddSupplierModal={() => {
              setEditingSupplier(null);
              setIsSupplierModalOpen(true);
            }}
            onOpenEditSupplierModal={(sup) => {
              setEditingSupplier(sup);
              setIsSupplierModalOpen(true);
            }}
            onOpenRecordDeliveryModal={(supId) => {
              setDeliveryPreselectedSupplierId(supId || null);
              setIsDeliveryModalOpen(true);
            }}
            onOpenRecordPaymentModal={(supId) => {
              setPaymentTargetSupplierId(supId || null);
              setPaymentTargetPurchase(null);
              setIsPaymentModalOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'supplier-detail' && (
          <SupplierDetailPage
            currentUser={currentUser}
            supplier={suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null}
            purchases={purchases}
            payments={supplierPayments}
            onBack={() => handleNavigate('suppliers')}
            onOpenEditModal={(sup) => {
              setEditingSupplier(sup);
              setIsSupplierModalOpen(true);
            }}
            onOpenRecordDeliveryModal={(supId) => {
              setDeliveryPreselectedSupplierId(supId);
              setIsDeliveryModalOpen(true);
            }}
            onOpenRecordPaymentModal={(supId, purchase) => {
              setPaymentTargetSupplierId(supId);
              setPaymentTargetPurchase(purchase || null);
              setIsPaymentModalOpen(true);
            }}
            onNavigateToStatement={(supId) => handleSelectSupplierStatement(supId)}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'supplier-statement' && (
          <SupplierStatementPage
            supplier={suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null}
            purchases={purchases}
            payments={supplierPayments}
            onBack={() => handleNavigate('supplier-detail')}
          />
        )}

        {activeRoute === 'purchases' && (
          <PurchasesPage
            currentUser={currentUser}
            purchases={purchases}
            suppliers={suppliers}
            onSelectSupplierDetail={handleSelectSupplierDetail}
            onSelectSupplierStatement={handleSelectSupplierStatement}
            onOpenRecordDeliveryModal={(supId) => {
              setDeliveryPreselectedSupplierId(supId || null);
              setIsDeliveryModalOpen(true);
            }}
            onOpenRecordPaymentModal={(supId, purchase) => {
              setPaymentTargetSupplierId(supId);
              setPaymentTargetPurchase(purchase || null);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

        {activeRoute === 'tax-overview' && (
          <TaxOverviewPage
            currentUser={currentUser}
            taxSummaries={taxSummaries}
            purchases={purchases}
            onShowToast={showToast}
            onNavigateToReturns={() => handleNavigate('tax-returns')}
          />
        )}

        {activeRoute === 'tax-returns' && (
          <TaxReturnsPage
            currentUser={currentUser}
            taxReturns={taxReturns}
            onShowToast={showToast}
            onNavigateToOverview={() => handleNavigate('tax-overview')}
          />
        )}

        {activeRoute === 'tax-settings' && (
          <TaxSettingsPage
            currentUser={currentUser}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'alerts' && (
          <AlertsPage
            currentUser={currentUser}
            alerts={alerts}
            onSelectItemDetail={handleSelectItemDetail}
            onNavigateToPurchases={() => handleNavigate('purchases')}
            onNavigateToTaxReturns={() => handleNavigate('tax-returns')}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'users' && (
          <UsersPage
            currentUser={currentUser}
            onShowToast={showToast}
          />
        )}

        {activeRoute === 'security' && <SecurityRulesPage />}
      </Layout>

      {/* Global Stockline Modals */}
      <StockItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        actor={currentUser}
        editingItem={editingItem}
        onSuccess={(msg) => showToast(msg)}
      />

      <ReceiveStockModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        actor={currentUser}
        items={enrichedItems}
        preselectedItemId={receivePreselectedItemId}
        onSuccess={(msg) => showToast(msg)}
      />

      <RecordMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        actor={currentUser}
        item={movementTargetItem}
        batches={batches}
        preselectedBatchId={movementTargetBatchId}
        onSuccess={(msg) => showToast(msg)}
      />

      <CreateRequisitionModal
        isOpen={isCreateReqModalOpen}
        onClose={() => setIsCreateReqModalOpen(false)}
        actor={currentUser}
        items={enrichedItems}
        onSuccess={(msg) => showToast(msg)}
      />

      <IssueRequisitionModal
        isOpen={isIssueReqModalOpen}
        onClose={() => {
          setIsIssueReqModalOpen(false);
          setIssueReqTarget(null);
        }}
        actor={currentUser}
        requisition={issueReqTarget}
        items={enrichedItems}
        batches={batches}
        onSuccess={(msg) => showToast(msg)}
      />

      <RejectRequisitionModal
        isOpen={isRejectReqModalOpen}
        onClose={() => {
          setIsRejectReqModalOpen(false);
          setRejectReqTarget(null);
        }}
        actor={currentUser}
        requisition={rejectReqTarget}
        onSuccess={(msg) => showToast(msg)}
      />

      <DirectIssueModal
        isOpen={isDirectIssueModalOpen}
        onClose={() => setIsDirectIssueModalOpen(false)}
        actor={currentUser}
        items={enrichedItems}
        staffUsers={staffUsers}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Module 3: Supplier Ledger Modals */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        actor={currentUser}
        editingSupplier={editingSupplier}
        onSuccess={(msg) => showToast(msg)}
      />

      <RecordDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        actor={currentUser}
        suppliers={suppliers}
        items={enrichedItems}
        preselectedSupplierId={deliveryPreselectedSupplierId}
        onSuccess={(msg) => showToast(msg)}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetPurchase(null);
          setPaymentTargetSupplierId(null);
        }}
        actor={currentUser}
        purchases={purchases}
        suppliers={suppliers}
        targetPurchase={paymentTargetPurchase}
        targetSupplierId={paymentTargetSupplierId}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Global Toast Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-lg border border-[#14532D] bg-[#14532D] p-3.5 text-xs text-white shadow-xl dark:border-[#22C55E] dark:bg-[#11241A] dark:text-[#ECF2EE]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300 dark:text-[#22C55E]" />
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded p-1 text-white/80 hover:bg-white/10 dark:text-[#9AA89F]"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
