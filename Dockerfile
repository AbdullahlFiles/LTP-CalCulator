# syntax=docker/dockerfile:1
#
# Builds apps/web as a self-contained production image. Run from the repo
# root (`docker build -f Dockerfile .`) because Next.js's `transpilePackages`
# (next.config.ts) compiles the workspace packages (packages/core,
# packages/market-data, etc.) from their TypeScript source at build time —
# they are not pre-built to their own dist/ output — so the build stage
# needs the whole monorepo, not just apps/web.
#
# Verified locally: `pnpm --filter web build` with `output: "standalone"`
# produces apps/web/.next/standalone/apps/web/server.js plus a correctly
# traced node_modules including the Prisma query-engine binary for
# debian-openssl-3.0.x, which is why the runtime stage below is also
# Debian-based (node:22-slim), not Alpine — Alpine's musl libc needs a
# different Prisma engine binary target that this project has not
# configured (see packages/db/prisma/schema.prisma's `generator client`
# block if a musl-based runtime image is ever wanted instead).

FROM node:22-slim AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ltp/db exec prisma generate
RUN pnpm --filter web build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
