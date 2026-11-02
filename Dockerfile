
# Stage 1: Build React frontend
FROM node:24-bookworm-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client/ .

RUN npm run build


# Stage 2: Install backend production dependencies
FROM node:24-bookworm-slim AS backend-deps

WORKDIR /app/server

COPY server/package*.json ./

RUN npm ci --omit=dev


# Stage 3: Production application
FROM node:24-bookworm-slim AS production

WORKDIR /app/server

ENV NODE_ENV=production

# Backend dependencies
COPY --from=backend-deps /app/server/node_modules ./node_modules

# Backend source code
COPY server/ ./

# Frontend production build
COPY --from=frontend-build /app/client/dist ./dist

EXPOSE 5000

CMD ["node", "server.js"]
