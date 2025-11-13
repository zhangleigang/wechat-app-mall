# 设计系统速查表 Cheat Sheet

## 🎨 颜色速查

```css
/* 主题色 */
var(--primary-color)          #667eea
var(--primary-gradient)       渐变紫色

/* 功能色 */
var(--success-color)          #07c160  绿色
var(--warning-color)          #ff976a  橙色
var(--danger-color)           #ee0a24  红色
var(--info-color)             #1989fa  蓝色

/* 文字色 */
var(--text-primary)           #333     主要文字
var(--text-secondary)         #666     次要文字
var(--text-tertiary)          #999     辅助文字
```

## 📏 间距速查

```
xs: 4px   sm: 8px   md: 12px   lg: 16px   xl: 20px   2xl: 24px
```

## 🔤 字体速查

```
xs: 10px  sm: 12px  md: 14px  lg: 16px  xl: 18px  2xl: 20px
```

## 📦 常用组件

### 卡片
```xml
<view class="card">内容</view>
<view class="card card-flat">扁平卡片</view>
```

### 按钮
```xml
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-outline">轮廓按钮</button>
<button class="btn btn-primary btn-round">圆角按钮</button>
```

### 标签
```xml
<text class="tag">标签</text>
<text class="tag tag-primary">主题标签</text>
```

## 🔧 常用工具类

### 布局
```xml
<view class="flex-center">居中</view>
<view class="flex-between">两端对齐</view>
<view class="flex-column">垂直布局</view>
```

### 文字
```xml
<text class="text-primary">主要文字</text>
<text class="text-sm">小文字</text>
<text class="text-bold">粗体</text>
<text class="text-center">居中</text>
<text class="text-ellipsis">省略</text>
```

### 间距
```xml
<view class="p-lg">内边距大</view>
<view class="m-md">外边距中</view>
<view class="mt-sm mb-lg">上小下大</view>
```

### 圆角
```xml
<view class="rounded-sm">小圆角</view>
<view class="rounded-lg">大圆角</view>
<view class="rounded-full">完全圆角</view>
```

### 阴影
```xml
<view class="shadow-sm">小阴影</view>
<view class="shadow-md">中阴影</view>
<view class="shadow-lg">大阴影</view>
```

## 💡 快速示例

### 主题卡片
```xml
<view class="card p-lg mb-md">
  <text class="text-lg text-bold mb-sm">标题</text>
  <text class="text-secondary">内容</text>
</view>
```

### 渐变头部
```xml
<view class="gradient-header">
  <text class="text-2xl text-bold text-white">标题</text>
</view>
```

### 按钮组
```xml
<view class="flex-between p-lg">
  <button class="btn btn-outline flex-1 mr-sm">取消</button>
  <button class="btn btn-primary flex-1 ml-sm">确定</button>
</view>
```

## 📱 响应式

```css
/* 使用 rpx 单位 */
width: 750rpx;  /* 屏幕宽度 */

/* 使用百分比 */
width: 100%;

/* 使用 flex */
flex: 1;
```

## 🎯 最佳实践

1. ✅ 优先使用工具类
2. ✅ 使用 CSS 变量
3. ✅ 保持一致性
4. ✅ 组合使用类名
5. ❌ 避免内联样式

## 🔗 完整文档

查看 `docs/DESIGN_SYSTEM.md` 获取完整文档和更多示例。
