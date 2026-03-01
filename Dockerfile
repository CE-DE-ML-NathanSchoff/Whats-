# Vite 7 requires Node 20.19+ (Node 18 no longer supported)
# Set BASE_PATH when app is served at a subpath (e.g. /communitree) so assets and API proxy work
ARG BASE_PATH=/communitree
FROM node:20-alpine AS frontend-build
ARG BASE_PATH
ENV BASE_PATH=${BASE_PATH}
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine
ARG BASE_PATH=/communitree
ENV BASE_PATH=${BASE_PATH}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
COPY --from=frontend-build /app/client/dist ./client/dist

USER node
EXPOSE 7000 8000
ENV PORT=7000 FRONTEND_PORT=8000

# Healthcheck must hit the same path as the app (e.g. /communitree/health when BASE_PATH=/communitree)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://localhost:8000${BASE_PATH}/health" || exit 1

CMD ["node", "server/index.js"]
