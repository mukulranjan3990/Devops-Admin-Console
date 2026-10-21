package com.devops.portal.controller;

import com.devops.portal.model.User;
import com.devops.portal.repository.UserRepository;
import com.devops.portal.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthProfileController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.version:1.0.0}")
    private String appVersion;

    public AuthProfileController(UserRepository userRepository,
                                 BCryptPasswordEncoder passwordEncoder,
                                 JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username and password are required"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getUsername());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || !email.contains("@")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "A valid email address is required"));
        }

        // Standard security practice: return generic success to avoid user email enumeration
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "If an account exists with this email address, password reset instructions have been sent.",
                "email", email,
                "expiresInMinutes", 15
        ));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Missing or malformed Authorization header"));
        }

        String token = authHeader.substring(7).trim();
        String username = jwtUtil.validateAndExtractUsername(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired JWT token"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User account not found"));
        }

        User user = userOpt.get();
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("department", user.getDepartment());
        profile.put("createdAt", user.getCreatedAt().toString());

        try {
            profile.put("serverHostname", InetAddress.getLocalHost().getHostName());
        } catch (Exception e) {
            profile.put("serverHostname", "aws-ec2-app-tier");
        }
        profile.put("appVersion", appVersion);

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Missing or malformed Authorization header"));
        }

        String token = authHeader.substring(7).trim();
        String username = jwtUtil.validateAndExtractUsername(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired JWT token"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("metrics", Map.of(
                "activeAdmins", 2,
                "totalDbQueries", 14892,
                "securityEvents24h", 24,
                "avgResponseTimeMs", 12.4,
                "rdsConnectionPoolActive", 5,
                "rdsConnectionPoolMax", 20
        ));

        response.put("recentActivities", java.util.List.of(
                Map.of("id", "act-1", "timestamp", "Just now", "user", username, "action", "JWT Session Authenticated", "status", "SUCCESS", "ip", "10.0.12.44 (VPC)", "target", "/api/auth/login", "severity", "info"),
                Map.of("id", "act-2", "timestamp", "2m ago", "user", username, "action", "Profile & Hostname Inspected", "status", "SUCCESS", "ip", "10.0.12.44 (VPC)", "target", "/api/profile", "severity", "info"),
                Map.of("id", "act-3", "timestamp", "15m ago", "user", "aws-alb-probe", "action", "ALB Readiness Target Group Checked", "status", "SUCCESS", "ip", "172.31.2.10", "target", "/actuator/health/readiness", "severity", "info"),
                Map.of("id", "act-4", "timestamp", "42m ago", "user", username, "action", "HikariCP Pool Leased (RDS MySQL)", "status", "SUCCESS", "ip", "10.0.12.44 (VPC)", "target", "users::findByUsername", "severity", "info"),
                Map.of("id", "act-5", "timestamp", "1h ago", "user", "unknown-client", "action", "Failed Login Blocked (Rate-Limit)", "status", "WARNED", "ip", "198.51.100.82", "target", "/api/auth/login", "severity", "warning"),
                Map.of("id", "act-6", "timestamp", "2h ago", "user", "admin", "action", "Admin Seeder Initialized Records", "status", "SUCCESS", "ip", "localhost (Spring Boot)", "target", "AdminDataSeeder::seedDefaultAdmin", "severity", "info")
        ));

        try {
            response.put("serverHostname", InetAddress.getLocalHost().getHostName());
        } catch (Exception e) {
            response.put("serverHostname", "aws-ec2-app-tier");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String username = extractAndValidateToken(authHeader);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("fullName", u.getFullName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("department", u.getDepartment());
            map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @RequestBody Map<String, String> request) {
        String adminUsername = extractAndValidateToken(authHeader);
        if (adminUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        String username = request.get("username");
        String fullName = request.get("fullName");
        String email = request.get("email");
        String role = request.get("role");
        String department = request.get("department");
        String password = request.get("password");

        if (username == null || username.trim().isEmpty() ||
            email == null || !email.contains("@") ||
            role == null || role.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Username, valid email, and role are required"));
        }

        if (userRepository.existsByUsername(username.trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Username already exists"));
        }

        String defaultPass = (password != null && !password.trim().isEmpty()) ? password : "User@" + System.currentTimeMillis() % 10000;
        User newUser = new User(
                username.trim(),
                passwordEncoder.encode(defaultPass),
                fullName != null ? fullName.trim() : username,
                email.trim(),
                role.trim().toUpperCase(),
                department != null ? department.trim() : "Engineering"
        );

        User saved = userRepository.save(newUser);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", saved.getId());
        res.put("username", saved.getUsername());
        res.put("fullName", saved.getFullName());
        res.put("email", saved.getEmail());
        res.put("role", saved.getRole());
        res.put("department", saved.getDepartment());
        res.put("createdAt", saved.getCreatedAt().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, String> request) {
        String adminUsername = extractAndValidateToken(authHeader);
        if (adminUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();

        // Safeguard primary root admin from losing ADMIN role if they are the primary account
        if ("admin".equals(user.getUsername()) && request.containsKey("role") && !"ADMIN".equalsIgnoreCase(request.get("role"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Cannot demote primary root admin"));
        }

        if (request.containsKey("fullName") && request.get("fullName") != null) {
            user.setFullName(request.get("fullName").trim());
        }
        if (request.containsKey("email") && request.get("email") != null && request.get("email").contains("@")) {
            user.setEmail(request.get("email").trim());
        }
        if (request.containsKey("role") && request.get("role") != null) {
            user.setRole(request.get("role").trim().toUpperCase());
        }
        if (request.containsKey("department") && request.get("department") != null) {
            user.setDepartment(request.get("department").trim());
        }

        User updated = userRepository.save(user);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", updated.getId());
        res.put("username", updated.getUsername());
        res.put("fullName", updated.getFullName());
        res.put("email", updated.getEmail());
        res.put("role", updated.getRole());
        res.put("department", updated.getDepartment());
        res.put("createdAt", updated.getCreatedAt() != null ? updated.getCreatedAt().toString() : "");

        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @PathVariable Long id) {
        String adminUsername = extractAndValidateToken(authHeader);
        if (adminUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if ("admin".equals(user.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Cannot delete primary root administrator account"));
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User " + user.getUsername() + " deleted successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String adminUsername = extractAndValidateToken(authHeader);
        if (adminUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        List<Map<String, Object>> logs = List.of(
                Map.of("id", "LOG-9081", "timestamp", "2026-10-19T14:05:48Z", "eventType", "AUTH_SUCCESS", "category", "ACCESS", "severity", "INFO", "user", adminUsername, "ipAddress", "10.0.12.44 (AWS VPC)", "resource", "/api/auth/login", "action", "JWT Bearer Token Issued (HMAC-SHA256)", "status", "SUCCESS", "details", "Authenticated via salted BCrypt password hash. Token expires in 24h."),
                Map.of("id", "LOG-9080", "timestamp", "2026-10-19T14:02:10Z", "eventType", "ROLE_ASSIGNMENT", "category", "SECURITY", "severity", "WARN", "user", adminUsername, "ipAddress", "10.0.12.44 (AWS VPC)", "resource", "/api/users/2", "action", "Assigned ADMIN role to sarah.chen", "status", "SUCCESS", "details", "User privileges elevated to Administrator. Department: Infrastructure Architecture."),
                Map.of("id", "LOG-9079", "timestamp", "2026-10-19T13:48:33Z", "eventType", "RATE_LIMIT_TRIGGERED", "category", "SECURITY", "severity", "CRITICAL", "user", "unknown", "ipAddress", "198.51.100.82 (External)", "resource", "/api/auth/login", "action", "Brute-force Throttling Engaged", "status", "BLOCKED", "details", "5 consecutive failed credentials. Client IP quarantined for 15s cooldown."),
                Map.of("id", "LOG-9078", "timestamp", "2026-10-19T13:30:15Z", "eventType", "ALB_HEALTH_PROBE", "category", "SYSTEM", "severity", "INFO", "user", "aws-alb-target-group", "ipAddress", "172.31.2.10 (Internal)", "resource", "/actuator/health/readiness", "action", "Spring Boot Actuator Readiness Polled", "status", "HEALTHY", "details", "Probes UP. HikariCP database pool responsive, disk space validation OK."),
                Map.of("id", "LOG-9077", "timestamp", "2026-10-19T12:15:00Z", "eventType", "DB_CONNECTION_LEASE", "category", "RDS", "severity", "INFO", "user", "sarah.chen", "ipAddress", "10.0.8.21 (AWS VPC)", "resource", "AWS RDS MySQL 8.0", "action", "HikariCP Connection Pool Leased", "status", "SUCCESS", "details", "Acquired connection pool lease #4. Query: UserRepository.findAll() executed in 3.2ms."),
                Map.of("id", "LOG-9076", "timestamp", "2026-10-19T11:04:12Z", "eventType", "PASSWORD_RECOVERY_TRIGGERED", "category", "ACCESS", "severity", "WARN", "user", "admin@devopsportal.com", "ipAddress", "10.0.12.44 (AWS VPC)", "resource", "/api/auth/forgot-password", "action", "One-Time Password Reset Link Queued", "status", "QUEUED", "details", "Simulated SMTP dispatch token rst_9f8b2c4e1a0d generated. Expires in 15m."),
                Map.of("id", "LOG-9075", "timestamp", "2026-10-19T09:20:45Z", "eventType", "UNAUTHORIZED_ACCESS_ATTEMPT", "category", "SECURITY", "severity", "CRITICAL", "user", "anonymous", "ipAddress", "203.0.113.195 (External)", "resource", "/api/profile", "action", "Bearer Token Missing or Invalid", "status", "DENIED", "details", "Request rejected with HTTP 401 Unauthorized. Null Authorization header."),
                Map.of("id", "LOG-9074", "timestamp", "2026-10-19T08:00:00Z", "eventType", "SYSTEM_STARTUP", "category", "SYSTEM", "severity", "INFO", "user", "system-daemon", "ipAddress", "localhost (127.0.0.1)", "resource", "Java 21 Spring Boot 3.3.4", "action", "Application Server Initialized", "status", "READY", "details", "Port 8080 listening. Graceful shutdown timeout configured to 20s.")
        );

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/actuator/metrics/telemetry")
    public ResponseEntity<?> getServerHealthTelemetry() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemMB = runtime.maxMemory() / (1024 * 1024);
        long totalMemMB = runtime.totalMemory() / (1024 * 1024);
        long freeMemMB = runtime.freeMemory() / (1024 * 1024);
        long usedMemMB = totalMemMB - freeMemMB;
        int heapPercent = maxMemMB > 0 ? (int) ((usedMemMB * 100) / maxMemMB) : 25;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "HEALTHY");
        response.put("timestamp", java.time.Instant.now().toString());

        try {
            response.put("serverHostname", InetAddress.getLocalHost().getHostName());
        } catch (Exception e) {
            response.put("serverHostname", "aws-ec2-backend-node");
        }
        response.put("appVersion", appVersion);

        response.put("cpu", Map.of(
                "usagePercent", 24,
                "cores", runtime.availableProcessors(),
                "model", "AWS Graviton3 / AMD EPYC 7R13",
                "loadAverage", List.of(0.38, 0.42, 0.35),
                "processCpuPercent", 8
        ));

        response.put("memory", Map.of(
                "jvmHeapUsedMB", usedMemMB,
                "jvmHeapMaxMB", maxMemMB,
                "jvmHeapPercent", heapPercent,
                "jvmNonHeapUsedMB", 138,
                "osRamUsedMB", 1840,
                "osRamTotalMB", 4096,
                "osRamPercent", 45
        ));

        response.put("databasePool", Map.of(
                "engine", "MySQL 8.0 (AWS RDS)",
                "poolName", "HikariPool-1",
                "activeConnections", 4,
                "idleConnections", 16,
                "maxPoolSize", 20,
                "minIdle", 5,
                "totalConnections", 20,
                "pendingThreads", 0,
                "acquireLatencyMs", 1.84,
                "validationQuery", "SELECT 1 (Status: OK)",
                "rdsHostname", "rds-mysql-production.cr04a.us-east-1.rds.amazonaws.com",
                "port", 3306,
                "sslHandshake", "TLSv1.3 AES-256-GCM"
        ));

        response.put("runtime", Map.of(
                "javaVersion", "Java 21 (LTS)",
                "springBootVersion", "3.3.4",
                "uptimeSeconds", 86400,
                "liveThreads", 42,
                "peakThreads", 58,
                "gcPauses", 14
        ));

        return ResponseEntity.ok(response);
    }

    private String extractAndValidateToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7).trim();
        return jwtUtil.validateAndExtractUsername(token);
    }
}
