# 设计系统迁移指南

## 📋 目录

1. [迁移概述](#迁移概述)
2. [迁移步骤](#迁移步骤)
3. [迁移示例](#迁移示例)
4. [常见问题](#常见问题)
5. [检查清单](#检查清单)

---

## 迁移概述

### 为什么要迁移？

✅ **统一视觉风格** - 所有页面保持一致  
✅ **提高开发效率** - 减少 80% 的样式代码  
✅ **便于维护** - 集中管理，修改方便  
✅ **提升用户体验** - 更现代、更美观

### 迁移策略

采用**渐进式迁移**策略：
1. 新页面直接使用新设计系统
2. 现有页面逐步迁移
3. 优先迁移核心页面
4. 保证每次迁移可测试、可回滚

---

## 迁移步骤

### 第一步：了解设计系统

阅读以下文档：
- `docs/DESIGN_SYSTEM.md` - 完整使用指南
- `docs/DESIGN_SYSTEM_CHEATSHEET.md` - 快速参考
- `docs/DESIGN_SYSTEM_PREVIEW.md` - 可视化预览

### 第二步：分析现有页面

1. 查看页面的 WXML 结构
2. 查看页面的 WXSS 样式
3. 识别可以替换的部分
4. 制定迁移计划

### 第三步：执行迁移

按照以下顺序迁移：
1. 颜色 → CSS 变量
2. 间距 → 工具类
3. 布局 → Flex 工具类
4. 组件 → 标准组件
5. 文字 → 文字工具类

### 第四步：测试验证

1. 功能测试 - 确保功能正常
2. 样式测试 - 确保样式正确
3. 兼容性测试 - 确保多设备兼容
4. 性能测试 - 确保性能良好

### 第五步：清理代码

1. 删除不再使用的样式
2. 删除重复的代码
3. 整理文件结构
4. 更新注释文档

---

## 迁移示例

### 示例 1：颜色迁移

#### 迁移前
```css
/* pages/xxx/index.wxss */
.title {
  color: #333;
}

.subtitle {
  color: #666;
}

.button {
  background: #667eea;
  color: #fff;
}
```

#### 迁移后
```css
/* pages/xxx/index.wxss */
.title {
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
}

.button {
  background: var(--primary-color);
  color: var(--text-white);
}
```

或者直接使用工具类：
```xml
<!-- pages/xxx/index.wxml -->
<text class="text-primary">标题</text>
<text class="text-secondary">副标题</text>
<button class="btn btn-primary">按钮</button>
```

### 示例 2：间距迁移

#### 迁移前
```xml
<view style="padding: 16px; margin-bottom: 12px;">
  <text style="margin-top: 8px;">内容</text>
</view>
```

```css
.container {
  padding: 16px;
  margin-bottom: 12px;
}

.text {
  margin-top: 8px;
}
```

#### 迁移后
```xml
<view class="p-lg mb-md">
  <text class="mt-sm">内容</text>
</view>
```

### 示例 3：布局迁移

#### 迁移前
```xml
<view style="display: flex; align-items: center; justify-content: space-between;">
  <text>左侧</text>
  <text>右侧</text>
</view>
```

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

#### 迁移后
```xml
<view class="flex-between">
  <text>左侧</text>
  <text>右侧</text>
</view>
```

### 示例 4：卡片组件迁移

#### 迁移前
```xml
<view class="card-item">
  <text class="card-title">标题</text>
  <text class="card-content">内容</text>
</view>
```

```css
.card-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-content {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}
```

#### 迁移后
```xml
<view class="card p-lg mb-md">
  <text class="text-lg text-bold">标题</text>
  <text class="text-md text-secondary mt-sm">内容</text>
</view>
```

### 示例 5：按钮迁移

#### 迁移前
```xml
<button class="primary-btn">确定</button>
<button class="outline-btn">取消</button>
```

```css
.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 8px;
  padding: 12px 20px;
  border: none;
}

.outline-btn {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 8px;
  padding: 12px 20px;
}
```

#### 迁移后
```xml
<button class="btn btn-primary">确定</button>
<button class="btn btn-outline">取消</button>
```

### 示例 6：完整页面迁移

#### 迁移前
```xml
<!-- pages/example/index.wxml -->
<view class="page">
  <view class="header">
    <text class="title">页面标题</text>
  </view>
  
  <view class="content">
    <view class="card-item">
      <text class="card-title">卡片标题</text>
      <text class="card-desc">卡片描述</text>
      <view class="tags">
        <text class="tag">标签1</text>
        <text class="tag">标签2</text>
      </view>
    </view>
  </view>
  
  <view class="footer">
    <button class="btn-cancel">取消</button>
    <button class="btn-confirm">确定</button>
  </view>
</view>
```

```css
/* pages/example/index.wxss */
.page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 16px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.content {
  padding: 16px;
}

.card-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-desc {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 999px;
  font-size: 12px;
  color: #666;
}

.footer {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.btn-cancel {
  flex: 1;
  background: transparent;
  border: 1px solid #667eea;
  color: #667eea;
  border-radius: 8px;
  padding: 12px;
}

.btn-confirm {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 8px;
  padding: 12px;
  border: none;
}
```

#### 迁移后
```xml
<!-- pages/example/index.wxml -->
<view class="page-container">
  <view class="gradient-header">
    <text class="text-2xl text-bold text-white">页面标题</text>
  </view>
  
  <view class="p-lg">
    <view class="card p-lg mb-md">
      <text class="text-lg text-bold">卡片标题</text>
      <text class="text-md text-secondary mt-sm">卡片描述</text>
      <view class="flex-start mt-md">
        <text class="tag mr-sm">标签1</text>
        <text class="tag">标签2</text>
      </view>
    </view>
  </view>
  
  <view class="flex-between p-lg">
    <button class="btn btn-outline flex-1 mr-sm">取消</button>
    <button class="btn btn-primary flex-1 ml-sm">确定</button>
  </view>
</view>
```

```css
/* pages/example/index.wxss */
/* 不需要任何自定义样式！全部使用全局样式 */
```

**代码量对比**：
- 迁移前：WXML 30行 + WXSS 80行 = 110行
- 迁移后：WXML 20行 + WXSS 0行 = 20行
- **减少了 82% 的代码量！**

---

## 常见问题

### Q1: 迁移会影响现有功能吗？

**A**: 不会。设计系统只是样式层面的优化，不影响功能逻辑。而且我们采用渐进式迁移，每次迁移都会充分测试。

### Q2: 必须全部迁移吗？

**A**: 不必须。可以：
- 新页面直接使用新设计系统
- 现有页面保持不变
- 需要修改时再迁移

### Q3: 迁移需要多长时间？

**A**: 取决于页面复杂度：
- 简单页面：15-30分钟
- 中等页面：30-60分钟
- 复杂页面：1-2小时

### Q4: 如果设计系统不满足需求怎么办？

**A**: 可以：
1. 使用自定义样式补充
2. 扩展设计系统
3. 提出需求，完善设计系统

### Q5: 迁移后如何回滚？

**A**: 使用 Git 版本控制：
```bash
# 查看提交历史
git log

# 回滚到指定版本
git reset --hard <commit-id>
```

---

## 检查清单

### 迁移前检查

- [ ] 已阅读设计系统文档
- [ ] 已了解工具类用法
- [ ] 已分析现有页面结构
- [ ] 已制定迁移计划
- [ ] 已备份代码（Git commit）

### 迁移中检查

- [ ] 颜色已替换为 CSS 变量
- [ ] 间距已替换为工具类
- [ ] 布局已使用 Flex 工具类
- [ ] 组件已使用标准组件
- [ ] 文字已使用文字工具类
- [ ] 删除了不再使用的样式

### 迁移后检查

- [ ] 功能测试通过
- [ ] 样式显示正确
- [ ] 多设备兼容性良好
- [ ] 性能没有下降
- [ ] 代码已清理
- [ ] 已提交代码（Git commit）

---

## 迁移优先级

### P0 - 高优先级（建议立即迁移）

- 知识库首页
- 知识库详情页（已完成）
- 岗位分析页
- 简历解读页

### P1 - 中优先级（建议本周迁移）

- 情绪小屋页
- 个人中心首页
- 登录页面

### P2 - 低优先级（按需迁移）

- 其他辅助页面
- 不常用页面

---

## 迁移技巧

### 技巧 1：批量替换

使用编辑器的查找替换功能：
- `color: #333` → `color: var(--text-primary)`
- `padding: 16px` → `class="p-lg"`
- `display: flex` → `class="flex"`

### 技巧 2：逐步迁移

不要一次性全部迁移，建议：
1. 先迁移颜色
2. 再迁移间距
3. 然后迁移布局
4. 最后迁移组件

### 技巧 3：保留注释

迁移时保留原有代码的注释：
```css
/* 原样式：padding: 16px; margin-bottom: 12px; */
/* 已迁移为：class="p-lg mb-md" */
```

### 技巧 4：对比测试

迁移后与原页面对比：
- 截图对比
- 功能对比
- 性能对比

---

## 总结

通过遵循本迁移指南，你可以：

✅ 安全地迁移现有页面  
✅ 保证迁移质量  
✅ 提高迁移效率  
✅ 减少迁移风险

**记住：渐进式迁移，每次一小步，最终达成大目标！** 🚀

---

## 相关文档

- `docs/DESIGN_SYSTEM.md` - 设计系统完整指南
- `docs/DESIGN_SYSTEM_CHEATSHEET.md` - 快速参考
- `docs/OPTIMIZATION_PLAN.md` - 优化计划
- `docs/DESIGN_SYSTEM_SUMMARY.md` - 完成总结
