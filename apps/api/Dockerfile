FROM node:22-bookworm-slim AS base

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
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

RUN pnpm --filter @payer-portal/database build && pnpm --filter api build

FROM node:22-bookworm-slim AS runtime

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

COPY --from=build /workspace /workspace

ENTRYPOINT ["bash", "/workspace/scripts/docker/api-entrypoint.sh"]
