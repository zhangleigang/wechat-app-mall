#!/bin/bash

# 测试收款码URL是否可访问
# 用法: ./scripts/test-qrcode-url.sh

QRCODE_URL="https://api.feelnow.cn:8443/static/images/payment-qrcode.png"

echo "======================================"
echo "测试收款码URL访问"
echo "======================================"
echo ""
echo "URL: $QRCODE_URL"
echo ""

# 测试URL是否可访问
echo "正在测试..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$QRCODE_URL")

echo ""
echo "HTTP状态码: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 收款码可以正常访问"
    echo ""
    echo "文件信息:"
    curl -sI "$QRCODE_URL" | grep -E "Content-Type|Content-Length|Last-Modified"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 收款码文件不存在 (404)"
    echo ""
    echo "请执行以下步骤："
    echo "1. 准备收款码图片文件 payment-qrcode.png"
    echo "2. 运行上传脚本: ./scripts/upload-qrcode.sh"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ 无法连接到服务器"
    echo ""
    echo "可能的原因："
    echo "1. 服务器未启动"
    echo "2. 防火墙阻止了8443端口"
    echo "3. 网络连接问题"
else
    echo "⚠️  返回异常状态码: $HTTP_CODE"
    echo ""
    echo "响应内容:"
    curl -s "$QRCODE_URL"
fi

echo ""
echo "======================================"
