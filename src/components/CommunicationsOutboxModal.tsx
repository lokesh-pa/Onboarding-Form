import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight, 
  FileSpreadsheet, 
  Send,
  ExternalLink,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { WorkforceRequest, DispatchedEmail, UserRole } from '../types';

interface CommunicationsOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: WorkforceRequest[];
  onSelectRequest: (request: WorkforceRequest) => void;
  currentRole: UserRole;
}

interface FlattenedEmailRecord {
  email: DispatchedEmail;
  request: WorkforceRequest;
}

export const CommunicationsOutboxModal: React.FC<CommunicationsOutboxModalProps> = ({
  isOpen,
  onClose,
  requests,
  onSelectRequest,
  currentRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<FlattenedEmailRecord | null>(null);

  if (!isOpen) return null;

  // Aggregate all dispatched emails across all requests
  const allDispatchedEmails: FlattenedEmailRecord[] = [];
  requests.forEach((req) => {
    if (req.dispatchedEmails && req.dispatchedEmails.length > 0) {
      req.dispatchedEmails.forEach((email) => {
        allDispatchedEmails.push({ email, request: req });
      });
    }
  });

  // Sort descending by timestamp
  allDispatchedEmails.sort((a, b) => {
    return new Date(b.email.timestamp).getTime() - new Date(a.email.timestamp).getTime();
  });

  // Filter
  const filteredRecords = allDispatchedEmails.filter(({ email, request }) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query ||
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.to.some((t) => t.toLowerCase().includes(query)) ||
      email.cc.some((c) => c.toLowerCase().includes(query)) ||
      request.candidateName.toLowerCase().includes(query) ||
      request.referenceCode.toLowerCase().includes(query);

    const matchesType = typeFilter === 'all' || email.bodyType === typeFilter;

    return matchesSearch && matchesType;
  });

  const activeRecord = selectedRecord || filteredRecords[0] || null;

  const getBadgeForBodyType = (type: DispatchedEmail['bodyType']) => {
    switch (type) {
      case 'onboarding_initiated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Onboarding Intake</span>;
      case 'manager_signoff':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">Manager Sign-Off</span>;
      case 'workday_approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800">Workday Initiated</span>;
      case 'onboarding_completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">@ab.com Email Assigned</span>;
      case 'info_query':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Query to Vendor</span>;
      case 'info_reply':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">Vendor Reply</span>;
      case 'offboarding_initiated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">Offboard Intake</span>;
      case 'offboarding_acknowledged':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">Sponsor Acknowledged</span>;
      case 'termination_confirmed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Termination Confirmed</span>;
      case 'timesheet_reminder':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Timesheet Alert</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">Notification</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base sm:text-lg text-white">Dispatched Communications &amp; Email Outbox</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  {allDispatchedEmails.length} Total Dispatches
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited enterprise mail trail: Every workflow event dispatches automatic notifications to all 6 stakeholders (Sponsor, PMO, Vendor, RAM, Candidate &amp; Actor).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient email (e.g. marcus.vance), subject, candidate, or ref code..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-medium text-slate-700"
            >
              <option value="all">All Event Types</option>
              <option value="onboarding_initiated">Onboarding Intake</option>
              <option value="manager_signoff">Manager Sign-Off</option>
              <option value="workday_approved">Workday Profile Initiated</option>
              <option value="onboarding_completed">@ab.com Email Assigned</option>
              <option value="info_query">Query to Vendor</option>
              <option value="info_reply">Vendor Clarification Reply</option>
              <option value="offboarding_initiated">Offboarding Intake</option>
              <option value="offboarding_acknowledged">Sponsor Acknowledged</option>
              <option value="timesheet_reminder">Timesheet Reminder</option>
              <option value="termination_confirmed">Termination Confirmed</option>
            </select>
          </div>
        </div>

        {/* Body 2-Column Split: Email List & Email Preview */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column: Email Thread List */}
          <div className="w-full md:w-5/12 border-r border-slate-200 overflow-y-auto bg-slate-50/50 divide-y divide-slate-200">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No dispatched communications found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query or filter</p>
              </div>
            ) : (
              filteredRecords.map((item) => {
                const isSelected = activeRecord?.email.id === item.email.id;
                return (
                  <div
                    key={item.email.id}
                    onClick={() => setSelectedRecord(item)}
                    className={`p-3.5 cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        {item.request.referenceCode}
                      </span>
                      {getBadgeForBodyType(item.email.bodyType)}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1 mb-1">
                      {item.email.subject}
                    </h4>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                      <span className="font-medium text-slate-700">To:</span> {item.email.to.join(', ')}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Worker: <strong>{item.request.candidateName}</strong></span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-0.5 text-slate-400" />
                        {new Date(item.email.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Email Detail / Preview */}
          <div className="hidden md:flex flex-1 flex-col overflow-y-auto bg-white p-6">
            {activeRecord ? (
              <div className="space-y-4">
                {/* Meta header */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{activeRecord.email.subject}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectRequest(activeRecord.request);
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition"
                    >
                      <span>Open Dossier</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800">From:</span> {activeRecord.email.from}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Dispatched:</span>{' '}
                      {new Date(activeRecord.email.timestamp).toLocaleString()}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-800">To:</span>{' '}
                      <span className="text-slate-900 font-medium">{activeRecord.email.to.join(', ')}</span>
                    </div>
                    {activeRecord.email.cc && activeRecord.email.cc.length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-slate-800">CC:</span>{' '}
                        <span className="text-slate-600">{activeRecord.email.cc.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Thymeleaf / HTML Email Body */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                        AB
                      </div>
                      <span className="font-semibold">AB Contingent Workforce Governance Mail System</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Template: Thymeleaf / HTML5</span>
                  </div>

                  <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed font-sans bg-white">
                    <p className="text-sm font-semibold text-slate-900">
                      Hello Hiring Team &amp; Vendor Partners,
                    </p>
                    <p>
                      An automated workflow transition has been completed on the AB-SUTRA Contingent Workforce Governance platform for candidate{' '}
                      <strong>{activeRecord.request.candidateName}</strong> (Ref: <span className="font-mono font-semibold">{activeRecord.request.referenceCode}</span>).
                    </p>

                    {activeRecord.email.customMessage && (
                      <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r text-amber-900 text-xs">
                        <p className="font-bold mb-0.5">Recorded Action Notes / Message:</p>
                        <p className="italic">{activeRecord.email.customMessage}</p>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Resource Name:</span>
                        <span className="font-bold text-slate-900">{activeRecord.request.candidateName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Supplier:</span>
                        <span className="text-slate-800">{activeRecord.request.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">AB Division:</span>
                        <span className="text-slate-800">{activeRecord.request.details.divisionName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PO Number:</span>
                        <span className="text-slate-800">{activeRecord.request.details.purchaseOrderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-blue-700">{activeRecord.request.status}</span>
                      </div>
                    </div>

                    {activeRecord.email.actionableLink && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectRequest(activeRecord.request);
                          }}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition"
                        >
                          <span>{activeRecord.email.actionableLink.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                      <p>This message was automatically generated by AB-SUTRA. All stakeholders (Sponsor, PMO, Vendor, RAM, Worker &amp; Actor) receive this dispatch for compliance verification.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select an email from the list to view its complete audit metadata and body.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
