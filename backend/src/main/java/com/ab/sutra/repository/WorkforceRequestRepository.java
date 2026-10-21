package com.ab.sutra.repository;

import com.ab.sutra.domain.RequestStatus;
import com.ab.sutra.domain.RequestType;
import com.ab.sutra.domain.WorkforceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkforceRequestRepository extends JpaRepository<WorkforceRequest, UUID> {

    Optional<WorkforceRequest> findByReferenceCode(String referenceCode);

    List<WorkforceRequest> findByType(RequestType type);

    List<WorkforceRequest> findByStatus(RequestStatus status);

    List<WorkforceRequest> findByTypeAndStatus(RequestType type, RequestStatus status);

    @Query("SELECT r FROM WorkforceRequest r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(r.candidateName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.referenceCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(r.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " (r.workdayId IS NOT NULL AND LOWER(r.workdayId) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY r.createdAt DESC")
    List<WorkforceRequest> searchRequests(@Param("type") RequestType type,
                                         @Param("status") RequestStatus status,
                                         @Param("query") String query);

    @Query("SELECT r FROM WorkforceRequest r WHERE " +
           "r.details.abManagerNameOrEmail = :managerEmail OR " +
           "r.offboarding.abSponsorEmail = :managerEmail OR " +
           "r.delegatedToEmail = :managerEmail " +
           "ORDER BY r.createdAt DESC")
    List<WorkforceRequest> findByManagerOrDelegatee(@Param("managerEmail") String managerEmail);
}
