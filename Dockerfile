# DesignFOBEE web (Next.js 14) — AI-HQ Docker Compose 가 이 Dockerfile을 빌드한다.
# 표준 3단계 빌드. output:standalone(next.config.mjs) 미사용 — 기존 Vercel 배포 파이프라인에
# 영향을 주지 않기 위해 next.config.mjs는 변경하지 않는다(§구현규칙: 핵심 구조 무변경).
FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY database ./database
RUN npm ci

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
