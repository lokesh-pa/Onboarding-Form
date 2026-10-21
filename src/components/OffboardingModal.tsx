import React, { useState } from 'react';
import { 
  X, 
  UserMinus, 
  Mail, 
  Calendar, 
  Laptop, 
  AlertTriangle, 
  Send,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  Paperclip,
  Check,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { WorkforceRequest, OffboardingDetails, CustomFieldItem } from '../types';
import { parseExcelOffboardingFile } from '../utils/excelParser';
import { downloadSampleOffboardingTemplate } from '../utils/excelExport';

interface OffboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRequests: WorkforceRequest[];
  onSubmitOffboarding: (
    offboardingData: OffboardingDetails,
    originalWorkerRequest?: WorkforceRequest,
    customFields?: CustomFieldItem[]
  ) => void;
}

export const OffboardingModal: React.FC<OffboardingModalProps> = ({
  isOpen,
  onClose,
  activeRequests,
  onSubmitOffboarding
}) => {
  // Modal state
  const [selectedWorkerId, setSelectedWorkerId] = useState(activeRequests[0]?.id || '');
  const [excelUploaded, setExcelUploaded] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelRowsCount, setExcelRowsCount] = useState<number | null>(null);

  // 14 standard fields matching image
  const currentWorker = activeRequests.find((r) => r.id === selectedWorkerId) || activeRequests[0];

  const [resourceName, setResourceName] = useState(currentWorker?.candidateName || '');
  const [vendorName, setVendorName] = useState(currentWorker?.supplierName || currentWorker?.details.vendorName || '');
  const [resourceEmailAB, setResourceEmailAB] = useState(
    currentWorker?.details.abEmailId || (currentWorker ? `${currentWorker.candidateName.toLowerCase().replace(/\s+/g, '.')}@ab.com` : '')
  );
  const [offboardingDateLWD, setOffboardingDateLWD] = useState('30/09/2026');
  const [offboardingReason, setOffboardingReason] = useState('Project Completion / SOW Milestone Delivered');
  const [abSponsorEmail, setAbSponsorEmail] = useState(currentWorker?.details.abManagerNameOrEmail || '');
  const [divisionName, setDivisionName] = useState(currentWorker?.details.divisionName || '');
  const [abJoiningDateCurrentPO, setAbJoiningDateCurrentPO] = useState(currentWorker?.details.joiningDateInAB || '');
  const [billingStartDateCurrentYear, setBillingStartDateCurrentYear] = useState(currentWorker?.details.billingStartDate || '');
  const [billingRateWithCurrency, setBillingRateWithCurrency] = useState(currentWorker?.details.billingRateWithCurrency || '');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState(currentWorker?.details.purchaseOrderNumber || '');
  const [admSeniority, setAdmSeniority] = useState(currentWorker?.details.admSeniority || 'Senior');
  const [admRole, setAdmRole] = useState(currentWorker?.details.admRole || '');
  const [billedDaysCurrentYear, setBilledDaysCurrentYear] = useState('168 Days');
  const [isTimesheetInSync, setIsTimesheetInSync] = useState<'Yes' | 'No' | 'NA'>('Yes');

  // Asset Checklist
  const [laptopReturned, setLaptopReturned] = useState(true);
  const [badgeRevoked, setBadgeRevoked] = useState(true);
  const [systemAccessTerminated, setSystemAccessTerminated] = useState(true);
  const [additionalEmail, setAdditionalEmail] = useState('');

  // Custom Provisioned Fields (Captured from unknown Excel columns or added manually)
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>([]);

  const handleAddCustomField = () => {
    const newField: CustomFieldItem = {
      id: `cf-off-${Date.now()}`,
      key: `custom_field_${customFields.length + 1}`,
      label: `Additional Field ${customFields.length + 1}`,
      value: '',
      fieldType: 'text',
      source: 'manual'
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateCustomFieldLabel = (id: string, newLabel: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label: newLabel } : f))
    );
  };

  const handleUpdateCustomFieldValue = (id: string, newValue: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newValue } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Handle worker selection change to auto-fill known fields
  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const worker = activeRequests.find((r) => r.id === workerId);
    if (worker) {
      setResourceName(worker.candidateName);
      setVendorName(worker.supplierName || worker.details.vendorName || '');
      setResourceEmailAB(worker.details.abEmailId || `${worker.candidateName.toLowerCase().replace(/\s+/g, '.')}@ab.com`);
      setAbSponsorEmail(worker.details.abManagerNameOrEmail);
      setDivisionName(worker.details.divisionName);
      setAbJoiningDateCurrentPO(worker.details.joiningDateInAB);
      setBillingStartDateCurrentYear(worker.details.billingStartDate);
      setBillingRateWithCurrency(worker.details.billingRateWithCurrency);
      setPurchaseOrderNumber(worker.details.purchaseOrderNumber);
      setAdmSeniority(worker.details.admSeniority);
      setAdmRole(worker.details.admRole);
      if (worker.customFields && worker.customFields.length > 0) {
        setCustomFields(worker.customFields);
      }
    }
  };

  // Handle Excel upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelFileName(file.name);
      const parsed = await parseExcelOffboardingFile(file);
      if (parsed.resourceName) setResourceName(parsed.resourceName);
      if (parsed.vendorName) setVendorName(parsed.vendorName);
      if (parsed.resourceEmailAB) setResourceEmailAB(parsed.resourceEmailAB);
      if (parsed.offboardingDateLWD) setOffboardingDateLWD(parsed.offboardingDateLWD);
      if (parsed.offboardingReason) setOffboardingReason(parsed.offboardingReason);
      if (parsed.abSponsorEmail) setAbSponsorEmail(parsed.abSponsorEmail);
      if (parsed.divisionName) setDivisionName(parsed.divisionName);
      if (parsed.abJoiningDateCurrentPO) setAbJoiningDateCurrentPO(parsed.abJoiningDateCurrentPO);
      if (parsed.billingStartDateCurrentYear) setBillingStartDateCurrentYear(parsed.billingStartDateCurrentYear);
      if (parsed.billingRateWithCurrency) setBillingRateWithCurrency(parsed.billingRateWithCurrency);
      if (parsed.purchaseOrderNumber) setPurchaseOrderNumber(parsed.purchaseOrderNumber);
      if (parsed.admSeniority) setAdmSeniority(parsed.admSeniority);
      if (parsed.admRole) setAdmRole(parsed.admRole);
      if (parsed.billedDaysCurrentYear) setBilledDaysCurrentYear(parsed.billedDaysCurrentYear);
      if (parsed.isTimesheetInSync) setIsTimesheetInSync(parsed.isTimesheetInSync);

      if (parsed.customFields && parsed.customFields.length > 0) {
        setCustomFields((prev) => {
          const map = new Map(prev.map((f) => [f.key, f]));
          parsed.customFields!.forEach((cf) => map.set(cf.key, cf));
          return Array.from(map.values());
        });
      }

      setExcelUploaded(true);
      setExcelRowsCount(14 + (parsed.customFields?.length || 0));
    } catch (err) {
      alert('Error parsing offboarding Excel file. Please ensure it follows the Offboarding Form 2026 structure.');
    } finally {
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceName.trim()) {
      alert('Please enter or select a resource name.');
      return;
    }

    const offboardingData: OffboardingDetails = {
      resourceName,
      vendorName,
      resourceEmailAB,
      offboardingDateLWD,
      offboardingReason,
      abSponsorEmail,
      divisionName,
      abJoiningDateCurrentPO,
      billingStartDateCurrentYear,
      billingRateWithCurrency,
      purchaseOrderNumber,
      admSeniority,
      admRole,
      billedDaysCurrentYear,
      isTimesheetInSync,
      managerAcknowledged: false, // Manager must acknowledge with target initiation date
      dailyRemindersCount: 0,
      timesheetConfirmedTwoDaysPrior: false,
      timesheetDiscrepancyReminderSent: isTimesheetInSync === 'No',
      timesheetDiscrepancyReminderSentAt: isTimesheetInSync === 'No' ? new Date().toISOString() : undefined,
      billingEndDate: offboardingDateLWD,
      assetChecklist: {
        laptopReturned,
        badgeRevoked,
        systemAccessTerminated
      },
      comments: `Offboarding submitted by supplier. Reason: ${offboardingReason}. Timesheet sync with billed days (T&M): ${isTimesheetInSync}.`
    };

    onSubmitOffboarding(
      offboardingData,
      currentWorker,
      customFields.length > 0 ? customFields : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 px-6 py-4 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-rose-600/30 border border-rose-500/40">
              <UserMinus className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-base leading-tight">
                  Offboarding Data Form (2026)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Supplier Initiation
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                Fill online or upload Excel to auto-populate. Generates actionable emails, manager acknowledgement &amp; timesheet verification.
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

        {/* Co-aligned Actions Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
              <span>Fill Online Offboarding Data Form</span>
            </span>

            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer text-xs font-semibold shadow-2xs transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Offboarding Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={downloadSampleOffboardingTemplate}
            className="inline-flex items-center space-x-1.5 text-xs text-rose-700 hover:text-rose-800 font-medium hover:underline bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Excel Template</span>
          </button>
        </div>

        {/* Upload Success Banner */}
        {excelUploaded && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Successfully parsed <strong>{excelFileName}</strong>. All fields populated into the Offboarding Data Form below!
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Verified & Mapped
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
            {/* Auto-fill from Active Worker */}
            {activeRequests.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Select from Current Active Contingent Workers (Optional Quick-Fill):
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => handleWorkerChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {activeRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.candidateName} — {req.supplierName} ({req.details.divisionName}) [PO: {req.details.purchaseOrderNumber}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Table layout of the 14 fields from image */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex justify-between items-center">
                <span>Offboarding Data Form - Data Matrix</span>
                <span className="text-slate-500 font-normal lowercase">Standard Offboarding Fields</span>
              </div>
              <div className="divide-y divide-slate-100">
                {/* 1. Resource Name */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">1</div>
                  <div className="col-span-4 font-semibold text-slate-700">Resource Name *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      placeholder="Full Name as registered in Workday"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                {/* Vendor Name */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">•</div>
                  <div className="col-span-4 font-semibold text-slate-700">Vendor Name *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Infosys, TCS, Wipro, Tech Mahindra"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* 2. Resource Email (AB) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">2</div>
                  <div className="col-span-4 font-semibold text-slate-700">Resource Email (AB) *</div>
                  <div className="col-span-7">
                    <input
                      type="email"
                      required
                      value={resourceEmailAB}
                      onChange={(e) => setResourceEmailAB(e.target.value)}
                      placeholder="firstname.lastname@ab.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                {/* 3. Offboarding Date (Last working Day) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50 bg-rose-50/30">
                  <div className="col-span-1 text-rose-500 font-mono text-[11px]">3</div>
                  <div className="col-span-4 font-semibold text-rose-900">
                    Offboarding Date (Last working Day) *
                  </div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={offboardingDateLWD}
                      onChange={(e) => setOffboardingDateLWD(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-2.5 py-1.5 border border-rose-300 rounded-md text-xs font-semibold text-rose-900 bg-white"
                    />
                  </div>
                </div>

                {/* 4. Offboarding Reason */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">4</div>
                  <div className="col-span-4 font-semibold text-slate-700">Offboarding Reason *</div>
                  <div className="col-span-7">
                    <select
                      value={offboardingReason}
                      onChange={(e) => setOffboardingReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    >
                      <option value="Project Completion / SOW Milestone Delivered">Project Completion / SOW Milestone Delivered</option>
                      <option value="Resignation / Resource Voluntary Withdrawal">Resignation / Resource Voluntary Withdrawal</option>
                      <option value="PO Expiration / SOW Budget Realignment">PO Expiration / SOW Budget Realignment</option>
                      <option value="Vendor Transition / Supplier Consolidation">Vendor Transition / Supplier Consolidation</option>
                      <option value="Performance / Project Restructure">Performance / Project Restructure</option>
                    </select>
                  </div>
                </div>

                {/* 5. AB Sponsor Email */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">5</div>
                  <div className="col-span-4 font-semibold text-slate-700">AB Sponsor Email *</div>
                  <div className="col-span-7">
                    <input
                      type="email"
                      required
                      value={abSponsorEmail}
                      onChange={(e) => setAbSponsorEmail(e.target.value)}
                      placeholder="sponsor.manager@ab.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                {/* 6. Division Name */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">6</div>
                  <div className="col-span-4 font-semibold text-slate-700">Division Name *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={divisionName}
                      onChange={(e) => setDivisionName(e.target.value)}
                      placeholder="e.g. Wealth Management Tech"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                {/* 7. AB-Joining Date (Current PO) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">7</div>
                  <div className="col-span-4 font-semibold text-slate-700">AB-Joining Date (Current PO) *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={abJoiningDateCurrentPO}
                      onChange={(e) => setAbJoiningDateCurrentPO(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                {/* 8. Billing Start Date (Current Year) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">8</div>
                  <div className="col-span-4 font-semibold text-slate-700">Billing Start Date (Current Year) *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={billingStartDateCurrentYear}
                      onChange={(e) => setBillingStartDateCurrentYear(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                {/* 9. Billing Rate with Currency */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">9</div>
                  <div className="col-span-4 font-semibold text-slate-700">Billing Rate with Currency *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={billingRateWithCurrency}
                      onChange={(e) => setBillingRateWithCurrency(e.target.value)}
                      placeholder="e.g. $80/hr"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-emerald-700"
                    />
                  </div>
                </div>

                {/* 10. Purchase Order Number */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">10</div>
                  <div className="col-span-4 font-semibold text-slate-700">Purchase Order Number *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={purchaseOrderNumber}
                      onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                      placeholder="PO-AB-xxxx-xxxx"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono font-semibold text-blue-700"
                    />
                  </div>
                </div>

                {/* 11. ADM Seniority */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">11</div>
                  <div className="col-span-4 font-semibold text-slate-700">ADM Seniority *</div>
                  <div className="col-span-7">
                    <select
                      value={admSeniority}
                      onChange={(e) => setAdmSeniority(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Professional">Professional</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead / Specialist">Lead / Specialist</option>
                    </select>
                  </div>
                </div>

                {/* 12. ADM Role (as per SOW) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50">
                  <div className="col-span-1 text-slate-400 font-mono text-[11px]">12</div>
                  <div className="col-span-4 font-semibold text-slate-700">ADM Role (as per SOW) *</div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={admRole}
                      onChange={(e) => setAdmRole(e.target.value)}
                      placeholder="e.g. Cloud DevOps Specialist"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                {/* 13. Billed days in Current Year */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50 bg-amber-50/30">
                  <div className="col-span-1 text-amber-600 font-mono text-[11px]">13</div>
                  <div className="col-span-4 font-semibold text-amber-900">
                    Billed days in Current Year *
                  </div>
                  <div className="col-span-7">
                    <input
                      type="text"
                      required
                      value={billedDaysCurrentYear}
                      onChange={(e) => setBilledDaysCurrentYear(e.target.value)}
                      placeholder="e.g. 168 Days"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-md text-xs font-semibold text-amber-900 bg-white"
                    />
                  </div>
                </div>

                {/* 14. Is timesheet in sync with billed days? (For T&M) */}
                <div className="grid grid-cols-12 p-2.5 items-center gap-2 hover:bg-slate-50/50 bg-blue-50/30">
                  <div className="col-span-1 text-blue-600 font-mono text-[11px]">14</div>
                  <div className="col-span-4 font-semibold text-blue-950">
                    Is timesheet in sync with billed days? (For T&M) *
                  </div>
                  <div className="col-span-7 flex items-center space-x-4">
                    {(['Yes', 'No', 'NA'] as const).map((opt) => (
                      <label key={opt} className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="isTimesheetInSync"
                          value={opt}
                          checked={isTimesheetInSync === opt}
                          onChange={() => setIsTimesheetInSync(opt)}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className={`font-semibold ${opt === 'Yes' ? 'text-emerald-700' : opt === 'No' ? 'text-rose-700' : 'text-slate-700'}`}>
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Timesheet Out of Sync Alert */}
                {isTimesheetInSync === 'No' && (
                  <div className="p-3 bg-amber-50 border-t border-amber-200 text-amber-950 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        Timesheet Discrepancy Alert Trigger:
                      </p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Because timesheet is not in sync with billed days ({billedDaysCurrentYear}), submitting this request will automatically trigger an urgent reminder to <strong>PMO (pmo.contingent@ab.com)</strong> and <strong>Supplier Delivery Manager ({currentWorker?.details.vendorDeliveryManagerEmail || 'Supplier DM'})</strong> to reconcile and complete timesheets before the contractor's Last Working Day (<strong>{offboardingDateLWD || 'LWD'}</strong>).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional & Provisioned Extensible Fields */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center">
                    <Edit3 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Additional &amp; Provisioned Fields
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Captures unmapped columns from Excel or custom fields created/renamed for future offboarding requirements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {customFields.length === 0 ? (
                <div className="text-center py-3 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  No additional custom fields provisioned. Upload an Excel file with extra columns or click "Add Field" to define.
                </div>
              ) : (
                <div className="space-y-2">
                  {customFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <span className="text-[11px] font-mono text-slate-400 w-6 text-center">
                        #{idx + 15}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateCustomFieldLabel(field.id, e.target.value)}
                            placeholder="Field Label (Renameable)"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleUpdateCustomFieldValue(field.id, e.target.value)}
                            placeholder="Field Value / Notes"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Remove custom field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Asset Recovery Checklist */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <Laptop className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Physical & Logical Asset Surrender Checklist
              </h4>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laptopReturned}
                    onChange={(e) => setLaptopReturned(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700">AB Managed Laptop and physical peripherals returned / scheduled with depot</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={badgeRevoked}
                    onChange={(e) => setBadgeRevoked(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700">Building Access Badge / Keycard surrendered to Facilities</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemAccessTerminated}
                    onChange={(e) => setSystemAccessTerminated(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700">AB Active Directory, Workday, and VPN access termination queued</span>
                </label>
              </div>
            </div>

            {/* Offline Notification Email Trigger info */}
            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-950 space-y-1.5">
              <div className="font-semibold flex items-center text-xs">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Automated Notification & Actionable Email Trigger:
              </div>
              <p className="text-[11px] leading-relaxed text-rose-900/90">
                An offline email will be dispatched to <strong>AB Sponsor ({abSponsorEmail || 'Manager'})</strong>, <strong>PMO</strong>, and <strong>Supplier Desk</strong> with an actionable review link and the <strong>Offboarding Form 2026 Excel dossier</strong> as an attachment.
              </p>
              <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-600">
                <Paperclip className="w-3 h-3 text-slate-400" />
                <span>Attachment: Offboarding_Form_2026_{resourceName.replace(/\s+/g, '_')}.xlsx</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-sm transition text-xs"
              >
                <Send className="w-4 h-4" />
                <span>Submit 14-Field Offboarding & Trigger Email</span>
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};
