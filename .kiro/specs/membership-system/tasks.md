# 会员系统开发任务清单

## P0 任务（必须实现）

### 任务 1: 会员套餐选择页面

**优先级**: P0  
**预估工时**: 4小时  
**状态**: 待开始

**任务描述**:
创建会员套餐选择页面，展示不同会员套餐的价格和权益，用户可以选择套餐进行购买。

**技术要点**:
- 页面路径: `pages/member/packages/index`
- 使用Vant UI的Card、Button组件
- 展示3种套餐：月度、季度、年度
- 突出显示推荐套餐（季度会员）
- 点击套餐后跳转到支付确认页面

**验收标准**:
- [ ] 页面UI美观，符合设计规范
- [ ] 3种套餐信息展示完整（价格、时长、权益）
- [ ] 套餐可以正常选择
- [ ] 点击"立即开通"按钮跳转正确

**相关文件**:
- `pages/member/packages/index.js`
- `pages/member/packages/index.json`
- `pages/member/packages/index.wxml`
- `pages/member/packages/index.wxss`

---

### 任务 2: 会员支付流程实现

**优先级**: P0  
**预估工时**: 6小时  
**状态**: 待开始

**任务描述**:
实现完整的会员支付流程，包括订单创建、微信支付调用、支付结果处理。

**技术要点**:
- 集成apifm的订单系统
- 调用微信支付接口 `wx.requestPayment`
- 实现支付状态轮询
- 支付成功后更新会员状态
- 支付失败提供重试选项

**实现步骤**:
1. 创建会员订单（调用apifm接口）
2. 获取支付参数
3. 调用微信支付
4. 监听支付结果
5. 更新本地会员状态
6. 跳转到支付结果页面

**验收标准**:
- [ ] 可以成功创建会员订单
- [ ] 微信支付可以正常调起
- [ ] 支付成功后会员状态正确更新
- [ ] 支付失败有友好提示
- [ ] 支付过程中有加载状态提示

**相关文件**:
- `utils/member.js` - 会员相关工具函数
- `pages/member/payment/index.js` - 支付确认页面
- `pages/member/payment-result/index.js` - 支付结果页面

**API接口**:
- 创建订单: `WXAPI.orderCreate()`
- 获取支付参数: `WXAPI.paymentOrder()`
- 查询订单状态: `WXAPI.orderDetail()`

---

### 任务 3: 会员状态验证机制

**优先级**: P0  
**预估工时**: 5小时  
**状态**: 待开始

**任务描述**:
在所有AI功能入口处添加会员状态验证，非会员或会员已到期时显示引导弹窗。

**技术要点**:
- 创建会员验证工具函数 `utils/member.js`
- 实现会员状态查询和缓存
- 创建会员引导弹窗组件
- 在AI功能页面的onLoad中调用验证

**需要验证的页面**:
- `pages/ai/job/index.js` - 岗位分析
- `pages/ai/resume/index.js` - 简历解读
- `pages/ai/mood/index.js` - 情绪小屋
- `pages/knowledge/detail.js` - 知识库详情

**验证逻辑**:
```javascript
// utils/member.js
async function checkMemberStatus() {
  // 1. 检查登录状态
  if (!AUTH.checkHasLogined()) {
    return { isValid: false, reason: 'not_login' }
  }
  
  // 2. 从缓存读取会员状态
  let memberInfo = wx.getStorageSync('memberInfo')
  const cacheTime = wx.getStorageSync('memberInfoTime')
  
  // 3. 缓存过期或不存在，从服务器获取
  if (!memberInfo || Date.now() - cacheTime > 3600000) {
    const res = await WXAPI.cardMyList(wx.getStorageSync('token'))
    if (res.code === 0) {
      memberInfo = parseMemberInfo(res.data)
      wx.setStorageSync('memberInfo', memberInfo)
      wx.setStorageSync('memberInfoTime', Date.now())
    }
  }
  
  // 4. 验证会员状态
  if (!memberInfo || !memberInfo.isValid) {
    return { isValid: false, reason: 'not_member' }
  }
  
  // 5. 验证是否过期
  if (new Date(memberInfo.expireDate) < new Date()) {
    return { isValid: false, reason: 'expired' }
  }
  
  return { isValid: true, memberInfo }
}
```

**验收标准**:
- [ ] 会员验证函数正确实现
- [ ] 非会员无法访问AI功能
- [ ] 会员到期后无法访问AI功能
- [ ] 验证失败时显示引导弹窗
- [ ] 弹窗提供"立即开通"按钮
- [ ] 会员状态正确缓存和刷新

**相关文件**:
- `utils/member.js` - 会员工具函数
- `components/member-guard/index.js` - 会员引导弹窗组件

---

### 任务 4: 个人中心会员信息展示

**优先级**: P0  
**预估工时**: 3小时  
**状态**: 待开始

**任务描述**:
在个人中心页面优化会员信息展示，增加开通/续费入口。

**技术要点**:
- 优化现有的会员信息卡片UI
- 增加会员权益说明
- 添加"开通会员"/"续费会员"按钮
- 显示会员到期倒计时
- 会员到期前7天显示续费提醒

**UI设计要求**:
- 会员卡片使用渐变背景
- 未开通会员显示灰色样式
- 已开通会员显示金色/紫色样式
- 到期时间醒目显示
- 按钮样式突出

**验收标准**:
- [ ] 会员状态正确显示（已开通/未开通）
- [ ] 会员类型正确显示（月度/季度/年度）
- [ ] 到期时间正确显示
- [ ] 点击"开通会员"跳转到套餐页面
- [ ] 到期前7天显示续费提醒
- [ ] 会员权益说明清晰

**相关文件**:
- `pages/my/index.js` - 个人中心页面
- `pages/my/index.wxml` - 个人中心模板
- `pages/my/index.wxss` - 个人中心样式

---

### 任务 5: 会员权益说明页面

**优先级**: P0  
**预估工时**: 2小时  
**状态**: 待开始

**任务描述**:
创建会员权益详细说明页面，让用户了解开通会员后可以享受的所有权益。

**技术要点**:
- 页面路径: `pages/member/benefits/index`
- 使用图标+文字展示权益
- 对比会员与非会员的差异
- 提供"立即开通"按钮

**展示内容**:
- ✅ 无限次岗位分析
- ✅ 无限次简历解读
- ✅ 无限次情绪支持
- ✅ 完整知识库访问
- ✅ 优先客服支持
- ✅ 数据云端保存
- ✅ 多设备同步

**验收标准**:
- [ ] 页面UI美观清晰
- [ ] 所有权益展示完整
- [ ] 会员与非会员对比明确
- [ ] 提供开通入口

**相关文件**:
- `pages/member/benefits/index.js`
- `pages/member/benefits/index.json`
- `pages/member/benefits/index.wxml`
- `pages/member/benefits/index.wxss`

---

## 配置任务

### 任务 6: 在app.json中注册新页面

**优先级**: P0  
**预估工时**: 0.5小时  
**状态**: 待开始

**任务描述**:
在app.json中注册所有新增的会员相关页面。

**需要注册的页面**:
```json
{
  "pages": [
    "pages/member/packages/index",
    "pages/member/payment/index",
    "pages/member/payment-result/index",
    "pages/member/benefits/index"
  ]
}
```

**验收标准**:
- [ ] 所有页面正确注册
- [ ] 页面可以正常跳转

---

### 任务 7: 配置微信支付

**优先级**: P0  
**预估工时**: 1小时  
**状态**: 待开始

**任务描述**:
在微信小程序后台和apifm后台配置微信支付相关参数。

**配置步骤**:
1. 在微信小程序后台开通微信支付
2. 配置支付密钥
3. 在apifm后台配置商户号
4. 配置支付回调地址
5. 测试支付流程

**验收标准**:
- [ ] 微信支付配置完成
- [ ] 可以正常调起支付
- [ ] 支付回调正常

---

## 测试任务

### 任务 8: 会员系统功能测试

**优先级**: P0  
**预估工时**: 3小时  
**状态**: 待开始

**测试场景**:

**场景1: 新用户开通会员**
1. 新用户进入小程序
2. 点击AI功能，提示需要开通会员
3. 点击"立即开通"
4. 选择套餐
5. 完成支付
6. 验证会员状态已更新
7. 可以正常使用AI功能

**场景2: 会员到期处理**
1. 会员到期前7天显示续费提醒
2. 会员到期后无法使用AI功能
3. 点击续费，选择套餐
4. 完成支付后，到期时间延长

**场景3: 支付异常处理**
1. 支付过程中取消支付
2. 支付失败重试
3. 网络异常处理

**场景4: 会员状态缓存**
1. 验证会员状态缓存机制
2. 缓存过期后自动刷新
3. 多次访问不重复请求

**验收标准**:
- [ ] 所有测试场景通过
- [ ] 无明显bug
- [ ] 用户体验流畅

---

## 开发顺序建议

1. **任务 6**: 注册页面（5分钟）
2. **任务 1**: 会员套餐选择页面（4小时）
3. **任务 5**: 会员权益说明页面（2小时）
4. **任务 7**: 配置微信支付（1小时）
5. **任务 2**: 会员支付流程实现（6小时）
6. **任务 3**: 会员状态验证机制（5小时）
7. **任务 4**: 个人中心会员信息展示（3小时）
8. **任务 8**: 功能测试（3小时）

**总计**: 约24.5小时（3个工作日）

---

## 技术依赖

### 需要的工具函数

创建 `utils/member.js`:
```javascript
// 会员相关工具函数
module.exports = {
  // 检查会员状态
  checkMemberStatus: async function() {},
  
  // 获取会员信息
  getMemberInfo: async function() {},
  
  // 刷新会员状态
  refreshMemberStatus: async function() {},
  
  // 计算到期天数
  getDaysToExpire: function(expireDate) {},
  
  // 格式化会员类型
  formatMemberType: function(days) {},
  
  // 清除会员缓存
  clearMemberCache: function() {}
}
```

### 需要的组件

创建 `components/member-guard/index`:
```javascript
// 会员验证引导弹窗组件
Component({
  properties: {
    show: Boolean,
    reason: String // 'not_login' | 'not_member' | 'expired'
  },
  methods: {
    // 立即开通
    handleOpen() {},
    
    // 关闭弹窗
    handleClose() {}
  }
})
```

---

## 注意事项

1. **支付安全**: 所有支付相关操作必须在服务端验证
2. **会员验证**: 前端验证仅用于用户体验，后端必须再次验证
3. **缓存策略**: 会员状态缓存1小时，避免频繁请求
4. **错误处理**: 所有异步操作都要有完善的错误处理
5. **用户体验**: 支付流程要流畅，加载状态要明确
6. **测试充分**: 上线前必须在真机上完整测试支付流程

---

## 后续优化（P1/P2）

- [ ] 实现自动续费功能
- [ ] 增加会员等级体系
- [ ] 实现推荐好友奖励
- [ ] 增加会员专属功能
- [ ] 提供企业团队套餐
- [ ] 增加使用统计页面
- [ ] 完善系统设置功能
