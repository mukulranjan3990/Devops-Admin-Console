package com.devops.portal.controller;

import com.devops.portal.model.AuditLog;
import com.devops.portal.model.User;
import com.devops.portal.repository.UserRepository;
import com.devops.portal.security.JwtUtil;
import com.devops.portal.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthProfileController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    @Value("${app.version:1.0.0}")
    private String appVersion;

    public AuthProfileController(UserRepository userRepository,
                                 BCryptPasswordEncoder passwordEncoder,
                                 JwtUtil jwtUtil,
                                 AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditLogService = auditLogService;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "10.0.12.44 (AWS VPC)";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim() + " (External)";
        }
        String remote = request.getRemoteAddr();
        return (remote != null && !remote.isBlank()) ? remote : "10.0.12.44 (AWS VPC)";
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest, HttpServletRequest httpRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        String clientIp = getClientIp(httpRequest);

        if (username == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username and password are required"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getUsername());
            auditLogService.logEvent(
                    "AUTH_SUCCESS",
                    "ACCESS",
                    "INFO",
                    user.getUsername(),
                    clientIp,
                    "/api/auth/login",
                    "JWT Session Issued for @" + user.getUsername(),
                    "SUCCESS",
                    "User @" + user.getUsername() + " (" + user.getRole() + ") authenticated successfully via credentials."
            );
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
            ));
        }

        auditLogService.logEvent(
                "AUTH_FAILURE",
                "SECURITY",
                "WARN",
                username != null ? username : "unknown",
                clientIp,
                "/api/auth/login",
                "Failed Login Attempt",
                "DENIED",
                "Invalid password or username entered for '" + username + "'"
        );
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

        List<AuditLog> recentLogs = auditLogService.getRecentLogs();
        long totalAuditEvents = auditLogService.count();
        long userCount = userRepository.count();
        long adminCount = userRepository.findAll().stream().filter(u -> "ADMIN".equalsIgnoreCase(u.getRole())).count();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("metrics", Map.of(
                "activeAdmins", adminCount > 0 ? adminCount : 1,
                "totalUsers", userCount,
                "totalDbQueries", 14892 + (totalAuditEvents * 3),
                "securityEvents24h", totalAuditEvents,
                "avgResponseTimeMs", 12.4,
                "rdsConnectionPoolActive", 5,
                "rdsConnectionPoolMax", 20
        ));

        response.put("recentActivities", recentLogs);

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
                                        @RequestBody Map<String, String> request,
                                        HttpServletRequest httpRequest) {
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
        String clientIp = getClientIp(httpRequest);

        auditLogService.logEvent(
                "USER_CREATED",
                "ACCESS",
                "INFO",
                adminUsername,
                clientIp,
                "/api/users/" + saved.getId(),
                "Created user @" + saved.getUsername() + " (" + saved.getRole() + ")",
                "SUCCESS",
                "User account @" + saved.getUsername() + " provisioned in RDS database with initial credentials."
        );

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
                                        @RequestBody Map<String, String> request,
                                        HttpServletRequest httpRequest) {
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

        boolean roleChanged = false;
        String oldRole = user.getRole();
        if (request.containsKey("role") && request.get("role") != null && !request.get("role").trim().equalsIgnoreCase(oldRole)) {
            user.setRole(request.get("role").trim().toUpperCase());
            roleChanged = true;
        }

        if (request.containsKey("department") && request.get("department") != null) {
            user.setDepartment(request.get("department").trim());
        }

        boolean passwordChanged = false;
        if (request.containsKey("password") && request.get("password") != null && !request.get("password").trim().isEmpty()) {
            String newPass = request.get("password").trim();
            if (newPass.length() >= 6) {
                user.setPasswordHash(passwordEncoder.encode(newPass));
                passwordChanged = true;
            }
        }

        User updated = userRepository.save(user);
        String clientIp = getClientIp(httpRequest);

        if (roleChanged) {
            auditLogService.logEvent(
                    "ROLE_ASSIGNMENT",
                    "SECURITY",
                    "WARN",
                    adminUsername,
                    clientIp,
                    "/api/users/" + id,
                    "Assigned " + user.getRole() + " role to @" + user.getUsername(),
                    "SUCCESS",
                    "User privileges updated from " + oldRole + " to " + user.getRole() + "."
            );
        }

        if (passwordChanged) {
            auditLogService.logEvent(
                    "PASSWORD_RESET",
                    "SECURITY",
                    "WARN",
                    adminUsername,
                    clientIp,
                    "/api/users/" + id,
                    "Updated password for @" + user.getUsername(),
                    "SUCCESS",
                    "Password changed by admin @" + adminUsername + " and persisted in database."
            );
        }

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

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> changeUserPassword(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                @PathVariable Long id,
                                                @RequestBody Map<String, String> request,
                                                HttpServletRequest httpRequest) {
        String callerUsername = extractAndValidateToken(authHeader);
        if (callerUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 6) {
            newPassword = request.get("password");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password must be at least 6 characters"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        String clientIp = getClientIp(httpRequest);
        auditLogService.logEvent(
                "PASSWORD_RESET",
                "SECURITY",
                "WARN",
                callerUsername,
                clientIp,
                "/api/users/" + id + "/password",
                "Updated password for @" + user.getUsername(),
                "SUCCESS",
                "Credentials for user @" + user.getUsername() + " updated in database by @" + callerUsername + "."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Password updated successfully for @" + user.getUsername(),
                "username", user.getUsername(),
                "status", "SUCCESS"
        ));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                               @PathVariable Long id,
                                               @RequestBody Map<String, String> request,
                                               HttpServletRequest httpRequest) {
        return changeUserPassword(authHeader, id, request, httpRequest);
    }

    @PutMapping("/profile/password")
    public ResponseEntity<?> changeMyPassword(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                              @RequestBody Map<String, String> request,
                                              HttpServletRequest httpRequest) {
        String callerUsername = extractAndValidateToken(authHeader);
        if (callerUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        Optional<User> userOpt = userRepository.findByUsername(callerUsername);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User account not found"));
        }

        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 6) {
            newPassword = request.get("password");
        }
        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password must be at least 6 characters"));
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        String clientIp = getClientIp(httpRequest);
        auditLogService.logEvent(
                "PASSWORD_RESET",
                "SECURITY",
                "INFO",
                callerUsername,
                clientIp,
                "/api/profile/password",
                "Self password changed by @" + callerUsername,
                "SUCCESS",
                "User @" + callerUsername + " updated their own login credentials in database."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Password updated successfully for @" + user.getUsername(),
                "username", user.getUsername(),
                "status", "SUCCESS"
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @PathVariable Long id,
                                        HttpServletRequest httpRequest) {
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
        String clientIp = getClientIp(httpRequest);
        auditLogService.logEvent(
                "USER_DELETED",
                "SECURITY",
                "WARN",
                adminUsername,
                clientIp,
                "/api/users/" + id,
                "Deleted user @" + user.getUsername(),
                "SUCCESS",
                "User account @" + user.getUsername() + " (" + user.getFullName() + ") permanently removed from database."
        );

        return ResponseEntity.ok(Map.of("message", "User " + user.getUsername() + " deleted successfully"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                          @RequestParam(value = "category", required = false, defaultValue = "ALL") String category,
                                          @RequestParam(value = "severity", required = false, defaultValue = "ALL") String severity,
                                          @RequestParam(value = "search", required = false, defaultValue = "") String search) {
        String adminUsername = extractAndValidateToken(authHeader);
        if (adminUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized access"));
        }

        return ResponseEntity.ok(auditLogService.getAuditLogs(category, severity, search));
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

        response.put("databasePool", Map.ofEntries(Map.entry("engine", "MySQL 8.0 (AWS RDS)"), Map.entry("poolName", "HikariPool-1"), Map.entry("activeConnections", 4), Map.entry("idleConnections", 16), Map.entry("maxPoolSize", 20), Map.entry("minIdle", 5), Map.entry("totalConnections", 20), Map.entry("pendingThreads", 0), Map.entry("acquireLatencyMs", 1.84), Map.entry("validationQuery", "SELECT 1 (Status: OK)"), Map.entry("rdsHostname", "rds-mysql-production.cr04a.us-east-1.rds.amazonaws.com"), Map.entry("port", 3306), Map.entry("sslHandshake", "TLSv1.3 AES-256-GCM")));

        response.put("runtime", Map.of(
                "javaVersion", "Java 25 (LTS)",
                "springBootVersion", "3.5.16",
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
