package com.devops.portal.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_logs_category", columnList = "category"),
    @Index(name = "idx_audit_logs_event_type", columnList = "event_type"),
    @Index(name = "idx_audit_logs_user", columnList = "username"),
    @Index(name = "idx_audit_logs_severity", columnList = "severity")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "log_id", length = 50, unique = true)
    private String logId;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(name = "username", nullable = false, length = 80)
    private String user;

    @Column(name = "ip_address", length = 80)
    private String ipAddress;

    @Column(length = 200)
    private String resource;

    @Column(length = 255)
    private String action;

    @Column(length = 40)
    private String status;

    @Column(length = 2000)
    private String details;

    public AuditLog() {}

    public AuditLog(String logId, String eventType, String category, String severity,
                    String user, String ipAddress, String resource, String action,
                    String status, String details) {
        this.logId = logId != null ? logId : "LOG-" + System.currentTimeMillis() % 10000;
        this.timestamp = LocalDateTime.now();
        this.eventType = eventType;
        this.category = category;
        this.severity = severity;
        this.user = user;
        this.ipAddress = ipAddress;
        this.resource = resource;
        this.action = action;
        this.status = status;
        this.details = details;
    }

    public AuditLog(String logId, LocalDateTime timestamp, String eventType, String category,
                    String severity, String user, String ipAddress, String resource,
                    String action, String status, String details) {
        this.logId = logId;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.eventType = eventType;
        this.category = category;
        this.severity = severity;
        this.user = user;
        this.ipAddress = ipAddress;
        this.resource = resource;
        this.action = action;
        this.status = status;
        this.details = details;
    }

    @JsonProperty("id")
    public String getDisplayId() {
        return (logId != null && !logId.isBlank()) ? logId : ("LOG-" + (id != null ? id : "0"));
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLogId() {
        return logId;
    }

    public void setLogId(String logId) {
        this.logId = logId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
