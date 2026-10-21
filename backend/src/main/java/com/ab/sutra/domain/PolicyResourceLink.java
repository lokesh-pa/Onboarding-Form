package com.ab.sutra.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "policy_resource_links")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyResourceLink implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private Category category;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "is_external")
    private Boolean isExternal;

    @Column(name = "added_by", length = 100)
    private String addedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Category {
        BGV_POLICY,
        OFFBOARDING_SOP,
        MANAGER_GUIDELINES,
        TRAINING_VIDEOS,
        EXTERNAL_LINKS
    }
}
