package com.ab.sutra.repository;

import com.ab.sutra.domain.LongTermDelegation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LongTermDelegationRepository extends JpaRepository<LongTermDelegation, UUID> {

    Optional<LongTermDelegation> findByManagerEmailAndEnabledTrue(String managerEmail);

    List<LongTermDelegation> findByManagerEmail(String managerEmail);

    @Query("SELECT d FROM LongTermDelegation d WHERE " +
           "d.enabled = true AND " +
           "d.managerEmail = :managerEmail AND " +
           ":currentDate BETWEEN d.startDate AND d.endDate")
    Optional<LongTermDelegation> findActiveDelegationForManager(@Param("managerEmail") String managerEmail,
                                                                @Param("currentDate") LocalDate currentDate);

    @Query("SELECT d FROM LongTermDelegation d WHERE " +
           "d.enabled = true AND " +
           "d.delegateeEmail = :delegateeEmail AND " +
           ":currentDate BETWEEN d.startDate AND d.endDate")
    List<LongTermDelegation> findActiveDelegationsForDelegatee(@Param("delegateeEmail") String delegateeEmail,
                                                              @Param("currentDate") LocalDate currentDate);
}
