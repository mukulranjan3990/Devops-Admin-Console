# ==============================================================================
# Tier 1: Frontend Container (React + Vite + Nginx)
# Multi-Stage Build with Dynamic Environment Injection & Nginx SPA Routing
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Static Asset Compilation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Pass API endpoint URL from CI/CD pipeline into Vite build environment
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package descriptors for layer caching
COPY package*.json ./

# Deterministic clean install using lockfile
RUN npm ci

# Copy remaining frontend source code
COPY . .

# Compile optimized static bundle into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server (Lightweight Nginx Alpine)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install curl for AWS ECS / ALB health checks
RUN apk add --no-cache curl

# Remove default Nginx boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Environment variables for dynamic Nginx port & proxy mapping
ENV PORT=80
ENV BACKEND_URL=http://backend:8080

# Template for dynamic environment substitution (envsubst)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static distribution files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck probe hitting Nginx index page
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-80}/ || exit 1

STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]