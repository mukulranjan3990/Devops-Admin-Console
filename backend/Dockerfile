# ==============================================================================
# Tier 2: Backend Container (Java 25 LTS + Spring Boot 3.5)
# ==============================================================================

# Stage 1: Build & Package Artifact
FROM maven:3.9.11-eclipse-temurin-25-alpine AS build

WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy Java source code
COPY src ./src

# Compile executable Spring Boot JAR
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production Container Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:25-jre-alpine AS production

# Install curl for AWS ECS Health Checks
RUN apk add --no-cache curl

# Security Hardening: Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy packaged Spring Boot JAR using wildcard
COPY --from=build /app/target/*.jar app.jar

# Enforce ownership for non-root execution
RUN chown -R appuser:appgroup /app

USER appuser

ENV SERVER_PORT=8080
ENV PORT=8080
EXPOSE 8080

# Cloud JVM settings for AWS ECS cgroups
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck probe pointing to Spring Boot Actuator
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-${SERVER_PORT:-8080}} -jar app.jar"]