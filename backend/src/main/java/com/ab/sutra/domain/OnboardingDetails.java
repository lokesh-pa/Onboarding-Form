package com.ab.sutra.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * Official 32-Field Onboarding Intake Form Data Structure.
 * Corresponds to official AB Contingent Workforce intake requirements.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class OnboardingDetails implements Serializable {

    // Sr 1 - 13: Candidate Identity & Vendor Contact
    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "vendor_name", length = 150)
    private String vendorName;

    @Column(name = "vendor_delivery_manager_email", length = 150)
    private String vendorDeliveryManagerEmail;

    @Column(name = "resource_location", length = 150)
    private String resourceLocation;

    @Column(name = "worked_with_ab_earlier")
    private Boolean workedWithABEarlier;

    @Column(name = "ab_login_id", length = 50)
    private String abLoginId;

    @Column(name = "ab_email_id", length = 150)
    private String abEmailId;

    @Column(name = "mobile_number", length = 30)
    private String mobileNumber;

    @Column(name = "mobile_os", length = 20)
    private String mobileOperatingSystem; // Android, iOS, Other

    @Column(name = "candidate_personal_email", length = 150)
    private String candidateEmailId;

    @Column(name = "ab_manager_name_or_email", length = 150)
    private String abManagerNameOrEmail;

    // Sr 14 - 32: Engagement, PO, Compliance, BGV, SOW Alignment
    @Column(name = "division_name", length = 150)
    private String divisionName;

    @Column(name = "bgv_status", length = 50)
    private String bgvStatus; // Completed, In Progress, Pending

    @Column(name = "bgv_email_sent_to_bg_team")
    private Boolean bgvEmailSentToBgTeam; // Sent to Contingentworker.Backgroundscreening@ab.com

    @Column(name = "joining_date_in_ab")
    private LocalDate joiningDateInAB;

    @Column(name = "billing_start_date")
    private LocalDate billingStartDate;

    @Column(name = "billing_rate_with_currency", length = 50)
    private String billingRateWithCurrency; // e.g., "$85/hr" or "$680/day"

    @Column(name = "purchase_order_number", length = 50)
    private String purchaseOrderNumber;

    @Column(name = "purchase_order_end_date")
    private LocalDate purchaseOrderEndDate;

    @Column(name = "adm_seniority", length = 50)
    private String admSeniority; // Junior, Professional, Senior

    @Column(name = "adm_role", length = 150)
    private String admRole; // As per SOW

    @Column(name = "project_name", length = 150)
    private String projectName;

    @Column(name = "total_experience_prior_to_ab", length = 50)
    private String totalExperiencePriorToAB;

    @Column(name = "relevant_experience_prior_to_ab", length = 50)
    private String relevantExperiencePriorToAB;

    @Column(name = "technical_evaluation_score", length = 50)
    private String technicalEvaluationScore;

    @Column(name = "notice_period_days", length = 20)
    private String noticePeriodDays;

    @Column(name = "is_subcontractor")
    private Boolean isSubcontractor;

    @Column(name = "are_subcontractors_allowed_for_po", length = 20)
    private String areSubcontractorsAllowedForPO; // Yes, No, NA

    @Column(name = "demand_type", length = 50)
    private String demandType; // New Demand, Replacement

    @Column(name = "incumbent_email_id", length = 150)
    private String incumbentEmailId;
}
