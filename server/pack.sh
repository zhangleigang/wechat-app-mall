#!/bin/bash

# AI面试助手后端服务打包脚本

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="ai-interview-helper-server-${TIMESTAMP}.tar.gz"
TEMP_DIR="ai-interview-helper-server"

echo "📦 打包 AI面试助手后端服务"
echo "================================"
echo ""

# 检查文档结构
if [ -f "check-structure.sh" ]; then
    echo "🔍 检查文档结构..."
    bash check-structure.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 文档结构检查失败，请修复后再打包"
        exit 1
    fi
    echo ""
fi

# 清理旧的临时目录
rm -rf $TEMP_DIR

# 创建临时目录
mkdir -p $TEMP_DIR

# 复制核心文件
echo "正在复制文件..."
cp -r src $TEMP_DIR/
cp -r config $TEMP_DIR/
cp -r database $TEMP_DIR/
cp -r scripts $TEMP_DIR/ 2>/dev/null || true
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/
cp deploy.sh $TEMP_DIR/
cp README.md $TEMP_DIR/

# 确保 .env.example 被复制（显式处理隐藏文件）
if [ -f ".env.example" ]; then
    cp .env.example $TEMP_DIR/
    echo "✓ .env.example 已复制"
else
    echo "⚠️  警告: .env.example 文件不存在"
fi

# 设置执行权限
chmod +x $TEMP_DIR/*.sh

# 打包
echo "正在压缩..."
tar -czf $PACKAGE_NAME $TEMP_DIR

# 验证打包内容
echo ""
echo "🔍 验证打包内容..."
if tar -tzf $PACKAGE_NAME | grep -q ".env.example"; then
    echo "✓ .env.example 已包含在压缩包中"
else
    echo "⚠️  警告: .env.example 未包含在压缩包中"
fi

# 清理临时目录
rm -rf $TEMP_DIR

# 显示结果
echo ""
echo "✅ 打包完成！"
echo ""
echo "📦 文件名: $PACKAGE_NAME"
echo "📊 大小: $(du -h $PACKAGE_NAME | cut -f1)"
echo ""
echo "📤 上传到服务器:"
echo "  scp $PACKAGE_NAME root@47.95.196.190:/root/"
echo ""
echo "🚀 在服务器上部署:"
echo "  ssh root@47.95.196.190"
echo "  cd /root"
echo "  tar -xzf $PACKAGE_NAME"
echo "  cd $TEMP_DIR"
echo "  cp .env.example .env"
echo "  vi .env  # 配置数据库密码等"
echo "  bash deploy.sh"
echo ""
