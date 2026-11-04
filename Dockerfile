# 1. Build fáze
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json tailwind.config.js postcss.config.js vite.config.ts ./
RUN npm ci

COPY public ./public
COPY src ./src
COPY frontend ./frontend
RUN npm run build

# 2. Běhová fáze
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "dist/index.js"]
