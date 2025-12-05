#!/bin/bash

# 文档结构检查脚本
# 确保文档在正确的位置

echo "🔍 检查文档结构..."
echo ""

ERROR=0

# 检查根目录是否有不该存在的文档
echo "检查 server 根目录..."
if ls *_GUIDE.md 2>/dev/null | grep -v README.md; then
    echo "❌ 发现 *_GUIDE.md 文件在根目录，应该移到 docs/"
    ERROR=1
fi

if ls *_API.md 2>/dev/null; then
    echo "❌ 发现 *_API.md 文件在根目录，应该移到 docs/"
    ERROR=1
fi

if ls *_DEPLOY*.md 2>/dev/null; then
    echo "❌ 发现 *_DEPLOY*.md 文件在根目录，应该移到 docs/"
    ERROR=1
fi

if ls *_CHECKLIST.md 2>/dev/null; then
    echo "❌ 发现 *_CHECKLIST.md 文件在根目录，应该移到 docs/"
    ERROR=1
fi

if [ $ERROR -eq 0 ]; then
    echo "✅ server 根目录整洁"
fi

echo ""

# 检查 docs 目录
echo "检查 docs 目录..."
if [ ! -d "docs" ]; then
    echo "❌ docs 目录不存在"
    ERROR=1
else
    DOC_COUNT=$(ls docs/*.md 2>/dev/null | wc -l)
    echo "✅ docs 目录存在，包含 $DOC_COUNT 个文档"
fi

echo ""

# 检查必要文件是否存在
echo "检查必要文件..."
REQUIRED_FILES=(
    "server.js"
    "package.json"
    ".env.example"
    "deploy.sh"
    "pack.sh"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
        ERROR=1
    fi
done

echo ""

# 检查脚本执行权限
echo "检查脚本权限..."
SCRIPTS=("deploy.sh" "pack.sh" "setup-static-files.sh" "check-structure.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "✅ $script 可执行"
        else
            echo "⚠️  $script 不可执行，正在修复..."
            chmod +x "$script"
            echo "✅ $script 已设置为可执行"
        fi
    fi
done

echo ""
echo "================================"

if [ $ERROR -eq 0 ]; then
    echo "✅ 所有检查通过！文档结构正确。"
    exit 0
else
    echo "❌ 发现问题，请修复后再打包部署。"
    exit 1
fi
