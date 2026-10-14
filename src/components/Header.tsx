import React from 'react';
import { UserRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  FileSpreadsheet, 
  PlusCircle, 
  UserMinus, 
  CheckCircle2,
  AlertCircle,
  Briefcase,
  RotateCcw,
  BookOpen,
  UserCheck,
  Mail
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenOnboarding: () => void;
  onOpenOffboarding: () => void;
  onOpenBgvModal: () => void;
  onDownloadTemplate: () => void;
  onResetAllActions?: () => void;
  onDownloadGovernanceReport?: () => void;
  pendingValidationCount: number;
  infoRequestedCount: number;
  managerPendingCount?: number;
  onOpenPolicyResources?: () => void;
  onOpenManagerDelegation?: () => void;
  onOpenArchitecture?: () => void;
  activeDelegationCount?: number;
  onOpenCommunications?: () => void;
  dispatchedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenOnboarding,
  onOpenOffboarding,
  onOpenBgvModal,
  onDownloadTemplate,
  onResetAllActions,
  onDownloadGovernanceReport,
  pendingValidationCount,
  infoRequestedCount,
  onOpenPolicyResources,
  onOpenManagerDelegation,
  onOpenArchitecture,
  activeDelegationCount = 0,
  onOpenCommunications,
  dispatchedCount = 0
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Subtle AB-SUTRA Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-base text-white tracking-wider shadow-inner">
              AB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  AB-SUTRA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-blue-300 border border-slate-700">
                  Workforce Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contingent Resource Lifecycle &amp; Governance
              </p>
            </div>
          </div>

          {/* Role Switcher & Architecture Exploration */}
          <div className="flex items-center space-x-2">
            {onOpenArchitecture && (
              <button
                id="header-architecture-btn"
                onClick={onOpenArchitecture}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 shadow-xs transition"
                title="Explore Spring Boot 3, Java 17, JPA Entities, POI Excel & Thymeleaf Architecture"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Spring Boot 3 Architecture</span>
              </button>
            )}

            {onOpenPolicyResources && (
              <button
                id="header-policy-resources-btn"
                onClick={onOpenPolicyResources}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition"
                title="Policy Documents, Internal Hyperlinks & Training Videos"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Policy &amp; Training Hub</span>
              </button>
            )}

            {onOpenCommunications && (
              <button
                id="header-communications-btn"
                onClick={onOpenCommunications}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition shadow-xs"
                title="Cross-Request Communications Outbox: Inspect all automated emails dispatched across all stakeholders"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden xl:inline">Communications Outbox</span>
                <span className="xl:hidden">Outbox</span>
                {dispatchedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-bold">
                    {dispatchedCount}
                  </span>
                )}
              </button>
            )}

            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center space-x-1 shadow-inner">
              <button
                id="role-supplier-btn"
                onClick={() => onRoleChange('supplier')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'supplier'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vendor Partner View: Submit onboarding packages, send BGV notices, schedule offboardings, and view generated corporate emails"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Supplier</span>
                {infoRequestedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                    {infoRequestedCount}
                  </span>
                )}
              </button>

              <button
                id="role-manager-pmo-btn"
                onClick={() => onRoleChange('manager_pmo')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'manager_pmo' || currentRole === 'manager' || currentRole === 'pmo' || currentRole === 'hiring_team'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Merged PMO & Hiring Manager Role: Execute any technical sign-off, initiate Workday profile, input @ab.com email, commit target dates, and delegate requests without dependency"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PMO / Hiring Manager</span>
                {pendingValidationCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-bold rounded-full text-[10px]">
                    {pendingValidationCount}
                  </span>
                )}
              </button>

              <button
                id="role-admin-btn"
                onClick={() => onRoleChange('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'admin'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Admin & Governance View: Executive reporting, SLA monitoring, request reassignment, and audit compliance"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Admin / Governance</span>
              </button>
            </div>

            {onResetAllActions && (
              <button
                id="reset-all-actions-header-btn"
                onClick={onResetAllActions}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition shadow-xs"
                title="Reset all requests to clean, unacted initial state to test end-to-end flows"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Reset Actions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Sub-bar */}
      <div className="bg-slate-800/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4 text-slate-300">
            <span className="font-medium text-slate-400">Profile:</span>
            {currentRole === 'supplier' ? (
              <span className="inline-flex items-center text-blue-300 font-medium">
                <Users className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Supplier Portal (Onboarding Data Form, Offboarding Data Form & Corporate Email Visibility)
              </span>
            ) : currentRole === 'admin' ? (
              <span className="inline-flex items-center text-purple-300 font-medium">
                <Briefcase className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                Admin & Global Governance (SLA Reporting, Reassignment Authority & Complete Audit Master)
              </span>
            ) : (
              <span className="inline-flex items-center text-indigo-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                PMO / Hiring Manager (Autonomous Action: Sign-Off, Workday Initiation, @ab.com Final Step & Delegation)
              </span>
            )}

            <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-slate-700">
              <span className="inline-flex items-center text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Pending Review: <strong className="ml-1 text-slate-200">{pendingValidationCount}</strong>
              </span>
              <span className="inline-flex items-center text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Active in Workday: <strong className="ml-1 text-slate-200">1</strong>
              </span>
            </div>
          </div>

          {/* Action buttons strictly controlled by role */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Policy Hub button for mobile / smaller screens */}
            {onOpenPolicyResources && (
              <button
                type="button"
                onClick={onOpenPolicyResources}
                className="lg:hidden inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Policies</span>
              </button>
            )}

            {/* Manager / PMO Authority Delegation */}
            {currentRole !== 'supplier' && onOpenManagerDelegation && (
              <button
                id="header-delegate-authority-btn"
                type="button"
                onClick={onOpenManagerDelegation}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-200 border border-indigo-700/60 transition"
                title="Delegate approval authority to another manager for a specific time period"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Delegate Authority</span>
                {activeDelegationCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white font-bold rounded-full text-[10px]">
                    {activeDelegationCount} active
                  </span>
                )}
              </button>
            )}

            {/* ONLY Supplier can initiate Onboarding, Offboarding, download blank templates, or trigger BGV Pre-Check */}
            {currentRole === 'supplier' && (
              <>
                <button
                  id="download-excel-template-btn"
                  onClick={onDownloadTemplate}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
                  title="Download Blank Excel Template"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel Template</span>
                </button>

                <button
                  id="bgv-precheck-btn"
                  onClick={onOpenBgvModal}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
                  title="Draft BGV Confirmation Email notice to BGV team"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>BGV Confirmation Notice</span>
                </button>

                <button
                  id="initiate-offboarding-btn"
                  onClick={onOpenOffboarding}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 border border-rose-800/60 transition"
                >
                  <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Initiate Offboarding</span>
                </button>

                <button
                  id="new-onboarding-btn"
                  onClick={onOpenOnboarding}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Onboarding Request</span>
                </button>
              </>
            )}

            {currentRole === 'admin' && onDownloadGovernanceReport && (
              <button
                id="admin-export-governance-btn"
                onClick={onDownloadGovernanceReport}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition"
                title="Download consolidated executive workforce pipeline and audit logs Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-200" />
                <span>Export Governance & SLA Master</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
