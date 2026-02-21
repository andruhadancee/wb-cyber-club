# Stage 1: Build frontend + backend (runs on CI, fast runner)
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN npm ci --registry=https://registry.npmjs.org/

COPY . .

RUN npx prisma generate --schema=server/prisma/schema.prisma

# Increase memory for Vite on low-RAM machines
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npx vite build

RUN npx tsc -p server/tsconfig.json && echo '{"type":"commonjs"}' > server/dist/package.json

# Stage 2: Production (lightweight)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
RUN npm ci --omit=dev --registry=https://registry.npmjs.org/

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY server/prisma ./server/prisma
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/dist ./dist

COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN sed -i 's/\r$//' ./scripts/docker-entrypoint.sh && chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]
