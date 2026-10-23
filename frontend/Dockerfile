# ==============================================================================
# Tier 1: Frontend Isolated Container (React 19 + Vite 8 + Tailwind CSS 4)
# Production Multi-Stage Build with Dynamic Cloud Port Support & Nginx Reverse Proxy
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Bundle Compilation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency specifications first for Docker layer caching
COPY package.json package-lock.json* ./

# Install exact dependencies
RUN npm install

# Copy all isolated frontend source files and configuration
COPY . .

# Compile optimized static bundle into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server (Lightweight Nginx Alpine)
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install curl for cloud container health checks
RUN apk add --no-cache curl

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Default cloud environment variables
# Cloud platforms (Google Cloud Run, AWS App Runner, ECS, Heroku) inject $PORT
ENV PORT=80
ENV BACKEND_URL=http://backend:8080

# Copy template for dynamic environment variable substitution at startup (envsubst)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Fallback static configuration if templates are bypassed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static distribution files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard HTTP port (cloud platforms map this dynamically)
EXPOSE 80

# Healthcheck probe for AWS ALB / GCP Cloud Run / Kubernetes
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-80}/healthz || exit 1

# Run Nginx in foreground
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
