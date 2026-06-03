# ============================================================
# Spring Boot Backend — Render Dockerfile
# ============================================================
# Multi-stage build: Maven build → slim JRE runtime image
# Java 17, Spring Boot 4, packaged as executable JAR
# ============================================================

# ── Stage 1: Build the JAR ──────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw mvnw

# Pre-download all Maven dependencies (cached layer)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source and build
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Runtime image ───────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy only the built JAR
COPY --from=builder /app/target/*.jar app.jar

# Set ownership
RUN chown appuser:appgroup app.jar

USER appuser

# Render sets PORT automatically; Spring Boot reads it via server.port=${PORT:8080}
EXPOSE 8080

# JVM tuning for container environment (limits memory to container ceiling)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
