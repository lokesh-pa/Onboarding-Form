package com.ab.sutra.repository;

import com.ab.sutra.domain.DispatchedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchedEmailRepository extends JpaRepository<DispatchedEmail, UUID> {
    List<DispatchedEmail> findByRequestIdOrderByTimestampDesc(UUID requestId);
    List<DispatchedEmail> findByReferenceCodeOrderByTimestampDesc(String referenceCode);
}
