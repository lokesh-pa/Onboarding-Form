package com.ab.sutra.service;

import com.ab.sutra.domain.OffboardingDetails;
import com.ab.sutra.domain.OnboardingDetails;
import com.ab.sutra.domain.WorkforceRequest;

import java.io.InputStream;
import java.util.List;

public interface ExcelService {

    /**
     * Parses an uploaded Excel (.xlsx) file containing one or more 32-field onboarding records.
     */
    List<WorkforceRequest> parseOnboardingWorkbook(InputStream inputStream, String supplierName);

    /**
     * Generates a pristine 32-field Onboarding Data Form workbook with sample headers and dynamic custom fields.
     */
    byte[] generateOnboardingWorkbook(WorkforceRequest request);

    /**
     * Generates a 14-field Offboarding Data Form workbook matching official 2026 AB specs.
     */
    byte[] generateOffboardingWorkbook(OffboardingDetails offboarding, String supplierName);

    /**
     * Generates the Comprehensive Governance & Compliance Audit Report across all requests,
     * including compliance gates, SOW alignment, and Efficiency Gain metrics.
     */
    byte[] generateGovernanceAuditReport(List<WorkforceRequest> requests);
}
