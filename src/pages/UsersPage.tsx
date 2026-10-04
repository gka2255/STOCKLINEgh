import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Shield,
  AlertCircle,
  Power,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { AppUser, UserRole } from '../types/stock';
import {
  fetchAllUsers,
  createEmployeeAccountAsManager,
  updateEmployeeStatusOrRole,
} from '../services/authService';
import { formatDateShort } from '../utils/formatters';

interface UsersPageProps {
  currentUser: AppUser;
  onShowToast: (msg: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ currentUser, onShowToast }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // New user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [addError, setAddError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isManager = currentUser.role === 'manager';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await fetchAllUsers();
      setUsers(list);
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      loadUsers();
    }
  }, [isManager]);

  if (!isManager) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/40">
        <ShieldAlert className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
        <h2 className="mt-2 text-base font-semibold text-red-800 dark:text-red-200">
          Access Restricted
        </h2>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          Only Restaurant Managers can access User Administration and role assignments.
        </p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (newName.trim().length < 2) {
      setAddError('Please enter a valid employee full name.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Please enter a valid work email address.');
      return;
    }
    if (newPassword.length < 6) {
      setAddError('Temporary password must be at least 6 characters long.');
      return;
    }

    setCreating(true);
    try {
      const created = await createEmployeeAccountAsManager(currentUser, {
        name: newName,
        email: newEmail,
        passwordPlain: newPassword,
        role: newRole,
      });

      onShowToast(`Created ${created.role} account for ${created.name} (${created.email}).`);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      await loadUsers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not create employee account.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (targetUser: AppUser) => {
    if (targetUser.uid === currentUser.uid && targetUser.isActive) {
      onShowToast('You cannot deactivate your own active Manager account.');
      return;
    }

    const nextState = !targetUser.isActive;
    try {
      await updateEmployeeStatusOrRole(currentUser, targetUser.uid, {
        isActive: nextState,
      });
      onShowToast(
        nextState
          ? `Account for ${targetUser.name} has been reactivated.`
          : `Account for ${targetUser.name} has been deactivated.`
      );
      await loadUsers();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not update user status.');
    }
  };

  const handleRoleChange = async (targetUser: AppUser, nextRole: UserRole) => {
    if (targetUser.role === nextRole) return;
    try {
      await updateEmployeeStatusOrRole(currentUser, targetUser.uid, {
        role: nextRole,
      });
      onShowToast(`Updated role for ${targetUser.name} to ${nextRole}.`);
      await loadUsers();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Could not change user role.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            User & Role Administration
          </h1>
          <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Manage employee access, role-based boundaries, and provision staff credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee Account</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-[#E4E0D8] bg-[#F4F1EA] p-4 text-xs text-[#2E3833] dark:border-[#223028] dark:bg-[#111915] dark:text-[#C8D4CC]">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#14532D] dark:text-[#22C55E]" />
        <div>
          <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
            Role-Based Access Enforcement
          </p>
          <p className="mt-0.5">
            <strong>Manager:</strong> Full administration, stock control, requisitions, alerts, and user accounts.
            <br />
            <strong>Storekeeper:</strong> Inventory catalog, FIFO batches, movements ledger, requisitions processing, and stock alerts.
            <br />
            <strong>Staff:</strong> Kitchen & department stock requests only. Costs, batch suppliers, and alerts are hidden.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E4E0D8] bg-white p-4 sm:flex-row sm:items-center dark:border-[#223028] dark:bg-[#131C17]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6660] dark:text-[#9AA89F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name or work email..."
            className="w-full rounded-lg border border-[#D5D0C6] bg-white py-2 pl-9 pr-3.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE] dark:focus:border-[#22C55E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
            className="rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
          >
            <option value="ALL">All Roles</option>
            <option value="manager">Manager</option>
            <option value="storekeeper">Storekeeper</option>
            <option value="staff">Kitchen / Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
              <tr>
                <th className="py-3 pl-4 pr-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Account Status</th>
                <th className="px-3 py-3 font-semibold">Created Date</th>
                <th className="py-3 pl-3 pr-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                    No employee accounts found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.uid === currentUser.uid;
                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-[#FAF8F5] dark:hover:bg-[#17221C]"
                    >
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14532D]/10 font-mono text-xs font-bold text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                              {user.name} {isSelf && <span className="text-[10px] text-[#14532D] dark:text-[#22C55E]">(You)</span>}
                            </p>
                            <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <select
                          disabled={isSelf}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className="rounded-md border border-[#D5D0C6] bg-white px-2 py-1 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none disabled:opacity-60 dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                        >
                          <option value="manager">Manager</option>
                          <option value="storekeeper">Storekeeper</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>

                      <td className="px-3 py-3.5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-950/50 dark:text-red-300">
                            <XCircle className="h-3 w-3" />
                            Deactivated
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                        {formatDateShort(user.createdAt)}
                      </td>

                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleToggleActive(user)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                            user.isActive
                              ? 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                              : 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                          title={isSelf ? 'Cannot deactivate your own account' : ''}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{user.isActive ? 'Deactivate' : 'Reactivate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-[#E4E0D8] bg-[#FAF8F5] p-6 shadow-lg dark:border-[#223028] dark:bg-[#131C17]">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3 dark:border-[#223028]">
              <div>
                <h2 className="text-base font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                  Add Employee Account
                </h2>
                <p className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                  Uses secondary Firebase auth instance to preserve manager session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-[#5C6660] hover:bg-[#EFECE6] dark:text-[#9AA89F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              {addError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Akwasi Appiah"
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Work Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g., akwasi@restaurant.com.gh"
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Temporary Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E3833] dark:text-[#C8D4CC]">
                  Assigned Role <span className="text-red-600">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-lg border border-[#D5D0C6] bg-white px-3 py-2 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
                >
                  <option value="staff">Staff (Kitchen / Bar requisitions only)</option>
                  <option value="storekeeper">Storekeeper (Inventory, Batches, Issuing)</option>
                  <option value="manager">Manager (Full administrator)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#E4E0D8] pt-3.5 dark:border-[#223028]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-[#D5D0C6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#2E3833] hover:bg-[#EFECE6] dark:border-[#28382F] dark:bg-[#131C17] dark:text-[#C8D4CC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#166534] disabled:opacity-50 dark:bg-[#16A34A]"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{creating ? 'Creating Account...' : 'Create Employee Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
