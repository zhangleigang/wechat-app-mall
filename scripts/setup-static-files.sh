#!/bin/bash

# 收款码静态文件配置脚本
# 用途：在阿里云服务器上配置 Nginx 静态文件服务
# 使用：bash setup-static-files.sh

set -e

echo "=========================================="
echo "收款码静态文件配置脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误：请使用 root 用户运行此脚本${NC}"
    echo "使用方法：sudo bash setup-static-files.sh"
    exit 1
fi

# 步骤1：创建静态文件目录
echo -e "${YELLOW}步骤1：创建静态文件目录${NC}"
mkdir -p /var/www/static/images
echo -e "${GREEN}✓ 目录创建成功${NC}"
echo ""

# 步骤2：设置权限
echo -e "${YELLOW}步骤2：设置目录权限${NC}"
chmod 755 /var/www/static
chmod 755 /var/www/static/images
echo -e "${GREEN}✓ 权限设置成功${NC}"
echo ""

# 步骤3：检查 Nginx 是否安装
echo -e "${YELLOW}步骤3：检查 Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}✗ Nginx 未安装${NC}"
    echo "请先安装 Nginx："
    echo "  Ubuntu/Debian: apt install nginx"
    echo "  CentOS/RHEL: yum install nginx"
    exit 1
fi
echo -e "${GREEN}✓ Nginx 已安装${NC}"
echo ""

# 步骤4：创建 Nginx 配置
echo -e "${YELLOW}步骤4：配置 Nginx 静态文件服务${NC}"

# 检查是否已有配置
if [ -f /etc/nginx/conf.d/static.conf ]; then
    echo -e "${YELLOW}⚠ 配置文件已存在，是否覆盖？(y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "跳过配置文件创建"
    else
        create_config=true
    fi
else
    create_config=true
fi

if [ "$create_config" = true ]; then
    cat > /etc/nginx/conf.d/static.conf << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.feelnow.cn;

    # SSL 证书配置（如果已有）
    ssl_certificate /etc/letsencrypt/live/api.feelnow.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.feelnow.cn/privkey.pem;

    # 静态文件目录
    location /static/ {
        alias /var/www/static/;
        
        # 缓存配置
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # 允许跨域（小程序需要）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        
        # 安全头部
        add_header X-Content-Type-Options "nosniff";
        add_header X-Frame-Options "DENY";
        
        # Gzip 压缩
        gzip on;
        gzip_types image/jpeg image/png;
        
        # 日志
        access_log /var/log/nginx/static-access.log;
    }

    # API 代理（保持原有配置）
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOF
    echo -e "${GREEN}✓ Nginx 配置文件创建成功${NC}"
else
    echo -e "${YELLOW}⚠ 使用现有配置文件${NC}"
fi
echo ""

# 步骤5：测试 Nginx 配置
echo -e "${YELLOW}步骤5：测试 Nginx 配置${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx 配置测试通过${NC}"
else
    echo -e "${RED}✗ Nginx 配置测试失败${NC}"
    echo "请检查配置文件：/etc/nginx/conf.d/static.conf"
    exit 1
fi
echo ""

# 步骤6：重启 Nginx
echo -e "${YELLOW}步骤6：重启 Nginx${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✓ Nginx 重启成功${NC}"
else
    echo -e "${RED}✗ Nginx 重启失败${NC}"
    exit 1
fi
echo ""

# 步骤7：创建测试文件
echo -e "${YELLOW}步骤7：创建测试文件${NC}"
echo "Test file" > /var/www/static/test.txt
chmod 644 /var/www/static/test.txt
echo -e "${GREEN}✓ 测试文件创建成功${NC}"
echo ""

# 步骤8：测试访问
echo -e "${YELLOW}步骤8：测试静态文件访问${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost/static/test.txt | grep -q "200"; then
    echo -e "${GREEN}✓ 静态文件服务正常${NC}"
else
    echo -e "${RED}✗ 静态文件服务异常${NC}"
    echo "请检查 Nginx 日志：tail -f /var/log/nginx/error.log"
fi
echo ""

# 完成
echo "=========================================="
echo -e "${GREEN}配置完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 上传收款码图片："
echo "   scp payment-qrcode.jpg root@47.95.196.190:/var/www/static/images/"
echo ""
echo "2. 设置文件权限："
echo "   chmod 644 /var/www/static/images/payment-qrcode.jpg"
echo ""
echo "3. 测试访问："
echo "   curl -I https://api.feelnow.cn/static/images/payment-qrcode.jpg"
echo ""
echo "4. 更新小程序 config.js："
echo "   paymentQrcode: {"
echo "     url: 'https://api.feelnow.cn/static/images/payment-qrcode.jpg',"
echo "     accountName: '你的姓名',"
echo "     enabled: true"
echo "   }"
echo ""
echo "5. 配置微信小程序域名白名单："
echo "   downloadFile 合法域名：https://api.feelnow.cn"
echo ""
echo "详细文档：docs/UPLOAD_QRCODE_GUIDE.md"
echo ""
