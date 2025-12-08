# Favorites API 使用说明

## 概述

`favorites-api.js` 是收藏功能的前端 API 客户端，提供了完整的收藏管理功能，包括：
- 收藏的增删改查
- 标签管理
- AI 答案生成（流式输出）

## 基本使用

### 1. 引入模块

```javascript
const FavoritesAPI = require('../../utils/favorites-api.js');
```

### 2. 创建收藏

```javascript
const openid = wx.getStorageSync('openid');

const result = await FavoritesAPI.createFavorite({
    openid: openid,
    question: '什么是Spark RDD？',
    answer: 'RDD是Spark的核心抽象...',
    sourceType: 'knowledge', // knowledge | resume | custom
    sourceId: 'spark-001',
    sourceCategory: 'Spark',
    tags: ['Spark', '核心概念']
});

if (result.success) {
    console.log('收藏成功，ID:', result.favoriteId);
    wx.showToast({ title: '收藏成功', icon: 'success' });
} else {
    console.error('收藏失败:', result.message);
    wx.showToast({ title: result.message, icon: 'none' });
}
```

### 3. 获取收藏列表

```javascript
const openid = wx.getStorageSync('openid');

const result = await FavoritesAPI.getFavorites({
    openid: openid,
    page: 1,
    pageSize: 20,
    tag: 'Spark' // 可选，按标签筛选
});

if (result.success) {
    this.setData({
        favorites: result.favorites,
        total: result.total,
        hasMore: result.hasMore
    });
}
```

### 4. 获取收藏详情

```javascript
const openid = wx.getStorageSync('openid');
const favoriteId = 123;

const result = await FavoritesAPI.getFavoriteDetail(favoriteId, openid);

if (result.success) {
    this.setData({
        favorite: result.favorite
    });
}
```

### 5. 更新收藏

```javascript
const openid = wx.getStorageSync('openid');
const favoriteId = 123;

const result = await FavoritesAPI.updateFavorite(favoriteId, {
    openid: openid,
    question: '更新后的问题',
    tags: ['新标签1', '新标签2']
});

if (result.success) {
    wx.showToast({ title: '更新成功', icon: 'success' });
}
```

### 6. 删除收藏

```javascript
const openid = wx.getStorageSync('openid');
const favoriteId = 123;

wx.showModal({
    title: '确认删除',
    content: '确定要删除这条收藏吗？',
    success: async (res) => {
        if (res.confirm) {
            const result = await FavoritesAPI.deleteFavorite(favoriteId, openid);
            if (result.success) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                // 刷新列表
                this.loadFavorites();
            }
        }
    }
});
```

## 标签管理

### 1. 获取标签列表

```javascript
const openid = wx.getStorageSync('openid');

const result = await FavoritesAPI.getTags(openid);

if (result.success) {
    this.setData({
        tags: result.tags // [{ id, name, useCount }, ...]
    });
}
```

### 2. 添加标签

```javascript
const openid = wx.getStorageSync('openid');
const favoriteId = 123;
const tagName = '重要';

const result = await FavoritesAPI.addTag(favoriteId, tagName, openid);

if (result.success) {
    wx.showToast({ title: '标签添加成功', icon: 'success' });
}
```

### 3. 移除标签

```javascript
const openid = wx.getStorageSync('openid');
const favoriteId = 123;
const tagId = 456;

const result = await FavoritesAPI.removeTag(favoriteId, tagId, openid);

if (result.success) {
    wx.showToast({ title: '标签移除成功', icon: 'success' });
}
```

## AI 答案生成（流式输出）

### 使用示例

```javascript
Page({
    data: {
        question: '',
        answer: '',
        generating: false
    },

    generateAnswer() {
        const openid = wx.getStorageSync('openid');
        const question = this.data.question;

        if (!question || question.length < 5) {
            wx.showToast({ title: '问题至少5个字符', icon: 'none' });
            return;
        }

        this.setData({ generating: true, answer: '' });

        // 调用流式生成
        const task = FavoritesAPI.generateAnswer(
            question,
            openid,
            // onChunk - 接收数据块
            (chunk) => {
                this.setData({
                    answer: this.data.answer + chunk
                });
            },
            // onComplete - 完成
            (fullAnswer) => {
                this.setData({
                    generating: false,
                    answer: fullAnswer
                });
                wx.showToast({ title: '生成完成', icon: 'success' });
            },
            // onError - 错误
            (error, retryable) => {
                this.setData({ generating: false });
                wx.showModal({
                    title: '生成失败',
                    content: error.message,
                    showCancel: retryable,
                    confirmText: retryable ? '重试' : '确定',
                    success: (res) => {
                        if (res.confirm && retryable) {
                            this.generateAnswer();
                        }
                    }
                });
            }
        );

        // 保存任务引用，用于取消
        this.generateTask = task;
    },

    cancelGenerate() {
        if (this.generateTask) {
            this.generateTask.abort();
            this.setData({ generating: false });
            wx.showToast({ title: '已取消', icon: 'none' });
        }
    }
});
```

## 错误处理

所有 API 方法都返回统一的响应格式：

```javascript
{
    success: true/false,
    data: {...},        // 成功时的数据
    message: '...',     // 错误消息
    error: '...',       // 错误详情
    code: '...'         // 错误代码
}
```

### 常见错误处理

```javascript
const result = await FavoritesAPI.createFavorite(data);

if (!result.success) {
    if (result.error === 'QUOTA_EXCEEDED') {
        // 配额超限，引导升级会员
        wx.showModal({
            title: '收藏数量已达上限',
            content: '免费用户最多收藏10条，升级会员解锁无限收藏',
            confirmText: '升级会员',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateTo({ url: '/pages/member/packages/index' });
                }
            }
        });
    } else {
        // 其他错误
        wx.showToast({
            title: result.message || result.error,
            icon: 'none'
        });
    }
}
```

## 重试机制

API 客户端内置了自动重试机制：
- 网络错误：自动重试 2 次
- 服务器错误（5xx）：自动重试 2 次
- 重试延迟：递增延迟（1秒、2秒）

## 注意事项

1. **OpenID 必需**：所有 API 调用都需要提供用户的 OpenID
2. **错误处理**：始终检查 `result.success` 并处理错误情况
3. **流式输出**：使用 `generateAnswer` 时，记得保存任务引用以便取消
4. **标签验证**：标签名称不能为空，最大长度 10 个字符
5. **问题验证**：自定义问题最少 5 个字符

## 完整示例

参考 `pages/favorites/index.js` 查看完整的使用示例。
