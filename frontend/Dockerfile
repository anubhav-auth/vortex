# ── build ──────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Empty VITE_API_URL → frontend uses relative URLs and goes through nginx.
ENV VITE_API_URL=""
RUN npm run build

# ── runtime ────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
