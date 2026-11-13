# Build the static site, then serve it with Caddy + explicit cache headers.
# A Dockerfile gives full control over response headers (Zeabur's auto static
# buildpack does not set cache lifetimes), fixing the Lighthouse cache audit.

# SolidStart needs Node 24. The build ends in Chromium (the share cards and
# the agent registry), which the build finds at /usr/bin/chromium.
FROM node:24-alpine AS build
RUN apk add --no-cache chromium
WORKDIR /app
# One install for the workspace: the root's manifest and lockfile, and each
# package's manifest.
COPY package.json package-lock.json ./
COPY packages/bridge/package.json packages/bridge/
COPY packages/discord/package.json packages/discord/
COPY packages/dither-kit/package.json packages/dither-kit/
COPY packages/dither-kit-stylex/package.json packages/dither-kit-stylex/
COPY packages/restyle/package.json packages/restyle/
COPY packages/site/package.json packages/site/
COPY packages/tasks/package.json packages/tasks/
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/packages/site/.output/public /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
