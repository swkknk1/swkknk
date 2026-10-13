# ==========================================
# 阶段 1: 依赖安装与前端生产构建 (Builder)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源码并执行前端生产打包
COPY . .
RUN npm run build

# ==========================================
# 阶段 2: 轻量生产运行环境 (Runner)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 复制生产所需依赖与运行工具
COPY package*.json ./
RUN npm install --omit=dev && npm install -g tsx typescript

# 复制编译后的静态资源、后端服务及公共文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# 创建持久化数据目录
RUN mkdir -p /app/data

# 暴露服务端口
EXPOSE 3000

# 启动一体化服务端（提供 API 并直接承载前端静态文件）
CMD ["tsx", "server.ts"]
