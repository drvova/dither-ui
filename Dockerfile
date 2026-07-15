# Build the static site, then serve it with Caddy + explicit cache headers.
# A Dockerfile gives full control over response headers (Zeabur's auto static
# buildpack does not set cache lifetimes), fixing the Lighthouse cache audit.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
