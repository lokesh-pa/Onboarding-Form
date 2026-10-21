package com.ab.sutra.repository;

import com.ab.sutra.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByRequestIdOrderByTimestampDesc(UUID requestId);
    List<AuditLog> findByReferenceCodeOrderByTimestampDesc(String referenceCode);
}
