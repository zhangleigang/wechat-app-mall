# AI面试助手 - 微信小程序

基于微信小程序的智能职业发展工具，专注于大数据领域的技术面试准备。

## ✨ 核心功能

- 🎯 **AI岗位分析** - 智能分析职位描述，生成预测面试问题
- 📝 **简历解读** - AI驱动的简历分析和优化建议
- 💭 **情绪小屋** - 面试压力管理和心理支持
- 📚 **知识库** - 200+大数据技术面试题库（HDFS、Spark、Flink、Kafka等）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/wechat-app-mall.git
cd wechat-app-mall
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置项目

编辑 `config.js` 文件：

```javascript
module.exports = {
  // AI服务配置
  aiApiUrl: 'https://your-ai-api.com',
  
  // 知识库API配置
  knowledgeApiUrl: 'https://api.feelnow.cn:8443/api',
  
  // 收款码配置（会员支付）
  paymentQrcode: {
    url: 'https://your-image-url.com/qrcode.jpg',
    accountName: '你的姓名',
    enabled: true
  }
}
```

### 4. 在微信开发者工具中打开

1. 打开微信开发者工具
2. 导入项目
3. 填写 AppID
4. 开始开发

## 📦 技术栈

- **前端框架**：微信小程序原生开发
- **UI组件**：Vant Weapp 1.11.6
- **日期处理**：Day.js 1.11.6
- **富文本渲染**：mp-html 2.3.1
- **后端服务**：Node.js + Express（知识库API）

## 🧪 测试

### 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试
npm test

# 运行特定测试
npm run test:auth          # 认证流程测试（12个用例）
npm run test:payment       # 会员购买流程测试（24个用例）
npm run test:verification  # 会员验证测试（12个用例）
npm test edge-cases.test.js  # 边界情况测试（25个用例）

# 查看测试覆盖率
npm run test:coverage
```

### 测试文件

- `tests/auth-flow.test.js` - 认证流程测试
  - 首次启动自动登录
  - Token过期重新登录
  - 网络断开本地降级

- `tests/member-payment-flow.test.js` - 会员购买流程测试
  - 套餐选择功能
  - 收款码展示
  - 支付确认和会员激活
  - 会员信息显示

- `tests/member-verification.test.js` - 会员验证测试
  - 有效会员访问AI功能
  - 无效会员跳转购买页面
  - 会员过期提示
  - 会员状态刷新

- `tests/edge-cases.test.js` - 边界情况测试
  - 删除本地存储后的行为
  - 会员到期边界时间
  - 并发访问情况
  - 异常数据处理

### 测试统计

| 测试类别 | 测试用例数 | 状态 |
|---------|-----------|------|
| 认证流程 | 12 | ✅ 通过 |
| 会员购买 | 24 | ✅ 通过 |
| 会员验证 | 12 | ✅ 通过 |
| 边界情况 | 25 | ✅ 通过 |
| **总计** | **73** | **✅ 100%** |

详细测试报告请查看：[tests/test-summary.md](./tests/test-summary.md)

## 📖 文档

### 配置文档
- [配置指南](./docs/SETUP_GUIDE.md) - 详细配置说明
- [支付方案](./docs/PERSONAL_QRCODE_IMPLEMENTATION.md) - 会员支付实现

### 技术文档
- [系统架构](./docs/technical/ARCHITECTURE.md) - 架构设计文档

### 测试文档
- [测试总结](./tests/test-summary.md) - 完整测试报告（73个测试用例）

### 验证文档
- [最终验证报告](./docs/FINAL_VERIFICATION_REPORT.md) - 项目验证结果

## 📂 项目结构

```
wechat-app-mall/
├── pages/              # 页面模块
│   ├── ai/            # AI功能（岗位/简历/情绪）
│   ├── knowledge/     # 知识库
│   ├── member/        # 会员系统
│   ├── my/            # 个人中心
│   └── login/         # 登录
├── utils/             # 工具模块
│   ├── simpleAuth.js  # 认证模块
│   ├── memberLocal.js # 会员管理
│   ├── ai.js          # AI服务接口
│   └── knowledge-api.js # 知识库API
├── components/        # 自定义组件
├── tests/             # 测试文件
├── docs/              # 文档
├── knowledge-api/     # 知识库后端服务
├── config.js          # 应用配置
└── app.js             # 应用入口
```

## 💡 核心特性

### 会员系统
- ✅ 本地会员管理（不依赖第三方）
- ✅ 收款码支付方案（零成本）
- ✅ 自动会员验证
- ✅ 到期提醒

### 认证系统
- ✅ 自动静默登录
- ✅ Token自动管理（30天有效期）
- ✅ 网络失败本地降级

### 知识库
- ✅ 10+技术分类
- ✅ 200+面试问题
- ✅ 详细答案解析
- ✅ 关键词搜索

## 🔧 开发

### 本地开发

```bash
# 启动知识库API（可选）
cd knowledge-api
npm install
npm start
```

### 构建npm包

在微信开发者工具中：
1. 工具 → 构建 npm
2. 等待构建完成

### 代码规范

- 使用 ES6+ 语法
- 遵循微信小程序开发规范
- 保持代码简洁清晰

## 📊 性能指标

- **代码包大小**：约1.5MB（限制2MB）
- **测试覆盖率**：100%（73个测试用例）
- **页面数量**：17个核心页面
- **组件数量**：3个自定义组件

## ⚠️ 注意事项

1. **会员支付**：当前使用个人收款码方案，适合初期用户量 < 50人
2. **数据存储**：使用微信本地存储，总限制10MB
3. **包体积**：已排除docs文件夹，注意控制图片大小

## 🔄 升级路径

### 当前阶段（0-50用户）
✅ 个人收款码 - 零成本快速上线

### 成长期（50-200用户）
- 商家收款码（0.6%手续费）
- 第三方支付服务

### 成熟期（>200用户）
- 微信云开发（¥240/年）
- 完全自主可控

## 📝 更新日志

### v8.4.0 (2025-11-25)
- ✅ 移除 apifm 依赖
- ✅ 实现本地会员管理
- ✅ 添加收款码支付方案
- ✅ 完善测试覆盖（73个测试用例）
- ✅ 优化项目结构和文档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License

## 📞 联系方式

如有问题，请查看[项目文档](./docs/README.md)或提交 Issue。

---

**最后更新**：2025-11-25  
**当前版本**：8.4.0  
**状态**：✅ 生产就绪
