package com.ab.sutra.repository;

import com.ab.sutra.domain.BroadcastTickerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BroadcastTickerConfigRepository extends JpaRepository<BroadcastTickerConfig, UUID> {
}
