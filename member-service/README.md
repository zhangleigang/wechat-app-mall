# 会员服务后端

会员管理后端API服务，提供会员状态查询、开通续费、订单管理等功能。

## 核心功能

- 👤 **会员管理** - 查询状态、开通续费
- 📝 **订单记录** - 完整的订单追溯和对账
- 🔐 **管理接口** - 订单查询、核实、导出
- 🚀 **生产就绪** - PM2进程管理、MySQL持久化

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建数据库
mysql -u root -p < init.sql

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库密码

# 4. 启动服务
npm run dev
```

服务将在 `http://localhost:3001` 启动。

### 生产部署

```bash
# 使用自动部署脚本
./deploy.sh

# 或手动部署
npm install --production
pm2 start server.js --name member-service
pm2 save
```

详见 [部署文档](../docs/MEMBER_SERVICE_DEPLOYMENT.md)

## API文档

### 基础URL

- 生产环境：`https://api.feelnow.cn/api`
- 本地开发：`http://localhost:3001/api`

### 用户接口

#### 1. 查询会员状态
```
GET /member/status?openid={openid}
```

响应：
```json
{
  "code": 0,
  "data": {
    "is_member": true,
    "expire_date": "2024-02-01 10:00:00",
    "days_remaining": 15
  }
}
```

#### 2. 开通会员
```
POST /member/activate
Content-Type: application/json

{
  "openid": "xxx",
  "nick_name": "用户昵称",
  "order_number": "ORDER_xxx",
  "package_id": "monthly",
  "package_name": "月度会员",
  "amount": 29.90,
  "days": 30,
  "device_info": "iOS 15.0"
}
```

响应：
```json
{
  "code": 0,
  "message": "会员已开通",
  "data": {
    "expire_date": "2024-02-01 10:00:00",
    "order_id": 123
  }
}
```

### 管理员接口

#### 3. 查询订单列表
```
GET /admin/orders?status=0&page=1&limit=20
```

参数：
- `status`: 0待核实 / 1已核实 / -1异常（可选）
- `page`: 页码，默认1
- `limit`: 每页数量，默认20

#### 4. 核实订单
```
POST /admin/orders/{orderId}/verify
Content-Type: application/json

{
  "status": 1,
  "remark": "已确认收款"
}
```

#### 5. 导出订单
```
GET /admin/orders/export?start_date=2024-01-01&end_date=2024-01-31
```

返回CSV格式文件。

## 数据库表结构

### user_members (用户会员表)
- `id` - 主键
- `openid` - 微信openid（唯一）
- `nick_name` - 昵称
- `expire_date` - 会员过期时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

### orders (订单表)
- `id` - 主键
- `order_number` - 订单号（唯一）
- `openid` - 用户openid
- `nick_name` - 用户昵称
- `package_id` - 套餐ID
- `package_name` - 套餐名称
- `amount` - 支付金额
- `days` - 购买天数
- `status` - 状态（0待核实/1已核实/-1异常）
- `device_info` - 设备信息
- `created_at` - 创建时间
- `verified_at` - 核实时间
- `remark` - 备注

## 项目结构

```
member-service/
├── server.js          # 主服务文件
├── init.sql          # 数据库初始化脚本
├── deploy.sh         # 自动部署脚本
├── package.json      # 依赖配置
├── .env.example      # 环境变量示例
└── README.md         # 本文档
```

## 环境变量

创建 `.env` 文件：

```bash
DB_HOST=localhost          # 数据库地址
DB_USER=root              # 数据库用户
DB_PASSWORD=your_password # 数据库密码
DB_NAME=interview_helper  # 数据库名称
PORT=3001                 # 服务端口
```

## 常用命令

```bash
# 开发
npm run dev               # 开发模式（自动重启）
npm start                 # 生产模式

# PM2管理
pm2 status                # 查看状态
pm2 logs member-service   # 查看日志
pm2 restart member-service # 重启服务
pm2 stop member-service   # 停止服务
```

## 测试

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试查询会员状态
curl "http://localhost:3001/api/member/status?openid=test123"

# 测试开通会员
curl -X POST http://localhost:3001/api/member/activate \
  -H "Content-Type: application/json" \
  -d '{"openid":"test123","nick_name":"测试用户","order_number":"ORDER_TEST_001","package_id":"monthly","package_name":"月度会员","amount":29.90,"days":30,"device_info":"test"}'
```

## 对账流程

1. **导出订单**：`GET /admin/orders/export`
2. **查看微信收款记录**：微信 → 钱包 → 账单
3. **核对订单**：对比订单号、金额、时间
4. **标记已核实**：`POST /admin/orders/{id}/verify`

## 相关文档

- [数据库设计](../docs/DATABASE_DESIGN_FINAL.md) - 完整的数据库设计文档
- [部署指南](../docs/MEMBER_SERVICE_DEPLOYMENT.md) - 生产环境部署详细步骤

## 技术栈

- Node.js 18+
- Express.js 4.x
- MySQL 8.0+
- PM2 进程管理

---

**版本**: 1.0.0  
**最后更新**: 2025-11-29
