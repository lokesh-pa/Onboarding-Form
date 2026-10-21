import * as XLSX from 'xlsx';
import { WorkforceRequest } from '../types';
import {
  parseDailyRate,
  calculateDaysLapsed,
  calculateBillingLoss,
  calculateWorkingDaysBetween,
  calculateSoftSaves,
  formatCurrencyAmount,
  calculateRequestFinancials
} from './billingMetrics';

/**
 * Generates and triggers download of a multi-tab Excel file containing:
 * 1. "Onboarding Dossier" - All details submitted by the supplier
 * 2. "BGV Confirmation" - BGV clearance details, screening dates, declarations & email distribution
 * 3. "Technical Evaluation Evidence" - Technical scores, evaluator feedback, and evidence file list
 */
export function downloadRequestExcel(request: WorkforceRequest) {
  if (request.type === 'offboarding') {
    downloadOffboardingExcel(request);
    return;
  }

  const wb = XLSX.utils.book_new();
  const { details, bgv, evidences, emailDistribution, validationChecklist } = request;

  // TAB 1: Onboarding Dossier
  const dossierData: (string | number)[][] = [
    ['AB-SUTRA Contingent Workforce Dossier'],
    ['Reference Code', request.referenceCode],
    ['Submission Date', request.createdAt.replace('T', ' ').substring(0, 19)],
    ['Current Status', request.status.toUpperCase()],
    ['Workday Contingent Worker ID', request.workdayId || 'Pending Initiation'],
    ['Enterprise AB Email ID', details.abEmailId || 'Pending IT Provisioning'],
    [],
    ['Candidate & Contract Particulars', 'Values'],
    ['1. First Name', details.firstName],
    ['2. Middle Name', details.middleName || '—'],
    ['3. Last Name', details.lastName],
    ['4. Name of the Vendor / Supplier', details.vendorName || request.supplierName],
    ['5. Vendor Delivery Manager Email', details.vendorDeliveryManagerEmail],
    ['6. Resource Work Location', details.resourceLocation],
    ['7. Worked with AB Earlier', details.workedWithABEarlier ? 'Yes' : 'No'],
    ['8. Prior AB Login ID', details.abLoginId || 'NA'],
    ['9. Prior AB Email ID', details.abEmailId || 'NA'],
    ['10. Mobile Number', details.mobileNumber],
    ['11. Mobile Operating System', details.mobileOperatingSystem],
    ['12. Candidate Personal Email ID', details.candidateEmailId],
    ['13. AB Sponsor / Hiring Manager Name or Email', details.abManagerNameOrEmail],
    ['14. Division Name at AB', details.divisionName],
    ['15. BGV Status', details.bgvStatus],
    ['16. BGV Email Sent to Screening Team', details.bgvEmailSentToBgTeam ? 'Yes' : 'No'],
    ['17. Joining Date in AB', details.joiningDateInAB],
    ['18. Billing Start Date', details.billingStartDate],
    ['19. Billing Rate with Currency', details.billingRateWithCurrency],
    ['20. Purchase Order (PO) Number', details.purchaseOrderNumber],
    ['21. Purchase Order End Date', details.purchaseOrderEndDate],
    ['22. ADM Seniority', details.admSeniority],
    ['23. ADM Role (as per SOW)', details.admRole],
    ['24. Project Name as per Agreement', details.projectName],
    ['25. Total Experience Prior to AB', details.totalExperiencePriorToAB],
    ['26. Relevant Experience Prior to AB', details.relevantExperiencePriorToAB],
    ['27. Technical Evaluation Score', details.technicalEvaluationScore],
    ['28. Notice Period (Days)', details.noticePeriodDays],
    ['29. Is Resource a Subcontractor', details.isSubcontractor ? 'Yes' : 'No'],
    ['30. Subcontractors Allowed for this PO', details.areSubcontractorsAllowedForPO],
    ['31. Demand Type', details.demandType],
    ['32. AB Email ID of Incumbent', details.incumbentEmailId || 'NA']
  ];

  // If part of a batch, include batch table
  if (request.batchResources && request.batchResources.length > 1) {
    dossierData.push([]);
    dossierData.push(['Batch Resources Roster (Total: ' + request.batchResources.length + ')']);
    dossierData.push(['#', 'Resource Name', 'Work Location', 'ADM Role', 'Billing Rate', 'Tech Score', 'Joining Date']);
    request.batchResources.forEach((res, idx) => {
      dossierData.push([
        idx + 1,
        res.candidateName,
        res.location,
        res.role || details.admRole,
        res.rate || details.billingRateWithCurrency,
        res.techScore || details.technicalEvaluationScore,
        res.joiningDate || details.joiningDateInAB
      ]);
    });
  }

  const wsDossier = XLSX.utils.aoa_to_sheet(dossierData);
  wsDossier['!cols'] = [{ wch: 40 }, { wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDossier, 'Onboarding Dossier');

  // TAB 2: BGV Confirmation
  const bgvData: (string | number)[][] = [
    ['AB Background Screening Verification Confirmation'],
    ['Supplier Name', bgv.supplierName || request.supplierName],
    ['Screening Status', bgv.screeningStatus],
    ['Screening Completion Date', bgv.completionDate],
    ['Country Specific Checks Performed', bgv.performedCountrySpecificChecks ? 'Yes (Completed)' : 'No'],
    ['AB Division', bgv.divisionAtAB || details.divisionName],
    ['Screening Proof Attached', bgv.bgvEmailProofName || 'Attached in dossier'],
    [],
    ['Candidate(s) Screened under this Notice'],
    ['#', 'Candidate Name', 'Location']
  ];

  if (bgv.resources && bgv.resources.length > 0) {
    bgv.resources.forEach((r, idx) => {
      bgvData.push([idx + 1, r.name, r.location]);
    });
  } else if (bgv.workerNames && bgv.workerNames.length > 0) {
    bgv.workerNames.forEach((name, idx) => {
      bgvData.push([idx + 1, name, bgv.location || details.resourceLocation]);
    });
  } else {
    bgvData.push([1, request.candidateName, details.resourceLocation]);
  }

  bgvData.push([]);
  bgvData.push(['Email Distribution & Attestation Details']);
  bgvData.push(['To (Background Screening Desk)', 'Contingentworker.Backgroundscreening@ab.com']);
  bgvData.push(['Default CC: AB Sponsor / Manager', emailDistribution.toSponsorEmail || details.abManagerNameOrEmail]);
  bgvData.push(['Default CC: Vendor Delivery Manager', emailDistribution.ccVendorDeliveryManagerEmail || details.vendorDeliveryManagerEmail]);
  bgvData.push(['Default CC: PMO Contingent Desk', emailDistribution.toPmoEmail || 'pmo.contingent@ab.com']);
  if (emailDistribution.additionalCcEmails && emailDistribution.additionalCcEmails.length > 0) {
    bgvData.push(['Additional CC Recipients', emailDistribution.additionalCcEmails.join(', ')]);
  }
  bgvData.push(['Compliance Attestation', 'Vendor confirms all local jurisdiction background checks have been successfully concluded.']);

  const wsBgv = XLSX.utils.aoa_to_sheet(bgvData);
  wsBgv['!cols'] = [{ wch: 35 }, { wch: 45 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsBgv, 'BGV Confirmation');

  // TAB 3: Technical Evaluation Evidence
  const techData: (string | number)[][] = [
    ['Technical Evaluation Evidence & Competency Assessment'],
    ['Candidate Name', request.candidateName],
    ['ADM Role (per SOW)', details.admRole],
    ['Seniority Level', details.admSeniority],
    ['Technical Evaluation Score', details.technicalEvaluationScore || 'Verified'],
    ['AB Hiring Sponsor', details.abManagerNameOrEmail],
    ['PO Number & Rate', `${details.purchaseOrderNumber} (${details.billingRateWithCurrency})`],
    ['Manager Sign-Off Status', validationChecklist.managerApproved ? 'Approved & Signed' : 'Pending Sign-Off'],
    ['Manager Approved By', validationChecklist.managerApprovedBy || details.abManagerNameOrEmail],
    ['Sign-Off Date', validationChecklist.managerApprovedAt || '—'],
    [],
    ['Uploaded Evaluation Evidence Files'],
    ['#', 'Document Name', 'Category', 'File Size', 'Upload Date']
  ];

  if (evidences && evidences.length > 0) {
    evidences.forEach((ev, idx) => {
      techData.push([
        idx + 1,
        ev.name,
        ev.category.replace('_', ' ').toUpperCase(),
        ev.size,
        ev.uploadedAt
      ]);
    });
  } else {
    techData.push([1, 'Technical_Interview_Scorecard.pdf', 'TECHNICAL EVALUATION', '2.4 MB', request.createdAt]);
  }

  techData.push([]);
  techData.push(['Internal Verification Checklist']);
  techData.push(['BGV Screening Cleared', validationChecklist.bgvVerified ? 'YES' : 'PENDING']);
  techData.push(['PO Active & Funded', validationChecklist.poActiveAndFunded ? 'YES' : 'PENDING']);
  techData.push(['Technical Competency Verified', validationChecklist.technicalEvaluationVerified ? 'YES' : 'PENDING']);
  techData.push(['SOW Role Aligned', validationChecklist.sowRoleAligned ? 'YES' : 'PENDING']);
  techData.push(['Subcontractor Compliant', validationChecklist.subcontractorCompliant ? 'YES' : 'PENDING']);

  const wsTech = XLSX.utils.aoa_to_sheet(techData);
  wsTech['!cols'] = [{ wch: 35 }, { wch: 45 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTech, 'Technical Evaluation Evidence');

  // Trigger file download
  const cleanName = request.candidateName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `AB-SUTRA_${request.referenceCode}_${cleanName}.xlsx`);
}

/**
 * Generates and triggers download of the Official 14-Field Offboarding Form 2026 Excel workbook:
 * Tab 1: "Offboarding Form 2026" (Exact 14-field layout matching official specification)
 * Tab 2: "Workday & Manager Sign-Off" (Sponsor acknowledgement, Workday termination screenshot status, daily reminders)
 * Tab 3: "Asset Recovery & Clearance" (Hardware, credentials, building badge)
 */
export function downloadOffboardingExcel(request: WorkforceRequest) {
  const wb = XLSX.utils.book_new();
  const off = request.offboarding;
  const details = request.details;

  // TAB 1: Offboarding Data Form
  const offboardingData: (string | number)[][] = [
    ['Offboarding Data Form'],
    ['Sr. No.', 'Description', 'Submitted Details'],
    [1, 'Resource Name', off?.resourceName || request.candidateName],
    ['•', 'Vendor Name', off?.vendorName || request.supplierName || details.vendorName || '—'],
    [2, 'Resource Email (AB)', off?.resourceEmailAB || details.abEmailId || `${request.candidateName.toLowerCase().replace(/\s+/g, '.')}@ab.com`],
    [3, 'Offboarding Date (Last working Day)', off?.offboardingDateLWD || '—'],
    [4, 'Offboarding Reason', off?.offboardingReason || '—'],
    [5, 'AB Sponsor Email', off?.abSponsorEmail || details.abManagerNameOrEmail || '—'],
    [6, 'Division Name', off?.divisionName || details.divisionName || '—'],
    [7, 'AB-Joining Date (Current PO)', off?.abJoiningDateCurrentPO || details.joiningDateInAB || '—'],
    [8, 'Billing Start Date (Current Year)', off?.billingStartDateCurrentYear || details.billingStartDate || '—'],
    [9, 'Billing Rate with Currency', off?.billingRateWithCurrency || details.billingRateWithCurrency || '—'],
    [10, 'Purchase Order Number', off?.purchaseOrderNumber || details.purchaseOrderNumber || '—'],
    [11, 'ADM Seniority', off?.admSeniority || details.admSeniority || '—'],
    [12, 'ADM Role (as per SOW)', off?.admRole || details.admRole || '—'],
    [13, 'Billed days in Current Year', off?.billedDaysCurrentYear || '—'],
    [14, 'Is timesheet in sync with billed days? (For T&M)', off?.isTimesheetInSync || 'Yes']
  ];

  const wsForm = XLSX.utils.aoa_to_sheet(offboardingData);
  wsForm['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsForm, 'Offboarding Data Form');

  // TAB 2: Workday Termination & Manager Sign-Off
  const workdayData: (string | number)[][] = [
    ['Workday Termination Initiation & Compliance Attestation'],
    ['Reference Code', request.referenceCode],
    ['Supplier / Vendor Name', request.supplierName],
    ['Overall Status', request.status.toUpperCase()],
    [],
    ['1. Manager Acknowledgement', 'Status'],
    ['Acknowledged by Hiring Manager / PMO', off?.managerAcknowledged ? 'YES (Acknowledged)' : 'Pending Manager Review'],
    ['Committed Workday Initiation By Date', off?.managerTargetInitiationDate || 'Pending Commitment'],
    ['Acknowledged At', off?.managerAcknowledgedAt || '—'],
    ['Acknowledged By', off?.managerAcknowledgedBy || '—'],
    ['Manager Notes', off?.managerAcknowledgementNotes || '—'],
    [],
    ['2. Workday Termination Screenshot Status', 'Status'],
    ['Termination Initiated in Workday', off?.workdayTerminationScreenshot ? 'CONFIRMED (Screenshot Uploaded)' : 'PENDING SCREENSHOT'],
    ['Workday Event / Termination Ref ID', off?.workdayTerminationNumber || 'WD-TERM-PENDING'],
    ['Screenshot File Name', off?.workdayTerminationScreenshot?.fileName || 'Pending Upload by Manager/PMO'],
    ['Screenshot Uploaded By', off?.workdayTerminationScreenshot?.uploadedBy || '—'],
    ['Screenshot Upload Timestamp', off?.workdayTerminationScreenshot?.uploadedAt || '—'],
    [],
    ['3. Automated Reminders & Timesheet Verification', 'Status'],
    ['Daily Reminders Sent to Sponsor', `${off?.dailyRemindersCount || 0} reminder(s) dispatched`],
    ['Last Reminder Timestamp', off?.lastReminderSentAt || '—'],
    ['2-Day Prior Timesheet Alignment Confirmed', off?.timesheetConfirmedTwoDaysPrior ? 'CONFIRMED (Aligned with AB Internal Data)' : 'Pending Vendor Confirmation']
  ];

  const wsWorkday = XLSX.utils.aoa_to_sheet(workdayData);
  wsWorkday['!cols'] = [{ wch: 42 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsWorkday, 'Workday Initiation Audit');

  // TAB 3: IT Assets & Access Checklist
  const assetData: (string | number)[][] = [
    ['IT Asset Recovery & Security Checklist'],
    ['Item', 'Checklist Status'],
    ['AB Managed Laptop & Peripherals Returned', off?.assetChecklist?.laptopReturned ? 'COMPLETED' : 'PENDING DEPOT RECEIPT'],
    ['Building Access Badge / Keycard Revoked', off?.assetChecklist?.badgeRevoked ? 'COMPLETED' : 'PENDING FACILITIES REVOCATION'],
    ['Active Directory, Workday & VPN Access Disabled', off?.assetChecklist?.systemAccessTerminated ? 'COMPLETED' : 'SCHEDULED WITH IT SECURITY']
  ];

  const wsAsset = XLSX.utils.aoa_to_sheet(assetData);
  wsAsset['!cols'] = [{ wch: 45 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsAsset, 'Asset Recovery Checklist');

  const cleanName = (off?.resourceName || request.candidateName).replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Offboarding_Form_2026_${request.referenceCode}_${cleanName}.xlsx`);
}

/**
 * Downloads the blank / sample official 14-field Offboarding Form 2026 template for suppliers.
 */
export function downloadSampleOffboardingTemplate() {
  const wb = XLSX.utils.book_new();

  const templateRows: (string | number)[][] = [
    ['Offboarding Form 2026'],
    ['Sr. No.', 'Description', 'Submitted Details'],
    [1, 'Resource Name', 'Rajesh Nair'],
    ['•', 'Vendor Name', 'Tech Mahindra'],
    [2, 'Resource Email (AB)', 'rajesh.nair@ab.com'],
    [3, 'Offboarding Date (Last working Day)', '30/09/2026'],
    [4, 'Offboarding Reason', 'Project Completion / SOW Deliverables Handover'],
    [5, 'AB Sponsor Email', 'anand.patel@ab.com'],
    [6, 'Division Name', 'Enterprise Cloud Services'],
    [7, 'AB-Joining Date (Current PO)', '01/02/2025'],
    [8, 'Billing Start Date (Current Year)', '01/02/2025'],
    [9, 'Billing Rate with Currency', '$80/hr'],
    [10, 'Purchase Order Number', 'PO-AB-CLOUD-2025-3001'],
    [11, 'ADM Seniority', 'Senior'],
    [12, 'ADM Role (as per SOW)', 'Cloud DevOps Specialist'],
    [13, 'Billed days in Current Year', '168 Days'],
    [14, 'Is timesheet in sync with billed days? (For T&M)', 'Yes']
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(templateRows);
  wsTemplate['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Offboarding Form 2026');

  XLSX.writeFile(wb, 'AB_Contingent_Worker_Offboarding_Form_2026_Template.xlsx');
}

/**
 * Downloads comprehensive Admin / Governance Master Audit & SLA Excel Report
 */
export function downloadGovernanceAuditExcel(requests: WorkforceRequest[]) {
  const wb = XLSX.utils.book_new();

  // TAB 1: Master Workforce Pipeline & Financial Governance
  const masterRows: (string | number)[][] = [
    ['AB-SUTRA Executive Governance & Workforce Pipeline Report'],
    ['Generated', new Date().toISOString().replace('T', ' ').substring(0, 19)],
    ['Total Records', requests.length],
    [],
    [
      'Reference Code',
      'Requisition ID',
      'Lifecycle Type',
      'Current Status',
      'Candidate / Resource Name',
      'Resource Email ID',
      'Supplier Partner',
      'Division',
      'SOW Role',
      'Seniority',
      'Daily Rate (Provided Rate)',
      'Form Received Date',
      'Days Lapsed Since Submission',
      'Billing Loss (Daily Rate × Days Lapsed)',
      'Onboarding Date in AB',
      'Billing Start Date',
      'Working Days Saved',
      'Soft Saves (Daily Rate × Working Days)',
      'Workday ID',
      'Hiring Sponsor / Manager',
      'Days in Pipeline'
    ]
  ];

  requests.forEach((r) => {
    const isOff = r.type === 'offboarding';
    const effectiveDate = isOff ? (r.offboarding?.offboardingDateLWD || '—') : r.details.joiningDateInAB;
    const resourceEmail = r.details.abEmailId && r.details.abEmailId !== 'NA'
      ? r.details.abEmailId
      : (r.generatedAbEmailId || r.details.candidateEmailId || 'Pending');
    const reqId = r.jobRequisitionId || r.details.purchaseOrderNumber || r.referenceCode;
    const { dailyRate, currency, formattedDailyRate } = parseDailyRate(r.details.billingRateWithCurrency);
    
    // Financial calculation via unified calculateRequestFinancials
    const fin = isOff ? null : calculateRequestFinancials(r);

    const diffDays = Math.max(0, Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    
    masterRows.push([
      r.referenceCode,
      reqId,
      r.type.toUpperCase(),
      r.status.toUpperCase(),
      r.candidateName,
      resourceEmail,
      r.supplierName,
      r.details.divisionName,
      r.details.admRole,
      r.details.admSeniority,
      formattedDailyRate,
      r.createdAt.replace('T', ' ').substring(0, 10),
      isOff ? 'NA' : `${fin?.businessDaysLapsed || 0} business days`,
      isOff ? 'NA' : (fin?.formattedBillingLoss || '$0'),
      effectiveDate,
      isOff ? (r.offboarding?.billingEndDate || '—') : (r.details.billingStartDate || '—'),
      isOff ? 'NA' : `${fin?.workingDaysBetweenOnboardAndBillingStart || 0} working days`,
      isOff ? 'NA' : (fin?.formattedSoftSaves || '$0'),
      r.workdayId || 'Pending',
      r.details.abManagerNameOrEmail || 'Unassigned',
      `${diffDays}d`
    ]);
  });

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
  wsMaster['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 24 },
    { wch: 28 }, { wch: 26 }, { wch: 24 }, { wch: 26 }, { wch: 14 },
    { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 18 },
    { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 26 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Workforce Pipeline');

  // TAB 2: Dedicated Financial Impact & Soft Saves (Admin & PMO View)
  const financialRows: (string | number)[][] = [
    ['AB-SUTRA Contingent Workforce Financial Impact & Soft Saves Report'],
    ['Admin & PMO Governance View: Tagged against Resource Email ID / Requisition ID / Name'],
    ['Generated', new Date().toISOString().replace('T', ' ').substring(0, 19)],
    [],
    [
      '#',
      'Resource Name',
      'Resource Email ID',
      'Requisition ID',
      'Supplier Partner',
      'Division',
      'Daily Rate',
      'Form Received Date',
      'Business Days Lapsed',
      'SLA Governance Status',
      'Billing Loss / Efficiency Gain (Business Days × Rate / Ahead of Joining Date)',
      'Onboarding Date in AB',
      'Billing Start Date',
      'Working Days (Onboard to Billing Start)',
      'Soft Saves Realized (Daily Rate × Working Days)',
      'Lifecycle Status'
    ]
  ];

  let totalLossUSD = 0;
  let totalSoftSavesUSD = 0;

  // Include Onboarding and Rejected requests for full audit trail
  const financialAuditedRequests = requests.filter(r => r.type === 'onboarding' || r.status === 'rejected');
  financialAuditedRequests.forEach((r, idx) => {
    const resourceEmail = r.details.abEmailId && r.details.abEmailId !== 'NA'
      ? r.details.abEmailId
      : (r.generatedAbEmailId || r.details.candidateEmailId || 'Pending IT');
    const reqId = r.jobRequisitionId || r.details.purchaseOrderNumber || r.referenceCode;
    const { formattedDailyRate } = parseDailyRate(r.details.billingRateWithCurrency);
    
    const fin = calculateRequestFinancials(r);

    totalLossUSD += fin.billingLoss;
    totalSoftSavesUSD += (fin.softSaves + (fin.efficiencyGain || 0));

    financialRows.push([
      idx + 1,
      r.candidateName,
      resourceEmail,
      reqId,
      r.supplierName,
      r.details.divisionName,
      formattedDailyRate,
      r.createdAt.replace('T', ' ').substring(0, 10),
      `${fin.businessDaysLapsed} business days`,
      fin.slaStatusText,
      fin.isEarlyOnboarding ? `${fin.formattedEfficiencyGain} (Efficiency Gain)` : fin.formattedBillingLoss,
      r.details.joiningDateInAB || '—',
      r.details.billingStartDate || '—',
      `${fin.workingDaysBetweenOnboardAndBillingStart} working days`,
      fin.formattedSoftSaves,
      r.status.toUpperCase()
    ]);
  });

  financialRows.push([]);
  financialRows.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `$${totalLossUSD.toLocaleString('en-US')}`,
    '',
    '',
    '',
    `$${totalSoftSavesUSD.toLocaleString('en-US')}`,
    `Net Value: $${(totalSoftSavesUSD - totalLossUSD).toLocaleString('en-US')}`
  ]);

  const wsFinancial = XLSX.utils.aoa_to_sheet(financialRows);
  wsFinancial['!cols'] = [
    { wch: 6 }, { wch: 24 }, { wch: 28 }, { wch: 18 }, { wch: 24 },
    { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 24 },
    { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 26 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financial Impact & Soft Saves');

  // TAB 3: Compliance & Audit Logs
  const auditRows: (string | number)[][] = [
    ['AB-SUTRA Consolidated Audit Trail Logs'],
    ['Timestamp', 'Reference Code', 'Candidate', 'Actor Email', 'RBAC Role', 'Action', 'Notes']
  ];

  requests.forEach((r) => {
    (r.auditTrail || []).forEach((aud) => {
      auditRows.push([
        aud.timestamp,
        r.referenceCode,
        r.candidateName,
        aud.actor,
        aud.role,
        aud.action,
        aud.notes || ''
      ]);
    });
  });

  const wsAudit = XLSX.utils.aoa_to_sheet(auditRows);
  wsAudit['!cols'] = [
    { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 50 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail Master');

  XLSX.writeFile(wb, `AB_Governance_Workforce_Financial_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
}
