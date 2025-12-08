# Favorite Button Component

收藏按钮组件，用于在知识库详情页和简历解读页添加收藏功能。

## 功能特性

- ✅ 收藏/取消收藏切换
- ✅ 状态切换动画（缩放+旋转）
- ✅ 触觉反馈（震动）
- ✅ 加载状态显示
- ✅ 自动处理简历来源标签
- ✅ 错误处理和用户提示
- ✅ 支持三种尺寸（small, medium, large）

## 使用方法

### 1. 在页面 JSON 中引入组件

```json
{
  "usingComponents": {
    "favorite-button": "/components/favorite-button/index"
  }
}
```

### 2. 在 WXML 中使用

```xml
<!-- 知识库问题收藏 -->
<favorite-button
  question-id="{{questionId}}"
  question="{{question}}"
  answer="{{answer}}"
  source-type="knowledge"
  source-category="{{category}}"
  is-favorited="{{isFavorited}}"
  favorite-id="{{favoriteId}}"
  size="medium"
  bind:favoritechange="onFavoriteChange"
/>

<!-- 简历解读问答收藏 -->
<favorite-button
  question="{{qaItem.question}}"
  answer="{{qaItem.answer}}"
  source-type="resume"
  is-favorited="{{qaItem.isFavorited}}"
  favorite-id="{{qaItem.favoriteId}}"
  size="small"
  bind:favoritechange="onFavoriteChange"
/>
```

### 3. 在 JS 中处理事件

```javascript
Page({
  data: {
    questionId: 'hdfs-001',
    question: 'HDFS的工作原理是什么？',
    answer: '# HDFS工作原理\n\n...',
    category: 'HDFS',
    isFavorited: false,
    favoriteId: 0
  },

  onFavoriteChange(e) {
    const { favorited, favoriteId } = e.detail
    
    this.setData({
      isFavorited: favorited,
      favoriteId: favoriteId
    })
    
    console.log('收藏状态变化:', favorited, favoriteId)
  }
})
```

## 属性说明

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| questionId | String | '' | 否 | 问题ID（知识库来源时使用） |
| question | String | '' | 是 | 问题文本 |
| answer | String | '' | 是 | 答案内容（Markdown格式） |
| sourceType | String | 'knowledge' | 是 | 来源类型：knowledge/resume/custom |
| sourceCategory | String | '' | 否 | 来源分类（如HDFS、Spark等） |
| isFavorited | Boolean | false | 否 | 初始收藏状态 |
| favoriteId | Number | 0 | 否 | 收藏ID（已收藏时必填） |
| size | String | 'medium' | 否 | 按钮尺寸：small/medium/large |

## 事件说明

### favoritechange

收藏状态变化时触发

**事件对象 detail:**
```javascript
{
  favorited: true,    // 当前收藏状态
  favoriteId: 123     // 收藏ID（取消收藏时为0）
}
```

## 样式定制

组件使用了以下 CSS 变量，可以在父组件中覆盖：

```css
/* 自定义星星颜色 */
.favorite-button .favorite-icon.favorited .icon {
  color: #FF6B6B; /* 自定义颜色 */
}

/* 自定义尺寸 */
.favorite-button.custom .favorite-icon .icon {
  font-size: 28px;
}
```

## 动画效果

- **收藏动画**: 缩放1.3倍 + 旋转15度
- **取消收藏动画**: 缩放1.3倍 + 旋转15度
- **加载状态**: 脉冲动画（透明度变化）
- **点击反馈**: 缩放0.95倍

## 触觉反馈

- **点击按钮**: 轻微震动（light）
- **操作成功**: 中等震动（medium）

## 错误处理

组件会自动处理以下错误：

1. **未登录**: 提示"请先登录"
2. **网络错误**: 显示错误信息
3. **参数缺失**: 提示"问题或答案不能为空"
4. **收藏ID不存在**: 提示"收藏ID不存在"

## 注意事项

1. 使用前确保用户已登录（有 openid）
2. 取消收藏时必须提供 favoriteId
3. 简历来源会自动添加"简历分析"标签
4. 组件会自动调用 favorites-api.js 的接口

## 依赖

- `utils/favorites-api.js` - 收藏API客户端
- 微信小程序 API：wx.vibrateShort, wx.showToast, wx.getStorageSync

## 示例截图

```
未收藏状态: ☆ (灰色空心星)
已收藏状态: ★ (金色实心星 + 光晕)
加载状态:   ★ (半透明 + 脉冲动画)
```

## 更新日志

### v1.0.0 (2024-12-08)
- ✅ 初始版本
- ✅ 实现收藏/取消收藏功能
- ✅ 添加状态切换动画
- ✅ 添加触觉反馈
- ✅ 支持三种尺寸
- ✅ 自动处理简历标签
