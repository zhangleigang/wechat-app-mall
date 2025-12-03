#!/bin/bash

# ============================================================================
# 静态文件目录设置脚本
# ============================================================================
# 用途：创建静态文件目录并设置正确的权限
# 使用：bash setup-static-files.sh
# ============================================================================

set -e  # 遇到错误立即退出

echo "=========================================="
echo "设置静态文件目录"
echo "=========================================="

# 项目根目录
PROJECT_ROOT="/root/ai-interview-helper-server"
STATIC_DIR="${PROJECT_ROOT}/src/static"

# 1. 创建目录结构
echo ""
echo "1. 创建目录结构..."
mkdir -p "${STATIC_DIR}/avatars"
mkdir -p "${STATIC_DIR}/images"

# 2. 设置权限
echo "2. 设置目录权限..."
chmod 755 "${STATIC_DIR}"
chmod 755 "${STATIC_DIR}/avatars"
chmod 755 "${STATIC_DIR}/images"

# 3. 检查收款码是否存在
echo ""
echo "3. 检查收款码图片..."
QRCODE_FILE="${STATIC_DIR}/images/payment-qrcode.png"

if [ -f "$QRCODE_FILE" ]; then
    echo "   ✅ 收款码已存在: $QRCODE_FILE"
    chmod 644 "$QRCODE_FILE"
else
    echo "   ⚠️  收款码不存在: $QRCODE_FILE"
    echo ""
    echo "   请执行以下步骤："
    echo "   1. 准备好收款码图片（微信/支付宝收款码）"
    echo "   2. 上传到服务器："
    echo "      scp payment-qrcode.png root@your-server:${QRCODE_FILE}"
    echo "   3. 设置权限："
    echo "      chmod 644 ${QRCODE_FILE}"
    echo ""
fi

# 4. 显示目录结构
echo ""
echo "4. 当前目录结构："
tree -L 2 "${STATIC_DIR}" 2>/dev/null || ls -lR "${STATIC_DIR}"

# 5. 测试文件访问权限
echo ""
echo "5. 测试文件访问权限..."
if [ -r "${STATIC_DIR}/avatars" ]; then
    echo "   ✅ avatars 目录可读"
else
    echo "   ❌ avatars 目录不可读"
fi

if [ -r "${STATIC_DIR}/images" ]; then
    echo "   ✅ images 目录可读"
else
    echo "   ❌ images 目录不可读"
fi

# 6. 显示访问URL
echo ""
echo "=========================================="
echo "✅ 静态文件目录设置完成！"
echo "=========================================="
echo ""
echo "访问URL："
echo "  - 收款码: https://api.feelnow.cn/static/images/payment-qrcode.png"
echo "  - 头像示例: https://api.feelnow.cn/static/avatars/avatar_xxx.jpg"
echo ""
echo "本地路径："
echo "  - 收款码: ${QRCODE_FILE}"
echo "  - 头像目录: ${STATIC_DIR}/avatars/"
echo ""
echo "下一步："
echo "  1. 如果收款码不存在，请上传收款码图片"
echo "  2. 测试访问: curl -I https://api.feelnow.cn/static/images/payment-qrcode.png"
echo "  3. 更新 Nginx 配置并重载"
echo ""
