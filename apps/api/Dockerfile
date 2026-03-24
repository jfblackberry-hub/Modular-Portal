FROM node:22-bookworm-slim AS base

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tenant-config.json ./
COPY apps ./apps
COPY packages ./packages
COPY plugins ./plugins
COPY scripts ./scripts
COPY docs ./docs
COPY infra ./infra

RUN pnpm install --frozen-lockfile

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
