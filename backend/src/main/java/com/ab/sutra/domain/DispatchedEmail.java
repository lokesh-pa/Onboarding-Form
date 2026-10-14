package com.ab.sutra.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dispatched_emails", indexes = {
    @Index(name = "idx_email_req_id", columnList = "request_id"),
    @Index(name = "idx_email_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchedEmail implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "reference_code", length = 50)
    private String referenceCode;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "from_email", nullable = false, length = 150)
    private String from;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "to_list", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> toList = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cc_list", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> ccList = new ArrayList<>();

    @Column(name = "subject", nullable = false, length = 300)
    private String subject;

    @Column(name = "body_type", nullable = false, length = 100)
    private String bodyType;

    @Column(name = "actionable_link_url", length = 500)
    private String actionableLinkUrl;

    @Column(name = "actionable_link_label", length = 100)
    private String actionableLinkLabel;

    @Column(name = "attachment_name", length = 200)
    private String attachmentName;

    @Column(name = "rendered_body_html", columnDefinition = "text")
    private String renderedBodyHtml;
}
