# ─────────────────────────────────────────────────────────────────────────────
# Streamify Web SPA — Dockerfile (Development / Dev Server)
# Built and served by Vite dev server inside Docker.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared-types/package.json       ./packages/shared-types/
COPY apps/web/package.json                    ./apps/web/

# Install dependencies for web
RUN pnpm install --frozen-lockfile --filter @streamify/web...

# Copy source code
COPY packages ./packages
COPY apps/web ./apps/web
COPY tsconfig.json ./

# Expose Vite dev server port
EXPOSE 5173

# Start the dev server and bind to all interfaces (0.0.0.0) so it's accessible outside the container
CMD ["pnpm", "--filter", "@streamify/web", "run", "dev", "--", "--host"]
