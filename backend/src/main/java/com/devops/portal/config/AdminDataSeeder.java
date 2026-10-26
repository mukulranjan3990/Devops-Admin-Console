package com.devops.portal.config;

import com.devops.portal.model.User;
import com.devops.portal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;

@Configuration
public class AdminDataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(AdminDataSeeder.class);

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner seedDefaultAdmin(UserRepository userRepository,
                                              com.devops.portal.repository.AuditLogRepository auditLogRepository,
                                              BCryptPasswordEncoder encoder) {
        return args -> {
            if (userRepository.count() == 0) {
                logger.info("Database users table is empty. Seeding default system administrator and registered users...");

                User admin = new User(
                        "admin",
                        encoder.encode("admin@589"),
                        "System Administrator",
                        "admin@devopsportal.com",
                        "ADMIN",
                        "Cloud & DevOps Engineering"
                );

                User devops = new User(
                        "sarah.chen",
                        encoder.encode("DevOps@2026"),
                        "Sarah Chen",
                        "sarah.chen@devopsportal.com",
                        "DEVOPS_ENGINEER",
                        "Site Reliability Engineering"
                );

                User auditor = new User(
                        "marcus.v",
                        encoder.encode("Audit@2026"),
                        "Marcus Vance",
                        "marcus.v@devopsportal.com",
                        "SECURITY_AUDITOR",
                        "InfoSec & Compliance"
                );

                User viewer = new User(
                        "alex.dev",
                        encoder.encode("Viewer@2026"),
                        "Alex Rivera",
                        "alex.dev@devopsportal.com",
                        "VIEWER",
                        "Application Development"
                );

                userRepository.saveAll(List.of(admin, devops, auditor, viewer));
                logger.info("Seeded initial users successfully (total: 4).");
            } else {
                logger.info("Users table contains existing records; skipping admin data seeding.");
            }

            if (auditLogRepository.count() == 0) {
                logger.info("Audit logs table is empty. Seeding initial SOC2 compliance audit log records into RDS...");

                com.devops.portal.model.AuditLog log1 = new com.devops.portal.model.AuditLog(
                        "LOG-9081",
                        "AUTH_SUCCESS",
                        "ACCESS",
                        "INFO",
                        "admin",
                        "10.0.12.44 (AWS VPC)",
                        "/api/auth/login",
                        "JWT Bearer Token Issued (HMAC-SHA256)",
                        "SUCCESS",
                        "Authenticated via salted BCrypt password hash. Token expires in 24h."
                );

                com.devops.portal.model.AuditLog log2 = new com.devops.portal.model.AuditLog(
                        "LOG-9080",
                        "ROLE_ASSIGNMENT",
                        "SECURITY",
                        "WARN",
                        "admin",
                        "10.0.12.44 (AWS VPC)",
                        "/api/users/2",
                        "Assigned ADMIN role to sarah.chen",
                        "SUCCESS",
                        "User privileges elevated to Administrator. Department: Infrastructure Architecture."
                );

                com.devops.portal.model.AuditLog log3 = new com.devops.portal.model.AuditLog(
                        "LOG-9079",
                        "RATE_LIMIT_TRIGGERED",
                        "SECURITY",
                        "CRITICAL",
                        "unknown",
                        "198.51.100.82 (External)",
                        "/api/auth/login",
                        "Brute-force Throttling Engaged",
                        "BLOCKED",
                        "5 consecutive failed credentials. Client IP quarantined for 15s cooldown."
                );

                com.devops.portal.model.AuditLog log4 = new com.devops.portal.model.AuditLog(
                        "LOG-9078",
                        "ALB_HEALTH_PROBE",
                        "SYSTEM",
                        "INFO",
                        "aws-alb-target-group",
                        "172.31.2.10 (Internal)",
                        "/actuator/health/readiness",
                        "Spring Boot Actuator Readiness Polled",
                        "HEALTHY",
                        "Probes UP. HikariCP database pool responsive, disk space validation OK."
                );

                com.devops.portal.model.AuditLog log5 = new com.devops.portal.model.AuditLog(
                        "LOG-9077",
                        "DB_CONNECTION_LEASE",
                        "RDS",
                        "INFO",
                        "sarah.chen",
                        "10.0.8.21 (AWS VPC)",
                        "AWS RDS MySQL 8.0",
                        "HikariCP Connection Pool Leased",
                        "SUCCESS",
                        "Acquired connection pool lease #4. Query: UserRepository.findAll() executed in 3.2ms."
                );

                com.devops.portal.model.AuditLog log6 = new com.devops.portal.model.AuditLog(
                        "LOG-9076",
                        "PASSWORD_RECOVERY_TRIGGERED",
                        "ACCESS",
                        "WARN",
                        "admin@devopsportal.com",
                        "10.0.12.44 (AWS VPC)",
                        "/api/auth/forgot-password",
                        "One-Time Password Reset Link Queued",
                        "QUEUED",
                        "Simulated SMTP dispatch token rst_9f8b2c4e1a0d generated. Expires in 15m."
                );

                com.devops.portal.model.AuditLog log7 = new com.devops.portal.model.AuditLog(
                        "LOG-9075",
                        "UNAUTHORIZED_ACCESS_ATTEMPT",
                        "SECURITY",
                        "CRITICAL",
                        "anonymous",
                        "203.0.113.195 (External)",
                        "/api/profile",
                        "Bearer Token Missing or Invalid",
                        "DENIED",
                        "Request rejected with HTTP 401 Unauthorized. Null Authorization header."
                );

                com.devops.portal.model.AuditLog log8 = new com.devops.portal.model.AuditLog(
                        "LOG-9074",
                        "SYSTEM_STARTUP",
                        "SYSTEM",
                        "INFO",
                        "system-daemon",
                        "localhost (127.0.0.1)",
                        "Java 25 Spring Boot 3.5.16",
                        "Application Server Initialized",
                        "READY",
                        "Port 8080 listening. Graceful shutdown timeout configured to 20s."
                );

                auditLogRepository.saveAll(List.of(log1, log2, log3, log4, log5, log6, log7, log8));
                logger.info("Seeded initial compliance audit logs successfully (total: 8).");
            }
        };
    }
}
