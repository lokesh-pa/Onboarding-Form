package com.ab.sutra.service.impl;

import com.ab.sutra.domain.*;
import com.ab.sutra.repository.AuditLogRepository;
import com.ab.sutra.repository.WorkforceRequestRepository;
import com.ab.sutra.service.NotificationService;
import com.ab.sutra.service.WorkforceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkforceServiceImpl implements WorkforceService {

    private final WorkforceRequestRepository requestRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    @Override
    public List<WorkforceRequest> getRequests(RequestType type, RequestStatus status, String role, String query) {
        return requestRepository.searchRequests(type, status, query);
    }

    @Override
    public WorkforceRequest getRequestById(UUID id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workforce request not found with ID: " + id));
    }

    @Override
    public WorkforceRequest getRequestByReferenceCode(String refCode) {
        return requestRepository.findByReferenceCode(refCode)
                .orElseThrow(() -> new IllegalArgumentException("Workforce request not found with reference: " + refCode));
    }

    @Override
    @Transactional
    public WorkforceRequest submitOnboarding(WorkforceRequest request, String actorEmail) {
        if (request.getReferenceCode() == null || request.getReferenceCode().isEmpty()) {
            request.setReferenceCode("AB-ONB-2026-" + String.format("%04d", (int) (1000 + Math.random() * 9000)));
        }
        request.setType(RequestType.ONBOARDING);
        request.setStatus(RequestStatus.UNDER_REVIEW);

        // BGV Gate verification check
        if (request.getValidationChecklist() == null) {
            boolean bgvSent = request.getDetails() != null && Boolean.TRUE.equals(request.getDetails().getBgvEmailSentToBgTeam());
            request.setValidationChecklist(ValidationChecklist.builder()
                    .bgvVerified(bgvSent)
                    .bgvVerifiedBy(bgvSent ? "BGV Operations Screening Desk" : null)
                    .bgvVerifiedAt(bgvSent ? LocalDateTime.now() : null)
                    .poActiveAndFunded(false)
                    .subcontractorCompliant(request.getDetails() == null || !Boolean.TRUE.equals(request.getDetails().getIsSubcontractor()))
                    .technicalEvaluationVerified(true)
                    .sowRoleAligned(true)
                    .managerApproved(false)
                    .build());
        }

        WorkforceRequest saved = requestRepository.save(request);

        // Audit Trail
        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Supplier",
                "Onboarding Intake Dossier Submitted",
                "32-field onboarding dossier submitted. BGV status: " + (saved.getDetails() != null ? saved.getDetails().getBgvStatus() : "Pending"));

        // Trigger comprehensive stakeholder email
        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "onboarding_initiated",
                "[AB Onboarding Intake Submitted] 32-Field Dossier: " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "New onboarding request submitted by " + saved.getSupplierName() + ". Immediate PMO review & Hiring Manager sign-off required.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Review Onboarding Dossier",
                "Onboarding_Intake_32Fields_" + saved.getCandidateName().replace(" ", "_") + ".xlsx"
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest submitOffboarding(OffboardingDetails details, String supplierName, String actorEmail) {
        String refCode = "AB-OFF-2026-" + String.format("%04d", (int) (1000 + Math.random() * 9000));

        WorkforceRequest req = WorkforceRequest.builder()
                .referenceCode(refCode)
                .type(RequestType.OFFBOARDING)
                .status(RequestStatus.OFFBOARDING_PENDING)
                .supplierName(supplierName != null ? supplierName : "Supplier Partner")
                .candidateName(details.getResourceName())
                .offboarding(details)
                .validationChecklist(ValidationChecklist.builder()
                        .bgvVerified(true)
                        .poActiveAndFunded(true)
                        .subcontractorCompliant(true)
                        .technicalEvaluationVerified(true)
                        .sowRoleAligned(true)
                        .managerApproved(false)
                        .build())
                .build();

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Supplier",
                "Offboarding Request Initiated (14-Field Form)",
                "Official 14-field offboarding form submitted. LWD: " + details.getOffboardingDateLWD());

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "offboarding_initiated",
                "[AB Offboarding Initiation] 14-Field Offboarding Form: " + details.getResourceName() + " - LWD: " + details.getOffboardingDateLWD(),
                "onboarding-initiated.html",
                "14-field offboarding initiated. AB Sponsor must acknowledge and commit to Workday termination target date.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Acknowledge Offboarding & Set Target Date",
                "Offboarding_Form_2026_" + details.getResourceName().replace(" ", "_") + ".xlsx"
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest updateComplianceChecklist(UUID id, ValidationChecklist checklist, String actorEmail, String actorRole) {
        WorkforceRequest req = getRequestById(id);
        req.setValidationChecklist(checklist);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, actorRole,
                "Compliance Verification Matrix Updated",
                "Updated compliance gates. BGV: " + checklist.getBgvVerified() + ", PO: " + checklist.getPoActiveAndFunded() +
                        ", Subcontractor: " + checklist.getSubcontractorCompliant() + ", Manager Sign-off: " + checklist.getManagerApproved());

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest managerSignoff(UUID id, String notes, String managerEmail) {
        WorkforceRequest req = getRequestById(id);
        ValidationChecklist v = req.getValidationChecklist();
        if (v == null) v = new ValidationChecklist();
        v.setManagerApproved(true);
        v.setManagerApprovedBy(managerEmail);
        v.setManagerApprovedAt(LocalDateTime.now());
        v.setTechnicalEvaluationVerified(true);
        v.setSowRoleAligned(true);
        req.setValidationChecklist(v);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), managerEmail, "Hiring Manager",
                "Manager Sign-Off Certified",
                "Hiring Sponsor certified technical competence, SOW role alignment, and proposed billing rate. Notes: " + notes);

        notificationService.dispatchWorkflowEmail(
                saved,
                managerEmail,
                "manager_signoff",
                "[AB Manager Sign-Off Approved] Onboarding Dossier Certified: " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "Hiring Manager certified onboarding dossier. PMO may now initiate the Workday profile creation.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Initiate Workday Profile",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest initiateWorkday(UUID id, String workdayId, String notes, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setWorkdayId(workdayId);
        req.setStatus(RequestStatus.APPROVED_WORKDAY_INITIATED);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "PMO",
                "Workday Profile Initiated",
                "Generated Workday contingent worker profile (" + workdayId + "). Awaiting corporate @ab.com email generation.");

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "workday_approved",
                "[Workday Profile Initiated] Onboarding ID " + workdayId + " Generated for " + saved.getCandidateName(),
                "onboarding-initiated.html",
                "PMO Desk successfully created Workday profile " + workdayId + ". Corporate email provisioning in progress.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Workday Profile",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest completeOnboarding(UUID id, String corporateAbEmail, String workdayId, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setStatus(RequestStatus.ONBOARDED);
        req.setGeneratedAbEmailId(corporateAbEmail.trim());
        if (workdayId != null && !workdayId.isEmpty()) {
            req.setWorkdayId(workdayId.trim());
        }
        if (req.getDetails() != null) {
            req.getDetails().setAbEmailId(corporateAbEmail.trim());
        }

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "PMO / Admin",
                "Onboarding Completed (@ab.com Email Provisioned)",
                "Corporate enterprise email assigned: " + corporateAbEmail + ". Workday ID: " + saved.getWorkdayId() + ". Worker is fully onboarded.");

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "onboarding_completed",
                "[AB Onboarding Completed] Enterprise Email Provisioned: " + corporateAbEmail + " for " + saved.getCandidateName(),
                "onboarding-initiated.html",
                "Corporate email " + corporateAbEmail + " assigned and activated. Onboarding workflow is 100% complete.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Enterprise Provisioning Dossier",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest requestInfo(UUID id, String queryMessage, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setStatus(RequestStatus.INFO_REQUESTED);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "PMO / Manager",
                "Clarification Requested",
                "Query dispatched to vendor: \"" + queryMessage + "\"");

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "info_query",
                "[ACTION REQUIRED - Information Requested] Query on " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "Clarification query: " + queryMessage,
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Submit Clarifications in Supplier Portal",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest replyInfo(UUID id, String replyMessage, String supplierEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setStatus(RequestStatus.UNDER_REVIEW);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), supplierEmail, "Supplier",
                "Clarification Provided",
                "Vendor response: \"" + replyMessage + "\"");

        notificationService.dispatchWorkflowEmail(
                saved,
                supplierEmail,
                "info_reply",
                "[Supplier Response Provided] Clarification for " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "Supplier provided clarifications: " + replyMessage,
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Review Supplier Reply",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest delegateRequest(UUID id, String delegateeEmail, String delegateeName, String scope, String reason, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setDelegatedToEmail(delegateeEmail);
        req.setDelegatedToName(delegateeName);
        req.setDelegatedScope(scope);
        req.setDelegatedReason(reason);
        req.setDelegatedAt(LocalDateTime.now());

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Reviewer",
                "Single Request Delegated",
                "Delegated review to " + delegateeName + " (" + delegateeEmail + ") [Scope: " + scope + "]. Justification: " + reason);

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "request_delegated",
                "[ACTION REQUIRED - Workforce Delegation] Delegated Review: " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "Dossier review delegated to " + delegateeName + " (" + delegateeEmail + "). Scope: " + scope + ". Reason: " + reason,
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "Review Delegated Request in Portal",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest acknowledgeOffboarding(UUID id, String targetInitiationDate, String notes, String sponsorEmail) {
        WorkforceRequest req = getRequestById(id);
        OffboardingDetails off = req.getOffboarding();
        if (off == null) off = new OffboardingDetails();
        off.setManagerAcknowledged(true);
        off.setManagerAcknowledgedBy(sponsorEmail);
        off.setManagerAcknowledgedAt(LocalDateTime.now());
        if (targetInitiationDate != null && !targetInitiationDate.isEmpty()) {
            off.setManagerTargetInitiationDate(LocalDate.parse(targetInitiationDate));
        }
        req.setOffboarding(off);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), sponsorEmail, "Hiring Sponsor",
                "Manager Acknowledged Offboarding",
                "Committed target initiation date: " + targetInitiationDate + ". Notes: " + notes);

        notificationService.dispatchWorkflowEmail(
                saved,
                sponsorEmail,
                "offboarding_acknowledged",
                "[AB Offboarding Acknowledged] Sponsor Commitment: Target Date " + targetInitiationDate + " - " + saved.getCandidateName(),
                "onboarding-initiated.html",
                "Sponsor committed to initiate Workday termination by " + targetInitiationDate + ". Notes: " + notes,
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Offboarding Dossier",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest uploadTerminationProof(UUID id, String terminationNumber, String screenshotUrl, String notes, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setStatus(RequestStatus.OFFBOARDED);
        OffboardingDetails off = req.getOffboarding();
        if (off == null) off = new OffboardingDetails();
        off.setWorkdayTerminationNumber(terminationNumber);
        off.setTerminationScreenshotUrl(screenshotUrl);
        off.setTerminationConfirmedAt(LocalDateTime.now());
        off.setSystemAccessTerminated(true);
        off.setBadgeRevoked(true);
        off.setLaptopReturned(true);
        req.setOffboarding(off);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Hiring Sponsor / PMO",
                "Workday Termination Screenshot Uploaded & Offboarding Completed",
                "Uploaded Workday confirmation screenshot. Termination ref: " + terminationNumber + ". Credentials deactivated, building access revoked, assets recovered.");

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "termination_confirmed",
                "[AB Offboarding Completed] Workday Termination Confirmed: " + saved.getCandidateName() + " (Ref: " + terminationNumber + ")",
                "onboarding-initiated.html",
                "Workday termination screenshot verified. System credentials deactivated and asset recovery finalized.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Archived Offboarding File",
                "Workday_Termination_Proof_" + terminationNumber + ".png"
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest verifyTimesheet(UUID id, Boolean inSync, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        OffboardingDetails off = req.getOffboarding();
        if (off == null) off = new OffboardingDetails();
        off.setTimesheetConfirmedTwoDaysPrior(inSync);
        off.setTimesheetConfirmedAt(LocalDateTime.now());
        off.setIsTimesheetInSync(Boolean.TRUE.equals(inSync) ? "Yes" : "No");
        req.setOffboarding(off);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Supplier",
                "Timesheet Alignment Confirmed (2 Days Prior to LWD)",
                "Timesheet alignment verified against internal AB records. In Sync: " + (Boolean.TRUE.equals(inSync) ? "YES" : "NO"));

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "timesheet_reminder",
                "[AB Timesheet Verification Confirmed] 2-Day Prior LWD Alignment Verified: " + saved.getCandidateName(),
                "onboarding-initiated.html",
                "Timesheet confirmed aligned with AB internal billing data 2 days prior to last working day.",
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Verified Timesheet Dossier",
                null
        );

        return saved;
    }

    @Override
    @Transactional
    public WorkforceRequest rejectRequest(UUID id, String reason, String actorEmail) {
        WorkforceRequest req = getRequestById(id);
        req.setStatus(RequestStatus.REJECTED);

        WorkforceRequest saved = requestRepository.save(req);

        createAuditLog(saved.getId(), saved.getReferenceCode(), actorEmail, "Reviewer",
                "Request Rejected",
                "Dossier rejected. Reason: " + reason);

        notificationService.dispatchWorkflowEmail(
                saved,
                actorEmail,
                "rejection",
                "[NOTICE - Onboarding Request Rejected] " + saved.getCandidateName() + " (" + saved.getReferenceCode() + ")",
                "onboarding-initiated.html",
                "Request was rejected by governance reviewer. Justification: " + reason,
                "https://contingent-workforce.ab.com/#request-" + saved.getReferenceCode(),
                "View Rejection Details in Portal",
                null
        );

        return saved;
    }

    private void createAuditLog(UUID requestId, String refCode, String actor, String role, String action, String notes) {
        auditLogRepository.save(AuditLog.builder()
                .requestId(requestId)
                .referenceCode(refCode)
                .actorEmail(actor)
                .role(role)
                .action(action)
                .notes(notes)
                .build());
    }
}
