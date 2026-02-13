# Stage 1: Build frontend + backend
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN npm ci --registry=https://registry.npmjs.org/

COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Build frontend
RUN npx vite build

# Build backend (TypeScript -> JavaScript)
RUN npx tsc -p server/tsconfig.json && echo '{"type":"module"}' > server/dist/package.json

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN npm ci --omit=dev --registry=https://registry.npmjs.org/

# Copy Prisma (client + CLI for migrations)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy Prisma schema (needed at runtime)
COPY server/prisma ./server/prisma

# Copy compiled backend
COPY --from=build /app/server/dist ./server/dist

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy entrypoint script (fix Windows line endings)
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN sed -i 's/\r$//' ./scripts/docker-entrypoint.sh && chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]
