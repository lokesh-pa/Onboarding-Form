package com.ab.sutra.service;

import com.ab.sutra.domain.OffboardingDetails;
import com.ab.sutra.domain.RequestStatus;
import com.ab.sutra.domain.RequestType;
import com.ab.sutra.domain.ValidationChecklist;
import com.ab.sutra.domain.WorkforceRequest;

import java.util.List;
import java.util.UUID;

public interface WorkforceService {

    List<WorkforceRequest> getRequests(RequestType type, RequestStatus status, String role, String query);

    WorkforceRequest getRequestById(UUID id);

    WorkforceRequest getRequestByReferenceCode(String refCode);

    WorkforceRequest submitOnboarding(WorkforceRequest request, String actorEmail);

    WorkforceRequest submitOffboarding(OffboardingDetails details, String supplierName, String actorEmail);

    WorkforceRequest updateComplianceChecklist(UUID id, ValidationChecklist checklist, String actorEmail, String actorRole);

    WorkforceRequest managerSignoff(UUID id, String notes, String managerEmail);

    WorkforceRequest initiateWorkday(UUID id, String workdayId, String notes, String actorEmail);

    WorkforceRequest completeOnboarding(UUID id, String corporateAbEmail, String workdayId, String actorEmail);

    WorkforceRequest requestInfo(UUID id, String queryMessage, String actorEmail);

    WorkforceRequest replyInfo(UUID id, String replyMessage, String supplierEmail);

    WorkforceRequest delegateRequest(UUID id, String delegateeEmail, String delegateeName, String scope, String reason, String actorEmail);

    WorkforceRequest acknowledgeOffboarding(UUID id, String targetInitiationDate, String notes, String sponsorEmail);

    WorkforceRequest uploadTerminationProof(UUID id, String terminationNumber, String screenshotUrl, String notes, String actorEmail);

    WorkforceRequest verifyTimesheet(UUID id, Boolean inSync, String actorEmail);

    WorkforceRequest rejectRequest(UUID id, String reason, String actorEmail);
}
