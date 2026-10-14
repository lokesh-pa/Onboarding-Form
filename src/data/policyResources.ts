import { PolicyResourceLink, TickerConfig, LongTermDelegation } from '../types';

export const INITIAL_POLICY_RESOURCES: PolicyResourceLink[] = [
  {
    id: 'pol-1',
    title: 'AB Global Contingent Worker Policy 2026',
    category: 'policy',
    description: 'Master enterprise policy governing contingent labor engagement, maximum tenure limits (18 months), and background check clearances.',
    url: 'https://intranet.ab.com/policies/contingent-workforce-2026',
    targetRole: 'all',
    addedBy: 'Admin / Global Governance',
    addedAt: '2026-09-01',
    iconType: 'file-text',
    isInternal: true
  },
  {
    id: 'pol-2',
    title: 'SOW & T&M Rate Card Alignment Guidelines',
    category: 'policy',
    description: 'Mandatory billing rate card matrix by ADM Role, seniority grade, and work location. Requires technical evaluation verification before onboarding.',
    url: 'https://intranet.ab.com/procurement/rate-cards-2026',
    targetRole: 'manager_pmo',
    addedBy: 'Admin / Global Governance',
    addedAt: '2026-09-05',
    iconType: 'file-text',
    isInternal: true
  },
  {
    id: 'pol-3',
    title: 'Background Verification (BGV) SLA & Screening Protocol',
    category: 'compliance',
    description: 'Comprehensive guideline on mandatory pre-onboarding checks: criminal verification, education, address, and prior employment certification.',
    url: 'https://intranet.ab.com/security/bgv-handbook',
    targetRole: 'supplier',
    addedBy: 'Global Security & Compliance',
    addedAt: '2026-09-10',
    iconType: 'shield',
    isInternal: true
  },
  {
    id: 'vid-1',
    title: 'Workday Contingent Worker Profile Creation (Step-by-Step Video)',
    category: 'training_video',
    description: '12-minute screencast demonstrating the PMO Workday creation workflow, entering Job Requisition ID, and configuring corporate email.',
    url: 'https://videos.ab.com/training/workday-cw-creation-walkthrough',
    targetRole: 'manager_pmo',
    addedBy: 'Workday Enablement Team',
    addedAt: '2026-09-12',
    iconType: 'video',
    isInternal: true
  },
  {
    id: 'vid-2',
    title: 'Offboarding Data Form & Timesheet Reconciliation Video Tutorial',
    category: 'training_video',
    description: 'Visual walkthrough of the 14-field offboarding intake, 2-day pre-LWD timesheet verification, and termination screenshot upload in Workday.',
    url: 'https://videos.ab.com/training/offboarding-timesheet-sync',
    targetRole: 'all',
    addedBy: 'Contingent Workforce PMO',
    addedAt: '2026-09-14',
    iconType: 'video',
    isInternal: true
  },
  {
    id: 'vid-3',
    title: 'Manager Approval Delegation & Out-of-Office Authority Guide',
    category: 'training_video',
    description: 'Learn how hiring managers can delegate full authority or temporary review authority to peers with company directory email search.',
    url: 'https://videos.ab.com/training/manager-delegation-tutorial',
    targetRole: 'manager_pmo',
    addedBy: 'HR Operations',
    addedAt: '2026-09-15',
    iconType: 'video',
    isInternal: true
  },
  {
    id: 'sop-1',
    title: 'SOP: Two-Day Pre-LWD Timesheet Alignment & Billing Loss Prevention',
    category: 'sop',
    description: 'Standard operating procedure for checking contractor billed days vs expected AB internal days 48 hours prior to Last Working Day.',
    url: 'https://intranet.ab.com/sop/timesheet-reconciliation-2026',
    targetRole: 'manager_pmo',
    addedBy: 'Finance & PMO Operations',
    addedAt: '2026-09-15',
    iconType: 'book',
    isInternal: true
  },
  {
    id: 'guide-1',
    title: 'Workday Termination Initiation & Screenshot Certification SOP',
    category: 'workday_guide',
    description: 'Mandatory protocol for uploading Workday termination confirmation screenshot into the portal to finalize contractor exit.',
    url: 'https://intranet.ab.com/sop/workday-termination-certification',
    targetRole: 'manager_pmo',
    addedBy: 'IT Asset & Identity Security',
    addedAt: '2026-09-18',
    iconType: 'book',
    isInternal: true
  }
];

export const INITIAL_TICKER_CONFIG: TickerConfig = {
  supplierTicker: {
    enabled: true,
    text: 'Policy Update: All onboarding submissions require confirmed BGV email clearance dispatch. Use the automated Excel intake to populate the Onboarding Data Form.',
    level: 'info',
    updatedAt: '2026-09-21 09:00',
    updatedBy: 'Admin / Global Governance'
  },
  managerPmoTicker: {
    enabled: true,
    text: 'SLA Notice: Hiring managers must review submissions within 1 business day to maintain zero billing loss and maximize efficiency gains.',
    level: 'warning',
    updatedAt: '2026-09-21 09:00',
    updatedBy: 'Admin / Global Governance'
  },
  copyPmoToSupplier: false
};

export const INITIAL_LONG_TERM_DELEGATION: LongTermDelegation = {
  enabled: false,
  managerEmail: 'robert.sponsor@ab.com',
  delegateeEmail: 'clara.williams@ab.com',
  delegateeName: 'Clara Williams',
  startDate: new Date().toISOString().substring(0, 10),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
  reason: 'Annual leave coverage & sprint continuity',
  enabledAt: undefined
};
