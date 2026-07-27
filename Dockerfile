# DesignFOBEE web (Next.js 14) — AI-HQ Docker Compose 가 이 Dockerfile을 빌드한다.
# output:standalone은 DOCKER_BUILD=true일 때만 활성화(next.config.mjs 조건부) — Vercel 빌드는
# 이 env var가 없어 기존 방식 그대로 유지, Vercel 파이프라인에 영향 없음(격리 테스트로 검증, DECISION-LOG 2026-07-27).
# openssl 설치 필수: Prisma 쿼리 엔진(libquery_engine-debian-openssl-*.so.node)이 libssl에 의존.
FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY database ./database
RUN npm ci

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
RUN npm run build

FROM base AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
