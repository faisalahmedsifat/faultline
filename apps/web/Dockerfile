FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
RUN bun install

FROM deps AS runner
COPY . .
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build
CMD ["bun", "run", "start"]
