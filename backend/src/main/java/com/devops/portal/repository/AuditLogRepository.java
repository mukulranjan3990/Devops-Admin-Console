package com.devops.portal.repository;

import com.devops.portal.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findTop20ByOrderByTimestampDesc();

    List<AuditLog> findTop100ByOrderByTimestampDesc();

    List<AuditLog> findByUserOrderByTimestampDesc(String user);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:category = 'ALL' OR a.category = :category) AND " +
           "(:severity = 'ALL' OR a.severity = :severity) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(a.eventType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.user) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.resource) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.details) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.logId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> searchLogs(@Param("category") String category,
                              @Param("severity") String severity,
                              @Param("search") String search);
}
