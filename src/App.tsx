import React, { useState } from 'react';
import { 
  WorkforceRequest, 
  UserRole, 
  BgvData, 
  OffboardingDetails, 
  DispatchedEmail,
  RequestDelegation,
  ReassignmentRecord,
  CustomFieldItem,
  TickerConfig,
  PolicyResourceLink,
  LongTermDelegation
} from './types';
import { INITIAL_REQUESTS } from './data/mockData';
import { 
  INITIAL_POLICY_RESOURCES, 
  INITIAL_TICKER_CONFIG, 
  INITIAL_LONG_TERM_DELEGATION 
} from './data/policyResources';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OnboardingModal } from './components/OnboardingModal';
import { OffboardingModal } from './components/OffboardingModal';
import { BgvModal } from './components/BgvModal';
import { RequestDetailModal } from './components/RequestDetailModal';
import { EmailViewerModal } from './components/EmailViewerModal';
import { BroadcastTicker } from './components/BroadcastTicker';
import { PolicyResourcesModal } from './components/PolicyResourcesModal';
import { ManagerDelegationModal } from './components/ManagerDelegationModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CommunicationsOutboxModal } from './components/CommunicationsOutboxModal';
import { ProductDemoModal } from './components/ProductDemoModal';
import { downloadSampleExcelTemplate } from './utils/excelParser';
import { downloadGovernanceAuditExcel } from './utils/excelExport';
import { CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export function App() {
  const [requests, setRequests] = useState<WorkforceRequest[]>(INITIAL_REQUESTS);
  const [currentRole, setCurrentRole] = useState<UserRole>('supplier');

  // Modal visibility states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOffboardingOpen, setIsOffboardingOpen] = useState(false);
  const [isBgvModalOpen, setIsBgvModalOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCommunicationsOpen, setIsCommunicationsOpen] = useState(false);
  const [isProductDemoOpen, setIsProductDemoOpen] = useState(false);

  // Active selections
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<WorkforceRequest | null>(null);
  const [selectedRequestForEmail, setSelectedRequestForEmail] = useState<WorkforceRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Staged BGV data from Pre-Check
  const [stagedBgvData, setStagedBgvData] = useState<Partial<BgvData> | undefined>(undefined);

  // Broadcast Ticker state
  const [tickerConfig, setTickerConfig] = useState<TickerConfig>(INITIAL_TICKER_CONFIG);

  // Policy & Training Hub state
  const [policyResources, setPolicyResources] = useState<PolicyResourceLink[]>(INITIAL_POLICY_RESOURCES);
  const [isPolicyResourcesOpen, setIsPolicyResourcesOpen] = useState(false);

  // Manager Delegation state
  const [delegationConfig, setDelegationConfig] = useState<LongTermDelegation>(INITIAL_LONG_TERM_DELEGATION);
  const [isManagerDelegationOpen, setIsManagerDelegationOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Helper to ensure all stakeholders and the action taker receive dispatched email
  const createStakeholderEmail = (
    req: WorkforceRequest,
    actorEmail: string,
    subject: string,
    bodyType: DispatchedEmail['bodyType'],
    actionableLink?: { label: string; url: string },
    attachment?: DispatchedEmail['attachment'],
    customMessage?: string
  ): DispatchedEmail => {
    const timestamp = new Date().toISOString();
    const toSet = new Set<string>();
    const ccSet = new Set<string>();

    // 1. Primary action targets (Sponsor & PMO)
    if (req.details.abManagerNameOrEmail && req.details.abManagerNameOrEmail.includes('@')) {
      toSet.add(req.details.abManagerNameOrEmail);
    }
    if (req.offboarding?.abSponsorEmail && req.offboarding.abSponsorEmail.includes('@')) {
      toSet.add(req.offboarding.abSponsorEmail);
    }
    if (req.emailDistribution?.toSponsorEmail && req.emailDistribution.toSponsorEmail.includes('@')) {
      toSet.add(req.emailDistribution.toSponsorEmail);
    }

    // PMO
    if (req.emailDistribution?.toPmoEmail) toSet.add(req.emailDistribution.toPmoEmail);
    toSet.add('pmo.contingent@ab.com');

    // Supplier / Vendor Ops
    if (req.emailDistribution?.senderEmail) toSet.add(req.emailDistribution.senderEmail);

    // 2. CC stakeholders
    if (req.emailDistribution?.ccVendorDeliveryManagerEmail) {
      ccSet.add(req.emailDistribution.ccVendorDeliveryManagerEmail);
    }
    if (req.details?.vendorDeliveryManagerEmail) {
      ccSet.add(req.details.vendorDeliveryManagerEmail);
    }
    if (req.emailDistribution?.ccRamEmail) {
      ccSet.add(req.emailDistribution.ccRamEmail);
    }
    if (req.details?.candidateEmailId && !req.details.candidateEmailId.startsWith('NA') && req.details.candidateEmailId.includes('@')) {
      ccSet.add(req.details.candidateEmailId);
    }
    if (req.offboarding?.resourceEmailAB && req.offboarding.resourceEmailAB.includes('@')) {
      ccSet.add(req.offboarding.resourceEmailAB);
    }
    req.emailDistribution?.toAdditionalEmails?.forEach((e) => {
      if (e && e.includes('@')) toSet.add(e);
    });
    req.emailDistribution?.additionalCcEmails?.forEach((e) => {
      if (e && e.includes('@')) ccSet.add(e);
    });

    // Delegated person
    if (req.delegation?.delegatedToEmail) {
      toSet.add(req.delegation.delegatedToEmail);
    }

    // 3. Person who took the action MUST always receive a copy
    if (actorEmail && actorEmail.includes('@')) {
      ccSet.add(actorEmail);
    }

    // Clean sets so to and cc don't duplicate
    const finalTo = Array.from(toSet).filter(Boolean);
    const finalCc = Array.from(ccSet).filter((e) => !toSet.has(e)).filter(Boolean);

    return {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      from: actorEmail || 'portal.notifications@ab-sutra.com',
      to: finalTo.length > 0 ? finalTo : ['pmo.contingent@ab.com'],
      cc: finalCc,
      subject,
      bodyType,
      actionableLink,
      attachment,
      customMessage
    };
  };

  // 1. Submit New Onboarding Request (triggers email immediately, supports batch)
  const handleCreateOnboarding = (newReq: WorkforceRequest | WorkforceRequest[]) => {
    const newItems = Array.isArray(newReq) ? newReq : [newReq];
    setRequests((prev) => [...newItems, ...prev]);
    if (newItems.length === 1) {
      showToast(`Onboarding dossier submitted for ${newItems[0].candidateName}! Dispatched email notification to AB Sponsor & PMO.`);
      setSelectedRequestForEmail(newItems[0]);
    } else {
      showToast(`Batch onboarding submitted for ${newItems.length} resources! Dispatched email notifications to AB Sponsor & PMO.`);
      setSelectedRequestForEmail(newItems[0]);
    }
  };

  // Manager / Admin Sign-off handler
  const handleManagerSignoff = (requestId: string, notes: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'manager' ? (req.details.abManagerNameOrEmail || 'robert.sponsor@ab.com') : 'admin.workforce@ab.com';
        const signoffEmail = createStakeholderEmail(
          req,
          actor,
          `[AB Manager Sign-Off Approved] Onboarding Dossier Certified: ${req.candidateName} (${req.referenceCode})`,
          'manager_signoff',
          {
            label: 'Review Signed-Off Dossier & Initiate Workday',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          notes || 'Confirmed technical qualifications, SOW role alignment, and proposed billing rate.'
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: new Date().toISOString(),
          validationChecklist: {
            ...req.validationChecklist,
            managerApproved: true,
            technicalEvaluationVerified: true,
            sowRoleAligned: true,
            managerApprovedBy: currentRole === 'manager' ? (req.details.abManagerNameOrEmail || 'Hiring Sponsor') : 'Admin Sponsor'
          },
          dispatchedEmails: [...(req.dispatchedEmails || []), signoffEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: currentRole === 'manager' ? 'Hiring Manager' : 'Admin',
              action: 'Manager Sign-Off Approved',
              notes: notes || 'Confirmed technical qualifications, SOW role alignment, and proposed billing rate.'
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Manager sign-off completed! Action notification dispatched to all stakeholders.');
  };

  // Toggle individual compliance checklist items
  const handleToggleChecklist = (requestId: string, itemKey: keyof import('./types').ValidationChecklist) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const currentVal = !!req.validationChecklist[itemKey];
        const actorName =
          currentRole === 'pmo'
            ? 'PMO Specialist (Sarah Jenkins)'
            : currentRole === 'manager'
            ? req.details.abManagerNameOrEmail || 'Hiring Sponsor'
            : 'Compliance Auditor';

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: new Date().toISOString(),
          validationChecklist: {
            ...req.validationChecklist,
            [itemKey]: !currentVal,
            [`${String(itemKey)}By`]: !currentVal ? actorName : undefined,
            ...(itemKey === 'managerApproved' && !currentVal
              ? { managerApprovedAt: new Date().toISOString() }
              : {})
          },
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor:
                currentRole === 'pmo'
                  ? 'pmo.contingent@ab.com'
                  : currentRole === 'manager'
                  ? req.details.abManagerNameOrEmail || 'manager@ab.com'
                  : 'admin@ab.com',
              role: currentRole === 'pmo' ? 'PMO' : currentRole === 'manager' ? 'Hiring Manager' : 'Admin',
              action: !currentVal
                ? `Compliance Gate Verified: ${String(itemKey)}`
                : `Compliance Gate Revoked: ${String(itemKey)}`,
              notes: `Audited and updated by ${actorName}.`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Compliance verification matrix updated.');
  };

  // Bulk verify all compliance gates
  const handleValidateAllChecklist = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updated: WorkforceRequest = {
          ...req,
          updatedAt: new Date().toISOString(),
          validationChecklist: {
            bgvVerified: true,
            bgvVerifiedBy: 'PMO Specialist (Sarah Jenkins)',
            poActiveAndFunded: true,
            poVerifiedBy: 'AB Finance Desk',
            subcontractorCompliant: true,
            subcontractorVerifiedBy: 'PMO Specialist (Sarah Jenkins)',
            technicalEvaluationVerified: true,
            technicalEvaluationScoreVerifiedBy: req.details.abManagerNameOrEmail || 'Hiring Sponsor',
            sowRoleAligned: true,
            sowRoleVerifiedBy: 'PMO Specialist (Sarah Jenkins)',
            managerApproved: true,
            managerApprovedBy: req.details.abManagerNameOrEmail || 'Hiring Sponsor',
            managerApprovedAt: new Date().toISOString()
          },
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor: currentRole === 'pmo' ? 'pmo.contingent@ab.com' : 'manager@ab.com',
              role: currentRole === 'pmo' ? 'PMO' : 'Hiring Manager',
              action: 'All Validation Gates Verified & Approved',
              notes: 'BGV screening clearance, PO funding, scorecard, subcontractor adherence, and SOW role alignment all verified.'
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('All compliance gates verified! Ready for Workday profile creation.');
  };

  // Reset all requests to fresh initial state
  const handleResetAllActions = () => {
    setRequests(INITIAL_REQUESTS);
    if (selectedRequestForDetail) {
      const refreshed = INITIAL_REQUESTS.find((r) => r.id === selectedRequestForDetail.id);
      setSelectedRequestForDetail(refreshed || null);
    }
    showToast('All onboarding & offboarding requests reset to fresh unacted state! You can now test the end-to-end flows.');
  };

  // 2. Approve & Initiate Workday (Step 1 of Onboarding)
  const handleApproveWorkday = (requestId: string, workdayId: string, notes: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'admin' ? 'admin.governance@ab.com' : 'pmo.contingent@ab.com';
        const workdayEmail = createStakeholderEmail(
          req,
          actor,
          `[Workday Profile Initiated] Onboarding ID ${workdayId} Generated for ${req.candidateName} (${req.referenceCode})`,
          'workday_approved',
          {
            label: 'View Provisioned Workday Profile in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          notes || `Workday Profile generated (${workdayId}). Internal checks verified. Awaiting @ab.com email generation to complete onboarding.`
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'approved_workday_initiated',
          workdayId,
          updatedAt: new Date().toISOString(),
          validationChecklist: {
            ...req.validationChecklist,
            poActiveAndFunded: true,
            technicalEvaluationVerified: true,
            sowRoleAligned: true,
            managerApproved: true
          },
          dispatchedEmails: [...(req.dispatchedEmails || []), workdayEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: currentRole === 'admin' ? 'Admin' : 'Hiring Team',
              action: 'Workday Onboarding Initiated',
              notes: `Workday Profile generated (${workdayId}). ${notes || 'All internal checks verified and signed off. Awaiting @ab.com email generation to complete onboarding.'}`
            }
          ]
        };
        // Also update the active detail modal
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast(`Initiated Workday profile (${workdayId}). Dispatched email to all stakeholders.`);
  };

  // 2b. Complete Onboarding upon @ab.com email generation (Final Step: PMO/Hiring Manager records IT email, visible to Supplier)
  const handleCompleteOnboarding = (requestId: string, abEmailId: string, workdayId: string) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);
    const cleanedEmail = abEmailId.trim();

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'admin' ? 'admin.governance@ab.com' : (req.details.abManagerNameOrEmail || 'pmo.contingent@ab.com');

        const completeEmail = createStakeholderEmail(
          req,
          actor,
          `[AB Onboarding Completed] Enterprise Email Provisioned: ${cleanedEmail} for ${req.candidateName} (Workday: ${workdayId || req.workdayId})`,
          'onboarding_completed',
          {
            label: 'View Provisioned Enterprise Profile in Portal',
            url: `#request-${req.referenceCode}`
          }
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'onboarded',
          workdayId: workdayId || req.workdayId,
          generatedAbEmailId: cleanedEmail,
          updatedAt: timestamp,
          details: {
            ...req.details,
            abEmailId: cleanedEmail
          },
          dispatchedEmails: [...(req.dispatchedEmails || []), completeEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor,
              role: currentRole === 'admin' ? 'Admin' : 'PMO / Hiring Manager',
              action: 'Onboarding Completed (@ab.com Email Provisioned)',
              notes: `Corporate email ${cleanedEmail} officially entered. Workday profile ${workdayId || req.workdayId} marked active. Corporate email transmitted and visible to Supplier.`
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast(`Onboarding completed! Corporate email ${cleanedEmail} assigned and notification sent to all stakeholders.`);
  };

  // Delegation of Request (Option for PMO / Hiring Manager to delegate review & approval to peer)
  const handleDelegateRequest = (requestId: string, delegationData: RequestDelegation) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = delegationData.delegatedByName || req.details.abManagerNameOrEmail || 'pmo.contingent@ab.com';

        const delegationEmail = createStakeholderEmail(
          req,
          actor,
          `[ACTION REQUIRED - Workforce Delegation] Delegated Review for ${req.candidateName} (${req.referenceCode})`,
          'request_delegated',
          {
            label: 'Review Delegated Request in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          `Delegated to ${delegationData.delegatedToName} (${delegationData.delegatedToEmail}) [${delegationData.delegationType}]. Reason: ${delegationData.reason}`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          delegation: delegationData,
          dispatchedEmails: [...(req.dispatchedEmails || []), delegationEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor,
              role: delegationData.delegatedByRole || 'PMO / Hiring Manager',
              action: 'Workforce Request Delegated',
              notes: `Request delegated to ${delegationData.delegatedToName} (${delegationData.delegatedToEmail}) [${delegationData.delegationType}]. Justification: ${delegationData.reason}`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast(`Request successfully delegated to ${delegationData.delegatedToName} (${delegationData.delegatedToEmail})!`);
  };

  // Reassignment of Request (Admin & Governance authority to transfer sponsor)
  const handleReassignRequest = (
    requestId: string,
    reassignmentData: { newSponsorName: string; newSponsorEmail: string; newDivision?: string; reason: string }
  ) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const previousSponsor = req.details.abManagerNameOrEmail || 'Unassigned';
        const reassignRecord: ReassignmentRecord = {
          id: 'reassign-' + Date.now(),
          timestamp: formattedTimestamp,
          reassignedAt: formattedTimestamp,
          reassignedBy: 'Admin / Governance Lead',
          previousSponsor,
          newSponsor: reassignmentData.newSponsorEmail,
          newSponsorName: reassignmentData.newSponsorName,
          newSponsorEmail: reassignmentData.newSponsorEmail,
          previousDivision: req.details.divisionName,
          newDivision: reassignmentData.newDivision || req.details.divisionName,
          reason: reassignmentData.reason
        };

        const reassignEmail = createStakeholderEmail(
          req,
          'admin.governance@ab.com',
          `[Governance Notice - Request Reassigned] Sponsor Transferred for ${req.candidateName} (${req.referenceCode})`,
          'request_reassigned',
          {
            label: 'Review Reassigned Request in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          `Transferred from ${previousSponsor} to ${reassignmentData.newSponsorName} (${reassignmentData.newSponsorEmail}). Division: ${reassignmentData.newDivision || req.details.divisionName}. Reason: ${reassignmentData.reason}`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          details: {
            ...req.details,
            abManagerNameOrEmail: reassignmentData.newSponsorEmail,
            divisionName: reassignmentData.newDivision || req.details.divisionName
          },
          reassignmentHistory: [...(req.reassignmentHistory || []), reassignRecord],
          dispatchedEmails: [...(req.dispatchedEmails || []), reassignEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor: 'admin.governance@ab.com',
              role: 'Admin',
              action: 'Governance Sponsor Reassigned',
              notes: `Transferred from ${previousSponsor} to ${reassignmentData.newSponsorName} (${reassignmentData.newSponsorEmail}). Division: ${reassignmentData.newDivision || req.details.divisionName}. Reason: ${reassignmentData.reason}`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast(`Governance reassignment confirmed! New sponsor is ${reassignmentData.newSponsorEmail}`);
  };

  // 2c. Confirm Offboarding
  const handleConfirmOffboarding = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'admin' ? 'admin.governance@ab.com' : 'pmo.contingent@ab.com';
        const offboardConfirmEmail = createStakeholderEmail(
          req,
          actor,
          `[AB Offboarding Completed] System Access Terminated & Assets Recovered: ${req.candidateName} (${req.referenceCode})`,
          'termination_confirmed',
          {
            label: 'View Archived Offboarding File in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          'System credentials deactivated, building access revoked, asset retrieval finalized.'
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'offboarded',
          updatedAt: new Date().toISOString(),
          dispatchedEmails: [...(req.dispatchedEmails || []), offboardConfirmEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: currentRole === 'admin' ? 'Admin' : 'Hiring Team',
              action: 'Offboarding Confirmed & Access Revoked',
              notes: 'System credentials deactivated, building access revoked, asset retrieval finalized.'
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Offboarding confirmed and access revoked. Dispatched notification to all stakeholders.');
  };

  // 3. Request More Information from Supplier
  const handleRequestMoreInfo = (requestId: string, message: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'admin' ? 'admin.governance@ab.com' : (req.details.abManagerNameOrEmail || 'pmo.contingent@ab.com');
        const queryEmail = createStakeholderEmail(
          req,
          actor,
          `[ACTION REQUIRED - Additional Information Requested] Query on ${req.candidateName} (${req.referenceCode})`,
          'info_query',
          {
            label: 'Reply with Clarifications in Supplier Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          message
        );

        const newQuery = {
          id: 'q-' + Date.now(),
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          from: 'PMO & AB Sponsor Reviewer',
          message
        };
        const updated: WorkforceRequest = {
          ...req,
          status: 'info_requested',
          updatedAt: new Date().toISOString(),
          pendingQueries: [...(req.pendingQueries || []), newQuery],
          dispatchedEmails: [...(req.dispatchedEmails || []), queryEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: currentRole === 'admin' ? 'Admin' : 'Hiring Team',
              action: 'Requested Additional Information',
              notes: `Clarification query dispatched to vendor: "${message}"`
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Dispatched request for additional details to Supplier partner and all stakeholders.');
  };

  // 4. Supplier Responds with Clarifications
  const handleSupplierResponse = (requestId: string, replyMessage: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = req.emailDistribution.senderEmail || 'vendor@partner.com';
        const replyEmail = createStakeholderEmail(
          req,
          actor,
          `[Supplier Response Provided] Clarification for ${req.candidateName} (${req.referenceCode})`,
          'info_reply',
          {
            label: 'Review Supplier Response in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          replyMessage
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'under_review',
          updatedAt: new Date().toISOString(),
          dispatchedEmails: [...(req.dispatchedEmails || []), replyEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: 'Supplier',
              action: 'Supplier Clarifications Submitted',
              notes: `Vendor response: "${replyMessage}". Request returned to PMO review queue.`
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Clarification submitted to AB Hiring Team. Dispatched notification to all stakeholders.');
  };

  // 5. Reject Request
  const handleRejectRequest = (requestId: string, reason: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = currentRole === 'admin' ? 'admin.governance@ab.com' : (req.details.abManagerNameOrEmail || 'pmo.contingent@ab.com');
        const rejectEmail = createStakeholderEmail(
          req,
          actor,
          `[NOTICE - Onboarding Request Rejected] ${req.candidateName} (${req.referenceCode})`,
          'rejection',
          {
            label: 'View Rejection Details in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          reason
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'rejected',
          updatedAt: new Date().toISOString(),
          dispatchedEmails: [...(req.dispatchedEmails || []), rejectEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              actor,
              role: currentRole === 'admin' ? 'Admin' : 'Hiring Team',
              action: 'Request Rejected',
              notes: `Reason: ${reason}`
            }
          ]
        };
        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );
    showToast('Onboarding request rejected. Notification dispatched to all stakeholders.');
  };

  // 6. Submit Offboarding (14 Standard Fields with Excel Generation & Actionable Email)
  const handleSubmitOffboarding = (
    offboardingData: OffboardingDetails,
    originalWorkerRequest?: WorkforceRequest,
    customFields?: CustomFieldItem[]
  ) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    const supplierName =
      originalWorkerRequest?.supplierName ||
      (offboardingData.abSponsorEmail.includes('@')
        ? 'Cognizant Technology Solutions'
        : 'Supplier Partner');
    const referenceCode = `AB-OFF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialEmail: DispatchedEmail = {
      id: 'email-off-' + Date.now(),
      timestamp,
      from: originalWorkerRequest?.emailDistribution.senderEmail || 'vendor.ops@cognizant.com',
      to: [
        offboardingData.abSponsorEmail || originalWorkerRequest?.details.abManagerNameOrEmail || 'robert.sponsor@ab.com',
        'pmo.contingent@ab.com'
      ],
      cc: [
        originalWorkerRequest?.emailDistribution.ccVendorDeliveryManagerEmail || 'delivery.manager@cognizant.com',
        'it.asset.recovery@ab.com'
      ],
      subject: `[AB Offboarding Initiation] Formal 14-Field Offboarding Form: ${offboardingData.resourceName} (${supplierName}) - PO: ${offboardingData.purchaseOrderNumber}`,
      bodyType: 'offboarding_initiated',
      actionableLink: {
        label: 'Review Offboarding Request & Commit Target Date',
        url: `#review-${referenceCode}`
      },
      attachment: {
        name: `Offboarding_Form_2026_${offboardingData.resourceName.replace(/\s+/g, '_')}.xlsx`,
        size: '24.5 KB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    };

    const newOffboardingRequest: WorkforceRequest = {
      id: 'req-off-' + Date.now(),
      referenceCode,
      type: 'offboarding',
      status: 'offboarding_pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      supplierName,
      candidateName: offboardingData.resourceName,
      customFields: customFields && customFields.length > 0 ? customFields : (originalWorkerRequest?.customFields || undefined),
      bgv: originalWorkerRequest?.bgv || {
        supplierName,
        workerNames: [offboardingData.resourceName],
        location: 'Enterprise Depot',
        performedCountrySpecificChecks: true,
        divisionAtAB: offboardingData.divisionName,
        screeningStatus: 'Complete',
        completionDate: offboardingData.abJoiningDateCurrentPO
      },
      details: {
        firstName: offboardingData.resourceName.split(' ')[0] || 'Resource',
        middleName: '',
        lastName: offboardingData.resourceName.split(' ').slice(1).join(' ') || 'Candidate',
        vendorName: supplierName,
        vendorDeliveryManagerEmail: originalWorkerRequest?.details.vendorDeliveryManagerEmail || 'dm@supplier.com',
        resourceLocation: originalWorkerRequest?.details.resourceLocation || 'Corporate HQ',
        workedWithABEarlier: true,
        abLoginId: originalWorkerRequest?.details.abLoginId || 'NA',
        abEmailId: offboardingData.resourceEmailAB,
        mobileNumber: originalWorkerRequest?.details.mobileNumber || '+1 (555) 301-4490',
        mobileOperatingSystem: 'Android',
        candidateEmailId: offboardingData.resourceEmailAB,
        abManagerNameOrEmail: offboardingData.abSponsorEmail,
        divisionName: offboardingData.divisionName,
        bgvStatus: 'Completed',
        bgvEmailSentToBgTeam: true,
        joiningDateInAB: offboardingData.abJoiningDateCurrentPO,
        billingStartDate: offboardingData.billingStartDateCurrentYear,
        billingRateWithCurrency: offboardingData.billingRateWithCurrency,
        purchaseOrderNumber: offboardingData.purchaseOrderNumber,
        purchaseOrderEndDate: offboardingData.offboardingDateLWD,
        admSeniority: (offboardingData.admSeniority as any) || 'Senior',
        admRole: offboardingData.admRole,
        projectName: originalWorkerRequest?.details.projectName || 'Enterprise Transformation',
        totalExperiencePriorToAB: '5.5 Years',
        relevantExperiencePriorToAB: '4.5 Years',
        technicalEvaluationScore: 'Verified',
        noticePeriodDays: '30',
        isSubcontractor: false,
        areSubcontractorsAllowedForPO: 'NA',
        demandType: 'New Demand',
        incumbentEmailId: 'NA'
      },
      evidences: [],
      emailDistribution: {
        toSponsorEmail: offboardingData.abSponsorEmail,
        toPmoEmail: 'pmo.contingent@ab.com',
        ccVendorDeliveryManagerEmail: originalWorkerRequest?.emailDistribution.ccVendorDeliveryManagerEmail || 'dm@supplier.com',
        ccRamEmail: 'ram.americas@cognizant.com',
        copyMyself: true,
        senderEmail: originalWorkerRequest?.emailDistribution.senderEmail || 'vendor.ops@supplier.com',
        additionalCcEmails: ['it.asset.recovery@ab.com']
      },
      validationChecklist: {
        bgvVerified: true,
        poActiveAndFunded: true,
        subcontractorCompliant: true,
        technicalEvaluationVerified: true,
        sowRoleAligned: true
      },
      workdayId: originalWorkerRequest?.workdayId || `WD-CW-${Math.floor(100000 + Math.random() * 900000)}`,
      offboarding: {
        ...offboardingData,
        dailyRemindersCount: 0
      },
      dispatchedEmails: [initialEmail],
      auditTrail: [
        {
          id: 'aud-' + Date.now(),
          timestamp: formattedTimestamp,
          actor: originalWorkerRequest?.emailDistribution.senderEmail || 'vendor.ops@cognizant.com',
          role: 'Supplier',
          action: 'Offboarding Request Initiated (14-Field Form)',
          notes: `Submitted 14-field Offboarding Form 2026. LWD: ${offboardingData.offboardingDateLWD}. Actionable email with Excel attachment dispatched to Sponsor & PMO.`
        }
      ]
    };

    setRequests((prev) => [newOffboardingRequest, ...prev]);
    showToast(`14-field offboarding initiated for ${offboardingData.resourceName}! Actionable offline email generated.`);
    setSelectedRequestForEmail(newOffboardingRequest);
  };

  // 7. Manager Acknowledgement of Offboarding Request
  const handleAcknowledgeOffboarding = (requestId: string, targetDate: string, notes: string) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const ackActor =
          currentRole === 'manager'
            ? req.details.abManagerNameOrEmail || 'robert.sponsor@ab.com'
            : 'pmo.contingent@ab.com';

        const ackEmail = createStakeholderEmail(
          req,
          ackActor,
          `[AB Offboarding Acknowledged] Sponsor Commitment: Will Initiate in Workday by ${targetDate} - ${req.candidateName}`,
          'offboarding_acknowledged',
          {
            label: 'View Acknowledged Status in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          `Committed target initiation date: "Will initiate offboarding by ${targetDate}". Notes: ${notes}`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          offboarding: req.offboarding
            ? {
                ...req.offboarding,
                managerAcknowledged: true,
                managerTargetInitiationDate: targetDate,
                managerAcknowledgedAt: formattedTimestamp,
                managerAcknowledgedBy: ackActor,
                managerAcknowledgementNotes: notes
              }
            : undefined,
          dispatchedEmails: [...(req.dispatchedEmails || []), ackEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor: ackActor,
              role: 'Hiring Team',
              action: 'Manager Acknowledged Offboarding',
              notes: `Committed target initiation date: "Will initiate offboarding by ${targetDate}". Notes: ${notes}`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );

    showToast(`Manager acknowledgement recorded! Dispatched notification to all stakeholders.`);
  };

  // 8. Upload Workday Termination Confirmation Screenshot (Completes the Process)
  const handleUploadTerminationScreenshot = (
    requestId: string,
    fileData: { fileName: string; fileSize: string; previewUrl: string },
    terminationNumber: string,
    notes: string
  ) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const uploader =
          currentRole === 'manager'
            ? `${req.details.abManagerNameOrEmail || 'robert.sponsor@ab.com'}`
            : 'pmo.contingent@ab.com';

        const confirmedEmail = createStakeholderEmail(
          req,
          uploader,
          `[AB Offboarding Completed] Workday Termination Initiated & Confirmed with Screenshot: ${req.candidateName} (Event Ref: ${terminationNumber})`,
          'termination_confirmed',
          undefined,
          {
            name: fileData.fileName,
            size: fileData.fileSize,
            type: 'image/png'
          },
          notes || 'Workday termination screenshot uploaded and access terminated.'
        );

        const updated: WorkforceRequest = {
          ...req,
          status: 'offboarded',
          updatedAt: timestamp,
          offboarding: req.offboarding
            ? {
                ...req.offboarding,
                workdayTerminationScreenshot: {
                  ...fileData,
                  uploadedAt: formattedTimestamp,
                  uploadedBy: uploader
                },
                workdayTerminationNumber: terminationNumber,
                comments: notes || req.offboarding.comments
              }
            : undefined,
          dispatchedEmails: [...(req.dispatchedEmails || []), confirmedEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor: uploader,
              role: 'Hiring Team',
              action: 'Workday Termination Screenshot Uploaded & Offboarding Completed',
              notes: `Uploaded confirmation screenshot "${fileData.fileName}". Workday ref: ${terminationNumber}. Offboarding process completed. Dispatched email to all stakeholders.`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );

    showToast(`Workday termination screenshot verified! Dispatched confirmation email to all stakeholders.`);
  };

  // 9. Automated / Manual Daily Reminder Dispatcher
  const handleTriggerDailyReminder = (requestId: string) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const newCount = (req.offboarding?.dailyRemindersCount || 0) + 1;

        const reminderEmail = createStakeholderEmail(
          req,
          'system.automations@ab-sutra.com',
          `[DAILY REMINDER #${newCount}] Workday Termination Confirmation Screenshot Required: ${req.candidateName}`,
          'daily_reminder',
          {
            label: 'Upload Workday Termination Screenshot to Complete',
            url: `#upload-${req.referenceCode}`
          },
          undefined,
          `Automated daily reminder #${newCount} sent to Sponsor & PMO: Pending Workday termination confirmation screenshot.`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          offboarding: req.offboarding
            ? {
                ...req.offboarding,
                dailyRemindersCount: newCount,
                lastReminderSentAt: formattedTimestamp
              }
            : undefined,
          dispatchedEmails: [...(req.dispatchedEmails || []), reminderEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor: 'system.automations@ab-sutra.com',
              role: 'System',
              action: `Daily Reminder Dispatched (Count: ${newCount})`,
              notes: `Automated daily reminder #${newCount} sent to Sponsor & PMO: Pending Workday termination confirmation screenshot.`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );

    showToast(`Dispatched automated daily reminder email to all stakeholders.`);
  };

  // 10. Confirm Timesheet Sync (2-Days Prior to LWD)
  const handleConfirmTimesheetSync = (requestId: string) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const actor = req.emailDistribution.senderEmail || 'vendor.ops@supplier.com';

        const timesheetEmail = createStakeholderEmail(
          req,
          actor,
          `[AB Timesheet Verification Confirmed] 2-Day Prior LWD Alignment Verified for ${req.candidateName}`,
          'timesheet_reminder',
          {
            label: 'View Verified Timesheet in Portal',
            url: `#request-${req.referenceCode}`
          },
          undefined,
          `Supplier confirmed that timesheet of ${req.candidateName} leaving on ${req.offboarding?.offboardingDateLWD || 'LWD'} is filled correctly and aligned to AB internal timesheet data (T&M).`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          offboarding: req.offboarding
            ? {
                ...req.offboarding,
                timesheetConfirmedTwoDaysPrior: true,
                timesheetConfirmedAt: formattedTimestamp
              }
            : undefined,
          dispatchedEmails: [...(req.dispatchedEmails || []), timesheetEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor,
              role: 'Supplier',
              action: 'Timesheet Alignment Confirmed (2 Days Prior to LWD)',
              notes: `Supplier confirmed that timesheet of ${req.candidateName} leaving on ${req.offboarding?.offboardingDateLWD || 'LWD'} is filled correctly and aligned to AB internal timesheet data (T&M).`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );

    showToast('Timesheet alignment confirmed against AB internal data. Dispatched notification to all stakeholders.');
  };

  // 11. Trigger Urgent Timesheet Discrepancy Reminder to PMO & Supplier
  const handleTriggerTimesheetReminder = (requestId: string) => {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const lwd = req.offboarding?.offboardingDateLWD || 'Last Working Day';
        const billedDays = req.offboarding?.billedDaysCurrentYear ?? 0;
        const totalExpected = req.offboarding?.totalDaysExpected ?? 'Full Term';
        const pmoEmail = 'pmo.contingent@ab.com';
        const supplierEmail = req.emailDistribution.senderEmail || 'vendor.ops@supplier.com';
        const supplierDmEmail =
          req.details.vendorDeliveryManagerEmail ||
          req.emailDistribution.ccVendorDeliveryManagerEmail ||
          'dm@supplier.com';

        const timesheetReminderEmail = createStakeholderEmail(
          req,
          'system.automations@ab-sutra.com',
          `[URGENT: TIMESHEET DISCREPANCY] Reconcile Timesheet Before LWD (${lwd}) for ${req.candidateName}`,
          'timesheet_reminder',
          {
            label: 'Review Offboarding Dossier & Reconcile Timesheet',
            url: `#timesheet-sync-${req.referenceCode}`
          },
          undefined,
          `Urgent timesheet reminder dispatched. Timesheet is not in sync (${billedDays} days billed vs ${totalExpected} expected). Must be completed before last working day (${lwd}).`
        );

        const updated: WorkforceRequest = {
          ...req,
          updatedAt: timestamp,
          offboarding: req.offboarding
            ? {
                ...req.offboarding,
                timesheetDiscrepancyReminderSent: true,
                timesheetDiscrepancyReminderSentAt: formattedTimestamp
              }
            : undefined,
          dispatchedEmails: [...(req.dispatchedEmails || []), timesheetReminderEmail],
          auditTrail: [
            ...req.auditTrail,
            {
              id: 'aud-' + Date.now(),
              timestamp: formattedTimestamp,
              actor: 'system.automations@ab-sutra.com',
              role: 'System',
              action: 'Timesheet Discrepancy Reminder Dispatched',
              notes: `Urgent timesheet reminder dispatched to PMO (${pmoEmail}) and Supplier (${supplierDmEmail}, ${supplierEmail}). Timesheet is not in sync (${billedDays} days billed vs ${totalExpected} expected). Must be completed before last working day (${lwd}).`
            }
          ]
        };

        if (selectedRequestForDetail?.id === requestId) {
          setSelectedRequestForDetail(updated);
        }
        return updated;
      })
    );

    showToast('Urgent timesheet discrepancy reminder dispatched to PMO, Supplier, and all stakeholders!');
  };

  // BGV Pre-check confirmed
  const handleBgvPreCheckConfirmed = (bgvData: {
    supplierName: string;
    workerNames: string[];
    location: string;
    countrySpecificChecks: boolean;
    division: string;
    completionDate: string;
    proofFileName?: string;
  }) => {
    setStagedBgvData({
      supplierName: bgvData.supplierName,
      workerNames: bgvData.workerNames,
      location: bgvData.location,
      performedCountrySpecificChecks: bgvData.countrySpecificChecks,
      divisionAtAB: bgvData.division,
      completionDate: bgvData.completionDate,
      screeningStatus: 'Complete',
      bgvEmailProofName: bgvData.proofFileName
    });

    showToast(`BGV Clearance Notice dispatched to Contingentworker.Backgroundscreening@ab.com!`);
    // Prompt to open onboarding with pre-staged BGV info
    setIsOnboardingOpen(true);
  };

  const pendingValidationCount = requests.filter((r) => r.status === 'under_review').length;
  const infoRequestedCount = requests.filter((r) => r.status === 'info_requested').length;
  const managerPendingCount = requests.filter((r) => r.status === 'under_review' && !r.validationChecklist?.managerApproved).length;
  const totalDispatchedCount = requests.reduce((acc, r) => acc + (r.dispatchedEmails?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={(r) => {
          setCurrentRole(r);
          const roleLabels: Record<string, string> = {
            supplier: 'Supplier / Vendor Partner',
            manager_pmo: 'PMO / Hiring Manager',
            admin: 'Admin / Governance',
            manager: 'PMO / Hiring Manager',
            pmo: 'PMO / Hiring Manager',
            hiring_team: 'PMO / Hiring Manager'
          };
          showToast(`Switched portal context to ${roleLabels[r] || r}`);
        }}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenOffboarding={() => setIsOffboardingOpen(true)}
        onOpenBgvModal={() => setIsBgvModalOpen(true)}
        onDownloadTemplate={downloadSampleExcelTemplate}
        onResetAllActions={handleResetAllActions}
        onDownloadGovernanceReport={() => downloadGovernanceAuditExcel(requests)}
        pendingValidationCount={pendingValidationCount}
        infoRequestedCount={infoRequestedCount}
        managerPendingCount={managerPendingCount}
        onOpenPolicyResources={() => setIsPolicyResourcesOpen(true)}
        onOpenManagerDelegation={() => setIsManagerDelegationOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        activeDelegationCount={delegationConfig?.enabled ? 1 : 0}
        onOpenCommunications={() => setIsCommunicationsOpen(true)}
        dispatchedCount={totalDispatchedCount}
        onOpenProductDemo={() => setIsProductDemoOpen(true)}
      />

      {/* Broadcast Ticker */}
      <BroadcastTicker
        tickerConfig={tickerConfig}
        onUpdateConfig={setTickerConfig}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardView
          requests={requests}
          currentRole={currentRole}
          onSelectRequest={(req) => setSelectedRequestForDetail(req)}
          onOpenEmailViewer={(req) => setSelectedRequestForEmail(req)}
          onOpenNewOnboarding={() => setIsOnboardingOpen(true)}
          onRoleChange={(r) => setCurrentRole(r)}
          onResetAllActions={handleResetAllActions}
          onTriggerDailyReminder={handleTriggerDailyReminder}
          onTriggerTimesheetReminder={handleTriggerTimesheetReminder}
          onSupplierResponse={handleSupplierResponse}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">AB Contingent Workforce Governance</span>
            <span>•</span>
            <span>Compliant with Workday 2026 Onboarding & BGV Verification Protocols</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsBgvModalOpen(true)}
              className="hover:text-blue-600 transition"
            >
              BGV Screening Format
            </button>
            <button
              onClick={downloadSampleExcelTemplate}
              className="hover:text-blue-600 transition"
            >
              Download Excel Template
            </button>
          </div>
        </div>
      </footer>

      {/* Onboarding Modal (Form with Excel intake, Onboarding Data Form, tech evidence button, email config) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleCreateOnboarding}
        defaultBgvData={stagedBgvData}
        onOpenBgvModal={() => {
          setIsOnboardingOpen(false);
          setIsBgvModalOpen(true);
        }}
      />

      {/* Offboarding Modal */}
      <OffboardingModal
        isOpen={isOffboardingOpen}
        onClose={() => setIsOffboardingOpen(false)}
        activeRequests={requests}
        onSubmitOffboarding={handleSubmitOffboarding}
      />

      {/* BGV Modal (Format from Image 1) */}
      <BgvModal
        isOpen={isBgvModalOpen}
        onClose={() => setIsBgvModalOpen(false)}
        onConfirmVerified={handleBgvPreCheckConfirmed}
      />

      {/* Policy & Training Resources Hub */}
      <PolicyResourcesModal
        isOpen={isPolicyResourcesOpen}
        onClose={() => setIsPolicyResourcesOpen(false)}
        currentRole={currentRole}
        resources={policyResources}
        onUpdateResources={setPolicyResources}
        onOpenProductDemo={() => setIsProductDemoOpen(true)}
      />

      {/* Spring Boot 3 Architecture & Java Source Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Manager Delegation Modal (Email-Only Search) */}
      <ManagerDelegationModal
        isOpen={isManagerDelegationOpen}
        onClose={() => setIsManagerDelegationOpen(false)}
        currentRole={currentRole}
        delegationConfig={delegationConfig}
        delegation={delegationConfig}
        onSaveDelegation={(saved) => {
          setDelegationConfig(saved);
          showToast('Manager delegation preference saved!');
        }}
      />

      {/* Request Detail & Validation Modal */}
      <RequestDetailModal
        request={selectedRequestForDetail}
        isOpen={!!selectedRequestForDetail}
        onClose={() => setSelectedRequestForDetail(null)}
        currentRole={currentRole}
        onRoleChange={(r) => setCurrentRole(r)}
        onApproveWorkday={handleApproveWorkday}
        onCompleteOnboarding={handleCompleteOnboarding}
        onDelegateRequest={handleDelegateRequest}
        onReassignRequest={handleReassignRequest}
        onConfirmOffboarding={handleConfirmOffboarding}
        onAcknowledgeOffboarding={handleAcknowledgeOffboarding}
        onUploadTerminationScreenshot={handleUploadTerminationScreenshot}
        onTriggerDailyReminder={handleTriggerDailyReminder}
        onTriggerTimesheetReminder={handleTriggerTimesheetReminder}
        onConfirmTimesheetSync={handleConfirmTimesheetSync}
        onManagerSignoff={handleManagerSignoff}
        onToggleChecklist={handleToggleChecklist}
        onValidateAllChecklist={handleValidateAllChecklist}
        onRequestMoreInfo={handleRequestMoreInfo}
        onSupplierResponse={handleSupplierResponse}
        onOpenEmailViewer={(req) => setSelectedRequestForEmail(req)}
        onRejectRequest={handleRejectRequest}
      />

      {/* Triggered Email Viewer Modal */}
      <EmailViewerModal
        request={selectedRequestForEmail}
        isOpen={!!selectedRequestForEmail}
        onClose={() => setSelectedRequestForEmail(null)}
        currentRole={currentRole}
        onActionClick={() => {
          if (selectedRequestForEmail) {
            setSelectedRequestForDetail(selectedRequestForEmail);
          }
        }}
      />

      {/* Cross-Request Communications Outbox Modal */}
      <CommunicationsOutboxModal
        isOpen={isCommunicationsOpen}
        onClose={() => setIsCommunicationsOpen(false)}
        requests={requests}
        onSelectRequest={(req) => {
          setSelectedRequestForDetail(req);
        }}
        currentRole={currentRole}
      />

      {/* Product Demo Video & Interactive Walkthrough Modal */}
      <ProductDemoModal
        isOpen={isProductDemoOpen}
        onClose={() => setIsProductDemoOpen(false)}
        onNavigateToFeature={(feature) => {
          if (feature === 'onboarding') {
            setCurrentRole('supplier');
            setIsOnboardingOpen(true);
          } else if (feature === 'offboarding') {
            setIsOffboardingOpen(true);
          } else if (feature === 'bgv') {
            setIsBgvModalOpen(true);
          } else if (feature === 'excel') {
            setCurrentRole('supplier');
            setIsOnboardingOpen(true);
          } else if (feature === 'outbox') {
            setIsCommunicationsOpen(true);
          } else if (feature === 'role_pmo') {
            setCurrentRole('manager_pmo');
            showToast('Switched to PMO / Hiring Manager view');
          }
        }}
      />
    </div>
  );
}

export default App;
