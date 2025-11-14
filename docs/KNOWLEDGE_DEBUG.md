# 知识库页面调试指南

## 问题：点击按钮没反应

### 可能的原因

1. **事件绑定问题**
2. **数据加载失败**
3. **API 服务未启动**
4. **网络请求被拦截**

## 调试步骤

### 1. 检查控制台日志

在微信开发者工具的控制台中查看：

```javascript
// 应该看到以下日志之一：
"从 API 加载成功: {categories: 10, topics: 43}"
// 或
"从本地加载成功"
// 或
"初始化知识库失败: [错误信息]"
```

### 2. 检查数据是否加载

在控制台中输入：

```javascript
// 获取当前页面实例
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];

// 查看数据
console.log('分类数量:', currentPage.data.categories.length);
console.log('题目数量:', currentPage.data.allQuestions.length);
console.log('当前分类:', currentPage.data.activeCategoryKey);
console.log('所有数据:', currentPage.data);
```

### 3. 手动触发事件

在控制台中测试：

```javascript
const pages = getCurrentPages();
const currentPage = pages[pages.length - 1];

// 测试查看详情
currentPage.viewDetail({
  currentTarget: {
    dataset: { index: 0 }
  }
});
```

### 4. 检查 API 服务

```bash
# 测试 API 是否可访问
curl http://localhost:3000/health

# 测试分类接口
curl http://localhost:3000/api/categories

# 测试题目接口
curl "http://localhost:3000/api/questions?page=1&pageSize=5"
```

### 5. 检查配置

查看 `config.js`：

```javascript
{
  knowledgeApiUrl: 'http://localhost:3000/api',
  useLocalKnowledge: false  // 应该是 false
}
```

## 快速修复方案

### 方案 1：使用本地数据（临时）

修改 `config.js`：

```javascript
useLocalKnowledge: true
```

重新编译小程序。

### 方案 2：检查网络设置

1. 打开微信开发者工具
2. 详情 -> 本地设置
3. 确保勾选了 "不校验合法域名"

### 方案 3：重启服务

```bash
# 停止 API 服务
# 在 knowledge-api 目录下
npm start
```

### 方案 4：清除缓存

在小程序中：

```javascript
// 在控制台执行
wx.clearStorage();
```

然后重新编译。

## 常见错误及解决

### 错误 1: "初始化知识库失败"

**原因**: API 服务未启动或无法访问

**解决**:
1. 检查 API 服务是否运行
2. 检查端口是否正确（3000）
3. 检查防火墙设置

### 错误 2: "题目不存在"

**原因**: 数据格式不匹配

**解决**:
1. 检查 `allQuestions` 数组是否有数据
2. 检查 index 是否正确

### 错误 3: 点击无反应

**原因**: 事件绑定问题

**解决**:
1. 检查 WXML 中的 `bindtap="viewDetail"`
2. 检查 `data-index="{{index}}"`
3. 检查 JS 中是否有 `viewDetail` 方法

### 错误 4: 页面空白

**原因**: 数据加载失败

**解决**:
1. 查看控制台错误
2. 检查 `loading` 状态
3. 检查 `error` 信息

## 验证清单

- [ ] API 服务已启动（http://localhost:3000）
- [ ] 配置文件正确（useLocalKnowledge: false）
- [ ] 不校验合法域名已勾选
- [ ] 控制台无错误信息
- [ ] 数据已加载（categories 和 allQuestions 有数据）
- [ ] 按钮事件已绑定（bindtap="viewDetail"）
- [ ] data-index 正确传递

## 测试代码

在 `pages/knowledge/index.js` 的 `onLoad` 中添加调试代码：

```javascript
onLoad() {
    wx.setNavigationBarTitle({ title: '面试知识' });
    
    // 添加调试日志
    console.log('=== 知识库页面加载 ===');
    console.log('配置:', CONFIG);
    console.log('使用 API:', !CONFIG.useLocalKnowledge);
    
    this.initKnowledge();
},
```

在 `viewDetail` 中添加：

```javascript
viewDetail(e) {
    console.log('=== 点击查看详情 ===');
    console.log('事件对象:', e);
    console.log('dataset:', e.currentTarget.dataset);
    
    const { index } = e.currentTarget.dataset;
    console.log('题目索引:', index);
    
    const question = this.data.allQuestions[index];
    console.log('题目数据:', question);
    
    if (!question) {
        console.error('题目不存在:', index);
        wx.showToast({
            title: '题目不存在',
            icon: 'none'
        });
        return;
    }

    console.log('准备跳转到详情页');
    
    wx.navigateTo({
        url: `/pages/knowledge/detail?id=${question.id}&question=${encodeURIComponent(question.question)}`,
        success: () => {
            console.log('跳转成功');
        },
        fail: (err) => {
            console.error('跳转失败:', err);
            wx.showToast({
                title: '跳转失败',
                icon: 'none'
            });
        }
    });
},
```

## 联系支持

如果以上方法都无法解决问题，请提供：

1. 控制台完整日志
2. 配置文件内容
3. API 服务状态
4. 错误截图

---

**更新时间**: 2024-11-14  
**状态**: 调试中
