# 微信小程序开发限制规范

本文档记录微信小程序开发中的各种API限制和最佳实践，避免重复踩坑。

## API 限制

### wx.showModal 限制

**重要：`confirmText` 和 `cancelText` 参数有严格的字符长度限制**

- **中文字符限制**：不能超过 **4个中文字符**
- **英文字符限制**：不能超过 **7个英文字符**
- **违反限制的后果**：API调用失败，触发 `fail` 回调，用户看到"操作失败"

#### ❌ 错误示例
```javascript
wx.showModal({
  title: '提示',
  content: '请确认操作',
  confirmText: '复制微信号',  // 5个中文字符，超出限制！
  cancelText: '取消操作'     // 4个中文字符，刚好达到限制
})
```

#### ✅ 正确示例
```javascript
wx.showModal({
  title: '提示',
  content: '请确认操作',
  confirmText: '复制',      // 2个中文字符，符合限制
  cancelText: '取消',      // 2个中文字符，符合限制
  success: (res) => {
    if (res.confirm) {
      // 处理确认逻辑
    }
  },
  fail: (error) => {
    console.error('弹窗显示失败:', error);
    // 提供降级处理方案
  }
})
```

#### 常见的超限文本替换方案
| 原文本 | 字符数 | 推荐替换 | 字符数 |
|--------|--------|----------|--------|
| 复制微信号 | 5 | 复制 | 2 |
| 确认删除 | 4 | 删除 | 2 |
| 立即开通 | 4 | 开通 | 2 |
| 重新加载 | 4 | 重试 | 2 |
| 联系客服 | 4 | 联系 | 2 |

### wx.showModal content 限制

- **内容长度限制**：约 **300个字符**（包括中英文和换行符）
- **违反限制的后果**：内容被截断或API调用失败

#### 最佳实践
```javascript
// 检查内容长度
function showModalSafely(title, content, options = {}) {
  // 限制内容长度
  if (content.length > 280) {
    content = content.substring(0, 280) + '...';
  }
  
  // 确保按钮文本符合限制
  const confirmText = (options.confirmText || '确定').substring(0, 4);
  const cancelText = (options.cancelText || '取消').substring(0, 4);
  
  wx.showModal({
    title,
    content,
    confirmText,
    cancelText,
    success: options.success,
    fail: (error) => {
      console.error('弹窗显示失败:', error);
      // 降级处理
      if (options.fallback) {
        options.fallback();
      }
    }
  });
}
```

## 其他API限制

### wx.setNavigationBarTitle

- **标题长度限制**：建议不超过 **10个中文字符**
- **超出处理**：自动截断并添加省略号

```javascript
function setPageTitle(title) {
  if (title.length > 10) {
    title = title.substring(0, 10) + '...';
  }
  wx.setNavigationBarTitle({ title });
}
```

### wx.showToast

- **title 长度限制**：建议不超过 **7个中文字符**
- **显示时长限制**：最长 **10秒**（10000ms）

```javascript
function showToastSafely(title, options = {}) {
  if (title.length > 7) {
    title = title.substring(0, 7);
  }
  
  wx.showToast({
    title,
    icon: options.icon || 'none',
    duration: Math.min(options.duration || 2000, 10000)
  });
}
```

## 开发最佳实践

### 1. 统一的弹窗工具函数

创建统一的工具函数来处理这些限制：

```javascript
// utils/modal-helper.js
const ModalHelper = {
  /**
   * 安全的显示模态框
   */
  showModal(options) {
    const {
      title = '提示',
      content = '',
      confirmText = '确定',
      cancelText = '取消',
      success,
      fail,
      fallback
    } = options;

    // 限制按钮文本长度
    const safeConfirmText = confirmText.substring(0, 4);
    const safeCancelText = cancelText.substring(0, 4);
    
    // 限制内容长度
    const safeContent = content.length > 280 
      ? content.substring(0, 280) + '...' 
      : content;

    wx.showModal({
      title,
      content: safeContent,
      confirmText: safeConfirmText,
      cancelText: safeCancelText,
      success,
      fail: (error) => {
        console.error('弹窗显示失败:', error);
        if (fail) fail(error);
        if (fallback) fallback();
      }
    });
  },

  /**
   * 显示会员提示弹窗
   */
  showMemberModal(wechatId = 'csuzhangleigang') {
    this.showModal({
      title: '解锁完整功能',
      content: `联系我的微信，开始体验完整功能\n\n微信号：${wechatId}`,
      confirmText: '复制',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: wechatId,
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              });
            }
          });
        }
      },
      fallback: () => {
        // 降级处理：直接复制微信号
        wx.setClipboardData({
          data: wechatId,
          success: () => {
            wx.showToast({
              title: `微信号已复制：${wechatId}`,
              icon: 'success',
              duration: 3000
            });
          }
        });
      }
    });
  }
};

module.exports = ModalHelper;
```

### 2. 代码审查检查清单

在代码审查时，检查以下项目：

- [ ] 所有 `wx.showModal` 的 `confirmText` 不超过4个中文字符
- [ ] 所有 `wx.showModal` 的 `cancelText` 不超过4个中文字符  
- [ ] 所有 `wx.showModal` 的 `content` 不超过280个字符
- [ ] 所有 `wx.showModal` 都有 `fail` 回调处理
- [ ] 页面标题不超过10个中文字符
- [ ] Toast 提示不超过7个中文字符

### 3. 常用的安全文本

建立常用按钮文本的标准：

```javascript
// 常用的符合限制的按钮文本
const BUTTON_TEXTS = {
  CONFIRM: '确定',
  CANCEL: '取消', 
  COPY: '复制',
  DELETE: '删除',
  RETRY: '重试',
  CONTACT: '联系',
  OPEN: '开通',
  CLOSE: '关闭',
  OK: '好的',
  BACK: '返回'
};
```

## 历史问题记录

### 已修复的问题实例

1. **知识库详情页面** - `confirmText: '复制微信号'` → `confirmText: '复制'`
2. **个人中心页面** - `confirmText: '复制微信号'` → `confirmText: '复制'`
3. **AI功能页面** - 多个页面的会员提示弹窗按钮文本超限
4. **微信转账页面** - 弹窗内容过长导致显示失败

### 问题影响

- 用户点击按钮后看到"操作失败"提示
- 功能无法正常使用，影响用户体验
- 需要反复修复类似问题，浪费开发时间

## 总结

微信小程序的API限制是硬性规定，必须严格遵守。建议：

1. **使用统一的工具函数**处理弹窗显示
2. **建立代码审查检查清单**，避免遗漏
3. **优先使用简短的按钮文本**，提升用户体验
4. **始终提供降级处理方案**，确保功能可用性

记住：**简洁的文本不仅符合技术限制，也提供更好的用户体验！**