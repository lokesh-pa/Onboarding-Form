package com.ab.sutra.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tier 2: Manager Long-Term Backup Delegation (Out-of-Office Coverage).
 * While active, both the manager and delegatee receive all notifications and can approve requests.
 */
@Entity
@Table(name = "long_term_delegations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LongTermDelegation implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "manager_email", nullable = false, length = 150)
    private String managerEmail;

    @Column(name = "delegatee_email", nullable = false, length = 150)
    private String delegateeEmail;

    @Column(name = "delegatee_name", length = 150)
    private String delegateeName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "reason", length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "enabled_at")
    private LocalDateTime enabledAt;
}
