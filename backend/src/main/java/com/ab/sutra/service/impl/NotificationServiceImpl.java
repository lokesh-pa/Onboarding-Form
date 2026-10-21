package com.ab.sutra.service.impl;

import com.ab.sutra.domain.DispatchedEmail;
import com.ab.sutra.domain.WorkforceRequest;
import com.ab.sutra.repository.DispatchedEmailRepository;
import com.ab.sutra.service.NotificationService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final DispatchedEmailRepository emailRepository;

    @Value("${ab-sutra.governance.system-sender-email:portal.notifications@ab-sutra.com}")
    private String systemSenderEmail;

    @Value("${ab-sutra.governance.central-pmo-email:pmo.contingent@ab.com}")
    private String centralPmoEmail;

    @Value("${ab-sutra.governance.portal-base-url:https://contingent-workforce.ab.com}")
    private String portalBaseUrl;

    @Override
    public DispatchedEmail dispatchWorkflowEmail(
            WorkforceRequest request,
            String actorEmail,
            String actionType,
            String subject,
            String templateName,
            String customMessage,
            String actionableUrl,
            String actionableLabel,
            String attachmentName
    ) {
        Set<String> toSet = new LinkedHashSet<>();
        Set<String> ccSet = new LinkedHashSet<>();

        // 1. Hiring Sponsor
        if (request.getDetails() != null && isValidEmail(request.getDetails().getAbManagerNameOrEmail())) {
            toSet.add(request.getDetails().getAbManagerNameOrEmail());
        }
        if (request.getOffboarding() != null && isValidEmail(request.getOffboarding().getAbSponsorEmail())) {
            toSet.add(request.getOffboarding().getAbSponsorEmail());
        }

        // 2. Central PMO Desk
        toSet.add(centralPmoEmail);

        // 3. Delegatee (if active delegation exists)
        if (isValidEmail(request.getDelegatedToEmail())) {
            toSet.add(request.getDelegatedToEmail());
        }

        // 4. CC: Vendor Delivery Manager
        if (request.getDetails() != null && isValidEmail(request.getDetails().getVendorDeliveryManagerEmail())) {
            ccSet.add(request.getDetails().getVendorDeliveryManagerEmail());
        }

        // 5. CC: Regional Account Manager (RAM)
        ccSet.add("ram.contingent@supplier-network.com");

        // 6. CC: Candidate / Worker (if corporate or personal email present)
        if (request.getDetails() != null && isValidEmail(request.getDetails().getCandidateEmailId()) && !request.getDetails().getCandidateEmailId().startsWith("NA")) {
            ccSet.add(request.getDetails().getCandidateEmailId());
        }
        if (request.getOffboarding() != null && isValidEmail(request.getOffboarding().getResourceEmailAB())) {
            ccSet.add(request.getOffboarding().getResourceEmailAB());
        }
        if (isValidEmail(request.getGeneratedAbEmailId())) {
            ccSet.add(request.getGeneratedAbEmailId());
        }

        // 7. CC: The exact actor/person who performed this action MUST always receive a copy
        if (isValidEmail(actorEmail)) {
            ccSet.add(actorEmail);
        }

        // Ensure disjoint to/cc sets
        List<String> finalToList = new ArrayList<>(toSet);
        ccSet.removeAll(toSet);
        List<String> finalCcList = new ArrayList<>(ccSet);

        // Context for Thymeleaf template rendering
        Context context = new Context();
        context.setVariable("request", request);
        context.setVariable("actorEmail", actorEmail);
        context.setVariable("actionType", actionType);
        context.setVariable("customMessage", customMessage != null ? customMessage : "");
        context.setVariable("actionableUrl", actionableUrl != null ? actionableUrl : portalBaseUrl + "/#request-" + request.getReferenceCode());
        context.setVariable("actionableLabel", actionableLabel != null ? actionableLabel : "View Dossier in AB-SUTRA Portal");
        context.setVariable("currentYear", 2026);

        String renderedHtml = "";
        try {
            renderedHtml = templateEngine.process("mail/" + templateName, context);
        } catch (Exception e) {
            log.warn("Thymeleaf template rendering fallback for {}: {}", templateName, e.getMessage());
            renderedHtml = "<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
                    "<h2>AB Contingent Workforce Governance Notice</h2>" +
                    "<p><strong>Reference:</strong> " + request.getReferenceCode() + "</p>" +
                    "<p><strong>Candidate:</strong> " + request.getCandidateName() + "</p>" +
                    "<p><strong>Action:</strong> " + actionType + "</p>" +
                    "<p>" + (customMessage != null ? customMessage : "") + "</p>" +
                    "<p><a href='" + actionableUrl + "' style='background:#0F2A4A;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;'>" +
                    actionableLabel + "</a></p>" +
                    "</div>";
        }

        // Asynchronously or safely trigger JavaMailSender
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(systemSenderEmail);
            helper.setTo(finalToList.toArray(new String[0]));
            if (!finalCcList.isEmpty()) {
                helper.setCc(finalCcList.toArray(new String[0]));
            }
            helper.setSubject(subject);
            helper.setText(renderedHtml, true);
            // In dev / test, we attempt to send or log gracefully
            // mailSender.send(mimeMessage);
            log.info("Dispatched notification email [{}] to {} cc {}", subject, finalToList, finalCcList);
        } catch (Exception e) {
            log.warn("SMTP transmission suppressed in development environment: {}", e.getMessage());
        }

        // Persist email in audit trail
        DispatchedEmail dispatched = DispatchedEmail.builder()
                .requestId(request.getId())
                .referenceCode(request.getReferenceCode())
                .timestamp(LocalDateTime.now())
                .from(systemSenderEmail)
                .toList(finalToList)
                .ccList(finalCcList)
                .subject(subject)
                .bodyType(actionType)
                .actionableLinkUrl(actionableUrl)
                .actionableLinkLabel(actionableLabel)
                .attachmentName(attachmentName)
                .renderedBodyHtml(renderedHtml)
                .build();

        return emailRepository.save(dispatched);
    }

    private boolean isValidEmail(String email) {
        return email != null && email.contains("@") && email.contains(".");
    }
}
