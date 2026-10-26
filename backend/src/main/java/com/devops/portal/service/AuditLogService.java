package com.devops.portal.service;

import com.devops.portal.model.AuditLog;
import com.devops.portal.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records an audit log event directly to the RDS audit_logs table.
     */
    @Transactional
    public AuditLog logEvent(String eventType, String category, String severity,
                             String user, String ipAddress, String resource,
                             String action, String status, String details) {
        String logId = "LOG-" + (1000 + (int)(Math.random() * 9000));
        AuditLog auditLog = new AuditLog(logId, eventType, category, severity, user, ipAddress, resource, action, status, details);
        try {
            AuditLog saved = auditLogRepository.save(auditLog);
            logger.info("AUDIT LOG PERSISTED [{}]: {} by User '{}' on '{}' -> Status: {}",
                    saved.getLogId(), eventType, user, resource, status);
            return saved;
        } catch (Exception e) {
            logger.error("Failed to persist audit log into RDS database: {}", e.getMessage(), e);
            return auditLog;
        }
    }

    /**
     * Query all audit logs with optional category, severity, and search term filters.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(String category, String severity, String search) {
        String safeCategory = (category != null && !category.isBlank()) ? category.trim().toUpperCase() : "ALL";
        String safeSeverity = (severity != null && !severity.isBlank()) ? severity.trim().toUpperCase() : "ALL";
        String safeSearch = (search != null) ? search.trim() : "";
        return auditLogRepository.searchLogs(safeCategory, safeSeverity, safeSearch);
    }

    /**
     * Retrieves the most recent audit logs for dashboard telemetry.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop20ByOrderByTimestampDesc();
    }

    /**
     * Retrieves personal activity logs for a given user.
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getUserLogs(String username) {
        return auditLogRepository.findByUserOrderByTimestampDesc(username);
    }

    /**
     * Total count of audit log events recorded in the database.
     */
    @Transactional(readOnly = true)
    public long count() {
        return auditLogRepository.count();
    }
}
