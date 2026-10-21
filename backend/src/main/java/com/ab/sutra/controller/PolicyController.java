package com.ab.sutra.controller;

import com.ab.sutra.domain.PolicyResourceLink;
import com.ab.sutra.repository.PolicyResourceLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PolicyController {

    private final PolicyResourceLinkRepository policyRepo;

    @GetMapping
    public ResponseEntity<List<PolicyResourceLink>> getPolicies(
            @RequestParam(required = false) PolicyResourceLink.Category category
    ) {
        List<PolicyResourceLink> list = category != null ?
                policyRepo.findByCategory(category) : policyRepo.findAll();
        if (list.isEmpty()) {
            return ResponseEntity.ok(getDefaultPolicies());
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<PolicyResourceLink> createPolicy(@RequestBody PolicyResourceLink policy) {
        return ResponseEntity.status(HttpStatus.CREATED).body(policyRepo.save(policy));
    }

    private List<PolicyResourceLink> getDefaultPolicies() {
        return Arrays.asList(
                PolicyResourceLink.builder()
                        .category(PolicyResourceLink.Category.BGV_POLICY)
                        .title("AB Global Background Verification (BGV) Screening Standard Operating Procedure 2026")
                        .description("Mandatory 7-year employment and address verification guidelines for all contingent resources.")
                        .url("https://ab.sharepoint.com/sites/compliance/bgv-2026-standard.pdf")
                        .isExternal(false)
                        .addedBy("Global Governance Lead")
                        .build(),
                PolicyResourceLink.builder()
                        .category(PolicyResourceLink.Category.OFFBOARDING_SOP)
                        .title("Contingent Worker Offboarding & IT Asset Recovery Protocol (14-Field SOP)")
                        .description("Mandatory checklist for laptop return, Workday termination screenshot upload, and timesheet lock.")
                        .url("https://ab.sharepoint.com/sites/it-sec/cw-offboarding-protocol.pdf")
                        .isExternal(false)
                        .addedBy("Global Governance Lead")
                        .build(),
                PolicyResourceLink.builder()
                        .category(PolicyResourceLink.Category.MANAGER_GUIDELINES)
                        .title("Hiring Sponsor Playbook: SOW Alignment, PO Line Funding & Delegation Rules")
                        .description("Step-by-step guidance for managers certifying technical evaluation scores and backup delegation.")
                        .url("https://ab.sharepoint.com/sites/pmo/manager-playbook-cw.pdf")
                        .isExternal(false)
                        .addedBy("Central PMO Desk")
                        .build(),
                PolicyResourceLink.builder()
                        .category(PolicyResourceLink.Category.TRAINING_VIDEOS)
                        .title("Tutorial: Navigating Workday 2026 Intake & Multi-Resource Excel Parsing")
                        .description("10-minute microlearning on parsing 32-field bulk workbooks and configuring out-of-office delegations.")
                        .url("https://ab.sharepoint.com/videos/ab-sutra-masterclass")
                        .isExternal(false)
                        .addedBy("AB Talent Academy")
                        .build()
        );
    }
}
