import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  PackagePlus,
  Filter,
} from 'lucide-react';
import {
  AppUser,
  Requisition,
  RequisitionStatus,
} from '../types/stock';
import { formatDateShort, formatDateTimeShort } from '../utils/formatters';

interface RequisitionsPageProps {
  currentUser: AppUser;
  requisitions: Requisition[];
  onSelectRequisitionDetail: (reqId: string) => void;
  onOpenDirectIssueModal?: () => void;
}

export const RequisitionsPage: React.FC<RequisitionsPageProps> = ({
  currentUser,
  requisitions,
  onSelectRequisitionDetail,
  onOpenDirectIssueModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequisitionStatus>('pending');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Storekeepers and managers see all requisitions across all departments
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && req.department !== departmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = req.requisitionNumber.toLowerCase().includes(q);
        const matchesUser = req.requestedBy.userName.toLowerCase().includes(q);
        const matchesDept = req.department.toLowerCase().includes(q);
        const matchesItem = req.lines.some((l) => l.itemName.toLowerCase().includes(q));
        if (!matchesNum && !matchesUser && !matchesDept && !matchesItem) return false;
      }
      return true;
    });
  }, [requisitions, statusFilter, departmentFilter, searchQuery]);

  const pendingCount = requisitions.filter((r) => r.status === 'pending').length;
  const issuedCount = requisitions.filter((r) => r.status === 'issued').length;
  const rejectedCount = requisitions.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#14532D]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              Storeroom Control
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            Requisitions Queue
          </h1>
          <p className="mt-0.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Review kitchen and department stock demands, fulfill via FIFO batch deductions, or log walk-in withdrawals.
          </p>
        </div>

        {onOpenDirectIssueModal && (
          <button
            type="button"
            onClick={onOpenDirectIssueModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Direct Issue (Walk-in)</span>
          </button>
        )}
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E4E0D8] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#223028] dark:bg-[#131C17]">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>Pending</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('issued')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === 'issued'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span>Issued</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
              {issuedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'text-red-800 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40'
            }`}
          >
            <span>Rejected</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
              {rejectedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#14532D] text-white dark:bg-[#16A34A]'
                : 'text-[#5C6660] hover:bg-[#F4F1EA] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]'
            }`}
          >
            All ({requisitions.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-md border border-[#D5D0C6] bg-white px-2.5 py-1.5 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
          >
            <option value="ALL">All Departments</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Bar">Bar</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5C6660] dark:text-[#9AA89F]" />
            <input
              type="text"
              placeholder="Search requester or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#D5D0C6] bg-white py-1.5 pl-8 pr-3 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
            />
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4E0D8] bg-[#F4F1EA] text-[#5C6660] dark:border-[#223028] dark:bg-[#111915] dark:text-[#9AA89F]">
              <tr>
                <th className="py-3 pl-4 pr-3 font-semibold">Requisition #</th>
                <th className="px-3 py-3 font-semibold">Requester</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Line Items</th>
                <th className="px-3 py-3 font-semibold">Date Submitted</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="py-3 pl-3 pr-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#5C6660] dark:text-[#9AA89F]">
                    No requisitions found matching the selected status or filters.
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => onSelectRequisitionDetail(req.id)}
                    className="hover:bg-[#FAF8F5] cursor-pointer dark:hover:bg-[#17221C] transition-colors"
                  >
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#14532D] dark:text-[#22C55E]">
                        <span>{req.requisitionNumber}</span>
                        {req.isDirectIssue && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[9px] font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            Direct
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <p className="font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
                        {req.requestedBy.userName}
                      </p>
                    </td>

                    <td className="px-3 py-3.5 text-[#5C6660] dark:text-[#9AA89F]">
                      <span className="rounded bg-[#F4F1EA] px-2 py-0.5 font-medium text-[#181D1A] dark:bg-[#1C2822] dark:text-[#ECF2EE]">
                        {req.department}
                      </span>
                    </td>

                    <td className="px-3 py-3.5">
                      <span className="font-medium text-[#181D1A] dark:text-[#ECF2EE]">
                        {req.lines.length} {req.lines.length === 1 ? 'line' : 'lines'}
                      </span>
                      <p className="text-[11px] text-[#5C6660] dark:text-[#9AA89F] truncate max-w-[200px]">
                        {req.lines.map((l) => l.itemName).join(', ')}
                      </p>
                    </td>

                    <td className="px-3 py-3.5 font-mono text-[11px] text-[#5C6660] dark:text-[#9AA89F]">
                      {formatDateTimeShort(req.createdAt)}
                    </td>

                    <td className="px-3 py-3.5">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </span>
                      )}
                      {req.status === 'issued' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Issued
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pl-3 pr-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] hover:underline dark:text-[#22C55E]">
                        <span>Review</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
