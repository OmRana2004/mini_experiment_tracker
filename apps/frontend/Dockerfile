
FROM node:24-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy monorepo dependency files
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY turbo.json ./

RUN npm install --global npm@11.17.0
# Install dependencies
RUN npm ci

# API URL accessible from the user's browser
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js frontend
RUN npm run build --workspace=@repo/frontend

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@repo/frontend"]
