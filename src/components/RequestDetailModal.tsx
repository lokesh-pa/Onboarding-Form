import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Mail, 
  ShieldCheck, 
  Award, 
  Paperclip, 
  Send, 
  UserCheck, 
  HelpCircle, 
  XCircle,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  Briefcase,
  UserMinus,
  Sparkles,
  Upload,
  Calendar,
  Bell,
  Check,
  Eye,
  Camera,
  Download,
  AlertTriangle,
  Search
} from 'lucide-react';
import { WorkforceRequest, UserRole } from '../types';
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
import { COMPANY_DIRECTORY, CompanyEmployee, searchCompanyDirectory } from '../data/companyDirectory';

interface RequestDetailModalProps {
  request: WorkforceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onApproveWorkday: (requestId: string, workdayId: string, notes: string) => void;
  onCompleteOnboarding?: (requestId: string, abEmailId: string, workdayId: string) => void;
  onConfirmOffboarding?: (requestId: string) => void;
  onAcknowledgeOffboarding?: (requestId: string, targetDate: string, notes: string) => void;
  onUploadTerminationScreenshot?: (requestId: string, fileData: { fileName: string; fileSize: string; previewUrl: string }, terminationNumber: string, notes: string) => void;
  onTriggerDailyReminder?: (requestId: string) => void;
  onTriggerTimesheetReminder?: (requestId: string) => void;
  onConfirmTimesheetSync?: (requestId: string) => void;
  onManagerSignoff?: (requestId: string, notes: string) => void;
  onToggleChecklist?: (requestId: string, itemKey: keyof import('../types').ValidationChecklist) => void;
  onValidateAllChecklist?: (requestId: string) => void;
  onRoleChange?: (role: UserRole) => void;
  onRequestMoreInfo: (requestId: string, message: string) => void;
  onSupplierResponse: (requestId: string, replyMessage: string) => void;
  onOpenEmailViewer: (request: WorkforceRequest) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onDelegateRequest?: (requestId: string, delegationData: import('../types').RequestDelegation) => void;
  onReassignRequest?: (requestId: string, reassignmentData: { newSponsorName: string; newSponsorEmail: string; newDivision?: string; reason: string }) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  currentRole,
  onApproveWorkday,
  onCompleteOnboarding,
  onConfirmOffboarding,
  onAcknowledgeOffboarding,
  onUploadTerminationScreenshot,
  onTriggerDailyReminder,
  onTriggerTimesheetReminder,
  onConfirmTimesheetSync,
  onManagerSignoff,
  onToggleChecklist,
  onValidateAllChecklist,
  onRoleChange,
  onRequestMoreInfo,
  onSupplierResponse,
  onOpenEmailViewer,
  onRejectRequest,
  onDelegateRequest,
  onReassignRequest
}) => {
  const isOffboarding = request?.type === 'offboarding';

  const [activeTab, setActiveTab] = useState<'fields' | 'evidences' | 'validation' | 'audit' | 'offboarding_form' | 'termination_proof'>(
    isOffboarding ? 'offboarding_form' : 'fields'
  );
  
  // Batch multi-resource switcher & evidence filtering
  const [selectedBatchResourceIdx, setSelectedBatchResourceIdx] = useState(0);
  const [evidenceResourceFilter, setEvidenceResourceFilter] = useState<string>('all');
  
  // Dialog visibility states for onboarding
  const [showInfoRequestDialog, setShowInfoRequestDialog] = useState(false);
  const [infoRequestText, setInfoRequestText] = useState('');
  
  const [showWorkdayApproveDialog, setShowWorkdayApproveDialog] = useState(false);
  const [jobRequisitionInputId, setJobRequisitionInputId] = useState(request?.jobRequisitionId || 'JR-2026-90412');
  
  const [showCompleteOnboardingDialog, setShowCompleteOnboardingDialog] = useState(false);
  const [abEmailInput, setAbEmailInput] = useState('');
  const [completeWorkdayId, setCompleteWorkdayId] = useState('');

  // Delegation state (Searchable directory, email only required, non-mandatory name)
  const [showDelegationDialog, setShowDelegationDialog] = useState(false);
  const [delegateeName, setDelegateeName] = useState('');
  const [delegateeEmail, setDelegateeEmail] = useState('');
  const [delegationType, setDelegationType] = useState('Full Authority');
  const [delegationReason, setDelegationReason] = useState('Delegating review and approval authority.');
  const [delegationSearchResults, setDelegationSearchResults] = useState<CompanyEmployee[]>([]);
  const [isSearchingDelegation, setIsSearchingDelegation] = useState(false);

  const handleDelegationEmailSearch = (query: string) => {
    setDelegateeEmail(query);
    if (query.trim().length > 0) {
      const results = searchCompanyDirectory(query);
      setDelegationSearchResults(results);
      setIsSearchingDelegation(true);
    } else {
      setDelegationSearchResults([]);
      setIsSearchingDelegation(false);
    }
  };

  const handleSelectDelegationEmployee = (emp: CompanyEmployee) => {
    setDelegateeEmail(emp.email);
    setDelegateeName(emp.name);
    setIsSearchingDelegation(false);
  };

  // Reassignment state (Admin capability)
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorEmail, setNewSponsorEmail] = useState('');
  const [newDivision, setNewDivision] = useState('');
  const [reassignReason, setReassignReason] = useState('Governance realignment of portfolio sponsors.');

  // Dialog visibility states for offboarding
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [targetInitiationDate, setTargetInitiationDate] = useState('25/09/2026');
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('Reviewed offboarding request. Final handover scheduled before target date.');

  const [showScreenshotUploadDialog, setShowScreenshotUploadDialog] = useState(false);
  const [terminationNumberInput, setTerminationNumberInput] = useState(`WD-TERM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState('');
  const [screenshotNotes, setScreenshotNotes] = useState('Workday termination successfully submitted and verified in HR core.');
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  const [supplierReplyText, setSupplierReplyText] = useState('');

  const handleConfirmDelegation = () => {
    if (!delegateeEmail.trim()) {
      alert('Please provide delegatee corporate email ID.');
      return;
    }
    const resolvedName = delegateeName.trim() ||
      COMPANY_DIRECTORY.find(e => e.email.toLowerCase() === delegateeEmail.trim().toLowerCase())?.name ||
      delegateeEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (onDelegateRequest && request) {
      onDelegateRequest(request.id, {
        delegatedToName: resolvedName,
        delegatedToEmail: delegateeEmail.trim(),
        delegatedByName: currentRole === 'admin' ? 'Admin / Governance Lead' : (request.details.abManagerNameOrEmail || 'PMO / Hiring Manager'),
        delegatedByRole: currentRole === 'admin' ? 'Admin' : 'PMO / Hiring Manager',
        delegatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        delegationType,
        reason: delegationReason.trim() || 'Delegation of review and approval responsibilities.'
      });
      setShowDelegationDialog(false);
    }
  };

  const handleConfirmReassign = () => {
    if (!newSponsorEmail.trim() || !reassignReason.trim()) {
      alert('Please provide new sponsor email and business justification.');
      return;
    }
    if (onReassignRequest && request) {
      onReassignRequest(request.id, {
        newSponsorName: newSponsorName.trim() || newSponsorEmail.trim(),
        newSponsorEmail: newSponsorEmail.trim(),
        newDivision: newDivision.trim() || undefined,
        reason: reassignReason.trim()
      });
      setShowReassignDialog(false);
    }
  };

  if (!isOpen || !request) return null;

  const { details, bgv, evidences, emailDistribution, validationChecklist, auditTrail, pendingQueries, offboarding } = request;

  // 3-Role RBAC Mapping: Supplier, PMO/Hiring Manager (Merged), Admin/Governance
  const isSupplier = currentRole === 'supplier';
  const isManagerPmo = currentRole === 'manager_pmo' || (currentRole as string) === 'manager' || (currentRole as string) === 'pmo' || (currentRole as string) === 'hiring_team';
  const isAdmin = currentRole === 'admin';
  const isHiringTeam = isManagerPmo || isAdmin;
  const onboardingDateGap = (!isOffboarding && request.type === 'onboarding')
    ? checkOnboardingDateGap(details.demandType, details.joiningDateInAB, details.billingStartDate)
    : null;

  const getStatusBadge = (status: WorkforceRequest['status']) => {
    switch (status) {
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Pending Validation
          </span>
        );
      case 'info_requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Additional Info Requested
          </span>
        );
      case 'approved_workday_initiated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <UserCheck className="w-3 h-3 mr-1" /> Workday Initiated (Awaiting @ab.com)
          </span>
        );
      case 'onboarded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Onboarding Completed
          </span>
        );
      case 'offboarding_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3 h-3 mr-1" /> Offboarding In Progress
          </span>
        );
      case 'offboarded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Offboarding Completed (Termination Confirmed)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirmWorkday = () => {
    const generatedId = request?.workdayId || `WD-CW-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalJobReq = jobRequisitionInputId.trim() || request?.jobRequisitionId || `JR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    onApproveWorkday(request.id, generatedId, finalJobReq);
    setShowWorkdayApproveDialog(false);
  };

  const handleConfirmCompleteOnboarding = () => {
    const emailToUse = abEmailInput.trim() || `${details.firstName.toLowerCase()}.${details.lastName.toLowerCase()}@ab.com`;
    const finalWdId = completeWorkdayId.trim() || request.workdayId || `WD-CW-${Math.floor(100000 + Math.random() * 900000)}`;
    if (onCompleteOnboarding) {
      onCompleteOnboarding(request.id, emailToUse, finalWdId);
    }
    setShowCompleteOnboardingDialog(false);
  };

  const handleConfirmAcknowledge = () => {
    if (!targetInitiationDate.trim()) {
      alert('Please specify the date by which you will initiate offboarding.');
      return;
    }
    if (onAcknowledgeOffboarding) {
      onAcknowledgeOffboarding(request.id, targetInitiationDate.trim(), acknowledgeNotes.trim());
    }
    setShowAcknowledgeDialog(false);
  };

  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setScreenshotPreviewUrl(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmSubmitScreenshot = () => {
    const fileName = screenshotFileName || `Workday_Termination_Screenshot_${(offboarding?.resourceName || request.candidateName).replace(/\s+/g, '_')}.png`;
    const previewUrl = screenshotPreviewUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60';
    
    if (onUploadTerminationScreenshot) {
      onUploadTerminationScreenshot(
        request.id,
        {
          fileName,
          fileSize: '412 KB',
          previewUrl
        },
        terminationNumberInput.trim() || `WD-TERM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        screenshotNotes.trim()
      );
    }
    setShowScreenshotUploadDialog(false);
  };

  const handleConfirmRequestMoreInfo = () => {
    if (!infoRequestText.trim()) {
      alert('Please enter details of information requested.');
      return;
    }
    onRequestMoreInfo(request.id, infoRequestText.trim());
    setShowInfoRequestDialog(false);
    setInfoRequestText('');
  };

  const handleConfirmSupplierReply = () => {
    if (!supplierReplyText.trim()) {
      alert('Please enter your response.');
      return;
    }
    onSupplierResponse(request.id, supplierReplyText.trim());
    setSupplierReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] my-auto">
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner ${
              isOffboarding ? 'bg-rose-600' : 'bg-blue-600'
            }`}>
              {isOffboarding ? <UserMinus className="w-5 h-5" /> : 'AB'}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                  {request.referenceCode}
                </span>
                <h2 className="font-semibold text-lg text-white">
                  {offboarding?.resourceName || request.candidateName}
                </h2>
                {request.jobRequisitionId && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/70 text-blue-200 border border-blue-600">
                    Req: {request.jobRequisitionId}
                  </span>
                )}
                {getStatusBadge(request.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vendor: <span className="text-slate-200 font-medium">{request.supplierName}</span> | 
                Division: <span className="text-slate-200 font-medium">{offboarding?.divisionName || details.divisionName}</span> | 
                {isOffboarding ? (
                  <> LWD: <span className="text-rose-300 font-semibold">{offboarding?.offboardingDateLWD || 'Pending'}</span></>
                ) : (
                  <> Joining Date: <span className="text-slate-200 font-medium">{details.joiningDateInAB}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download Excel Button */}
            {isOffboarding ? (
              <button
                type="button"
                id="header-download-offboarding-excel-btn"
                onClick={() => downloadOffboardingExcel(request)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                title="Download full 14-Field Offboarding Form (Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Download Offboarding Excel</span>
              </button>
            ) : (
              <button
                type="button"
                id="header-download-excel-btn"
                onClick={() => downloadRequestExcel(request)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                title="Download full Excel Dossier (All fields + dedicated BGV & Tech Score tabs)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Download Excel Dossier</span>
              </button>
            )}

            <button
              onClick={() => onOpenEmailViewer(request)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              title="View triggered email notification thread"
            >
              <Mail className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Dispatched Emails</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center space-x-2 text-xs shrink-0 overflow-x-auto">
          {isOffboarding ? (
            <>
              <button
                id="tab-offboarding-form-btn"
                onClick={() => setActiveTab('offboarding_form')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'offboarding_form'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Offboarding Data Form</span>
              </button>
              <button
                id="tab-termination-proof-btn"
                onClick={() => setActiveTab('termination_proof')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'termination_proof'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Workday Status & Evidence</span>
                {offboarding?.workdayTerminationScreenshot && (
                  <Check className="w-3 h-3 text-emerald-300" />
                )}
              </button>
              <button
                id="tab-audit-btn"
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'audit'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Audit Trail & Reminders ({auditTrail.length})</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="tab-fields-btn"
                onClick={() => setActiveTab('fields')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'fields'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Onboarding Data Form</span>
              </button>
              <button
                id="tab-evidences-btn"
                onClick={() => setActiveTab('evidences')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'evidences'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Evidences</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-bold">
                  {evidences.length}
                </span>
              </button>
              <button
                id="tab-validation-btn"
                onClick={() => setActiveTab('validation')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'validation'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compliance Checks</span>
              </button>
              <button
                id="tab-audit-btn"
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline & Audit Trail</span>
              </button>
            </>
          )}
        </div>

        {/* Dedicated Batch Resource Switcher (When request was submitted for multiple users together) */}
        {!isOffboarding && request.batchResources && request.batchResources.length > 1 && (
          <div className="bg-slate-900 text-white px-6 py-2.5 border-b border-slate-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Batch Onboarding Roster ({request.batchResources.length} Resources):
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Dedicated buttons for each resource
              </span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
              {request.batchResources.map((res, idx) => {
                const isSelected = selectedBatchResourceIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedBatchResourceIdx(idx);
                      setEvidenceResourceFilter(res.name);
                    }}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>#{idx + 1}: {res.name}</span>
                    {res.role && (
                      <span className="text-[10px] text-blue-200 font-normal hidden md:inline">
                        • {res.role}
                      </span>
                    )}
                    {res.location && (
                      <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                        ({res.location})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dedicated Date Gap Policy Flag for Manager/PMO & Admin Panel */}
        {!isSupplier && onboardingDateGap?.hasPolicyReminder && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
                <span>🚩</span>
                <span>Policy Flag</span>
              </span>
              <span className="font-bold text-amber-950 text-xs">
                {onboardingDateGap.internalFlagMessage}
              </span>
              <span className="text-amber-800 text-[11px] hidden md:inline font-mono">
                (Demand Type: {details.demandType} • Onboarding: {details.joiningDateInAB} &rarr; Billing: {details.billingStartDate}, {onboardingDateGap.gapDays}d gap)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded shrink-0">
              Advisory Check (Scenario {onboardingDateGap.scenario})
            </span>
          </div>
        )}

        {/* Dedicated Date Gap Policy Reminder for Supplier View */}
        {isSupplier && onboardingDateGap?.hasPolicyReminder && (
          <div className="bg-blue-900/60 border-b border-blue-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-blue-100">
            <div className="flex items-center space-x-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
                <span>ℹ️</span>
                <span>Policy Reminder</span>
              </span>
              <span className="font-semibold text-blue-100 text-xs">
                {onboardingDateGap.supplierMessage}
              </span>
              <span className="text-blue-300 text-[11px] hidden md:inline font-mono">
                ({details.demandType} • Gap: {onboardingDateGap.gapDays} days)
              </span>
            </div>
            <span className="text-[10px] text-blue-300 bg-blue-950 px-2 py-0.5 rounded shrink-0 font-mono">
              Policy Reminder Only
            </span>
          </div>
        )}

        {/* SUPPLIER VIEW STATUS BAR */}
        {isSupplier && request.status !== 'rejected' && (
          <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 shrink-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  Supplier View
                </span>
                <span className="text-xs text-slate-300">
                  {isOffboarding
                    ? offboarding?.workdayTerminationScreenshot
                      ? 'Offboarding process fully completed and verified by PMO/Manager.'
                      : !offboarding?.managerAcknowledged
                      ? '14-Field Offboarding request submitted. Awaiting Hiring Manager acknowledgement & planned Workday initiation date.'
                      : 'Hiring Manager has acknowledged. Awaiting Workday termination initiation confirmation screenshot from Manager/PMO.'
                    : request.status === 'under_review'
                    ? '32-Field onboarding dossier submitted. Awaiting PMO/Hiring Manager review and Workday initiation.'
                    : request.status === 'approved_workday_initiated'
                    ? `Worker profile initiated in Workday (${request.workdayId}). Awaiting IT provisioning of @ab.com corporate email.`
                    : request.status === 'info_requested'
                    ? 'Action Required: PMO/Manager has requested additional details. Click "Reply to PMO Query" below.'
                    : 'Onboarding completed and corporate email active.'}
                </span>
              </div>


            </div>

            {/* Prominent Corporate Email Banner visible to Supplier once provisioned */}
            {(details.abEmailId && details.abEmailId !== 'NA' || request.generatedAbEmailId) && (
              <div className="mt-2 p-3 bg-emerald-950/80 border border-emerald-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded">
                        Corporate AB Email ID Provisioned
                      </span>
                      <span className="text-xs text-emerald-300 font-semibold">Active &amp; Ready for Resource</span>
                    </div>
                    <p className="font-mono text-sm font-bold text-white mt-0.5">
                      {request.generatedAbEmailId || details.abEmailId}
                    </p>
                    <p className="text-[11px] text-emerald-300">
                      Workday Worker ID: <strong>{request.workdayId}</strong> • Enterprise access active. Supplier delivery manager can now transmit credentials &amp; welcome kit to {request.candidateName}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(request.generatedAbEmailId || details.abEmailId || '');
                    alert(`Copbed corporate email: ${request.generatedAbEmailId || details.abEmailId}`);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition shrink-0"
                >
                  Copy Email ID
                </button>
              </div>
            )}

            {/* If info requested, show Supplier reply button */}
            {request.status === 'info_requested' && (
              <div className="pt-1 flex items-center justify-between bg-amber-950/40 p-2 rounded-lg border border-amber-500/40">
                <span className="text-xs text-amber-200">
                  Query: {pendingQueries[pendingQueries.length - 1]?.message || 'Please provide clarification on the submitted dossier.'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoRequestDialog(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs shrink-0 ml-2"
                >
                  Respond to Query
                </button>
              </div>
            )}
          </div>
        )}

        {/* PERSISTENT ACTION BAR FOR HIRING TEAM (PMO / HIRING MANAGER & ADMIN) */}
        {isHiringTeam && request.status !== 'rejected' && (
          <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 shrink-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin ? 'Admin / Governance Actions:' : 'PMO / Hiring Manager Actions:'}
                </span>
                <span className="text-xs text-slate-300">
                  {isOffboarding
                    ? offboarding?.workdayTerminationScreenshot
                      ? 'Offboarding process fully completed and verified.'
                      : !offboarding?.managerAcknowledged
                      ? 'Action Required: Acknowledge request and set planned Workday initiation date.'
                      : 'Action Required: Daily reminders active until Workday termination confirmation screenshot is uploaded.'
                    : request.status === 'under_review'
                    ? 'Action Required: Verify Compliance Checks and Accept Vendor Submission & Initiate Workday Onboarding.'
                    : request.status === 'approved_workday_initiated'
                    ? 'Workday profile initiated. Final step: Provision corporate @ab.com email to close loop.'
                    : 'Onboarding completed and corporate email active.'}
                </span>
              </div>

              {/* Reminders / Status indicators */}
              {isOffboarding && offboarding?.managerAcknowledged && !offboarding?.workdayTerminationScreenshot && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                    <Bell className="w-3 h-3 mr-1 animate-pulse" />
                    Daily Reminders: {offboarding.dailyRemindersCount || 0} Dispatched
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerDailyReminder) onTriggerDailyReminder(request.id);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition"
                    title="Dispatch daily reminder email now"
                  >
                    Send Daily Reminder
                  </button>
                </div>
              )}
            </div>

            {/* Delegation Badge if delegated */}
            {request.delegation && (
              <div className="p-2 bg-indigo-950/80 border border-indigo-500/50 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-200">
                    Delegated to <strong>{request.delegation.delegatedToName}</strong> ({request.delegation.delegatedToEmail}) • {request.delegation.delegationType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDelegationDialog(true)}
                  className="text-xs text-indigo-300 hover:text-white underline font-semibold"
                >
                  Change Delegation
                </button>
              </div>
            )}

            {/* Reassignment Badge if reassigned */}
            {request.reassignmentHistory && request.reassignmentHistory.length > 0 && (
              <div className="p-2 bg-purple-950/80 border border-purple-500/50 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-slate-200">
                    Governance Reassigned: Transferred to <strong>{request.reassignmentHistory[request.reassignmentHistory.length - 1].newSponsor}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-purple-300 font-mono">
                  {request.reassignmentHistory[request.reassignmentHistory.length - 1].timestamp || request.reassignmentHistory[request.reassignmentHistory.length - 1].reassignedAt}
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Offboarding Specific Workflow Actions */}
              {isOffboarding ? (
                <>
                  {/* Timesheet Out of Sync Reminder Action */}
                  {offboarding?.isTimesheetInSync === 'No' && (
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-amber-900/40 border border-amber-500/50 rounded-lg text-xs text-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Timesheet Out of Sync ({offboarding.billedDaysCurrentYear} billed)</span>
                      <button
                        type="button"
                        id="action-trigger-timesheet-reminder-btn"
                        onClick={() => {
                          if (onTriggerTimesheetReminder) onTriggerTimesheetReminder(request.id);
                        }}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition inline-flex items-center space-x-1"
                        title="Dispatch email reminder to PMO and Supplier Delivery Manager before last working day"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>{offboarding.timesheetDiscrepancyReminderSent ? 'Resend Timesheet Reminder' : 'Remind PMO & Supplier'}</span>
                      </button>
                    </div>
                  )}

                  {/* Action 1: Acknowledgement */}
                  {!offboarding?.managerAcknowledged ? (
                    <button
                      type="button"
                      id="action-manager-acknowledge-btn"
                      onClick={() => setShowAcknowledgeDialog(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs transition animate-pulse"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-200" />
                      <span>Acknowledge Request & Set Target Initiation Date</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-900/60 border border-blue-700/60 rounded-lg text-xs text-blue-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        Acknowledged (Initiation by: <strong>{offboarding.managerTargetInitiationDate || 'Committed'}</strong>)
                      </span>
                    </div>
                  )}

                  {/* Action 2: Upload Confirmation Screenshot */}
                  {!offboarding?.workdayTerminationScreenshot ? (
                    <button
                      type="button"
                      id="action-upload-termination-screenshot-btn"
                      onClick={() => setShowScreenshotUploadDialog(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-200" />
                      <span>Upload Workday Termination Screenshot (Complete Process)</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-900/60 border border-emerald-700/60 rounded-lg text-xs text-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Termination Confirmed with Screenshot ({offboarding.workdayTerminationNumber})</span>
                    </div>
                  )}

                  {/* Action 3: 2-Day Pre-LWD Timesheet Attestation */}
                  {!offboarding?.timesheetConfirmedTwoDaysPrior ? (
                    <button
                      type="button"
                      id="action-confirm-timesheet-sync-btn"
                      onClick={() => {
                        if (onConfirmTimesheetSync) onConfirmTimesheetSync(request.id);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition"
                      title="2 days before last working day, confirm timesheet alignment to AB internal data"
                    >
                      <Check className="w-3.5 h-3.5 text-purple-200" />
                      <span>Confirm 2-Day Pre-LWD Timesheet Alignment</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-900/50 border border-purple-700/50 rounded-lg text-xs text-purple-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Timesheet Aligned to AB Internal Data</span>
                    </div>
                  )}

                  {/* Delegation Button */}
                  <button
                    type="button"
                    id="action-delegate-request-offboarding-btn"
                    onClick={() => setShowDelegationDialog(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition"
                    title="Delegate offboarding oversight to another team member"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Delegate Request</span>
                  </button>

                  {/* Admin Reassignment Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      id="action-reassign-request-offboarding-btn"
                      onClick={() => setShowReassignDialog(true)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
                      title="Reassign sponsor or division for this request"
                    >
                      <Building className="w-3.5 h-3.5 text-amber-300" />
                      <span>Reassign Request (Admin)</span>
                    </button>
                  )}
                </>
              ) : (
                /* Onboarding Specific Actions */
                <>
                  {(request.status === 'under_review' || request.status === 'info_requested') && (
                    <>
                      {/* Accept Vendor Submission & Initiate Workday Onboarding */}
                      <button
                        type="button"
                        id="action-accept-workday-btn"
                        onClick={() => {
                          setJobRequisitionInputId(request.jobRequisitionId || 'JR-2026-' + Math.floor(10000 + Math.random() * 90000));
                          setShowWorkdayApproveDialog(true);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                        title="Accept vendor submission dossier and initiate Workday onboarding"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Accept Vendor Submission &amp; Initiate Workday Onboarding</span>
                      </button>

                      {/* Delegation Button */}
                      <button
                        type="button"
                        id="action-delegate-request-onboarding-btn"
                        onClick={() => setShowDelegationDialog(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition"
                        title="Delegate this onboarding request to someone else"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Delegate Request</span>
                      </button>

                      {/* Admin Reassignment Button */}
                      {isAdmin && (
                        <button
                          type="button"
                          id="action-reassign-request-onboarding-btn"
                          onClick={() => setShowReassignDialog(true)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
                          title="Reassign request to another AB sponsor or division"
                        >
                          <Building className="w-3.5 h-3.5 text-amber-300" />
                          <span>Reassign Request (Admin)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id="action-request-info-btn"
                        onClick={() => setShowInfoRequestDialog(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
                        <span>Ask Vendor for Additional Details</span>
                      </button>

                      <button
                        type="button"
                        id="action-reject-request-btn"
                        onClick={() => {
                          const reason = prompt('Please enter rejection reason:');
                          if (reason) onRejectRequest(request.id, reason);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-medium transition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-300" />
                        <span>Reject Request</span>
                      </button>
                    </>
                  )}

                  {/* FINAL STEP OF ONBOARDING: Enter Corporate Email ID */}
                  {request.status === 'approved_workday_initiated' && (
                    <>
                      <button
                        type="button"
                        id="action-complete-onboarding-btn"
                        onClick={() => {
                          const defaultEmail = `${details.firstName.toLowerCase()}.${details.lastName.toLowerCase()}@ab.com`;
                          setAbEmailInput(details.abEmailId && details.abEmailId !== 'NA' ? details.abEmailId : defaultEmail);
                          setCompleteWorkdayId(request.workdayId || '');
                          setShowCompleteOnboardingDialog(true);
                        }}
                        className="inline-flex items-center space-x-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md animate-pulse transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Provision Enterprise @ab.com Email &amp; Complete Onboarding</span>
                      </button>

                      {/* Delegation Button */}
                      <button
                        type="button"
                        id="action-delegate-request-step2-btn"
                        onClick={() => setShowDelegationDialog(true)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Delegate Request</span>
                      </button>

                      {/* Admin Reassignment Button */}
                      {isAdmin && (
                        <button
                          type="button"
                          id="action-reassign-request-step2-btn"
                          onClick={() => setShowReassignDialog(true)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition"
                        >
                          <Building className="w-3.5 h-3.5 text-amber-300" />
                          <span>Reassign Request (Admin)</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Delegation Dialog */}
            {showDelegationDialog && (
              <div className="p-4 bg-slate-800 border border-indigo-500/60 rounded-xl space-y-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center">
                    <UserCheck className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Delegate Request
                  </h4>
                  <span className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-700">
                    Authority Transfer
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Delegate evaluation and sign-off authority for <strong>{request.candidateName}</strong> ({request.referenceCode}) to another PMO or hiring team member. An actionable notification email will be dispatched to all stakeholders.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Searchable Delegatee Corporate Email */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-white">
                        Delegatee Corporate Email *
                      </label>
                      <span className="text-[10px] text-indigo-300">Searchable directory</span>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={delegateeEmail}
                        onChange={(e) => handleDelegationEmailSearch(e.target.value)}
                        onFocus={() => {
                          if (delegateeEmail) {
                            setDelegationSearchResults(searchCompanyDirectory(delegateeEmail));
                            setIsSearchingDelegation(true);
                          }
                        }}
                        placeholder="Search email e.g. sarah.jenkins@ab.com"
                        className="w-full pl-8 pr-3 py-1.5 border border-indigo-500/80 rounded bg-slate-900 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    </div>

                    {/* Instant Search Results Dropdown */}
                    {isSearchingDelegation && delegationSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-indigo-500 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800">
                        <div className="px-3 py-1 bg-slate-800 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                          Internal Company Directory
                        </div>
                        {delegationSearchResults.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleSelectDelegationEmployee(emp)}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-950 transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center space-x-1.5">
                                <span>{emp.name}</span>
                                <span className="text-[10px] font-normal text-slate-400">({emp.role})</span>
                              </div>
                              <div className="text-[11px] font-mono text-indigo-300">{emp.email}</div>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {emp.division}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Non-mandatory Delegatee Full Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Delegatee Full Name
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">Non-mandatory</span>
                    </div>
                    <input
                      type="text"
                      value={delegateeName}
                      onChange={(e) => setDelegateeName(e.target.value)}
                      placeholder="Optional (auto-derived from directory or email)"
                      className="w-full px-3 py-1.5 border border-indigo-600/70 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Delegation Scope
                    </label>
                    <select
                      value={delegationType}
                      onChange={(e) => setDelegationType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-indigo-600/70 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Full Authority">Full Authority (Approve, Sign-off &amp; Workday)</option>
                      <option value="Temporary Absence (OOO)">Temporary Absence / Backup Coverage (OOO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Reason / Handover Notes
                    </label>
                    <input
                      type="text"
                      value={delegationReason}
                      onChange={(e) => setDelegationReason(e.target.value)}
                      placeholder="e.g. Delegating approval authority during Sprint delivery"
                      className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDelegationDialog(false)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelegation}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs shadow-md"
                  >
                    Confirm Delegation &amp; Dispatch Email
                  </button>
                </div>
              </div>
            )}

            {/* Admin Reassignment Dialog */}
            {showReassignDialog && (
              <div className="p-4 bg-slate-800 border border-amber-500/60 rounded-xl space-y-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center">
                    <Building className="w-4 h-4 mr-1.5 text-amber-400" />
                    Admin Governance Reassignment
                  </h4>
                  <span className="text-[10px] text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700 font-bold">
                    Admin / Governance Capability
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  As Governance Admin, reassign this workforce request to a new AB Sponsor, Hiring Manager, or Division. This will be logged in the immutable audit trail and an alert will be dispatched to the new sponsor.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New AB Sponsor Name
                    </label>
                    <input
                      type="text"
                      value={newSponsorName}
                      onChange={(e) => setNewSponsorName(e.target.value)}
                      placeholder="e.g. Robert Vance"
                      className="w-full px-3 py-1.5 border border-amber-600/70 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Sponsor Email (@ab.com) *
                    </label>
                    <input
                      type="email"
                      value={newSponsorEmail}
                      onChange={(e) => setNewSponsorEmail(e.target.value)}
                      placeholder="e.g. robert.vance@ab.com"
                      className="w-full px-3 py-1.5 border border-amber-600/70 rounded bg-slate-900 text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Division (Optional)
                    </label>
                    <input
                      type="text"
                      value={newDivision}
                      onChange={(e) => setNewDivision(e.target.value)}
                      placeholder="e.g. Wealth Management"
                      className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Governance Audit Justification *
                  </label>
                  <input
                    type="text"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g. Departmental reorganization and portfolio realignment."
                    className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReassignDialog(false)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReassign}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs shadow-md"
                  >
                    Confirm Reassignment &amp; Trigger Audit
                  </button>
                </div>
              </div>
            )}

            {/* Dialog: Manager Acknowledgement */}
            {showAcknowledgeDialog && (
              <div className="p-4 bg-slate-800 border border-amber-500/50 rounded-xl space-y-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-amber-400" />
                    Manager Acknowledgement of Offboarding Request
                  </h4>
                  <span className="text-[10px] text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700">
                    Mandatory Step Before Initiation
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  As the Hiring Sponsor or PMO Delegate, acknowledge that you have reviewed the 14-field offboarding declaration for <strong>{offboarding?.resourceName || request.candidateName}</strong> and commit the target date by which Workday termination will be initiated.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 mb-1">
                      Will Initiate Offboarding in Workday by Date *
                    </label>
                    <input
                      type="text"
                      value={targetInitiationDate}
                      onChange={(e) => setTargetInitiationDate(e.target.value)}
                      placeholder="e.g. 25/09/2026"
                      className="w-full px-3 py-1.5 border border-amber-600/70 rounded bg-slate-900 text-white text-xs font-semibold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Acknowledgement Notes / Handover Plan
                    </label>
                    <input
                      type="text"
                      value={acknowledgeNotes}
                      onChange={(e) => setAcknowledgeNotes(e.target.value)}
                      placeholder="e.g. Handover deliverables signed. Will initiate in Workday by target date."
                      className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-slate-400">
                    Offline notification email will be dispatched to supplier and all thread members.
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAcknowledgeDialog(false)}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAcknowledge}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs shadow-md"
                    >
                      Commit Target Date & Trigger Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog: Upload Workday Termination Screenshot */}
            {showScreenshotUploadDialog && (
              <div className="p-4 bg-slate-800 border border-rose-500/50 rounded-xl space-y-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center">
                    <Camera className="w-4 h-4 mr-1.5 text-rose-400" />
                    Upload Workday Termination Initiation Confirmation Screenshot
                  </h4>
                  <span className="text-[10px] text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700">
                    Required to Complete Process
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  To complete the offboarding workflow for <strong>{offboarding?.resourceName || request.candidateName}</strong>, PMO/Manager must share a confirmation screenshot of Termination initiated in Workday. Once submitted, an offline email will be triggered to the supplier and everyone on the thread.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-200 mb-1">
                      Workday Termination Event / Reference # *
                    </label>
                    <input
                      type="text"
                      value={terminationNumberInput}
                      onChange={(e) => setTerminationNumberInput(e.target.value)}
                      placeholder="e.g. WD-TERM-2026-9014"
                      className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white font-mono text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Termination Closure Remarks
                    </label>
                    <input
                      type="text"
                      value={screenshotNotes}
                      onChange={(e) => setScreenshotNotes(e.target.value)}
                      placeholder="e.g. Workday termination event initiated. Systems access revocation triggered."
                      className="w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Screenshot Upload Drop Area */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Select or Drop Workday Confirmation Screenshot (PNG, JPG, PDF) *
                  </label>
                  <div className="border-2 border-dashed border-slate-600 hover:border-rose-400 rounded-xl p-4 bg-slate-900/60 text-center transition flex flex-col items-center justify-center">
                    <input
                      type="file"
                      id="workday-screenshot-file-input"
                      accept="image/*,.pdf"
                      onChange={handleScreenshotFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="workday-screenshot-file-input"
                      className="cursor-pointer flex flex-col items-center space-y-1.5"
                    >
                      <Upload className="w-6 h-6 text-rose-400" />
                      <span className="font-semibold text-white text-xs">
                        {screenshotFileName ? screenshotFileName : 'Click to Browse or Drag Screenshot Here'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {screenshotFileName ? 'File attached successfully' : 'Supports Workday transaction screenshots (max 10MB)'}
                      </span>
                    </label>

                    {/* Quick Preset for convenience */}
                    {!screenshotFileName && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">Or use verified sample:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFileName('Workday_Termination_Initiated_Confirmed.png');
                            setScreenshotPreviewUrl('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-[10px]"
                        >
                          Attach Verified Workday Proof Screenshot
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-slate-400">
                    Daily reminders will cease once this confirmation screenshot is uploaded.
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowScreenshotUploadDialog(false)}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSubmitScreenshot}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs shadow-md"
                    >
                      Submit Screenshot, Complete Offboarding & Send Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog: Workday Initiation for Onboarding */}
            {showWorkdayApproveDialog && (
              <div className="p-3.5 bg-slate-800 border border-blue-500/50 rounded-xl space-y-2.5 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center">
                    <UserCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                    Accept Vendor Submission &amp; Initiate Workday Onboarding
                  </h4>
                  <span className="text-[10px] text-slate-400">Step 1 of 2 in Onboarding Lifecycle</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Specify the Workday Job Requisition ID to accept vendor submission and initiate contingent onboarding profile for <strong>{request.candidateName}</strong>.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    Job Requisition ID *
                  </label>
                  <input
                    type="text"
                    id="job-requisition-id-input"
                    value={jobRequisitionInputId}
                    onChange={(e) => setJobRequisitionInputId(e.target.value)}
                    placeholder="e.g. JR-2026-90412"
                    className="w-full px-2.5 py-1.5 border border-blue-500/70 rounded bg-slate-900 text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Assigned Job Requisition ID for this contingent worker engagement.
                  </span>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWorkdayApproveDialog(false)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWorkday}
                    className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs shadow-xs"
                  >
                    Confirm Workday Initiation
                  </button>
                </div>
              </div>
            )}

            {/* Dialog: Complete Onboarding with @ab.com email */}
            {showCompleteOnboardingDialog && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500 rounded-xl space-y-2.5 text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-200 text-xs flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
                    Final Step: Enter IT-Provisioned @ab.com Email ID
                  </h4>
                  <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                    Mandatory Policy Requirement
                  </span>
                </div>
                <p className="text-emerald-100 text-[11px]">
                  Provide the official corporate AB Email ID (e.g. <code>first.last@ab.com</code>) assigned by IT to close the onboarding loop.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                      AB Email ID (@ab.com) *
                    </label>
                    <input
                      type="email"
                      value={abEmailInput}
                      onChange={(e) => setAbEmailInput(e.target.value)}
                      placeholder="candidate.name@ab.com"
                      className="w-full px-2.5 py-1.5 border border-emerald-600 rounded bg-slate-900 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                      Workday ID
                    </label>
                    <input
                      type="text"
                      value={completeWorkdayId}
                      onChange={(e) => setCompleteWorkdayId(e.target.value)}
                      placeholder="e.g. WD-CW-881290"
                      className="w-full px-2.5 py-1.5 border border-emerald-600 rounded bg-slate-900 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCompleteOnboardingDialog(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCompleteOnboarding}
                    className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs shadow-md"
                  >
                    Finalize Onboarding & Mark Active
                  </button>
                </div>
              </div>
            )}

            {/* Dialog: Request Additional Info */}
            {showInfoRequestDialog && (
              <div className="p-3.5 bg-amber-950/80 border border-amber-500 rounded-xl space-y-2 text-xs animate-in slide-in-from-top-2">
                <h4 className="font-bold text-amber-200 text-xs flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1.5 text-amber-400" />
                  Ask Supplier / Vendor for Additional Details
                </h4>
                <p className="text-amber-100 text-[11px]">
                  An immediate notification query will be dispatched to <strong>{details.vendorDeliveryManagerEmail}</strong>:
                </p>
                <textarea
                  rows={2}
                  value={infoRequestText}
                  onChange={(e) => setInfoRequestText(e.target.value)}
                  placeholder="e.g. Please upload the revised SOW Annexure showing subcontractor allowance, or verify proposed start date."
                  className="w-full p-2 border border-amber-600 rounded bg-slate-900 text-white text-xs"
                />
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInfoRequestDialog(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRequestMoreInfo}
                    className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs shadow-xs"
                  >
                    Send Query to Supplier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUPPLIER STATUS & EVIDENCE BANNER (OFFBOARDING) */}
        {!isHiringTeam && isOffboarding && offboarding && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Offboarding Governance:
                </span>
                {offboarding.workdayTerminationScreenshot ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed & Workday Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>In Progress (Awaiting Internal AB Actions)</span>
                  </span>
                )}
              </div>

              {/* Quick Status Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Manager Ack Status */}
                {offboarding.managerAcknowledged ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manager Acknowledged: <strong>{offboarding.managerTargetInitiationDate}</strong></span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Awaiting Manager Acknowledgement</span>
                  </span>
                )}

                {/* Workday Proof Status */}
                {offboarding.workdayTerminationScreenshot ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Workday Proof on File ({offboarding.workdayTerminationNumber})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-200/70 border border-slate-300 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Awaiting Workday Proof from PMO/Manager</span>
                  </span>
                )}

                {/* Timesheet Discrepancy Alert for Supplier */}
                {offboarding.isTimesheetInSync === 'No' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerTimesheetReminder) onTriggerTimesheetReminder(request.id);
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-xs"
                    title="Notify PMO of timesheet discrepancy before last working day"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                    <span>{offboarding.timesheetDiscrepancyReminderSent ? 'Resend PMO Timesheet Alert' : 'Notify PMO of Discrepancy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Body - Tab Content */}
        <div className="p-6 overflow-y-auto min-h-0 space-y-6 flex-1 text-slate-800">
          {/* ONBOARDING SAME-DAY SLA & BILLING LOSS TRACKER (VISIBLE ONLY TO MANAGER/PMO & ADMIN VIEWS) */}
          {!isOffboarding && !isSupplier && (
            (() => {
              const fin = calculateRequestFinancials(request);

              return (
                <div
                  id="onboarding-billing-loss-view"
                  className={`rounded-xl border p-4 transition-all shadow-xs ${
                    fin.isEarlyOnboarding
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : fin.billingLoss <= 0
                      ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        fin.billingLoss <= 0 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {fin.billingLoss <= 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-sm">
                            Same-Day SLA &amp; Billing Loss Impact
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            fin.isEarlyOnboarding
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : fin.billingLoss <= 0
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {fin.isEarlyOnboarding
                              ? `Early Onboarded / Soft Save (${fin.earlyBusinessDays}d ahead)`
                              : fin.slaStatusText}
                          </span>
                          <span className="text-[11px] text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                            Manager/PMO &amp; Admin View Only
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-700 leading-relaxed">
                          {fin.calculationExplanation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      {/* Metric 1: Incurred Loss / Negative Loss Soft Save */}
                      <div className={`px-3.5 py-2 rounded-lg border text-right ${
                        fin.billingLoss <= 0
                          ? 'bg-white/80 border-emerald-200 text-emerald-900'
                          : 'bg-white/90 border-amber-200 text-amber-950'
                      }`}>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                          {fin.isEarlyOnboarding ? 'Efficiency Gain (Early Onboarding)' : 'Billing Loss'}
                        </div>
                        <div className={`text-base font-extrabold font-mono ${
                          fin.isEarlyOnboarding
                            ? 'text-emerald-700'
                            : fin.billingLoss <= 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}>
                          {fin.formattedBillingLoss}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {fin.isEarlyOnboarding
                            ? `-${fin.earlyBusinessDays} business days × ${fin.formattedDailyRate}`
                            : fin.billingLoss === 0
                            ? `0d × ${fin.formattedDailyRate}`
                            : `${fin.businessDaysLapsed}d × ${fin.formattedDailyRate}`}
                        </div>
                      </div>

                      {/* Metric 2: Soft Saves if available */}
                      {fin.softSaves > 0 && (
                        <div className="px-3.5 py-2 rounded-lg border bg-white/80 border-blue-200 text-right">
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-700">
                            Onboard-to-Billing Saves
                          </div>
                          <div className="text-base font-extrabold font-mono text-blue-800">
                            +{fin.formattedSoftSaves}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {fin.workingDaysBetweenOnboardAndBillingStart} working days saved
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* OFFBOARDING TAB 1: 14-FIELD OFFBOARDING FORM 2026 */}
          {isOffboarding && activeTab === 'offboarding_form' && offboarding && (
            <div className="space-y-4">
              {/* Header Card with Excel Download */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-rose-950 text-sm">
                      Offboarding Data Form (September 2026 Policy)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                      Mandatory Schema
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 mt-1">
                    Submitted by <strong>{request.supplierName}</strong> for contingent worker <strong>{offboarding.resourceName || request.candidateName}</strong>. 
                    Includes last working day, billing sync, sponsor email, and PO data.
                  </p>
                </div>
                <button
                  type="button"
                  id="tab-download-offboarding-excel-btn"
                  onClick={() => downloadOffboardingExcel(request)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>Download Excel File</span>
                </button>
              </div>

              {/* 14 Mandatory Fields Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4 w-5/12">Field Description</th>
                      <th className="py-2.5 px-4">Submitted Details / Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">1</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Resource Name</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{offboarding.resourceName}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">•</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Vendor Name</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{offboarding.vendorName || request.supplierName || details.vendorName || '—'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">2</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Resource Email (AB)</td>
                      <td className="py-2.5 px-4 font-mono text-blue-700 font-medium">{offboarding.resourceEmailAB}</td>
                    </tr>
                    <tr className="bg-rose-50/50 hover:bg-rose-50">
                      <td className="py-2.5 px-4 text-center text-rose-500 font-bold font-mono">3</td>
                      <td className="py-2.5 px-4 font-bold text-rose-950">Offboarding Date (Last working Day)</td>
                      <td className="py-2.5 px-4 font-bold text-rose-900 text-sm">{offboarding.offboardingDateLWD}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">4</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Offboarding Reason</td>
                      <td className="py-2.5 px-4 text-slate-700">{offboarding.offboardingReason}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">5</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">AB Sponsor Email</td>
                      <td className="py-2.5 px-4 font-mono text-slate-800">{offboarding.abSponsorEmail}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">6</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Division Name</td>
                      <td className="py-2.5 px-4 text-slate-800">{offboarding.divisionName}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">7</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">AB-Joining Date (Current PO)</td>
                      <td className="py-2.5 px-4 text-slate-800">{offboarding.abJoiningDateCurrentPO}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">8</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Billing Start Date (Current Year)</td>
                      <td className="py-2.5 px-4 text-slate-800">{offboarding.billingStartDateCurrentYear}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">9</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Billing Rate with Currency</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700 font-mono">{offboarding.billingRateWithCurrency}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">10</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">Purchase Order Number</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{offboarding.purchaseOrderNumber}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">11</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">ADM Seniority</td>
                      <td className="py-2.5 px-4 text-slate-800">{offboarding.admSeniority}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">12</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">ADM Role (as per SOW)</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{offboarding.admRole}</td>
                    </tr>
                    <tr className="bg-amber-50/50 hover:bg-amber-50">
                      <td className="py-2.5 px-4 text-center text-amber-600 font-bold font-mono">13</td>
                      <td className="py-2.5 px-4 font-bold text-amber-950">Billed days in Current Year</td>
                      <td className="py-2.5 px-4 font-bold text-amber-900">{offboarding.billedDaysCurrentYear}</td>
                    </tr>
                    <tr className="bg-blue-50/50 hover:bg-blue-50">
                      <td className="py-2.5 px-4 text-center text-blue-600 font-bold font-mono">14</td>
                      <td className="py-2.5 px-4 font-bold text-blue-950">Is timesheet in sync with billed days? (For T&M)</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs ${
                          offboarding.isTimesheetInSync === 'Yes' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {offboarding.isTimesheetInSync}
                        </span>
                      </td>
                    </tr>
                    {request.customFields && request.customFields.length > 0 && request.customFields.map((cf, idx) => (
                      <tr key={cf.id} className="hover:bg-slate-50 bg-blue-50/20">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{15 + idx}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center space-x-1.5">
                          <span>{cf.label}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Custom Field</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-900 font-medium">{cf.value || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* IT Asset Recovery Status */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Contingent Worker Asset & Security Deprovisioning Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Laptop / Equipment Returned</span>
                    <span className={`font-bold ${offboarding.assetChecklist?.laptopReturned ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {offboarding.assetChecklist?.laptopReturned ? 'Yes' : 'Pending Depot'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Building Badge Revoked</span>
                    <span className={`font-bold ${offboarding.assetChecklist?.badgeRevoked ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {offboarding.assetChecklist?.badgeRevoked ? 'Yes' : 'Pending LWD'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-700">Workday Status</span>
                    <span className={`font-bold ${offboarding.workdayTerminationScreenshot ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {offboarding.workdayTerminationScreenshot ? 'Termination Initiated' : 'Pending Screenshot'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OFFBOARDING TAB 2: WORKDAY STATUS, EVIDENCE & GOVERNANCE */}
          {isOffboarding && activeTab === 'termination_proof' && offboarding && (
            <div className="space-y-6">
              {/* Top Governance Pipeline Tracker */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center text-white">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-400" />
                      Offboarding Governance Status & Audit Evidence
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tracking Manager Pre-Initiation Acknowledgement, Workday Termination Proof, and Pre-LWD Timesheets
                    </p>
                  </div>
                  <div>
                    {offboarding.workdayTerminationScreenshot ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Completed & Verified
                      </span>
                    ) : offboarding.managerAcknowledged ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                        Awaiting Workday Proof from PMO/Manager
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                        Awaiting Manager Acknowledgement
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Step Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
                  {/* Step 1 */}
                  <div className="p-2.5 rounded-lg bg-slate-800/80 border border-emerald-600/40">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] mb-1">
                      <span>1. 14-Field Declaration</span>
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      Submitted by {request.supplierName}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-2.5 rounded-lg border ${
                    offboarding.managerAcknowledged
                      ? 'bg-slate-800/80 border-emerald-600/40'
                      : 'bg-slate-800/40 border-amber-500/40'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span className={offboarding.managerAcknowledged ? 'text-emerald-400' : 'text-amber-400'}>
                        2. Manager Pre-Ack
                      </span>
                      {offboarding.managerAcknowledged ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      {offboarding.managerAcknowledged ? `Target: ${offboarding.managerTargetInitiationDate}` : 'Pending Manager Review'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-2.5 rounded-lg border ${
                    offboarding.workdayTerminationScreenshot
                      ? 'bg-slate-800/80 border-emerald-600/40'
                      : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span className={offboarding.workdayTerminationScreenshot ? 'text-emerald-400' : 'text-slate-300'}>
                        3. Workday Proof
                      </span>
                      {offboarding.workdayTerminationScreenshot ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      {offboarding.workdayTerminationScreenshot ? `Ref: ${offboarding.workdayTerminationNumber}` : 'Pending Proof Upload'}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-2.5 rounded-lg border ${
                    offboarding.timesheetConfirmedTwoDaysPrior
                      ? 'bg-slate-800/80 border-emerald-600/40'
                      : 'bg-slate-800/40 border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span className={offboarding.timesheetConfirmedTwoDaysPrior ? 'text-emerald-400' : 'text-slate-300'}>
                        4. Pre-LWD Timesheet
                      </span>
                      {offboarding.timesheetConfirmedTwoDaysPrior ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      {offboarding.timesheetConfirmedTwoDaysPrior ? 'Timesheet Aligned' : 'Scheduled 2 days pre-LWD'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: MANAGER PRE-INITIATION ACKNOWLEDGEMENT */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Manager Pre-Initiation Acknowledgement
                      </h4>
                      <p className="text-xs text-slate-500">
                        Hiring sponsor review and target initiation commitment before Workday execution
                      </p>
                    </div>
                  </div>
                  <div>
                    {offboarding.managerAcknowledged ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status: Acknowledged by Manager</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Status: Pending Manager Acknowledgement</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence & Status Content */}
                {offboarding.managerAcknowledged ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Committed Workday Target Date</span>
                        <span className="font-bold text-blue-900 text-sm font-mono flex items-center mt-0.5">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          Initiate by {offboarding.managerTargetInitiationDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Acknowledged By</span>
                        <span className="font-medium text-slate-800 text-xs mt-0.5 block">
                          {offboarding.managerAcknowledgedBy || offboarding.abSponsorEmail}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Date Acknowledged</span>
                        <span className="font-mono text-slate-700 text-xs mt-0.5 block">
                          {offboarding.managerAcknowledgedAt || request.createdAt}
                        </span>
                      </div>
                    </div>

                    {offboarding.managerAcknowledgementNotes && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                          Manager Attestation & Handover Notes:
                        </span>
                        <p className="text-slate-800 italic leading-relaxed text-xs">
                          &ldquo;{offboarding.managerAcknowledgementNotes}&rdquo;
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Formal policy sign-off confirmed. Automated email confirmation dispatched to all thread participants.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start space-x-2.5 text-amber-900">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">
                          The AB Hiring Manager (<strong>{offboarding.abSponsorEmail || details.abManagerNameOrEmail}</strong>) has received the 14-field offboarding notice and is required to acknowledge receipt and commit a target Workday initiation date prior to the resource&apos;s last working day (<strong>{offboarding.offboardingDateLWD}</strong>).
                        </p>
                        <div className="text-[11px] text-amber-800 font-mono">
                          Recipient: {offboarding.abSponsorEmail || details.abManagerNameOrEmail} | Escalation: pmo.contingent@ab.com | Dispatched: {request.createdAt}
                        </div>
                      </div>
                    </div>

                    {/* Role-Specific Action Controls */}
                    {isSupplier ? (
                      <div className="p-2.5 bg-white border border-amber-200 rounded-lg text-slate-600 text-[11px] flex items-center justify-between">
                        <span>ℹ️ <strong>Manager Responsibility</strong>: No supplier action is required. Status and committed date will update in real-time once the Manager acknowledges.</span>
                      </div>
                    ) : isHiringTeam ? (
                      <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                        <span className="text-amber-900 font-medium text-[11px]">
                          As Manager or PMO, acknowledge receipt to record policy compliance:
                        </span>
                        <button
                          type="button"
                          id="tab-manager-ack-btn"
                          onClick={() => setShowAcknowledgeDialog(true)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-xs transition"
                        >
                          Acknowledge as Manager & Set Target Date
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* SECTION 2: WORKDAY TERMINATION INITIATION & PROOF */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Workday Termination Initiation & Confirmation Proof
                      </h4>
                      <p className="text-xs text-slate-500">
                        Mandatory confirmation screenshot of Termination initiated in Workday Core HCM
                      </p>
                    </div>
                  </div>
                  <div>
                    {offboarding.workdayTerminationScreenshot ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status: Verified with Screenshot Evidence</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Status: Awaiting Workday Proof from PMO/Manager</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence & Status Content */}
                {offboarding.workdayTerminationScreenshot ? (
                  <div className="space-y-4 text-xs">
                    {/* Success Banner */}
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-0.5">
                        <h5 className="font-bold text-emerald-950 text-xs">
                          Workday Termination Event Initiated & Process Completed
                        </h5>
                        <p className="text-emerald-900 text-[11px] leading-relaxed">
                          PMO / Manager has initiated the termination transaction in Workday Core HCM and attached the verified confirmation screenshot evidence. Process status is closed as <strong>Completed (Offboarded)</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Audit Evidence Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Workday Event / Reference #</span>
                        <span className="font-bold text-slate-900 text-xs font-mono mt-0.5 block">
                          {offboarding.workdayTerminationNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Verified & Confirmed By</span>
                        <span className="font-medium text-slate-800 text-xs mt-0.5 block">
                          {offboarding.workdayTerminationScreenshot.uploadedBy}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Confirmation Timestamp</span>
                        <span className="font-mono text-slate-700 text-xs mt-0.5 block">
                          {offboarding.workdayTerminationScreenshot.uploadedAt}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">Attached Evidence File</span>
                        <span className="text-slate-800 text-xs truncate mt-0.5 block font-mono" title={offboarding.workdayTerminationScreenshot.fileName}>
                          {offboarding.workdayTerminationScreenshot.fileName} ({offboarding.workdayTerminationScreenshot.fileSize})
                        </span>
                      </div>
                    </div>

                    {/* Visual Screenshot Proof */}
                    <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          Attached Verification Screenshot Proof
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowFullImageModal(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect High-Res Evidence</span>
                        </button>
                      </div>

                      {/* Screenshot Thumbnail with watermark */}
                      <div 
                        onClick={() => setShowFullImageModal(true)}
                        className="relative cursor-pointer rounded-xl overflow-hidden border border-slate-300 max-h-72 bg-slate-950 flex items-center justify-center group"
                      >
                        <img 
                          src={offboarding.workdayTerminationScreenshot.previewUrl} 
                          alt="Workday Termination Screenshot" 
                          className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex items-end p-3.5">
                          <div className="text-white text-xs space-y-0.5">
                            <div className="font-bold text-xs flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              Workday Core HCM • Termination Initiation Verified
                            </div>
                            <div className="text-slate-300 text-[10px] font-mono">
                              Worker: {offboarding.resourceName} | Event Ref: {offboarding.workdayTerminationNumber}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start space-x-2.5 text-slate-700">
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-slate-900">
                          As per AB contingent workforce governance policy, <strong>PMO or the Hiring Manager must initiate contractor termination in Workday Core HCM and attach confirmation screenshot proof</strong> to complete the offboarding record.
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Automatic daily reminders are dispatched to the Manager &amp; PMO until the screenshot proof is recorded in the portal.
                        </p>
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          Current Status: Awaiting Workday Proof | Approvers: {offboarding.abSponsorEmail} &amp; pmo.contingent@ab.com | Daily Reminders: {offboarding.dailyRemindersCount || 0} dispatched
                        </div>
                      </div>
                    </div>

                    {/* Role-Specific Action Controls */}
                    {isSupplier ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 text-[11px] flex items-center justify-between">
                        <span>ℹ️ <strong>AB Internal Governance</strong>: Handled exclusively by AB PMO &amp; Hiring Management. No supplier action or upload required.</span>
                      </div>
                    ) : isHiringTeam ? (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-700 font-medium text-[11px]">
                          As PMO or Hiring Manager, upload the Workday initiation confirmation screenshot:
                        </span>
                        <button
                          type="button"
                          id="tab-upload-proof-btn"
                          onClick={() => setShowScreenshotUploadDialog(true)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-xs transition inline-flex items-center space-x-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Workday Confirmation Screenshot (Manager / PMO)</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* SECTION 3: 2-DAY PRE-LWD TIMESHEET ALIGNMENT */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        2-Day Pre-LWD Timesheet Alignment (For T&amp;M)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Verification of timesheet billing sync 2 days prior to last working day ({offboarding.offboardingDateLWD})
                      </p>
                    </div>
                  </div>
                  <div>
                    {offboarding.timesheetConfirmedTwoDaysPrior ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        <span>Verified In Sync with AB Internal Data</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                        <Clock className="w-3.5 h-3.5 text-purple-600 mr-1" />
                        <span>Pending 2-Day Pre-LWD Check</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-xs">
                  Two days before the last working day (<strong>{offboarding.offboardingDateLWD}</strong>), notification is triggered to ensure the contractor&apos;s timesheet has been submitted correctly and reconciled with AB internal timesheet data.
                </p>

                {/* Discrepancy Alert If Out of Sync */}
                {offboarding.isTimesheetInSync === 'No' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Timesheet Discrepancy</strong>: Resource billed {offboarding.billedDaysCurrentYear} days vs expected. Must be resolved before LWD.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onTriggerTimesheetReminder) onTriggerTimesheetReminder(request.id);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-[11px] shrink-0 ml-2"
                    >
                      {offboarding.timesheetDiscrepancyReminderSent ? 'Resend Alert' : 'Notify PMO & Team'}
                    </button>
                  </div>
                )}

                {!offboarding.timesheetConfirmedTwoDaysPrior && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onConfirmTimesheetSync) onConfirmTimesheetSync(request.id);
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition inline-flex items-center space-x-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Timesheet Alignment Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ONBOARDING TAB 1: COMPLETE 32-FIELD FORM */}
          {!isOffboarding && activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Onboarding Data Form Master Record
                </h3>
                <button
                  type="button"
                  onClick={() => downloadRequestExcel(request)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>

              {/* Batch Resource Summary Card & Switcher in Form View */}
              {request.batchResources && request.batchResources.length > 1 && (
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        ★
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        Batch Onboarding Workers Roster ({request.batchResources.length} Resources)
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Click dedicated resource button to filter
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {request.batchResources.map((res, idx) => {
                      const isSelected = selectedBatchResourceIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedBatchResourceIdx(idx);
                            setEvidenceResourceFilter(res.name);
                          }}
                          className={`text-left p-3 rounded-xl border transition flex flex-col justify-between space-y-1.5 ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}>
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-xs text-white truncate">{res.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {res.role} • {res.location || 'Location'}
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                            <span className="font-mono text-emerald-400">{res.rate || details.billingRateWithCurrency}</span>
                            {res.techScore && (
                              <span className="text-blue-300 font-semibold">Tech: {res.techScore}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">#</th>
                      <th className="py-2 px-3 w-1/3">Field Name</th>
                      <th className="py-2 px-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr><td className="py-2 px-3 text-slate-400">1</td><td className="py-2 px-3 font-medium">First Name</td><td className="py-2 px-3 font-semibold">{details.firstName}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">2</td><td className="py-2 px-3 font-medium">Middle Name</td><td className="py-2 px-3">{details.middleName || 'NA'}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">3</td><td className="py-2 px-3 font-medium">Last Name</td><td className="py-2 px-3 font-semibold">{details.lastName}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">4</td><td className="py-2 px-3 font-medium">Vendor Name</td><td className="py-2 px-3">{details.vendorName}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">5</td><td className="py-2 px-3 font-medium">Vendor Delivery Manager Email</td><td className="py-2 px-3 font-mono">{details.vendorDeliveryManagerEmail}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">6</td><td className="py-2 px-3 font-medium">Resource Location</td><td className="py-2 px-3">{details.resourceLocation}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">7</td><td className="py-2 px-3 font-medium">Worked with AB Earlier</td><td className="py-2 px-3">{details.workedWithABEarlier ? 'Yes' : 'No'}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">8</td><td className="py-2 px-3 font-medium">AB Login ID</td><td className="py-2 px-3 font-mono">{details.abLoginId || 'NA'}</td></tr>
                    <tr className="bg-blue-50/50"><td className="py-2 px-3 text-blue-600 font-bold">9</td><td className="py-2 px-3 font-bold text-blue-900">AB Email ID (@ab.com)</td><td className="py-2 px-3 font-mono font-bold text-blue-700">{details.abEmailId || 'NA'}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">10</td><td className="py-2 px-3 font-medium">Mobile Number</td><td className="py-2 px-3">{details.mobileNumber}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">11</td><td className="py-2 px-3 font-medium">Mobile OS</td><td className="py-2 px-3">{details.mobileOperatingSystem}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">12</td><td className="py-2 px-3 font-medium">Candidate Email ID</td><td className="py-2 px-3 font-mono">{details.candidateEmailId}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">13</td><td className="py-2 px-3 font-medium">AB Manager Name/Email</td><td className="py-2 px-3 font-semibold">{details.abManagerNameOrEmail}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">14</td><td className="py-2 px-3 font-medium">Division Name</td><td className="py-2 px-3">{details.divisionName}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">15</td><td className="py-2 px-3 font-medium">BGV Status</td><td className="py-2 px-3 font-bold text-emerald-700">{details.bgvStatus}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">16</td><td className="py-2 px-3 font-medium">BGV Email Sent to BG Team</td><td className="py-2 px-3">{details.bgvEmailSentToBgTeam ? 'Yes' : 'No'}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">17</td><td className="py-2 px-3 font-medium">Joining Date in AB</td><td className="py-2 px-3 font-semibold">{details.joiningDateInAB}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">18</td><td className="py-2 px-3 font-medium">Billing Start Date</td><td className="py-2 px-3">{details.billingStartDate}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">19</td><td className="py-2 px-3 font-medium">Billing Rate with Currency</td><td className="py-2 px-3 font-semibold text-emerald-700 font-mono">{details.billingRateWithCurrency}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">20</td><td className="py-2 px-3 font-medium">Purchase Order Number</td><td className="py-2 px-3 font-mono text-blue-700 font-semibold">{details.purchaseOrderNumber}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">21</td><td className="py-2 px-3 font-medium">Purchase Order End Date</td><td className="py-2 px-3">{details.purchaseOrderEndDate}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">22</td><td className="py-2 px-3 font-medium">ADM Seniority</td><td className="py-2 px-3">{details.admSeniority}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">23</td><td className="py-2 px-3 font-medium">ADM Role (as per SOW)</td><td className="py-2 px-3 font-semibold">{details.admRole}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">24</td><td className="py-2 px-3 font-medium">Project Name</td><td className="py-2 px-3">{details.projectName}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">25</td><td className="py-2 px-3 font-medium">Total Experience Prior to AB</td><td className="py-2 px-3">{details.totalExperiencePriorToAB}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">26</td><td className="py-2 px-3 font-medium">Relevant Experience Prior to AB</td><td className="py-2 px-3">{details.relevantExperiencePriorToAB}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">27</td><td className="py-2 px-3 font-medium">Technical Evaluation Score</td><td className="py-2 px-3 font-bold text-slate-900">{details.technicalEvaluationScore}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">28</td><td className="py-2 px-3 font-medium">Notice Period (Days)</td><td className="py-2 px-3">{details.noticePeriodDays} Days</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">29</td><td className="py-2 px-3 font-medium">Is Resource Subcontractor</td><td className="py-2 px-3">{details.isSubcontractor ? 'Yes' : 'No'}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">30</td><td className="py-2 px-3 font-medium">Subcontractors Allowed for PO</td><td className="py-2 px-3">{details.areSubcontractorsAllowedForPO}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">31</td><td className="py-2 px-3 font-medium">Demand Type</td><td className="py-2 px-3 font-medium">{details.demandType}</td></tr>
                    <tr><td className="py-2 px-3 text-slate-400">32</td><td className="py-2 px-3 font-medium">AB email ID of Incumbent</td><td className="py-2 px-3 font-mono">{details.incumbentEmailId}</td></tr>
                    {request.customFields && request.customFields.length > 0 && request.customFields.map((cf, idx) => (
                      <tr key={cf.id} className="bg-blue-50/20 hover:bg-blue-50/40">
                        <td className="py-2 px-3 text-blue-700 font-mono font-semibold">{33 + idx}</td>
                        <td className="py-2 px-3 font-medium flex items-center space-x-1.5">
                          <span className="text-slate-900 font-semibold">{cf.label}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">Custom Field</span>
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-medium">{cf.value || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ONBOARDING TAB 3: EVIDENCES */}
          {!isOffboarding && activeTab === 'evidences' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 flex items-start space-x-3 text-xs">
                <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    Dedicated Technical Evaluation Evidence & Scorecard
                  </h4>
                  <p className="text-amber-900 mt-0.5 leading-relaxed">
                    Evaluated for <strong>{details.admRole}</strong> ({details.admSeniority} Seniority). 
                    The Technical Scorecard verified competency score is <strong>{details.technicalEvaluationScore || '92/100'}</strong>.
                  </p>
                </div>
              </div>

              {/* Dedicated Resource Filter Buttons for Evidences */}
              {request.batchResources && request.batchResources.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] shrink-0 mr-1">
                    Filter by Resource:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEvidenceResourceFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      evidenceResourceFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-300'
                    }`}
                  >
                    All Dossier Files ({evidences.length})
                  </button>

                  {request.batchResources.map((res, i) => {
                    const count = evidences.filter(
                      (e) => e.resourceName === res.name || e.name.toLowerCase().includes(res.name.toLowerCase().split(' ')[0])
                    ).length;
                    const isSelected = evidenceResourceFilter === res.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEvidenceResourceFilter(res.name)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-300'
                        }`}
                      >
                        <User className="w-3 h-3" />
                        <span>{res.name}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setEvidenceResourceFilter('shared')}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                      evidenceResourceFilter === 'shared'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <span>🏢 Shared SOW / Contract</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                      {evidences.filter((e) => e.resourceId === 'shared' || (!e.resourceId && e.category === 'sow_contract')).length}
                    </span>
                  </button>
                </div>
              )}

              {/* Evidences List with Resource Attribution Badges */}
              {(() => {
                const filteredEvidences = evidences.filter((ev) => {
                  if (evidenceResourceFilter === 'all') return true;
                  if (evidenceResourceFilter === 'shared') {
                    return ev.resourceId === 'shared' || (!ev.resourceId && ev.category === 'sow_contract');
                  }
                  return ev.resourceName === evidenceResourceFilter || ev.name.toLowerCase().includes(evidenceResourceFilter.toLowerCase().split(' ')[0]);
                });

                if (filteredEvidences.length === 0) {
                  return (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No documents found for filter &quot;{evidenceResourceFilter}&quot;.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredEvidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">{ev.name}</span>
                              {ev.category === 'technical_evaluation' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-300">
                                  Dedicated Technical Evidence
                                </span>
                              )}
                              {ev.resourceName ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  👤 {ev.resourceName}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                  🏢 Shared Batch File
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              Size: {ev.size} | Uploaded: {new Date(ev.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => alert(`Document Preview: ${ev.name} verified and certified.`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition shrink-0 self-start sm:self-auto"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View File</span>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ONBOARDING TAB: COMPLIANCE CHECKS (INTERNAL VALIDATION CHECKLIST) */}
          {!isOffboarding && activeTab === 'validation' && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                      Compliance Checks
                    </h4>
                    <p className="text-xs text-slate-500">
                      Compliance gates required prior to Workday Contingent Worker creation
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isHiringTeam && onValidateAllChecklist && (
                      <button
                        type="button"
                        id="validate-all-gates-btn"
                        onClick={() => onValidateAllChecklist(request.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
                        title="Mark all compliance gates verified and compliant"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Quick-Verify All Requirements</span>
                      </button>
                    )}
                  </div>
                </div>

                {isSupplier && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center space-x-2">
                    <span className="text-sm">ℹ️</span>
                    <span><strong>AB Internal Governance</strong>: These validation gates are audited and signed off by the AB PMO and Hiring Sponsor. No supplier action is required.</span>
                  </div>
                )}

                {/* Date Gap Policy Compliance Gate */}
                {(() => {
                  const gapCheck = checkOnboardingDateGap(details.demandType, details.joiningDateInAB, details.billingStartDate);
                  if (gapCheck.hasPolicyReminder) {
                    return (
                      <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-xl space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="font-bold text-amber-950 text-xs">
                              🚩 Policy Flag: Billing Start Date vs Onboarding Date Check
                            </span>
                          </div>
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-950 border border-amber-400">
                            ACTION REQUIRED REVIEW
                          </span>
                        </div>
                        <p className="text-amber-900 font-semibold text-xs leading-relaxed">
                          {!isSupplier ? gapCheck.internalFlagMessage : gapCheck.supplierMessage}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-amber-800 font-mono bg-white/80 p-2 rounded border border-amber-200">
                          <span>Demand Type: <strong>{details.demandType}</strong></span>
                          <span>•</span>
                          <span>Onboarding (Joining): <strong>{details.joiningDateInAB}</strong></span>
                          <span>•</span>
                          <span>Billing Start: <strong>{details.billingStartDate}</strong></span>
                          <span>•</span>
                          <span>Gap: <strong>{gapCheck.gapDays} calendar day(s)</strong> {gapCheck.scenario === 1 ? '(< 7 days)' : '(< 30 days)'}</span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold">Billing Start Date Policy Aligned</span>
                          <span className="text-[11px] text-emerald-700 font-mono">
                            ({details.demandType}: {details.joiningDateInAB} &rarr; {details.billingStartDate}, {gapCheck.gapDays}d gap)
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          PASS
                        </span>
                      </div>
                    );
                  }
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Gate 1: BGV Screening Clearance */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${validationChecklist.bgvVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <span className="font-bold text-slate-800">1. BGV Screening Clearance</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${validationChecklist.bgvVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {validationChecklist.bgvVerified ? 'PASSED & AUDITED' : 'PENDING AUDIT'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Candidate background verification status: <strong>{details.bgvStatus}</strong>.
                      {validationChecklist.bgvVerifiedBy && ` Verified by: ${validationChecklist.bgvVerifiedBy}`}
                    </p>
                    {isHiringTeam && onToggleChecklist && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onToggleChecklist(request.id, 'bgvVerified')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            validationChecklist.bgvVerified 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {validationChecklist.bgvVerified ? 'Unmark Verified' : 'Verify BGV Clearance'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gate 2: PO Active & Budget Funded */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${validationChecklist.poActiveAndFunded ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        <span className="font-bold text-slate-800">2. PO Active &amp; Budget Funded</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${validationChecklist.poActiveAndFunded ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {validationChecklist.poActiveAndFunded ? 'FUNDED & VALID' : 'CHECK PENDING'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      PO: <strong className="font-mono text-blue-700">{details.purchaseOrderNumber}</strong> | End Date: {details.purchaseOrderEndDate}
                      {validationChecklist.poVerifiedBy && ` | Verified by: ${validationChecklist.poVerifiedBy}`}
                    </p>
                    {isHiringTeam && onToggleChecklist && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onToggleChecklist(request.id, 'poActiveAndFunded')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            validationChecklist.poActiveAndFunded 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {validationChecklist.poActiveAndFunded ? 'Unmark Verified' : 'Confirm PO Funding'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gate 3: Technical Evaluation Scorecard */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${validationChecklist.technicalEvaluationVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <span className="font-bold text-slate-800">3. Technical Evaluation Scorecard</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${validationChecklist.technicalEvaluationVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {validationChecklist.technicalEvaluationVerified ? 'SCORECARD VALIDATED' : 'UNVERIFIED'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Evaluation Score: <strong>{details.technicalEvaluationScore || '85/100'}</strong> (Interviewer: {details.abManagerNameOrEmail})
                    </p>
                    {isHiringTeam && onToggleChecklist && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onToggleChecklist(request.id, 'technicalEvaluationVerified')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            validationChecklist.technicalEvaluationVerified 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {validationChecklist.technicalEvaluationVerified ? 'Unmark Verified' : 'Verify Scorecard'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gate 4: Subcontractor Policy Adherence */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${validationChecklist.subcontractorCompliant ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span className="font-bold text-slate-800">4. Subcontractor Policy Adherence</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${validationChecklist.subcontractorCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {validationChecklist.subcontractorCompliant ? 'COMPLIANT' : 'REVIEW REQUIRED'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Resource Type: <strong>{details.isSubcontractor ? 'Subcontractor' : 'Direct Agency'}</strong> | Allowed for PO: {details.areSubcontractorsAllowedForPO}
                    </p>
                    {isHiringTeam && onToggleChecklist && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onToggleChecklist(request.id, 'subcontractorCompliant')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            validationChecklist.subcontractorCompliant 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {validationChecklist.subcontractorCompliant ? 'Unmark Compliant' : 'Verify Compliance'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gate 5: SOW Role & Billing Rate Alignment */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${validationChecklist.sowRoleAligned ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span className="font-bold text-slate-800">5. SOW Role &amp; Billing Rate Alignment</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${validationChecklist.sowRoleAligned ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {validationChecklist.sowRoleAligned ? 'ALIGNED WITH SOW' : 'PENDING CHECK'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Role: <strong>{details.admRole}</strong> ({details.admSeniority}) | Rate: <span className="font-mono text-emerald-700 font-bold">{details.billingRateWithCurrency}</span>
                    </p>
                    {isHiringTeam && onToggleChecklist && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onToggleChecklist(request.id, 'sowRoleAligned')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            validationChecklist.sowRoleAligned 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          {validationChecklist.sowRoleAligned ? 'Unmark Aligned' : 'Confirm SOW Alignment'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="border-l-2 border-blue-600 ml-3 pl-4 space-y-4 text-xs">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{entry.action}</span>
                        <span className="text-[11px] text-slate-400">{entry.timestamp}</span>
                      </div>
                      <div className="text-slate-600">
                        By <span className="font-medium text-slate-800">{entry.actor}</span> ({entry.role})
                      </div>
                      {entry.notes && (
                        <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1 font-mono text-[11px]">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenEmailViewer(request)}
              className="text-blue-700 hover:underline flex items-center font-medium"
            >
              <Mail className="w-3.5 h-3.5 mr-1" />
              <span>Offline Dispatched Emails</span>
            </button>
            <span className="text-slate-300">|</span>
            {isOffboarding ? (
              <button
                onClick={() => downloadOffboardingExcel(request)}
                className="text-emerald-700 hover:underline flex items-center font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                <span>Export 14-Field Form (Excel)</span>
              </button>
            ) : (
              <button
                onClick={() => downloadRequestExcel(request)}
                className="text-emerald-700 hover:underline flex items-center font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                <span>Download Excel Dossier</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-sm transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full Resolution Screenshot Modal */}
      {showFullImageModal && offboarding?.workdayTerminationScreenshot && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full border border-slate-700 shadow-2xl">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Workday Termination Confirmation Screenshot</h4>
                <p className="text-xs text-slate-400">Ref: {offboarding.workdayTerminationNumber} • Uploaded by {offboarding.workdayTerminationScreenshot.uploadedBy}</p>
              </div>
              <button
                onClick={() => setShowFullImageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={offboarding.workdayTerminationScreenshot.previewUrl}
                alt="Workday Termination Screenshot Full Resolution"
                className="max-w-full h-auto rounded shadow"
              />
            </div>
            <div className="bg-slate-100 px-5 py-2.5 flex justify-end">
              <button
                onClick={() => setShowFullImageModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs rounded-lg font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
