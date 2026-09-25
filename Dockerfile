# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The site calls /api on its own domain; Caddy forwards those requests to the backend.
ARG VITE_API_URL=/api
ARG VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
ARG VITE_CONTACT_EMAIL=
ARG VITE_CONTACT_PHONE=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL \
    VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL \
    VITE_CONTACT_PHONE=$VITE_CONTACT_PHONE
RUN npm run build

# ---- Serve ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
