import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// In-Memory Data Store (Synchronized with Spring JPA Schema)
// ==========================================

const COMPANY_DIRECTORY = [
  { id: 'emp-001', name: 'Sarah Jenkins', email: 'sarah.jenkins@ab.com', role: 'PMO Governance Lead', department: 'Contingent Workforce Office', division: 'Enterprise Operations' },
  { id: 'emp-002', name: 'David Miller', email: 'david.miller@ab.com', role: 'Engineering Director', department: 'Core Banking & Wealth Tech', division: 'Retail Banking & Wealth' },
  { id: 'emp-003', name: 'Alex Chen', email: 'alex.chen@ab.com', role: 'Lead Architect / Hiring Manager', department: 'Enterprise Architecture', division: 'Commercial Banking' },
  { id: 'emp-004', name: 'Rachel Vance', email: 'rachel.vance@ab.com', role: 'PMO Specialist', department: 'Contingent Workforce Office', division: 'Human Resources & Governance' },
  { id: 'emp-005', name: 'Robert Sponsor', email: 'robert.sponsor@ab.com', role: 'VP Engineering & Hiring Sponsor', department: 'Technology Infrastructure', division: 'Global Technology Infrastructure' },
  { id: 'emp-006', name: 'Elena Rostova', email: 'elena.rostova@ab.com', role: 'Director, Advanced Analytics', department: 'Enterprise Data Platform', division: 'Enterprise Risk & Compliance' },
  { id: 'emp-007', name: 'Marcus Brody', email: 'marcus.brody@ab.com', role: 'Contingent Workforce Operations Manager', department: 'Vendor Management Office', division: 'Corporate Functions' },
  { id: 'emp-008', name: 'Lisa Wong', email: 'lisa.wong@ab.com', role: 'Application Engineering Manager', department: 'Digital Experience Engineering', division: 'Retail Banking & Wealth' },
  { id: 'emp-009', name: 'Arjun Patel', email: 'arjun.patel@ab.com', role: 'Cloud Platform Lead', department: 'Cloud Platform Engineering', division: 'Global Technology Infrastructure' },
  { id: 'emp-010', name: 'Michael Torres', email: 'michael.torres@ab.com', role: 'Senior Hiring Manager', department: 'Payments & Settlement Services', division: 'Commercial Banking' },
  { id: 'emp-011', name: 'AB BGV Screening Desk', email: 'contingentworker.backgroundscreening@ab.com', role: 'Background Screening Operations', department: 'HR Operations', division: 'Human Resources & Governance' },
  { id: 'emp-012', name: 'AB Contingent PMO Desk', email: 'pmo.contingent@ab.com', role: 'Central PMO Desk', department: 'Workforce Governance', division: 'Corporate Functions' }
];

let tickerConfig = {
  supplierTicker: {
    enabled: true,
    message: 'FY26 Q3 Intake Cycle Open: Mandatory BGV clearance email confirmation required prior to Workday initiation.',
    priority: 'INFO',
    updatedBy: 'Admin / Global Governance Lead',
    updatedAt: new Date().toISOString()
  },
  managerPmoTicker: {
    enabled: true,
    message: 'ATTENTION PMO & MANAGERS: Verify PO active status & SOW rate alignment before approving Workday initiation.',
    priority: 'WARNING',
    updatedBy: 'Admin / Global Governance Lead',
    updatedAt: new Date().toISOString()
  },
  copyPmoToSupplier: false
};

let managerDelegation = {
  enabled: false,
  managerEmail: 'robert.sponsor@ab.com',
  delegateeEmail: 'sarah.jenkins@ab.com',
  delegateeName: 'Sarah Jenkins',
  startDate: new Date().toISOString().substring(0, 10),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
  reason: 'Out of office coverage for sprint releases.'
};

let policyResources = [
  {
    id: 'pol-001',
    category: 'BGV_POLICY',
    title: 'AB Global Background Verification (BGV) Screening Standard Operating Procedure 2026',
    description: 'Mandatory 7-year employment and address verification guidelines for all contingent resources.',
    url: 'https://ab.sharepoint.com/sites/compliance/bgv-2026-standard.pdf',
    isExternal: false,
    addedBy: 'Global Governance Lead'
  },
  {
    id: 'pol-002',
    category: 'OFFBOARDING_SOP',
    title: 'Contingent Worker Offboarding & IT Asset Recovery Protocol (14-Field SOP)',
    description: 'Mandatory checklist for laptop return, Workday termination screenshot upload, and timesheet lock.',
    url: 'https://ab.sharepoint.com/sites/it-sec/cw-offboarding-protocol.pdf',
    isExternal: false,
    addedBy: 'Global Governance Lead'
  },
  {
    id: 'pol-003',
    category: 'MANAGER_GUIDELINES',
    title: 'Hiring Sponsor Playbook: SOW Alignment, PO Line Funding & Delegation Rules',
    description: 'Step-by-step guidance for managers certifying technical evaluation scores and backup delegation.',
    url: 'https://ab.sharepoint.com/sites/pmo/manager-playbook-cw.pdf',
    isExternal: false,
    addedBy: 'Central PMO Desk'
  },
  {
    id: 'pol-004',
    category: 'TRAINING_VIDEOS',
    title: 'Tutorial: Navigating Workday 2026 Intake & Multi-Resource Excel Parsing',
    description: '10-minute microlearning on parsing 32-field bulk workbooks and configuring out-of-office delegations.',
    url: 'https://ab.sharepoint.com/videos/ab-sutra-masterclass',
    isExternal: false,
    addedBy: 'AB Talent Academy'
  }
];

let dispatchedEmails: any[] = [];
let workforceRequests: any[] = [];

// Helper to record dispatched emails with all 6 stakeholder categories
function dispatchNotification(action: string, req: any, actorEmail: string, notes?: string) {
  const hiringManagerEmail = req.details?.abManagerNameOrEmail?.includes('@')
    ? req.details.abManagerNameOrEmail
    : req.offboarding?.sponsorEmail || 'robert.sponsor@ab.com';

  const vendorManagerEmail = req.details?.vendorDeliveryManagerEmail || 'vendor.ops@supplier.com';
  const candidateEmail = req.details?.candidateEmailId || req.offboarding?.resourceCorporateEmail || 'candidate.worker@example.com';

  const toList = [hiringManagerEmail, 'pmo.contingent@ab.com'];
  const ccList = [vendorManagerEmail, 'ram.contingent@ab.com', candidateEmail, actorEmail];

  const emailRecord = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    from: 'AB-SUTRA Governance System <ab-sutra-system@ab.com>',
    toList: Array.from(new Set(toList)),
    ccList: Array.from(new Set(ccList)),
    subject: `[AB-SUTRA Alert] ${action}: ${req.candidateName || req.offboarding?.resourceName} (${req.referenceCode})`,
    bodyType: 'HTML',
    actionableLinkUrl: `https://sutra.ab.com/requests/${req.id}`,
    actionableLinkLabel: 'Open Dossier in AB-SUTRA Portal',
    notes: notes || `Action ${action} executed by ${actorEmail}.`
  };

  dispatchedEmails.unshift(emailRecord);
  return emailRecord;
}

// ==========================================
// REST API Endpoints (/api/v1)
// ==========================================

app.get('/api/v1/requests', (req: Request, res: Response) => {
  const { type, status, search } = req.query;
  let filtered = [...workforceRequests];

  if (type) {
    filtered = filtered.filter(r => r.type.toLowerCase() === (type as string).toLowerCase());
  }
  if (status) {
    filtered = filtered.filter(r => r.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (search) {
    const s = (search as string).toLowerCase();
    filtered = filtered.filter(r =>
      r.candidateName?.toLowerCase().includes(s) ||
      r.referenceCode?.toLowerCase().includes(s) ||
      r.supplierName?.toLowerCase().includes(s)
    );
  }

  res.json(filtered);
});

app.get('/api/v1/requests/:id', (req: Request, res: Response) => {
  const item = workforceRequests.find(r => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found' });
  res.json(item);
});

app.post('/api/v1/requests/onboarding', (req: Request, res: Response) => {
  const body = req.body;
  const newReq = {
    id: body.id || `req-${Date.now()}`,
    referenceCode: `AB-ONB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'onboarding',
    status: 'under_review',
    supplierName: body.supplierName || 'Vendor Partner',
    candidateName: body.candidateName || `${body.details?.firstName || 'New'} ${body.details?.lastName || 'Worker'}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    details: body.details || {},
    validationChecklist: body.validationChecklist || {
      bgvVerified: body.details?.bgvEmailSentToBgTeam || false,
      poActiveAndFunded: false,
      subcontractorCompliant: body.details?.isSubcontractor ? false : true,
      technicalEvaluationVerified: false,
      sowRoleAligned: false,
      managerApproved: false
    },
    customFields: body.customFields || [],
    auditTrail: [
      {
        id: `aud-${Date.now()}`,
        action: 'Onboarding Dossier Submitted (32 Fields)',
        timestamp: new Date().toISOString(),
        actor: body.actorEmail || 'vendor.ops@supplier.com',
        role: 'Supplier'
      }
    ]
  };

  workforceRequests.unshift(newReq);
  dispatchNotification('Onboarding Dossier Submitted', newReq, body.actorEmail || 'vendor.ops@supplier.com');
  res.status(201).json(newReq);
});

app.post('/api/v1/requests/offboarding', (req: Request, res: Response) => {
  const details = req.body;
  const newReq = {
    id: `req-off-${Date.now()}`,
    referenceCode: `AB-OFF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'offboarding',
    status: 'offboarding_pending',
    supplierName: req.query.supplierName || 'Vendor Partner',
    candidateName: details.resourceName || 'Contingent Worker',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    offboarding: details,
    auditTrail: [
      {
        id: `aud-${Date.now()}`,
        action: '14-Field Offboarding Dossier Initiated',
        timestamp: new Date().toISOString(),
        actor: details.sponsorEmail || 'vendor.ops@supplier.com',
        role: 'Supplier / Sponsor'
      }
    ]
  };

  workforceRequests.unshift(newReq);
  dispatchNotification('Offboarding Initiated', newReq, details.sponsorEmail || 'vendor.ops@supplier.com');
  res.status(201).json(newReq);
});

app.put('/api/v1/requests/:id/compliance-checklist', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  reqItem.validationChecklist = { ...reqItem.validationChecklist, ...req.body };
  reqItem.updatedAt = new Date().toISOString();
  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: 'Compliance Verification Matrix Updated',
    timestamp: new Date().toISOString(),
    actor: req.query.actorEmail || 'pmo.contingent@ab.com',
    role: req.query.actorRole || 'PMO'
  });

  res.json(reqItem);
});

app.post('/api/v1/requests/:id/manager-signoff', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { managerEmail, notes } = req.body;
  reqItem.validationChecklist.managerApproved = true;
  reqItem.validationChecklist.managerApprovedBy = managerEmail || 'robert.sponsor@ab.com';
  reqItem.validationChecklist.managerApprovedAt = new Date().toISOString();
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: 'Hiring Manager Certification & Approval',
    timestamp: new Date().toISOString(),
    actor: managerEmail || 'robert.sponsor@ab.com',
    role: 'Hiring Manager',
    notes
  });

  dispatchNotification('Manager Sign-off Approved', reqItem, managerEmail || 'robert.sponsor@ab.com', notes);
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/initiate-workday', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { workdayId, notes, actorEmail } = req.body;
  reqItem.status = 'approved_workday_initiated';
  reqItem.workdayId = workdayId || `WD-CW-${Math.floor(100000 + Math.random() * 900000)}`;
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Workday Worker Profile Initiated (${reqItem.workdayId})`,
    timestamp: new Date().toISOString(),
    actor: actorEmail || 'pmo.contingent@ab.com',
    role: 'PMO Specialist',
    notes
  });

  dispatchNotification('Workday Profile Initiated', reqItem, actorEmail || 'pmo.contingent@ab.com', notes);
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/complete-onboarding', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { corporateAbEmail, workdayId, actorEmail } = req.body;
  reqItem.status = 'onboarded';
  reqItem.generatedAbEmailId = corporateAbEmail;
  if (workdayId) reqItem.workdayId = workdayId;
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Enterprise @ab.com Email Assigned (${corporateAbEmail}) & Onboarding Completed`,
    timestamp: new Date().toISOString(),
    actor: actorEmail || 'pmo.contingent@ab.com',
    role: 'PMO / IT Provisioning'
  });

  dispatchNotification('Corporate Email Provisioned & Onboarding Completed', reqItem, actorEmail || 'pmo.contingent@ab.com');
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/delegate', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { delegateeEmail, delegateeName, scope, reason, actorEmail } = req.body;
  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Request Delegated to ${delegateeName || delegateeEmail} (${scope || 'Full Authority'})`,
    timestamp: new Date().toISOString(),
    actor: actorEmail || 'robert.sponsor@ab.com',
    role: 'Reviewer',
    notes: reason
  });

  dispatchNotification(`Request Delegated to ${delegateeEmail}`, reqItem, actorEmail || 'robert.sponsor@ab.com', reason);
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/acknowledge-offboarding', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { targetInitiationDate, notes, sponsorEmail } = req.body;
  if (reqItem.offboarding) {
    reqItem.offboarding.managerAcknowledged = true;
    reqItem.offboarding.managerTargetInitiationDate = targetInitiationDate;
  }
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Offboarding Acknowledged by Sponsor (Commitment: ${targetInitiationDate})`,
    timestamp: new Date().toISOString(),
    actor: sponsorEmail || 'robert.sponsor@ab.com',
    role: 'Hiring Sponsor',
    notes
  });

  dispatchNotification('Offboarding Acknowledged', reqItem, sponsorEmail || 'robert.sponsor@ab.com', notes);
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/upload-termination', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { terminationNumber, screenshotUrl, notes, actorEmail } = req.body;
  reqItem.status = 'offboarded';
  if (reqItem.offboarding) {
    reqItem.offboarding.workdayTerminationNumber = terminationNumber;
    reqItem.offboarding.terminationScreenshotUrl = screenshotUrl;
  }
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Workday Termination Confirmation Uploaded (${terminationNumber})`,
    timestamp: new Date().toISOString(),
    actor: actorEmail || 'pmo.contingent@ab.com',
    role: 'PMO / Sponsor',
    notes
  });

  dispatchNotification('Offboarding Completed (Termination Verified)', reqItem, actorEmail || 'pmo.contingent@ab.com', notes);
  res.json(reqItem);
});

app.post('/api/v1/requests/:id/verify-timesheet', (req: Request, res: Response) => {
  const reqItem = workforceRequests.find(r => r.id === req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const { inSync, actorEmail } = req.body;
  if (reqItem.offboarding) {
    reqItem.offboarding.timesheetConfirmedTwoDaysPrior = inSync;
  }
  reqItem.updatedAt = new Date().toISOString();

  reqItem.auditTrail.push({
    id: `aud-${Date.now()}`,
    action: `Timesheet Reconciliation Confirmed (2 Days Prior to LWD)`,
    timestamp: new Date().toISOString(),
    actor: actorEmail || 'pmo.contingent@ab.com',
    role: 'PMO Desk'
  });

  dispatchNotification('Timesheet 2-Day Pre-LWD Reconciled', reqItem, actorEmail || 'pmo.contingent@ab.com');
  res.json(reqItem);
});

app.get('/api/v1/directory/search', (req: Request, res: Response) => {
  const emailQuery = (req.query.email as string || '').toLowerCase().trim();
  if (!emailQuery) {
    return res.json(COMPANY_DIRECTORY.slice(0, 5));
  }
  const matched = COMPANY_DIRECTORY.filter(e => e.email.toLowerCase().includes(emailQuery));
  res.json(matched);
});

app.get('/api/v1/ticker', (_req: Request, res: Response) => {
  res.json(tickerConfig);
});

app.put('/api/v1/ticker', (req: Request, res: Response) => {
  tickerConfig = { ...tickerConfig, ...req.body };
  if (tickerConfig.copyPmoToSupplier) {
    tickerConfig.supplierTicker.message = tickerConfig.managerPmoTicker.message;
    tickerConfig.supplierTicker.priority = tickerConfig.managerPmoTicker.priority;
    tickerConfig.supplierTicker.enabled = tickerConfig.managerPmoTicker.enabled;
    tickerConfig.supplierTicker.updatedAt = new Date().toISOString();
  }
  tickerConfig.managerPmoTicker.updatedAt = new Date().toISOString();
  res.json(tickerConfig);
});

app.get('/api/v1/policies', (req: Request, res: Response) => {
  const { category } = req.query;
  if (category) {
    return res.json(policyResources.filter(p => p.category === category));
  }
  res.json(policyResources);
});

app.post('/api/v1/policies', (req: Request, res: Response) => {
  const newPolicy = {
    id: `pol-${Date.now()}`,
    ...req.body,
    addedBy: req.body.addedBy || 'Governance Lead'
  };
  policyResources.unshift(newPolicy);
  res.status(201).json(newPolicy);
});

app.get('/api/v1/delegation/manager', (_req: Request, res: Response) => {
  res.json(managerDelegation);
});

app.put('/api/v1/delegation/manager', (req: Request, res: Response) => {
  managerDelegation = { ...managerDelegation, ...req.body };
  res.json(managerDelegation);
});

app.get('/api/v1/dispatched-emails', (_req: Request, res: Response) => {
  res.json(dispatchedEmails);
});

// Excel Workbook generation route using xlsx
app.get('/api/v1/reports/governance-excel', (_req: Request, res: Response) => {
  const rows = workforceRequests.map(r => ({
    'Reference Code': r.referenceCode,
    'Candidate / Resource': r.candidateName,
    'Request Type': r.type?.toUpperCase(),
    'Current Status': r.status?.toUpperCase(),
    'Supplier Name': r.supplierName,
    'Workday ID': r.workdayId || 'NA',
    'Corporate Email (@ab.com)': r.generatedAbEmailId || r.details?.abEmailId || 'NA',
    'PO Number': r.details?.purchaseOrderNumber || r.offboarding?.poNumber || 'NA',
    'Billing Rate': r.details?.billingRateWithCurrency || r.offboarding?.billingRateWithCurrency || 'NA',
    'BGV Status': r.details?.bgvStatus || 'NA',
    'Manager Approved': r.validationChecklist?.managerApproved ? 'YES' : 'NO',
    'Created At': r.createdAt,
    'Financial Efficiency Gain': 'Evaluated via SLA Engine (Efficiency Gain)'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Status: 'No records available' }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'AB_Governance_Audit');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="AB_SUTRA_Governance_Audit_Report_2026.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// ==========================================
// Vite Integration (Dev) & Static Serving (Prod)
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[AB-SUTRA Platform] Running full-stack server on http://localhost:${PORT}`);
  });
}

startServer();
