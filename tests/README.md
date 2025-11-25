# 测试文档

本目录包含项目的所有自动化测试文件。

## 📋 测试文件

### 自动化测试（4个文件）

1. **auth-flow.test.js** - 认证流程测试（12个用例）
   - 首次启动自动登录
   - Token过期重新登录
   - 网络断开本地降级

2. **member-payment-flow.test.js** - 会员购买流程测试（24个用例）
   - 套餐选择功能
   - 收款码展示
   - 支付确认和会员激活
   - 会员信息显示

3. **member-verification.test.js** - 会员验证测试（12个用例）
   - 有效会员访问AI功能
   - 无效会员跳转购买页面
   - 会员过期提示
   - 会员状态刷新

4. **edge-cases.test.js** - 边界情况测试（25个用例）
   - 删除本地存储后的行为
   - 会员到期边界时间
   - 并发访问情况
   - 异常数据处理

### 测试文档

- **test-summary.md** - 完整测试总结报告

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# 认证流程测试
npm run test:auth

# 会员购买流程测试
npm run test:payment

# 会员验证测试
npm run test:verification

# 边界情况测试
npm test edge-cases.test.js
```

### 查看测试覆盖率

```bash
npm run test:coverage
```

---

## 📊 测试统计

| 测试类别 | 测试用例数 | 状态 |
|---------|-----------|------|
| 认证流程 | 12 | ✅ 通过 |
| 会员购买 | 24 | ✅ 通过 |
| 会员验证 | 12 | ✅ 通过 |
| 边界情况 | 25 | ✅ 通过 |
| **总计** | **73** | **✅ 100%** |

---

## 🧪 测试覆盖的模块

### 核心工具模块
- ✅ `utils/simpleAuth.js` - 认证模块
- ✅ `utils/memberLocal.js` - 会员管理模块
- ✅ `utils/auth.js` - 认证兼容层

### 页面模块
- ✅ `pages/member/payment/index.js` - 会员支付页面
- ✅ `pages/member/payment-result/index.js` - 支付结果页面
- ✅ `pages/ai/job/index.js` - 岗位分析页面
- ✅ `pages/ai/resume/index.js` - 简历解读页面
- ✅ `pages/ai/mood/index.js` - 情绪小屋页面

---

## 🔧 测试技术栈

- **测试框架**：Jest 29.7.0
- **断言库**：Jest内置
- **Mock工具**：Jest Mock Functions
- **覆盖率工具**：Jest Coverage

---

## 📝 测试说明

### 微信API模拟
所有测试使用自定义的微信API mock，不依赖真实的微信环境：
- `wx.login()` - 模拟微信登录
- `wx.request()` - 模拟网络请求
- `wx.getStorageSync()` / `wx.setStorageSync()` - 模拟本地存储

### 时间相关测试
涉及日期计算的测试允许合理的误差范围（通常1秒）

### 测试隔离
每个测试用例都是独立的：
- 使用 `beforeEach` 清理测试环境
- 使用 `jest.clearAllMocks()` 清除mock调用记录
- 使用 `MemberLocal.clearMemberCache()` 清除缓存

---

## 🐛 故障排查

### 测试失败

如果测试失败，请检查：
1. Jest是否正确安装：`npm list jest`
2. 模块路径是否正确
3. Mock配置是否正确
4. 测试环境是否干净

### 运行错误

```bash
# 清除Jest缓存
npm test -- --clearCache

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 相关文档

- [测试总结](./test-summary.md) - 完整的测试结果和统计
- [项目文档](../docs/README.md) - 项目整体文档

---

**最后更新**：2025-11-25  
**测试状态**：✅ 全部通过（73/73）
