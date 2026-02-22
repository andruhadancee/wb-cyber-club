# syntax=docker/dockerfile:1

# Stage 1: Build frontend + backend
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --registry=https://registry.npmjs.org/

COPY . .

RUN npx prisma generate --schema=server/prisma/schema.prisma

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npx vite build
RUN npx tsc -p server/tsconfig.json && echo '{"type":"commonjs"}' > server/dist/package.json

# Stage 2: Production (lightweight)
FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --registry=https://registry.npmjs.org/

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY server/prisma ./server/prisma
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/dist ./dist

COPY scripts/ ./scripts/
RUN find ./scripts -type f -exec sed -i 's/\r$//' {} + \
    && chmod +x ./scripts/docker-entrypoint.sh ./scripts/migrate.sh

EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]
