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
        };
    }
}
