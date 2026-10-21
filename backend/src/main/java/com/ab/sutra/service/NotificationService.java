package com.ab.sutra.service;

import com.ab.sutra.domain.DispatchedEmail;
import com.ab.sutra.domain.WorkforceRequest;

public interface NotificationService {

    /**
     * Dispatches an action-triggered email to all required stakeholders:
     * Hiring Sponsor, PMO Desk, Vendor Delivery Manager, Regional Account Manager (RAM),
     * Candidate/Worker, and the exact actor who executed the action.
     */
    DispatchedEmail dispatchWorkflowEmail(
            WorkforceRequest request,
            String actorEmail,
            String actionType,
            String subject,
            String templateName,
            String customMessage,
            String actionableUrl,
            String actionableLabel,
            String attachmentName
    );
}
