FROM node:22-bookworm-slim AS base

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

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

ARG PORTAL_PUBLIC_ORIGIN
ARG ADMIN_CONSOLE_PUBLIC_ORIGIN
ARG API_PUBLIC_ORIGIN

ENV NODE_ENV=production
ENV APP_NAME=portal-web
ENV PORTAL_PUBLIC_ORIGIN=${PORTAL_PUBLIC_ORIGIN}
ENV ADMIN_CONSOLE_PUBLIC_ORIGIN=${ADMIN_CONSOLE_PUBLIC_ORIGIN}
ENV API_PUBLIC_ORIGIN=${API_PUBLIC_ORIGIN}
ENV NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN=${PORTAL_PUBLIC_ORIGIN}
ENV NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN=${ADMIN_CONSOLE_PUBLIC_ORIGIN}
ENV NEXT_PUBLIC_API_PUBLIC_ORIGIN=${API_PUBLIC_ORIGIN}

RUN pnpm --filter portal-web build

FROM node:22-bookworm-slim AS runtime

WORKDIR /workspace

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY --from=build /workspace /workspace

ENTRYPOINT ["bash", "/workspace/scripts/docker/portal-web-entrypoint.sh"]
