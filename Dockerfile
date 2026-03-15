FROM node:20-alpine AS base

# Build client
FROM base AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build server
FROM base AS production
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY src/ ./src/
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
