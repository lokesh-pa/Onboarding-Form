package com.ab.sutra.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/directory")
@CrossOrigin(origins = "*")
public class DirectoryController {

    private static final List<EmployeeDirectoryItem> EMPLOYEES = Arrays.asList(
            new EmployeeDirectoryItem("emp-001", "Sarah Jenkins", "sarah.jenkins@ab.com", "PMO Governance Lead", "Contingent Workforce Office", "Enterprise Operations"),
            new EmployeeDirectoryItem("emp-002", "David Miller", "david.miller@ab.com", "Engineering Director", "Core Banking & Wealth Tech", "Retail Banking & Wealth"),
            new EmployeeDirectoryItem("emp-003", "Alex Chen", "alex.chen@ab.com", "Lead Architect / Hiring Manager", "Enterprise Architecture", "Commercial Banking"),
            new EmployeeDirectoryItem("emp-004", "Rachel Vance", "rachel.vance@ab.com", "PMO Specialist", "Contingent Workforce Office", "Human Resources & Governance"),
            new EmployeeDirectoryItem("emp-005", "Robert Sponsor", "robert.sponsor@ab.com", "VP Engineering & Hiring Sponsor", "Technology Infrastructure", "Global Technology Infrastructure"),
            new EmployeeDirectoryItem("emp-006", "Elena Rostova", "elena.rostova@ab.com", "Director, Advanced Analytics", "Enterprise Data Platform", "Enterprise Risk & Compliance"),
            new EmployeeDirectoryItem("emp-007", "Marcus Brody", "marcus.brody@ab.com", "Operations Manager", "Vendor Management Office", "Corporate Functions"),
            new EmployeeDirectoryItem("emp-008", "Lisa Wong", "lisa.wong@ab.com", "Engineering Manager", "Digital Experience Engineering", "Retail Banking & Wealth"),
            new EmployeeDirectoryItem("emp-009", "Arjun Patel", "arjun.patel@ab.com", "Cloud Platform Lead", "Cloud Platform Engineering", "Global Technology Infrastructure"),
            new EmployeeDirectoryItem("emp-010", "Michael Torres", "michael.torres@ab.com", "Senior Hiring Manager", "Payments & Settlement Services", "Commercial Banking"),
            new EmployeeDirectoryItem("emp-011", "AB BGV Screening Desk", "contingentworker.backgroundscreening@ab.com", "Background Screening Operations", "HR Operations", "Human Resources & Governance"),
            new EmployeeDirectoryItem("emp-012", "AB Contingent PMO Desk", "pmo.contingent@ab.com", "Central PMO Desk", "Workforce Governance", "Corporate Functions")
    );

    /**
     * Requirement: "Must query the internal employee directory by corporate email ID only
     * (e.g., typing 'sarah' searches 'sarah.jenkins@ab.com'). Name, title, and division auto-fill."
     */
    @GetMapping("/search")
    public ResponseEntity<List<EmployeeDirectoryItem>> searchByEmail(
            @RequestParam(name = "email", required = false, defaultValue = "") String emailQuery
    ) {
        if (emailQuery == null || emailQuery.trim().isEmpty()) {
            return ResponseEntity.ok(EMPLOYEES.subList(0, Math.min(5, EMPLOYEES.size())));
        }
        String q = emailQuery.toLowerCase().trim();
        List<EmployeeDirectoryItem> matched = EMPLOYEES.stream()
                .filter(e -> e.getEmail().toLowerCase().contains(q))
                .collect(Collectors.toList());
        return ResponseEntity.ok(matched);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeDirectoryItem {
        private String id;
        private String name;
        private String email;
        private String role;
        private String department;
        private String division;
    }
}
