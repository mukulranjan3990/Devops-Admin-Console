package com.devops.portal;

import com.devops.portal.model.User;
import com.devops.portal.repository.UserRepository;
import com.devops.portal.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PortalBackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin@589"),
                    "System Administrator",
                    "admin@devopsportal.com",
                    "ADMIN",
                    "Cloud & DevOps Engineering"
            );
            userRepository.save(admin);
        }
    }

    @Test
    @DisplayName("Context loads and seeded admin exists")
    void contextLoads() {
        assert userRepository.findByUsername("admin").isPresent();
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 with JWT for valid credentials")
    void loginSuccess() throws Exception {
        String jsonPayload = """
                {
                    "username": "admin",
                    "password": "admin@589"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 for incorrect password")
    void loginFailureInvalidPassword() throws Exception {
        String jsonPayload = """
                {
                    "username": "admin",
                    "password": "wrongpassword"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @DisplayName("GET /api/profile returns 200 with admin profile when Bearer token is provided")
    void profileSuccessWithToken() throws Exception {
        String token = jwtUtil.generateToken("admin");

        mockMvc.perform(get("/api/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.email").value("admin@devopsportal.com"))
                .andExpect(jsonPath("$.department").value("Cloud & DevOps Engineering"))
                .andExpect(jsonPath("$.serverHostname").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/profile returns 401 when Authorization header is absent")
    void profileUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }
}
