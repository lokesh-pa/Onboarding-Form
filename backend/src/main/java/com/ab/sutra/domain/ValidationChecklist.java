package com.ab.sutra.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class ValidationChecklist implements Serializable {

    // 1. Background Verification Gate
    @Column(name = "val_bgv_verified")
    private Boolean bgvVerified;

    @Column(name = "val_bgv_verified_by", length = 150)
    private String bgvVerifiedBy;

    @Column(name = "val_bgv_verified_at")
    private LocalDateTime bgvVerifiedAt;

    // 2. Purchase Order Active & Funded Gate
    @Column(name = "val_po_active_funded")
    private Boolean poActiveAndFunded;

    @Column(name = "val_po_verified_by", length = 150)
    private String poVerifiedBy;

    // 3. Subcontractor Compliance Gate
    @Column(name = "val_subcontractor_compliant")
    private Boolean subcontractorCompliant;

    @Column(name = "val_subcontractor_verified_by", length = 150)
    private String subcontractorVerifiedBy;

    // 4. Technical Evaluation Verification
    @Column(name = "val_tech_eval_verified")
    private Boolean technicalEvaluationVerified;

    @Column(name = "val_tech_eval_verified_by", length = 150)
    private String technicalEvaluationScoreVerifiedBy;

    // 5. SOW Role Alignment Gate
    @Column(name = "val_sow_role_aligned")
    private Boolean sowRoleAligned;

    @Column(name = "val_sow_role_verified_by", length = 150)
    private String sowRoleVerifiedBy;

    // 6. Hiring Manager Certification & Sign-off
    @Column(name = "val_manager_approved")
    private Boolean managerApproved;

    @Column(name = "val_manager_approved_by", length = 150)
    private String managerApprovedBy;

    @Column(name = "val_manager_approved_at")
    private LocalDateTime managerApprovedAt;
}
