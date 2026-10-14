package com.ab.sutra.controller;

import com.ab.sutra.domain.BroadcastTickerConfig;
import com.ab.sutra.repository.BroadcastTickerConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/ticker")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TickerController {

    private final BroadcastTickerConfigRepository tickerRepo;

    @GetMapping
    public ResponseEntity<BroadcastTickerConfig> getTickerConfig() {
        return ResponseEntity.ok(tickerRepo.findAll().stream().findFirst()
                .orElseGet(this::getDefaultConfig));
    }

    @PutMapping
    public ResponseEntity<BroadcastTickerConfig> updateTickerConfig(@RequestBody BroadcastTickerConfig config) {
        // Dual-channel broadcast rule:
        // "Provide a checkbox: 'Copy updates from PMO to Supplier ticker'. When checked,
        // any update saved to PMO ticker automatically synchronizes to the Supplier ticker."
        if (Boolean.TRUE.equals(config.getCopyPmoToSupplier())) {
            config.setSupplierTickerMessage(config.getManagerPmoTickerMessage());
            config.setSupplierTickerPriority(config.getManagerPmoTickerPriority());
            config.setSupplierTickerEnabled(config.getManagerPmoTickerEnabled());
            config.setSupplierTickerUpdatedAt(LocalDateTime.now());
        }
        config.setManagerPmoTickerUpdatedAt(LocalDateTime.now());

        BroadcastTickerConfig saved = tickerRepo.save(config);
        return ResponseEntity.ok(saved);
    }

    private BroadcastTickerConfig getDefaultConfig() {
        return BroadcastTickerConfig.builder()
                .supplierTickerEnabled(true)
                .supplierTickerMessage("FY26 Q3 Intake Cycle Open: Mandatory BGV clearance email confirmation required prior to Workday initiation.")
                .supplierTickerPriority(BroadcastTickerConfig.Priority.INFO)
                .supplierTickerUpdatedBy("Admin / Global Governance Lead")
                .supplierTickerUpdatedAt(LocalDateTime.now())
                .managerPmoTickerEnabled(true)
                .managerPmoTickerMessage("ATTENTION PMO & MANAGERS: Verify PO active status & SOW rate alignment before approving Workday initiation.")
                .managerPmoTickerPriority(BroadcastTickerConfig.Priority.WARNING)
                .managerPmoTickerUpdatedBy("Admin / Global Governance Lead")
                .managerPmoTickerUpdatedAt(LocalDateTime.now())
                .copyPmoToSupplier(false)
                .build();
    }
}
