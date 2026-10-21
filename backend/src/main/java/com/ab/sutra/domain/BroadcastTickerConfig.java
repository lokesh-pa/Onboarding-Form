package com.ab.sutra.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "broadcast_ticker_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastTickerConfig implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Supplier Ticker Channel
    @Column(name = "supplier_ticker_enabled")
    private Boolean supplierTickerEnabled;

    @Column(name = "supplier_ticker_message", length = 1000)
    private String supplierTickerMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "supplier_ticker_priority", length = 20)
    private Priority supplierTickerPriority; // INFO, WARNING, URGENT

    @Column(name = "supplier_ticker_updated_by", length = 100)
    private String supplierTickerUpdatedBy;

    @Column(name = "supplier_ticker_updated_at")
    private LocalDateTime supplierTickerUpdatedAt;

    // Manager / PMO Ticker Channel
    @Column(name = "manager_pmo_ticker_enabled")
    private Boolean managerPmoTickerEnabled;

    @Column(name = "manager_pmo_ticker_message", length = 1000)
    private String managerPmoTickerMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "manager_pmo_ticker_priority", length = 20)
    private Priority managerPmoTickerPriority;

    @Column(name = "manager_pmo_ticker_updated_by", length = 100)
    private String managerPmoTickerUpdatedBy;

    @Column(name = "manager_pmo_ticker_updated_at")
    private LocalDateTime managerPmoTickerUpdatedAt;

    // Synchronize Flag: when enabled, updates from PMO ticker automatically mirror to Supplier ticker
    @Column(name = "copy_pmo_to_supplier")
    private Boolean copyPmoToSupplier;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Priority {
        INFO,
        WARNING,
        URGENT
    }
}
