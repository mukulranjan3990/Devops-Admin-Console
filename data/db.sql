SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET AUTOCOMMIT = 0;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id_auto` INT AUTO_INCREMENT PRIMARY KEY,
    `createdAt` LONGTEXT NULL,
    `department` LONGTEXT NULL,
    `email` LONGTEXT NULL,
    `fullName` LONGTEXT NULL,
    `id` LONGTEXT NULL,
    `password` LONGTEXT NULL,
    `passwordHash` LONGTEXT NULL,
    `role` LONGTEXT NULL,
    `username` LONGTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `users` (`createdAt`, `department`, `email`, `fullName`, `id`, `password`, `passwordHash`, `role`, `username`) VALUES ('2026-03-01T08:00:00Z', 'Cloud & DevOps Engineering', 'admin@devopsportal.com', 'System Administrator', 1, 'admin@589', '$2a$10$wT0o3q6PqKqgDkZ8b8vNleG2j5KkUfR8eL9bQz8vC2j5KkUfR8eL9', 'ADMIN', 'admin');
INSERT INTO `users` (`createdAt`, `department`, `email`, `fullName`, `id`, `password`, `passwordHash`, `role`, `username`) VALUES ('2026-03-02T09:30:00Z', 'Site Reliability Engineering', 'sarah.chen@devopsportal.com', 'Sarah Chen', 2, 'NewSecurePass@2026', '$2a$10$wT0o3q6PqKqgDkZ8b8vNleG2j5KkUfR8eL9bQz8vC2j5KkUfR8eL9', 'DEVOPS_ENGINEER', 'sarah.chen');
INSERT INTO `users` (`createdAt`, `department`, `email`, `fullName`, `id`, `password`, `passwordHash`, `role`, `username`) VALUES ('2026-03-05T14:15:00Z', 'InfoSec & Compliance', 'marcus.v@devopsportal.com', 'Marcus Vance', 3, 'Audit@2026', '$2a$10$wT0o3q6PqKqgDkZ8b8vNleG2j5KkUfR8eL9bQz8vC2j5KkUfR8eL9', 'SECURITY_AUDITOR', 'marcus.v');
INSERT INTO `users` (`createdAt`, `department`, `email`, `fullName`, `id`, `password`, `passwordHash`, `role`, `username`) VALUES ('2026-03-10T11:00:00Z', 'Application Development', 'alex.dev@devopsportal.com', 'Alex Rivera', 4, 'Viewer@2026', '$2a$10$wT0o3q6PqKqgDkZ8b8vNleG2j5KkUfR8eL9bQz8vC2j5KkUfR8eL9', 'VIEWER', 'alex.dev');
COMMIT;

DROP TABLE IF EXISTS `auditLogs`;
CREATE TABLE `auditLogs` (
    `id_auto` INT AUTO_INCREMENT PRIMARY KEY,
    `action` LONGTEXT NULL,
    `category` LONGTEXT NULL,
    `details` LONGTEXT NULL,
    `eventType` LONGTEXT NULL,
    `id` LONGTEXT NULL,
    `ipAddress` LONGTEXT NULL,
    `resource` LONGTEXT NULL,
    `severity` LONGTEXT NULL,
    `status` LONGTEXT NULL,
    `timestamp` LONGTEXT NULL,
    `user` LONGTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @admin', 'ACCESS', 'User @admin (ADMIN) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-5765', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-23T11:03:25.765Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Deleted user @john.tester', 'SECURITY', 'User account @john.tester (John Tester) permanently removed from database.', 'USER_DELETED', 'LOG-7930', '10.0.12.44 (VPC)', '/api/users/5', 'WARN', 'SUCCESS', '2026-10-21T13:22:37.930Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @john.tester', 'ACCESS', 'User @john.tester (USER) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-7926', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:22:37.926Z', 'john.tester');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Created user @john.tester (USER)', 'ACCESS', 'User account @john.tester provisioned in RDS database with initial password.', 'USER_CREATED', 'LOG-7923', '10.0.12.44 (VPC)', '/api/users/5', 'INFO', 'SUCCESS', '2026-10-21T13:22:37.923Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @alex.dev', 'ACCESS', 'User @alex.dev (VIEWER) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-7905', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:22:37.905Z', 'alex.dev');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @admin', 'ACCESS', 'User @admin (ADMIN) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-7878', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:22:37.878Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @alex.dev', 'ACCESS', 'User @alex.dev (VIEWER) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-6127', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:22:06.127Z', 'alex.dev');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @admin', 'ACCESS', 'User @admin (ADMIN) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-6099', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:22:06.099Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @sarah.chen', 'ACCESS', 'User @sarah.chen (DEVOPS_ENGINEER) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-0876', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:00:40.876Z', 'sarah.chen');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Failed Login Attempt', 'SECURITY', 'Invalid password or username entered for ''sarah.chen''', 'AUTH_FAILURE', 'LOG-0862', '10.0.12.44 (VPC)', '/api/auth/login', 'WARN', 'DENIED', '2026-10-21T13:00:40.862Z', 'sarah.chen');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Reset password for @sarah.chen', 'SECURITY', 'Admin @admin updated credentials for user @sarah.chen.', 'PASSWORD_RESET', 'LOG-0845', '10.0.12.44 (VPC)', '/api/users/2', 'WARN', 'SUCCESS', '2026-10-21T13:00:40.845Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @admin', 'ACCESS', 'User @admin (ADMIN) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-0830', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:00:40.830Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Failed Login Attempt', 'SECURITY', 'Invalid password or username entered for ''jdoe''', 'AUTH_FAILURE', 'LOG-9513', '10.0.12.44 (VPC)', '/api/auth/login', 'WARN', 'DENIED', '2026-10-21T13:00:29.513Z', 'jdoe');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Deleted user @jdoe', 'SECURITY', 'User account @jdoe (John Doe) permanently removed from database.', 'USER_DELETED', 'LOG-9494', '10.0.12.44 (VPC)', '/api/users/5', 'WARN', 'SUCCESS', '2026-10-21T13:00:29.494Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @jdoe', 'ACCESS', 'User @jdoe (DEVOPS_ENGINEER) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-9473', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:00:29.473Z', 'jdoe');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Failed Login Attempt', 'SECURITY', 'Invalid password or username entered for ''jdoe''', 'AUTH_FAILURE', 'LOG-9459', '10.0.12.44 (VPC)', '/api/auth/login', 'WARN', 'DENIED', '2026-10-21T13:00:29.459Z', 'jdoe');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Created user @jdoe (DEVOPS_ENGINEER)', 'ACCESS', 'User account @jdoe provisioned in RDS database with initial password.', 'USER_CREATED', 'LOG-9446', '10.0.12.44 (VPC)', '/api/users/5', 'INFO', 'SUCCESS', '2026-10-21T13:00:29.446Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Session Issued for @admin', 'ACCESS', 'User @admin (ADMIN) authenticated successfully via manual credentials.', 'AUTH_SUCCESS', 'LOG-9426', '10.0.12.44 (VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-21T13:00:29.426Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Failed Login Attempt', 'SECURITY', 'Invalid password or username entered for ''admin''', 'AUTH_FAILURE', 'LOG-9410', '10.0.12.44 (VPC)', '/api/auth/login', 'WARN', 'DENIED', '2026-10-21T13:00:29.410Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('JWT Bearer Token Issued (HMAC-SHA256)', 'ACCESS', 'Authenticated via salted BCrypt password hash. Token expires in 24h.', 'AUTH_SUCCESS', 'LOG-9081', '10.0.12.44 (AWS VPC)', '/api/auth/login', 'INFO', 'SUCCESS', '2026-10-19T14:05:48Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Assigned ADMIN role to sarah.chen', 'SECURITY', 'User privileges elevated to Administrator. Department: Infrastructure Architecture.', 'ROLE_ASSIGNMENT', 'LOG-9080', '10.0.12.44 (AWS VPC)', '/api/users/2', 'WARN', 'SUCCESS', '2026-10-19T14:02:10Z', 'admin');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Brute-force Throttling Engaged', 'SECURITY', '5 consecutive failed credentials. Client IP quarantined for 15s cooldown.', 'RATE_LIMIT_TRIGGERED', 'LOG-9079', '198.51.100.82 (External)', '/api/auth/login', 'CRITICAL', 'BLOCKED', '2026-10-19T13:48:33Z', 'unknown');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Spring Boot Actuator Readiness Polled', 'SYSTEM', 'Probes UP. HikariCP database pool responsive, disk space validation OK.', 'ALB_HEALTH_PROBE', 'LOG-9078', '172.31.2.10 (Internal)', '/actuator/health/readiness', 'INFO', 'HEALTHY', '2026-10-19T13:30:15Z', 'aws-alb-target-group');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('HikariCP Connection Pool Leased', 'RDS', 'Acquired connection pool lease #4. Query: UserRepository.findAll() executed in 3.2ms.', 'DB_CONNECTION_LEASE', 'LOG-9077', '10.0.8.21 (AWS VPC)', 'AWS RDS MySQL 8.0', 'INFO', 'SUCCESS', '2026-10-19T12:15:00Z', 'sarah.chen');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('One-Time Password Reset Link Queued', 'ACCESS', 'Simulated SMTP dispatch token rst_9f8b2c4e1a0d generated. Expires in 15m.', 'PASSWORD_RECOVERY_TRIGGERED', 'LOG-9076', '10.0.12.44 (AWS VPC)', '/api/auth/forgot-password', 'WARN', 'QUEUED', '2026-10-19T11:04:12Z', 'admin@devopsportal.com');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Bearer Token Missing or Invalid', 'SECURITY', 'Request rejected with HTTP 401 Unauthorized. Null Authorization header.', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'LOG-9075', '203.0.113.195 (External)', '/api/profile', 'CRITICAL', 'DENIED', '2026-10-19T09:20:45Z', 'anonymous');
INSERT INTO `auditLogs` (`action`, `category`, `details`, `eventType`, `id`, `ipAddress`, `resource`, `severity`, `status`, `timestamp`, `user`) VALUES ('Application Server Initialized', 'SYSTEM', 'Port 8080 listening. Graceful shutdown timeout configured to 20s.', 'SYSTEM_STARTUP', 'LOG-9074', 'localhost (127.0.0.1)', 'Java 25 Spring Boot 3.5.16', 'INFO', 'READY', '2026-10-19T08:00:00Z', 'system-daemon');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;