# Multi-stage Dockerfile for the SMS Taxi dashboard (production).
#
# Stage 1: build the Angular app with the pinned Node toolchain.
# Stage 2: serve the static dist/ with nginx + the proxy config (nginx.conf),
#          which also reverse-proxies all API traffic (same-origin for the
#          browser — no CORS). Run with docker-compose.yml ("5005:80").
#
# See docs/DEPLOYMENT.md for the full serving/mapping story.

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (cache-friendly layer).
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build the production bundle.
COPY . .
RUN npx ng build --configuration production

# ---------- Stage 2: serve ----------
FROM nginx:alpine

# Site static root (Angular output; `browser` builder writes dist/skote/).
COPY --from=build /app/dist/skote/ /usr/share/nginx/html/

# Our reverse-proxy + SPA config (replaces the default welcome config).
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]