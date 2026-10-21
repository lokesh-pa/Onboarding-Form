import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  Paperclip, 
  Send, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  Bell, 
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { WorkforceRequest, DispatchedEmail, UserRole } from '../types';
import { downloadOffboardingExcel, downloadRequestExcel } from '../utils/excelExport';

interface EmailViewerModalProps {
  request: WorkforceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (actionType: string) => void;
  currentRole?: UserRole;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ 
  request, 
  isOpen, 
  onClose,
  onActionClick,
  currentRole = 'supplier'
}) => {
  const [copied, setCopied] = useState(false);
  const [activeEmailIndex, setActiveEmailIndex] = useState(0);

  if (!isOpen || !request) return null;

  const { details, bgv, evidences, emailDistribution, offboarding } = request;
  const isOffboarding = request.type === 'offboarding';

  // Build the list of dispatched emails for this request
  const threadEmails: DispatchedEmail[] = request.dispatchedEmails && request.dispatchedEmails.length > 0
    ? request.dispatchedEmails
    : isOffboarding
    ? [
        {
          id: 'email-off-1',
          timestamp: request.createdAt,
          from: emailDistribution.senderEmail || 'vendor.ops@supplier.com',
          to: [
            offboarding?.abSponsorEmail || details.abManagerNameOrEmail || 'marcus.vance@ab.com',
            emailDistribution.toPmoEmail || 'pmo.contingent@ab.com'
          ],
          cc: [
            emailDistribution.ccVendorDeliveryManagerEmail || 'dm@supplier.com',
            emailDistribution.senderEmail || 'vendor.ops@supplier.com',
            'it.asset.recovery@ab.com'
          ],
          subject: `[AB Offboarding Initiation] Formal 14-Field Offboarding Form: ${offboarding?.resourceName || request.candidateName} (${request.supplierName}) - PO: ${offboarding?.purchaseOrderNumber || details.purchaseOrderNumber}`,
          bodyType: 'offboarding_initiated',
          actionableLink: {
            label: 'Review Offboarding Request & Acknowledge Workday Initiation',
            url: `#review-${request.referenceCode}`
          },
          attachment: {
            name: `Offboarding_Form_2026_${(offboarding?.resourceName || request.candidateName).replace(/\s+/g, '_')}.xlsx`,
            size: '24.5 KB',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        },
        ...(offboarding?.managerAcknowledged ? [{
          id: 'email-off-2',
          timestamp: offboarding.managerAcknowledgedAt || request.updatedAt,
          from: offboarding.managerAcknowledgedBy || details.abManagerNameOrEmail || 'sponsor.manager@ab.com',
          to: [
            emailDistribution.senderEmail || 'vendor.ops@supplier.com',
            emailDistribution.toPmoEmail || 'pmo.contingent@ab.com'
          ],
          cc: [
            offboarding.abSponsorEmail || details.abManagerNameOrEmail,
            emailDistribution.ccVendorDeliveryManagerEmail || 'dm@supplier.com'
          ],
          subject: `[AB Offboarding Acknowledged] Sponsor Commitment: Will Initiate in Workday by ${offboarding.managerTargetInitiationDate || 'Committed Date'} - ${offboarding.resourceName || request.candidateName}`,
          bodyType: 'offboarding_acknowledged' as const,
          actionableLink: {
            label: 'Open Request in AB-Sutra Portal',
            url: `#request-${request.referenceCode}`
          }
        }] : []),
        ...((offboarding?.dailyRemindersCount || 0) > 0 ? [{
          id: 'email-off-3',
          timestamp: offboarding?.lastReminderSentAt || request.updatedAt,
          from: 'system.automations@ab-sutra.com',
          to: [offboarding?.abSponsorEmail || details.abManagerNameOrEmail, 'pmo.contingent@ab.com'],
          cc: [emailDistribution.senderEmail || 'vendor.ops@supplier.com'],
          subject: `[DAILY REMINDER] Workday Termination Confirmation Screenshot Required: ${offboarding?.resourceName || request.candidateName}`,
          bodyType: 'daily_reminder' as const,
          actionableLink: {
            label: 'Upload Workday Termination Screenshot to Complete',
            url: `#upload-${request.referenceCode}`
          }
        }] : []),
        ...(offboarding?.timesheetConfirmedTwoDaysPrior ? [{
          id: 'email-off-4',
          timestamp: offboarding.timesheetConfirmedAt || request.updatedAt,
          from: 'pmo.contingent@ab.com',
          to: [emailDistribution.senderEmail || 'vendor.ops@supplier.com'],
          cc: [offboarding.abSponsorEmail || details.abManagerNameOrEmail],
          subject: `[AB Timesheet Verification Confirmed] 2-Day Prior LWD Alignment Verified for ${offboarding.resourceName || request.candidateName}`,
          bodyType: 'timesheet_reminder' as const
        }] : []),
        ...(offboarding?.workdayTerminationScreenshot ? [{
          id: 'email-off-5',
          timestamp: offboarding.workdayTerminationScreenshot.uploadedAt || request.updatedAt,
          from: offboarding.workdayTerminationScreenshot.uploadedBy || 'hiring.team@ab.com',
          to: [
            emailDistribution.senderEmail || 'vendor.ops@supplier.com',
            emailDistribution.ccVendorDeliveryManagerEmail || 'dm@supplier.com',
            offboarding.abSponsorEmail || details.abManagerNameOrEmail,
            'pmo.contingent@ab.com',
            'it.asset.recovery@ab.com'
          ],
          cc: ['global.security.access@ab.com', 'facilities.badges@ab.com'],
          subject: `[AB Offboarding Completed] Workday Termination Initiated & Confirmed with Screenshot: ${offboarding.resourceName || request.candidateName} (Event Ref: ${offboarding.workdayTerminationNumber || 'WD-TERM-COMPLETED'})`,
          bodyType: 'termination_confirmed' as const,
          attachment: {
            name: offboarding.workdayTerminationScreenshot.fileName,
            size: offboarding.workdayTerminationScreenshot.fileSize || '380 KB',
            type: 'image/png'
          }
        }] : [])
      ]
    : [
        {
          id: 'email-onb-1',
          timestamp: request.createdAt,
          from: emailDistribution.senderEmail || 'vendor.portal@ab-onboarding.com',
          to: [emailDistribution.toSponsorEmail, emailDistribution.toPmoEmail],
          cc: [
            emailDistribution.ccVendorDeliveryManagerEmail,
            emailDistribution.ccRamEmail,
            ...(emailDistribution.additionalCcEmails || [])
          ].filter(Boolean) as string[],
          subject: `[AB Contingent Onboarding] New Resource Initiation: ${details.firstName} ${details.lastName} (${details.vendorName}) - PO: ${details.purchaseOrderNumber}`,
          bodyType: 'onboarding_initiated' as const,
          actionableLink: {
            label: 'Review Onboarding Dossier & Validate Checklist',
            url: `#review-${request.referenceCode}`
          },
          attachment: {
            name: `AB-SUTRA_${request.referenceCode}_${request.candidateName.replace(/\s+/g, '_')}.xlsx`,
            size: '32.1 KB',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        }
      ];

  const currentEmail = threadEmails[activeEmailIndex] || threadEmails[0];

  const handleCopyBody = () => {
    navigator.clipboard.writeText(
      `Subject: ${currentEmail.subject}\n` +
      `From: ${currentEmail.from}\n` +
      `To: ${currentEmail.to.join(', ')}\n` +
      `Timestamp: ${currentEmail.timestamp}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-base leading-tight">
                  Offline Dispatched Email Notifications
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered ({threadEmails.length} in thread)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audit log of all notifications, actionable review links, and dossier attachments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thread Switcher if multiple emails */}
        {threadEmails.length > 1 && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-semibold shrink-0">Thread:</span>
            {threadEmails.map((email, idx) => (
              <button
                key={email.id || idx}
                onClick={() => setActiveEmailIndex(idx)}
                className={`px-3 py-1 rounded-md transition shrink-0 flex items-center space-x-1.5 ${
                  activeEmailIndex === idx
                    ? 'bg-white font-semibold text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="truncate max-w-[160px]">
                  {email.bodyType === 'offboarding_initiated' && 'Offboarding Initiated'}
                  {email.bodyType === 'offboarding_acknowledged' && 'Manager Acknowledged'}
                  {email.bodyType === 'daily_reminder' && 'Daily Reminder'}
                  {email.bodyType === 'timesheet_reminder' && '2-Day Timesheet'}
                  {email.bodyType === 'termination_confirmed' && 'Termination Screenshot'}
                  {email.bodyType === 'onboarding_initiated' && 'Onboarding Request'}
                  {email.bodyType === 'onboarding_completed' && 'Onboarding Completed (@ab.com)'}
                  {email.bodyType === 'request_delegated' && 'Request Delegated'}
                  {email.bodyType === 'request_reassigned' && 'Request Reassigned'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Email Header Meta */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-2.5 text-xs">
          <div className="flex items-start">
            <span className="w-20 font-semibold text-slate-500">From:</span>
            <div className="flex-1 font-mono text-slate-800">
              {currentEmail.from}
              <span className="text-slate-400 ml-2">via AB Contingent Workforce Gateway</span>
            </div>
          </div>

          <div className="flex items-start">
            <span className="w-20 font-semibold text-slate-500">To:</span>
            <div className="flex-1 flex flex-wrap gap-1.5 font-mono">
              {currentEmail.to.map((toEmail, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                  {toEmail}
                </span>
              ))}
            </div>
          </div>

          {currentEmail.cc && currentEmail.cc.length > 0 && (
            <div className="flex items-start">
              <span className="w-20 font-semibold text-slate-500">Cc:</span>
              <div className="flex-1 flex flex-wrap gap-1.5 font-mono">
                {currentEmail.cc.map((email, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded border border-slate-300 text-[11px]"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start pt-1 border-t border-slate-200">
            <span className="w-20 font-semibold text-slate-500">Subject:</span>
            <span className="flex-1 font-semibold text-slate-900">
              {currentEmail.subject}
            </span>
          </div>

          <div className="flex items-center text-slate-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            <span>Sent: {currentEmail.timestamp.replace('T', ' ').substring(0, 19)}</span>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-5 text-sm text-slate-700 bg-white">
          {/* Actionable Link Banner */}
          {currentEmail.actionableLink && (
            currentRole === 'supplier' ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                    Approver Action Link (Dispatched to AB Approvers)
                  </span>
                  <span className="text-xs text-slate-800 font-medium">
                    {currentEmail.actionableLink.label}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-md shrink-0 ml-2">
                  Manager / PMO Responsibility
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700 block">
                    Actionable Workflow Link Included in Email
                  </span>
                  <span className="text-xs text-blue-950 font-medium">
                    {currentEmail.actionableLink.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onActionClick) onActionClick(currentEmail.bodyType);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0 ml-2"
                >
                  <span>Review & Act in Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Attachment Badge */}
          {currentEmail.attachment && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                {currentEmail.attachment.name.endsWith('.xlsx') ? (
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {currentEmail.attachment.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {currentEmail.attachment.size} • Attached with outbound email
                  </span>
                </div>
              </div>

              {currentEmail.attachment.name.endsWith('.xlsx') ? (
                <button
                  type="button"
                  onClick={() => (isOffboarding ? downloadOffboardingExcel(request) : downloadRequestExcel(request))}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Attachment</span>
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-[11px] font-semibold">
                  Screenshot Verified
                </span>
              )}
            </div>
          )}

          {/* Content specific to Email Type */}
          {currentEmail.bodyType === 'offboarding_initiated' && offboarding && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-900">
                  Dear Hiring Sponsor & PMO Team,
                </p>
                <p>
                  Please find below the official 14-field offboarding declaration submitted by <strong>{request.supplierName}</strong> for contingent worker <strong>{offboarding.resourceName || request.candidateName}</strong>.
                </p>
                <p>
                  The attached Excel file contains the full dossier. As per AB policy, <strong>the hiring manager/PMO must acknowledge this request and specify the target Workday termination initiation date</strong>. Daily reminders will be dispatched until the Workday termination confirmation screenshot is uploaded.
                </p>
              </div>

              {/* 14 Field Table */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Offboarding Form 2026 - Data Summary
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3 w-12">#</th>
                        <th className="py-1.5 px-3 w-1/2">Description</th>
                        <th className="py-1.5 px-3">Submitted Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr><td className="py-1.5 px-3 text-slate-400">1</td><td className="py-1.5 px-3">Resource Name</td><td className="py-1.5 px-3 font-semibold">{offboarding.resourceName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">2</td><td className="py-1.5 px-3">Resource Email (AB)</td><td className="py-1.5 px-3 font-mono text-blue-700">{offboarding.resourceEmailAB}</td></tr>
                      <tr className="bg-rose-50/50"><td className="py-1.5 px-3 text-rose-500 font-bold">3</td><td className="py-1.5 px-3 font-bold text-rose-900">Offboarding Date (Last working Day)</td><td className="py-1.5 px-3 font-bold text-rose-900">{offboarding.offboardingDateLWD}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">4</td><td className="py-1.5 px-3">Offboarding Reason</td><td className="py-1.5 px-3">{offboarding.offboardingReason}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">5</td><td className="py-1.5 px-3">AB Sponsor Email</td><td className="py-1.5 px-3 font-mono">{offboarding.abSponsorEmail}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">6</td><td className="py-1.5 px-3">Division Name</td><td className="py-1.5 px-3">{offboarding.divisionName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">7</td><td className="py-1.5 px-3">AB-Joining Date (Current PO)</td><td className="py-1.5 px-3">{offboarding.abJoiningDateCurrentPO}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">8</td><td className="py-1.5 px-3">Billing Start Date (Current Year)</td><td className="py-1.5 px-3">{offboarding.billingStartDateCurrentYear}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">9</td><td className="py-1.5 px-3">Billing Rate with Currency</td><td className="py-1.5 px-3 font-semibold text-emerald-700">{offboarding.billingRateWithCurrency}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">10</td><td className="py-1.5 px-3">Purchase Order Number</td><td className="py-1.5 px-3 font-mono font-semibold">{offboarding.purchaseOrderNumber}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">11</td><td className="py-1.5 px-3">ADM Seniority</td><td className="py-1.5 px-3">{offboarding.admSeniority}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">12</td><td className="py-1.5 px-3">ADM Role (as per SOW)</td><td className="py-1.5 px-3">{offboarding.admRole}</td></tr>
                      <tr className="bg-amber-50/50"><td className="py-1.5 px-3 text-amber-600 font-bold">13</td><td className="py-1.5 px-3 font-bold text-amber-900">Billed days in Current Year</td><td className="py-1.5 px-3 font-bold text-amber-900">{offboarding.billedDaysCurrentYear}</td></tr>
                      <tr className="bg-blue-50/50"><td className="py-1.5 px-3 text-blue-600 font-bold">14</td><td className="py-1.5 px-3 font-bold text-blue-950">Is timesheet in sync with billed days? (For T&M)</td><td className="py-1.5 px-3 font-bold text-blue-950">{offboarding.isTimesheetInSync}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentEmail.bodyType === 'offboarding_acknowledged' && offboarding && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Manager Acknowledgement Recorded</span>
              </div>
              <p>
                The Hiring Sponsor (<strong>{offboarding.managerAcknowledgedBy || details.abManagerNameOrEmail}</strong>) has formally acknowledged seeing the offboarding request for <strong>{offboarding.resourceName || request.candidateName}</strong>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs space-y-1">
                <span className="text-slate-500 block">Committed Workday Initiation Target Date:</span>
                <span className="font-bold text-blue-900 text-sm">
                  Will initiate offboarding by {offboarding.managerTargetInitiationDate || 'Committed Date'}
                </span>
              </div>
              {offboarding.managerAcknowledgementNotes && (
                <p className="text-slate-700 italic">
                  &ldquo;{offboarding.managerAcknowledgementNotes}&rdquo;
                </p>
              )}
            </div>
          )}

          {currentEmail.bodyType === 'daily_reminder' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2.5">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Automatic Daily Reminder: Termination Screenshot Pending</span>
              </div>
              <p>
                This is an automated reminder dispatched daily to the Hiring Manager and PMO. Workday termination initiation has not yet been finalized with a confirmation screenshot for <strong>{offboarding?.resourceName || request.candidateName}</strong>.
              </p>
              <p className="font-semibold text-amber-900">
                To complete the offboarding workflow, please log into Workday, initiate the contingent worker termination, and upload the confirmation screenshot in the AB-Sutra tool.
              </p>
            </div>
          )}

          {currentEmail.bodyType === 'timesheet_reminder' && (
            <div className={`p-4 rounded-xl border text-xs space-y-3 ${
              offboarding?.isTimesheetInSync === 'No'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-purple-50 border-purple-200 text-purple-950'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <AlertCircle className={`w-4 h-4 ${offboarding?.isTimesheetInSync === 'No' ? 'text-amber-600' : 'text-purple-600'}`} />
                <span>
                  {offboarding?.isTimesheetInSync === 'No'
                    ? 'URGENT: Timesheet Discrepancy & Billable Days Reconciliation Required'
                    : '2-Day Pre-LWD Timesheet Alignment Notification'}
                </span>
              </div>

              {offboarding?.isTimesheetInSync === 'No' ? (
                <>
                  <p className="leading-relaxed">
                    Notice to <strong>PMO Contingent Workforce</strong> and <strong>Supplier Delivery Management</strong>: The timesheet for contingent worker <strong>{offboarding?.resourceName || request.candidateName}</strong> is currently <strong>NOT in sync</strong> with recorded billable days.
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Last Working Day (LWD):</span>
                      <span className="font-bold text-rose-700">{offboarding?.offboardingDateLWD}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Billed Days (Current Year):</span>
                      <span className="font-mono font-bold text-slate-900">{offboarding?.billedDaysCurrentYear ?? 'Discrepancy'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Total Expected Billable Days:</span>
                      <span className="font-mono font-bold text-slate-900">{offboarding?.totalDaysExpected ?? 'Per SOW'}</span>
                    </div>
                    <div className="pt-2 border-t border-amber-100 flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-amber-900">Required Action:</span>
                      <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                        Reconcile & Complete Prior to LWD
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Both PMO and Supplier Delivery Manager must review time records, correct any unsubmitted or unapproved hours, and verify alignment before the worker's system access is terminated on their last working day.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    As contingent worker <strong>{offboarding?.resourceName || request.candidateName}</strong> approaches their Last Working Day (LWD: <strong>{offboarding?.offboardingDateLWD}</strong>), the supplier is requested to confirm that timesheet data has been accurately filled and aligned to AB internal timesheet data (T&M).
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-purple-900 block">Timesheet Alignment Status</span>
                      <span className="text-[11px] text-slate-500">
                        {offboarding?.timesheetConfirmedTwoDaysPrior ? 'Verified & Attested by Supplier' : 'Pending Supplier Attestation'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                      offboarding?.timesheetConfirmedTwoDaysPrior ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {offboarding?.timesheetConfirmedTwoDaysPrior ? 'Confirmed in Sync' : 'Action Required'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {currentEmail.bodyType === 'termination_confirmed' && offboarding && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Workday Termination Initiated & Process Completed</span>
              </div>
              <p>
                PMO/Manager has uploaded the confirmation screenshot of Termination initiated in Workday for <strong>{offboarding.resourceName || request.candidateName}</strong>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Workday Termination Ref ID:</span>
                  <span className="font-mono font-bold text-slate-800">{offboarding.workdayTerminationNumber || 'WD-TERM-FINAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmed & Uploaded By:</span>
                  <span className="font-semibold text-slate-800">{offboarding.workdayTerminationScreenshot?.uploadedBy || 'Hiring Team'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attached Screenshot:</span>
                  <span className="font-semibold text-emerald-700">{offboarding.workdayTerminationScreenshot?.fileName}</span>
                </div>
              </div>
              <p className="text-slate-600">
                This notice has been dispatched to the supplier, IT Asset Recovery, Facilities, and all stakeholders on the email thread.
              </p>
            </div>
          )}

          {/* Onboarding Completed Body */}
          {currentEmail.bodyType === 'onboarding_completed' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Onboarding Completed & Corporate Email Provisioned</span>
              </div>
              <p>
                The contingent worker onboarding process for <strong>{details.firstName} {details.lastName}</strong> has reached final completion. The corporate AB enterprise email has been officially issued and Workday profile activated.
              </p>
              <div className="p-3.5 bg-white rounded-lg border border-emerald-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Provisioned Corporate Email:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {details.abEmailId || request.generatedAbEmailId || 'corporate.email@ab.com'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Workday Worker ID:</span>
                  <span className="font-mono font-bold text-slate-900">{request.workdayId || 'WD-ACTIVE'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Sponsor / Manager:</span>
                  <span className="font-semibold text-slate-800">{details.abManagerNameOrEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Supplier Partner:</span>
                  <span className="font-semibold text-slate-800">{request.supplierName}</span>
                </div>
              </div>
              <p className="text-slate-600 text-[11px]">
                Supplier can now view this corporate email in their dashboard panel and share provisioning instructions with the resource.
              </p>
            </div>
          )}

          {/* Request Delegated Body */}
          {currentEmail.bodyType === 'request_delegated' && request.delegation && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-indigo-900">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>Workflow Request Delegated</span>
              </div>
              <p>
                This request has been formally delegated to <strong>{request.delegation.delegatedToName}</strong> ({request.delegation.delegatedToEmail}) by <strong>{request.delegation.delegatedByName}</strong>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Delegation Type:</span>
                  <span className="font-semibold text-indigo-900">{request.delegation.delegationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delegated At:</span>
                  <span className="font-mono text-slate-700">{request.delegation.delegatedAt}</span>
                </div>
                {request.delegation.reason && (
                  <div className="pt-1 border-t border-indigo-100 text-slate-700 italic">
                    &ldquo;{request.delegation.reason}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Request Reassigned Body */}
          {currentEmail.bodyType === 'request_reassigned' && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-purple-900">
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>Governance Reassignment Dispatched</span>
              </div>
              <p>
                Admin & Governance has reassigned this contingent workforce request to a new sponsor/manager: <strong>{details.abManagerNameOrEmail}</strong>.
              </p>
            </div>
          )}

          {/* Manager Sign-Off Body */}
          {currentEmail.bodyType === 'manager_signoff' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Manager Sign-Off Approved & Certified</span>
              </div>
              <p>
                The Hiring Manager/Sponsor has certified the onboarding qualifications, SOW rate alignment, and technical evaluation scorecard for <strong>{details.firstName} {details.lastName}</strong>.
              </p>
              {currentEmail.customMessage && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs italic text-slate-700">
                  &ldquo;{currentEmail.customMessage}&rdquo;
                </div>
              )}
              <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Worker Name:</span>
                  <span className="font-semibold text-slate-900">{details.firstName} {details.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ADM Role & Seniority:</span>
                  <span className="font-semibold text-slate-900">{details.admRole} ({details.admSeniority})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Certified Billing Rate:</span>
                  <span className="font-bold text-emerald-700">{details.billingRateWithCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Technical Evaluation Score:</span>
                  <span className="font-bold text-amber-700">{details.technicalEvaluationScore || 'Verified'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600">
                Request is certified ready for Workday Contingent Worker creation by the PMO / Hiring team.
              </p>
            </div>
          )}

          {/* Workday Approved Body */}
          {currentEmail.bodyType === 'workday_approved' && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Workday Contingent Worker Profile Initiated</span>
              </div>
              <p>
                Workday Contingent Worker profile has been successfully generated for <strong>{details.firstName} {details.lastName}</strong>.
              </p>
              <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Workday Worker ID:</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">{request.workdayId || 'WD-ACTIVE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Initiated By:</span>
                  <span className="font-semibold text-slate-800">{currentEmail.from}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-amber-700">Awaiting Enterprise @ab.com Email Issuance</span>
                </div>
              </div>
              {currentEmail.customMessage && (
                <p className="text-slate-600 italic">
                  &ldquo;{currentEmail.customMessage}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Clarification Query Body */}
          {currentEmail.bodyType === 'info_query' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Action Required: Clarification Requested from Supplier</span>
              </div>
              <p>
                The AB Review Team requires additional information or documentation regarding <strong>{details.firstName} {details.lastName}</strong> ({request.referenceCode}):
              </p>
              <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-slate-800 font-medium">
                {currentEmail.customMessage || 'Please review the requested clarifications in the portal.'}
              </div>
              <p className="text-[11px] text-amber-800">
                Please click the link above or open the Supplier Portal to provide your clarifications.
              </p>
            </div>
          )}

          {/* Supplier Clarification Reply Body */}
          {currentEmail.bodyType === 'info_reply' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Supplier Clarification Reply Provided</span>
              </div>
              <p>
                <strong>{request.supplierName}</strong> has submitted clarifications for <strong>{details.firstName} {details.lastName}</strong>:
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 italic">
                &ldquo;{currentEmail.customMessage}&rdquo;
              </div>
              <p className="text-[11px] text-slate-500">
                The request has returned to the active review queue for PMO / Hiring Manager sign-off.
              </p>
            </div>
          )}

          {/* Rejection Body */}
          {currentEmail.bodyType === 'rejection' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Onboarding Request Rejected</span>
              </div>
              <p>
                The onboarding request for <strong>{details.firstName} {details.lastName}</strong> has been rejected by the AB Governance Team:
              </p>
              <div className="p-3 bg-white rounded-lg border border-rose-200 text-xs text-rose-900 font-semibold">
                Reason: {currentEmail.customMessage || 'Administrative rejection.'}
              </div>
              <p className="text-[11px] text-slate-600">
                All stakeholders have been notified. Please liaise with the AB Sponsor to address requirements before resubmitting.
              </p>
            </div>
          )}

          {/* Onboarding Full 32-Field Form Submission */}
          {currentEmail.bodyType === 'onboarding_initiated' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-800 leading-relaxed space-y-1.5">
                <p className="font-semibold text-blue-950">
                  Dear AB Hiring Sponsor & PMO Team,
                </p>
                <p>
                  Please find below the complete <strong>32-field contingent worker onboarding dossier</strong> submitted by <strong>{details.vendorName}</strong> for <strong>{details.firstName} {details.lastName}</strong> under PO <strong>{details.purchaseOrderNumber}</strong>.
                </p>
                <p className="text-[11px] text-slate-600">
                  Click the actionable review link above or in your portal to review compliance evidences, perform sign-off, delegate, or initiate Workday.
                </p>
              </div>

              {/* Key Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Worker Name</span>
                  <span className="font-semibold text-slate-900">{details.firstName} {details.lastName}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Joining Date</span>
                  <span className="font-semibold text-slate-900">{details.joiningDateInAB}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Billing Rate</span>
                  <span className="font-semibold text-slate-900">{details.billingRateWithCurrency}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">PO Number</span>
                  <span className="font-semibold text-blue-700 font-mono">{details.purchaseOrderNumber}</span>
                </div>
              </div>

              {/* Full 32-Field Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Complete 32-Field Onboarding Form (Submitted by Supplier)
                  </h4>
                  <button
                    type="button"
                    onClick={() => downloadRequestExcel(request)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline flex items-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Form Excel
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3 w-10">#</th>
                        <th className="py-1.5 px-3 w-1/2">Field Description</th>
                        <th className="py-1.5 px-3">Supplier Submitted Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr><td className="py-1.5 px-3 text-slate-400">1</td><td className="py-1.5 px-3">First Name</td><td className="py-1.5 px-3 font-semibold">{details.firstName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">2</td><td className="py-1.5 px-3">Middle Name</td><td className="py-1.5 px-3">{details.middleName || '-'}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">3</td><td className="py-1.5 px-3">Last Name</td><td className="py-1.5 px-3 font-semibold">{details.lastName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">4</td><td className="py-1.5 px-3">Name of Vendor / Supplier</td><td className="py-1.5 px-3 font-medium">{details.vendorName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">5</td><td className="py-1.5 px-3">Vendor Delivery Manager Email</td><td className="py-1.5 px-3 font-mono">{emailDistribution.ccVendorDeliveryManagerEmail || details.vendorDeliveryManagerEmail}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">6</td><td className="py-1.5 px-3">Resource Work Location</td><td className="py-1.5 px-3">{details.resourceLocation}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">7</td><td className="py-1.5 px-3">Worked with AB Earlier?</td><td className="py-1.5 px-3">{details.workedWithAbEarlier}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">8</td><td className="py-1.5 px-3">Prior AB Login ID</td><td className="py-1.5 px-3 font-mono">{details.priorAbLoginId || 'NA'}</td></tr>
                      <tr className="bg-emerald-50/40"><td className="py-1.5 px-3 text-emerald-700 font-bold">9</td><td className="py-1.5 px-3 font-semibold text-emerald-950">AB Email ID (Generated post-initiation)</td><td className="py-1.5 px-3 font-mono font-bold text-emerald-800">{details.abEmailId || request.generatedAbEmailId || 'Pending PMO/Manager final step'}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">10</td><td className="py-1.5 px-3">Mobile Number</td><td className="py-1.5 px-3">{details.mobileNumber}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">11</td><td className="py-1.5 px-3">Mobile Operating System</td><td className="py-1.5 px-3">{details.mobileOperatingSystem}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">12</td><td className="py-1.5 px-3">Candidate Personal Email ID</td><td className="py-1.5 px-3 font-mono">{details.candidateEmailId}</td></tr>
                      <tr className="bg-blue-50/30"><td className="py-1.5 px-3 text-blue-600 font-bold">13</td><td className="py-1.5 px-3 font-semibold text-blue-950">AB Sponsor / Hiring Manager</td><td className="py-1.5 px-3 font-semibold text-blue-900">{details.abManagerNameOrEmail}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">14</td><td className="py-1.5 px-3">Division Name at AB</td><td className="py-1.5 px-3">{details.divisionName}</td></tr>
                      <tr className="bg-emerald-50/40"><td className="py-1.5 px-3 text-emerald-700 font-bold">15</td><td className="py-1.5 px-3 font-semibold text-emerald-950">BGV Status</td><td className="py-1.5 px-3 font-bold text-emerald-700">{details.bgvStatus}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">16</td><td className="py-1.5 px-3">BGV Email Sent to Screening Team</td><td className="py-1.5 px-3 font-mono">{details.bgvEmailSentToScreeningTeam}</td></tr>
                      <tr className="bg-slate-50"><td className="py-1.5 px-3 text-slate-500 font-bold">17</td><td className="py-1.5 px-3 font-semibold">Joining Date in AB</td><td className="py-1.5 px-3 font-semibold">{details.joiningDateInAB}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">18</td><td className="py-1.5 px-3">Billing Start Date</td><td className="py-1.5 px-3">{details.billingStartDate}</td></tr>
                      <tr className="bg-emerald-50/30"><td className="py-1.5 px-3 text-emerald-600 font-bold">19</td><td className="py-1.5 px-3 font-semibold text-emerald-950">Billing Rate with Currency</td><td className="py-1.5 px-3 font-bold text-emerald-700">{details.billingRateWithCurrency}</td></tr>
                      <tr className="bg-blue-50/30"><td className="py-1.5 px-3 text-blue-600 font-bold">20</td><td className="py-1.5 px-3 font-semibold text-blue-950">Purchase Order (PO) Number</td><td className="py-1.5 px-3 font-mono font-bold text-blue-800">{details.purchaseOrderNumber}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">21</td><td className="py-1.5 px-3">Purchase Order End Date</td><td className="py-1.5 px-3">{details.purchaseOrderEndDate}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">22</td><td className="py-1.5 px-3">ADM Seniority</td><td className="py-1.5 px-3">{details.admSeniority}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">23</td><td className="py-1.5 px-3">ADM Role (as per SOW)</td><td className="py-1.5 px-3">{details.admRole}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">24</td><td className="py-1.5 px-3">Project Name</td><td className="py-1.5 px-3">{details.projectName}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">25</td><td className="py-1.5 px-3">Demand Type</td><td className="py-1.5 px-3">{details.demandType}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">26</td><td className="py-1.5 px-3">Total Experience Prior to AB</td><td className="py-1.5 px-3">{details.totalExperiencePriorToAB} Years</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">27</td><td className="py-1.5 px-3">Relevant Experience Prior to AB</td><td className="py-1.5 px-3">{details.relevantExperiencePriorToAB} Years</td></tr>
                      <tr className="bg-amber-50/40"><td className="py-1.5 px-3 text-amber-700 font-bold">28</td><td className="py-1.5 px-3 font-semibold text-amber-950">Technical Evaluation Score</td><td className="py-1.5 px-3 font-bold text-amber-900">{details.technicalEvaluationScore}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">29</td><td className="py-1.5 px-3">Notice Period (Days)</td><td className="py-1.5 px-3">{details.noticePeriodDays}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">30</td><td className="py-1.5 px-3">Is Subcontractor?</td><td className="py-1.5 px-3">{details.isSubcontractor ? 'Yes' : 'No'}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">31</td><td className="py-1.5 px-3">Are Subcontractors Allowed for PO?</td><td className="py-1.5 px-3">{details.areSubcontractorsAllowed}</td></tr>
                      <tr><td className="py-1.5 px-3 text-slate-400">32</td><td className="py-1.5 px-3">Incumbent Email ID (if backfill)</td><td className="py-1.5 px-3 font-mono">{details.incumbentEmailId || 'N/A (New Demand)'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopyBody}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200/60 text-xs transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Email Header'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            {isOffboarding ? (
              <button
                type="button"
                onClick={() => downloadOffboardingExcel(request)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200/60 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export 14-Field Excel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => downloadRequestExcel(request)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200/60 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export 32-Field Onboarding Excel</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
