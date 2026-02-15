# 快速启动指南

## 后端环境变量配置

在 `backend` 目录下创建 `.env` 文件，内容如下：

```env
# Server
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voice_platform

# Redis (optional)
REDIS_URL=redis://localhost:6379

# StepFun API
STEP_API_KEY=your_step_api_key

# Qwen TTS (DashScope compatible)
DASHSCOPE_API_KEY=your_dashscope_api_key
QWEN_API_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_TTS_VOICE=Cherry

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Embedding
EMBEDDING_DIMENSION=256
```

## 启动前端

前端已经在运行，访问：http://localhost:3000

如果前端没有运行，执行：
```bash
cd frontend
npm run dev
```

## 启动后端（可选，用于完整测试）

1. 确保PostgreSQL数据库已安装并运行
2. 创建数据库：
```bash
createdb voice_platform
```
3. 执行数据库迁移：
```bash
psql voice_platform < backend/database/schema.sql
```
4. 启动后端：
```bash
cd backend
npm install
npm run dev
```

## 注意事项

- 前端默认代理到 `http://localhost:8000/api`
- 如果后端未运行，前端API调用会失败
- 可以先测试前端UI，等后端配置好后再测试完整功能





## Provider 健康检查

后端启动后可检查 TTS Provider 配置：

```bash
# 仅检查是否已配置密钥
curl http://localhost:8000/health/providers

# 额外探测 Provider 连通性（会发起外部 API 调用）
curl "http://localhost:8000/health/providers?probe=true"
```
