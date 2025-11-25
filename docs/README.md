# AI面试助手 - 项目文档

## 📚 核心文档

### 实现方案
- 📄 [个人收款码支付方案](./PERSONAL_QRCODE_IMPLEMENTATION.md) - 会员支付实现指南
- 📄 [配置指南](./SETUP_GUIDE.md) - 项目配置说明
- 📄 [最终验证报告](./FINAL_VERIFICATION_REPORT.md) - 项目验证结果

### 测试文档
- 📄 [测试总结](../tests/test-summary.md) - 完整测试报告（73个测试用例）
- 📄 [测试说明](../tests/README.md) - 如何运行测试

---

## 🚀 快速开始

### 1. 配置收款码（5分钟）

```javascript
// config.js
module.exports = {
  paymentQrcode: {
    url: 'https://your-image-url.com/qrcode.jpg', // 你的收款码URL
    accountName: '张三', // 收款人姓名
    enabled: true
  }
}
```

### 2. 配置知识库API（可选）

```javascript
// config.js
module.exports = {
  knowledgeApiUrl: 'https://api.feelnow.cn:8443/api', // 知识库API地址
  // 或使用本地开发: 'http://localhost:3000/api'
}
```

### 3. 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage
```

---

## 💡 核心功能

### 用户功能
- ✅ **AI岗位分析** - 分析职位描述，生成面试问题
- ✅ **简历解读** - AI驱动的简历分析和优化建议
- ✅ **情绪小屋** - 面试压力管理和心理支持
- ✅ **知识库** - 200+大数据面试题库

### 会员系统
- ✅ **本地会员管理** - 不依赖第三方服务
- ✅ **收款码支付** - 零成本支付方案
- ✅ **会员验证** - 自动验证会员状态
- ✅ **到期提醒** - 会员到期自动提醒

### 认证系统
- ✅ **自动登录** - 首次启动自动登录
- ✅ **Token管理** - 30天有效期，自动续期
- ✅ **本地降级** - 网络失败时本地登录

---

## 📊 技术架构

### 前端技术栈
- 微信小程序 SDK 8.4.0
- Vant Weapp 1.11.6（UI组件）
- Day.js 1.11.6（日期处理）
- mp-html 2.3.1（富文本渲染）

### 后端服务
- **AI服务** - 自定义AI后端
- **知识库API** - Node.js/Express服务
- **会员管理** - 本地存储方案

### 核心模块
```
utils/
├── simpleAuth.js      # 认证模块（登录/登出/Token管理）
├── memberLocal.js     # 会员管理（激活/验证/状态查询）
├── ai.js              # AI服务接口
├── knowledge-api.js   # 知识库API接口
└── tools.js           # 通用工具函数
```

---

## 🧪 测试覆盖

| 测试类别 | 测试用例数 | 状态 |
|---------|-----------|------|
| 认证流程 | 12 | ✅ 通过 |
| 会员购买 | 24 | ✅ 通过 |
| 会员验证 | 12 | ✅ 通过 |
| 边界情况 | 25 | ✅ 通过 |
| **总计** | **73** | **✅ 100%** |

---

## 📦 项目结构

```
wechat-app-mall/
├── pages/              # 页面模块
│   ├── ai/            # AI功能（岗位/简历/情绪）
│   ├── knowledge/     # 知识库
│   ├── member/        # 会员系统
│   ├── my/            # 个人中心
│   └── login/         # 登录
├── utils/             # 工具模块
├── components/        # 自定义组件
├── tests/             # 测试文件
├── docs/              # 文档
├── knowledge-api/     # 知识库后端
├── config.js          # 应用配置
└── app.js             # 应用入口
```

---

## ⚠️ 注意事项

### 会员支付
- 当前使用个人收款码方案（零成本）
- 需要手动确认收款并激活会员
- 适合初期用户量 < 50人

### 数据存储
- 会员数据存储在本地（wx.storage）
- 用户数据存储在本地（wx.storage）
- 总存储限制：10MB

### 包体积
- 当前代码包：约1.5MB
- 小程序限制：2MB
- 已排除 docs/ 文件夹

---

## 🔄 升级路径

### 当前阶段（0-50用户）
✅ 个人收款码 - 零成本快速上线

### 成长期（50-200用户）
可选升级：
- 商家收款码（0.6%手续费）
- 第三方支付服务

### 成熟期（>200用户）
推荐升级：
- 微信云开发（¥240/年）
- 完全自主可控

---

## 📞 相关链接

- [个人收款码实现指南](./PERSONAL_QRCODE_IMPLEMENTATION.md)
- [配置指南](./SETUP_GUIDE.md)
- [测试文档](../tests/README.md)
- [最终验证报告](./FINAL_VERIFICATION_REPORT.md)

---

**最后更新**：2025-11-25  
**当前版本**：8.4.0  
**状态**：✅ 生产就绪
