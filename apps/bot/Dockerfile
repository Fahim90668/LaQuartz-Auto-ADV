FROM node:20-alpine
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/bot apps/bot
COPY packages/shared packages/shared
COPY packages/crypto packages/crypto
COPY packages/db packages/db
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@app/bot", "start"]