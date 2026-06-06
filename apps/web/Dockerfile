FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
RUN bun install

FROM deps AS dev
COPY . .
WORKDIR /app/apps/web
CMD ["bun", "run", "dev"]

FROM deps AS runner
COPY . .
WORKDIR /app/apps/web
CMD ["bun", "run", "start"]
