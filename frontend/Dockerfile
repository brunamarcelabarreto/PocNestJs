# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time variables (valores definidos no .env da raiz via docker-compose build args)
ARG VITE_API_URL
ARG VITE_FRONTEND_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig*.json tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public

RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
