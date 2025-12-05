#!/bin/bash

# 快速修复脚本：在服务器上创建 .env.example 文件

echo "🔧 创建 .env.example 文件..."

cat > .env.example << 'EOF'
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Member2025!
DB_NAME=ai_interview_helper

# JWT 配置
JWT_SECRET=ai-interview-assistant-jwt-secret-2024

# 微信小程序配置
# 从微信公众平台获取: https://mp.weixin.qq.com/
# ⚠️ 必须与 project.config.json 中的 appid 一致
WECHAT_APPID=wxaaef8fb1d8cbea4b
WECHAT_SECRET=b3e23097d3b0bc72f29c85239b33314a

# CORS 配置
CORS_ORIGIN=*

# DeepSeek API 配置
# 从 DeepSeek 平台获取: https://platform.deepseek.com/
DEEPSEEK_API_KEY=your-deepseek-api-key-here
EOF

if [ -f ".env.example" ]; then
    echo "✅ .env.example 文件已创建"
    echo ""
    echo "📝 下一步："
    echo "  1. 复制为 .env: cp .env.example .env"
    echo "  2. 编辑配置: vi .env"
    echo "  3. 修改数据库密码和 DeepSeek API Key"
else
    echo "❌ 创建失败"
    exit 1
fi
