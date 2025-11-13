# AI面试助手 - 设计系统使用指南

## 📚 目录

1. [设计原则](#设计原则)
2. [颜色系统](#颜色系统)
3. [字体系统](#字体系统)
4. [间距系统](#间距系统)
5. [组件库](#组件库)
6. [工具类](#工具类)
7. [使用示例](#使用示例)

---

## 设计原则

### 一致性 Consistency
- 统一的视觉语言
- 统一的交互模式
- 统一的组件样式

### 简洁性 Simplicity
- 清晰的信息层次
- 简洁的视觉设计
- 直观的操作流程

### 响应性 Responsiveness
- 快速的交互反馈
- 流畅的动画效果
- 及时的状态提示

---

## 颜色系统

### 主题色 Primary Colors

```css
--primary-color: #667eea;        /* 主色 */
--primary-dark: #5568d3;         /* 深色 */
--primary-light: #8b9df8;        /* 浅色 */
--primary-lighter: #e6f2ff;      /* 更浅 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**使用场景**：
- 主要按钮
- 重要信息强调
- 链接文字
- 选中状态

**示例**：
```xml
<view class="btn btn-primary">主要按钮</view>
<text class="text-link">链接文字</text>
```

### 功能色 Functional Colors

#### 成功色 Success
```css
--success-color: #07c160;
--success-light: #e6f7ed;
```
**使用场景**：成功提示、完成状态

#### 警告色 Warning
```css
--warning-color: #ff976a;
--warning-light: #fff3e6;
```
**使用场景**：警告提示、注意事项

#### 危险色 Danger
```css
--danger-color: #ee0a24;
--danger-light: #ffe6e6;
```
**使用场景**：错误提示、删除操作

#### 信息色 Info
```css
--info-color: #1989fa;
--info-light: #e6f4ff;
```
**使用场景**：信息提示、帮助说明

### 文字色 Text Colors

```css
--text-primary: #333333;      /* 主要文字 */
--text-secondary: #666666;    /* 次要文字 */
--text-tertiary: #999999;     /* 辅助文字 */
--text-disabled: #cccccc;     /* 禁用文字 */
--text-white: #ffffff;        /* 白色文字 */
```

**使用规范**：
- 标题、正文：`--text-primary`
- 说明、描述：`--text-secondary`
- 提示、时间：`--text-tertiary`
- 禁用状态：`--text-disabled`

### 背景色 Background Colors

```css
--bg-page: #f5f7fa;          /* 页面背景 */
--bg-card: #ffffff;          /* 卡片背景 */
--bg-hover: #f5f5f5;         /* 悬停背景 */
--bg-active: #eeeeee;        /* 激活背景 */
```

---

## 字体系统

### 字体大小 Font Sizes

| 变量 | 大小 | 用途 |
|------|------|------|
| `--font-xs` | 10px | 极小文字、角标 |
| `--font-sm` | 12px | 辅助文字、标签 |
| `--font-md` | 14px | 正文、按钮 |
| `--font-lg` | 16px | 小标题、重要文字 |
| `--font-xl` | 18px | 标题 |
| `--font-2xl` | 20px | 大标题 |
| `--font-3xl` | 24px | 主标题 |
| `--font-4xl` | 28px | 特大标题 |

### 字体粗细 Font Weights

```css
--font-normal: 400;      /* 常规 */
--font-medium: 500;      /* 中等 */
--font-semibold: 600;    /* 半粗 */
--font-bold: 700;        /* 粗体 */
```

### 行高 Line Heights

```css
--line-height-tight: 1.2;     /* 紧凑 */
--line-height-normal: 1.5;    /* 正常 */
--line-height-relaxed: 1.8;   /* 宽松 */
--line-height-loose: 2;       /* 很宽松 */
```

---

## 间距系统

### 间距规范

| 变量 | 大小 | 用途 |
|------|------|------|
| `--space-xs` | 4px | 极小间距 |
| `--space-sm` | 8px | 小间距 |
| `--space-md` | 12px | 中等间距 |
| `--space-lg` | 16px | 大间距 |
| `--space-xl` | 20px | 超大间距 |
| `--space-2xl` | 24px | 特大间距 |
| `--space-3xl` | 32px | 巨大间距 |

### 使用示例

```xml
<!-- 使用工具类 -->
<view class="p-lg mb-md">
  <text class="mt-sm">内容</text>
</view>

<!-- 使用 CSS 变量 -->
<view style="padding: var(--space-lg); margin-bottom: var(--space-md);">
  内容
</view>
```

---

## 组件库

### 1. 卡片组件 Card

#### 基础卡片
```xml
<view class="card">
  <text class="text-lg text-bold">卡片标题</text>
  <text class="text-secondary mt-sm">卡片内容</text>
</view>
```

#### 扁平卡片
```xml
<view class="card card-flat">
  内容
</view>
```

#### 带边框卡片
```xml
<view class="card card-bordered">
  内容
</view>
```

### 2. 按钮组件 Button

#### 主要按钮
```xml
<button class="btn btn-primary">主要按钮</button>
```

#### 成功按钮
```xml
<button class="btn btn-success">成功按钮</button>
```

#### 轮廓按钮
```xml
<button class="btn btn-outline">轮廓按钮</button>
```

#### 文字按钮
```xml
<button class="btn btn-text">文字按钮</button>
```

#### 圆角按钮
```xml
<button class="btn btn-primary btn-round">圆角按钮</button>
```

#### 尺寸变体
```xml
<button class="btn btn-primary btn-sm">小按钮</button>
<button class="btn btn-primary">默认按钮</button>
<button class="btn btn-primary btn-lg">大按钮</button>
```

#### 块级按钮
```xml
<button class="btn btn-primary btn-block">块级按钮</button>
```

### 3. 标签组件 Tag

```xml
<text class="tag">默认标签</text>
<text class="tag tag-primary">主题标签</text>
<text class="tag tag-success">成功标签</text>
<text class="tag tag-warning">警告标签</text>
<text class="tag tag-danger">危险标签</text>
```

### 4. 徽章组件 Badge

```xml
<view style="position: relative;">
  <image src="/images/icon.png" />
  <view class="badge">99+</view>
</view>

<!-- 圆点徽章 -->
<view style="position: relative;">
  <image src="/images/icon.png" />
  <view class="badge badge-dot"></view>
</view>
```

### 5. 头部组件 Header

#### 渐变头部
```xml
<view class="gradient-header">
  <text class="text-2xl text-bold">页面标题</text>
  <text class="text-sm mt-sm" style="opacity: 0.9;">页面描述</text>
</view>
```

#### 普通头部
```xml
<view class="page-header">
  <text class="page-title">页面标题</text>
</view>
```

---

## 工具类

### 布局工具类

#### Flex 布局
```xml
<!-- 水平居中 -->
<view class="flex-center">
  <text>居中内容</text>
</view>

<!-- 两端对齐 -->
<view class="flex-between">
  <text>左侧</text>
  <text>右侧</text>
</view>

<!-- 垂直布局 -->
<view class="flex-column">
  <text>第一行</text>
  <text>第二行</text>
</view>
```

### 文字工具类

```xml
<!-- 文字颜色 -->
<text class="text-primary">主要文字</text>
<text class="text-secondary">次要文字</text>
<text class="text-tertiary">辅助文字</text>

<!-- 文字大小 -->
<text class="text-sm">小文字</text>
<text class="text-md">正常文字</text>
<text class="text-lg">大文字</text>

<!-- 文字粗细 -->
<text class="text-bold">粗体文字</text>
<text class="text-semibold">半粗体文字</text>

<!-- 文字对齐 -->
<text class="text-center">居中文字</text>
<text class="text-left">左对齐文字</text>
<text class="text-right">右对齐文字</text>

<!-- 文字省略 -->
<text class="text-ellipsis">单行省略文字</text>
<text class="text-line-clamp-2">两行省略文字</text>
```

### 间距工具类

```xml
<!-- Margin -->
<view class="m-lg">四周大间距</view>
<view class="mt-md mb-lg">上中下大</view>
<view class="ml-sm mr-sm">左右小间距</view>

<!-- Padding -->
<view class="p-lg">四周大内边距</view>
<view class="pt-md pb-lg">上中下大</view>
```

### 圆角工具类

```xml
<view class="rounded-sm">小圆角</view>
<view class="rounded-md">中圆角</view>
<view class="rounded-lg">大圆角</view>
<view class="rounded-full">完全圆角</view>
<view class="rounded-circle">圆形</view>
```

### 阴影工具类

```xml
<view class="shadow-sm">小阴影</view>
<view class="shadow-md">中阴影</view>
<view class="shadow-lg">大阴影</view>
```

### 状态工具类

```xml
<view class="loading">加载中</view>
<view class="disabled">禁用状态</view>
<view class="hidden">隐藏</view>
```

---

## 使用示例

### 示例 1：主题卡片

```xml
<view class="card">
  <view class="flex-between mb-md">
    <text class="text-lg text-bold">HDFS 常见问题</text>
    <text class="text-sm text-tertiary">5个问题</text>
  </view>
  
  <text class="text-secondary text-line-clamp-2 mb-md">
    HDFS的架构、读写流程、小文件问题等核心知识点
  </text>
  
  <view class="flex-start">
    <text class="tag tag-primary mr-sm">HDFS</text>
    <text class="tag mr-sm">面试</text>
  </view>
</view>
```

### 示例 2：问题列表项

```xml
<view class="card mb-md">
  <view class="flex-between" bindtap="toggleAnswer">
    <view class="flex-start flex-1">
      <view class="badge" style="position: static; margin-right: 12px;">
        Q1
      </view>
      <text class="text-md flex-1">HDFS的架构是什么？</text>
    </view>
    <text class="text-tertiary">▼</text>
  </view>
  
  <view class="mt-md pt-md" style="border-top: 1px solid var(--border-light);">
    <text class="text-secondary">答案内容...</text>
  </view>
</view>
```

### 示例 3：操作按钮组

```xml
<view class="flex-between p-lg">
  <button class="btn btn-outline btn-sm flex-1 mr-sm">
    收藏
  </button>
  <button class="btn btn-primary btn-sm flex-1 ml-sm">
    开始学习
  </button>
</view>
```

### 示例 4：渐变头部

```xml
<view class="gradient-header">
  <text class="text-2xl text-bold text-white">面试知识库</text>
  <text class="text-sm text-white mt-sm" style="opacity: 0.9;">
    精选大数据技术面试题
  </text>
  
  <view class="flex-start mt-lg">
    <view class="flex-center" style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px;">
      <text class="text-sm text-white">共 200+ 道题</text>
    </view>
  </view>
</view>
```

### 示例 5：空状态

```xml
<view class="flex-column flex-center" style="padding: 60px 20px;">
  <image src="/images/empty.png" style="width: 120px; height: 120px;" />
  <text class="text-tertiary mt-lg">暂无数据</text>
  <button class="btn btn-primary btn-sm mt-lg">
    去添加
  </button>
</view>
```

---

## 最佳实践

### 1. 优先使用工具类

❌ 不推荐：
```xml
<view style="display: flex; align-items: center; padding: 16px;">
  内容
</view>
```

✅ 推荐：
```xml
<view class="flex-center p-lg">
  内容
</view>
```

### 2. 使用 CSS 变量

❌ 不推荐：
```css
.my-button {
  background: #667eea;
  padding: 12px 20px;
  border-radius: 8px;
}
```

✅ 推荐：
```css
.my-button {
  background: var(--primary-color);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
}
```

### 3. 组合使用工具类

```xml
<view class="card p-lg mb-md shadow-md rounded-lg">
  <text class="text-lg text-bold mb-sm">标题</text>
  <text class="text-secondary text-line-clamp-2">内容</text>
</view>
```

### 4. 保持一致性

- 统一使用设计系统中的颜色
- 统一使用设计系统中的间距
- 统一使用设计系统中的圆角
- 统一使用设计系统中的阴影

---

## 扩展建议

### 自定义组件

如果需要创建自定义组件，建议：

1. 基于设计系统的基础样式
2. 使用 CSS 变量保持一致性
3. 提供必要的变体和状态
4. 编写清晰的使用文档

### 主题定制

如果需要更换主题色：

```css
/* 在 app.wxss 中修改 */
page {
  --primary-color: #your-color;
  --primary-gradient: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

---

## 总结

通过使用这套设计系统，你可以：

✅ 快速构建一致的界面
✅ 减少重复的样式代码
✅ 提高开发效率
✅ 保证视觉一致性
✅ 便于维护和扩展

记住：**一致性是优秀用户体验的基础！**
