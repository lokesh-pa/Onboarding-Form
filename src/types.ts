// 3 Standard Roles as part of RBAC: Supplier, PMO / Hiring Manager, Admin / Governance
export type UserRole = 'supplier' | 'manager_pmo' | 'admin' | 'manager' | 'pmo' | 'hiring_team';

export interface RequestDelegation {
  delegatedToName: string;
  delegatedToEmail: string;
  delegatedBy?: string;
  delegatedByName?: string;
  delegatedByRole?: string;
  delegatedAt: string;
  reason: string;
  delegationType: 'full_authority' | 'temporary_coverage' | 'technical_review' | 'Full Authority' | 'Temporary Absence (OOO)' | 'Technical Evaluation Only' | 'Sign-off Delegation' | string;
}

export interface ReassignmentRecord {
  id: string;
  timestamp?: string;
  reassignedAt?: string;
  reassignedBy: string;
  previousSponsor: string;
  newSponsor: string;
  newSponsorName?: string;
  newSponsorEmail?: string;
  previousDivision?: string;
  newDivision?: string;
  reason: string;
}

export type RequestType = 'onboarding' | 'offboarding';

export type RequestStatus = 
  | 'draft'
  | 'bgv_pending'
  | 'bgv_verified'
  | 'submitted'
  | 'under_review'
  | 'info_requested'
  | 'approved_workday_initiated'
  | 'onboarded'
  | 'offboarding_pending'
  | 'offboarded'
  | 'rejected';

export interface BgvResourceItem {
  id: string;
  name: string;
  location: string;
}

export interface BgvData {
  supplierName: string;
  workerNames: string[]; // for backward compatibility
  resources?: BgvResourceItem[]; // multi-resource with individual locations
  location: string;
  performedCountrySpecificChecks: boolean;
  divisionAtAB: string;
  screeningStatus: 'Complete' | 'In Progress' | 'Pending';
  completionDate: string; // dd/mm/yyyy
  bgvEmailProofName?: string;
  bgvEmailProofSize?: string;
}

export interface OnboardingDetails {
  // Sr. 1-13 (Image 3)
  firstName: string;
  middleName: string;
  lastName: string;
  vendorName: string;
  vendorDeliveryManagerEmail: string;
  resourceLocation: string;
  workedWithABEarlier: boolean;
  abLoginId: string; // NA if not earlier
  abEmailId: string; // NA if not earlier
  mobileNumber: string;
  mobileOperatingSystem: 'iOS' | 'Android' | 'Other';
  candidateEmailId: string;
  abManagerNameOrEmail: string;

  // Sr. 14-32 (Image 2)
  divisionName: string;
  bgvStatus: 'Completed' | 'Pending';
  bgvEmailSentToBgTeam: boolean; // sent to Contingentworker.Backgroundscreening@ab.com
  joiningDateInAB: string;
  billingStartDate: string;
  billingRateWithCurrency: string; // e.g. "$85/hr"
  purchaseOrderNumber: string;
  purchaseOrderEndDate: string;
  admSeniority: 'Junior' | 'Professional' | 'Senior';
  admRole: string; // as per SOW
  projectName: string; // as per agreement
  totalExperiencePriorToAB: string; // e.g. "6.5 years"
  relevantExperiencePriorToAB: string; // e.g. "4.5 years"
  technicalEvaluationScore: string; // e.g. "88/100"
  noticePeriodDays: string; // e.g. "30"
  isSubcontractor: boolean;
  areSubcontractorsAllowedForPO: 'Yes' | 'No' | 'NA';
  demandType: 'New Demand' | 'Replacement';
  incumbentEmailId: string; // if replacement
}

export interface UploadedEvidence {
  id: string;
  name: string;
  size: string;
  type: string;
  category: 'technical_evaluation' | 'bgv_proof' | 'sow_contract' | 'id_proof' | 'subcontractor_approval' | 'other';
  uploadedAt: string;
  resourceId?: string; // Links to candidate or resource id in batch
  resourceName?: string; // Resource full name (e.g. "Sarah Connor")
}

export interface EmailDistribution {
  toSponsorEmail: string;
  toPmoEmail: string;
  toAdditionalEmails?: string[]; // manually added To recipients
  ccVendorDeliveryManagerEmail: string;
  ccRamEmail: string; // Relationship / Resource Account Manager
  copyMyself: boolean;
  senderEmail: string;
  additionalCcEmails: string[];
}

export interface ValidationChecklist {
  bgvVerified: boolean;
  bgvVerifiedBy?: string;
  poActiveAndFunded: boolean;
  poVerifiedBy?: string;
  subcontractorCompliant: boolean;
  subcontractorVerifiedBy?: string;
  technicalEvaluationVerified: boolean;
  technicalEvaluationScoreVerifiedBy?: string;
  sowRoleAligned: boolean;
  sowRoleVerifiedBy?: string;
  managerApproved?: boolean;
  managerApprovedBy?: string;
  managerApprovedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: 'Supplier' | 'PMO' | 'AB Sponsor' | 'Hiring Manager' | 'Admin' | 'System' | 'Hiring Team';
  action: string;
  notes?: string;
}

export interface OffboardingDetails {
  // Standard Offboarding Form 2026 Fields (Matching Official AB Template)
  resourceName: string; // 1. Resource Name
  vendorName?: string; // Vendor / Supplier Name
  resourceEmailAB: string; // 2. Resource Email (AB)
  offboardingDateLWD: string; // 3. Offboarding Date (Last working Day)
  offboardingReason: string; // 4. Offboarding Reason
  abSponsorEmail: string; // 5. AB Sponsor Email
  divisionName: string; // 6. Division Name
  abJoiningDateCurrentPO: string; // 7. AB-Joining Date (Current PO)
  billingStartDateCurrentYear: string; // 8. Billing Start Date (Current Year)
  billingRateWithCurrency: string; // 9. Billing Rate with Currency
  purchaseOrderNumber: string; // 10. Purchase Order Number
  admSeniority: string; // 11. ADM Seniority
  admRole: string; // 12. ADM Role (as per SOW)
  billedDaysCurrentYear: string; // 13. Billed days in Current Year
  isTimesheetInSync: 'Yes' | 'No' | 'NA'; // 14. Is timesheet in sync with billed days? (For T&M)

  // Manager Acknowledgement before Workday Initiation
  managerAcknowledged?: boolean;
  managerTargetInitiationDate?: string; // "will Initiate offboarding by .......date"
  managerAcknowledgedAt?: string;
  managerAcknowledgedBy?: string;
  managerAcknowledgementNotes?: string;

  // Workday Termination Confirmation Screenshot (Required to complete process)
  workdayTerminationScreenshot?: {
    fileName: string;
    fileSize?: string;
    uploadedAt: string;
    uploadedBy: string;
    previewUrl?: string;
  };
  workdayTerminationNumber?: string;

  // Daily Reminder Tracking
  dailyRemindersCount?: number;
  lastReminderSentAt?: string;

  // 2-Days Prior Timesheet Verification
  timesheetConfirmedTwoDaysPrior?: boolean;
  timesheetConfirmedAt?: string;
  timesheetDiscrepancyReminderSent?: boolean;
  timesheetDiscrepancyReminderSentAt?: string;

  // Physical & Logical Asset Recovery
  assetChecklist?: {
    laptopReturned: boolean;
    badgeRevoked: boolean;
    systemAccessTerminated: boolean;
  };

  // Additional metadata
  billingEndDate?: string;
  comments?: string;
}

export interface DispatchedEmail {
  id: string;
  timestamp: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  bodyType: 
    | 'offboarding_initiated' 
    | 'offboarding_acknowledged' 
    | 'daily_reminder' 
    | 'timesheet_reminder' 
    | 'termination_confirmed' 
    | 'onboarding_initiated'
    | 'onboarding_completed'
    | 'request_delegated'
    | 'request_reassigned'
    | 'rejection'
    | 'info_query'
    | 'info_reply'
    | 'workday_approved'
    | 'manager_signoff'
    | 'generic_notification';
  actionableLink?: {
    label: string;
    url: string;
  };
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
  customMessage?: string;
}

export interface PolicyResourceLink {
  id: string;
  title: string;
  category: 'policy' | 'training_video' | 'sop' | 'compliance' | 'workday_guide' | 'template';
  description: string;
  url: string;
  targetRole?: 'all' | 'supplier' | 'manager_pmo' | 'admin';
  addedBy: string;
  addedAt: string;
  iconType?: 'file-text' | 'video' | 'shield' | 'book' | 'external-link';
  isInternal?: boolean;
}

export interface TickerChannelConfig {
  enabled: boolean;
  text: string;
  level: 'info' | 'warning' | 'alert';
  updatedAt: string;
  updatedBy: string;
}

export interface TickerConfig {
  supplierTicker: TickerChannelConfig;
  managerPmoTicker: TickerChannelConfig;
  copyPmoToSupplier: boolean;
}

export interface LongTermDelegation {
  enabled: boolean;
  managerEmail: string;
  delegateeEmail: string;
  delegateeName?: string;
  startDate: string;
  endDate: string;
  reason?: string;
  enabledAt?: string;
}

export interface CustomFieldItem {
  id: string;
  key: string;
  label: string;
  value: string;
  fieldType?: 'text' | 'number' | 'date' | 'select' | 'boolean';
  source?: 'excel' | 'manual' | 'system';
}

export interface WorkforceRequest {
  id: string;
  referenceCode: string; // e.g. "AB-CW-2026-0042"
  type: RequestType;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  supplierName: string;
  candidateName: string;
  batchId?: string;
  batchResources?: {
    candidateName: string;
    location: string;
    role: string;
    rate: string;
    techScore: string;
    joiningDate: string;
  }[];

  // Components
  bgv: BgvData;
  details: OnboardingDetails;
  evidences: UploadedEvidence[];
  emailDistribution: EmailDistribution;
  validationChecklist: ValidationChecklist;
  workdayId?: string;
  jobRequisitionId?: string; // e.g. "JR-2026-90412"
  generatedAbEmailId?: string; // Newly provisioned enterprise email (e.g. alex.chen@ab.com)
  delegation?: RequestDelegation; // Delegation to peer manager or PMO member
  reassignmentHistory?: ReassignmentRecord[]; // Admin reassignment records
  offboarding?: OffboardingDetails;
  customFields?: CustomFieldItem[]; // Dynamic additional fields provisioned from Excel or added manually
  auditTrail: AuditLogEntry[];
  dispatchedEmails?: DispatchedEmail[];
  pendingQueries?: {
    id: string;
    date: string;
    from: string;
    message: string;
    resolved: boolean;
    resolution?: string;
  }[];
}
