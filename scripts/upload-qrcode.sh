#!/bin/bash

# 收款码上传脚本
# 用途：将收款码图片上传到阿里云服务器
# 使用：bash upload-qrcode.sh payment-qrcode.jpg

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "收款码上传脚本"
echo "=========================================="
echo ""

# 服务器配置
SERVER_IP="47.95.196.190"
SERVER_USER="root"
REMOTE_PATH="/var/www/static/images"
IMAGE_NAME="payment-qrcode.jpg"

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}使用方法：${NC}"
    echo "  bash upload-qrcode.sh <图片文件路径>"
    echo ""
    echo "示例："
    echo "  bash upload-qrcode.sh ~/Downloads/qrcode.jpg"
    echo "  bash upload-qrcode.sh payment-qrcode.jpg"
    echo ""
    exit 1
fi

LOCAL_FILE="$1"

# 检查文件是否存在
if [ ! -f "$LOCAL_FILE" ]; then
    echo -e "${RED}错误：文件不存在: $LOCAL_FILE${NC}"
    exit 1
fi

# 检查文件类型
FILE_TYPE=$(file -b --mime-type "$LOCAL_FILE")
if [[ ! "$FILE_TYPE" =~ ^image/(jpeg|png|jpg)$ ]]; then
    echo -e "${YELLOW}警告：文件类型可能不正确: $FILE_TYPE${NC}"
    echo -e "${YELLOW}建议使用 JPG 或 PNG 格式${NC}"
    echo ""
    echo -e "${YELLOW}是否继续？(y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "已取消"
        exit 0
    fi
fi

# 检查文件大小
FILE_SIZE=$(stat -f%z "$LOCAL_FILE" 2>/dev/null || stat -c%s "$LOCAL_FILE" 2>/dev/null)
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)

echo -e "${GREEN}文件信息：${NC}"
echo "  文件路径: $LOCAL_FILE"
echo "  文件类型: $FILE_TYPE"
echo "  文件大小: ${FILE_SIZE_MB}MB"
echo ""

if (( $(echo "$FILE_SIZE_MB > 1" | bc -l) )); then
    echo -e "${YELLOW}警告：文件较大 (${FILE_SIZE_MB}MB)，建议压缩后再上传${NC}"
    echo -e "${YELLOW}是否继续？(y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "已取消"
        echo ""
        echo "压缩建议："
        echo "  - 使用在线工具：https://tinypng.com/"
        echo "  - 使用命令行：convert $LOCAL_FILE -quality 85 -resize 800x800 compressed.jpg"
        exit 0
    fi
fi

# 步骤1：上传文件到临时目录
echo -e "${YELLOW}步骤1：上传文件到服务器...${NC}"
if scp "$LOCAL_FILE" "$SERVER_USER@$SERVER_IP:/tmp/$IMAGE_NAME"; then
    echo -e "${GREEN}✓ 文件上传成功${NC}"
else
    echo -e "${RED}✗ 文件上传失败${NC}"
    exit 1
fi
echo ""

# 步骤2：在服务器上移动文件并设置权限
echo -e "${YELLOW}步骤2：配置文件权限...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << EOF
    # 创建目录（如果不存在）
    mkdir -p $REMOTE_PATH
    
    # 移动文件
    mv /tmp/$IMAGE_NAME $REMOTE_PATH/$IMAGE_NAME
    
    # 设置权限
    chmod 644 $REMOTE_PATH/$IMAGE_NAME
    
    # 显示文件信息
    ls -lh $REMOTE_PATH/$IMAGE_NAME
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 文件配置成功${NC}"
else
    echo -e "${RED}✗ 文件配置失败${NC}"
    exit 1
fi
echo ""

# 步骤3：测试访问
echo -e "${YELLOW}步骤3：测试文件访问...${NC}"

# 测试 HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP/static/images/$IMAGE_NAME")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTP 访问正常 (200)${NC}"
else
    echo -e "${YELLOW}⚠ HTTP 访问异常 ($HTTP_CODE)${NC}"
fi

# 测试 HTTPS
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://api.feelnow.cn/static/images/$IMAGE_NAME")
if [ "$HTTPS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS 访问正常 (200)${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS 访问异常 ($HTTPS_CODE)${NC}"
    echo -e "${YELLOW}  可能需要配置 Nginx 静态文件服务${NC}"
fi
echo ""

# 完成
echo "=========================================="
echo -e "${GREEN}上传完成！${NC}"
echo "=========================================="
echo ""
echo "访问链接："
echo "  https://api.feelnow.cn/static/images/$IMAGE_NAME"
echo ""
echo "下一步操作："
echo ""
echo "1. 在浏览器中测试访问："
echo "   https://api.feelnow.cn/static/images/$IMAGE_NAME"
echo ""
echo "2. 更新小程序 config.js："
echo "   paymentQrcode: {"
echo "     url: 'https://api.feelnow.cn/static/images/$IMAGE_NAME',"
echo "     accountName: '你的姓名', // 修改为实际姓名"
echo "     enabled: true"
echo "   }"
echo ""
echo "3. 配置微信小程序域名白名单："
echo "   登录 https://mp.weixin.qq.com/"
echo "   开发 → 开发管理 → 服务器域名"
echo "   downloadFile 合法域名：https://api.feelnow.cn"
echo ""
echo "4. 在微信开发者工具中测试"
echo ""
