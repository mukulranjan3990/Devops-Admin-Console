# ==============================================================================
# Tier 2: Backend Container (Java 21 LTS + Spring Boot 3.3.4 + AWS RDS Client)
# Multi-Stage Production Build with Container-Optimized JVM & Non-Root Security
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Artifact
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy Maven Project Object Model (POM) first for Docker dependency caching
COPY pom.xml .

# Download dependencies in batch mode to leverage Docker cache layers
RUN mvn dependency:go-offline -B

# Copy Java source code and configuration resources
COPY src ./src

# Compile and package executable Spring Boot fat JAR (skipping tests for speed)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production Container Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS production

# Install curl for cloud container health checks
RUN apk add --no-cache curl

# Create non-root system group and user for container security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy packaged Spring Boot JAR from build stage
COPY --from=build /app/target/three-tier-backend.jar app.jar

# Enforce ownership for non-root execution
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Standard Spring Boot port (can be overridden via SERVER_PORT or PORT env var)
ENV SERVER_PORT=8080
ENV PORT=8080
EXPOSE 8080

# Cloud container JVM flags:
# -XX:+UseContainerSupport: Detects container CPU and memory cgroups
# -XX:MaxRAMPercentage=75.0: Allocates up to 75% of container RAM to JVM heap
# -Djava.security.egd=file:/dev/./urandom: Speeds up secure random number generation
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck probe hitting Spring Boot Actuator readiness endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health/readiness || exit 1

# Execute Spring Boot application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-${SERVER_PORT:-8080}} -jar app.jar"]
