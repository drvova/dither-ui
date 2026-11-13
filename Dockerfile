# Build the static site, then serve it with Caddy + explicit cache headers.
# A Dockerfile gives full control over response headers (Zeabur's auto static
# buildpack does not set cache lifetimes), fixing the Lighthouse cache audit.

# SolidStart needs Node 24. The build ends in Chromium (the share cards and
# the agent registry), which the build finds at /usr/bin/chromium.
FROM node:24-alpine AS build
RUN apk add --no-cache chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY solid-site/package*.json solid-site/
RUN npm ci --prefix solid-site
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/solid-site/.output/public /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
