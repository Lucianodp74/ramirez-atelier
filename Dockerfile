# --- Stage 1: dipendenze ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valori segnaposto: "prisma generate" deve solo trovare queste variabili
# valorizzate per caricare la configurazione (prisma.config.ts) - non si
# connette davvero a un database in questa fase. I valori reali arrivano a
# runtime nel container finale, iniettati dalla piattaforma di hosting.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV SITE_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build

# --- Stage 3: runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
