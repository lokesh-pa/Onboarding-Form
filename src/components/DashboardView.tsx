import React, { useState, useMemo } from 'react';
import { 
  WorkforceRequest, 
  UserRole, 
  RequestStatus 
} from '../types';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  FileText, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Layers, 
  LayoutGrid, 
  Table as TableIcon, 
  UserMinus, 
  Bell, 
  FileSpreadsheet, 
  Briefcase, 
  Send,
  AlertTriangle,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  UserCheck,
  Flame,
  Sparkles
} from 'lucide-react';
import { AB_DIVISIONS } from '../data/mockData';
import { downloadRequestExcel, downloadOffboardingExcel } from '../utils/excelExport';
import {
  parseDailyRate,
  calculateDaysLapsed,
  calculateBillingLoss,
  calculateWorkingDaysBetween,
  calculateSoftSaves,
  formatCurrencyAmount,
  calculateRequestFinancials,
  checkOnboardingDateGap
} from '../utils/billingMetrics';

function formatTimestamp(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function formatStatusLabel(status: RequestStatus): string {
  switch (status) {
    case 'under_review':
      return 'Pending Review';
    case 'info_requested':
      return 'Info Requested';
    case 'approved_workday_initiated':
      return 'Workday Initiated';
    case 'onboarded':
      return 'Onboarded (@ab.com)';
    case 'offboarding_pending':
      return 'Offboarding Pending';
    case 'offboarded':
      return 'Offboarded (Complete)';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

interface DashboardViewProps {
  requests: WorkforceRequest[];
  currentRole: UserRole;
  onSelectRequest: (request: WorkforceRequest) => void;
  onOpenEmailViewer: (request: WorkforceRequest) => void;
  onOpenNewOnboarding: () => void;
  onRoleChange?: (role: UserRole) => void;
  onResetAllActions?: () => void;
  onTriggerDailyReminder?: (requestId: string) => void;
  onTriggerTimesheetReminder?: (requestId: string) => void;
  onSupplierResponse?: (requestId: string, replyMessage: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  requests,
  currentRole,
  onSelectRequest,
  onOpenEmailViewer,
  onOpenNewOnboarding,
  onRoleChange,
  onResetAllActions,
  onTriggerDailyReminder,
  onTriggerTimesheetReminder,
  onSupplierResponse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [requestCategory, setRequestCategory] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [personaFocus, setPersonaFocus] = useState<'all' | 'action_required' | 'assigned_to_me' | 'pending_signoff' | 'joining_soon' | 'sla_risk'>('all');
  const [sortBy, setSortBy] = useState<'joining_soon' | 'date_desc' | 'date_asc' | 'pending_days' | 'rate_desc' | 'name_asc'>('joining_soon');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [showExecutiveInsights, setShowExecutiveInsights] = useState(true);

  // Quick reply modal state for vendors
  const [quickReplyRequest, setQuickReplyRequest] = useState<WorkforceRequest | null>(null);
  const [quickReplyMessage, setQuickReplyMessage] = useState('');

  // Helper for joining countdown
  const calculateDaysUntilJoining = (joiningDateStr?: string) => {
    if (!joiningDateStr) return 999;
    const target = new Date(joiningDateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  };

  // Counts for tabs & metrics - computed in a single optimized pass and memoized
  const {
    onboardingRequests,
    offboardingRequests,
    pendingValidationCount,
    workdayPendingCount,
    completedOnboardedCount,
    infoRequestedCount,
    offboardingPendingCount,
    timesheetOutOfSyncCount,
    totalEfficiencyGain,
    totalBillingLoss,
    completedBgvCount,
    bgvCompliancePct
  } = useMemo(() => {
    const onb: WorkforceRequest[] = [];
    const offb: WorkforceRequest[] = [];
    let pendingVal = 0;
    let workdayPending = 0;
    let completedOnb = 0;
    let infoReq = 0;
    let offbPending = 0;
    let timesheetOutOfSync = 0;
    let effGain = 0;
    let billLoss = 0;
    let completedBgv = 0;

    const isInternal = currentRole !== 'supplier';

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      if (req.type === 'onboarding') {
        onb.push(req);
        if (req.bgv?.screeningStatus === 'Complete' || req.details?.bgvStatus === 'Completed') {
          completedBgv++;
        }
      } else if (req.type === 'offboarding') {
        offb.push(req);
        if (req.offboarding?.isTimesheetInSync === 'No') {
          timesheetOutOfSync++;
        }
      }

      if (req.status === 'under_review') pendingVal++;
      else if (req.status === 'approved_workday_initiated') workdayPending++;
      else if (req.status === 'onboarded') completedOnb++;
      else if (req.status === 'info_requested') infoReq++;
      else if (req.status === 'offboarding_pending') offbPending++;

      // Executive financial calculations only needed for internal view
      if (isInternal) {
        const fin = calculateRequestFinancials(req);
        effGain += fin.efficiencyGain || 0;
        billLoss += fin.billingLoss || 0;
      }
    }

    const bgvPct = onb.length > 0 ? Math.round((completedBgv / onb.length) * 100) : 100;

    return {
      onboardingRequests: onb,
      offboardingRequests: offb,
      pendingValidationCount: pendingVal,
      workdayPendingCount: workdayPending,
      completedOnboardedCount: completedOnb,
      infoRequestedCount: infoReq,
      offboardingPendingCount: offbPending,
      timesheetOutOfSyncCount: timesheetOutOfSync,
      totalEfficiencyGain: effGain,
      totalBillingLoss: billLoss,
      completedBgvCount: completedBgv,
      bgvCompliancePct: bgvPct
    };
  }, [requests, currentRole]);

  // Persona focus counts for quick filter buttons - memoized single pass
  const {
    supplierActionCount,
    assignedToMeCount,
    pendingSignoffCount,
    joiningSoonCount
  } = useMemo(() => {
    let supAction = 0;
    let assigned = 0;
    let pendingSign = 0;
    let joinSoon = 0;

    for (let i = 0; i < requests.length; i++) {
      const r = requests[i];
      if (r.type === requestCategory) {
        if (r.status === 'info_requested' || (r.type === 'onboarding' && r.details.bgvStatus === 'Pending')) {
          supAction++;
        }
        if (r.details.abManagerNameOrEmail.toLowerCase().includes('marcus') || r.details.divisionName === 'Corporate Investment Banking') {
          assigned++;
        }
        if (r.status === 'under_review' && !r.validationChecklist?.managerApproved) {
          pendingSign++;
        }
      }
      if (r.type === 'onboarding') {
        const days = calculateDaysUntilJoining(r.details.joiningDateInAB);
        if (days <= 7 && days >= 0) {
          joinSoon++;
        }
      }
    }

    return {
      supplierActionCount: supAction,
      assignedToMeCount: assigned,
      pendingSignoffCount: pendingSign,
      joiningSoonCount: joinSoon
    };
  }, [requests, requestCategory]);

  // Filter requests based on Category tab + Search + Status + Division + Persona Focus - memoized
  const filteredRequests = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const matches = requests.filter((req) => {
      // 1. Separate tabs for Onboarding and Offboarding
      if (req.type !== requestCategory) return false;

      // 2. Search query: filter by candidate name or reference code (plus supplier, PO, role)
      if (query) {
        const queryMatches =
          req.candidateName.toLowerCase().includes(query) ||
          req.referenceCode.toLowerCase().includes(query) ||
          (req.jobRequisitionId && req.jobRequisitionId.toLowerCase().includes(query)) ||
          req.supplierName.toLowerCase().includes(query) ||
          req.details.purchaseOrderNumber.toLowerCase().includes(query) ||
          req.details.admRole.toLowerCase().includes(query) ||
          req.details.resourceLocation.toLowerCase().includes(query);
        if (!queryMatches) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      // 4. Division filter
      if (divisionFilter !== 'all' && req.details.divisionName !== divisionFilter) return false;

      // 5. Persona Focus filter
      if (personaFocus === 'action_required') {
        return req.status === 'info_requested' || (req.type === 'onboarding' && req.details.bgvStatus === 'Pending');
      } else if (personaFocus === 'assigned_to_me') {
        return req.details.abManagerNameOrEmail.toLowerCase().includes('marcus') || req.details.divisionName === 'Corporate Investment Banking';
      } else if (personaFocus === 'pending_signoff') {
        return req.status === 'under_review' && !req.validationChecklist?.managerApproved;
      } else if (personaFocus === 'joining_soon') {
        const days = calculateDaysUntilJoining(req.details.joiningDateInAB);
        return req.type === 'onboarding' && days <= 7 && days >= 0;
      } else if (personaFocus === 'sla_risk') {
        const days = Math.max(1, Math.floor((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        return days >= 2 && req.status === 'under_review';
      }

      return true;
    });

    // Sort filtered requests
    return matches.sort((a, b) => {
      if (sortBy === 'joining_soon') {
        const dateA = a.type === 'onboarding' ? (a.details.joiningDateInAB || '9999') : (a.offboarding?.offboardingDateLWD || '9999');
        const dateB = b.type === 'onboarding' ? (b.details.joiningDateInAB || '9999') : (b.offboarding?.offboardingDateLWD || '9999');
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date_asc' || sortBy === 'pending_days') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'rate_desc') {
        const rateA = parseDailyRate(a.details.billingRateWithCurrency).dailyRate;
        const rateB = parseDailyRate(b.details.billingRateWithCurrency).dailyRate;
        return rateB - rateA;
      }
      if (sortBy === 'name_asc') {
        return a.candidateName.localeCompare(b.candidateName);
      }
      return 0;
    });
  }, [requests, requestCategory, searchTerm, statusFilter, divisionFilter, personaFocus, sortBy]);

  const getActionLabel = (req: WorkforceRequest) => {
    if (currentRole === 'supplier') {
      return req.type === 'offboarding' ? 'View Offboarding Status' : 'View Dossier';
    }
    if (currentRole === 'pmo') {
      if (req.type === 'offboarding') {
        if (!req.offboarding?.workdayTerminationScreenshot) return 'Upload Workday Screenshot';
        if (req.offboarding?.isTimesheetInSync === 'No') return 'Reconcile Timesheets';
        return 'View Offboard Record';
      }
      if (req.status === 'approved_workday_initiated') return 'Input @ab.com Email';
      if (req.status === 'under_review') return 'Validate & Initiate Workday';
      return 'Review Request';
    }
    if (currentRole === 'manager') {
      if (req.type === 'offboarding') {
        if (!req.offboarding?.managerAcknowledged) return 'Acknowledge Target Date';
        if (!req.offboarding?.workdayTerminationScreenshot) return 'Upload Workday Screenshot';
        return 'View Offboard Record';
      }
      if (req.status === 'under_review') {
        return req.validationChecklist.managerApproved ? 'Review Dossier (Signed Off)' : 'Manager Sign-Off';
      }
      return 'Review Request';
    }
    return 'Review Request';
  };

  const calculateDaysPending = (dateStr: string) => {
    const diff = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  const handleSendReminder = (req: WorkforceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTriggerDailyReminder) {
      onTriggerDailyReminder(req.id);
    } else {
      setReminderToast(`Daily reminder dispatched to Hiring Team (${req.details.abManagerNameOrEmail} & pmo.contingent@ab.com) for ${req.candidateName}`);
      setTimeout(() => setReminderToast(null), 4000);
    }
  };

  const renderStatusPill = (status: RequestStatus) => {
    switch (status) {
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1 text-amber-600" /> Pending Review
          </span>
        );
      case 'info_requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" /> Info Requested
          </span>
        );
      case 'approved_workday_initiated':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 mr-1 text-blue-600" /> Workday Initiated (Awaiting @ab.com)
          </span>
        );
      case 'onboarded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Onboarding Completed
          </span>
        );
      case 'offboarding_pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <UserMinus className="w-3 h-3 mr-1 text-rose-600" /> Offboarding Pending
          </span>
        );
      case 'offboarded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Offboarded
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Search Bar: Filter Requests by Candidate Name or Reference Code */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <input
              id="top-dashboard-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests by candidate name (e.g. Alex, Rajesh, Priya) or reference code (e.g. ONB-2026-001)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                id="top-dashboard-clear-search-btn"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="Clear search filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {searchTerm ? (
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                  {filteredRequests.length} match{filteredRequests.length === 1 ? '' : 'es'} in {requestCategory === 'onboarding' ? 'Onboarding' : 'Offboarding'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Instant search active (Candidate Name &amp; Ref Code)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast banner for reminders */}
      {reminderToast && (
        <div className="bg-amber-900 text-amber-100 px-4 py-2.5 rounded-xl border border-amber-700 text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{reminderToast}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-amber-300 hover:text-white text-xs font-bold ml-3">
            ✕
          </button>
        </div>
      )}



      {/* Minimal Dashboard Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                {currentRole === 'supplier'
                  ? 'Supplier Operations Console'
                  : currentRole === 'pmo'
                  ? 'PMO Contingent Governance Console'
                  : 'Hiring Manager & Sponsor Console'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                AB-SUTRA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {currentRole === 'supplier'
                ? 'Submit contingent onboarding requests, upload & populate Excel forms, initiate offboardings, and download templates.'
                : currentRole === 'pmo'
                ? 'PMO governance: Verify PO funding, validate vendor dossiers, initiate Workday contractor IDs, ensure timesheet alignment before LWD, and provision @ab.com enterprise credentials.'
                : 'Hiring Manager console: Review technical evaluations, acknowledge offboarding requests with target dates, and verify Workday termination screenshots.'}
            </p>
          </div>

          {/* Toggle for Executive Insights */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowExecutiveInsights(!showExecutiveInsights)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{showExecutiveInsights ? 'Hide Executive KPIs' : 'Executive Insights & KPIs'}</span>
              {showExecutiveInsights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Executive KPI Insights Card Banner */}
        {showExecutiveInsights && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>EXECUTIVE GOVERNANCE &amp; SLA BENCHMARKS</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time telemetry</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {currentRole !== 'supplier' ? (
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                    <div className="text-[11px] text-slate-400">Total Realized Gain (Savings)</div>
                    <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>+${totalEfficiencyGain.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">Internal Gain (Early Onboard)</div>
                  </div>
                ) : (
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                    <div className="text-[11px] text-slate-400">Total Submissions</div>
                    <div className="text-lg font-extrabold text-white font-mono mt-0.5 flex items-center space-x-1">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>{requests.length} Requests</span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5">{onboardingRequests.length} Onb • {offboardingRequests.length} Offb</div>
                  </div>
                )}

                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400">BGV Compliance Rate</div>
                  <div className="text-lg font-extrabold text-blue-400 font-mono mt-0.5">
                    {bgvCompliancePct}%
                  </div>
                  <div className="text-[10px] text-blue-300 font-semibold mt-0.5">{completedBgvCount} of {onboardingRequests.length} Pre-Screened</div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400">Active In-Review Queue</div>
                  <div className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                    {pendingValidationCount} Dossiers
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold mt-0.5">Awaiting Manager / PMO Gate</div>
                </div>

                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                  <div className="text-[11px] text-slate-400">Timesheet Alignment</div>
                  <div className="text-lg font-extrabold text-rose-400 font-mono mt-0.5">
                    {timesheetOutOfSyncCount === 0 ? '100% In Sync' : `${timesheetOutOfSyncCount} Discrepancy`}
                  </div>
                  <div className="text-[10px] text-rose-300 font-semibold mt-0.5">Must settle before LWD</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimal metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div 
            onClick={() => {
              setStatusFilter('under_review');
              setPersonaFocus('all');
            }}
            className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition"
          >
            <div className="flex items-center justify-between text-amber-900 font-semibold">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950 mt-1">{pendingValidationCount}</div>
            <span className="text-[10px] text-amber-700">Daily reminders active</span>
          </div>

          <div 
            onClick={() => {
              setStatusFilter('approved_workday_initiated');
              setPersonaFocus('all');
            }}
            className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/80 cursor-pointer hover:bg-blue-100/60 transition"
          >
            <div className="flex items-center justify-between text-blue-900 font-semibold">
              <span>Workday In-Progress</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-950 mt-1">{workdayPendingCount}</div>
            <span className="text-[10px] text-blue-700">Awaiting @ab.com email</span>
          </div>

          <div 
            onClick={() => {
              setStatusFilter('onboarded');
              setPersonaFocus('all');
            }}
            className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/80 cursor-pointer hover:bg-emerald-100/60 transition"
          >
            <div className="flex items-center justify-between text-emerald-900 font-semibold">
              <span>Onboarded &amp; Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950 mt-1">{completedOnboardedCount}</div>
            <span className="text-[10px] text-emerald-700">Loop completed</span>
          </div>

          <div 
            onClick={() => {
              setRequestCategory('offboarding');
              setStatusFilter('all');
              setPersonaFocus('all');
            }}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
          >
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Offboarding Queue</span>
              <UserMinus className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{offboardingPendingCount}</div>
            <span className="text-[10px] text-slate-500">Asset &amp; access revoking</span>
          </div>
        </div>
      </div>

      {/* Primary Category Switcher Tabs: Onboarding vs Offboarding */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            id="tab-onboarding-requests"
            onClick={() => {
              setRequestCategory('onboarding');
              setStatusFilter('all');
              setPersonaFocus('all');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              requestCategory === 'onboarding'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Onboarding Requests</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              requestCategory === 'onboarding' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {onboardingRequests.length}
            </span>
          </button>

          <button
            id="tab-offboarding-requests"
            onClick={() => {
              setRequestCategory('offboarding');
              setStatusFilter('all');
              setPersonaFocus('all');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              requestCategory === 'offboarding'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Offboarding Requests</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              requestCategory === 'offboarding' ? 'bg-rose-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {offboardingRequests.length}
            </span>
          </button>
        </div>

        {/* Daily Reminder Alert Banner if there are pending actions */}
        {(pendingValidationCount > 0 || offboardingPendingCount > 0) && (
          <div className="hidden sm:flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Daily Reminder:</strong> {pendingValidationCount + offboardingPendingCount} item(s) awaiting Hiring Team action.
            </span>
          </div>
        )}

        {/* Timesheet Out of Sync Banner */}
        {requestCategory === 'offboarding' && timesheetOutOfSyncCount > 0 && (
          <div className="flex items-center space-x-2 text-xs text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Timesheet Discrepancy Alert:</strong> {timesheetOutOfSyncCount} offboarding resource(s) have timesheets out of sync with billable days. Urgent reminders must be completed before Last Working Day.
            </span>
          </div>
        )}
      </div>

      {/* Persona-Driven Focus Bar: 1-Click Quick Views tailored for End Users */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-semibold text-slate-500 mr-1 flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Quick View:
          </span>

          <button
            type="button"
            onClick={() => setPersonaFocus('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              personaFocus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({requestCategory === 'onboarding' ? onboardingRequests.length : offboardingRequests.length})
          </button>

          {currentRole === 'supplier' && (
            <button
              type="button"
              onClick={() => setPersonaFocus('action_required')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition ${
                personaFocus === 'action_required'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <span>⚡ Needs Vendor Action</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                personaFocus === 'action_required' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {supplierActionCount}
              </span>
            </button>
          )}

          {currentRole !== 'supplier' && (
            <>
              <button
                type="button"
                onClick={() => setPersonaFocus('assigned_to_me')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition ${
                  personaFocus === 'assigned_to_me'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                <span>👤 Assigned to Me (Marcus Vance)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  personaFocus === 'assigned_to_me' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {assignedToMeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPersonaFocus('pending_signoff')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition ${
                  personaFocus === 'pending_signoff'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <span>✍️ Pending Sign-Off</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  personaFocus === 'pending_signoff' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-900'
                }`}>
                  {pendingSignoffCount}
                </span>
              </button>
            </>
          )}

          {requestCategory === 'onboarding' && (
            <button
              type="button"
              onClick={() => setPersonaFocus('joining_soon')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition ${
                personaFocus === 'joining_soon'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <span>🚨 Joining in &le;7 Days</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                personaFocus === 'joining_soon' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {joiningSoonCount}
              </span>
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setPersonaFocus('sla_risk')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition ${
                personaFocus === 'sla_risk'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <span>⚠️ SLA at Risk (&ge;2 Days Pending)</span>
            </button>
          )}
        </div>

        {/* Sort by dropdown */}
        <div className="flex items-center space-x-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="joining_soon">Target Date (Soonest first)</option>
            <option value="date_desc">Creation Date (Newest first)</option>
            <option value="date_asc">Creation Date (Oldest first)</option>
            <option value="pending_days">Days in Review (Most urgent)</option>
            <option value="rate_desc">Billing Rate (Highest first)</option>
            <option value="name_asc">Candidate Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Filter Bar (Streamlined: duplicate search removed to keep focus on top search bar) */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <span className="font-semibold text-slate-800 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Filters:
          </span>
          {searchTerm && (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              <span>Matching: "{searchTerm}"</span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="hover:text-blue-900 font-bold ml-1"
                title="Clear search query"
              >
                ✕
              </button>
            </span>
          )}
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">
            Showing <strong>{filteredRequests.length}</strong> of {requestCategory === 'onboarding' ? onboardingRequests.length : offboardingRequests.length} {requestCategory} requests
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="under_review">Pending Review</option>
              <option value="info_requested">Info Requested</option>
              <option value="approved_workday_initiated">Workday Initiated</option>
              <option value="onboarded">Completed (@ab.com)</option>
              <option value="offboarding_pending">Offboarding Pending</option>
              <option value="offboarded">Offboarded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Division Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All AB Divisions</option>
            {AB_DIVISIONS.map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 ${viewMode === 'cards' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 ${viewMode === 'table' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500'}`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, category tab, or filters to find requests.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const hasTechEvidence = req.evidences.some((e) => e.category === 'technical_evaluation');
            const daysPending = calculateDaysPending(req.createdAt);
            const isPendingAction = req.status === 'under_review' || req.status === 'offboarding_pending';
            const fin = currentRole !== 'supplier' ? calculateRequestFinancials(req) : null;

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400/80 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group relative"
              >
                {/* Compact Tooltip on Hover showing Request Status and Last Updated Timestamp */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30 shadow-lg">
                  <div className="bg-slate-900/95 text-white text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5 backdrop-blur-xs whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span className="font-semibold text-blue-200">{formatStatusLabel(req.status)}</span>
                    <span className="text-slate-500">•</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-200">Updated: {formatTimestamp(req.updatedAt)}</span>
                  </div>
                </div>

                {/* Card Top */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {req.referenceCode}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {req.candidateName}
                      </h3>
                      <span className="text-xs text-slate-500 font-medium block">
                        {req.details.admRole} ({req.details.admSeniority})
                      </span>
                    </div>
                    {renderStatusPill(req.status)}
                  </div>

                  {/* Daily Reminder Flag if pending */}
                  {isPendingAction && (
                    <div className="flex items-center justify-between px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <span className="flex items-center font-medium">
                        <Bell className="w-3 h-3 mr-1 text-amber-600" />
                        Daily Reminder: Day {daysPending} Pending
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleSendReminder(req, e)}
                        className="text-[10px] underline font-semibold text-amber-800 hover:text-amber-950 flex items-center"
                        title="Resend daily reminder notice"
                      >
                        <Send className="w-2.5 h-2.5 mr-0.5" />
                        Send Ping
                      </button>
                    </div>
                  )}

                  {/* Badges / Highlights */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Vendor: {req.supplierName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">
                      PO: {req.details.purchaseOrderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                      {req.details.billingRateWithCurrency}
                    </span>
                    {req.details.resourceLocation && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        📍 {req.details.resourceLocation}
                      </span>
                    )}
                    {req.batchResources && req.batchResources.length > 1 && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                        Batch: {req.batchResources.length} Resources
                      </span>
                    )}
                  </div>

                  {/* Small view of Same-Day SLA & Billing Losses for Onboarding / Rejections (Visible to Manager/PMO & Admin) */}
                  {currentRole !== 'supplier' && fin && (req.type === 'onboarding' || req.status === 'rejected') && (
                    <div className={`p-2 rounded-lg border text-[11px] flex items-center justify-between transition ${
                      fin.isEarlyOnboarding
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                        : fin.billingLoss <= 0
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/90 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center space-x-1.5">
                        <TrendingDown className={`w-3.5 h-3.5 shrink-0 ${fin.billingLoss <= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <div>
                          <span className="font-bold">
                            {fin.isEarlyOnboarding ? 'Efficiency Gain Realized' : fin.slaStatusText}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            {fin.isEarlyOnboarding
                              ? `(${fin.earlyBusinessDays}d ahead of joining)`
                              : fin.isRejected
                              ? `(Delayed Rejection)`
                              : fin.businessDaysLapsed === 0
                              ? '(Completed same day)'
                              : 'Since receipt'}
                          </span>
                        </div>
                      </div>
                      <div className="font-mono font-extrabold text-right">
                        <span className={fin.billingLoss <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          {fin.isEarlyOnboarding
                            ? `${fin.formattedEfficiencyGain} Efficiency Gain`
                            : fin.billingLoss === 0
                            ? '$0 Loss'
                            : `Loss: ${fin.formattedBillingLoss}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Policy Flag for Manager/PMO & Admin Panel */}
                  {currentRole !== 'supplier' && req.type === 'onboarding' && (() => {
                    const gapCheck = checkOnboardingDateGap(req.details.demandType, req.details.joiningDateInAB, req.details.billingStartDate);
                    if (!gapCheck.hasPolicyReminder) return null;
                    return (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] flex items-start space-x-2 text-amber-950 shadow-2xs">
                        <span className="text-amber-700 font-bold shrink-0 text-xs">🚩 POLICY FLAG:</span>
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-amber-900 leading-tight">{gapCheck.internalFlagMessage}</p>
                          <p className="text-[10px] text-amber-800 font-mono">
                            {req.details.demandType} • Onboarding: {req.details.joiningDateInAB} &rarr; Billing Start: {req.details.billingStartDate} ({gapCheck.gapDays}d gap)
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Policy Reminder for Supplier View */}
                  {currentRole === 'supplier' && req.type === 'onboarding' && (() => {
                    const gapCheck = checkOnboardingDateGap(req.details.demandType, req.details.joiningDateInAB, req.details.billingStartDate);
                    if (!gapCheck.hasPolicyReminder) return null;
                    return (
                      <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-lg text-[11px] flex items-start space-x-2 text-blue-950">
                        <span className="text-blue-600 font-bold shrink-0 text-xs">ℹ️ POLICY REMINDER:</span>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-blue-900 leading-tight">{gapCheck.supplierMessage}</p>
                          <p className="text-[10px] text-blue-700 font-mono">
                            {req.details.demandType} • Gap: {gapCheck.gapDays} days between Onboarding &amp; Billing Start
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Info Requested / Query Banner with Quick Reply for Suppliers */}
                  {req.status === 'info_requested' && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-rose-800 font-semibold">
                        <span className="flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Clarification Requested by PMO
                        </span>
                        {currentRole === 'supplier' && onSupplierResponse && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickReplyRequest(req);
                              setQuickReplyMessage('');
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold shadow-xs transition"
                          >
                            Quick Reply
                          </button>
                        )}
                      </div>
                      {req.pendingQueries && req.pendingQueries.length > 0 && (
                        <p className="text-slate-700 italic bg-white/90 p-1.5 rounded border border-rose-100 line-clamp-2">
                          "{req.pendingQueries[req.pendingQueries.length - 1].message}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Summary Details Box */}
                  {req.type === 'offboarding' ? (
                    <div className="bg-rose-50/40 p-2.5 rounded-lg border border-rose-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Last Working Day (LWD)
                        </span>
                        <span className="font-bold text-rose-700">
                          {req.offboarding?.offboardingDateLWD || 'Scheduled'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Division / PO:</span>
                        <span className="font-medium text-slate-800">
                          {req.offboarding?.divisionName || req.details.divisionName} ({req.offboarding?.purchaseOrderNumber || req.details.purchaseOrderNumber})
                        </span>
                      </div>

                      {/* Timesheet Sync Warning & Trigger */}
                      {req.offboarding?.isTimesheetInSync === 'No' ? (
                        <div className="p-2 bg-amber-50 border border-amber-300 rounded-md text-amber-900 mt-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-amber-600 mr-1" />
                              Timesheet Out of Sync ({req.offboarding?.billedDaysCurrentYear} billed)
                            </span>
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-semibold">
                              Discrepancy
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-slate-600">
                              Must reconcile before LWD ({req.offboarding?.offboardingDateLWD}).
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onTriggerTimesheetReminder) onTriggerTimesheetReminder(req.id);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-semibold transition"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>{req.offboarding?.timesheetDiscrepancyReminderSent ? 'Resend' : 'Remind PMO & Supplier'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Timesheet Alignment:</span>
                          <span className="text-emerald-700 font-medium">
                            ✓ In Sync ({req.offboarding?.billedDaysCurrentYear || 'Aligned'})
                          </span>
                        </div>
                      )}

                      {/* Workday Termination Screenshot Status */}
                      <div className="flex items-center justify-between pt-1 border-t border-rose-100 text-[10px]">
                        <span>Workday Termination:</span>
                        {req.offboarding?.workdayTerminationScreenshot ? (
                          <span className="text-emerald-700 font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                            Screenshot Verified
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold flex items-center">
                            <Clock className="w-3 h-3 mr-0.5 text-rose-500" />
                            Pending Screenshot
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          BGV Screening
                        </span>
                        <span className="font-medium text-emerald-700">
                          {req.details.bgvStatus} ({req.bgv.completionDate})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center">
                          <Award className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Tech Score
                        </span>
                        <span className="font-semibold text-slate-800">
                          {req.details.technicalEvaluationScore || 'Verified'}
                          {hasTechEvidence && (
                            <span className="text-[10px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded ml-1">
                              Evidence Attached
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Joining / Start Date:</span>
                        <span className="font-semibold text-slate-800">{req.details.joiningDateInAB}</span>
                      </div>

                      {req.details.abEmailId && req.details.abEmailId !== 'NA' && (
                        <div className="flex items-center justify-between text-blue-700 font-mono text-[10px] pt-1 border-t border-slate-200">
                          <span>AB Email:</span>
                          <span className="font-semibold">{req.details.abEmailId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workday status indicator */}
                  {req.status === 'approved_workday_initiated' && (
                    <div className="bg-blue-50 text-blue-900 px-2.5 py-1.5 rounded text-[11px] font-medium border border-blue-200 flex items-center justify-between">
                      <span>Workday: <strong>{req.workdayId}</strong></span>
                      <span className="text-[10px] text-blue-700 font-semibold underline">Needs @ab.com email</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions with prominent Excel Download next to Review */}
                <div className="bg-slate-50/90 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEmailViewer(req)}
                    className="inline-flex items-center space-x-1 text-slate-500 hover:text-blue-600 transition text-[11px]"
                    title="View automated notification email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Email Log</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* User Request: Download Excel button next to approval request */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (req.type === 'offboarding') {
                          downloadOffboardingExcel(req);
                        } else {
                          downloadRequestExcel(req);
                        }
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium text-[11px] transition shadow-xs"
                      title={req.type === 'offboarding' ? "Download 14-Field Offboarding Form (Excel)" : "Download complete submitted dossier in Excel (with dedicated BGV & Tech Score tabs)"}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{req.type === 'offboarding' ? 'Offboarding Excel' : 'Download Excel'}</span>
                    </button>

                    {/* Review & Approve / Action Button */}
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className={`inline-flex items-center space-x-1 px-3 py-1 text-white rounded-md font-medium text-[11px] transition shadow-xs ${
                        req.type === 'offboarding' ? 'bg-rose-900 hover:bg-rose-700' : 'bg-slate-900 hover:bg-blue-600'
                      }`}
                    >
                      <span>{getActionLabel(req)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Ref & Candidate</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Division & PO</th>
                <th className="py-2.5 px-3">Role & Rate</th>
                <th className="py-2.5 px-3">Status & Reminders</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredRequests.map((req) => {
                const daysPending = calculateDaysPending(req.createdAt);
                const isPendingAction = req.status === 'under_review' || req.status === 'offboarding_pending';
                const fin = currentRole !== 'supplier' ? calculateRequestFinancials(req) : null;

                return (
                  <tr 
                    key={req.id} 
                    className="hover:bg-blue-50/70 transition group cursor-pointer relative"
                    onClick={() => onSelectRequest(req)}
                  >
                    <td className="py-2.5 px-3 relative">
                      {/* Compact Tooltip on Row Hover with Request Status & Last Updated Timestamp */}
                      <div className="absolute left-3 -top-8 z-40 hidden group-hover:flex items-center space-x-2 px-2.5 py-1 bg-slate-900/95 text-white text-[11px] rounded-md shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center space-x-1.5 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-slate-300">Status:</span>
                          <span className="text-white font-bold">{formatStatusLabel(req.status)}</span>
                        </div>
                        <span className="text-slate-500">•</span>
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Updated: <strong className="text-slate-100">{formatTimestamp(req.updatedAt)}</strong></span>
                        </div>
                        {currentRole !== 'supplier' && fin && (req.type === 'onboarding' || req.status === 'rejected') && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className={fin.billingLoss <= 0 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                              {fin.isEarlyOnboarding
                                ? `Efficiency Gain: ${fin.formattedEfficiencyGain || fin.formattedBillingLoss} (${fin.earlyBusinessDays}d early)`
                                : fin.billingLoss === 0
                                ? "SLA Met (Same Day $0 Loss)"
                                : `Loss: ${fin.formattedBillingLoss} (${fin.businessDaysLapsed}d business)`}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="font-mono text-[10px] text-slate-400">{req.referenceCode}</div>
                      <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">{req.candidateName}</div>
                      <div className="text-[11px] text-slate-500">{req.details.resourceLocation}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{req.supplierName}</div>
                      <div className="text-[10px] text-slate-400">{req.details.vendorDeliveryManagerEmail}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{req.details.divisionName}</div>
                      <div className="font-mono text-[10px] text-blue-700">{req.details.purchaseOrderNumber}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{req.details.admRole}</div>
                      <div className="font-semibold text-emerald-700 font-mono text-[11px]">{req.details.billingRateWithCurrency}</div>
                    </td>

                    <td className="py-2.5 px-3 space-y-1">
                      <div>{renderStatusPill(req.status)}</div>
                      {isPendingAction && (
                        <span className="inline-flex items-center text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Bell className="w-2.5 h-2.5 mr-0.5 text-amber-600" />
                          Reminder Day {daysPending}
                        </span>
                      )}
                      {req.type === 'offboarding' && req.offboarding?.isTimesheetInSync === 'No' && (
                        <div className="flex items-center space-x-1 text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                          <span>Timesheet Discrepancy</span>
                        </div>
                      )}
                      {currentRole !== 'supplier' && fin && (req.type === 'onboarding' || req.status === 'rejected') && (
                        <div>
                          <span className={`inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                            fin.isEarlyOnboarding
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : fin.billingLoss <= 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            <TrendingDown className={`w-2.5 h-2.5 ${fin.billingLoss <= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                            <span>
                              {fin.isEarlyOnboarding
                                ? `Efficiency Gain: ${fin.formattedEfficiencyGain}`
                                : fin.billingLoss === 0
                                ? 'SLA Met ($0 Loss)'
                                : `Loss: ${fin.formattedBillingLoss}`}
                            </span>
                          </span>
                        </div>
                      )}
                      {req.type === 'onboarding' && (() => {
                        const gapCheck = checkOnboardingDateGap(req.details.demandType, req.details.joiningDateInAB, req.details.billingStartDate);
                        if (!gapCheck.hasPolicyReminder) return null;
                        if (currentRole !== 'supplier') {
                          return (
                            <div className="flex items-center space-x-1 text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-semibold border border-amber-300" title={gapCheck.internalFlagMessage}>
                              <span>🚩</span>
                              <span className="truncate max-w-[130px]">{gapCheck.internalFlagMessage}</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center space-x-1 text-[10px] text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded font-semibold border border-blue-300" title={gapCheck.supplierMessage}>
                              <span>ℹ️</span>
                              <span className="truncate max-w-[130px]">Policy Reminder</span>
                            </div>
                          );
                        }
                      })()}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        {/* Download Excel button in Table */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (req.type === 'offboarding') {
                              downloadOffboardingExcel(req);
                            } else {
                              downloadRequestExcel(req);
                            }
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium text-[11px] transition shadow-xs"
                          title={req.type === 'offboarding' ? "Download 14-Field Offboarding Form (Excel)" : "Download submitted dossier in Excel (with BGV & Tech Score tabs)"}
                        >
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span>Excel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectRequest(req)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded font-medium text-[11px] transition shadow-xs"
                        >
                          <span>{getActionLabel(req)}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Reply Modal for Suppliers */}
      {quickReplyRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-rose-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">Quick Clarification Reply to PMO</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickReplyRequest(null)}
                className="text-rose-300 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-mono text-[10px] text-slate-500 block mb-0.5">{quickReplyRequest.referenceCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{quickReplyRequest.candidateName}</h4>
                <p className="text-slate-500 text-[11px]">Vendor: {quickReplyRequest.supplierName} • Division: {quickReplyRequest.details.divisionName}</p>
              </div>

              {quickReplyRequest.pendingQueries && quickReplyRequest.pendingQueries.length > 0 && (
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 space-y-1">
                  <span className="font-bold text-rose-900 text-[11px]">Latest Query from Reviewer:</span>
                  <p className="text-slate-700 italic">
                    "{quickReplyRequest.pendingQueries[quickReplyRequest.pendingQueries.length - 1].message}"
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Vendor Clarification / Answer:
                </label>
                <textarea
                  value={quickReplyMessage}
                  onChange={(e) => setQuickReplyMessage(e.target.value)}
                  placeholder="Provide clarification, attach reference notes, or confirm rectified details..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickReplyRequest(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!quickReplyMessage.trim()}
                  onClick={() => {
                    if (onSupplierResponse && quickReplyRequest) {
                      onSupplierResponse(quickReplyRequest.id, quickReplyMessage.trim());
                      setQuickReplyRequest(null);
                      setQuickReplyMessage('');
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Clarification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
