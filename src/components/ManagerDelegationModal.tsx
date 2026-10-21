import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Calendar, 
  Check, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Mail, 
  User, 
  Building, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { LongTermDelegation, UserRole } from '../types';
import { COMPANY_DIRECTORY, CompanyEmployee, searchCompanyDirectory } from '../data/companyDirectory';

interface ManagerDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  delegationConfig?: LongTermDelegation;
  delegation?: LongTermDelegation;
  onSaveDelegation: (config: LongTermDelegation) => void;
  onDeactivateDelegation?: () => void;
}

export const ManagerDelegationModal: React.FC<ManagerDelegationModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  delegationConfig: propDelegationConfig,
  delegation: propDelegation,
  onSaveDelegation,
  onDeactivateDelegation
}) => {
  const activeConfig = propDelegationConfig || propDelegation || {
    enabled: false,
    managerEmail: 'robert.sponsor@ab.com',
    delegateeEmail: '',
    delegateeName: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    reason: 'Annual leave backup coverage & sprint continuity'
  };

  const [managerEmail, setManagerEmail] = useState(activeConfig.managerEmail || 'robert.sponsor@ab.com');
  const [delegateeEmail, setDelegateeEmail] = useState(activeConfig.delegateeEmail || '');
  const [delegateeName, setDelegateeName] = useState(activeConfig.delegateeName || '');
  const [startDate, setStartDate] = useState(activeConfig.startDate || new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(
    activeConfig.endDate || 
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [reason, setReason] = useState(activeConfig.reason || 'Annual leave backup coverage & sprint continuity');
  const [enabled, setEnabled] = useState(Boolean(activeConfig.enabled));

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanyEmployee[]>([]);

  useEffect(() => {
    if (isOpen) {
      setManagerEmail(activeConfig.managerEmail || 'robert.sponsor@ab.com');
      setDelegateeEmail(activeConfig.delegateeEmail || '');
      setDelegateeName(activeConfig.delegateeName || '');
      setStartDate(activeConfig.startDate || new Date().toISOString().substring(0, 10));
      setEndDate(activeConfig.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
      setReason(activeConfig.reason || 'Annual leave backup coverage & sprint continuity');
      setEnabled(Boolean(activeConfig.enabled));
      setIsSearching(false);
    }
  }, [isOpen, propDelegationConfig, propDelegation]);

  if (!isOpen) return null;

  const handleEmailSearch = (query: string) => {
    setDelegateeEmail(query);
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const results = searchCompanyDirectory(query);
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectEmployee = (emp: CompanyEmployee) => {
    setDelegateeEmail(emp.email);
    setDelegateeName(emp.name);
    setIsSearching(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateeEmail.trim()) {
      alert('Please provide delegatee corporate email ID.');
      return;
    }

    // Resolve name if not provided
    const resolvedName = delegateeName.trim() || 
      (COMPANY_DIRECTORY.find(e => e.email.toLowerCase() === delegateeEmail.trim().toLowerCase())?.name) || 
      delegateeEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const updated: LongTermDelegation = {
      enabled,
      managerEmail: managerEmail.trim(),
      delegateeEmail: delegateeEmail.trim(),
      delegateeName: resolvedName,
      startDate,
      endDate,
      reason: reason.trim(),
      enabledAt: new Date().toISOString()
    };

    onSaveDelegation(updated);
    onClose();
  };

  const handleDeactivate = () => {
    const updated: LongTermDelegation = {
      ...activeConfig,
      enabled: false
    };
    onSaveDelegation(updated);
    if (onDeactivateDelegation) onDeactivateDelegation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600/30 border border-indigo-500/40">
              <UserCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base leading-tight">
                  Long-Term Delegation &amp; Backup Coverage
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Manager Module
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Delegate all workforce requests and approvals to a designated peer for a set period of time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Status Alert if currently active */}
          {activeConfig.enabled && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Backup Coverage Active
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Requests delegated to <strong>{activeConfig.delegateeName || activeConfig.delegateeEmail}</strong> until {activeConfig.endDate}.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeactivate}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[10px] transition shrink-0"
              >
                Deactivate
              </button>
            </div>
          )}

          {/* Manager Account (Assignor) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hiring Manager / Sponsor Corporate Email
            </label>
            <input
              type="email"
              required
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Requests assigned to this manager email will automatically allow the delegatee full authorization during the coverage window.
            </span>
          </div>

          {/* Searchable Delegatee Corporate Email */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 text-xs">
                Delegatee Corporate Email ID <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-indigo-600 font-medium">
                Searchable internal company database
              </span>
            </div>

            <div className="relative">
              <input
                type="email"
                required
                value={delegateeEmail}
                onChange={(e) => handleEmailSearch(e.target.value)}
                onFocus={() => {
                  if (delegateeEmail) setIsSearching(true);
                  setSearchResults(searchCompanyDirectory(delegateeEmail));
                }}
                placeholder="Type name or email (e.g. sarah.jenkins@ab.com)..."
                className="w-full pl-8 pr-3 py-2 border border-indigo-400 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            {/* Instant Search Results Dropdown */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Company Directory Matches
                </div>
                {searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <span>{emp.name}</span>
                        <span className="text-[10px] font-normal text-slate-500">({emp.role})</span>
                      </div>
                      <div className="text-[11px] font-mono text-indigo-600">{emp.email}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {emp.division}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Non-mandatory Delegatee Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 text-xs">
                Delegatee Name (Non-Mandatory)
              </label>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>
            <input
              type="text"
              value={delegateeName}
              onChange={(e) => setDelegateeName(e.target.value)}
              placeholder="Auto-derived from directory or email if left blank"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            />
          </div>

          {/* Date Range: Set Period of Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Coverage Start Date *</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Coverage End Date *</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Reason / Handover context */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Delegation Reason &amp; Handover Notes
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. OOO vacation coverage / Sabbatical / Critical Project Transition"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            />
          </div>

          {/* Enable Switch */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Activate Long-Term Delegation
                </span>
                <span className="text-[11px] text-slate-600">
                  Transfers approval and sign-off authority for all requests during this window.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
              <input
                type="checkbox"
                id="enable-long-term-delegation-toggle"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-long-term-delegation-btn"
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Dispatch Delegation Notice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
