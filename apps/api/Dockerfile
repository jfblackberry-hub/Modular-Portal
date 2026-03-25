FROM node:22-bookworm-slim AS base

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tenant-config.json ./
COPY apps/admin-console/package.json ./apps/admin-console/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/portal-web/package.json ./apps/portal-web/package.json
COPY packages/api-contracts/package.json ./packages/api-contracts/package.json
COPY packages/api-gateway/package.json ./packages/api-gateway/package.json
COPY packages/canonical-model/package.json ./packages/canonical-model/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/package.json
COPY packages/server/package.json ./packages/server/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/shared-utils/package.json ./packages/shared-utils/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY plugins/broker/package.json ./plugins/broker/package.json
COPY plugins/enrollment/package.json ./plugins/enrollment/package.json
COPY plugins/member/package.json ./plugins/member/package.json
COPY plugins/provider/package.json ./plugins/provider/package.json

RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY packages ./packages
COPY plugins ./plugins
COPY scripts ./scripts

FROM base AS build

ENV NODE_ENV=production
ENV APP_NAME=api

RUN pnpm --filter @payer-portal/database db:generate
RUN pnpm --filter api... build

FROM node:22-bookworm-slim AS runtime

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY --from=build /workspace /workspace

ENTRYPOINT ["sh", "/workspace/scripts/docker/api-entrypoint.sh"]
