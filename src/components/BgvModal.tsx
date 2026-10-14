import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  User
} from 'lucide-react';
import { AB_DIVISIONS } from '../data/mockData';
import { BgvResourceItem } from '../types';

interface BgvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmVerified: (data: {
    supplierName: string;
    workerNames: string[];
    resources: BgvResourceItem[];
    location: string;
    countrySpecificChecks: boolean;
    division: string;
    completionDate: string;
    proofFileName?: string;
  }) => void;
}

export const BgvModal: React.FC<BgvModalProps> = ({ isOpen, onClose, onConfirmVerified }) => {
  const [supplierName, setSupplierName] = useState('Apex Global Solutions Ltd');
  
  // Default to 3 resources with side-by-side locations
  const [resources, setResources] = useState<BgvResourceItem[]>([
    { id: '1', name: 'Sarah Jane Connor', location: 'Bengaluru, India' },
    { id: '2', name: 'Michael Anthony Scott', location: 'Hyderabad, India' },
    { id: '3', name: '', location: '' }
  ]);

  const [countrySpecificChecks, setCountrySpecificChecks] = useState(true);
  const [division, setDivision] = useState('Wealth Management Tech');
  const [completionDate, setCompletionDate] = useState('05/09/2026');
  const [attachedProofName, setAttachedProofName] = useState<string | null>('BGV_Clearance_Certificate_Apex.pdf');
  const [isSent, setIsSent] = useState(false);

  // Default CC stakeholders (Manager, Vendor, PMO) and manual additions
  const defaultCcRecipients = [
    'robert.smith@ab.com (AB Sponsor / Manager)',
    'vendor.coordinator@apextech.com (Vendor Delivery Desk)',
    'pmo.contingent@ab.com (PMO Operations Desk)'
  ];
  const [additionalCcList, setAdditionalCcList] = useState<string[]>([]);
  const [newCcInput, setNewCcInput] = useState('');

  const handleAddCcEmail = () => {
    const trimmed = newCcInput.trim();
    if (!trimmed) return;
    if (!additionalCcList.includes(trimmed)) {
      setAdditionalCcList((prev) => [...prev, trimmed]);
    }
    setNewCcInput('');
  };

  if (!isOpen) return null;

  const handleResourceChange = (id: string, field: 'name' | 'location', val: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleAddLine = () => {
    setResources((prev) => [
      ...prev,
      { id: 'res-' + Date.now(), name: '', location: '' }
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (resources.length <= 1) return;
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedProofName(e.target.files[0].name);
    }
  };

  const activeResources = resources.filter((r) => r.name.trim() !== '');

  const handleSendEmailNotice = () => {
    setIsSent(true);
    setTimeout(() => {
      const validResources = resources.filter((r) => r.name.trim() !== '');
      onConfirmVerified({
        supplierName,
        workerNames: validResources.map((r) => r.name.trim()),
        resources: validResources.map((r) => ({
          id: r.id,
          name: r.name.trim(),
          location: r.location.trim() || 'Global / Remote'
        })),
        location: validResources[0]?.location || 'Bengaluru, India',
        countrySpecificChecks,
        division,
        completionDate,
        proofFileName: attachedProofName || undefined
      });
      setIsSent(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-6 py-4 text-white flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-500/40">
              <ShieldCheck className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">
                Background Verification (BGV) Pre-Check Notice
              </h2>
              <p className="text-xs text-blue-200/80">
                Multi-Resource Prior Screening Notification to AB Background Screening Team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-3 text-xs text-amber-900 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Corporate Governance Requirement:</span> Before triggering onboarding in Workday, the vendor must dispatch this BGV clearance notice to{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono text-[11px]">
              Contingentworker.Backgroundscreening@ab.com
            </code>
            . You can add multiple resources located across different cities/countries in one notice.
          </div>
        </div>

        {/* Email Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Recipient & Subject preview */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex items-center">
              <span className="w-20 text-slate-500 font-semibold">To:</span>
              <span className="text-slate-800 font-semibold bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                Contingentworker.Backgroundscreening@ab.com
              </span>
            </div>
            
            {/* Default Copied Stakeholders: Manager, Vendor, PMO */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1">
              <span className="w-20 text-slate-500 font-semibold shrink-0">Default CC:</span>
              <div className="flex flex-wrap gap-1.5">
                {defaultCcRecipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px] font-sans"
                  >
                    <Mail className="w-3 h-3 mr-1 text-blue-600" />
                    {email}
                  </span>
                ))}
              </div>
            </div>

            {/* Additional manual CCs */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 pt-1 border-t border-slate-200/80">
              <span className="w-20 text-slate-500 font-semibold shrink-0">Add CC:</span>
              <div className="flex-1 space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={newCcInput}
                    onChange={(e) => setNewCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddCcEmail();
                      }
                    }}
                    placeholder="Enter additional email address and press Enter or click Add..."
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCcEmail}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                  >
                    Add CC
                  </button>
                </div>
                {additionalCcList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {additionalCcList.map((em) => (
                      <span
                        key={em}
                        className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded text-[11px]"
                      >
                        <span>{em}</span>
                        <button
                          type="button"
                          onClick={() => setAdditionalCcList((prev) => prev.filter((x) => x !== em))}
                          className="ml-1 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center pt-1 border-t border-slate-200/80">
              <span className="w-20 text-slate-500 font-semibold">Subject:</span>
              <span className="text-blue-700 font-sans font-medium text-xs">
                [BGV Clearance Notification] {supplierName || '<Supplier Name>'} - {activeResources.length} Resource(s) - {completionDate || '<Date>'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Supplier Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Apex Global Solutions Ltd"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contingent Worker Names & Locations Grid (User Request) */}
            <div className="sm:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Contingent Resources & Locations <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Specify each resource and their exact work location side-by-side
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {resources.map((res, index) => (
                  <div 
                    key={res.id} 
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center space-x-1.5 w-7 text-xs font-mono text-slate-400 shrink-0">
                      <span>{index + 1}.</span>
                    </div>

                    {/* Resource Name */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={res.name}
                        onChange={(e) => handleResourceChange(res.id, 'name', e.target.value)}
                        placeholder={`Worker ${index + 1} Full Name ${index === 0 ? '*' : '(optional)'}`}
                        className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Resource Location - Right next to it! */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={res.location}
                        onChange={(e) => handleResourceChange(res.id, 'location', e.target.value)}
                        placeholder={`Location (e.g. Bengaluru, India / Dallas, TX)`}
                        className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Remove Action */}
                    {resources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(res.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition shrink-0"
                        title="Remove resource line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                <span>Total resources specified: <strong className="text-slate-800">{activeResources.length}</strong></span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add another resource line</span>
                </button>
              </div>
            </div>

            {/* Division at AB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Division at AB <span className="text-rose-500">*</span>
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {AB_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Date of Background Screening Completion */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of BGV Completion [dd/mm/yyyy] <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Country specific checks (Yellow highlighted in Image 1) */}
            <div className="sm:col-span-2 bg-yellow-50/80 p-3.5 rounded-lg border border-yellow-300 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-yellow-900">
                  Have you performed country specific checks? <span className="text-rose-600">*</span>
                </span>
                <span className="text-[11px] text-yellow-700">
                  Mandatory compliance check across all candidate jurisdictions
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="countryChecks"
                    checked={countrySpecificChecks === true}
                    onChange={() => setCountrySpecificChecks(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Yes (Completed)</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="countryChecks"
                    checked={countrySpecificChecks === false}
                    onChange={() => setCountrySpecificChecks(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Attach Screenshot of email or Email as object below (Image 1 row 16) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Screenshot of Email or Email as Object Below
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center bg-slate-50/70 transition">
                <input
                  type="file"
                  id="bgv-file-input"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.eml,.msg"
                />
                <label htmlFor="bgv-file-input" className="cursor-pointer">
                  <UploadCloud className="w-7 h-7 text-blue-500 mx-auto mb-1" />
                  <span className="text-xs font-medium text-slate-700">
                    Click to attach BGV Certificate or Email screenshot
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">PDF, PNG, JPG, or EML (max 10MB)</p>
                </label>

                {attachedProofName && (
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{attachedProofName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedProofName(null)}
                      className="text-blue-500 hover:text-blue-800 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSendEmailNotice}
            disabled={isSent || !supplierName || activeResources.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-sm transition"
          >
            {isSent ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300 animate-spin" />
                <span>Dispatching Notice to BGV Team...</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Send BGV Notice & Mark Verified ({activeResources.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

