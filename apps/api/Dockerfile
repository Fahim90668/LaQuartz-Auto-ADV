FROM node:20-alpine
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/shared packages/shared
COPY packages/crypto packages/crypto
COPY packages/db packages/db
COPY packages/discord packages/discord
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production
EXPOSE 4000
CMD ["pnpm", "--filter", "@app/api", "start"]