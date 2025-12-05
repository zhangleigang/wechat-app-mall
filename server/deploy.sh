#!/bin/bash

# AI面试助手后端服务部署脚本

set -e

echo "=========================================="
echo "🚀 AI面试助手后端服务部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在 server 目录
if [ ! -f "server.js" ]; then
    echo -e "${RED}错误：请在 server 目录下运行此脚本${NC}"
    exit 1
fi

# 1. 安装依赖
echo -e "${GREEN}步骤1: 安装依赖...${NC}"
npm install
echo ""

# 2. 检查.env文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}警告：未找到.env文件${NC}"
    echo "正在从.env.example创建..."
    cp .env.example .env
    echo -e "${YELLOW}请编辑.env文件，填入正确的配置${NC}"
    echo ""
    read -p "按回车键继续..."
fi

# 3. 测试数据库连接
echo -e "${GREEN}步骤2: 测试数据库连接...${NC}"
source .env
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库连接成功${NC}"
else
    echo -e "${RED}✗ 数据库连接失败，请检查.env配置${NC}"
    exit 1
fi
echo ""

# 4. 创建必要的目录
echo -e "${GREEN}步骤3: 创建必要的目录...${NC}"
mkdir -p uploads/resumes
mkdir -p src/static/avatars
mkdir -p src/static/images
echo -e "${GREEN}✓ 目录创建完成${NC}"
echo ""

# 5. 初始化数据库
echo -e "${GREEN}步骤4: 初始化数据库...${NC}"
echo "是否需要初始化数据库？（如果是首次部署请选择y）"
read -p "输入 y 继续，其他键跳过: " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" < database/init.sql
    echo -e "${GREEN}✓ 数据库初始化完成${NC}"
fi
echo ""

# 6. 测试服务
echo -e "${GREEN}步骤5: 测试服务...${NC}"
echo "正在启动测试服务..."
timeout 5 node server.js > /dev/null 2>&1 &
TEST_PID=$!
sleep 3

# 测试健康检查
curl -s http://localhost:${PORT:-3000}/health > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 服务测试通过${NC}"
    kill $TEST_PID 2>/dev/null || true
    sleep 1
else
    echo -e "${RED}✗ 服务测试失败${NC}"
    kill $TEST_PID 2>/dev/null || true
    sleep 1
    exit 1
fi
echo ""

# 7. 使用PM2部署
echo -e "${GREEN}步骤6: 部署服务...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2未安装，正在安装...${NC}"
    npm install -g pm2
fi

# 停止旧服务
pm2 stop ai-interview-helper 2>/dev/null || true
pm2 delete ai-interview-helper 2>/dev/null || true

# 启动新服务
pm2 start server.js --name ai-interview-helper
pm2 save

echo -e "${GREEN}✓ 服务已启动${NC}"
echo ""

# 8. 显示状态
echo -e "${GREEN}=========================================="
echo "✅ 部署完成！"
echo "==========================================${NC}"
echo ""
echo "服务状态："
pm2 status ai-interview-helper
echo ""
echo "查看日志："
echo "  pm2 logs ai-interview-helper"
echo ""
echo "重启服务："
echo "  pm2 restart ai-interview-helper"
echo ""
echo "停止服务："
echo "  pm2 stop ai-interview-helper"
echo ""
echo "API地址："
echo "  http://localhost:${PORT:-3000}"
echo ""
echo "测试命令："
echo "  curl http://localhost:${PORT:-3000}/health"
echo ""
