
FROM node:24-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies from monorepo root
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY turbo.json ./

RUN npm install --global npm@11.17.0

RUN npm ci

# Generate Prisma Client before compiling TypeScript
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/experiment_tracker?schema=public"

RUN npm run db:generate --workspace=@repo/db

# Build database package and backend
RUN npm run build --workspace=@repo/db
RUN npm run build --workspace=@repo/backend

EXPOSE 5000

CMD ["npm", "run", "start", "--workspace=@repo/backend"]
