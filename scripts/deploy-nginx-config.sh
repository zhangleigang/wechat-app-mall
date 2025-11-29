#!/bin/bash

# ============================================================================
# Nginx配置部署脚本
# ============================================================================
# 用途：将项目中的nginx.conf部署到服务器
# 使用：./scripts/deploy-nginx-config.sh
# ============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
NGINX_CONF_SOURCE="docs/nginx.conf"
NGINX_CONF_TARGET="/etc/nginx/conf.d/api-feelnow.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available/api-feelnow"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled/api-feelnow"
STATIC_DIR="/var/static"

echo -e "${BLUE}======================================"
echo "Nginx配置部署脚本"
echo -e "======================================${NC}"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "使用: sudo ./scripts/deploy-nginx-config.sh"
    exit 1
fi

# 检查Nginx是否已安装
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx未安装${NC}"
    echo ""
    echo "请先安装Nginx："
    echo "  CentOS/RHEL: yum install nginx"
    echo "  Ubuntu/Debian: apt-get install nginx"
    exit 1
fi

echo -e "${GREEN}✓ Nginx已安装${NC}"
NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
echo "  版本: $NGINX_VERSION"
echo ""

# 检查源配置文件是否存在
if [ ! -f "$NGINX_CONF_SOURCE" ]; then
    echo -e "${RED}❌ 源配置文件不存在: $NGINX_CONF_SOURCE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 源配置文件存在${NC}"
echo ""

# 备份现有配置（如果存在）
if [ -f "$NGINX_CONF_TARGET" ]; then
    BACKUP_FILE="${NGINX_CONF_TARGET}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}⚠ 发现现有配置，正在备份...${NC}"
    cp "$NGINX_CONF_TARGET" "$BACKUP_FILE"
    echo -e "${GREEN}✓ 备份完成: $BACKUP_FILE${NC}"
    echo ""
fi

# 复制配置文件
echo "正在部署配置文件..."
cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_TARGET"
echo -e "${GREEN}✓ 配置文件已复制到: $NGINX_CONF_TARGET${NC}"
echo ""

# 创建静态文件目录
echo "正在创建静态文件目录..."
mkdir -p "$STATIC_DIR/images"
chmod 755 "$STATIC_DIR"
chmod 755 "$STATIC_DIR/images"
echo -e "${GREEN}✓ 静态文件目录已创建: $STATIC_DIR${NC}"
echo ""

# 检查SSL证书
SSL_CERT="/etc/ssl/cert/api.feelnow.cn.pem"
SSL_KEY="/etc/ssl/cert/api.feelnow.cn.key"

echo "检查SSL证书..."
if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo -e "${GREEN}✓ SSL证书存在${NC}"
    echo "  证书: $SSL_CERT"
    echo "  密钥: $SSL_KEY"
else
    echo -e "${YELLOW}⚠ SSL证书不存在${NC}"
    echo "  证书路径: $SSL_CERT"
    echo "  密钥路径: $SSL_KEY"
    echo ""
    echo "请确保SSL证书已正确配置，否则Nginx将无法启动"
fi
echo ""

# 测试Nginx配置
echo "正在测试Nginx配置..."
if nginx -t; then
    echo -e "${GREEN}✓ Nginx配置测试通过${NC}"
    echo ""
else
    echo -e "${RED}❌ Nginx配置测试失败${NC}"
    echo ""
    echo "请检查配置文件中的错误"
    echo "配置文件位置: $NGINX_CONF_TARGET"
    exit 1
fi

# 询问是否重载Nginx
echo -e "${YELLOW}是否立即重载Nginx配置？${NC}"
read -p "输入 y 继续，其他键取消: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在重载Nginx..."
    if systemctl reload nginx; then
        echo -e "${GREEN}✓ Nginx配置已重载${NC}"
    else
        echo -e "${RED}❌ Nginx重载失败${NC}"
        echo "尝试重启Nginx..."
        if systemctl restart nginx; then
            echo -e "${GREEN}✓ Nginx已重启${NC}"
        else
            echo -e "${RED}❌ Nginx重启失败${NC}"
            echo "请检查日志: journalctl -xe"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠ 已跳过重载，请手动执行: systemctl reload nginx${NC}"
fi

echo ""
echo -e "${BLUE}======================================"
echo "部署完成"
echo -e "======================================${NC}"
echo ""
echo "下一步操作："
echo ""
echo "1. 上传收款码图片："
echo "   ./scripts/upload-qrcode.sh"
echo ""
echo "2. 配置防火墙（如果需要）："
echo "   firewall-cmd --permanent --add-port={80,443,8080,8443}/tcp"
echo "   firewall-cmd --reload"
echo ""
echo "3. 测试服务："
echo "   curl -I https://api.feelnow.cn:8443/health"
echo "   curl -I https://api.feelnow.cn/health"
echo ""
echo "4. 查看日志："
echo "   tail -f /var/log/nginx/api-8443-access.log"
echo "   tail -f /var/log/nginx/api-8443-error.log"
echo ""
echo "5. 在微信小程序后台配置域名白名单："
echo "   https://api.feelnow.cn"
echo ""
