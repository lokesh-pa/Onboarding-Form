package com.ab.sutra.controller;

import com.ab.sutra.domain.*;
import com.ab.sutra.service.ExcelService;
import com.ab.sutra.service.WorkforceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkforceController {

    private final WorkforceService workforceService;
    private final ExcelService excelService;

    @GetMapping
    public ResponseEntity<List<WorkforceRequest>> getRequests(
            @RequestParam(required = false) RequestType type,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(workforceService.getRequests(type, status, role, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkforceRequest> getRequestById(@PathVariable UUID id) {
        return ResponseEntity.ok(workforceService.getRequestById(id));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<?> submitOnboarding(
            @RequestBody(required = false) WorkforceRequest request,
            @RequestParam(value = "file", required = false) MultipartFile excelFile,
            @RequestParam(value = "supplierName", defaultValue = "Supplier Partner") String supplierName,
            @RequestParam(value = "actorEmail", defaultValue = "vendor.ops@supplier.com") String actorEmail
    ) {
        // Support batch Excel intake
        if (excelFile != null && !excelFile.isEmpty()) {
            try (InputStream in = excelFile.getInputStream()) {
                List<WorkforceRequest> parsed = excelService.parseOnboardingWorkbook(in, supplierName);
                parsed.forEach(r -> workforceService.submitOnboarding(r, actorEmail));
                return ResponseEntity.status(HttpStatus.CREATED).body(parsed);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Failed to parse Excel file: " + e.getMessage());
            }
        }
        if (request != null) {
            WorkforceRequest saved = workforceService.submitOnboarding(request, actorEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }
        return ResponseEntity.badRequest().body("Neither request JSON nor Excel file was provided.");
    }

    @PostMapping("/offboarding")
    public ResponseEntity<WorkforceRequest> submitOffboarding(
            @RequestBody OffboardingDetails details,
            @RequestParam(defaultValue = "Cognizant Technology Solutions") String supplierName,
            @RequestParam(defaultValue = "vendor.ops@cognizant.com") String actorEmail
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workforceService.submitOffboarding(details, supplierName, actorEmail));
    }

    @PutMapping("/{id}/compliance-checklist")
    public ResponseEntity<WorkforceRequest> updateComplianceChecklist(
            @PathVariable UUID id,
            @RequestBody ValidationChecklist checklist,
            @RequestParam(defaultValue = "pmo.contingent@ab.com") String actorEmail,
            @RequestParam(defaultValue = "PMO") String actorRole
    ) {
        return ResponseEntity.ok(workforceService.updateComplianceChecklist(id, checklist, actorEmail, actorRole));
    }

    @PostMapping("/{id}/manager-signoff")
    public ResponseEntity<WorkforceRequest> managerSignoff(
            @PathVariable UUID id,
            @RequestBody ManagerSignoffRequest body
    ) {
        return ResponseEntity.ok(workforceService.managerSignoff(id, body.getNotes(), body.getManagerEmail()));
    }

    @PostMapping("/{id}/initiate-workday")
    public ResponseEntity<WorkforceRequest> initiateWorkday(
            @PathVariable UUID id,
            @RequestBody InitiateWorkdayRequest body
    ) {
        return ResponseEntity.ok(workforceService.initiateWorkday(id, body.getWorkdayId(), body.getNotes(), body.getActorEmail()));
    }

    @PostMapping("/{id}/complete-onboarding")
    public ResponseEntity<WorkforceRequest> completeOnboarding(
            @PathVariable UUID id,
            @RequestBody CompleteOnboardingRequest body
    ) {
        return ResponseEntity.ok(workforceService.completeOnboarding(id, body.getCorporateAbEmail(), body.getWorkdayId(), body.getActorEmail()));
    }

    @PostMapping("/{id}/request-info")
    public ResponseEntity<WorkforceRequest> requestInfo(
            @PathVariable UUID id,
            @RequestBody InfoQueryRequest body
    ) {
        return ResponseEntity.ok(workforceService.requestInfo(id, body.getMessage(), body.getActorEmail()));
    }

    @PostMapping("/{id}/reply-info")
    public ResponseEntity<WorkforceRequest> replyInfo(
            @PathVariable UUID id,
            @RequestBody InfoReplyRequest body
    ) {
        return ResponseEntity.ok(workforceService.replyInfo(id, body.getReplyMessage(), body.getSupplierEmail()));
    }

    @PostMapping("/{id}/delegate")
    public ResponseEntity<WorkforceRequest> delegateRequest(
            @PathVariable UUID id,
            @RequestBody DelegateRequest body
    ) {
        return ResponseEntity.ok(workforceService.delegateRequest(
                id, body.getDelegateeEmail(), body.getDelegateeName(),
                body.getScope(), body.getReason(), body.getActorEmail()));
    }

    @PostMapping("/{id}/acknowledge-offboarding")
    public ResponseEntity<WorkforceRequest> acknowledgeOffboarding(
            @PathVariable UUID id,
            @RequestBody AcknowledgeOffboardingRequest body
    ) {
        return ResponseEntity.ok(workforceService.acknowledgeOffboarding(
                id, body.getTargetInitiationDate(), body.getNotes(), body.getSponsorEmail()));
    }

    @PostMapping("/{id}/upload-termination")
    public ResponseEntity<WorkforceRequest> uploadTermination(
            @PathVariable UUID id,
            @RequestBody UploadTerminationRequest body
    ) {
        return ResponseEntity.ok(workforceService.uploadTerminationProof(
                id, body.getTerminationNumber(), body.getScreenshotUrl(), body.getNotes(), body.getActorEmail()));
    }

    @PostMapping("/{id}/verify-timesheet")
    public ResponseEntity<WorkforceRequest> verifyTimesheet(
            @PathVariable UUID id,
            @RequestBody VerifyTimesheetRequest body
    ) {
        return ResponseEntity.ok(workforceService.verifyTimesheet(id, body.getInSync(), body.getActorEmail()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<WorkforceRequest> rejectRequest(
            @PathVariable UUID id,
            @RequestBody RejectRequest body
    ) {
        return ResponseEntity.ok(workforceService.rejectRequest(id, body.getReason(), body.getActorEmail()));
    }

    // DTOs for concise payload handling
    @Data public static class ManagerSignoffRequest { private String managerEmail; private String notes; }
    @Data public static class InitiateWorkdayRequest { private String workdayId; private String notes; private String actorEmail; }
    @Data public static class CompleteOnboardingRequest { private String corporateAbEmail; private String workdayId; private String actorEmail; }
    @Data public static class InfoQueryRequest { private String message; private String actorEmail; }
    @Data public static class InfoReplyRequest { private String replyMessage; private String supplierEmail; }
    @Data public static class DelegateRequest { private String delegateeEmail; private String delegateeName; private String scope; private String reason; private String actorEmail; }
    @Data public static class AcknowledgeOffboardingRequest { private String targetInitiationDate; private String notes; private String sponsorEmail; }
    @Data public static class UploadTerminationRequest { private String terminationNumber; private String screenshotUrl; private String notes; private String actorEmail; }
    @Data public static class VerifyTimesheetRequest { private Boolean inSync; private String actorEmail; }
    @Data public static class RejectRequest { private String reason; private String actorEmail; }
}
