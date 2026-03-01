# Vite 7 requires Node 20.19+ (Node 18 no longer supported)
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
COPY --from=frontend-build /app/client/dist ./client/dist

USER node
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8000/health || exit 1

CMD ["node", "server/index.js"]
