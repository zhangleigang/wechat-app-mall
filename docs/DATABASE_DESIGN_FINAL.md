# 会员系统数据库设计

## 设计理念

**简单 + 实用 = 2张表搞定**
- 会员表：存储用户会员过期时间
- 订单表：用于对账和追溯
- 套餐信息：保留在小程序代码中

---

## 数据库设计

### 1. 用户会员表 (user_members)

存储用户会员状态

```sql
CREATE TABLE user_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
    nick_name VARCHAR(100) COMMENT '昵称',
    expire_date DATETIME COMMENT '会员过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '首次开通时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    INDEX idx_openid (openid),
    INDEX idx_expire_date (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会员表';
```

### 2. 订单记录表 (orders)

用于对账和追溯

```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) UNIQUE NOT NULL COMMENT '订单号',
    openid VARCHAR(100) NOT NULL COMMENT '用户openid',
    nick_name VARCHAR(100) COMMENT '用户昵称',
    package_id VARCHAR(50) NOT NULL COMMENT '套餐ID（monthly/quarterly/yearly）',
    package_name VARCHAR(100) NOT NULL COMMENT '套餐名称',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    days INT NOT NULL COMMENT '购买天数',
    status TINYINT DEFAULT 0 COMMENT '状态：0待核实 1已核实 -1异常',
    device_info VARCHAR(500) COMMENT '设备信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    verified_at DATETIME COMMENT '核实时间',
    remark VARCHAR(500) COMMENT '备注',
    INDEX idx_order_number (order_number),
    INDEX idx_openid (openid),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单记录表';
```

---

## API接口设计

### 基础URL
```
https://api.feelnow.cn/api
```

### 1. 查询会员状态

```http
GET /member/status?openid={openid}
```

**响应：**
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

### 2. 创建订单并开通会员

```http
POST /member/activate
Content-Type: application/json

{
  "openid": "xxx",
  "nick_name": "用户昵称",
  "order_number": "ORDER_1704096000000_ABC",
  "package_id": "monthly",
  "package_name": "月度会员",
  "amount": 29.90,
  "days": 30,
  "device_info": "iOS 15.0"
}
```

**响应：**
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

### 3. 查询订单列表（对账用）

```http
GET /admin/orders?status=0&page=1&limit=20
```

**参数：**
- `status`: 0待核实 / 1已核实 / -1异常 / 不传则查全部
- `page`: 页码
- `limit`: 每页数量

**响应：**
```json
{
  "code": 0,
  "data": {
    "total": 100,
    "pending": 10,
    "verified": 85,
    "abnormal": 5,
    "list": [
      {
        "id": 123,
        "order_number": "ORDER_xxx",
        "nick_name": "用户A",
        "package_name": "月度会员",
        "amount": 29.90,
        "status": 0,
        "created_at": "2024-01-01 10:00:00"
      }
    ]
  }
}
```

### 4. 核实订单

```http
POST /admin/orders/{order_id}/verify
Content-Type: application/json

{
  "status": 1,
  "remark": "已确认收款"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "订单已核实"
}
```

### 5. 导出订单（CSV格式）

```http
GET /admin/orders/export?start_date=2024-01-01&end_date=2024-01-31
```

**响应：**
```
订单号,用户昵称,套餐名称,金额,状态,创建时间
ORDER_xxx,用户A,月度会员,29.90,待核实,2024-01-01 10:00:00
```

---

## 完整后端代码

### server.js

```javascript
const express = require('express')
const mysql = require('mysql2/promise')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// 数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_helper',
    waitForConnections: true,
    connectionLimit: 10
})

// ============ 用户接口 ============

// 1. 查询会员状态
app.get('/api/member/status', async (req, res) => {
    try {
        const { openid } = req.query
        
        if (!openid) {
            return res.json({ code: -1, message: '缺少openid参数' })
        }
        
        const [rows] = await pool.query(
            'SELECT expire_date FROM user_members WHERE openid = ?',
            [openid]
        )
        
        if (rows.length === 0 || !rows[0].expire_date) {
            return res.json({
                code: 0,
                data: {
                    is_member: false,
                    expire_date: null,
                    days_remaining: 0
                }
            })
        }
        
        const expireDate = new Date(rows[0].expire_date)
        const now = new Date()
        
        if (expireDate <= now) {
            return res.json({
                code: 0,
                data: {
                    is_member: false,
                    expire_date: expireDate.toLocaleString('zh-CN'),
                    days_remaining: 0
                }
            })
        }
        
        const daysRemaining = Math.ceil((expireDate - now) / (24 * 60 * 60 * 1000))
        
        res.json({
            code: 0,
            data: {
                is_member: true,
                expire_date: expireDate.toLocaleString('zh-CN'),
                days_remaining: daysRemaining
            }
        })
    } catch (error) {
        console.error('查询会员状态失败:', error)
        res.json({ code: -1, message: '查询失败' })
    }
})

// 2. 创建订单并开通会员
app.post('/api/member/activate', async (req, res) => {
    const conn = await pool.getConnection()
    
    try {
        const { openid, nick_name, order_number, package_id, package_name, amount, days, device_info } = req.body
        
        if (!openid || !order_number || !days) {
            return res.json({ code: -1, message: '参数错误' })
        }
        
        await conn.beginTransaction()
        
        // 1. 创建订单记录
        const [orderResult] = await conn.query(
            'INSERT INTO orders (order_number, openid, nick_name, package_id, package_name, amount, days, device_info, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [order_number, openid, nick_name, package_id, package_name, amount, days, device_info]
        )
        
        // 2. 更新会员状态
        const [memberRows] = await conn.query(
            'SELECT expire_date FROM user_members WHERE openid = ?',
            [openid]
        )
        
        let newExpireDate
        const now = new Date()
        
        if (memberRows.length === 0) {
            // 新用户
            newExpireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
            await conn.query(
                'INSERT INTO user_members (openid, nick_name, expire_date) VALUES (?, ?, ?)',
                [openid, nick_name, newExpireDate]
            )
        } else {
            // 老用户续费
            const currentExpire = new Date(memberRows[0].expire_date)
            const baseDate = currentExpire > now ? currentExpire : now
            newExpireDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
            
            await conn.query(
                'UPDATE user_members SET expire_date = ?, nick_name = ? WHERE openid = ?',
                [newExpireDate, nick_name, openid]
            )
        }
        
        await conn.commit()
        
        res.json({
            code: 0,
            message: '会员已开通',
            data: {
                expire_date: newExpireDate.toLocaleString('zh-CN'),
                order_id: orderResult.insertId
            }
        })
    } catch (error) {
        await conn.rollback()
        console.error('开通会员失败:', error)
        res.json({ code: -1, message: '开通失败' })
    } finally {
        conn.release()
    }
})

// ============ 管理员接口 ============

// 3. 查询订单列表
app.get('/api/admin/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const status = req.query.status // 0/1/-1 或不传
        const offset = (page - 1) * limit
        
        // 构建查询条件
        let whereClause = ''
        let params = []
        
        if (status !== undefined && status !== '') {
            whereClause = 'WHERE status = ?'
            params.push(parseInt(status))
        }
        
        // 查询统计数据
        const [stats] = await pool.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN status = -1 THEN 1 ELSE 0 END) as abnormal FROM orders'
        )
        
        // 查询列表
        const [rows] = await pool.query(
            `SELECT id, order_number, openid, nick_name, package_id, package_name, amount, days, status, device_info, created_at, verified_at, remark FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        
        res.json({
            code: 0,
            data: {
                total: stats[0].total,
                pending: stats[0].pending,
                verified: stats[0].verified,
                abnormal: stats[0].abnormal,
                page,
                limit,
                list: rows
            }
        })
    } catch (error) {
        console.error('查询订单列表失败:', error)
        res.json({ code: -1, message: '查询失败' })
    }
})

// 4. 核实订单
app.post('/api/admin/orders/:orderId/verify', async (req, res) => {
    try {
        const { orderId } = req.params
        const { status, remark } = req.body
        
        if (![1, -1].includes(status)) {
            return res.json({ code: -1, message: '状态参数错误' })
        }
        
        await pool.query(
            'UPDATE orders SET status = ?, verified_at = NOW(), remark = ? WHERE id = ?',
            [status, remark, orderId]
        )
        
        res.json({
            code: 0,
            message: '订单已核实'
        })
    } catch (error) {
        console.error('核实订单失败:', error)
        res.json({ code: -1, message: '核实失败' })
    }
})

// 5. 导出订单（CSV格式）
app.get('/api/admin/orders/export', async (req, res) => {
    try {
        const { start_date, end_date } = req.query
        
        let whereClause = ''
        let params = []
        
        if (start_date && end_date) {
            whereClause = 'WHERE created_at BETWEEN ? AND ?'
            params = [start_date, end_date + ' 23:59:59']
        }
        
        const [rows] = await pool.query(
            `SELECT order_number, nick_name, package_name, amount, CASE status WHEN 0 THEN '待核实' WHEN 1 THEN '已核实' ELSE '异常' END as status_text, created_at FROM orders ${whereClause} ORDER BY created_at DESC`,
            params
        )
        
        // 生成CSV
        let csv = '订单号,用户昵称,套餐名称,金额,状态,创建时间\n'
        rows.forEach(row => {
            csv += `${row.order_number},${row.nick_name},${row.package_name},${row.amount},${row.status_text},${row.created_at}\n`
        })
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
        res.send('\ufeff' + csv) // 添加BOM以支持Excel打开中文
    } catch (error) {
        console.error('导出订单失败:', error)
        res.json({ code: -1, message: '导出失败' })
    }
})

// 健康检查
app.get('/health', (req, res) => {
    res.send('OK')
})

// 启动服务
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`✅ 会员服务已启动: http://localhost:${PORT}`)
    console.log(`📊 数据库: ${process.env.DB_NAME || 'interview_helper'}`)
})
```

---

## 小程序端集成

### 修改 pages/member/payment/index.js

```javascript
const MemberLocal = require('../../../utils/memberLocal')
const CONFIG = require('../../../config')

// 确认支付完成并激活会员
async confirmPayment() {
    wx.showLoading({ title: '激活中...', mask: true })

    try {
        const { packageInfo, orderInfo } = this.data
        const openid = wx.getStorageSync('openid')
        const userInfo = wx.getStorageSync('userInfo')
        const deviceInfo = wx.getSystemInfoSync()

        // 调用API开通会员并记录订单
        const res = await wx.request({
            url: `${CONFIG.apiBaseUrl}/member/activate`,
            method: 'POST',
            data: {
                openid: openid,
                nick_name: userInfo?.nickName || '用户',
                order_number: orderInfo.orderNumber,
                package_id: packageInfo.id,
                package_name: packageInfo.name,
                amount: packageInfo.price,
                days: packageInfo.duration,
                device_info: `${deviceInfo.platform} ${deviceInfo.system}`
            }
        })

        wx.hideLoading()

        if (res.data.code === 0) {
            wx.showModal({
                title: '✅ 会员已开通',
                content: `过期时间：${res.data.data.expire_date}\n\n我们会在24小时内核对支付记录`,
                confirmText: '开始使用',
                showCancel: false,
                success: () => {
                    wx.redirectTo({
                        url: `/pages/member/payment-result/index?status=success&packageName=${packageInfo.name}`
                    })
                }
            })
        } else {
            throw new Error(res.data.message)
        }
    } catch (error) {
        wx.hideLoading()
        wx.showModal({
            title: '激活失败',
            content: error.message || '请联系客服处理',
            showCancel: false
        })
    }
}
```

---

## 对账流程

### 每日对账步骤

1. **导出订单数据**
```bash
curl "http://localhost:3001/api/admin/orders/export?start_date=2024-01-01&end_date=2024-01-31" > orders.csv
```

2. **查看微信收款记录**
- 打开微信 → 我 → 服务 → 钱包 → 账单
- 筛选"收入"记录

3. **核对订单**
- 对比订单号（在转账备注中）
- 对比金额
- 对比时间

4. **标记已核实**
```bash
curl -X POST http://localhost:3001/api/admin/orders/123/verify \
  -H "Content-Type: application/json" \
  -d '{"status":1,"remark":"已确认收款"}'
```

5. **处理异常订单**
- 未支付但已开通：标记为异常（status=-1）
- 联系用户确认情况

---

## 部署步骤

### 1. 创建数据库表

```bash
mysql -u root -p
CREATE DATABASE interview_helper CHARACTER SET utf8mb4;
USE interview_helper;

# 执行上面的两个建表SQL
```

### 2. 安装依赖

```bash
npm install express mysql2 cors
```

### 3. 启动服务

```bash
# 设置环境变量
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=interview_helper
export PORT=3001

# 启动
node server.js

# 或使用PM2
pm2 start server.js --name member-service
```

---

## 总结

**最终方案特点：**
- ✅ **2张表** - 会员表 + 订单表
- ✅ **5个API** - 查询、开通、订单列表、核实、导出
- ✅ **1个文件** - server.js（~200行）
- ✅ **对账功能** - 完整的订单记录和核实流程
- ✅ **数据追溯** - 所有订单可查可追溯
- ✅ **简单实用** - 易于维护和扩展

**对账优势：**
- 每笔订单都有记录
- 支持按状态筛选
- 支持导出CSV对账
- 支持标记核实状态
- 支持添加备注说明

这个方案既简单又实用，满足对账需求！需要我帮你创建文件并部署吗？
