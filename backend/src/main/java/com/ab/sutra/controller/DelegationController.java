package com.ab.sutra.controller;

import com.ab.sutra.domain.LongTermDelegation;
import com.ab.sutra.repository.LongTermDelegationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/delegation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DelegationController {

    private final LongTermDelegationRepository delegationRepo;

    /**
     * Tier 2: Manager Long-Term Backup Delegation (Out-of-Office Coverage).
     */
    @GetMapping("/manager")
    public ResponseEntity<LongTermDelegation> getManagerDelegation(
            @RequestParam(defaultValue = "robert.sponsor@ab.com") String managerEmail
    ) {
        Optional<LongTermDelegation> delegation = delegationRepo.findByManagerEmailAndEnabledTrue(managerEmail);
        return ResponseEntity.ok(delegation.orElse(null));
    }

    @PutMapping("/manager")
    public ResponseEntity<LongTermDelegation> updateManagerDelegation(
            @RequestBody LongTermDelegation delegation
    ) {
        Optional<LongTermDelegation> existing = delegationRepo.findByManagerEmailAndEnabledTrue(delegation.getManagerEmail());
        if (existing.isPresent()) {
            LongTermDelegation curr = existing.get();
            curr.setEnabled(delegation.getEnabled());
            curr.setDelegateeEmail(delegation.getDelegateeEmail());
            curr.setDelegateeName(delegation.getDelegateeName());
            curr.setStartDate(delegation.getStartDate() != null ? delegation.getStartDate() : LocalDate.now());
            curr.setEndDate(delegation.getEndDate() != null ? delegation.getEndDate() : LocalDate.now().plusWeeks(2));
            curr.setReason(delegation.getReason());
            return ResponseEntity.ok(delegationRepo.save(curr));
        }
        return ResponseEntity.ok(delegationRepo.save(delegation));
    }
}
