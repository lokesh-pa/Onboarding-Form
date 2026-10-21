package com.ab.sutra.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Official 14-Field Offboarding Form Data Structure.
 * Corresponds to official 2026 AB Contingent Workforce termination protocols.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class OffboardingDetails implements Serializable {

    // 14 Standard Offboarding Form Fields
    @Column(name = "off_resource_name", length = 150)
    private String resourceName; // 1. Resource Name

    @Column(name = "off_resource_email_ab", length = 150)
    private String resourceEmailAB; // 2. Resource Email (AB @ab.com)

    @Column(name = "off_date_lwd")
    private LocalDate offboardingDateLWD; // 3. Last Working Day

    @Column(name = "off_reason", length = 255)
    private String offboardingReason; // 4. Offboarding Reason

    @Column(name = "off_ab_sponsor_email", length = 150)
    private String abSponsorEmail; // 5. AB Sponsor Email

    @Column(name = "off_division_name", length = 150)
    private String divisionName; // 6. Division Name

    @Column(name = "off_joining_date_current_po")
    private LocalDate abJoiningDateCurrentPO; // 7. AB-Joining Date (Current PO)

    @Column(name = "off_billing_start_date_curr_year")
    private LocalDate billingStartDateCurrentYear; // 8. Billing Start Date (Current Year)

    @Column(name = "off_billing_rate_with_currency", length = 50)
    private String billingRateWithCurrency; // 9. Billing Rate with Currency

    @Column(name = "off_po_number", length = 50)
    private String purchaseOrderNumber; // 10. Purchase Order Number

    @Column(name = "off_adm_seniority", length = 50)
    private String admSeniority; // 11. ADM Seniority

    @Column(name = "off_adm_role", length = 150)
    private String admRole; // 12. ADM Role (as per SOW)

    @Column(name = "off_billed_days_curr_year", length = 50)
    private String billedDaysCurrentYear; // 13. Billed days in Current Year

    @Column(name = "off_is_timesheet_in_sync", length = 20)
    private String isTimesheetInSync; // 14. Is timesheet in sync with billed days? (Yes/No/NA)

    // Manager Commitment & Acknowledgement
    @Column(name = "off_manager_acknowledged")
    private Boolean managerAcknowledged;

    @Column(name = "off_manager_target_init_date")
    private LocalDate managerTargetInitiationDate; // "Will initiate offboarding by ... date"

    @Column(name = "off_manager_acknowledged_at")
    private LocalDateTime managerAcknowledgedAt;

    @Column(name = "off_manager_acknowledged_by", length = 150)
    private String managerAcknowledgedBy;

    // Workday Termination Confirmation (Screenshot Proof required to close)
    @Column(name = "off_workday_termination_number", length = 100)
    private String workdayTerminationNumber;

    @Column(name = "off_termination_screenshot_url", length = 500)
    private String terminationScreenshotUrl;

    @Column(name = "off_termination_confirmed_at")
    private LocalDateTime terminationConfirmedAt;

    // 2-Days Prior LWD Timesheet Verification
    @Column(name = "off_timesheet_confirmed_prior_lwd")
    private Boolean timesheetConfirmedTwoDaysPrior;

    @Column(name = "off_timesheet_confirmed_at")
    private LocalDateTime timesheetConfirmedAt;

    @Column(name = "off_timesheet_discrepancy_reminder_sent")
    private Boolean timesheetDiscrepancyReminderSent;

    // IT & Physical Asset Recovery Gate
    @Column(name = "off_laptop_returned")
    private Boolean laptopReturned;

    @Column(name = "off_badge_revoked")
    private Boolean badgeRevoked;

    @Column(name = "off_system_access_terminated")
    private Boolean systemAccessTerminated;
}
