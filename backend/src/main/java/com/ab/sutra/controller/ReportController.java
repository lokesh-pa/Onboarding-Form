package com.ab.sutra.controller;

import com.ab.sutra.domain.OffboardingDetails;
import com.ab.sutra.domain.WorkforceRequest;
import com.ab.sutra.service.ExcelService;
import com.ab.sutra.service.WorkforceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final WorkforceService workforceService;
    private final ExcelService excelService;

    @GetMapping("/governance-excel")
    public ResponseEntity<byte[]> downloadGovernanceAuditReport() {
        List<WorkforceRequest> allRequests = workforceService.getRequests(null, null, null, null);
        byte[] excelBytes = excelService.generateGovernanceAuditReport(allRequests);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=AB_SUTRA_Governance_Audit_Report_2026.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/onboarding-template")
    public ResponseEntity<byte[]> downloadOnboardingTemplate() {
        byte[] excelBytes = excelService.generateOnboardingWorkbook(null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=AB_Contingent_Workforce_Onboarding_32Fields_Template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/offboarding-template")
    public ResponseEntity<byte[]> downloadOffboardingTemplate() {
        byte[] excelBytes = excelService.generateOffboardingWorkbook(null, "Supplier Partner");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=AB_Contingent_Workforce_Offboarding_14Fields_Template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
