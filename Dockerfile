# AveroaJS application image.
#
#   docker build -t averoajs .                        # production image (last stage)
#   docker build --target development -t averoajs:dev .  # every dependency, used by compose.yaml
#
# The base image is pinned to an exact tag; pin it by digest too
# (node:22.23.4-alpine3.23@sha256:...) if your registry policy requires it.
ARG NODE_IMAGE=node:22.23.4-alpine3.23

FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# ---- production dependencies --------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- development: all dependencies (nodemon, seeders' faker, SQLite) ---------
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN mkdir -p storages/logs storages/upload && chown -R node:node storages
USER node
EXPOSE 8888
CMD ["npm", "run", "dev"]

# ---- production ---------------------------------------------------------------
FROM base AS production
ENV NODE_ENV=production
# JSON lines on stdout for the platform's log collector; nothing written to the container filesystem
ENV LOG_CHANNEL=stdout \
    LOG_FORMAT=json
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# application files stay read-only for the runtime user; only storages/ is writable
RUN mkdir -p storages/logs storages/upload && chown -R node:node storages
USER node
EXPOSE 3000
# readiness probe from @averoa/core (GET /ready, moved with READY_PATH)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.APP_PORT || 3000) + (process.env.READY_PATH || '/ready'), { signal: AbortSignal.timeout(4000) }).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
