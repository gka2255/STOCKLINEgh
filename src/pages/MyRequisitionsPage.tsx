import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  FilePlus,
} from 'lucide-react';
import { AppUser, Requisition, RequisitionStatus } from '../types/stock';
import { formatDateShort, formatDateTimeShort } from '../utils/formatters';

interface MyRequisitionsPageProps {
  currentUser: AppUser;
  requisitions: Requisition[];
  onSelectRequisitionDetail: (reqId: string) => void;
  onNavigateToNewRequisition: () => void;
}

export const MyRequisitionsPage: React.FC<MyRequisitionsPageProps> = ({
  currentUser,
  requisitions,
  onSelectRequisitionDetail,
  onNavigateToNewRequisition,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequisitionStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Strictly filter only requisitions requested by the current staff member
  const myRequisitions = useMemo(() => {
    return requisitions.filter((r) => r.requestedBy.userId === currentUser.uid);
  }, [requisitions, currentUser.uid]);

  const filteredRequisitions = useMemo(() => {
    return myRequisitions.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = r.requisitionNumber.toLowerCase().includes(q);
        const matchesDept = r.department.toLowerCase().includes(q);
        const matchesItem = r.lines.some((l) => l.itemName.toLowerCase().includes(q));
        const matchesNote = r.note?.toLowerCase().includes(q);
        if (!matchesNum && !matchesDept && !matchesItem && !matchesNote) return false;
      }
      return true;
    });
  }, [myRequisitions, statusFilter, searchQuery]);

  // Counts for tabs
  const pendingCount = myRequisitions.filter((r) => r.status === 'pending').length;
  const issuedCount = myRequisitions.filter((r) => r.status === 'issued').length;
  const rejectedCount = myRequisitions.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#14532D]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#14532D] dark:bg-[#22C55E]/15 dark:text-[#22C55E]">
              Staff Portal
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#181D1A] dark:text-[#ECF2EE]">
            My Requisitions
          </h1>
          <p className="mt-0.5 text-xs text-[#5C6660] dark:text-[#9AA89F]">
            Track status, review approved stock distributions, and inspect rejection feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToNewRequisition}
          className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D]"
        >
          <FilePlus className="h-4 w-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Status Filter Tabs & Search */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E4E0D8] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#223028] dark:bg-[#131C17]">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#14532D] text-white dark:bg-[#16A34A]'
                : 'text-[#5C6660] hover:bg-[#F4F1EA] dark:text-[#9AA89F] dark:hover:bg-[#1C2822]'
            }`}
          >
            All ({myRequisitions.length})
          </button>
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
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5C6660] dark:text-[#9AA89F]" />
          <input
            type="text"
            placeholder="Search requisition # or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-[#D5D0C6] bg-white py-1.5 pl-8 pr-3 text-xs text-[#181D1A] focus:border-[#14532D] focus:outline-none dark:border-[#28382F] dark:bg-[#0D1310] dark:text-[#ECF2EE]"
          />
        </div>
      </div>

      {/* Requisitions List */}
      <div className="overflow-hidden rounded-lg border border-[#E4E0D8] bg-white shadow-xs dark:border-[#223028] dark:bg-[#131C17]">
        {filteredRequisitions.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-[#5C6660] dark:text-[#9AA89F]" />
            <p className="mt-2 text-sm font-semibold text-[#181D1A] dark:text-[#ECF2EE]">
              No requisitions found
            </p>
            <p className="mt-1 text-xs text-[#5C6660] dark:text-[#9AA89F]">
              {statusFilter !== 'ALL' || searchQuery
                ? 'No requisitions matched your selected filters.'
                : "You haven't submitted any requisitions yet."}
            </p>
            <button
              type="button"
              onClick={onNavigateToNewRequisition}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-medium text-white hover:bg-[#166534] dark:bg-[#16A34A]"
            >
              <Plus className="h-4 w-4" />
              <span>Submit First Requisition</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D8] dark:divide-[#223028]">
            {filteredRequisitions.map((req) => {
              return (
                <div
                  key={req.id}
                  onClick={() => onSelectRequisitionDetail(req.id)}
                  className="group flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-[#FAF8F5] cursor-pointer sm:flex-row sm:items-center dark:hover:bg-[#17221C]"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#14532D] dark:text-[#22C55E]">
                        {req.requisitionNumber}
                      </span>

                      {/* Status Badges */}
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

                      <span className="text-xs text-[#5C6660] dark:text-[#9AA89F]">·</span>
                      <span className="text-xs font-medium text-[#5C6660] dark:text-[#9AA89F]">
                        {req.department}
                      </span>
                    </div>

                    <div className="text-xs text-[#5C6660] dark:text-[#9AA89F]">
                      <span>{req.lines.length} {req.lines.length === 1 ? 'item' : 'items'}: </span>
                      <span className="text-[#181D1A] dark:text-[#ECF2EE]">
                        {req.lines.map((l) => `${l.quantityRequested} ${l.unit} ${l.itemName}`).join(', ')}
                      </span>
                    </div>

                    {/* Rejection reason snippet if rejected */}
                    {req.status === 'rejected' && req.rejectionReason && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50/80 p-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div>
                          <strong>Reason for Rejection:</strong> {req.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right text-xs text-[#5C6660] dark:text-[#9AA89F]">
                      <p>{formatDateShort(req.createdAt)}</p>
                      <p className="text-[11px]">{formatDateTimeShort(req.createdAt).split(', ')[1]}</p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-[#5C6660] group-hover:bg-[#E4E0D8] group-hover:text-[#181D1A] dark:text-[#9AA89F] dark:group-hover:bg-[#223028] dark:group-hover:text-white">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
