package com.ab.sutra.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workforce_requests", indexes = {
    @Index(name = "idx_req_ref_code", columnList = "reference_code", unique = true),
    @Index(name = "idx_req_status", columnList = "status"),
    @Index(name = "idx_req_type", columnList = "type"),
    @Index(name = "idx_req_candidate", columnList = "candidate_name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkforceRequest implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_code", nullable = false, unique = true, length = 50)
    private String referenceCode; // e.g. AB-ONB-2026-0042 or AB-OFF-2026-0012

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private RequestType type; // ONBOARDING, OFFBOARDING

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private RequestStatus status;

    @Column(name = "supplier_name", nullable = false, length = 150)
    private String supplierName;

    @Column(name = "candidate_name", nullable = false, length = 150)
    private String candidateName;

    @Column(name = "workday_id", length = 50)
    private String workdayId; // e.g. WD-CW-901842

    @Column(name = "job_requisition_id", length = 50)
    private String jobRequisitionId; // e.g. JR-2026-90412

    @Column(name = "generated_ab_email_id", length = 150)
    private String generatedAbEmailId; // Provisioned @ab.com corporate email

    // Single Request Delegation (Tier 1)
    @Column(name = "delegated_to_email", length = 150)
    private String delegatedToEmail;

    @Column(name = "delegated_to_name", length = 150)
    private String delegatedToName;

    @Column(name = "delegated_scope", length = 50)
    private String delegatedScope; // Full Authority, Temporary Absence

    @Column(name = "delegated_reason", length = 500)
    private String delegatedReason;

    @Column(name = "delegated_at")
    private LocalDateTime delegatedAt;

    // 32-Field Onboarding
    @Embedded
    private OnboardingDetails details;

    // 14-Field Offboarding
    @Embedded
    private OffboardingDetails offboarding;

    // Compliance Verification Matrix
    @Embedded
    private ValidationChecklist validationChecklist;

    // Dynamic Extensible Custom Fields (stored as JSON/JSONB for column adaptability)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields", columnDefinition = "jsonb")
    @Builder.Default
    private List<CustomFieldItem> customFields = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
