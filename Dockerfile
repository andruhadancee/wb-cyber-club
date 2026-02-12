# Stage 1: Build frontend
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --registry=https://registry.npmjs.org/

COPY . .
RUN npx vite build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --registry=https://registry.npmjs.org/

# Копируем Express-сервер
COPY server/ ./server/

# Копируем собранный фронтенд
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "server/index.cjs"]
