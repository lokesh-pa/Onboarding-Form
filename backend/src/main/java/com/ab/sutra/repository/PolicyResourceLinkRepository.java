package com.ab.sutra.repository;

import com.ab.sutra.domain.PolicyResourceLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyResourceLinkRepository extends JpaRepository<PolicyResourceLink, UUID> {
    List<PolicyResourceLink> findByCategory(PolicyResourceLink.Category category);
}
