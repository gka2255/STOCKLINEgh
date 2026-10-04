import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ClipboardList,
  FilePlus,
  Bell,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  PackagePlus,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Check,
  Building2,
  Receipt,
  Calculator,
  FileSpreadsheet,
  Settings2,
} from 'lucide-react';
import { AppUser, StockAlert } from '../types/stock';
import { AppRouteId, formatDateTimeShort } from '../utils/formatters';
import { INITIAL_DEMO_ACCOUNTS } from '../services/demoSeed';

interface LayoutProps {
  currentUser: AppUser;
  activeRoute: AppRouteId;
  selectedItemName?: string | null;
  selectedRequisitionNumber?: string | null;
  alerts: StockAlert[];
  pendingRequisitionsCount: number;
  onNavigate: (route: AppRouteId) => void;
  onSelectItemDetail: (itemId: string) => void;
  onLogout: () => void;
  onQuickSwitchAccount: (email: string, passwordPlain: string) => Promise<void>;
  onOpenReceiveModal: () => void;
  onOpenCreateReqModal: () => void;
  onMarkAlertAsRead: (alertId: string) => void;
  onMarkAllAlertsAsRead: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AppRouteId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  activeRoute,
  selectedItemName,
  selectedRequisitionNumber,
  alerts,
  pendingRequisitionsCount,
  onNavigate,
  onSelectItemDetail,
  onLogout,
  onQuickSwitchAccount,
  onOpenReceiveModal,
  onOpenCreateReqModal,
  onMarkAlertAsRead,
  onMarkAllAlertsAsRead,
  isDark,
  onToggleDark,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);

  // Unread alerts count for storekeeper & manager
  const unreadAlertsCount =
    currentUser.role !== 'staff'
      ? alerts.filter((a) => !a.readBy.includes(currentUser.uid)).length
      : 0;

  // Close alerts dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        alertsDropdownRef.current &&
        !alertsDropdownRef.current.contains(event.target as Node)
      ) {
        setAlertsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Items by Role
  const allNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'stock',
      label: 'Stock Catalog',
      shortLabel: 'Stock',
      icon: Package,
    },
    {
      id: 'movements',
      label: 'Movements',
      shortLabel: 'Ledger',
      icon: ArrowLeftRight,
    },
    {
      id: 'requisitions',
      label: 'Requisitions Queue',
      shortLabel: 'Reqs',
      icon: ClipboardList,
      badgeCount: pendingRequisitionsCount > 0 ? pendingRequisitionsCount : undefined,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      shortLabel: 'Vendors',
      icon: Building2,
    },
    {
      id: 'purchases',
      label: 'Purchases',
      shortLabel: 'Purchases',
      icon: Receipt,
    },
    {
      id: 'tax-overview',
      label: 'Tax Overview',
      shortLabel: 'Tax',
      icon: Calculator,
    },
    {
      id: 'tax-returns',
      label: 'File Returns',
      shortLabel: 'Returns',
      icon: FileSpreadsheet,
    },
    {
      id: 'tax-settings',
      label: 'Tax Settings',
      shortLabel: 'Tax Config',
      icon: Settings2,
    },
    {
      id: 'new-requisition',
      label: 'New Requisition',
      shortLabel: 'New Req',
      icon: FilePlus,
    },
    {
      id: 'my-requisitions',
      label: 'My Requisitions',
      shortLabel: 'My Reqs',
      icon: ClipboardList,
    },
    {
      id: 'alerts',
      label: 'Stock Alerts',
      shortLabel: 'Alerts',
      icon: Bell,
      badgeCount: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    {
      id: 'users',
      label: 'Users & Roles',
      shortLabel: 'Users',
      icon: Users,
    },
    {
      id: 'security',
      label: 'Rules & Setup',
      shortLabel: 'Rules',
      icon: ShieldCheck,
    },
  ];

  // Filter navigation items strictly by role
  const visibleNavItems = allNavItems.filter((item) => {
    if (currentUser.role === 'staff') {
      // Staff see ONLY "New Requisition" and "My Requisitions"
      return item.id === 'new-requisition' || item.id === 'my-requisitions';
    }
    if (currentUser.role === 'storekeeper') {
      // Storekeeper sees Dashboard, Stock, Movements, Requisitions Queue, Suppliers, Purchases, Tax Overview, File Returns, Alerts
      return (
        item.id === 'dashboard' ||
        item.id === 'stock' ||
        item.id === 'movements' ||
        item.id === 'requisitions' ||
        item.id === 'suppliers' ||
        item.id === 'purchases' ||
        item.id === 'tax-overview' ||
        item.id === 'tax-returns' ||
        item.id === 'alerts'
      );
    }
    // Manager sees all administrative screens including Tax Settings
    return (
      item.id === 'dashboard' ||
      item.id === 'stock' ||
      item.id === 'movements' ||
      item.id === 'requisitions' ||
      item.id === 'suppliers' ||
      item.id === 'purchases' ||
      item.id === 'tax-overview' ||
      item.id === 'tax-returns' ||
      item.id === 'tax-settings' ||
      item.id === 'alerts' ||
      item.id === 'users' ||
      item.id === 'security'
    );
  });

  const canWriteStock =
    currentUser.role === 'manager' || currentUser.role === 'storekeeper';

  const currentNavMeta = allNavItems.find(
    (n) =>
      n.id ===
      (activeRoute === 'stock-detail'
        ? 'stock'
        : activeRoute === 'requisition-detail'
        ? currentUser.role === 'staff'
          ? 'my-requisitions'
          : 'requisitions'
        : activeRoute === 'supplier-detail' || activeRoute === 'supplier-statement'
        ? 'suppliers'
        : activeRoute)
  );

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#181D1A] dark:bg-[#0D1310] dark:text-[#ECF2EE]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:shrink-0 border-r border-[#E4E0D8] bg-[#F4F1EA] transition-all duration-150 dark:border-[#1E2B23] dark:bg-[#111915] ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#E4E0D8] px-4 dark:border-[#1E2B23]">
          <button
            type="button"
            onClick={() =>
              onNavigate(currentUser.role === 'staff' ? 'my-requisitions' : 'dashboard')
            }
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#14532D] font-display text-sm font-bold tracking-tight text-white dark:bg-[#16A34A]">
              SL
            </div>
            {!sidebarCollapsed && (
              <span className="font-display text-lg font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
                StockLine
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-[#5C6660] hover:bg-[#E7E3DA] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:bg-[#1A2620] dark:hover:text-white"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main Navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeRoute === item.id ||
              (activeRoute === 'stock-detail' && item.id === 'stock') ||
              (activeRoute === 'requisition-detail' &&
                (currentUser.role === 'staff'
                  ? item.id === 'my-requisitions'
                  : item.id === 'requisitions'));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#14532D] text-white shadow-xs dark:bg-[#16A34A] dark:text-white'
                    : 'text-[#2E3833] hover:bg-[#E7E3DA] hover:text-[#181D1A] dark:text-[#C8D4CC] dark:hover:bg-[#1A2620] dark:hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'text-[#5C6660] group-hover:text-[#181D1A] dark:text-[#9AA89F] dark:group-hover:text-white'
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>

                {!sidebarCollapsed && item.badgeCount !== undefined && (
                  <span
                    className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-[#14532D] dark:text-[#16A34A]'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-[#E4E0D8] p-3 dark:border-[#1E2B23]">
          {!sidebarCollapsed ? (
            <div className="rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-3 dark:border-[#223028] dark:bg-[#15201A]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                <span className="capitalize font-medium text-[#14532D] dark:text-[#22C55E]">
                  Role · {currentUser.role}
                </span>
                <span>·</span>
                <span>Accra Osu</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3 py-1.5 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="flex w-full items-center justify-center rounded-lg p-2.5 text-[#5C6660] hover:bg-[#E7E3DA] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:bg-[#1A2620] dark:hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E4E0D8] bg-[#FAF8F5]/95 px-4 backdrop-blur-xs sm:px-6 dark:border-[#1E2B23] dark:bg-[#0D1310]/95">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="font-display font-bold text-[#14532D] md:hidden dark:text-[#22C55E]">
              StockLine
            </span>
            <span className="text-[#8C9690] md:hidden" aria-hidden="true">
              /
            </span>
            <span className="hidden text-[#5C6660] sm:inline dark:text-[#9AA89F]">
              Osu Kitchen Store
            </span>
            <span className="hidden text-[#8C9690] sm:inline" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  activeRoute === 'stock-detail'
                    ? 'stock'
                    : activeRoute === 'requisition-detail'
                    ? 'requisitions'
                    : activeRoute
                )
              }
              className={`truncate font-medium ${
                activeRoute === 'stock-detail' || activeRoute === 'requisition-detail'
                  ? 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white'
                  : 'text-[#181D1A] dark:text-[#ECF2EE]'
              }`}
            >
              {currentNavMeta?.label || 'Workspace'}
            </button>
            {activeRoute === 'stock-detail' && selectedItemName && (
              <>
                <span className="text-[#8C9690]" aria-hidden="true">
                  /
                </span>
                <span className="truncate font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                  {selectedItemName}
                </span>
              </>
            )}
            {activeRoute === 'requisition-detail' && selectedRequisitionNumber && (
              <>
                <span className="text-[#8C9690]" aria-hidden="true">
                  /
                </span>
                <span className="truncate font-mono font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                  {selectedRequisitionNumber}
                </span>
              </>
            )}
          </div>

          {/* Right Actions: Alerts Bell, Role Switcher, Dark Mode, Primary Actions */}
          <div className="flex items-center gap-2.5">
            {/* Bell Icon with Real-Time Alerts Dropdown (Manager & Storekeeper) */}
            {currentUser.role !== 'staff' && (
              <div className="relative" ref={alertsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAlertsDropdownOpen((o) => !o)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5D0C6] bg-white text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
                  aria-label="Stock Alerts"
                >
                  <Bell className="h-4 w-4" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>

                {alertsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-2 shadow-xl dark:border-[#223028] dark:bg-[#131C17] z-50">
                    <div className="flex items-center justify-between border-b border-[#E4E0D8] px-3 py-2 dark:border-[#223028]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                          Stock Alerts
                        </span>
                        {unreadAlertsCount > 0 && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                            {unreadAlertsCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadAlertsCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onMarkAllAlertsAsRead()}
                            className="text-[11px] font-medium text-[#14532D] hover:underline dark:text-[#22C55E]"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAlertsDropdownOpen(false);
                            onNavigate('alerts');
                          }}
                          className="text-[11px] font-medium text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white"
                        >
                          View all
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E0D8] dark:divide-[#223028]">
                      {alerts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                          No alerts recorded. All items are in stock.
                        </div>
                      ) : (
                        alerts.slice(0, 5).map((alt) => {
                          const isUnread = !alt.readBy.includes(currentUser.uid);
                          return (
                            <div
                              key={alt.id}
                              onClick={() => {
                                onMarkAlertAsRead(alt.id);
                                setAlertsDropdownOpen(false);
                                if (alt.taxReturnPeriod) {
                                  onNavigate('tax-returns');
                                } else if (alt.purchaseId) {
                                  onNavigate('purchases');
                                } else if (alt.itemId) {
                                  onSelectItemDetail(alt.itemId);
                                } else {
                                  onNavigate('alerts');
                                }
                              }}
                              className={`flex items-start gap-2.5 p-2.5 text-left cursor-pointer transition-colors ${
                                isUnread
                                  ? 'bg-[#14532D]/5 dark:bg-[#16A34A]/10 font-medium'
                                  : 'hover:bg-[#EFECE6] dark:hover:bg-[#1C2822]'
                              }`}
                            >
                              <div className="mt-0.5">
                                {alt.severity === 'critical' ? (
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                ) : alt.severity === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 text-[#D97706] dark:text-amber-400" />
                                ) : (
                                  <Info className="h-4 w-4 text-[#14532D] dark:text-[#22C55E]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#181D1A] dark:text-[#ECF2EE] line-clamp-2">
                                  {alt.message}
                                </p>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-[#5C6660] dark:text-[#9AA89F]">
                                  <span>{formatDateTimeShort(alt.createdAt)}</span>
                                  {alt.resolved && (
                                    <span className="text-[#14532D] dark:text-[#22C55E]">
                                      Resolved
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Role Switcher for Testing */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-[#D5D0C6] bg-white px-3 py-1.5 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822] whitespace-nowrap"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#14532D] dark:text-[#22C55E]" />
                <span className="hidden sm:inline">{currentUser.name}</span>
                <span className="text-[#5C6660] dark:text-[#9AA89F]">
                  ({currentUser.role})
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#5C6660]" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-2 shadow-lg dark:border-[#223028] dark:bg-[#131C17] z-50">
                  <div className="border-b border-[#E4E0D8] px-2.5 py-1.5 dark:border-[#223028]">
                    <p className="text-[11px] font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                      Switch Role Session (RBAC Demo)
                    </p>
                    <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                      Test role views & permissions
                    </p>
                  </div>
                  <div className="mt-1 space-y-1 max-h-64 overflow-y-auto">
                    {INITIAL_DEMO_ACCOUNTS.filter((a) => a.user.isActive).map((acc) => {
                      const active = acc.user.uid === currentUser.uid;
                      return (
                        <button
                          key={acc.user.uid}
                          type="button"
                          onClick={async () => {
                            setRoleSwitcherOpen(false);
                            await onQuickSwitchAccount(
                              acc.user.email,
                              acc.passwordPlain
                            );
                          }}
                          className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                            active
                              ? 'bg-[#14532D]/10 font-semibold text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]'
                              : 'text-[#2E3833] hover:bg-[#EFECE6] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]'
                          }`}
                        >
                          <div>
                            <p>{acc.user.name}</p>
                            <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                              {acc.user.email}
                            </p>
                          </div>
                          <span className="capitalize font-mono text-[11px]">
                            {acc.user.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 border-t border-[#E4E0D8] pt-1.5 dark:border-[#223028]">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleSwitcherOpen(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D5D0C6] bg-white text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC] dark:hover:bg-[#1C2822]"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Primary Action Button */}
            {currentUser.role === 'staff' ? (
              <button
                type="button"
                onClick={() => onNavigate('new-requisition')}
                className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
              >
                <FilePlus className="h-4 w-4" />
                <span>New Requisition</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenReceiveModal}
                className="flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#166534] transition-colors whitespace-nowrap dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
              >
                <PackagePlus className="h-4 w-4" />
                <span>Receive Stock</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-[#E4E0D8] bg-[#FAF8F5]/95 px-1 backdrop-blur-xs md:hidden dark:border-[#1E2B23] dark:bg-[#111915]/95"
      >
        {visibleNavItems
          .filter((item) => item.id !== 'movements' && item.id !== 'users' && item.id !== 'security')
          .slice(0, 6)
          .map((item) => {
            const Icon = item.icon;
            const isActive =
              activeRoute === item.id ||
              (activeRoute === 'stock-detail' && item.id === 'stock') ||
              (activeRoute === 'requisition-detail' &&
                (currentUser.role === 'staff'
                  ? item.id === 'my-requisitions'
                  : item.id === 'requisitions')) ||
              ((activeRoute === 'supplier-detail' || activeRoute === 'supplier-statement') &&
                item.id === 'suppliers');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-lg px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap relative ${
                isActive
                  ? 'text-[#14532D] font-semibold dark:text-[#22C55E]'
                  : 'text-[#5C6660] hover:text-[#181D1A] dark:text-[#9AA89F] dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.badgeCount !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white">
                    {item.badgeCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
